import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { devices } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { z } from 'zod'

const healthSchema = z.object({
  deviceId: z.string().uuid(),
  batteryLevel: z.number().min(0).max(100).optional(),
  batteryCharging: z.boolean().optional(),
  storageUsed: z.number().optional(),
  storageTotal: z.number().optional(),
  ipAddress: z.string().optional(),
  wifiSsid: z.string().optional(),
  agentVersion: z.string().optional(),
})

export async function POST(req: NextRequest) {
  const agentToken = req.headers.get('x-agent-token')
  if (!agentToken) return NextResponse.json({ error: 'Missing agent token' }, { status: 401 })

  try {
    const body = await req.json()
    const parsed = healthSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: 'Validation failed' }, { status: 400 })

    const data = parsed.data
    const updateData: any = { lastSeenAt: new Date() }
    if (data.batteryLevel !== undefined) updateData.batteryLevel = data.batteryLevel
    if (data.batteryCharging !== undefined) updateData.batteryCharging = data.batteryCharging
    if (data.storageUsed !== undefined) updateData.storageUsed = data.storageUsed
    if (data.storageTotal !== undefined) updateData.storageTotal = data.storageTotal
    if (data.ipAddress) updateData.ipAddress = data.ipAddress
    if (data.wifiSsid) updateData.wifiSsid = data.wifiSsid
    if (data.agentVersion) updateData.agentVersion = data.agentVersion

    await db.update(devices).set(updateData).where(eq(devices.id, data.deviceId))
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Health ingest error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}