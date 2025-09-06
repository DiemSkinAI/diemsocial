'use client'

import React, { useState, useRef, useCallback, useEffect } from 'react'
import Image from 'next/image'

interface BeforeAfterSliderProps {
  beforeImage: string
  afterImage: string
  className?: string
}

export default function BeforeAfterSlider({ beforeImage, afterImage, className = '' }: BeforeAfterSliderProps) {
  const [sliderPosition, setSliderPosition] = useState(50)
  const [isDragging, setIsDragging] = useState(false)
  const [imageAspectRatio, setImageAspectRatio] = useState<number | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Calculate aspect ratio from the first image
  useEffect(() => {
    const img = new globalThis.Image()
    img.onload = () => {
      setImageAspectRatio(img.height / img.width)
    }
    img.src = beforeImage
  }, [beforeImage])

  const updateSliderPosition = useCallback((clientX: number) => {
    if (!containerRef.current) return

    const rect = containerRef.current.getBoundingClientRect()
    const x = clientX - rect.left
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100))
    setSliderPosition(percentage)
  }, [])

  const handleMouseDown = useCallback(() => {
    setIsDragging(true)
  }, [])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging) return
    updateSliderPosition(e.clientX)
  }, [isDragging, updateSliderPosition])

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  const handleTouchStart = useCallback(() => {
    setIsDragging(true)
  }, [])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging) return
    e.preventDefault()
    const touch = e.touches[0]
    updateSliderPosition(touch.clientX)
  }, [isDragging, updateSliderPosition])

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false)
  }, [])

  return (
    <div 
      ref={containerRef}
      className={`relative overflow-hidden rounded-lg cursor-ew-resize select-none ${className}`}
      style={{ 
        aspectRatio: imageAspectRatio ? `1 / ${imageAspectRatio}` : undefined,
        minHeight: imageAspectRatio ? undefined : '400px'
      }}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Before Image (Right side) */}
      <div className="relative w-full h-full">
        <Image
          src={beforeImage}
          alt="Before"
          className="w-full h-full object-cover"
          draggable={false}
          fill
        />
      </div>

      {/* After Image (Left side - clipped) */}
      <div 
        className="absolute top-0 left-0 w-full h-full overflow-hidden"
        style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
      >
        <div className="relative w-full h-full">
          <Image
            src={afterImage}
            alt="After"
            className="w-full h-full object-cover"
            draggable={false}
            fill
          />
        </div>
      </div>

      {/* Slider Handle */}
      <div 
        className="absolute top-0 bottom-0 w-1 bg-white shadow-lg cursor-ew-resize z-10"
        style={{ left: `${sliderPosition}%` }}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
      >
        {/* Slider Button */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full shadow-lg border-2 border-gray-300 flex items-center justify-center">
          <div className="flex space-x-0.5">
            <div className="w-0.5 h-4 bg-gray-400"></div>
            <div className="w-0.5 h-4 bg-gray-400"></div>
          </div>
        </div>
      </div>

      {/* Labels */}
      <div className="absolute top-4 left-4 px-3 py-1 bg-black/70 text-white text-sm rounded-md backdrop-blur-sm">
        After
      </div>
      <div className="absolute top-4 right-4 px-3 py-1 bg-black/70 text-white text-sm rounded-md backdrop-blur-sm">
        Before
      </div>
    </div>
  )
}