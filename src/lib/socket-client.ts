import { io, Socket } from 'socket.io-client'

let socket: Socket | null = null

export function getSocket(userId: string, token: string): Socket {
  if (socket?.connected) return socket

  socket = io(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000', {
    auth: { userId, token },
    transports: ['websocket', 'polling'],
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  })

  socket.on('connect', () => {
    console.log('[WS] Connected:', socket?.id)
  })

  socket.on('disconnect', (reason) => {
    console.log('[WS] Disconnected:', reason)
  })

  socket.on('location:update', (data: {
    deviceId: string
    lat: number
    lng: number
    accuracy?: number
    speed?: number
    heading?: number
    source: string
    recordedAt: string
  }) => {
    // Dispatch to store for direct updates
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('lapso:location', { detail: data }))
    }
  })

  socket.on('device:status', (data: {
    deviceId: string
    status: string
    batteryLevel?: number
    batteryCharging?: boolean
    lastSeenAt: string
  }) => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('lapso:status', { detail: data }))
    }
  })

  socket.on('alert:geofence', (data: {
    alertId: string
    deviceId: string
    geofenceId: string
    type: 'enter' | 'exit'
    geofenceName: string
    createdAt: string
  }) => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('lapso:geofence-alert', { detail: data }))
    }
  })

  return socket
}

export function subscribeDevice(socket: Socket, deviceId: string) {
  socket.emit('subscribe:device', deviceId)
}

export function unsubscribeDevice(socket: Socket, deviceId: string) {
  socket.emit('unsubscribe:device', deviceId)
}

export function disconnectSocket() {
  socket?.disconnect()
  socket = null
}