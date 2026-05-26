import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth/middleware'
import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

export async function GET(req: NextRequest) {
  const user = getAuthUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const [profile] = await db.select({
    id: users.id,
    email: users.email,
    name: users.name,
    avatarUrl: users.avatarUrl,
    totpEnabled: users.totpEnabled,
    publicKey: users.publicKey,
    encryptedPrivateKey: users.encryptedPrivateKey,
    createdAt: users.createdAt,
  }).from(users).where(eq(users.id, user.sub)).limit(1)

  if (!profile) return NextResponse.json({ error: 'User not found' }, { status: 404 })
  return NextResponse.json(profile)
}

export async function PUT(req: NextRequest) {
  const authUser = getAuthUser(req)
  if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { name } = body
  if (!name?.trim()) return NextResponse.json({ error: 'Name required' }, { status: 400 })

  const [updated] = await db.update(users).set({ name, updatedAt: new Date() }).where(eq(users.id, authUser.sub)).returning({ id: users.id, name: users.name })
  return NextResponse.json(updated)
}