'use client'

import React, { useState, useEffect } from 'react'
import { Download, Loader2, ChevronLeft, ChevronRight, X, ToggleLeft, ToggleRight } from 'lucide-react'
import BeforeAfterSlider from './BeforeAfterSlider'
import Image from 'next/image'

interface ResultsGalleryProps {
  images: Array<{ url: string }>
  originalImage: string
  isLoading: boolean
  onReset: () => void
}

export default function ResultsGallery({ images, originalImage, isLoading, onReset }: ResultsGalleryProps) {
  const [selectedImage, setSelectedImage] = useState(0)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showComparison, setShowComparison] = useState(true)
  const [imageAspectRatio, setImageAspectRatio] = useState<number | null>(null)

  // Calculate aspect ratio from original image
  useEffect(() => {
    if (originalImage) {
      const img = new globalThis.Image()
      img.onload = () => {
        setImageAspectRatio(img.width / img.height)
      }
      img.src = originalImage
    }
  }, [originalImage])

  const downloadImage = async (url: string, index: number) => {
    try {
      const response = await fetch(url)
      const blob = await response.blob()
      const downloadUrl = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = downloadUrl
      link.download = `countertop-visualization-${index + 1}.jpg`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(downloadUrl)
    } catch (error) {
      console.error('Error downloading image:', error)
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="h-12 w-12 animate-spin text-blue-600 mb-4" />
        <p className="text-gray-600">Creating your countertop visualization...</p>
        <p className="text-sm text-gray-500 mt-2">This may take 15-30 seconds</p>
      </div>
    )
  }


  if (!images || images.length === 0) {
    return null
  }

  return (
    <div className="w-full space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Your Visualizations</h2>
        <div className="flex items-center gap-4">
          {/* Comparison Toggle */}
          <button
            onClick={() => setShowComparison(!showComparison)}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            {showComparison ? <ToggleRight className="h-5 w-5 text-blue-600" /> : <ToggleLeft className="h-5 w-5 text-gray-400" />}
            Before/After
          </button>
          <button
            onClick={onReset}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            Try Another
          </button>
        </div>
      </div>

      {/* Main Image Display */}
      {showComparison && originalImage ? (
        <div className="relative rounded-lg overflow-hidden bg-gray-100">
          <div 
            className="w-full"
            style={{ 
              aspectRatio: imageAspectRatio ? `${imageAspectRatio}` : 'auto',
              minHeight: imageAspectRatio ? 'auto' : '400px'
            }}
          >
            <BeforeAfterSlider 
              beforeImage={originalImage}
              afterImage={images[selectedImage].url}
              className="w-full h-full"
            />
          </div>
          
          {images.length > 1 && (
            <>
              <button
                onClick={() => setSelectedImage(prev => Math.max(0, prev - 1))}
                disabled={selectedImage === 0}
                className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-white/80 rounded-full hover:bg-white disabled:opacity-50 transition-all z-20"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button
                onClick={() => setSelectedImage(prev => Math.min(images.length - 1, prev + 1))}
                disabled={selectedImage === images.length - 1}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-white/80 rounded-full hover:bg-white disabled:opacity-50 transition-all z-20"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            </>
          )}

          <button
            onClick={() => downloadImage(images[selectedImage].url, selectedImage)}
            className="absolute bottom-4 right-4 p-3 bg-white/90 rounded-full hover:bg-white transition-all z-20"
          >
            <Download className="h-5 w-5" />
          </button>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">AI Generated Result</h3>
          <div className="relative rounded-lg overflow-hidden bg-gray-100">
            <Image
              src={images[selectedImage].url}
              alt={`AI Generated Visualization ${selectedImage + 1}`}
              className="w-full h-auto cursor-pointer"
              onClick={() => setIsFullscreen(true)}
              width={800}
              height={600}
            />
            {images.length > 1 && (
              <>
                <button
                  onClick={() => setSelectedImage(prev => Math.max(0, prev - 1))}
                  disabled={selectedImage === 0}
                  className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-white/80 rounded-full hover:bg-white disabled:opacity-50 transition-all z-20"
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
                <button
                  onClick={() => setSelectedImage(prev => Math.min(images.length - 1, prev + 1))}
                  disabled={selectedImage === images.length - 1}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-white/80 rounded-full hover:bg-white disabled:opacity-50 transition-all z-20"
                >
                  <ChevronRight className="h-6 w-6" />
                </button>
              </>
            )}
            <button
              onClick={() => downloadImage(images[selectedImage].url, selectedImage)}
              className="absolute bottom-4 right-4 p-3 bg-white/90 rounded-full hover:bg-white transition-all z-20"
            >
              <Download className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}


      {/* Thumbnail Gallery */}
      {images.length > 1 && (
        <div className="flex gap-4 justify-center">
          {images.map((image, index) => (
            <button
              key={index}
              onClick={() => setSelectedImage(index)}
              className={`relative rounded-lg overflow-hidden transition-all ${
                selectedImage === index 
                  ? 'ring-2 ring-blue-600 scale-105' 
                  : 'hover:scale-105 opacity-70 hover:opacity-100'
              }`}
            >
              <Image
                src={image.url}
                alt={`Thumbnail ${index + 1}`}
                className="w-24 h-24 object-cover"
                width={96}
                height={96}
              />
            </button>
          ))}
        </div>
      )}

      {/* Not satisfied section */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6 text-center">
        <h3 className="text-lg font-medium text-blue-900 dark:text-blue-300 mb-2">Not quite right?</h3>
        <p className="text-blue-800 dark:text-blue-400 text-sm mb-4">
          For better results, start over with a more detailed description of exactly what you want.
        </p>
        <div className="text-sm text-blue-700 dark:text-blue-300 mb-4">
          <p className="font-medium mb-2">Be specific about:</p>
          <ul className="list-disc list-inside space-y-1 text-left max-w-md mx-auto">
            <li>Exact material name (e.g., &quot;Calacatta Gold marble&quot;, &quot;Absolute Black granite&quot;)</li>
            <li>Surface finish (polished, honed, leathered)</li>
            <li>Edge profile (bullnose, straight, ogee)</li>
            <li>Which areas to change (countertops, backsplash, both)</li>
          </ul>
        </div>
        <button
          onClick={onReset}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
        >
          Start Again
        </button>
      </div>

      {/* Fullscreen Modal */}
      {isFullscreen && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4">
          <button
            onClick={() => setIsFullscreen(false)}
            className="absolute top-4 right-4 p-2 bg-white/20 rounded-full hover:bg-white/30 transition-all"
          >
            <X className="h-6 w-6 text-white" />
          </button>
          <Image
            src={images[selectedImage].url}
            alt={`Fullscreen visualization ${selectedImage + 1}`}
            className="max-w-full max-h-full object-contain"
            width={1200}
            height={800}
          />
        </div>
      )}
    </div>
  )
}