import { NextRequest, NextResponse } from 'next/server'
import { insertUserAnalytics } from '@/lib/database'

export async function POST(request: NextRequest) {
  try {
    const analyticsData = await request.json()

    await insertUserAnalytics({
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

    return NextResponse.json({ success: true })
  } catch (error) {
    // Log detailed error for debugging
    console.error('Analytics tracking failed:', error)
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      code: (error as { code?: string })?.code,
      detail: (error as { detail?: string })?.detail
    })
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Database connection error'
    }, { status: 200 })
  }
}
