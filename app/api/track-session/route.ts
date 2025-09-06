import { NextRequest, NextResponse } from 'next/server'
import { insertUserSession } from '@/lib/database'

export async function POST(request: NextRequest) {
  try {
    const { sessionId, userAgent, timestamp } = await request.json()
    
    // Get IP address
    const ip = request.ip || 
              request.headers.get('x-forwarded-for')?.split(',')[0] || 
              request.headers.get('x-real-ip') || 
              'unknown'

    await insertUserSession({
      sessionId,
      userAgent,
      ipAddress: ip
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    // Silently fail if database is not available
    console.log('Session tracking failed:', error)
    return NextResponse.json({ success: false }, { status: 200 })
  }
}
