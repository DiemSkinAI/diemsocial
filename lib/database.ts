import { Pool } from 'pg'

let pool: Pool | null = null

export function getPool() {
  if (!pool) {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL environment variable is not set')
    }

    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? {
        rejectUnauthorized: false
      } : false
    })
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
  ])
  
  return result.rows[0]
}
