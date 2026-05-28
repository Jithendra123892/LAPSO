import { getIO } from '@/lib/socket-server'
import { getServerSession } from 'next-auth'
import { NextRequest, NextResponse } from 'next/server'
import { authOptions } from '@/lib/auth'
import { eq } from 'drizzle-orm'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const userLat = parseFloat(searchParams.get('lat') || '0')
  const userLng = parseFloat(searchParams.get('lng') || '0')
  const radiusKm = parseFloat(searchParams.get('radius') || '50')

  // Get user's geofences
  const { db } = await import('@/lib/db')
  const { geofences, devices } = await import('@/lib/db/schema')

  const userGeofences = await db.select().from(geofences).where(eq(geofences.userId, session.user.id))

  const triggeredGeofences = userGeofences.filter((gf) => {
    const coords = typeof gf.coordinates === 'string' ? JSON.parse(gf.coordinates) : gf.coordinates
    if (!coords?.lat || !coords?.lng) return false
    const dist = haversine(userLat, userLng, coords.lat, coords.lng)
    return dist <= (gf.radius || 0.1) / 1000
  })

  const io = getIO()
  for (const gf of triggeredGeofences) {
    const type = 'enter' // simplified
    io?.to(`user:${session.user.id}`).emit('alert:geofence', {
      alertId: crypto.randomUUID(),
      deviceId: 'self',
      geofenceId: gf.id,
      type,
      geofenceName: gf.name,
      createdAt: new Date().toISOString(),
    })
  }

  // Check device geofences too
  const userDevices = await db.select().from(devices).where(eq(devices.userId, session.user.id))
  for (const device of userDevices) {
    if (!device.lastLatitude || !device.lastLongitude) continue
    const withinGeofences = userGeofences.filter((gf) => {
      const coords = typeof gf.coordinates === 'string' ? JSON.parse(gf.coordinates) : gf.coordinates
      if (!coords?.lat || !coords?.lng) return false
      const dist = haversine(device.lastLatitude!, device.lastLongitude!, coords.lat, coords.lng)
      return dist <= (gf.radius || 0.1) / 1000
    })
    for (const gf of withinGeofences) {
      io?.to(`device:${device.id}`).emit('location:update', {
        deviceId: device.id,
        lat: device.lastLatitude,
        lng: device.lastLongitude,
        accuracy: device.lastAccuracy ?? undefined,
        geofenceAlert: { geofenceId: gf.id, name: gf.name, type: 'within' },
        recordedAt: device.lastSeenAt?.toISOString() ?? new Date().toISOString(),
      })
    }
  }

  return NextResponse.json({ triggered: triggeredGeofences.length, geofences: userGeofences })
}

// Haversine distance in km
function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2)
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}