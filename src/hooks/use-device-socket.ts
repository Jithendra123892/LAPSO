import { useEffect, useRef, useCallback } from 'react'
import { getSocket, subscribeDevice, unsubscribeDevice, disconnectSocket } from '@/lib/socket-client'

export function useDeviceSocket(userId: string, token: string) {
  const socketRef = useRef<ReturnType<typeof getSocket> | null>(null)

  useEffect(() => {
    if (!userId || !token) return
    const socket = getSocket(userId, token)
    socketRef.current = socket
    return () => {
      // Don't disconnect on unmount — let socket persist across navigations
    }
  }, [userId, token])

  const subscribe = useCallback((deviceId: string) => {
    if (socketRef.current) subscribeDevice(socketRef.current, deviceId)
  }, [])

  const unsubscribe = useCallback((deviceId: string) => {
    if (socketRef.current) unsubscribeDevice(socketRef.current, deviceId)
  }, [])

  return { subscribe, unsubscribe }
}

export function useLocationUpdates(deviceId: string, callback: (data: any) => void) {
  useEffect(() => {
    if (!deviceId) return
    const handler = (e: Event) => callback((e as CustomEvent).detail)
    window.addEventListener('lapso:location', handler)
    return () => window.removeEventListener('lapso:location', handler)
  }, [deviceId, callback])
}

export function useStatusUpdates(deviceId: string, callback: (data: any) => void) {
  useEffect(() => {
    if (!deviceId) return
    const handler = (e: Event) => callback((e as CustomEvent).detail)
    window.addEventListener('lapso:status', handler)
    return () => window.removeEventListener('lapso:status', handler)
  }, [deviceId, callback])
}

export function useGeofenceAlerts(callback: (data: any) => void) {
  useEffect(() => {
    const handler = (e: Event) => callback((e as CustomEvent).detail)
    window.addEventListener('lapso:geofence-alert', handler)
    return () => window.removeEventListener('lapso:geofence-alert', handler)
  }, [callback])
}