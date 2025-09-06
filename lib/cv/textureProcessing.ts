import * as Jimp from 'jimp';
// import sharp from 'sharp'; // Unused import

export interface ProcessedTexture {
  albedo: Buffer; // Lighting-normalized texture
  tileable: Buffer; // Seamlessly tileable version
  scale: number; // Detected material scale
  metadata: {
    originalSize: { width: number; height: number };
    tileSize: { width: number; height: number };
    dominantColors: number[];
  };
}

export class TextureProcessor {
  
  async processTexture(materialBuffer: Buffer): Promise<ProcessedTexture> {
    const image = await Jimp.read(materialBuffer);
    const { width, height } = image.bitmap;
    
    // Step 1: Normalize lighting using Retinex algorithm
    const albedo = await this.retinexNormalization(image);
    
    // Step 2: Create seamlessly tileable texture
    const tileable = await this.makeSeamlessTileable(albedo);
    
    // Step 3: Detect material scale and properties
    const scale = this.detectMaterialScale(image);
    const dominantColors = this.extractDominantColors(image);
    
    return {
      albedo: await albedo.getBufferAsync(Jimp.MIME_JPEG),
      tileable: await tileable.getBufferAsync(Jimp.MIME_JPEG),
      scale,
      metadata: {
        originalSize: { width, height },
        tileSize: { width: tileable.bitmap.width, height: tileable.bitmap.height },
        dominantColors
      }
    };
  }

  private async retinexNormalization(image: Jimp): Promise<Jimp> {
    // Implement Single-Scale Retinex (SSR) for lighting normalization
    const { width, height, data } = image.bitmap;
    const result = image.clone();
    const resultData = result.bitmap.data;
    
    // Gaussian kernel for smoothing (simulates illumination)
    const sigma = Math.min(width, height) / 3; // Adaptive sigma
    const kernelRadius = Math.ceil(sigma * 3);
    const kernel = this.createGaussianKernel(kernelRadius, sigma);
    
    // Apply Retinex for each color channel
    for (let channel = 0; channel < 3; channel++) {
      // Extract channel data
      const channelData = new Float32Array(width * height);
      for (let i = 0; i < width * height; i++) {
        channelData[i] = Math.log(Math.max(1, data[i * 4 + channel]));
      }
      
      // Apply Gaussian blur to estimate illumination
      const illumination = this.applyGaussianBlur(channelData, width, height, kernel, kernelRadius);
      
      // Compute reflectance (albedo)
      for (let i = 0; i < width * height; i++) {
        const reflectance = channelData[i] - illumination[i];
        // Normalize and convert back to 0-255 range
        const normalized = Math.exp(reflectance);
        resultData[i * 4 + channel] = Math.max(0, Math.min(255, normalized * 128));
      }
    }
    
    return result;
  }

  private createGaussianKernel(radius: number, sigma: number): Float32Array {
    const size = radius * 2 + 1;
    const kernel = new Float32Array(size * size);
    let sum = 0;
    
    for (let y = -radius; y <= radius; y++) {
      for (let x = -radius; x <= radius; x++) {
        const value = Math.exp(-(x * x + y * y) / (2 * sigma * sigma));
        kernel[(y + radius) * size + (x + radius)] = value;
        sum += value;
      }
    }
    
    // Normalize kernel
    for (let i = 0; i < kernel.length; i++) {
      kernel[i] /= sum;
    }
    
    return kernel;
  }

  private applyGaussianBlur(data: Float32Array, width: number, height: number, kernel: Float32Array, radius: number): Float32Array {
    const result = new Float32Array(width * height);
    const kernelSize = radius * 2 + 1;
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        let sum = 0;
        
        for (let ky = -radius; ky <= radius; ky++) {
          for (let kx = -radius; kx <= radius; kx++) {
            const px = Math.max(0, Math.min(width - 1, x + kx));
            const py = Math.max(0, Math.min(height - 1, y + ky));
            const kernelValue = kernel[(ky + radius) * kernelSize + (kx + radius)];
            sum += data[py * width + px] * kernelValue;
          }
        }
        
        result[y * width + x] = sum;
      }
    }
    
    return result;
  }

  private async makeSeamlessTileable(image: Jimp.Jimp): Promise<Jimp.Jimp> {
    const { width, height } = image.bitmap;
    
    // Determine optimal tile size (power of 2 for better tiling)
    const tileSize = this.calculateOptimalTileSize(width, height);
    
    // Resize to tile size if needed
    let workingImage = image;
    if (width !== tileSize || height !== tileSize) {
      workingImage = image.clone().resize(tileSize, tileSize);
    }
    
    // Apply seamless tiling using edge blending
    const seamless = await this.applyEdgeBlending(workingImage);
    
    return seamless;
  }

  private calculateOptimalTileSize(width: number, height: number): number {
    const minSize = Math.min(width, height);
    // const maxSize = Math.max(width, height); // Unused variable
    
    // Find the largest power of 2 that's <= minSize but >= 256
    let tileSize = 256;
    while (tileSize * 2 <= minSize && tileSize < 1024) {
      tileSize *= 2;
    }
    
    return tileSize;
  }

  private async applyEdgeBlending(image: Jimp): Promise<Jimp> {
    const { width, height, data } = image.bitmap;
    const result = image.clone();
    const resultData = result.bitmap.data;
    
    // Blend opposite edges to make seamlessly tileable
    const blendWidth = Math.floor(width * 0.1); // 10% blend zone
    const blendHeight = Math.floor(height * 0.1);
    
    // Horizontal blending (left-right edges)
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < blendWidth; x++) {
        const alpha = x / blendWidth;
        const leftIndex = (y * width + x) * 4;
        const rightIndex = (y * width + (width - blendWidth + x)) * 4;
        
        for (let c = 0; c < 3; c++) {
          const leftValue = data[leftIndex + c];
          const rightValue = data[rightIndex + c];
          const blended = leftValue * alpha + rightValue * (1 - alpha);
          
          resultData[leftIndex + c] = blended;
          resultData[rightIndex + c] = blended;
        }
      }
    }
    
    // Vertical blending (top-bottom edges)
    for (let y = 0; y < blendHeight; y++) {
      for (let x = 0; x < width; x++) {
        const alpha = y / blendHeight;
        const topIndex = (y * width + x) * 4;
        const bottomIndex = ((height - blendHeight + y) * width + x) * 4;
        
        for (let c = 0; c < 3; c++) {
          const topValue = data[topIndex + c];
          const bottomValue = data[bottomIndex + c];
          const blended = topValue * alpha + bottomValue * (1 - alpha);
          
          resultData[topIndex + c] = blended;
          resultData[bottomIndex + c] = blended;
        }
      }
    }
    
    return result;
  }

  private detectMaterialScale(image: Jimp): number {
    // Analyze texture frequency to estimate material scale
    const { width, height } = image.bitmap;
    const gray = image.clone().grayscale();
    
    // Apply edge detection to find texture patterns
    const edges = this.applySobelEdgeDetection(gray);
    
    // Analyze frequency of patterns to estimate scale
    const averageEdgeDistance = this.calculateAverageFeatureDistance(edges, width, height);
    
    // Convert to material scale (pixels per real-world unit)
    // This is a heuristic - in reality, you'd need calibration data
    return Math.max(0.1, Math.min(10, averageEdgeDistance / 50));
  }

  private applySobelEdgeDetection(image: Jimp): Uint8Array {
    const { width, height, data } = image.bitmap;
    const edges = new Uint8Array(width * height);
    
    const sobelX = [-1, 0, 1, -2, 0, 2, -1, 0, 1];
    const sobelY = [-1, -2, -1, 0, 0, 0, 1, 2, 1];
    
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        let gx = 0, gy = 0;
        
        for (let i = 0; i < 9; i++) {
          const ix = x + (i % 3) - 1;
          const iy = y + Math.floor(i / 3) - 1;
          const pixelIndex = (iy * width + ix) * 4;
          const intensity = data[pixelIndex];
          
          gx += intensity * sobelX[i];
          gy += intensity * sobelY[i];
        }
        
        const magnitude = Math.sqrt(gx * gx + gy * gy);
        edges[y * width + x] = Math.min(255, magnitude);
      }
    }
    
    return edges;
  }

  private calculateAverageFeatureDistance(edges: Uint8Array, width: number, height: number): number {
    const threshold = 50;
    const features: Array<{x: number, y: number}> = [];
    
    // Find edge pixels
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (edges[y * width + x] > threshold) {
          features.push({x, y});
        }
      }
    }
    
    if (features.length < 2) return 50; // Default value
    
    // Calculate average distance between features
    let totalDistance = 0;
    let pairCount = 0;
    
    for (let i = 0; i < Math.min(features.length, 100); i++) {
      for (let j = i + 1; j < Math.min(features.length, 100); j++) {
        const dx = features[i].x - features[j].x;
        const dy = features[i].y - features[j].y;
        totalDistance += Math.sqrt(dx * dx + dy * dy);
        pairCount++;
      }
    }
    
    return pairCount > 0 ? totalDistance / pairCount : 50;
  }

  private extractDominantColors(image: Jimp): number[] {
    const { width, height, data } = image.bitmap;
    const colorMap = new Map<string, number>();
    
    // Sample colors from the image
    const sampleRate = Math.max(1, Math.floor(width * height / 10000)); // Sample ~10k pixels
    
    for (let i = 0; i < data.length; i += sampleRate * 4) {
      const r = Math.floor(data[i] / 16) * 16; // Quantize to reduce color space
      const g = Math.floor(data[i + 1] / 16) * 16;
      const b = Math.floor(data[i + 2] / 16) * 16;
      const colorKey = `${r},${g},${b}`;
      
      colorMap.set(colorKey, (colorMap.get(colorKey) || 0) + 1);
    }
    
    // Get top 5 dominant colors
    const sortedColors = Array.from(colorMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([color]) => {
        const [r, g, b] = color.split(',').map(Number);
        return (r << 16) | (g << 8) | b;
      });
    
    return sortedColors;
  }
}