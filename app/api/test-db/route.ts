import { NextResponse } from 'next/server'
import { getPool } from '@/lib/database'

export async function GET() {
  try {
    const pool = getPool()
    
    // Test database connection
    const result = await pool.query('SELECT NOW() as current_time, COUNT(*) as session_count FROM user_sessions')
    
    return NextResponse.json({
      success: true,
      database: 'connected',
      currentTime: result.rows[0].current_time,
      sessionCount: result.rows[0].session_count,
      message: 'Database connection successful'
    })
  } catch (error) {
    console.error('Database test error:', error)
    return NextResponse.json({
      success: false,
      database: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Database connection failed'
    }, { status: 500 })
  }
}
