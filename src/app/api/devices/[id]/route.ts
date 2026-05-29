import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth/middleware'
import { db } from '@/lib/db'
import { devices } from '@/lib/db/schema'
import { and, eq } from 'drizzle-orm'

async function getDevice(req: NextRequest, deviceId: string) {
  const user = getAuthUser(req)
  if (!user) return null
  const device = await db.select().from(devices)
    .where(and(eq(devices.id, deviceId), eq(devices.userId, user.sub)))
    .get()
  return device
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const device = await getDevice(req, params.id)
  if (!device) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(device)
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const device = await getDevice(req, params.id)
  if (!device) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  try {
    const body = await req.json()
    const updated = await db.update(devices)
      .set({ ...body, updatedAt: new Date() })
      .where(eq(devices.id, params.id))
      .returning()
      .get()
    return NextResponse.json(updated)
  } catch (error) {
    console.error('Update device error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const device = await getDevice(req, params.id)
  if (!device) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  await db.delete(devices).where(eq(devices.id, params.id))
  return NextResponse.json({ success: true })
}