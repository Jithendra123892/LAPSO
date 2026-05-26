import { neon } from '@/lib/db'
import { teamMembers, teams } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const [member] = await neon.select().from(teamMembers).where(eq(teamMembers.id, params.id))
  if (!member) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  if (member.role === 'owner') return NextResponse.json({ error: 'Cannot remove the owner' }, { status: 403 })

  // Get current user's role
  const [myMembership] = await neon.select().from(teamMembers).where(eq(teamMembers.userId, session.user.id)).limit(1)
  const canManage = myMembership?.role === 'owner' || myMembership?.role === 'admin'
  if (!canManage) return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })

  const [deleted] = await neon.delete(teamMembers).where(eq(teamMembers.id, params.id)).returning()
  return NextResponse.json({ success: !!deleted })
}