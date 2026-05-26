import { NextRequest, NextResponse } from 'next/server'
import { verifyAccessToken, type TokenPayload } from './jwt'

export async function authenticate(req: NextRequest): Promise<{ user: TokenPayload } | NextResponse> {
  const authHeader = req.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Missing authorization header' }, { status: 401 })
  }
  const token = authHeader.slice(7)
  try {
    const user = verifyAccessToken(token)
    return { user }
  } catch {
    return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 })
  }
}

export function getAuthUser(req: NextRequest): TokenPayload | null {
  const authHeader = req.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) return null
  try {
    return verifyAccessToken(authHeader.slice(7))
  } catch {
    return null
  }
}