'use client'

import { useState, useRef } from 'react'
import { Camera, ArrowUp, Sparkles, Image, Download, User } from 'lucide-react'
import { compressImage, fileToBase64 } from '@/lib/imageUtils'
import CameraCapture from '@/components/CameraCapture'

export default function Home() {
  const [frontFaceImage, setFrontFaceImage] = useState<File | null>(null)
  const [sideFaceImage, setSideFaceImage] = useState<File | null>(null)
  const [fullBodyImage, setFullBodyImage] = useState<File | null>(null)
  const [prompt, setPrompt] = useState('')
  const [results, setResults] = useState<Array<{ url: string }>>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showBorderAnimation, setShowBorderAnimation] = useState(false)
  const [showCamera, setShowCamera] = useState(false)
  const [currentPhotoType, setCurrentPhotoType] = useState<'front' | 'side' | 'full' | null>(null)
  const [isTyping, setIsTyping] = useState(false)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const triggerBorderAnimation = () => {
    setShowBorderAnimation(true)
    setTimeout(() => setShowBorderAnimation(false), 4000) // 4 seconds as requested
  }

  const handleTyping = () => {
    setIsTyping(true)
    
    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }
    
    // Set new timeout to stop typing animation after 1 second of no input
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false)
    }, 1000)
  }

  const handleSubmit = async () => {
    if (!frontFaceImage || !sideFaceImage || !fullBodyImage) {
      setError('Please upload all three photos (front face, side face, and full body)')
      return
    }
    
    if (!prompt.trim()) {
      setError('Please describe what you want to create')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const formData = new FormData()
      
      // Compress and encode all three photos
      const compressedFront = await compressImage(frontFaceImage)
      const frontBase64 = await fileToBase64(compressedFront)
      formData.append('frontFaceImage', frontBase64)
      
      const compressedSide = await compressImage(sideFaceImage)
      const sideBase64 = await fileToBase64(compressedSide)
      formData.append('sideFaceImage', sideBase64)
      
      const compressedFull = await compressImage(fullBodyImage)
      const fullBase64 = await fileToBase64(compressedFull)
      formData.append('fullBodyImage', fullBase64)
      
      formData.append('description', prompt)

      const response = await fetch('/api/visualize', {
        method: 'POST',
        body: formData
      })

      const contentType = response.headers.get('content-type')
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Server error occurred')
      }

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate visualization')
      }

      setResults(data.images)
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const handleFrontFaceUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) setFrontFaceImage(file)
  }

  const handleSideFaceUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) setSideFaceImage(file)
  }

  const handleFullBodyUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) setFullBodyImage(file)
  }

  const handleCameraClick = (photoType: 'front' | 'side' | 'full') => {
    setCurrentPhotoType(photoType)
    setShowCamera(true)
  }

  const handleCameraCapture = (imageData: string) => {
    // Convert base64 to File object
    fetch(imageData)
      .then(res => res.blob())
      .then(blob => {
        const file = new File([blob], 'camera-photo.jpg', { type: 'image/jpeg' })
        if (currentPhotoType === 'front') {
          setFrontFaceImage(file)
        } else if (currentPhotoType === 'side') {
          setSideFaceImage(file)
        } else if (currentPhotoType === 'full') {
          setFullBodyImage(file)
        }
        setShowCamera(false)
        setCurrentPhotoType(null)
      })
  }

  const handleReset = () => {
    setResults([])
    setError(null)
    // Keep the uploaded photos and previous prompt so user can make small adjustments
  }

  const handleClearPhotos = () => {
    setFrontFaceImage(null)
    setSideFaceImage(null)
    setFullBodyImage(null)
    setResults([])
    setPrompt('')
    setError(null)
  }


  const handleDownload = (imageUrl: string) => {
    const link = document.createElement('a')
    link.href = imageUrl
    link.download = `diemsocial-generated-${Date.now()}.jpg`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }


  if (results.length > 0) {
    return (
      <div className="min-h-screen text-white" style={{ backgroundColor: '#101218' }}>
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-light">Your Generated Photo</h1>
            <div className="flex gap-2">
              <button 
                onClick={handleReset}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-full transition-colors"
              >
                Try Another
              </button>
              <button 
                onClick={handleClearPhotos}
                className="px-6 py-2 bg-gray-800 hover:bg-gray-700 rounded-full transition-colors"
              >
                New Photos
              </button>
            </div>
          </div>
          
          <div className="relative">
            <img src={results[0].url} alt="Generated" className="w-full rounded-lg" />
            
            {/* Download button overlay */}
            <button
              onClick={() => handleDownload(results[0].url)}
              className="absolute top-4 right-4 p-3 bg-black/70 hover:bg-black/90 rounded-full transition-all duration-200 hover:scale-110"
              title="Download image"
            >
              <Download className="w-6 h-6 text-white" />
            </button>
          </div>

          {/* Simple Message Interface */}
          <div className="mt-8">
            <div className="backdrop-blur-sm rounded-3xl border border-gray-700/30 p-4" style={{ backgroundColor: '#1D1E26' }}>
              <p className="text-gray-400 text-center">
                Want another look with the same photos? Click "Try Another" • Want to use different photos? Click "New Photos"
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <style jsx>{`
        .typing-pulse {
          animation: typingPulse 1.5s ease-in-out infinite;
          border-color: #3b82f6 !important;
        }
        
        @keyframes typingPulse {
          0%, 100% {
            box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.7);
          }
          50% {
            box-shadow: 0 0 0 8px rgba(59, 130, 246, 0);
          }
        }
      `}</style>
      <div className="min-h-screen text-white relative overflow-hidden" style={{ backgroundColor: '#101218' }}>
        {/* Background gradient */}
        <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, #101218 0%, #0f1117 50%, #101218 100%)' }}></div>
      
      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4">
        
        {/* Header */}
        <div className="mb-16 text-center">
          <h1 className="text-6xl font-bold mb-4 text-white">
            Meet DiemSocial
          </h1>
          <p className="text-xl font-semibold" style={{ color: '#7F8188' }}>
            Transform your photos with AI for stunning social media content
          </p>
        </div>

        {/* Main Input Area */}
        <div className="w-full max-w-2xl">
          {/* Photo Upload Section */}
          <div className="mb-6">
            <div className="grid grid-cols-3 gap-4">
              {/* Front Face Upload */}
              <div className="relative">
                <label className="cursor-pointer block">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFrontFaceUpload}
                    className="hidden"
                  />
                  <div className="backdrop-blur-sm rounded-xl border-2 border-dashed border-gray-600 p-4 hover:border-blue-500 transition-all text-center" style={{ backgroundColor: '#1D1E26' }}>
                    {frontFaceImage ? (
                      <img src={URL.createObjectURL(frontFaceImage)} alt="Front Face" className="w-full h-32 object-cover rounded-lg" />
                    ) : (
                      <div className="h-32 flex flex-col items-center justify-center">
                        <div className="w-12 h-12 rounded-full bg-gray-700 flex items-center justify-center text-gray-300 font-bold text-xl mb-2">1</div>
                        <p className="text-xs text-gray-400">Front Face</p>
                      </div>
                    )}
                  </div>
                </label>
                <button
                  onClick={() => handleCameraClick('front')}
                  className="absolute top-2 right-2 p-1.5 bg-black/70 hover:bg-black/90 rounded-full transition-all"
                >
                  <Camera className="w-4 h-4 text-white" />
                </button>
              </div>

              {/* Side Face Upload */}
              <div className="relative">
                <label className="cursor-pointer block">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleSideFaceUpload}
                    className="hidden"
                  />
                  <div className="backdrop-blur-sm rounded-xl border-2 border-dashed border-gray-600 p-4 hover:border-purple-500 transition-all text-center" style={{ backgroundColor: '#1D1E26' }}>
                    {sideFaceImage ? (
                      <img src={URL.createObjectURL(sideFaceImage)} alt="Side Face" className="w-full h-32 object-cover rounded-lg" />
                    ) : (
                      <div className="h-32 flex flex-col items-center justify-center">
                        <div className="w-12 h-12 rounded-full bg-gray-700 flex items-center justify-center text-gray-300 font-bold text-xl mb-2">2</div>
                        <p className="text-xs text-gray-400">Side Face</p>
                      </div>
                    )}
                  </div>
                </label>
                <button
                  onClick={() => handleCameraClick('side')}
                  className="absolute top-2 right-2 p-1.5 bg-black/70 hover:bg-black/90 rounded-full transition-all"
                >
                  <Camera className="w-4 h-4 text-white" />
                </button>
              </div>

              {/* Full Body Upload */}
              <div className="relative">
                <label className="cursor-pointer block">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFullBodyUpload}
                    className="hidden"
                  />
                  <div className="backdrop-blur-sm rounded-xl border-2 border-dashed border-gray-600 p-4 hover:border-green-500 transition-all text-center" style={{ backgroundColor: '#1D1E26' }}>
                    {fullBodyImage ? (
                      <img src={URL.createObjectURL(fullBodyImage)} alt="Full Body" className="w-full h-32 object-cover rounded-lg" />
                    ) : (
                      <div className="h-32 flex flex-col items-center justify-center">
                        <div className="w-12 h-12 rounded-full bg-gray-700 flex items-center justify-center text-gray-300 font-bold text-xl mb-2">3</div>
                        <p className="text-xs text-gray-400">Full Body</p>
                      </div>
                    )}
                  </div>
                </label>
                <button
                  onClick={() => handleCameraClick('full')}
                  className="absolute top-2 right-2 p-1.5 bg-black/70 hover:bg-black/90 rounded-full transition-all"
                >
                  <Camera className="w-4 h-4 text-white" />
                </button>
              </div>
            </div>
          </div>

          <div className="relative">
            {/* Input Container */}
            <div className={`relative backdrop-blur-sm rounded-3xl border border-gray-700/30 p-4 hover:border-gray-600/30 transition-all duration-300 animated-border ${showBorderAnimation ? 'active' : ''} ${isTyping ? 'typing-pulse' : ''}`} style={{ backgroundColor: '#1D1E26' }}>
              
              {/* File Previews */}
              {(frontFaceImage || sideFaceImage || fullBodyImage) && (
                <div className="flex gap-2 mb-4 pb-4 border-b border-gray-700/50">
                  {frontFaceImage && (
                    <div className="relative">
                      <img 
                        src={URL.createObjectURL(frontFaceImage)} 
                        alt="Front Face" 
                        className="w-16 h-16 object-cover rounded-lg"
                      />
                      <div className="absolute -top-2 -right-2 bg-blue-600 text-white text-[10px] px-2 py-1 rounded-full">
                        Front
                      </div>
                    </div>
                  )}
                  {sideFaceImage && (
                    <div className="relative">
                      <img 
                        src={URL.createObjectURL(sideFaceImage)} 
                        alt="Side Face" 
                        className="w-16 h-16 object-cover rounded-lg"
                      />
                      <div className="absolute -top-2 -right-2 bg-purple-600 text-white text-[10px] px-2 py-1 rounded-full">
                        Side
                      </div>
                    </div>
                  )}
                  {fullBodyImage && (
                    <div className="relative">
                      <img 
                        src={URL.createObjectURL(fullBodyImage)} 
                        alt="Full Body" 
                        className="w-16 h-16 object-cover rounded-lg"
                      />
                      <div className="absolute -top-2 -right-2 bg-green-600 text-white text-[10px] px-2 py-1 rounded-full">
                        Full
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Text Input */}
              <div className="flex items-center gap-4">
                <textarea
                  value={prompt}
                  onChange={(e) => {
                    setPrompt(e.target.value)
                    handleTyping()
                    // Auto-resize on content change
                    const target = e.target as HTMLTextAreaElement
                    target.style.height = 'auto'
                    target.style.height = Math.max(target.scrollHeight, 80) + 'px'
                  }}
                  onFocus={triggerBorderAnimation}
                  placeholder="Upload your photos and describe what you want to create..."
                  className="flex-1 bg-transparent text-white placeholder-gray-400 border-none outline-none resize-none text-lg py-6 overflow-hidden"
                  rows={1}
                  style={{ height: 'auto', minHeight: '80px' }}
                />
                
                {/* Action Buttons */}
                <div className="flex items-center gap-2">
                  {/* Submit Button */}
                  <button
                    onClick={handleSubmit}
                    disabled={isLoading || !frontFaceImage || !sideFaceImage || !fullBodyImage || !prompt.trim()}
                    className="p-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-xl transition-all duration-200 hover:scale-105"
                  >
                    {isLoading ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <ArrowUp className="w-5 h-5 text-white" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="mt-4 p-4 bg-red-900/20 border border-red-800/50 rounded-lg">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {/* Suggestions */}
          <div className="mt-8 space-y-2">
            {[
              'Make me wear a nice green dress, I look happy and I am in a fancy restaurant',
              'Put me in a business suit at a modern office with city views',
              'Casual beach outfit with sunset background, golden hour lighting'
            ].map((suggestion, index) => (
              <button
                key={index}
                onClick={() => setPrompt(suggestion)}
                className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
              >
                <Sparkles className="w-4 h-4" />
                {suggestion}
              </button>
            ))}
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-gray-800 rounded-2xl p-8 text-center">
              <div className="w-16 h-16 mx-auto mb-4 border-4 border-blue-600/30 border-t-blue-600 rounded-full animate-spin"></div>
              <p className="text-lg">Creating your perfect photo...</p>
              <p className="text-sm text-gray-400 mt-2">This may take 15-30 seconds</p>
            </div>
          </div>
        )}

        {/* Camera Capture Modal */}
        {showCamera && (
          <CameraCapture
            onCapture={handleCameraCapture}
            onClose={() => setShowCamera(false)}
          />
        )}
        </div>
      </div>
    </>
  )
}