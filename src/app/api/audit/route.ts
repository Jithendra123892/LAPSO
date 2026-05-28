import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth/middleware'
import { db } from '@/lib/db'
import { auditLogs, users, devices } from '@/lib/db/schema'
import { eq, desc, and, gte, lte, sql, like, or } from 'drizzle-orm'

export async function GET(req: NextRequest) {
  const user = getAuthUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const page = Math.max(0, parseInt(searchParams.get('page') ?? '0'))
  const limit = Math.min(100, parseInt(searchParams.get('limit') ?? '50'))
  const action = searchParams.get('action')
  const category = searchParams.get('category')
  const deviceId = searchParams.get('deviceId')
  const days = parseInt(searchParams.get('days') ?? '30')

  const offset = page * limit
  const fromDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

  const conditions = [gte(auditLogs.createdAt, fromDate)]

  if (action) {
    conditions.push(like(auditLogs.action, `${action}%`))
  }

  if (category) {
    // category matches the prefix before the dot (e.g. "device" matches "device.locked")
    conditions.push(
      or(
        like(auditLogs.action, `${category}.%`),
        eq(auditLogs.action, category)
      ) as any
    )
  }

  if (deviceId) {
    conditions.push(eq(auditLogs.deviceId, deviceId))
  }

  const where = conditions.length > 1 ? and(...conditions) : conditions[0]

  const rows = await db
    .select({
      id: auditLogs.id,
      action: auditLogs.action,
      detail: auditLogs.detail,
      ipAddress: auditLogs.ipAddress,
      userAgent: auditLogs.userAgent,
      deviceId: auditLogs.deviceId,
      teamId: auditLogs.teamId,
      createdAt: auditLogs.createdAt,
      userName: users.name,
      userEmail: users.email,
    })
    .from(auditLogs)
    .leftJoin(users, eq(auditLogs.userId, users.id))
    .where(where)
    .orderBy(desc(auditLogs.createdAt))
    .limit(limit)
    .offset(offset)

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(auditLogs)
    .where(where)

  return NextResponse.json({
    events: rows,
    pagination: {
      page,
      limit,
      total: Number(count),
      pages: Math.ceil(Number(count) / limit),
    },
  })
}