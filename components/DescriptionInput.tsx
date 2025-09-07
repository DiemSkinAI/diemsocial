'use client'

import React from 'react'
import { FileText } from 'lucide-react'

interface DescriptionInputProps {
  value: string
  onChange: (value: string) => void
  hasInspirationImage?: boolean
}

const MATERIAL_SUGGESTIONS = [
  'White marble with grey veining',
  'Black granite with gold flecks',
  'White quartz with minimal pattern',
  'Butcher block wood countertop',
  'Concrete with smooth finish',
  'Calacatta gold marble',
  'Dark emperador marble',
  'Caesarstone pure white'
]

export default function DescriptionInput({ value, onChange, hasInspirationImage = false }: DescriptionInputProps) {
  const handleSuggestionClick = (suggestion: string) => {
    onChange(value ? `${value}. ${suggestion}` : suggestion)
  }

  if (hasInspirationImage) {
    return (
      <div className="w-full">
        <h2 className="text-xl font-semibold mb-2">AI Material Detection</h2>
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
          <p className="text-blue-800 dark:text-blue-400 text-sm">
            ✨ With an inspiration photo uploaded, our AI will automatically identify the stone material and apply it to your room photo. No description needed!
          </p>
        </div>
        
        <div className="space-y-4">
          <div className="relative">
            <FileText className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <textarea
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder="Optional: Add specific details or preferences (e.g., 'Make it more polished', 'Add more veining')..."
              className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows={2}
            />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full">
      <h2 className="text-xl font-semibold mb-2">Describe Your Vision</h2>
      <p className="text-sm text-gray-600 mb-4">
        Tell us what countertop material and style you want
      </p>

      <div className="space-y-4">
        <div className="relative">
          <FileText className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Example: I want white marble countertops with subtle grey veining, similar to Carrara marble. The edges should be smooth and modern..."
            className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            rows={4}
          />
        </div>

        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">Quick suggestions:</p>
          <div className="flex flex-wrap gap-2">
            {MATERIAL_SUGGESTIONS.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => handleSuggestionClick(suggestion)}
                className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
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