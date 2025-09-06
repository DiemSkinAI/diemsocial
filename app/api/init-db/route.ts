import { NextResponse } from 'next/server'
import { createTables } from '@/lib/database'

export async function POST() {
  try {
    await createTables()
    return NextResponse.json({ success: true, message: 'Database tables created successfully' })
  } catch (error) {
    console.error('Database initialization error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to initialize database' },
      { status: 500 }
    )
  }
}
