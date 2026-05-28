import { db } from '@/lib/db'
import { beacons } from '@/lib/db/schema'
import { z } from 'zod'
import { eq } from 'drizzle-orm'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'

const createBeaconSchema = z.object({
  name: z.string().min(1).max(255),
  uuid: z.string().length(36),
  major: z.number().int().min(0).max(65535).optional(),
  minor: z.number().int().min(0).max(65535).optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
})

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userBeacons = await db.select().from(beacons).where(eq(beacons.userId, session.user.id))
  return NextResponse.json({ beacons: userBeacons })
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const parsed = createBeaconSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const [beacon] = await db.insert(beacons).values({
    id: crypto.randomUUID(),
    userId: session.user.id,
    name: parsed.data.name,
    uuid: parsed.data.uuid,
    major: parsed.data.major,
    minor: parsed.data.minor,
    lat: parsed.data.lat,
    lng: parsed.data.lng,
    createdAt: new Date(),
  }).returning()

  return NextResponse.json({ beacon }, { status: 201 })
}