import { Pool } from 'pg'

let pool: Pool | null = null

export function getPool() {
  if (!pool) {
    if (!process.env.DATABASE_URL) {
      console.error('Database connection failed: DATABASE_URL environment variable is not set')
      throw new Error('DATABASE_URL environment variable is not set')
    }

    console.log('Creating database connection pool...')
    console.log('Environment:', process.env.NODE_ENV)
    console.log('Database URL format:', process.env.DATABASE_URL.substring(0, 20) + '...')
    
    try {
      pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.NODE_ENV === 'production' ? {
          rejectUnauthorized: false
        } : false,
        // Add connection timeout and retry settings
        connectionTimeoutMillis: 30000,
        idleTimeoutMillis: 30000,
        max: 20
      })
      
      // Test the connection immediately
      pool.on('error', (err) => {
        console.error('Database pool error:', err)
      })
      
      console.log('Database connection pool created successfully')
    } catch (error) {
      console.error('Failed to create database connection pool:', error)
      throw error
    }
  }
  
  return pool
}

export async function createTables() {
  const client = getPool()
  
  try {
    // Create user_sessions table
    await client.query(`
      CREATE TABLE IF NOT EXISTS user_sessions (
        id SERIAL PRIMARY KEY,
        session_id VARCHAR(255) UNIQUE,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        user_agent TEXT,
        ip_address VARCHAR(45)
      );
    `)

    // Create user_analytics table
    await client.query(`
      CREATE TABLE IF NOT EXISTS user_analytics (
        id SERIAL PRIMARY KEY,
        session_id VARCHAR(255),
        front_face_photo TEXT,
        side_face_photo TEXT,
        full_body_photo TEXT,
        prompt_text TEXT,
        generated_image TEXT,
        success BOOLEAN,
        error_message TEXT,
        processing_time INTEGER,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (session_id) REFERENCES user_sessions(session_id)
      );
    `)

    console.log('Database tables created successfully')
  } catch (error) {
    console.error('Error creating tables:', error)
    throw error
  }
}

export async function insertUserSession(sessionData: {
  sessionId: string
  userAgent?: string
  ipAddress?: string
}) {
  const client = getPool()
  
  const result = await client.query(`
    INSERT INTO user_sessions (session_id, user_agent, ip_address)
    VALUES ($1, $2, $3)
    ON CONFLICT (session_id) DO NOTHING
    RETURNING *
  `, [sessionData.sessionId, sessionData.userAgent, sessionData.ipAddress])
  
  return result.rows[0]
}

export async function insertUserAnalytics(analyticsData: {
  sessionId: string
  frontFacePhoto?: string
  sideFacePhoto?: string
  fullBodyPhoto?: string
  promptText?: string
  generatedImage?: string
  success: boolean
  errorMessage?: string
  processingTime?: number
  metadata?: any
}) {
  const client = getPool()
  
  const result = await client.query(`
    INSERT INTO user_analytics (
      session_id, front_face_photo, side_face_photo, full_body_photo,
      prompt_text, generated_image, success, error_message, processing_time
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    RETURNING *
  `, [
    analyticsData.sessionId,
    analyticsData.frontFacePhoto,
    analyticsData.sideFacePhoto,
    analyticsData.fullBodyPhoto,
    analyticsData.promptText,
    analyticsData.generatedImage,
    analyticsData.success,
    analyticsData.errorMessage,
    analyticsData.processingTime
    // Note: metadata is accepted but not stored in DB for now to avoid schema changes
  ])
  
  return result.rows[0]
}
