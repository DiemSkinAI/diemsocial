// import { NextRequest, NextResponse } from 'next/server'; // Unused imports
import sharp from 'sharp';

export async function processImageWithFallback(
  roomImageBuffer: Buffer,
  materialImageBuffer: Buffer
): Promise<{ processedImage: Buffer; processingTime: number }> {
  
  const startTime = Date.now();
  
  try {
    console.log('Using simplified fallback approach...');
    
    // Get room image metadata
    const roomInfo = await sharp(roomImageBuffer).metadata();
    const materialInfo = await sharp(materialImageBuffer).metadata();
    
    console.log(`Room image: ${roomInfo.width}x${roomInfo.height}`);
    console.log(`Material image: ${materialInfo.width}x${materialInfo.height}`);
    
    // Simple approach: Resize material to room dimensions and apply with transparency
    const resizedMaterial = await sharp(materialImageBuffer)
      .resize(roomInfo.width, roomInfo.height, { 
        fit: 'cover',
        position: 'center'
      })
      .toBuffer();
    
    // Create a simple overlay effect
    const result = await sharp(roomImageBuffer)
      .composite([{
        input: resizedMaterial,
        blend: 'overlay',
        opacity: 0.7
      }])
      .jpeg({ quality: 90 })
      .toBuffer();
    
    const processingTime = Date.now() - startTime;
    console.log(`Fallback processing completed in ${processingTime}ms`);
    
    return {
      processedImage: result,
      processingTime
    };
    
  } catch (error) {
    console.error('Fallback processing failed:', error);
    throw error;
  }
}