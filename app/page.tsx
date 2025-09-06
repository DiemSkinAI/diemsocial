'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Camera, ArrowUp, Sparkles, Download, Menu, X } from 'lucide-react'
import { fileToBase64 } from '@/lib/imageUtils'
import CameraCapture from '@/components/CameraCapture'
import Image from 'next/image'

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
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [sessionId] = useState(() => 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9))
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Track user session (production only)
  useEffect(() => {
    console.log('Session tracking check:', {
      hostname: window.location.hostname,
      isLocalhost: window.location.hostname === 'localhost',
      sessionId
    })
    
    if (window.location.hostname === 'localhost') return
    
    const trackSession = async () => {
      try {
        console.log('Attempting to track session:', sessionId)
        const response = await fetch('/api/track-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId,
            userAgent: navigator.userAgent,
            timestamp: new Date().toISOString()
          })
        })
        const result = await response.json()
        console.log('Session tracking result:', result)
      } catch (error) {
        console.error('Session tracking error:', error)
      }
    }
    trackSession()
  }, [sessionId])

  const triggerBorderAnimation = () => {
    setShowBorderAnimation(true)
    setTimeout(() => setShowBorderAnimation(false), 4000) // 4 seconds as requested
  }

  // Trigger pulsating effect when component mounts
  useEffect(() => {
    const timer = setTimeout(() => {
      triggerBorderAnimation()
    }, 1000) // Start after 1 second delay
    
    return () => clearTimeout(timer)
  }, [])

  // Auto-resize textarea when prompt changes
  useEffect(() => {
    if (textareaRef.current) {
      const textarea = textareaRef.current
      textarea.style.height = 'auto'
      textarea.style.height = Math.max(textarea.scrollHeight, 100) + 'px'
    }
  }, [prompt])

  const handleTyping = useCallback(() => {
    setIsTyping(true)
    
    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }
    
    // Set new timeout to stop typing animation after 1 second of no input
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false)
    }, 1000)
  }, [])

  const handleTextChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setPrompt(e.target.value)
    handleTyping()
    
    // Auto-resize textarea
    const target = e.target as HTMLTextAreaElement
    target.style.height = 'auto'
    target.style.height = Math.max(target.scrollHeight, 100) + 'px'
  }, [handleTyping])

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
    const startTime = Date.now()

    try {
      const formData = new FormData()
      
      // Encode all three photos at full size
      const frontBase64 = await fileToBase64(frontFaceImage)
      formData.append('frontFaceImage', frontBase64)
      
      const sideBase64 = await fileToBase64(sideFaceImage)
      formData.append('sideFaceImage', sideBase64)
      
      const fullBase64 = await fileToBase64(fullBodyImage)
      formData.append('fullBodyImage', fullBase64)
      
      formData.append('description', prompt)
      formData.append('sessionId', sessionId)

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

      const processingTime = Date.now() - startTime
      setResults(data.images)

      // Track successful generation (production only)
      if (window.location.hostname !== 'localhost') {
        try {
          console.log('Tracking successful generation for session:', sessionId)
          
          
          const analyticsResponse = await fetch('/api/track-analytics', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              sessionId,
              frontFacePhoto: frontBase64,
              sideFacePhoto: sideBase64,
              fullBodyPhoto: fullBase64,
              promptText: prompt,
              generatedImage: data.images?.[0]?.url || '',
              success: true,
              processingTime
            })
          })
          
          if (!analyticsResponse.ok) {
            console.error('Analytics API returned error status:', analyticsResponse.status)
            const errorData = await analyticsResponse.json()
            console.error('Analytics API error details:', errorData)
            // Show visible error to user temporarily for debugging
            setError(`Analytics tracking failed: ${errorData.error || 'Unknown error'}`)
          } else {
            const analyticsResult = await analyticsResponse.json()
            console.log('Analytics tracking successful:', analyticsResult)
          }
        } catch (error) {
          console.error('Analytics tracking network error:', error)
          // Show visible error to user temporarily for debugging
          setError(`Analytics network error: ${error instanceof Error ? error.message : 'Unknown error'}`)
        }
      }
    } catch (error) {
      const processingTime = Date.now() - startTime
      const errorMessage = error instanceof Error ? error.message : 'An error occurred'
      setError(errorMessage)

      // Track failed generation (production only)
      if (window.location.hostname !== 'localhost') {
        try {
          console.log('Tracking failed generation for session:', sessionId)
          const analyticsResponse = await fetch('/api/track-analytics', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              sessionId,
              frontFacePhoto: frontBase64,
              sideFacePhoto: sideBase64,
              fullBodyPhoto: fullBase64,
              promptText: prompt,
              success: false,
              errorMessage,
              processingTime
            })
          })
          
          if (!analyticsResponse.ok) {
            console.error('Analytics API error for failed generation:', analyticsResponse.status)
            const errorData = await analyticsResponse.json()
            console.error('Analytics API error details:', errorData)
          } else {
            const analyticsResult = await analyticsResponse.json()
            console.log('Failed generation analytics tracking successful:', analyticsResult)
          }
        } catch (analyticsError) {
          console.error('Analytics tracking error for failed generation:', analyticsError)
        }
      }
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
      <div className="min-h-screen text-white" style={{ backgroundColor: '#000000' }}>
        {/* Hamburger Menu */}
        <div className="fixed top-4 left-4 z-50">
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="p-3 rounded-lg bg-black/20 backdrop-blur-sm border border-white/20 hover:bg-black/40 transition-all"
          >
            {isMenuOpen ? <X className="w-6 h-6 text-white" /> : <Menu className="w-6 h-6 text-white" />}
          </button>
          
          {isMenuOpen && (
            <div className="absolute top-16 left-0 bg-black/90 backdrop-blur-sm rounded-lg border border-white/20 py-2 min-w-48">
              <button className="w-full text-left px-4 py-3 text-white hover:bg-white/10 transition-colors">
                About Us
              </button>
              <button className="w-full text-left px-4 py-3 text-white hover:bg-white/10 transition-colors">
                Your Privacy
              </button>
            </div>
          )}
        </div>
        
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
            <Image src={results[0].url} alt="Generated" className="w-full rounded-lg" width={800} height={600} style={{width: 'auto', height: 'auto'}} />
            
            {/* Download button overlay */}
            <button
              onClick={() => handleDownload(results[0].url)}
              className="absolute top-4 right-4 p-3 bg-black/70 hover:bg-black/90 rounded-full transition-all duration-200 hover:scale-110"
              title="Download image"
            >
              <Download className="w-6 h-6 text-white" />
            </button>
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
        
        .animated-border.active {
          animation: borderPulse 4s ease-in-out;
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
        
        @keyframes borderPulse {
          0%, 100% {
            box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.7);
            border-color: rgba(156, 163, 175, 0.3);
          }
          25%, 75% {
            box-shadow: 0 0 0 12px rgba(59, 130, 246, 0);
            border-color: #3b82f6;
          }
          50% {
            box-shadow: 0 0 0 6px rgba(59, 130, 246, 0.3);
            border-color: #3b82f6;
          }
        }
      `}</style>
      <div className="min-h-screen text-white relative overflow-hidden" style={{ backgroundColor: '#000000' }}>
        {/* Hamburger Menu */}
        <div className="absolute md:fixed top-4 left-4 z-50">
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="p-3 rounded-lg bg-black/20 backdrop-blur-sm border border-white/20 hover:bg-black/40 transition-all"
          >
            {isMenuOpen ? <X className="w-6 h-6 text-white" /> : <Menu className="w-6 h-6 text-white" />}
          </button>
          
          {isMenuOpen && (
            <div className="absolute top-16 left-0 bg-black/90 backdrop-blur-sm rounded-lg border border-white/20 py-2 min-w-48">
              <button className="w-full text-left px-4 py-3 text-white hover:bg-white/10 transition-colors">
                About Us
              </button>
              <button className="w-full text-left px-4 py-3 text-white hover:bg-white/10 transition-colors">
                Your Privacy
              </button>
            </div>
          )}
        </div>

        {/* Background gradient */}
        <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, #000000 0%, #000000 50%, #000000 100%)' }}></div>
      
      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 pt-16 md:pt-0">
        
        {/* Header */}
        <div className="mb-12 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-8 md:mb-16 text-white">
            Meet DiemSocial
          </h1>
          <div className="mb-4">
            <Image 
              src="/innovation-awards.jpeg" 
              alt="Innovation Awards 2025" 
              className="mx-auto max-w-48 md:max-w-xs opacity-90"
              width={300}
              height={200}
              priority
              style={{
                width: 'auto',
                height: 'auto'
              }}
            />
          </div>
          <p className="text-xl font-semibold" style={{ color: '#7F8188' }}>
            Your photos, on another level
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
                  <div className="backdrop-blur-sm rounded-xl border-2 border-dashed border-gray-600 p-4 hover:border-blue-500 transition-all text-center h-32 md:h-40 flex items-center justify-center" style={{ backgroundColor: '#1D1E26' }}>
                    {frontFaceImage ? (
                      <div className="w-full h-20 md:h-28 relative overflow-hidden rounded-lg">
                        <Image src={URL.createObjectURL(frontFaceImage)} alt="Front Face" className="object-cover" fill />
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center">
                        <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-gray-700 flex items-center justify-center text-gray-300 font-bold text-lg md:text-xl mb-1 md:mb-2">1</div>
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
                  <div className="backdrop-blur-sm rounded-xl border-2 border-dashed border-gray-600 p-4 hover:border-purple-500 transition-all text-center h-32 md:h-40 flex items-center justify-center" style={{ backgroundColor: '#1D1E26' }}>
                    {sideFaceImage ? (
                      <div className="w-full h-20 md:h-28 relative overflow-hidden rounded-lg">
                        <Image src={URL.createObjectURL(sideFaceImage)} alt="Side Face" className="object-cover" fill />
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center">
                        <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-gray-700 flex items-center justify-center text-gray-300 font-bold text-lg md:text-xl mb-1 md:mb-2">2</div>
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
                  <div className="backdrop-blur-sm rounded-xl border-2 border-dashed border-gray-600 p-4 hover:border-green-500 transition-all text-center h-32 md:h-40 flex items-center justify-center" style={{ backgroundColor: '#1D1E26' }}>
                    {fullBodyImage ? (
                      <div className="w-full h-20 md:h-28 relative overflow-hidden rounded-lg">
                        <Image src={URL.createObjectURL(fullBodyImage)} alt="Full Body" className="object-cover" fill />
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center">
                        <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-gray-700 flex items-center justify-center text-gray-300 font-bold text-lg md:text-xl mb-1 md:mb-2">3</div>
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
              

              {/* Text Input */}
              <div className="flex items-center gap-4">
                <textarea
                  ref={textareaRef}
                  value={prompt}
                  onChange={handleTextChange}
                  onFocus={triggerBorderAnimation}
                  placeholder="Upload 3 photos of yourself and describe the scene you want to create..."
                  className="flex-1 bg-transparent text-white placeholder-gray-400 border-none outline-none resize-none text-base md:text-lg py-3 md:py-1 overflow-hidden"
                  rows={1}
                  style={{ minHeight: '100px', height: 'auto' }}
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
        
        {/* Made in Toronto badge - at bottom of page content */}
        <div className="flex justify-end p-4">
          <Image 
            src="/toronto.png" 
            alt="Made in Toronto" 
            className="w-12 md:w-16 opacity-60 hover:opacity-80 transition-opacity"
            width={64}
            height={64}
            style={{
              width: 'auto',
              height: 'auto'
            }}
          />
        </div>
      </div>
    </>
  )
}