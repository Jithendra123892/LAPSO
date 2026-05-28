import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth/middleware'
import { db } from '@/lib/db'
import { devices, commands } from '@/lib/db/schema'
import { and, eq } from 'drizzle-orm'
import { z } from 'zod'

const commandSchema = z.object({
  type: z.enum(['lock', 'unlock', 'wipe', 'alarm', 'message', 'locate']),
  payload: z.record(z.any()).optional(),
})

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const user = getAuthUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const [device] = await db.select().from(devices)
    .where(and(eq(devices.id, params.id), eq(devices.userId, user.sub)))
    .limit(1)

  if (!device) return NextResponse.json({ error: 'Device not found' }, { status: 404 })

  try {
    const body = await req.json()
    const parsed = commandSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed' }, { status: 400 })
    }

    const [command] = await db.insert(commands).values({
      id: crypto.randomUUID(),
      deviceId: params.id,
      type: parsed.data.type,
      payload: JSON.stringify(parsed.data.payload || {}),
      status: 'pending',
      createdAt: new Date(),
    }).returning()

    return NextResponse.json(command, { status: 201 })
  } catch (error) {
    console.error('Command error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}