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
    // Silently fail if database is not available
    console.log('Analytics tracking failed:', error)
    return NextResponse.json({ success: false }, { status: 200 })
  }
}
