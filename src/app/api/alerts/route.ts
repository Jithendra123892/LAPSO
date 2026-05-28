import { db } from '@/lib/db'
import { alerts } from '@/lib/db/schema'
import { eq, and, desc } from 'drizzle-orm'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const limit = parseInt(searchParams.get('limit') || '50')
  const unreadOnly = searchParams.get('unread') === 'true'

  const query = db.select().from(alerts).where(
    eq(alerts.userId, session.user.id)
  ).orderBy(desc(alerts.createdAt)).limit(limit)

  // Filter unread client-side for simplicity
  const allAlerts = await query
  return NextResponse.json({ alerts: allAlerts })
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { deviceId, type, severity, title, message, metadata } = body

  if (!deviceId || !type || !severity || !title) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const [alert] = await db.insert(alerts).values({
    id: crypto.randomUUID(),
    userId: session.user.id,
    deviceId,
    type,
    severity,
    title,
    message,
    metadata: JSON.stringify(metadata ?? {}),
    read: false,
    createdAt: new Date(),
  }).returning()

  // Emit WebSocket alert if socket available
  if (process.env.NEXT_PUBLIC_SOCKET_URL) {
    try {
      const { getIO } = await import('@/lib/socket-server')
      const io = getIO()
      io?.to(`user:${session.user.id}`).emit('alert:new', alert)
    } catch {}
  }

  return NextResponse.json({ alert }, { status: 201 })
}