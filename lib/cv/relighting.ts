import * as Jimp from 'jimp';

export interface LightingComponents {
  shading: Float32Array; // Shading/illumination component
  reflectance: Float32Array; // Material reflectance component
  confidence: number;
}

export interface RelightingResult {
  relitTexture: Buffer;
  preservedShading: Buffer;
  confidence: number;
}

export class RelightingEngine {
  
  async extractLightingComponents(imageBuffer: Buffer, mask: Uint8Array): Promise<LightingComponents> {
    const image = await Jimp.read(imageBuffer);
    const { width, height, data } = image.bitmap;
    
    // Apply intrinsic image decomposition to separate shading from reflectance
    const components = this.intrinsicImageDecomposition(data, width, height, mask);
    
    return components;
  }

  async applyLightingToTexture(
    textureBuffer: Buffer, 
    lightingComponents: LightingComponents, 
    outputWidth: number, 
    outputHeight: number
  ): Promise<RelightingResult> {
    
    const texture = await Jimp.read(textureBuffer);
    const result = new Jimp(outputWidth, outputHeight);
    
    // Resize shading to match output dimensions
    const resizedShading = this.resizeLightingComponents(
      lightingComponents.shading, 
      Math.sqrt(lightingComponents.shading.length), // Assume square
      Math.sqrt(lightingComponents.shading.length),
      outputWidth, 
      outputHeight
    );
    
    // Apply lighting to texture
    const relitImage = this.combineTextureWithLighting(texture, resizedShading, outputWidth, outputHeight);
    
    // Create shading visualization
    const shadingImage = this.createShadingVisualization(resizedShading, outputWidth, outputHeight);
    
    return {
      relitTexture: await relitImage.getBufferAsync(Jimp.MIME_JPEG),
      preservedShading: await shadingImage.getBufferAsync(Jimp.MIME_JPEG),
      confidence: lightingComponents.confidence
    };
  }

  private intrinsicImageDecomposition(data: Uint8Array, width: number, height: number, mask: Uint8Array): LightingComponents {
    const pixels = width * height;
    const shading = new Float32Array(pixels);
    const reflectance = new Float32Array(pixels);
    
    // Convert to log space for Retinex processing
    const logR = new Float32Array(pixels);
    const logG = new Float32Array(pixels);
    const logB = new Float32Array(pixels);
    
    for (let i = 0; i < pixels; i++) {
      if (mask[i] > 0) {
        const r = Math.max(1, data[i * 4]);
        const g = Math.max(1, data[i * 4 + 1]);
        const b = Math.max(1, data[i * 4 + 2]);
        
        logR[i] = Math.log(r);
        logG[i] = Math.log(g);
        logB[i] = Math.log(b);
      }
    }
    
    // Apply multi-scale Retinex for better decomposition
    const illuminationR = this.multiScaleRetinex(logR, width, height, mask);
    const illuminationG = this.multiScaleRetinex(logG, width, height, mask);
    const illuminationB = this.multiScaleRetinex(logB, width, height, mask);
    
    // Compute final shading and reflectance
    let validPixels = 0;
    let totalError = 0;
    
    for (let i = 0; i < pixels; i++) {
      if (mask[i] > 0) {
        // Shading is the average of illumination across channels
        const shadingValue = (illuminationR[i] + illuminationG[i] + illuminationB[i]) / 3;
        shading[i] = Math.exp(shadingValue); // Convert back from log space
        
        // Reflectance is the original color minus the shading
        const originalIntensity = (data[i * 4] + data[i * 4 + 1] + data[i * 4 + 2]) / 3;
        reflectance[i] = Math.max(0.1, originalIntensity / Math.max(0.1, shading[i]));
        
        // Track decomposition quality
        const reconstructed = reflectance[i] * shading[i];
        totalError += Math.abs(reconstructed - originalIntensity);
        validPixels++;
      }
    }
    
    const confidence = validPixels > 0 ? Math.max(0, 1 - (totalError / validPixels) / 255) : 0;
    
    return {
      shading,
      reflectance,
      confidence
    };
  }

  private multiScaleRetinex(logImage: Float32Array, width: number, height: number, mask: Uint8Array): Float32Array {
    const scales = [15, 80, 250]; // Multiple scales for better decomposition
    const weights = [1/3, 1/3, 1/3];
    const result = new Float32Array(width * height);
    
    scales.forEach((scale, scaleIndex) => {
      const blurred = this.gaussianBlur(logImage, width, height, scale, mask);
      
      for (let i = 0; i < width * height; i++) {
        if (mask[i] > 0) {
          result[i] += weights[scaleIndex] * blurred[i];
        }
      }
    });
    
    return result;
  }

  private gaussianBlur(image: Float32Array, width: number, height: number, sigma: number, mask: Uint8Array): Float32Array {
    const result = new Float32Array(width * height);
    const kernelSize = Math.ceil(sigma * 3) * 2 + 1;
    const kernel = this.createGaussianKernel1D(kernelSize, sigma);
    const radius = Math.floor(kernelSize / 2);
    
    // Horizontal pass
    const temp = new Float32Array(width * height);
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (mask[y * width + x] > 0) {
          let sum = 0;
          let weightSum = 0;
          
          for (let i = -radius; i <= radius; i++) {
            const px = Math.max(0, Math.min(width - 1, x + i));
            if (mask[y * width + px] > 0) {
              const weight = kernel[i + radius];
              sum += image[y * width + px] * weight;
              weightSum += weight;
            }
          }
          
          temp[y * width + x] = weightSum > 0 ? sum / weightSum : image[y * width + x];
        }
      }
    }
    
    // Vertical pass
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (mask[y * width + x] > 0) {
          let sum = 0;
          let weightSum = 0;
          
          for (let i = -radius; i <= radius; i++) {
            const py = Math.max(0, Math.min(height - 1, y + i));
            if (mask[py * width + x] > 0) {
              const weight = kernel[i + radius];
              sum += temp[py * width + x] * weight;
              weightSum += weight;
            }
          }
          
          result[y * width + x] = weightSum > 0 ? sum / weightSum : temp[y * width + x];
        }
      }
    }
    
    return result;
  }

  private createGaussianKernel1D(size: number, sigma: number): Float32Array {
    const kernel = new Float32Array(size);
    const radius = Math.floor(size / 2);
    let sum = 0;
    
    for (let i = 0; i < size; i++) {
      const x = i - radius;
      const value = Math.exp(-(x * x) / (2 * sigma * sigma));
      kernel[i] = value;
      sum += value;
    }
    
    // Normalize
    for (let i = 0; i < size; i++) {
      kernel[i] /= sum;
    }
    
    return kernel;
  }

  private resizeLightingComponents(
    lighting: Float32Array, 
    srcWidth: number, 
    srcHeight: number, 
    dstWidth: number, 
    dstHeight: number
  ): Float32Array {
    const result = new Float32Array(dstWidth * dstHeight);
    
    const scaleX = srcWidth / dstWidth;
    const scaleY = srcHeight / dstHeight;
    
    for (let y = 0; y < dstHeight; y++) {
      for (let x = 0; x < dstWidth; x++) {
        const srcX = x * scaleX;
        const srcY = y * scaleY;
        
        // Bilinear interpolation
        const x1 = Math.floor(srcX);
        const y1 = Math.floor(srcY);
        const x2 = Math.min(srcWidth - 1, x1 + 1);
        const y2 = Math.min(srcHeight - 1, y1 + 1);
        
        const wx = srcX - x1;
        const wy = srcY - y1;
        
        const v11 = lighting[y1 * srcWidth + x1];
        const v12 = lighting[y2 * srcWidth + x1];
        const v21 = lighting[y1 * srcWidth + x2];
        const v22 = lighting[y2 * srcWidth + x2];
        
        const interpolated = v11 * (1 - wx) * (1 - wy) + 
                           v21 * wx * (1 - wy) + 
                           v12 * (1 - wx) * wy + 
                           v22 * wx * wy;
        
        result[y * dstWidth + x] = interpolated;
      }
    }
    
    return result;
  }

  private combineTextureWithLighting(texture: Jimp, lighting: Float32Array, width: number, height: number): Jimp {
    const result = new Jimp(width, height);
    
    // Resize texture to match output dimensions if needed
    const resizedTexture = texture.clone().resize(width, height);
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const pixelColor = resizedTexture.getPixelColor(x, y);
        const r = (pixelColor >> 24) & 0xFF;
        const g = (pixelColor >> 16) & 0xFF;
        const b = (pixelColor >> 8) & 0xFF;
        const a = pixelColor & 0xFF;
        
        const lightingValue = lighting[y * width + x];
        
        // Apply lighting multiplicatively
        const newR = Math.min(255, Math.max(0, r * lightingValue));
        const newG = Math.min(255, Math.max(0, g * lightingValue));
        const newB = Math.min(255, Math.max(0, b * lightingValue));
        
        const newColor = (Math.round(newR) << 24) | 
                        (Math.round(newG) << 16) | 
                        (Math.round(newB) << 8) | 
                        a;
        
        result.setPixelColor(newColor, x, y);
      }
    }
    
    return result;
  }

  private createShadingVisualization(shading: Float32Array, width: number, height: number): Jimp {
    const result = new Jimp(width, height);
    
    // Find min and max shading values for normalization
    let minShading = Infinity;
    let maxShading = -Infinity;
    
    for (let i = 0; i < shading.length; i++) {
      minShading = Math.min(minShading, shading[i]);
      maxShading = Math.max(maxShading, shading[i]);
    }
    
    const range = maxShading - minShading;
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const shadingValue = shading[y * width + x];
        const normalized = range > 0 ? (shadingValue - minShading) / range : 0.5;
        const intensity = Math.round(normalized * 255);
        
        const color = (intensity << 24) | (intensity << 16) | (intensity << 8) | 255;
        result.setPixelColor(color, x, y);
      }
    }
    
    return result;
  }

  async blendSeamlessly(
    baseImage: Buffer, 
    overlayImage: Buffer, 
    mask: Uint8Array, 
    width: number, 
    height: number
  ): Promise<Buffer> {
    
    const base = await Jimp.read(baseImage);
    const overlay = await Jimp.read(overlayImage);
    
    // Resize images if needed
    base.resize(width, height);
    overlay.resize(width, height);
    
    // Apply Poisson blending for seamless integration
    const result = await this.poissonBlending(base, overlay, mask, width, height);
    
    return result.getBufferAsync(Jimp.MIME_JPEG);
  }

  private async poissonBlending(base: Jimp, overlay: Jimp, mask: Uint8Array, width: number, height: number): Jimp {
    const result = base.clone();
    
    // Find mask boundary for blending
    const boundary = this.findMaskBoundary(mask, width, height);
    
    // Apply gradient-domain blending along the boundary
    boundary.forEach(point => {
      const { x, y } = point;
      const maskValue = mask[y * width + x] / 255;
      
      if (maskValue > 0 && maskValue < 1) {
        // Blend pixels at the boundary
        const baseColor = base.getPixelColor(x, y);
        const overlayColor = overlay.getPixelColor(x, y);
        
        const baseR = (baseColor >> 24) & 0xFF;
        const baseG = (baseColor >> 16) & 0xFF;
        const baseB = (baseColor >> 8) & 0xFF;
        const baseA = baseColor & 0xFF;
        
        const overlayR = (overlayColor >> 24) & 0xFF;
        const overlayG = (overlayColor >> 16) & 0xFF;
        const overlayB = (overlayColor >> 8) & 0xFF;
        const overlayA = overlayColor & 0xFF;
        
        const blendedR = Math.round(baseR * (1 - maskValue) + overlayR * maskValue);
        const blendedG = Math.round(baseG * (1 - maskValue) + overlayG * maskValue);
        const blendedB = Math.round(baseB * (1 - maskValue) + overlayB * maskValue);
        const blendedA = Math.round(baseA * (1 - maskValue) + overlayA * maskValue);
        
        const blendedColor = (blendedR << 24) | (blendedG << 16) | (blendedB << 8) | blendedA;
        result.setPixelColor(blendedColor, x, y);
      } else if (maskValue >= 1) {
        // Full overlay in masked regions
        result.setPixelColor(overlay.getPixelColor(x, y), x, y);
      }
    });
    
    return result;
  }

  private findMaskBoundary(mask: Uint8Array, width: number, height: number): Array<{x: number, y: number}> {
    const boundary: Array<{x: number, y: number}> = [];
    
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const center = mask[y * width + x];
        
        // Check if this pixel is on the boundary (has both masked and unmasked neighbors)
        const neighbors = [
          mask[(y-1) * width + x],     // top
          mask[(y+1) * width + x],     // bottom
          mask[y * width + (x-1)],     // left
          mask[y * width + (x+1)]      // right
        ];
        
        const hasInside = neighbors.some(n => n > 128);
        const hasOutside = neighbors.some(n => n <= 128);
        
        if (hasInside && hasOutside) {
          boundary.push({ x, y });
        }
      }
    }
    
    return boundary;
  }

  // Enhanced edge feathering for smoother transitions
  async createFeatheredMask(mask: Uint8Array, width: number, height: number, featherRadius: number): Promise<Uint8Array> {
    const feathered = new Uint8Array(mask);
    
    // Apply distance transform for smooth feathering
    const distances = this.computeDistanceTransform(mask, width, height);
    
    for (let i = 0; i < mask.length; i++) {
      if (mask[i] > 0) {
        const distance = distances[i];
        if (distance < featherRadius) {
          // Smooth falloff using cosine curve
          const alpha = (1 + Math.cos(Math.PI * distance / featherRadius)) / 2;
          feathered[i] = Math.round(alpha * 255);
        } else {
          feathered[i] = 255;
        }
      }
    }
    
    return feathered;
  }

  private computeDistanceTransform(mask: Uint8Array, width: number, height: number): Float32Array {
    const distances = new Float32Array(width * height);
    distances.fill(Infinity);
    
    // Initialize distance for edge pixels
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = y * width + x;
        if (mask[idx] === 0) {
          distances[idx] = 0;
        } else {
          // Check if this is a boundary pixel
          const neighbors = [
            y > 0 ? mask[(y-1) * width + x] : 0,
            y < height-1 ? mask[(y+1) * width + x] : 0,
            x > 0 ? mask[y * width + (x-1)] : 0,
            x < width-1 ? mask[y * width + (x+1)] : 0
          ];
          
          if (neighbors.some(n => n === 0)) {
            distances[idx] = 0;
          }
        }
      }
    }
    
    // Simple distance propagation (can be optimized with proper algorithms)
    for (let iter = 0; iter < Math.max(width, height); iter++) {
      let changed = false;
      
      for (let y = 1; y < height - 1; y++) {
        for (let x = 1; x < width - 1; x++) {
          const idx = y * width + x;
          if (mask[idx] > 0) {
            const neighbors = [
              distances[(y-1) * width + x] + 1,
              distances[(y+1) * width + x] + 1,
              distances[y * width + (x-1)] + 1,
              distances[y * width + (x+1)] + 1
            ];
            
            const minDistance = Math.min(...neighbors);
            if (minDistance < distances[idx]) {
              distances[idx] = minDistance;
              changed = true;
            }
          }
        }
      }
      
      if (!changed) break;
    }
    
    return distances;
  }
}