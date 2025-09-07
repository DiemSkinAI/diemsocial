'use client'

import React, { useCallback, useRef, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { Camera, Upload, X } from 'lucide-react'
import Image from 'next/image'

interface RoomPhotoUploadProps {
  onImageSelect: (file: File | null) => void
  currentImage: File | null
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default function RoomPhotoUpload({ onImageSelect, currentImage }: RoomPhotoUploadProps) {
  const [preview, setPreview] = useState<string | null>(null)
  const [isCapturing, setIsCapturing] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

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
    maxFiles: 1,
    disabled: isCapturing
  })

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      })
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        streamRef.current = stream
        setIsCapturing(true)
      }
    } catch (error) {
      console.error('Error accessing camera:', error)
      alert('Unable to access camera. Please check permissions.')
    }
  }

  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas')
      canvas.width = videoRef.current.videoWidth
      canvas.height = videoRef.current.videoHeight
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0)
        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], `room-photo-${Date.now()}.jpg`, { type: 'image/jpeg' })
            onImageSelect(file)
            setPreview(canvas.toDataURL())
            stopCamera()
          }
        }, 'image/jpeg')
      }
    }
  }

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
      setIsCapturing(false)
    }
  }

  const removeImage = () => {
    setPreview(null)
    onImageSelect(null)
  }

  return (
    <div className="w-full">
      <h2 className="text-xl font-semibold mb-4">Room Photo</h2>
      
      {!preview && !isCapturing && (
        <div className="space-y-4">
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
              ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}`}
          >
            <input {...getInputProps()} />
            <Upload className="mx-auto h-12 w-12 text-gray-400 mb-3" />
            {isDragActive ? (
              <p className="text-gray-600">Drop your room photo here...</p>
            ) : (
              <div>
                <p className="text-gray-600">Drag & drop your room photo here</p>
                <p className="text-sm text-gray-500 mt-1">or click to browse</p>
              </div>
            )}
          </div>

          <div className="text-center">
            <p className="text-gray-500 mb-2">or</p>
            <button
              onClick={startCamera}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Camera className="w-5 h-5 mr-2" />
              Use Camera
            </button>
          </div>
        </div>
      )}

      {isCapturing && (
        <div className="space-y-4">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="w-full rounded-lg"
          />
          <div className="flex gap-3">
            <button
              onClick={capturePhoto}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Capture Photo
            </button>
            <button
              onClick={stopCamera}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {preview && (
        <div className="space-y-4">
          <div className="relative">
            <Image
              src={preview}
              alt="Room preview"
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
        </div>
      )}
    </div>
  )
}