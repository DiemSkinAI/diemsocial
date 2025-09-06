import { NextRequest, NextResponse } from 'next/server'
import { insertUserAnalytics } from '@/lib/database'
import { uploadBase64ImageToStorage } from '@/lib/supabase'

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

    // Upload images to Supabase storage and get URLs
    let frontFacePhotoUrl = null
    let sideFacePhotoUrl = null
    let fullBodyPhotoUrl = null
    let generatedImageUrl = null

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const sessionPrefix = `${analyticsData.sessionId}_${timestamp}`

    if (analyticsData.frontFacePhoto) {
      frontFacePhotoUrl = await uploadBase64ImageToStorage(
        analyticsData.frontFacePhoto,
        `${sessionPrefix}_front_face.jpg`
      )
    }

    if (analyticsData.sideFacePhoto) {
      sideFacePhotoUrl = await uploadBase64ImageToStorage(
        analyticsData.sideFacePhoto,
        `${sessionPrefix}_side_face.jpg`
      )
    }

    if (analyticsData.fullBodyPhoto) {
      fullBodyPhotoUrl = await uploadBase64ImageToStorage(
        analyticsData.fullBodyPhoto,
        `${sessionPrefix}_full_body.jpg`
      )
    }

    if (analyticsData.generatedImage) {
      generatedImageUrl = await uploadBase64ImageToStorage(
        analyticsData.generatedImage,
        `${sessionPrefix}_generated.jpg`
      )
    }

    const result = await insertUserAnalytics({
      sessionId: analyticsData.sessionId,
      frontFacePhoto: frontFacePhotoUrl || undefined,
      sideFacePhoto: sideFacePhotoUrl || undefined,
      fullBodyPhoto: fullBodyPhotoUrl || undefined,
      promptText: analyticsData.promptText,
      generatedImage: generatedImageUrl || undefined,
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
