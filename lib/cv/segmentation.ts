import { HfInference } from '@huggingface/inference';
import * as Jimp from 'jimp';

export interface SegmentationResult {
  mask: Uint8Array;
  confidence: number;
  boundingBox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export class CountertopSegmenter {
  private hf: HfInference;

  constructor(apiToken?: string) {
    this.hf = new HfInference(apiToken || process.env.HUGGINGFACE_API_TOKEN);
  }

  async segmentCountertop(imageBuffer: Buffer): Promise<SegmentationResult> {
    try {
      // First, try SAM-based segmentation via HuggingFace
      const samResult = await this.segmentWithSAM(imageBuffer);
      if (samResult) {
        return samResult;
      }
    } catch (error) {
      console.warn('SAM segmentation failed, falling back to edge detection:', error);
    }

    // Fallback to edge detection + flood fill
    return await this.segmentWithEdgeDetection(imageBuffer);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private async segmentWithSAM(imageBuffer: Buffer): Promise<SegmentationResult | null> {
    try {
      // Skip SAM for now due to API complexity - use edge detection instead
      console.warn('SAM segmentation skipped, using edge detection fallback');
      return null;
    } catch (error) {
      console.error('SAM segmentation error:', error);
      return null;
    }
  }

  private async segmentWithEdgeDetection(imageBuffer: Buffer): Promise<SegmentationResult> {
    const image = await Jimp.read(imageBuffer);
    const { width, height } = image.bitmap;
    
    // Convert to grayscale for edge detection
    const gray = image.clone().grayscale();
    
    // Apply Sobel edge detection
    const edges = this.applySobelFilter(gray);
    
    // Find countertop region using heuristics
    const mask = this.findCountertopRegion(edges, width, height);
    
    return {
      mask,
      confidence: 0.8, // Heuristic confidence
      boundingBox: this.calculateBoundingBox(mask, width, height)
    };
  }

  private applySobelFilter(image: Jimp): Uint8Array {
    const { width, height, data } = image.bitmap;
    const edges = new Uint8Array(width * height);
    
    // Sobel kernels
    const sobelX = [-1, 0, 1, -2, 0, 2, -1, 0, 1];
    const sobelY = [-1, -2, -1, 0, 0, 0, 1, 2, 1];
    
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        let gx = 0, gy = 0;
        
        for (let i = 0; i < 9; i++) {
          const ix = x + (i % 3) - 1;
          const iy = y + Math.floor(i / 3) - 1;
          const pixelIndex = (iy * width + ix) * 4;
          const intensity = data[pixelIndex]; // Red channel (grayscale)
          
          gx += intensity * sobelX[i];
          gy += intensity * sobelY[i];
        }
        
        const magnitude = Math.sqrt(gx * gx + gy * gy);
        edges[y * width + x] = Math.min(255, magnitude);
      }
    }
    
    return edges;
  }

  private findCountertopRegion(edges: Uint8Array, width: number, height: number): Uint8Array {
    const mask = new Uint8Array(width * height);
    
    // Heuristic: Look for horizontal edges in the middle-bottom area of the image
    // This is where countertops typically appear
    const searchStartY = Math.floor(height * 0.3);
    const searchEndY = Math.floor(height * 0.8);
    
    // Find strong horizontal edges
    const threshold = 50;
    for (let y = searchStartY; y < searchEndY; y++) {
      for (let x = 0; x < width; x++) {
        const edgeStrength = edges[y * width + x];
        if (edgeStrength > threshold) {
          // Found an edge, perform flood fill to find the region
          this.floodFill(mask, x, y, width, height, edges, threshold);
        }
      }
    }
    
    return mask;
  }

  private floodFill(mask: Uint8Array, startX: number, startY: number, width: number, height: number, edges: Uint8Array, threshold: number) {
    const stack = [[startX, startY]];
    const visited = new Set<string>();
    
    while (stack.length > 0) {
      const [x, y] = stack.pop()!;
      const key = `${x},${y}`;
      
      if (visited.has(key) || x < 0 || x >= width || y < 0 || y >= height) {
        continue;
      }
      
      visited.add(key);
      const index = y * width + x;
      
      if (edges[index] < threshold) {
        mask[index] = 255; // Mark as countertop region
        
        // Add neighbors
        stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
      }
    }
  }

  private calculateBoundingBox(mask: Uint8Array, width: number, height: number): { x: number; y: number; width: number; height: number } {
    let minX = width, minY = height, maxX = 0, maxY = 0;
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (mask[y * width + x] > 0) {
          minX = Math.min(minX, x);
          minY = Math.min(minY, y);
          maxX = Math.max(maxX, x);
          maxY = Math.max(maxY, y);
        }
      }
    }
    
    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY
    };
  }
}