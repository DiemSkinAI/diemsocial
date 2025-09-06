import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://yqtaquyjiduuvbstdorz.supabase.co'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlxdGFxdXlqaWR1dXZic3Rkb3J6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzE5OTAzMSwiZXhwIjoyMDcyNzc1MDMxfQ.PV-uynmxilYkWikvEDnuu5KxsAtOWZBXrJ4v2B9fnXY'

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { imageData, fileName, bucketName = 'analytics-images' } = body

    if (!imageData || !fileName) {
      return NextResponse.json(
        { error: 'Image data and filename are required' },
        { status: 400 }
      )
    }

    // Convert base64 to blob
    const base64Response = await fetch(imageData)
    const blob = await base64Response.blob()
    
    // Determine file extension from blob type or base64 data
    const mimeType = blob.type || imageData.split(',')[0].split(':')[1].split(';')[0]
    let extension = 'jpg'
    
    if (mimeType.includes('png')) extension = 'png'
    else if (mimeType.includes('webp')) extension = 'webp'
    else if (mimeType.includes('jpeg') || mimeType.includes('jpg')) extension = 'jpg'
    
    // Update filename with correct extension
    const fileNameWithExtension = fileName.replace(/\.[^/.]+$/, '') + '.' + extension

    const { data, error } = await supabaseAdmin.storage
      .from(bucketName)
      .upload(fileNameWithExtension, blob, {
        cacheControl: '3600',
        upsert: true
      })

    if (error) {
      console.error('Error uploading file:', error)
      return NextResponse.json(
        { error: 'Failed to upload image', details: error.message },
        { status: 500 }
      )
    }

    const { data: { publicUrl } } = supabaseAdmin.storage
      .from(bucketName)
      .getPublicUrl(data.path)

    return NextResponse.json({
      success: true,
      url: publicUrl,
      path: data.path
    })

  } catch (error) {
    console.error('Upload API error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}