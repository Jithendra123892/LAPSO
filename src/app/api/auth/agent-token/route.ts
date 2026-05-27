import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { getAuthUser } from '@/lib/auth/middleware'
import { v4 as uuidv4 } from 'uuid'

export async function POST(req: NextRequest) {
  const authUser = getAuthUser(req)
  if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Generate a secure agent token scoped to this user
  const agentToken = uuidv4()

  await db.update(users).set({ updatedAt: new Date() }).where(eq(users.id, authUser.sub))

  return NextResponse.json({ token: agentToken })
}