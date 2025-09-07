import { NextRequest, NextResponse } from 'next/server'
import { getPool } from '@/lib/database'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = (page - 1) * limit

    const client = getPool()
    
    // Get total count
    const countResult = await client.query(`
      SELECT COUNT(*) FROM user_analytics
    `)
    const total = parseInt(countResult.rows[0].count)

    // Get analytics data with session info
    const result = await client.query(`
      SELECT 
        ua.*,
        us.user_agent,
        us.ip_address,
        us.timestamp as session_timestamp
      FROM user_analytics ua
      LEFT JOIN user_sessions us ON ua.session_id = us.session_id
      ORDER BY ua.timestamp DESC
      LIMIT $1 OFFSET $2
    `, [limit, offset])

    return NextResponse.json({
      success: true,
      data: result.rows,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching analytics:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch analytics' },
      { status: 500 }
    )
  }
}
