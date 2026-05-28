import { db } from '@/lib/db'
import { geofences } from '@/lib/db/schema'
import { z } from 'zod'
import { eq } from 'drizzle-orm'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'

const updateGeofenceSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  coordinates: z.object({ lat: z.number(), lng: z.number() }).optional(),
  radius: z.number().positive().optional(),
  notifyOnEnter: z.boolean().optional(),
  notifyOnExit: z.boolean().optional(),
  enabled: z.boolean().optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
})

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const [geofence] = await db.select().from(geofences).where(
    eq(geofences.id, params.id)
  )

  if (!geofence || geofence.userId !== session.user.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  return NextResponse.json({ geofence })
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const parsed = updateGeofenceSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const updateData: Record<string, any> = { ...parsed.data }
  if (parsed.data.coordinates) {
    updateData.coordinates = JSON.stringify(parsed.data.coordinates)
  }
  const [updated] = await db.update(geofences)
    .set(updateData)
    .where(eq(geofences.id, params.id))
    .returning()

  if (!updated || updated.userId !== session.user.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  return NextResponse.json({ geofence: updated })
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const [deleted] = await db.delete(geofences)
    .where(eq(geofences.id, params.id))
    .returning()

  if (!deleted || deleted.userId !== session.user.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  return NextResponse.json({ success: true })
}