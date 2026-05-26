import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { devices, locations } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { z } from 'zod'

const locationSchema = z.object({
  deviceId: z.string().uuid(),
  latitude: z.number(),
  longitude: z.number(),
  accuracy: z.number().optional(),
  altitude: z.number().optional(),
  speed: z.number().optional(),
  heading: z.number().optional(),
  source: z.enum(['gps', 'wifi', 'cell', 'ble']),
  batteryLevel: z.number().min(0).max(100).optional(),
  storageUsed: z.number().optional(),
  storageTotal: z.number().optional(),
})

export async function POST(req: NextRequest) {
  const agentToken = req.headers.get('x-agent-token')
  if (!agentToken) return NextResponse.json({ error: 'Missing agent token' }, { status: 401 })

  try {
    const body = await req.json()
    const parsed = locationSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: 'Validation failed' }, { status: 400 })

    const data = parsed.data
    const [device] = await db.select({ id: devices.id }).from(devices).where(eq(devices.id, data.deviceId)).limit(1)
    if (!device) return NextResponse.json({ error: 'Device not found' }, { status: 404 })

    const updateData: any = { status: 'online', lastLatitude: data.latitude, lastLongitude: data.longitude, lastAccuracy: data.accuracy, lastSeenAt: new Date() }
    if (data.batteryLevel !== undefined) updateData.batteryLevel = data.batteryLevel
    if (data.storageUsed !== undefined) updateData.storageUsed = data.storageUsed
    if (data.storageTotal !== undefined) updateData.storageTotal = data.storageTotal

    await db.update(devices).set({ ...updateData, updatedAt: new Date() }).where(eq(devices.id, data.deviceId))

    const [location] = await db.insert(locations).values({
      deviceId: data.deviceId, latitude: data.latitude, longitude: data.longitude,
      accuracy: data.accuracy, altitude: data.altitude, speed: data.speed, heading: data.heading,
      source: data.source, batteryLevel: data.batteryLevel,
    }).returning()

    // Emit real-time location update via WebSocket
    if (process.env.NEXT_PUBLIC_SOCKET_URL) {
      try {
        const { emitLocationUpdate } = await import('@/lib/socket-server')
        emitLocationUpdate(data.deviceId, {
          lat: data.latitude,
          lng: data.longitude,
          accuracy: data.accuracy,
          speed: data.speed,
          heading: data.heading,
          source: data.source,
          recordedAt: new Date().toISOString(),
        })
      } catch (e) {
        // Socket server may not be available in all environments
      }
    }

    return NextResponse.json({ success: true, locationId: location.id })
  } catch (error) {
    console.error('Location ingest error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}