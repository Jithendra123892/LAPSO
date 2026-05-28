import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { refreshTokens } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '@/lib/auth/jwt'

export async function POST(req: NextRequest) {
  try {
    const refreshToken = req.cookies.get('refresh_token')?.value
    if (!refreshToken) {
      return NextResponse.json({ error: 'No refresh token' }, { status: 401 })
    }

    // Verify JWT signature
    let payload
    try {
      payload = verifyRefreshToken(refreshToken)
    } catch {
      return NextResponse.json({ error: 'Invalid refresh token' }, { status: 401 })
    }

    // Check token exists in DB (not revoked)
    const [storedToken] = await db
      .select()
      .from(refreshTokens)
      .where(eq(refreshTokens.token, refreshToken))
      .limit(1)

    if (!storedToken) {
      return NextResponse.json({ error: 'Refresh token revoked' }, { status: 401 })
    }
    if (storedToken.expiresAt < new Date()) {
      await db.delete(refreshTokens).where(eq(refreshTokens.id, storedToken.id))
      return NextResponse.json({ error: 'Refresh token expired' }, { status: 401 })
    }

    // Delete old refresh token (rotation)
    await db.delete(refreshTokens).where(eq(refreshTokens.id, storedToken.id))

    // Issue new token pair
    const newAccessToken = signAccessToken({ sub: payload.sub, email: payload.email })
    const newRefreshToken = signRefreshToken({ sub: payload.sub, email: payload.email })

    // Store new refresh token in DB
    await db.insert(refreshTokens).values({
      id: crypto.randomUUID(),
      userId: payload.sub,
      token: newRefreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      createdAt: new Date(),
    })

    const response = NextResponse.json({ accessToken: newAccessToken })
    response.cookies.set('refresh_token', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60,
    })
    return response
  } catch (error) {
    console.error('Refresh error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}