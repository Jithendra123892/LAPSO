import { neon } from '@/lib/db'
import { evidence } from '@/lib/db/schema'
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

  const validTypes = ['screenshot', 'camera', 'audio', 'location_dump', 'network_log']
  if (!validTypes.includes(type)) {
    return NextResponse.json({ error: 'Invalid evidence type' }, { status: 400 })
  }

  const [ev] = await neon.insert(evidence).values({
    deviceId,
    alertId,
    type,
    url,
    thumbnailUrl,
    lat,
    lng,
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

  let query = neon.select().from(evidence)
  if (deviceId) {
    const results = await neon.select().from(evidence).where(eq(evidence.deviceId, deviceId))
    return NextResponse.json({ evidence: results })
  }
  const results = await neon.select().from(evidence).where(eq(evidence.alertId, alertId!))
  return NextResponse.json({ evidence: results })
}