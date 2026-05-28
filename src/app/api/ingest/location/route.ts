import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { devices, locations, alerts, geofences } from '@/lib/db/schema'
import { eq, and, desc } from 'drizzle-orm'
import { z } from 'zod'
import { detectThreats } from '@/lib/anti-theft'
import { emitLocationUpdate } from '@/lib/socket-server'

const locationSchema = z.object({
  deviceId: z.string(),
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
  // Anti-theft telemetry from agent
  failedUnlockAttempts: z.number().optional(),
  lastFailedUnlockAt: z.string().datetime().optional(),
  simRemoved: z.boolean().optional(),
  airplaneMode: z.boolean().optional(),
  isWiped: z.boolean().optional(),
})

export async function POST(req: NextRequest) {
  const agentToken = req.headers.get('x-agent-token')
  if (!agentToken) return NextResponse.json({ error: 'Missing agent token' }, { status: 401 })

  try {
    const body = await req.json()
    const parsed = locationSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: 'Validation failed' }, { status: 400 })

    const data = parsed.data

    // Fetch device with full context for threat detection
    const [device] = await db.select().from(devices).where(eq(devices.id, data.deviceId)).limit(1)
    if (!device) return NextResponse.json({ error: 'Device not found' }, { status: 404 })

    // Detect threats
    const deviceForThreats = {
      deviceId: device.id,
      userId: device.userId,
      status: 'online',
      lastLatitude: data.latitude,
      lastLongitude: data.longitude,
      lastSeenAt: new Date(),
      batteryLevel: data.batteryLevel,
      failedUnlockAttempts: data.failedUnlockAttempts,
      lastFailedUnlockAt: data.lastFailedUnlockAt ? new Date(data.lastFailedUnlockAt) : undefined,
      simRemoved: data.simRemoved,
      airplaneMode: data.airplaneMode,
      isWiped: data.isWiped,
    }

    const threats = detectThreats(deviceForThreats)

    // Create alert records for detected threats
    for (const threat of threats) {
      await db.insert(alerts).values({
        id: crypto.randomUUID(),
        userId: device.userId,
        deviceId: device.id,
        type: threat.type,
        severity: threat.severity === 'low' ? 'info' : threat.severity === 'medium' ? 'warning' : 'critical',
        title: threat.title,
        message: threat.message,
        metadata: JSON.stringify(threat.metadata || {}),
        createdAt: new Date(),
      })

      // Emit critical alert immediately
      if (threat.severity === 'critical' || threat.severity === 'high') {
        try {
          const io = (await import('@/lib/socket-server')).getIO()
          io?.to(`user:${device.userId}`).emit('alert:new', {
            id: crypto.randomUUID(),
            title: threat.title,
            severity: threat.severity,
            message: threat.message,
            deviceId: device.id,
            createdAt: new Date().toISOString(),
          })
        } catch {}
      }
    }

    // Update device
    const updateData: any = {
      status: data.isWiped ? 'wiped' : 'online',
      lastLatitude: data.latitude,
      lastLongitude: data.longitude,
      lastAccuracy: data.accuracy,
      lastSeenAt: new Date(),
      updatedAt: new Date(),
    }
    if (data.batteryLevel !== undefined) updateData.batteryLevel = data.batteryLevel
    if (data.storageUsed !== undefined) updateData.storageUsed = data.storageUsed
    if (data.storageTotal !== undefined) updateData.storageTotal = data.storageTotal

    await db.update(devices).set(updateData).where(eq(devices.id, data.deviceId))

    const [location] = await db.insert(locations).values({
      id: crypto.randomUUID(),
      deviceId: data.deviceId, latitude: data.latitude, longitude: data.longitude,
      accuracy: data.accuracy, altitude: data.altitude, speed: data.speed, heading: data.heading,
      source: data.source, batteryLevel: data.batteryLevel, recordedAt: new Date(),
    }).returning()

    // Emit real-time update
    try {
      emitLocationUpdate(data.deviceId, {
        lat: data.latitude,
        lng: data.longitude,
        accuracy: data.accuracy,
        speed: data.speed,
        heading: data.heading,
        source: data.source,
        recordedAt: new Date().toISOString(),
      })
    } catch {}

    // Check geofences
    const userGeofences = await db.select().from(geofences).where(eq(geofences.userId, device.userId))
    for (const gf of userGeofences) {
      if (!gf.enabled) continue
      const coords = typeof gf.coordinates === 'string' ? JSON.parse(gf.coordinates) : gf.coordinates
      if (!coords?.lat || !coords?.lng) continue
      const dist = haversine(data.latitude, data.longitude, coords.lat, coords.lng) * 1000
      if (gf.radius && dist <= gf.radius) {
        try {
          const io = (await import('@/lib/socket-server')).getIO()
          io?.to(`user:${device.userId}`).emit('alert:geofence', {
            geofenceId: gf.id,
            geofenceName: gf.name,
            deviceId: device.id,
            type: 'within',
            createdAt: new Date().toISOString(),
          })
        } catch {}
      }
    }

    return NextResponse.json({
      success: true,
      locationId: location.id,
      threatsDetected: threats.length,
      threatLevels: threats.map((t) => ({ type: t.type, severity: t.severity })),
    })
  } catch (error) {
    console.error('Location ingest error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}