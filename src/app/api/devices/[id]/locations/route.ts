import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth/middleware'
import { db } from '@/lib/db'
import { devices } from '@/lib/db/schema'
import { and, eq, desc } from 'drizzle-orm'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const user = getAuthUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const [device] = await db.select().from(devices)
    .where(and(eq(devices.id, params.id), eq(devices.userId, user.sub)))
    .limit(1)

  if (!device) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { searchParams } = new URL(req.url)
  const limit = Math.min(parseInt(searchParams.get('limit') || '100'), 1000)

  const { locations } = await import('@/lib/db/schema')
  const locs = await db.select().from(locations)
    .where(eq(locations.deviceId, params.id))
    .orderBy(desc(locations.recordedAt))
    .limit(limit)

  return NextResponse.json(locs)
}