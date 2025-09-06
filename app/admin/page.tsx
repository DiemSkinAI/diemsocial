'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'

interface AnalyticsData {
  id: number
  session_id: string
  front_face_photo?: string
  side_face_photo?: string
  full_body_photo?: string
  prompt_text?: string
  generated_image?: string
  success: boolean
  error_message?: string
  processing_time?: number
  timestamp: string
  user_agent?: string
  ip_address?: string
}

export default function AdminDashboard() {
  const [analytics, setAnalytics] = useState<AnalyticsData[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedEntry, setSelectedEntry] = useState<AnalyticsData | null>(null)

  useEffect(() => {
    fetchAnalytics()
  }, [])

  const fetchAnalytics = async () => {
    try {
      const response = await fetch('/api/admin/analytics')
      const data = await response.json()
      if (data.success) {
        setAnalytics(data.data)
      }
    } catch (error) {
      console.error('Error fetching analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  const initializeDatabase = async () => {
    try {
      const response = await fetch('/api/init-db', { method: 'POST' })
      const data = await response.json()
      if (data.success) {
        alert('Database initialized successfully!')
        fetchAnalytics()
      } else {
        alert('Failed to initialize database')
      }
    } catch (error) {
      console.error('Error initializing database:', error)
      alert('Error initializing database')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-xl">Loading analytics...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">DiemVision Analytics Dashboard</h1>
          <button
            onClick={initializeDatabase}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Initialize Database
          </button>
        </div>

        {analytics.length === 0 ? (
          <div className="bg-white rounded-lg p-8 text-center">
            <p className="text-gray-600">No analytics data yet. Try initializing the database first.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Analytics List */}
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b">
                <h2 className="text-xl font-semibold">User Sessions ({analytics.length})</h2>
              </div>
              <div className="max-h-96 overflow-y-auto">
                {analytics.map((entry) => (
                  <div
                    key={entry.id}
                    className={`p-4 border-b cursor-pointer hover:bg-gray-50 ${
                      selectedEntry?.id === entry.id ? 'bg-blue-50' : ''
                    }`}
                    onClick={() => setSelectedEntry(entry)}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">
                          {entry.prompt_text ? entry.prompt_text.substring(0, 50) + '...' : 'No prompt'}
                        </p>
                        <p className="text-sm text-gray-500">
                          {new Date(entry.timestamp).toLocaleString()}
                        </p>
                      </div>
                      <div className={`px-2 py-1 rounded text-xs ${
                        entry.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {entry.success ? 'Success' : 'Failed'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Selected Entry Details */}
            <div className="bg-white rounded-lg shadow">
              {selectedEntry ? (
                <div className="p-6">
                  <h2 className="text-xl font-semibold mb-4">Session Details</h2>
                  
                  {/* User Photos */}
                  <div className="mb-6">
                    <h3 className="font-medium mb-2">User Photos</h3>
                    <div className="grid grid-cols-3 gap-2">
                      {selectedEntry.front_face_photo && (
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Front Face</p>
                          {selectedEntry.front_face_photo.includes('[truncated]') ? (
                            <div className="w-full h-24 bg-gray-200 rounded flex items-center justify-center text-xs text-gray-500">
                              No preview
                            </div>
                          ) : (
                            /* eslint-disable-next-line @next/next/no-img-element */
                            <img
                              src={selectedEntry.front_face_photo}
                              alt="Front Face"
                              className="w-full h-24 object-cover rounded"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement
                                target.style.display = 'none'
                                target.parentElement?.insertAdjacentHTML('beforeend', 
                                  '<div class="w-full h-24 bg-gray-200 rounded flex items-center justify-center text-xs text-gray-500">Invalid image</div>')
                              }}
                            />
                          )}
                        </div>
                      )}
                      {selectedEntry.side_face_photo && (
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Side Face</p>
                          {selectedEntry.side_face_photo.includes('[truncated]') ? (
                            <div className="w-full h-24 bg-gray-200 rounded flex items-center justify-center text-xs text-gray-500">
                              No preview
                            </div>
                          ) : (
                            /* eslint-disable-next-line @next/next/no-img-element */
                            <img
                              src={selectedEntry.side_face_photo}
                              alt="Side Face"
                              className="w-full h-24 object-cover rounded"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement
                                target.style.display = 'none'
                                target.parentElement?.insertAdjacentHTML('beforeend', 
                                  '<div class="w-full h-24 bg-gray-200 rounded flex items-center justify-center text-xs text-gray-500">Invalid image</div>')
                              }}
                            />
                          )}
                        </div>
                      )}
                      {selectedEntry.full_body_photo && (
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Full Body</p>
                          {selectedEntry.full_body_photo.includes('[truncated]') ? (
                            <div className="w-full h-24 bg-gray-200 rounded flex items-center justify-center text-xs text-gray-500">
                              No preview
                            </div>
                          ) : (
                            /* eslint-disable-next-line @next/next/no-img-element */
                            <img
                              src={selectedEntry.full_body_photo}
                              alt="Full Body"
                              className="w-full h-24 object-cover rounded"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement
                                target.style.display = 'none'
                                target.parentElement?.insertAdjacentHTML('beforeend', 
                                  '<div class="w-full h-24 bg-gray-200 rounded flex items-center justify-center text-xs text-gray-500">Invalid image</div>')
                              }}
                            />
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* User Prompt */}
                  <div className="mb-6">
                    <h3 className="font-medium mb-2">User Prompt</h3>
                    <p className="text-gray-700 bg-gray-50 p-3 rounded">
                      {selectedEntry.prompt_text || 'No prompt provided'}
                    </p>
                  </div>

                  {/* Generated Image */}
                  {selectedEntry.generated_image && (
                    <div className="mb-6">
                      <h3 className="font-medium mb-2">Generated Result</h3>
                      {selectedEntry.generated_image.includes('[truncated]') ? (
                        <div className="w-full max-w-md h-64 bg-gray-200 rounded flex items-center justify-center text-gray-500">
                          No preview available
                        </div>
                      ) : (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={selectedEntry.generated_image}
                          alt="Generated"
                          className="w-full max-w-md rounded"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement
                            target.style.display = 'none'
                            target.parentElement?.insertAdjacentHTML('beforeend', 
                              '<div class="w-full max-w-md h-64 bg-gray-200 rounded flex items-center justify-center text-gray-500">Invalid image</div>')
                          }}
                        />
                      )}
                    </div>
                  )}

                  {/* Metadata */}
                  <div className="space-y-2 text-sm">
                    <p><span className="font-medium">Status:</span> {selectedEntry.success ? '✅ Success' : '❌ Failed'}</p>
                    <p><span className="font-medium">Processing Time:</span> {selectedEntry.processing_time ? `${selectedEntry.processing_time}ms` : 'N/A'}</p>
                    <p><span className="font-medium">Session ID:</span> {selectedEntry.session_id}</p>
                    <p><span className="font-medium">IP Address:</span> {selectedEntry.ip_address || 'Unknown'}</p>
                    <p><span className="font-medium">Timestamp:</span> {new Date(selectedEntry.timestamp).toLocaleString()}</p>
                    {selectedEntry.error_message && (
                      <p><span className="font-medium text-red-600">Error:</span> {selectedEntry.error_message}</p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="p-6 text-center text-gray-500">
                  Select a session to view details
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
