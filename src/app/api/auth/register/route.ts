import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { users, refreshTokens } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { hashPassword } from '@/lib/auth/password'
import { signAccessToken, signRefreshToken } from '@/lib/auth/jwt'
import { generateUserKeyPair } from '@/lib/crypto/e2e'
import { z } from 'zod'
import { rateLimit } from '@/lib/rate-limit'

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
  name: z.string().min(1).max(255),
})

export async function POST(req: NextRequest) {
  const rl = rateLimit(req, 'register')
  if (rl) return rl

  try {
    const body = await req.json()
    const parsed = registerSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 400 })
    }

    const { email, password, name } = parsed.data
    const existing = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1)
    if (existing.length > 0) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 409 })
    }

    const passwordHash = await hashPassword(password)
    const { publicKey, privateKey } = generateUserKeyPair()

    const [user] = await db.insert(users).values({
      id: crypto.randomUUID(),
      email,
      name,
      passwordHash,
      publicKey,
      encryptedPrivateKey: privateKey,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning({ id: users.id, email: users.email, name: users.name })

    const accessToken = signAccessToken({ sub: user.id, email: user.email })
    const refreshToken = signRefreshToken({ sub: user.id, email: user.email })

    // Store refresh token in DB
    await db.insert(refreshTokens).values({
      id: crypto.randomUUID(),
      userId: user.id,
      token: refreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      createdAt: new Date(),
    })

    const response = NextResponse.json({
      user: { id: user.id, email: user.email, name: user.name },
      accessToken,
    })

    response.cookies.set('refresh_token', refreshToken, {
      httpOnly: true,
      secure: req.nextUrl.protocol === 'https:' ||
        req.headers.get('x-forwarded-proto') === 'https',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60,
    })

    return response
  } catch (error) {
    console.error('Register error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}