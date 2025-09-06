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
    // Convert File/Blob to base64 for API upload
    const base64Data = await new Promise<string>((resolve) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result as string)
      reader.readAsDataURL(file)
    })

    // Use server-side upload API
    const response = await fetch('/api/upload-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        imageData: base64Data,
        fileName,
        bucketName
      })
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error('Upload API error:', errorData)
      return null
    }

    const { url } = await response.json()
    return url

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
    // Use server-side upload API directly with base64 data
    const response = await fetch('/api/upload-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        imageData: base64Data,
        fileName,
        bucketName
      })
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error('Upload API error:', errorData)
      return null
    }

    const { url } = await response.json()
    return url

  } catch (error) {
    console.error('Error uploading base64 to Supabase:', error)
    return null
  }
}