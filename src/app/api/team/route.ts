import { db } from '@/lib/db'
import { teams, teamMembers, users } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Get user's team
  const userTeam = await db.select().from(teamMembers).where(eq(teamMembers.userId, session.user.id)).limit(1)
  if (!userTeam.length) return NextResponse.json({ team: null, members: [] })

  const teamId = userTeam[0].teamId
  const [team] = await db.select().from(teams).where(eq(teams.id, teamId))

  const members = await db
    .select({
      id: teamMembers.id,
      userId: teamMembers.userId,
      role: teamMembers.role,
      joinedAt: teamMembers.joinedAt,
      userName: users.name,
      userEmail: users.email,
    })
    .from(teamMembers)
    .innerJoin(users, eq(teamMembers.userId, users.id))
    .where(eq(teamMembers.teamId, teamId))

  return NextResponse.json({ team, members })
}