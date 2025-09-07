'use client'

import React, { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { X, Sparkles } from 'lucide-react'
import Image from 'next/image'

interface InspirationUploadProps {
  onImageSelect: (file: File | null) => void
  currentImage: File | null
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default function InspirationUpload({ onImageSelect, currentImage }: InspirationUploadProps) {
  const [preview, setPreview] = useState<string | null>(null)

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0]
      onImageSelect(file)
      
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }, [onImageSelect])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp']
    },
    maxFiles: 1
  })

  const removeImage = () => {
    setPreview(null)
    onImageSelect(null)
  }

  return (
    <div className="w-full">
      <h2 className="text-xl font-semibold mb-2">Inspiration Photo (Optional)</h2>
      <p className="text-sm text-gray-600 mb-4">
        Upload a reference image of the countertop style you like
      </p>
      
      {!preview ? (
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
            ${isDragActive ? 'border-purple-500 bg-purple-50' : 'border-gray-300 hover:border-gray-400'}`}
        >
          <input {...getInputProps()} />
          <Sparkles className="mx-auto h-12 w-12 text-gray-400 mb-3" />
          {isDragActive ? (
            <p className="text-gray-600">Drop your inspiration photo here...</p>
          ) : (
            <div>
              <p className="text-gray-600">Drag & drop your inspiration photo</p>
              <p className="text-sm text-gray-500 mt-1">or click to browse</p>
            </div>
          )}
        </div>
      ) : (
        <div className="relative">
          <Image
            src={preview}
            alt="Inspiration preview"
            className="w-full rounded-lg"
            width={400}
            height={300}
            style={{width: 'auto', height: 'auto'}}
          />
          <button
            onClick={removeImage}
            className="absolute top-2 right-2 p-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  )
}