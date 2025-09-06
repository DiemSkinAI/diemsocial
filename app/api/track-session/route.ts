import { NextRequest, NextResponse } from 'next/server'
import { insertUserSession } from '@/lib/database'

export async function POST(request: NextRequest) {
  try {
    const { sessionId, userAgent } = await request.json()
    
    // Get IP address
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 
              request.headers.get('x-real-ip') || 
              'unknown'

    await insertUserSession({
      sessionId,
      userAgent,
      ipAddress: ip
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    // Log detailed error for debugging
    console.error('Session tracking failed:', error)
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
