import { db } from '@/lib/db'
import { teamMembers, teams, users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const inviteSchema = z.object({ email: z.string().email(), role: z.enum(['admin', 'manager', 'member']) })

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Get user's team
  const [myMembership] = await db.select().from(teamMembers).where(eq(teamMembers.userId, session.user.id)).limit(1)
  if (!myMembership) return NextResponse.json({ error: 'Not in a team' }, { status: 403 })

  const myRole = myMembership.role
  if (myRole !== 'owner' && myRole !== 'admin') {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
  }

  const body = await req.json()
  const parsed = inviteSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 })

  // Find user by email
  const [invitee] = await db.select().from(users).where(eq(users.email, parsed.data.email)).limit(1)
  if (!invitee) return NextResponse.json({ error: 'No user with that email found' }, { status: 404 })

  // Check not already a member
  const [existing] = await db.select().from(teamMembers)
    .where(eq(teamMembers.userId, invitee.id))
    .limit(1)
  if (existing) return NextResponse.json({ error: 'User is already a team member' }, { status: 409 })

  const teamId = myMembership.teamId
  const [member] = await db.insert(teamMembers).values({
    id: crypto.randomUUID(),
    teamId,
    userId: invitee.id,
    role: parsed.data.role,
    joinedAt: new Date(),
  }).returning()

  return NextResponse.json({ member }, { status: 201 })
}