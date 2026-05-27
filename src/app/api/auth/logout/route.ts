import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { refreshTokens } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

export async function POST(req: NextRequest) {
  try {
    const refreshToken = req.cookies.get('refresh_token')?.value
    if (refreshToken) {
      // Revoke refresh token from DB
      await db.delete(refreshTokens).where(eq(refreshTokens.token, refreshToken))
    }

    const response = NextResponse.json({ success: true })
    response.cookies.set('refresh_token', '', { httpOnly: true, path: '/', maxAge: 0 })
    return response
  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}