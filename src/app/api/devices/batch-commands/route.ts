import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth/middleware'
import { db } from '@/lib/db'
import { devices, commands } from '@/lib/db/schema'
import { eq, and, inArray } from 'drizzle-orm'
import { z } from 'zod'

const batchCommandSchema = z.object({
  deviceIds: z.array(z.string().uuid()).min(1).max(500),
  command: z.enum(['lock', 'unlock', 'wipe', 'alarm', 'message', 'locate']),
  payload: z.record(z.any()).optional(),
})

export async function POST(req: NextRequest) {
  const user = getAuthUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await req.json()
    const { deviceIds, command, payload } = batchCommandSchema.parse(body)

    // Security: verify all devices belong to this user
    const userDevices = await db
      .select({ id: devices.id })
      .from(devices)
      .where(and(
        eq(devices.userId, user.sub),
        inArray(devices.id, deviceIds)
      ))

    const authorizedIds = userDevices.map(d => d.id)
    if (authorizedIds.length === 0) {
      return NextResponse.json({ error: 'No authorized devices found' }, { status: 403 })
    }
    if (authorizedIds.length < deviceIds.length) {
      return NextResponse.json(
        { error: 'Some devices do not belong to you', authorizedCount: authorizedIds.length, requestedCount: deviceIds.length },
        { status: 403 }
      )
    }

    // Fan-out commands to all devices in parallel
    const commandRecords = authorizedIds.map(deviceId => ({
      deviceId,
      type: command as any,
      payload: payload ?? {},
      status: 'pending' as const,
    }))

    const results = await Promise.all(
      commandRecords.map(cmd =>
        db.insert(commands).values(cmd).returning({ id: commands.id })
      )
    )

    const commandIds = results.map(r => r[0]?.id).filter(Boolean)

    return NextResponse.json({
      issued: commandIds.length,
      commandIds,
      deviceIds: authorizedIds,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request', details: error.flatten() }, { status: 400 })
    }
    console.error('Batch command error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}