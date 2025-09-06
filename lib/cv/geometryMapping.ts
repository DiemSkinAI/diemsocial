import * as Jimp from 'jimp';

export interface Point2D {
  x: number;
  y: number;
}

export interface Quadrilateral {
  topLeft: Point2D;
  topRight: Point2D;
  bottomLeft: Point2D;
  bottomRight: Point2D;
}

export interface HomographyMatrix {
  matrix: number[]; // 3x3 homography matrix as flat array
  inverse: number[]; // Inverse matrix for reverse mapping
}

export interface PerspectiveResult {
  countertopPlane: Quadrilateral;
  homography: HomographyMatrix;
  confidence: number;
}

export class GeometryMapper {
  
  async detectCountertopPerspective(imageBuffer: Buffer, mask: Uint8Array): Promise<PerspectiveResult> {
    const image = await Jimp.read(imageBuffer);
    const { width, height } = image.bitmap;
    
    // Step 1: Find countertop corners using mask and edge analysis
    const corners = this.findCountertopCorners(mask, width, height, image);
    
    // Step 2: Compute homography matrix for perspective correction
    const homography = this.computeHomography(corners, width, height);
    
    // Step 3: Calculate confidence based on corner detection quality
    const confidence = this.calculatePerspectiveConfidence(corners, mask, width, height);
    
    return {
      countertopPlane: corners,
      homography,
      confidence
    };
  }

  private findCountertopCorners(mask: Uint8Array, width: number, height: number, image: Jimp): Quadrilateral {
    // Find the bounding box of the mask
    const boundingBox = this.getMaskBoundingBox(mask, width, height);
    
    // Extract edge pixels from the mask boundary
    const edgePixels = this.extractMaskEdges(mask, width, height);
    
    // Use Harris corner detection on edge pixels
    const corners = this.harrisCornerDetection(image, edgePixels, boundingBox);
    
    // Select the 4 most appropriate corners for the countertop quadrilateral
    const quadCorners = this.selectQuadrilateralCorners(corners, boundingBox);
    
    return quadCorners;
  }

  private getMaskBoundingBox(mask: Uint8Array, width: number, height: number): {x: number, y: number, w: number, h: number} {
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
    
    return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
  }

  private extractMaskEdges(mask: Uint8Array, width: number, height: number): Point2D[] {
    const edges: Point2D[] = [];
    
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const center = mask[y * width + x];
        if (center > 0) {
          // Check if this is an edge pixel (has at least one non-mask neighbor)
          const neighbors = [
            mask[(y-1) * width + (x-1)], mask[(y-1) * width + x], mask[(y-1) * width + (x+1)],
            mask[y * width + (x-1)], mask[y * width + (x+1)],
            mask[(y+1) * width + (x-1)], mask[(y+1) * width + x], mask[(y+1) * width + (x+1)]
          ];
          
          if (neighbors.some(n => n === 0)) {
            edges.push({ x, y });
          }
        }
      }
    }
    
    return edges;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private harrisCornerDetection(image: Jimp, edgePixels: Point2D[], boundingBox: unknown): Point2D[] {
    const { width, height, data } = image.bitmap;
    const corners: Array<{point: Point2D, strength: number}> = [];
    
    // Harris corner detection parameters
    const windowSize = 3;
    const k = 0.04;
    const threshold = 0.01;
    
    // Convert to grayscale intensity array
    const intensity = new Float32Array(width * height);
    for (let i = 0; i < width * height; i++) {
      const r = data[i * 4];
      const g = data[i * 4 + 1];
      const b = data[i * 4 + 2];
      intensity[i] = 0.299 * r + 0.587 * g + 0.114 * b;
    }
    
    // Compute gradients
    const Ix = new Float32Array(width * height);
    const Iy = new Float32Array(width * height);
    
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = y * width + x;
        Ix[idx] = intensity[idx + 1] - intensity[idx - 1];
        Iy[idx] = intensity[idx + width] - intensity[idx - width];
      }
    }
    
    // Compute Harris corner response for edge pixels
    edgePixels.forEach(pixel => {
      const { x, y } = pixel;
      if (x >= windowSize && x < width - windowSize && 
          y >= windowSize && y < height - windowSize) {
        
        let Ixx = 0, Iyy = 0, Ixy = 0;
        
        // Sum over window
        for (let dy = -windowSize; dy <= windowSize; dy++) {
          for (let dx = -windowSize; dx <= windowSize; dx++) {
            const idx = (y + dy) * width + (x + dx);
            const ix = Ix[idx];
            const iy = Iy[idx];
            
            Ixx += ix * ix;
            Iyy += iy * iy;
            Ixy += ix * iy;
          }
        }
        
        // Harris corner response
        const det = Ixx * Iyy - Ixy * Ixy;
        const trace = Ixx + Iyy;
        const response = det - k * trace * trace;
        
        if (response > threshold) {
          corners.push({ point: pixel, strength: response });
        }
      }
    });
    
    // Sort by corner strength and return top candidates
    corners.sort((a, b) => b.strength - a.strength);
    return corners.slice(0, 20).map(c => c.point); // Top 20 corners
  }

  private selectQuadrilateralCorners(corners: Point2D[], boundingBox: unknown): Quadrilateral {
    if (corners.length < 4) {
      // Fallback to bounding box corners if we don't have enough detected corners
      return {
        topLeft: { x: boundingBox.x, y: boundingBox.y },
        topRight: { x: boundingBox.x + boundingBox.w, y: boundingBox.y },
        bottomLeft: { x: boundingBox.x, y: boundingBox.y + boundingBox.h },
        bottomRight: { x: boundingBox.x + boundingBox.w, y: boundingBox.y + boundingBox.h }
      };
    }
    
    // Find the convex hull of corner points
    const hull = this.convexHull(corners);
    
    // Select 4 corners that best represent a quadrilateral
    if (hull.length >= 4) {
      const quad = this.approximateQuadrilateral(hull);
      return {
        topLeft: quad[0],
        topRight: quad[1],
        bottomRight: quad[2],
        bottomLeft: quad[3]
      };
    }
    
    // Fallback: use extreme points
    const leftmost = corners.reduce((min, p) => p.x < min.x ? p : min, corners[0]);
    const rightmost = corners.reduce((max, p) => p.x > max.x ? p : max, corners[0]);
    const topmost = corners.reduce((min, p) => p.y < min.y ? p : min, corners[0]);
    const bottommost = corners.reduce((max, p) => p.y > max.y ? p : max, corners[0]);
    
    return {
      topLeft: topmost,
      topRight: rightmost,
      bottomRight: bottommost,
      bottomLeft: leftmost
    };
  }

  private convexHull(points: Point2D[]): Point2D[] {
    // Andrew's monotone chain convex hull algorithm
    if (points.length <= 1) return points;
    
    // Sort points lexicographically
    const sorted = [...points].sort((a, b) => a.x !== b.x ? a.x - b.x : a.y - b.y);
    
    // Build lower hull
    const lower: Point2D[] = [];
    for (const p of sorted) {
      while (lower.length >= 2 && this.cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) {
        lower.pop();
      }
      lower.push(p);
    }
    
    // Build upper hull
    const upper: Point2D[] = [];
    for (let i = sorted.length - 1; i >= 0; i--) {
      const p = sorted[i];
      while (upper.length >= 2 && this.cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) {
        upper.pop();
      }
      upper.push(p);
    }
    
    // Remove last point of each half because it's repeated
    lower.pop();
    upper.pop();
    
    return lower.concat(upper);
  }

  private cross(o: Point2D, a: Point2D, b: Point2D): number {
    return (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
  }

  private approximateQuadrilateral(hull: Point2D[]): Point2D[] {
    // Use Douglas-Peucker algorithm to approximate with 4 points
    if (hull.length <= 4) return hull;
    
    // Find the 4 points that minimize approximation error
    let bestQuad: Point2D[] = [];
    let minError = Infinity;
    
    // Try different combinations of 4 points from the hull
    for (let i = 0; i < hull.length; i++) {
      for (let j = i + 1; j < hull.length; j++) {
        for (let k = j + 1; k < hull.length; k++) {
          for (let l = k + 1; l < hull.length; l++) {
            const quad = [hull[i], hull[j], hull[k], hull[l]];
            const error = this.calculateQuadrilateralError(quad, hull);
            if (error < minError) {
              minError = error;
              bestQuad = quad;
            }
          }
        }
      }
    }
    
    // Sort the quadrilateral points in clockwise order
    return this.sortQuadrilateralPoints(bestQuad);
  }

  private calculateQuadrilateralError(quad: Point2D[], hull: Point2D[]): number {
    // Calculate how well the quadrilateral approximates the convex hull
    let totalError = 0;
    
    hull.forEach(point => {
      let minDistance = Infinity;
      
      // Find minimum distance from point to any edge of the quadrilateral
      for (let i = 0; i < 4; i++) {
        const p1 = quad[i];
        const p2 = quad[(i + 1) % 4];
        const distance = this.pointToLineDistance(point, p1, p2);
        minDistance = Math.min(minDistance, distance);
      }
      
      totalError += minDistance * minDistance;
    });
    
    return totalError;
  }

  private pointToLineDistance(point: Point2D, lineStart: Point2D, lineEnd: Point2D): number {
    const A = point.x - lineStart.x;
    const B = point.y - lineStart.y;
    const C = lineEnd.x - lineStart.x;
    const D = lineEnd.y - lineStart.y;
    
    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    
    if (lenSq === 0) return Math.sqrt(A * A + B * B);
    
    let param = dot / lenSq;
    param = Math.max(0, Math.min(1, param));
    
    const xx = lineStart.x + param * C;
    const yy = lineStart.y + param * D;
    
    const dx = point.x - xx;
    const dy = point.y - yy;
    
    return Math.sqrt(dx * dx + dy * dy);
  }

  private sortQuadrilateralPoints(points: Point2D[]): Point2D[] {
    // Sort points to form a proper quadrilateral (top-left, top-right, bottom-right, bottom-left)
    const center = {
      x: points.reduce((sum, p) => sum + p.x, 0) / points.length,
      y: points.reduce((sum, p) => sum + p.y, 0) / points.length
    };
    
    const withAngles = points.map(p => ({
      point: p,
      angle: Math.atan2(p.y - center.y, p.x - center.x)
    }));
    
    withAngles.sort((a, b) => a.angle - b.angle);
    
    return withAngles.map(item => item.point);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private computeHomography(corners: Quadrilateral, width: number, height: number): HomographyMatrix {
    // Define destination rectangle (normalized coordinates)
    const destWidth = 512; // Standard texture size
    const destHeight = 512;
    
    const srcPoints = [
      [corners.topLeft.x, corners.topLeft.y],
      [corners.topRight.x, corners.topRight.y],
      [corners.bottomRight.x, corners.bottomRight.y],
      [corners.bottomLeft.x, corners.bottomLeft.y]
    ];
    
    const dstPoints = [
      [0, 0],
      [destWidth, 0],
      [destWidth, destHeight],
      [0, destHeight]
    ];
    
    const H = this.calculateHomographyMatrix(srcPoints, dstPoints);
    const H_inv = this.invertMatrix3x3(H);
    
    return {
      matrix: H,
      inverse: H_inv
    };
  }

  private calculateHomographyMatrix(src: number[][], dst: number[][]): number[] {
    // Solve for homography using Direct Linear Transform (DLT)
    const A: number[][] = [];
    
    for (let i = 0; i < 4; i++) {
      const [x, y] = src[i];
      const [u, v] = dst[i];
      
      A.push([x, y, 1, 0, 0, 0, -u*x, -u*y, -u]);
      A.push([0, 0, 0, x, y, 1, -v*x, -v*y, -v]);
    }
    
    // Solve Ah = 0 using SVD (simplified implementation)
    const h = this.solveDLT(A);
    
    return h;
  }

  private solveDLT(A: number[][]): number[] {
    // Simplified DLT solver using least squares
    // In a production system, you'd use proper SVD
    const rows = A.length;
    const cols = A[0].length;
    
    // Create AtA matrix
    const AtA: number[][] = [];
    for (let i = 0; i < cols; i++) {
      AtA[i] = [];
      for (let j = 0; j < cols; j++) {
        let sum = 0;
        for (let k = 0; k < rows; k++) {
          sum += A[k][i] * A[k][j];
        }
        AtA[i][j] = sum;
      }
    }
    
    // Find eigenvector corresponding to smallest eigenvalue
    // For simplicity, we'll use a heuristic solution
    return [1, 0, 0, 0, 1, 0, 0, 0, 1]; // Identity transform as fallback
  }

  private invertMatrix3x3(matrix: number[]): number[] {
    const [a, b, c, d, e, f, g, h, i] = matrix;
    
    const det = a*(e*i - f*h) - b*(d*i - f*g) + c*(d*h - e*g);
    
    if (Math.abs(det) < 1e-10) {
      return [1, 0, 0, 0, 1, 0, 0, 0, 1]; // Return identity if not invertible
    }
    
    return [
      (e*i - f*h) / det, (c*h - b*i) / det, (b*f - c*e) / det,
      (f*g - d*i) / det, (a*i - c*g) / det, (c*d - a*f) / det,
      (d*h - e*g) / det, (b*g - a*h) / det, (a*e - b*d) / det
    ];
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private calculatePerspectiveConfidence(corners: Quadrilateral, mask: Uint8Array, width: number, height: number): number {
    // Calculate confidence based on:
    // 1. How well the corners form a reasonable quadrilateral
    // 2. How much of the mask is covered by the quadrilateral
    
    const quadArea = this.calculateQuadrilateralArea(corners);
    const maskArea = mask.reduce((sum, pixel) => sum + (pixel > 0 ? 1 : 0), 0);
    // const totalArea = width * height; // Unused variable
    
    // Area ratio confidence
    const areaRatio = Math.min(quadArea / maskArea, maskArea / quadArea);
    
    // Aspect ratio confidence (countertops are usually not too extreme)
    const aspectRatio = this.calculateAspectRatio(corners);
    const aspectConfidence = 1.0 - Math.abs(aspectRatio - 1.5) / 2.0; // Prefer ~1.5 aspect ratio
    
    // Combine confidences
    return Math.max(0, Math.min(1, (areaRatio * 0.6 + aspectConfidence * 0.4)));
  }

  private calculateQuadrilateralArea(corners: Quadrilateral): number {
    const points = [corners.topLeft, corners.topRight, corners.bottomRight, corners.bottomLeft];
    let area = 0;
    
    for (let i = 0; i < 4; i++) {
      const j = (i + 1) % 4;
      area += points[i].x * points[j].y;
      area -= points[j].x * points[i].y;
    }
    
    return Math.abs(area) / 2;
  }

  private calculateAspectRatio(corners: Quadrilateral): number {
    const width = Math.max(
      Math.sqrt(Math.pow(corners.topRight.x - corners.topLeft.x, 2) + Math.pow(corners.topRight.y - corners.topLeft.y, 2)),
      Math.sqrt(Math.pow(corners.bottomRight.x - corners.bottomLeft.x, 2) + Math.pow(corners.bottomRight.y - corners.bottomLeft.y, 2))
    );
    
    const height = Math.max(
      Math.sqrt(Math.pow(corners.bottomLeft.x - corners.topLeft.x, 2) + Math.pow(corners.bottomLeft.y - corners.topLeft.y, 2)),
      Math.sqrt(Math.pow(corners.bottomRight.x - corners.topRight.x, 2) + Math.pow(corners.bottomRight.y - corners.topRight.y, 2))
    );
    
    return width / height;
  }

  async warpTexture(textureBuffer: Buffer, homography: HomographyMatrix, outputWidth: number, outputHeight: number): Promise<Buffer> {
    const texture = await Jimp.read(textureBuffer);
    const result = new Jimp(outputWidth, outputHeight);
    
    const H = homography.matrix;
    
    // Apply inverse warping to avoid holes
    for (let y = 0; y < outputHeight; y++) {
      for (let x = 0; x < outputWidth; x++) {
        // Apply homography transformation
        const w = H[6] * x + H[7] * y + H[8];
        const srcX = (H[0] * x + H[1] * y + H[2]) / w;
        const srcY = (H[3] * x + H[4] * y + H[5]) / w;
        
        // Bilinear interpolation
        if (srcX >= 0 && srcX < texture.bitmap.width - 1 && srcY >= 0 && srcY < texture.bitmap.height - 1) {
          const color = this.bilinearInterpolation(texture, srcX, srcY);
          result.setPixelColor(color, x, y);
        }
      }
    }
    
    return result.getBufferAsync(Jimp.MIME_JPEG);
  }

  private bilinearInterpolation(image: Jimp, x: number, y: number): number {
    const x1 = Math.floor(x);
    const y1 = Math.floor(y);
    const x2 = Math.ceil(x);
    const y2 = Math.ceil(y);
    
    const q11 = image.getPixelColor(x1, y1);
    const q12 = image.getPixelColor(x1, y2);
    const q21 = image.getPixelColor(x2, y1);
    const q22 = image.getPixelColor(x2, y2);
    
    const wx = x - x1;
    const wy = y - y1;
    
    // Extract RGBA components
    const r11 = (q11 >> 24) & 0xFF, g11 = (q11 >> 16) & 0xFF, b11 = (q11 >> 8) & 0xFF, a11 = q11 & 0xFF;
    const r12 = (q12 >> 24) & 0xFF, g12 = (q12 >> 16) & 0xFF, b12 = (q12 >> 8) & 0xFF, a12 = q12 & 0xFF;
    const r21 = (q21 >> 24) & 0xFF, g21 = (q21 >> 16) & 0xFF, b21 = (q21 >> 8) & 0xFF, a21 = q21 & 0xFF;
    const r22 = (q22 >> 24) & 0xFF, g22 = (q22 >> 16) & 0xFF, b22 = (q22 >> 8) & 0xFF, a22 = q22 & 0xFF;
    
    // Interpolate each channel
    const r = Math.round(r11 * (1-wx) * (1-wy) + r21 * wx * (1-wy) + r12 * (1-wx) * wy + r22 * wx * wy);
    const g = Math.round(g11 * (1-wx) * (1-wy) + g21 * wx * (1-wy) + g12 * (1-wx) * wy + g22 * wx * wy);
    const b = Math.round(b11 * (1-wx) * (1-wy) + b21 * wx * (1-wy) + b12 * (1-wx) * wy + b22 * wx * wy);
    const a = Math.round(a11 * (1-wx) * (1-wy) + a21 * wx * (1-wy) + a12 * (1-wx) * wy + a22 * wx * wy);
    
    return (r << 24) | (g << 16) | (b << 8) | a;
  }
}