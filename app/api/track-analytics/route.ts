import { NextRequest, NextResponse } from 'next/server'
import { insertUserAnalytics } from '@/lib/database'

export async function POST(request: NextRequest) {
  try {
    console.log('Analytics API called at:', new Date().toISOString())
    const analyticsData = await request.json()
    console.log('Analytics data received:', {
      sessionId: analyticsData.sessionId,
      hasPhotos: !!(analyticsData.frontFacePhoto && analyticsData.sideFacePhoto && analyticsData.fullBodyPhoto),
      promptLength: analyticsData.promptText?.length,
      success: analyticsData.success,
      processingTime: analyticsData.processingTime
    })

    const result = await insertUserAnalytics({
      sessionId: analyticsData.sessionId,
      frontFacePhoto: analyticsData.frontFacePhoto,
      sideFacePhoto: analyticsData.sideFacePhoto,
      fullBodyPhoto: analyticsData.fullBodyPhoto,
      promptText: analyticsData.promptText,
      generatedImage: analyticsData.generatedImage,
      success: analyticsData.success,
      errorMessage: analyticsData.errorMessage,
      processingTime: analyticsData.processingTime
    })

    console.log('Analytics data inserted successfully:', result?.id || 'no id returned')
    return NextResponse.json({ success: true, insertedId: result?.id })
  } catch (error) {
    // Log detailed error for debugging
    console.error('Analytics tracking failed:', error)
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      code: (error as { code?: string })?.code,
      detail: (error as { detail?: string })?.detail,
      stack: error instanceof Error ? error.stack : undefined
    })
    
    // Return proper error status code instead of 200
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Database connection error',
      details: {
        code: (error as { code?: string })?.code,
        detail: (error as { detail?: string })?.detail
      }
    }, { status: 500 })
  }
}
