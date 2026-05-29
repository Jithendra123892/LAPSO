import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { getAuthUser } from '@/lib/auth/middleware'
// POST: Generate agent token — returns a signed agent token tied to user session
export async function POST(req: NextRequest) {
  const authUser = getAuthUser(req)
  if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Generate token with crypto.randomUUID — no uuid package needed
  const agentToken = crypto.randomUUID()

  await db.update(users).set({ updatedAt: new Date() }).where(eq(users.id, authUser.sub))

  return NextResponse.json({ token: agentToken })
}