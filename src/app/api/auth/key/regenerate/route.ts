import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth/middleware'
import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { generateUserKeyPair } from '@/lib/crypto/e2e'

export async function POST(req: NextRequest) {
  const user = getAuthUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { publicKey, privateKey } = generateUserKeyPair()

    await db.update(users)
      .set({
        publicKey,
        encryptedPrivateKey: privateKey,
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.sub))

    return NextResponse.json({ publicKey, privateKey })
  } catch (error) {
    console.error('Key regenerate error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}