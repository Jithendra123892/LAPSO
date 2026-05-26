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
    createdAt: users.createdAt,
  }).from(users).where(eq(users.id, user.sub)).limit(1)

  if (!profile) return NextResponse.json({ error: 'User not found' }, { status: 404 })
  return NextResponse.json(profile)
}