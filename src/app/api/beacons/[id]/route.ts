import { neon } from '@/lib/db'
import { beacons } from '@/lib/db/schema'
import { z } from 'zod'
import { eq } from 'drizzle-orm'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'

const updateBeaconSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
})

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const [beacon] = await neon.select().from(beacons).where(eq(beacons.id, params.id))
  if (!beacon || beacon.userId !== session.user.id) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ beacon })
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json()
  const parsed = updateBeaconSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  const [updated] = await neon.update(beacons).set(parsed.data).where(eq(beacons.id, params.id)).returning()
  if (!updated || updated.userId !== session.user.id) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ beacon: updated })
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const [deleted] = await neon.delete(beacons).where(eq(beacons.id, params.id)).returning()
  if (!deleted || deleted.userId !== session.user.id) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ success: true })
}