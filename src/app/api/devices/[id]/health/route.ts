import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth/middleware'
import { db } from '@/lib/db'
import { devices } from '@/lib/db/schema'
import { and, eq } from 'drizzle-orm'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const user = getAuthUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const [device] = await db.select({
    batteryLevel: devices.batteryLevel,
    batteryCharging: devices.batteryCharging,
    storageUsed: devices.storageUsed,
    storageTotal: devices.storageTotal,
    ipAddress: devices.ipAddress,
    wifiSsid: devices.wifiSsid,
    agentVersion: devices.agentVersion,
    lastSeenAt: devices.lastSeenAt,
  }).from(devices)
    .where(and(eq(devices.id, params.id), eq(devices.userId, user.sub)))
    .limit(1)

  if (!device) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(device)
}