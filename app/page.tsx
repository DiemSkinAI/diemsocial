'use client'

import { useState } from 'react'
import { Upload, Camera, Mic, ArrowUp, Sparkles } from 'lucide-react'
import { compressImage, fileToBase64 } from '@/lib/imageUtils'
import BeforeAfterSlider from '@/components/BeforeAfterSlider'

export default function Home() {
  const [roomImage, setRoomImage] = useState<File | null>(null)
  const [inspirationImage, setInspirationImage] = useState<File | null>(null)
  const [prompt, setPrompt] = useState('')
  const [results, setResults] = useState<Array<{ url: string }>>([])
  const [originalImageUrl, setOriginalImageUrl] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [refinementPrompt, setRefinementPrompt] = useState('')
  const [isRefining, setIsRefining] = useState(false)

  const handleSubmit = async () => {
    if (!roomImage) {
      setError('Please upload a room photo')
      return
    }
    
    if (!prompt.trim()) {
      setError('Please describe what changes you want')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const formData = new FormData()
      
      if (roomImage) {
        const compressedRoom = await compressImage(roomImage)
        const roomBase64 = await fileToBase64(compressedRoom)
        setOriginalImageUrl(roomBase64)
        formData.append('roomImage', roomBase64)
      }
      
      if (inspirationImage) {
        const compressedInspiration = await compressImage(inspirationImage)
        const inspirationBase64 = await fileToBase64(compressedInspiration)
        formData.append('inspirationImage', inspirationBase64)
      }
      
      formData.append('description', prompt || 'auto-detect-from-inspiration')

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

  const handleRoomImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) setRoomImage(file)
  }

  const handleInspirationUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) setInspirationImage(file)
  }

  const handleReset = () => {
    setResults([])
    setRoomImage(null)
    setInspirationImage(null)
    setPrompt('')
    setOriginalImageUrl('')
    setError(null)
    setRefinementPrompt('')
  }

  const handleRefinement = async () => {
    if (!refinementPrompt.trim() || results.length === 0) {
      setError('Please enter refinement instructions')
      return
    }

    setIsRefining(true)
    setError(null)

    try {
      const formData = new FormData()
      
      // Use the AFTER image (latest result) as the new room image
      formData.append('roomImage', results[0].url)
      formData.append('description', refinementPrompt)

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
        throw new Error(data.error || 'Failed to refine visualization')
      }

      // Update results with new refined image
      setResults(data.images)
      setRefinementPrompt('')
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred during refinement')
    } finally {
      setIsRefining(false)
    }
  }

  if (results.length > 0) {
    return (
      <div className="min-h-screen bg-gray-900 text-white">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-light">Your Visualization</h1>
            <button 
              onClick={handleReset}
              className="px-6 py-2 bg-gray-800 hover:bg-gray-700 rounded-full transition-colors"
            >
              Try Another
            </button>
          </div>
          
          {originalImageUrl ? (
            <div className="w-full">
              <BeforeAfterSlider 
                beforeImage={originalImageUrl}
                afterImage={results[0].url}
                className="w-full h-auto"
              />
            </div>
          ) : (
            <div>
              <h3 className="text-lg mb-4 text-gray-400">Generated Result</h3>
              <img src={results[0].url} alt="Generated" className="w-full rounded-lg" />
            </div>
          )}

          {/* Chat Interface for Refinements */}
          <div className="mt-8">
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-3xl border border-gray-700/50 p-4">
              <div className="flex items-center gap-4">
                <textarea
                  value={refinementPrompt}
                  onChange={(e) => setRefinementPrompt(e.target.value)}
                  placeholder="Any changes you'd like? (e.g., 'Make it darker', 'Add more veining', 'Change the backsplash')"
                  className="flex-1 bg-transparent text-white placeholder-gray-400 border-none outline-none resize-none text-base min-h-[50px] py-3"
                  rows={1}
                  style={{ height: 'auto' }}
                  onInput={(e) => {
                    const target = e.target as HTMLTextAreaElement
                    target.style.height = 'auto'
                    target.style.height = target.scrollHeight + 'px'
                  }}
                />
                
                <button
                  onClick={handleRefinement}
                  disabled={isRefining || !refinementPrompt.trim()}
                  className="p-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-xl transition-all duration-200 hover:scale-105"
                >
                  {isRefining ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <ArrowUp className="w-5 h-5 text-white" />
                  )}
                </button>
              </div>
            </div>

            {/* Error Display for Refinements */}
            {error && (
              <div className="mt-4 p-4 bg-red-900/20 border border-red-800/50 rounded-lg">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            {/* Quick Refinement Suggestions */}
            <div className="mt-4 flex flex-wrap gap-2">
              {[
                'Make it darker',
                'Add more veining',
                'Make it more polished',
                'Less veining',
                'Change the backsplash too'
              ].map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => setRefinementPrompt(suggestion)}
                  className="px-3 py-2 text-sm bg-gray-800/50 hover:bg-gray-700/50 border border-gray-600/50 rounded-full transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900"></div>
      
      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4">
        
        {/* Header */}
        <div className="mb-16 text-center">
          <h1 className="text-6xl font-light mb-4 bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
            Meet DiemVision
          </h1>
          <p className="text-xl text-gray-400 font-light">
            Transform your kitchen countertops with AI
          </p>
        </div>

        {/* Main Input Area */}
        <div className="w-full max-w-2xl">
          <div className="relative">
            {/* Input Container */}
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-3xl border border-gray-700/50 p-4 hover:border-gray-600/50 transition-all duration-300">
              
              {/* File Previews */}
              {(roomImage || inspirationImage) && (
                <div className="flex gap-2 mb-4 pb-4 border-b border-gray-700/50">
                  {roomImage && (
                    <div className="relative">
                      <img 
                        src={URL.createObjectURL(roomImage)} 
                        alt="Room" 
                        className="w-16 h-16 object-cover rounded-lg"
                      />
                      <div className="absolute -top-2 -right-2 bg-blue-600 text-white text-xs px-2 py-1 rounded-full">
                        Room
                      </div>
                    </div>
                  )}
                  {inspirationImage && (
                    <div className="relative">
                      <img 
                        src={URL.createObjectURL(inspirationImage)} 
                        alt="Inspiration" 
                        className="w-16 h-16 object-cover rounded-lg"
                      />
                      <div className="absolute -top-2 -right-2 bg-green-600 text-white text-xs px-2 py-1 rounded-full">
                        Style
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Text Input */}
              <div className="flex items-center gap-4">
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Describe your dream countertop or upload photos..."
                  className="flex-1 bg-transparent text-white placeholder-gray-400 border-none outline-none resize-none text-lg min-h-[60px] py-4"
                  rows={1}
                  style={{ height: 'auto' }}
                  onInput={(e) => {
                    const target = e.target as HTMLTextAreaElement
                    target.style.height = 'auto'
                    target.style.height = target.scrollHeight + 'px'
                  }}
                />
                
                {/* Action Buttons */}
                <div className="flex items-center gap-2">
                  {/* Upload Room Photo */}
                  <label className="cursor-pointer p-2 hover:bg-gray-700/50 rounded-lg transition-colors">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleRoomImageUpload}
                      className="hidden"
                    />
                    <Camera className="w-6 h-6 text-gray-400 hover:text-white transition-colors" />
                  </label>

                  {/* Upload Inspiration */}
                  <label className="cursor-pointer p-2 hover:bg-gray-700/50 rounded-lg transition-colors">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleInspirationUpload}
                      className="hidden"
                    />
                    <Upload className="w-6 h-6 text-gray-400 hover:text-white transition-colors" />
                  </label>

                  {/* Submit Button */}
                  <button
                    onClick={handleSubmit}
                    disabled={isLoading || !roomImage || !prompt.trim()}
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
              'White Carrara marble countertops with gray veining',
              'Black granite island with waterfall edge',
              'Transform my backsplash to match new countertops'
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
              <p className="text-lg">Creating your visualization...</p>
              <p className="text-sm text-gray-400 mt-2">This may take 15-30 seconds</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}