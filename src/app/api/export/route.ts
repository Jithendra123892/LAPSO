import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth/middleware'
import { db } from '@/lib/db'
import { devices, geofences, teamMembers, auditLogs, teams, users } from '@/lib/db/schema'
import { eq, sql } from 'drizzle-orm'

export async function GET(req: NextRequest) {
  const user = getAuthUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const userDevices = await db.select().from(devices).where(eq(devices.userId, user.sub))
    const deviceIds = userDevices.map(d => d.id)

    const userGeofences = await db.select().from(geofences).where(eq(geofences.userId, user.sub))

    const [{ count: auditCount }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(auditLogs)
      .where(eq(auditLogs.userId, user.sub))

    let teamData: any[] = []
    if (deviceIds.length > 0) {
      const member = await db
        .select({ teamId: teamMembers.teamId })
        .from(teamMembers)
        .where(eq(teamMembers.userId, user.sub))
        .limit(1)

      if (member.length > 0) {
        const teamId = member[0].teamId
        const [team] = await db.select().from(teams).where(eq(teams.id, teamId))
        const members = await db
          .select({
            id: teamMembers.id,
            role: teamMembers.role,
            joinedAt: teamMembers.joinedAt,
            userName: users.name,
            userEmail: users.email,
          })
          .from(teamMembers)
          .innerJoin(users, eq(teamMembers.userId, users.id))
          .where(eq(teamMembers.teamId, teamId))
        teamData = [{ team, members }]
      }
    }

    const body = JSON.stringify({
      exportedAt: new Date().toISOString(),
      user: { id: user.sub, email: user.email },
      devices: userDevices,
      geofences: userGeofences,
      team: teamData,
      stats: {
        totalDevices: userDevices.length,
        totalGeofences: userGeofences.length,
        auditLogCount: Number(auditCount ?? 0),
      },
    }, null, 2)

    return new NextResponse(body, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="lapso-export-${new Date().toISOString().split('T')[0]}.json"`,
      },
    })
  } catch (error) {
    console.error('Export error:', error)
    return NextResponse.json({ error: 'Failed to export data' }, { status: 500 })
  }
}