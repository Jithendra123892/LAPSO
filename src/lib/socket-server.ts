import { Server } from 'socket.io'

declare global {
  // eslint-disable-next-line no-var
  var lapsoIO: Server | undefined
}

export function getIO(): Server | null {
  return global.lapsoIO ?? null
}

export function emitLocationUpdate(deviceId: string, location: {
  lat: number
  lng: number
  accuracy?: number
  speed?: number
  heading?: number
  source: string
  recordedAt: string
}) {
  getIO()?.to(`device:${deviceId}`).emit('location:update', { deviceId, ...location })
}

export function emitDeviceStatus(deviceId: string, status: {
  status: string
  batteryLevel?: number
  batteryCharging?: boolean
  lastSeenAt: string
}) {
  getIO()?.to(`device:${deviceId}`).emit('device:status', { deviceId, ...status })
}

export function emitGeofenceAlert(userId: string, alert: {
  alertId: string
  deviceId: string
  geofenceId: string
  type: 'enter' | 'exit'
  geofenceName: string
  createdAt: string
}) {
  getIO()?.to(`user:${userId}`).emit('alert:geofence', alert)
}