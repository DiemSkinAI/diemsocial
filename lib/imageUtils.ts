import imageCompression from 'browser-image-compression'

export async function compressImage(file: File): Promise<File> {
  const options = {
    maxSizeMB: 2,
    maxWidthOrHeight: 1024,
    useWebWorker: true,
    quality: 0.8
  }

  try {
    const compressedFile = await imageCompression(file, options)
    return compressedFile
  } catch (error) {
    console.error('Error compressing image:', error)
    return file
  }
}

export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = error => reject(error)
  })
}