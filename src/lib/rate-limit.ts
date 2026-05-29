import { NextRequest, NextResponse } from 'next/server'

interface RateLimitEntry {
  count: number
  resetAt: number
}

const store = new Map<string, RateLimitEntry>()

const WINDOW_MS = 60_000   // 1 minute
const MAX_REQUESTS = 10     // per window

export function rateLimit(req: NextRequest, key: string): NextResponse | null {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim()
    ?? req.headers.get('x-real-ip') ?? 'unknown'
  const routeKey = `${ip}:${key}`

  const now = Date.now()
  const entry = store.get(routeKey)

  if (entry && entry.resetAt > now) {
    entry.count++
    if (entry.count > MAX_REQUESTS) {
      const retryAfter = Math.ceil((entry.resetAt - now) / 1000)
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429, headers: { 'Retry-After': String(retryAfter) } }
      )
    }
  } else {
    store.set(routeKey, { count: 1, resetAt: now + WINDOW_MS })
  }

  return null
}

export function clearExpired() {
  const now = Date.now()
  for (const [key, val] of Array.from(store.entries())) {
    if (val.resetAt <= now) store.delete(key)
  }
}