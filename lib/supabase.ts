import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://yqtaquyjiduuvbstdorz.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlxdGFxdXlqaWR1dXZic3Rkb3J6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxOTkwMzEsImV4cCI6MjA3Mjc3NTAzMX0.dzmXWM8fUTSouRkVXPX9Z5TxvtV5TUvvCrJ_S7j_-18'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlxdGFxdXlqaWR1dXZic3Rkb3J6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzE5OTAzMSwiZXhwIjoyMDcyNzc1MDMxfQ.PV-uynmxilYkWikvEDnuu5KxsAtOWZBXrJ4v2B9fnXY'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

export async function uploadImageToStorage(
  file: File | Blob,
  fileName: string,
  bucketName: string = 'analytics-images'
): Promise<string | null> {
  try {
    const { data, error } = await supabaseAdmin.storage
      .from(bucketName)
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: true
      })

    if (error) {
      console.error('Error uploading file:', error)
      return null
    }

    const { data: { publicUrl } } = supabaseAdmin.storage
      .from(bucketName)
      .getPublicUrl(data.path)

    return publicUrl
  } catch (error) {
    console.error('Error uploading to Supabase:', error)
    return null
  }
}

export async function uploadBase64ImageToStorage(
  base64Data: string,
  fileName: string,
  bucketName: string = 'analytics-images'
): Promise<string | null> {
  try {
    // Convert base64 to blob
    const base64Response = await fetch(base64Data)
    const blob = await base64Response.blob()
    
    // Determine file extension from blob type or base64 data
    const mimeType = blob.type || base64Data.split(',')[0].split(':')[1].split(';')[0]
    let extension = 'jpg'
    
    if (mimeType.includes('png')) extension = 'png'
    else if (mimeType.includes('webp')) extension = 'webp'
    else if (mimeType.includes('jpeg') || mimeType.includes('jpg')) extension = 'jpg'
    
    // Update filename with correct extension
    const fileNameWithExtension = fileName.replace(/\.[^/.]+$/, '') + '.' + extension
    
    return await uploadImageToStorage(blob, fileNameWithExtension, bucketName)
  } catch (error) {
    console.error('Error converting base64 to blob:', error)
    return null
  }
}