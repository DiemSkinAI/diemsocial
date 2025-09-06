import { CountertopSegmenter } from './cv/segmentation';
// import type { SegmentationResult } from './cv/segmentation'; // Unused type
import { TextureProcessor } from './cv/textureProcessing';
// import type { ProcessedTexture } from './cv/textureProcessing'; // Unused type
import { GeometryMapper } from './cv/geometryMapping';
// import type { PerspectiveResult } from './cv/geometryMapping'; // Unused type
import { RelightingEngine, LightingComponents, RelightingResult } from './cv/relighting';

export interface TextureReplacementOptions {
  featherRadius?: number; // Edge blending radius
  preserveLighting?: boolean; // Whether to apply original lighting
  outputQuality?: number; // JPEG quality (0-100)
  maxOutputSize?: number; // Maximum output dimension
}

export interface TextureReplacementResult {
  finalImage: Buffer;
  debugImages: {
    originalMask: Buffer;
    processedTexture: Buffer;
    warpedTexture: Buffer;
    lighting: Buffer;
    beforeBlending: Buffer;
  };
  metadata: {
    segmentationConfidence: number;
    perspectiveConfidence: number;
    lightingConfidence: number;
    processingTimeMs: number;
    textureScale: number;
  };
}

export class TextureReplacementEngine {
  private segmenter: CountertopSegmenter;
  private textureProcessor: TextureProcessor;
  private geometryMapper: GeometryMapper;
  private relightingEngine: RelightingEngine;

  constructor() {
    this.segmenter = new CountertopSegmenter();
    this.textureProcessor = new TextureProcessor();
    this.geometryMapper = new GeometryMapper();
    this.relightingEngine = new RelightingEngine();
  }

  async replaceTexture(
    kitchenImageBuffer: Buffer,
    materialSampleBuffer: Buffer,
    options: TextureReplacementOptions = {}
  ): Promise<TextureReplacementResult> {
    
    const startTime = Date.now();
    console.log('Starting deterministic texture replacement pipeline...');

    // Set default options
    const opts = {
      featherRadius: 8,
      preserveLighting: true,
      outputQuality: 90,
      maxOutputSize: 2048,
      ...options
    };

    try {
      // Step 1: Segment the countertop
      console.log('Step 1: Segmenting countertop...');
      const segmentationResult = await this.segmenter.segmentCountertop(kitchenImageBuffer);
      console.log(`Segmentation confidence: ${segmentationResult.confidence.toFixed(2)}`);

      // Step 2: Process the material sample
      console.log('Step 2: Processing material sample...');
      const processedTexture = await this.textureProcessor.processTexture(materialSampleBuffer);
      console.log(`Texture scale detected: ${processedTexture.scale.toFixed(2)}`);

      // Step 3: Detect perspective and compute geometry
      console.log('Step 3: Detecting perspective and computing geometry...');
      const perspectiveResult = await this.geometryMapper.detectCountertopPerspective(
        kitchenImageBuffer, 
        segmentationResult.mask
      );
      console.log(`Perspective confidence: ${perspectiveResult.confidence.toFixed(2)}`);

      // Step 4: Warp texture to match countertop perspective
      console.log('Step 4: Warping texture to match perspective...');
      const { width: kitchenWidth, height: kitchenHeight } = await this.getImageDimensions(kitchenImageBuffer);
      const warpedTexture = await this.geometryMapper.warpTexture(
        processedTexture.tileable,
        perspectiveResult.homography,
        kitchenWidth,
        kitchenHeight
      );

      // Step 5: Extract lighting from original scene
      let lightingComponents: LightingComponents | null = null;
      let relightingResult: RelightingResult | null = null;
      
      if (opts.preserveLighting) {
        console.log('Step 5: Extracting and applying lighting...');
        lightingComponents = await this.relightingEngine.extractLightingComponents(
          kitchenImageBuffer, 
          segmentationResult.mask
        );
        console.log(`Lighting extraction confidence: ${lightingComponents.confidence.toFixed(2)}`);

        // Apply extracted lighting to the warped texture
        relightingResult = await this.relightingEngine.applyLightingToTexture(
          warpedTexture,
          lightingComponents,
          kitchenWidth,
          kitchenHeight
        );
      }

      // Step 6: Create feathered mask for smooth blending
      console.log('Step 6: Creating feathered mask...');
      const featheredMask = await this.relightingEngine.createFeatheredMask(
        segmentationResult.mask,
        kitchenWidth,
        kitchenHeight,
        opts.featherRadius
      );

      // Step 7: Blend the texture with the original image
      console.log('Step 7: Performing seamless blending...');
      const textureToBlend = relightingResult ? relightingResult.relitTexture : warpedTexture;
      const finalResult = await this.relightingEngine.blendSeamlessly(
        kitchenImageBuffer,
        textureToBlend,
        featheredMask,
        kitchenWidth,
        kitchenHeight
      );

      // Step 8: Generate debug images
      console.log('Step 8: Generating debug visualizations...');
      const debugImages = await this.generateDebugImages({
        originalMask: segmentationResult.mask,
        processedTexture: processedTexture.tileable,
        warpedTexture,
        lighting: relightingResult?.preservedShading || Buffer.alloc(0),
        beforeBlending: textureToBlend,
        kitchenWidth,
        kitchenHeight
      });

      const processingTime = Date.now() - startTime;
      console.log(`Pipeline completed in ${processingTime}ms`);

      return {
        finalImage: finalResult,
        debugImages,
        metadata: {
          segmentationConfidence: segmentationResult.confidence,
          perspectiveConfidence: perspectiveResult.confidence,
          lightingConfidence: lightingComponents?.confidence || 0,
          processingTimeMs: processingTime,
          textureScale: processedTexture.scale
        }
      };

    } catch (error) {
      console.error('Texture replacement pipeline failed:', error);
      throw new Error(`Texture replacement failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async getImageDimensions(imageBuffer: Buffer): Promise<{ width: number; height: number }> {
    const Jimp = await import('jimp');
    const image = await Jimp.read(imageBuffer);
    return { width: image.bitmap.width, height: image.bitmap.height };
  }

  private async generateDebugImages(params: {
    originalMask: Uint8Array;
    processedTexture: Buffer;
    warpedTexture: Buffer;
    lighting: Buffer;
    beforeBlending: Buffer;
    kitchenWidth: number;
    kitchenHeight: number;
  }): Promise<TextureReplacementResult['debugImages']> {
    
    const Jimp = await import('jimp');
    
    // Create mask visualization
    const maskViz = new Jimp.Jimp(params.kitchenWidth, params.kitchenHeight);
    for (let i = 0; i < params.originalMask.length; i++) {
      const y = Math.floor(i / params.kitchenWidth);
      const x = i % params.kitchenWidth;
      const intensity = params.originalMask[i];
      const color = (intensity << 24) | (intensity << 16) | (intensity << 8) | 255;
      maskViz.setPixelColor(color, x, y);
    }

    return {
      originalMask: await maskViz.getBufferAsync(Jimp.MIME_JPEG),
      processedTexture: params.processedTexture,
      warpedTexture: params.warpedTexture,
      lighting: params.lighting,
      beforeBlending: params.beforeBlending
    };
  }

  // Utility method for batch processing multiple images
  async batchReplaceTextures(
    kitchenImages: Buffer[],
    materialSample: Buffer,
    options: TextureReplacementOptions = {}
  ): Promise<TextureReplacementResult[]> {
    
    console.log(`Starting batch processing of ${kitchenImages.length} images...`);
    
    // Process material sample once for all images
    // const processedTexture = await this.textureProcessor.processTexture(materialSample); // Unused variable
    
    const results: TextureReplacementResult[] = [];
    
    for (let i = 0; i < kitchenImages.length; i++) {
      console.log(`Processing image ${i + 1}/${kitchenImages.length}...`);
      
      try {
        const result = await this.replaceTexture(kitchenImages[i], materialSample, options);
        results.push(result);
      } catch (error) {
        console.error(`Failed to process image ${i + 1}:`, error);
        // Continue with other images instead of failing entirely
      }
    }
    
    console.log(`Batch processing completed. Successfully processed ${results.length}/${kitchenImages.length} images.`);
    return results;
  }

  // Quality assessment for the replacement result
  async assessReplacementQuality(result: TextureReplacementResult): Promise<{
    overallScore: number;
    breakdown: {
      segmentation: number;
      perspective: number;
      lighting: number;
      blending: number;
    };
    recommendations: string[];
  }> {
    
    const { metadata } = result;
    const recommendations: string[] = [];
    
    // Assess individual components
    const segmentationScore = metadata.segmentationConfidence;
    if (segmentationScore < 0.7) {
      recommendations.push('Low segmentation quality detected. Consider using a clearer kitchen image with visible countertops.');
    }
    
    const perspectiveScore = metadata.perspectiveConfidence;
    if (perspectiveScore < 0.6) {
      recommendations.push('Perspective detection struggled. Try using an image with more defined countertop edges.');
    }
    
    const lightingScore = metadata.lightingConfidence;
    if (lightingScore < 0.5) {
      recommendations.push('Lighting extraction quality is low. The result may look less realistic.');
    }
    
    // Estimate blending quality based on processing time and other factors
    const blendingScore = Math.min(1.0, 0.8 + (metadata.processingTimeMs < 10000 ? 0.2 : 0));
    
    const overallScore = (segmentationScore * 0.3 + perspectiveScore * 0.3 + lightingScore * 0.2 + blendingScore * 0.2);
    
    if (overallScore < 0.6) {
      recommendations.push('Overall quality is below optimal. Consider using higher quality input images.');
    }
    
    return {
      overallScore,
      breakdown: {
        segmentation: segmentationScore,
        perspective: perspectiveScore,
        lighting: lightingScore,
        blending: blendingScore
      },
      recommendations
    };
  }

  // Performance optimization methods
  async optimizeForSpeed(enable: boolean = true): Promise<void> {
    // Configure components for faster processing at the cost of some quality
    if (enable) {
      console.log('Optimizing pipeline for speed...');
      // Implementation would configure lower quality settings across all components
    }
  }

  async optimizeForQuality(enable: boolean = true): Promise<void> {
    // Configure components for highest quality processing
    if (enable) {
      console.log('Optimizing pipeline for quality...');
      // Implementation would configure higher quality settings across all components
    }
  }
}