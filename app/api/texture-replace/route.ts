import { NextRequest, NextResponse } from 'next/server';
import { processImageWithFallback } from '@/lib/simpleFallback';

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  console.log(`[${new Date().toISOString()}] Deterministic texture replacement API started`);

  try {
    // Validate content type
    const contentType = request.headers.get('content-type') || '';
    if (!contentType.includes('multipart/form-data')) {
      console.log(`[${new Date().toISOString()}] Invalid content-type: ${contentType}`);
      return NextResponse.json(
        { 
          error: 'Content-Type must be "multipart/form-data"',
          processingTime: Date.now() - startTime
        },
        { status: 400 }
      );
    }

    // Parse form data
    const formData = await request.formData();
    const roomImageData = formData.get('roomImage') as string;
    const inspirationImageData = formData.get('inspirationImage') as string;

    console.log(`[${new Date().toISOString()}] Form data extracted after ${Date.now() - startTime}ms`);

    // Validate required inputs
    if (!roomImageData) {
      return NextResponse.json(
        { error: 'Room image is required' },
        { status: 400 }
      );
    }

    if (!inspirationImageData) {
      return NextResponse.json(
        { error: 'Inspiration/material image is required' },
        { status: 400 }
      );
    }


    // Convert base64 data URLs to buffers
    const roomImageBuffer = dataURLToBuffer(roomImageData);
    const inspirationImageBuffer = dataURLToBuffer(inspirationImageData);

    console.log(`[${new Date().toISOString()}] Images converted to buffers`);
    console.log(`[${new Date().toISOString()}] Room image buffer size: ${roomImageBuffer.length} bytes`);
    console.log(`[${new Date().toISOString()}] Material image buffer size: ${inspirationImageBuffer.length} bytes`);

    console.log(`[${new Date().toISOString()}] Starting simplified texture replacement...`);

    // Process with simplified fallback approach
    const result = await processImageWithFallback(
      roomImageBuffer,
      inspirationImageBuffer
    );

    const totalProcessingTime = Date.now() - startTime;
    console.log(`[${new Date().toISOString()}] Processing completed in ${totalProcessingTime}ms`);

    // Convert result to base64 for frontend consumption
    const resultDataURL = `data:image/jpeg;base64,${result.processedImage.toString('base64')}`;

    return NextResponse.json({
      success: true,
      images: [{
        url: resultDataURL,
        alt: 'Simplified texture replacement result',
        caption: 'Processed with Sharp-based image compositing'
      }],
      metadata: {
        processingTime: totalProcessingTime,
        pipeline: 'sharp-fallback',
        confidence: 0.8,
        actualProcessingTime: result.processingTime
      }
    });

  } catch (error: unknown) {
    const errorTime = Date.now() - startTime;
    console.error(`[${new Date().toISOString()}] Error after ${errorTime}ms:`, error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace available');

    // Categorize errors for better user feedback
    let errorMessage = 'Failed to process texture replacement';
    let statusCode = 500;

    if (error instanceof Error && error.message?.includes('segmentation')) {
      errorMessage = 'Could not detect countertop in the image. Please ensure the kitchen photo shows clear countertop surfaces.';
      statusCode = 400;
    } else if (error instanceof Error && (error.message?.includes('perspective') || error.message?.includes('geometry'))) {
      errorMessage = 'Could not detect countertop geometry. Please use an image with clearly visible countertop edges.';
      statusCode = 400;
    } else if (error instanceof Error && (error.message?.includes('texture') || error.message?.includes('material'))) {
      errorMessage = 'Could not process the material sample. Please ensure the inspiration photo shows a clear material texture.';
      statusCode = 400;
    } else if (error instanceof Error && (error.message?.includes('memory') || error.message?.includes('allocation'))) {
      errorMessage = 'Image too large to process. Please use smaller images (max 4MB each).';
      statusCode = 413;
    }

    return NextResponse.json(
      { 
        error: errorMessage,
        processingTime: errorTime,
        pipeline: 'deterministic-cv',
        debug: process.env.NODE_ENV === 'development' ? {
          originalError: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack?.split('\n').slice(0, 5).join('\n') : undefined
        } : undefined
      },
      { status: statusCode }
    );
  }
}

// Helper function to convert data URL to buffer
function dataURLToBuffer(dataURL: string): Buffer {
  const [, base64Data] = dataURL.split(',');
  if (!base64Data) {
    throw new Error('Invalid data URL format');
  }
  
  return Buffer.from(base64Data, 'base64');
}

// Helper function for image validation (optional)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function validateImageBuffer(buffer: Buffer, name: string): Promise<void> {
  try {
    const Jimp = await import('jimp');
    const image = await Jimp.read(buffer);
    
    const { width, height } = image.bitmap;
    
    // Check image dimensions
    if (width < 100 || height < 100) {
      throw new Error(`${name} is too small (minimum 100x100 pixels)`);
    }
    
    if (width > 4096 || height > 4096) {
      throw new Error(`${name} is too large (maximum 4096x4096 pixels)`);
    }
    
    // Check file size (buffer length)
    if (buffer.length > 10 * 1024 * 1024) { // 10MB
      throw new Error(`${name} file size is too large (maximum 10MB)`);
    }
    
  } catch (error) {
    if (error instanceof Error && error.message.includes('Unsupported')) {
      throw new Error(`${name} format is not supported. Please use JPEG, PNG, or WebP.`);
    }
    throw error;
  }
}