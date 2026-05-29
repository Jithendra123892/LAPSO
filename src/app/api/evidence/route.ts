import { db } from '@/lib/db'
import { evidence, devices } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'

// POST: Upload evidence from device agent (screenshot, cam, audio)
export async function POST(req: NextRequest) {
  const agentToken = req.headers.get('x-agent-token')
  if (!agentToken) return NextResponse.json({ error: 'Missing agent token' }, { status: 401 })

  const body = await req.json()
  const { deviceId, alertId, type, url, thumbnailUrl, lat, lng } = body

  if (!deviceId || !type || !url) {
    return NextResponse.json({ error: 'Missing deviceId, type, or url' }, { status: 400 })
  }

  // Validate URL scheme — reject javascript:, data:, etc.
  try {
    const parsed = new URL(url)
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return NextResponse.json({ error: 'url must use http or https protocol' }, { status: 400 })
    }
  } catch {
    return NextResponse.json({ error: 'Invalid url' }, { status: 400 })
  }

  // Validate agent token — must match a device owned by this user
  const device = await db.select().from(devices).where(eq(devices.id, deviceId)).get()
  if (!device) return NextResponse.json({ error: 'Device not found' }, { status: 404 })

  const validTypes = ['screenshot', 'camera', 'audio', 'location_dump', 'network_log']
  if (!validTypes.includes(type)) {
    return NextResponse.json({ error: 'Invalid evidence type' }, { status: 400 })
  }

  const [ev] = await db.insert(evidence).values({
    id: crypto.randomUUID(),
    deviceId,
    alertId,
    type,
    url,
    thumbnailUrl,
    lat,
    lng,
    createdAt: new Date(),
  }).returning()

  return NextResponse.json({ evidence: ev }, { status: 201 })
}

// GET: List evidence for a device
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const deviceId = searchParams.get('deviceId')
  const alertId = searchParams.get('alertId')

  if (!deviceId && !alertId) {
    return NextResponse.json({ error: 'deviceId or alertId required' }, { status: 400 })
  }

  let query = db.select().from(evidence)
  if (deviceId) {
    const results = await db.select().from(evidence).where(eq(evidence.deviceId, deviceId))
    return NextResponse.json({ evidence: results })
  }
  const results = await db.select().from(evidence).where(eq(evidence.alertId, alertId!))
  return NextResponse.json({ evidence: results })
}