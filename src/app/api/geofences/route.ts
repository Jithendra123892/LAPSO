import { db } from '@/lib/db'
import { geofences } from '@/lib/db/schema'
import { z } from 'zod'
import { eq, and } from 'drizzle-orm'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'

const createGeofenceSchema = z.object({
  name: z.string().min(1).max(255),
  coordinates: z.object({ lat: z.number(), lng: z.number() }),
  radius: z.number().positive().optional().default(100),
  notifyOnEnter: z.boolean().optional().default(true),
  notifyOnExit: z.boolean().optional().default(true),
  enabled: z.boolean().optional().default(true),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional().default('#FF6B6B'),
})

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userGeofences = await db.select().from(geofences).where(eq(geofences.userId, session.user.id))
  return NextResponse.json({ geofences: userGeofences })
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const parsed = createGeofenceSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const [geofence] = await db.insert(geofences).values({
    id: crypto.randomUUID(),
    userId: session.user.id,
    name: parsed.data.name,
    coordinates: JSON.stringify(parsed.data.coordinates),
    radius: parsed.data.radius,
    notifyOnEnter: parsed.data.notifyOnEnter,
    notifyOnExit: parsed.data.notifyOnExit,
    enabled: parsed.data.enabled,
    color: parsed.data.color,
    createdAt: new Date(),
  }).returning()

  return NextResponse.json({ geofence }, { status: 201 })
}