import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth/middleware'
import { db } from '@/lib/db'
import { devices } from '@/lib/db/schema'
import { eq, desc } from 'drizzle-orm'
import { z } from 'zod'

export async function GET(req: NextRequest) {
  const user = getAuthUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userDevices = await db.select().from(devices)
    .where(eq(devices.userId, user.sub))
    .orderBy(desc(devices.updatedAt))

  return NextResponse.json(userDevices)
}

const createDeviceSchema = z.object({
  name: z.string().min(1).max(255),
  deviceType: z.enum(['laptop', 'phone', 'tablet', 'desktop', 'watch']),
  platform: z.enum(['windows', 'macos', 'linux', 'android', 'ios']),
})

export async function POST(req: NextRequest) {
  const user = getAuthUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await req.json()
    const parsed = createDeviceSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 400 })
    }

    const [device] = await db.insert(devices).values({
      ...parsed.data,
      userId: user.sub,
    }).returning()

    return NextResponse.json(device, { status: 201 })
  } catch (error) {
    console.error('Create device error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}