import { NextResponse } from 'next/server'
import { getPool, insertUserSession, insertUserAnalytics } from '@/lib/database'

export async function GET() {
  const diagnostics = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    databaseUrl: process.env.DATABASE_URL ? 'SET' : 'NOT SET',
    databaseUrlPreview: process.env.DATABASE_URL ? 
      `${process.env.DATABASE_URL.substring(0, 20)}...` : 'NOT SET',
    tests: [] as Array<{name: string, status: string, error?: string, result?: any}>
  }

  // Test 1: Environment variables
  diagnostics.tests.push({
    name: 'Environment Variables',
    status: process.env.DATABASE_URL ? 'PASS' : 'FAIL',
    error: process.env.DATABASE_URL ? undefined : 'DATABASE_URL not set'
  })

  if (!process.env.DATABASE_URL) {
    return NextResponse.json({
      success: false,
      database: 'configuration_error',
      diagnostics,
      message: 'DATABASE_URL environment variable is not set'
    }, { status: 500 })
  }

  try {
    const pool = getPool()
    
    // Test 2: Basic connection
    try {
      const connectionResult = await pool.query('SELECT NOW() as current_time')
      diagnostics.tests.push({
        name: 'Basic Connection',
        status: 'PASS',
        result: { currentTime: connectionResult.rows[0].current_time }
      })
    } catch (error) {
      diagnostics.tests.push({
        name: 'Basic Connection',
        status: 'FAIL',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      throw error
    }

    // Test 3: Table existence
    try {
      const tablesResult = await pool.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name IN ('user_sessions', 'user_analytics')
        ORDER BY table_name
      `)
      diagnostics.tests.push({
        name: 'Required Tables',
        status: tablesResult.rows.length === 2 ? 'PASS' : 'PARTIAL',
        result: { 
          foundTables: tablesResult.rows.map(r => r.table_name),
          expectedTables: ['user_sessions', 'user_analytics']
        }
      })
    } catch (error) {
      diagnostics.tests.push({
        name: 'Required Tables',
        status: 'FAIL',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }

    // Test 4: Data counts
    try {
      const sessionCountResult = await pool.query('SELECT COUNT(*) as count FROM user_sessions')
      const analyticsCountResult = await pool.query('SELECT COUNT(*) as count FROM user_analytics')
      diagnostics.tests.push({
        name: 'Data Counts',
        status: 'PASS',
        result: {
          sessionCount: parseInt(sessionCountResult.rows[0].count),
          analyticsCount: parseInt(analyticsCountResult.rows[0].count)
        }
      })
    } catch (error) {
      diagnostics.tests.push({
        name: 'Data Counts',
        status: 'FAIL',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }

    // Test 5: Insert operations (test actual analytics workflow)
    try {
      const testSessionId = `test_${Date.now()}`
      
      // Test session insert
      await insertUserSession({
        sessionId: testSessionId,
        userAgent: 'Database Test Agent',
        ipAddress: '127.0.0.1'
      })
      
      // Test analytics insert
      const analyticsResult = await insertUserAnalytics({
        sessionId: testSessionId,
        frontFacePhoto: 'test_photo_data',
        sideFacePhoto: 'test_photo_data',
        fullBodyPhoto: 'test_photo_data',
        promptText: 'Database test prompt',
        generatedImage: 'test_generated_image',
        success: true,
        processingTime: 1000
      })

      // Clean up test data
      await pool.query('DELETE FROM user_analytics WHERE session_id = $1', [testSessionId])
      await pool.query('DELETE FROM user_sessions WHERE session_id = $1', [testSessionId])

      diagnostics.tests.push({
        name: 'Insert Operations',
        status: 'PASS',
        result: { insertedAnalyticsId: analyticsResult?.id }
      })
    } catch (error) {
      diagnostics.tests.push({
        name: 'Insert Operations',
        status: 'FAIL',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }

    const allTestsPassed = diagnostics.tests.every(test => test.status === 'PASS')
    
    return NextResponse.json({
      success: allTestsPassed,
      database: allTestsPassed ? 'fully_operational' : 'partial_issues',
      diagnostics,
      message: allTestsPassed ? 
        'All database tests passed - analytics should work' : 
        'Some database tests failed - check diagnostics'
    })

  } catch (error) {
    console.error('Database test error:', error)
    diagnostics.tests.push({
      name: 'Overall Test',
      status: 'FAIL',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
    
    return NextResponse.json({
      success: false,
      database: 'connection_failed',
      diagnostics,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Database connection failed'
    }, { status: 500 })
  }
}
