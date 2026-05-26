'use client'

import { useEffect, useState, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAppStore } from '@/store/app-store'
import { useParams, useRouter } from 'next/navigation'
import { BlobDevice } from '@/components/illustrations/blob-device'
import { DeviceCommands } from './device-commands'
import { DeviceHealth } from './device-health'
import { timeAgo } from '@/lib/utils'
import { useDeviceSocket, useLocationUpdates, useStatusUpdates, useGeofenceAlerts } from '@/hooks/use-device-socket'
import { computeOverallThreatLevel } from '@/lib/anti-theft'
import { motion, AnimatePresence } from 'framer-motion'
import { WarningDiamond } from '@phosphor-icons/react'
import dynamic from 'next/dynamic'

const LiveMap = dynamic(() => import('@/components/map/live-map').then(m => m.LiveMap), { ssr: false })

export default function DeviceDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const qc = useQueryClient()
  const accessToken = useAppStore((s) => s.accessToken)
  const userId = useAppStore((s) => s.user?.id)
  const [showHistory, setShowHistory] = useState(false)
  const [deviceLoc, setDeviceLoc] = useState<{ lat: number; lng: number } | null>(null)
  const [deviceStatus, setDeviceStatus] = useState<string>('offline')
  const [lastSeen, setLastSeen] = useState<string | null>(null)

  const { subscribe, unsubscribe } = useDeviceSocket(userId ?? '', accessToken ?? '')

  useEffect(() => {
    if (!id) return
    subscribe(id)
    return () => unsubscribe(id)
  }, [id, subscribe, unsubscribe])

  useLocationUpdates(id!, useCallback((data) => {
    setDeviceLoc({ lat: data.lat, lng: data.lng })
    qc.invalidateQueries({ queryKey: ['locations', id] })
  }, [id, qc]))

  useStatusUpdates(id!, useCallback((data) => {
    setDeviceStatus(data.status)
    setLastSeen(data.lastSeenAt)
  }, []))

  useGeofenceAlerts(useCallback((data) => {
    if (data.deviceId === id || data.deviceId === 'self') {
      qc.invalidateQueries({ queryKey: ['alerts'] })
    }
  }, [id, qc]))

  const { data: devices = [] } = useQuery({
    queryKey: ['devices'],
    queryFn: async () => {
      const res = await fetch('/api/devices', { headers: { Authorization: `Bearer ${accessToken}` } })
      if (!res.ok) throw new Error()
      return res.json()
    },
    enabled: !!accessToken,
    refetchInterval: 30000,
  })

  const { data: locations = [] } = useQuery({
    queryKey: ['locations', id],
    queryFn: async () => {
      const res = await fetch(`/api/devices/${id}/locations?limit=50`, { headers: { Authorization: `Bearer ${accessToken}` } })
      if (!res.ok) throw new Error()
      return res.json()
    },
    enabled: !!accessToken && !!id && showHistory,
  })

  const { data: alertsData } = useQuery({
    queryKey: ['alerts', id],
    queryFn: async () => {
      const res = await fetch('/api/alerts')
      if (!res.ok) return { alerts: [] }
      return res.json() as Promise<{ alerts: any[] }>
    },
    enabled: !!accessToken,
    refetchInterval: 20000,
  })

  const device = (devices as any[]).find((d: any) => d.id === id)
  const deviceAlerts = (alertsData?.alerts || []).filter((a: any) => a.deviceId === id).slice(0, 5)

  const threatLevel = device ? computeOverallThreatLevel({
    deviceId: device.id,
    userId: device.userId,
    status: deviceLoc ? 'online' : device.status,
    lastLatitude: deviceLoc?.lat ?? device.lastLatitude,
    lastLongitude: deviceLoc?.lng ?? device.lastLongitude,
    lastSeenAt: lastSeen ? new Date(lastSeen) : device.lastSeenAt,
    batteryLevel: device.batteryLevel,
  }) : 'none'

  const THREAT_CONFIG = {
    none: { color: '#4ECDC4', label: 'Secure' },
    low: { color: '#FFE66D', label: 'Low' },
    medium: { color: '#FFA502', label: 'Medium' },
    high: { color: '#FF6B6B', label: 'High' },
    critical: { color: '#A855F7', label: 'CRITICAL' },
  }

  const commandMutation = useMutation({
    mutationFn: async ({ type }: { type: string }) => {
      const res = await fetch(`/api/devices/${id}/commands`, {
        method: 'POST', headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ type }),
      })
      if (!res.ok) throw new Error('Command failed')
      return res.json()
    },
  })

  if (!devices.length) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex gap-2">
          {[0,1,2].map(i => <div key={i} className="w-3 h-3 bg-primary border-2 border-dark animate-bounce" style={{ animationDelay: `${i*150}ms` }} />)}
        </div>
      </div>
    )
  }

  if (!device) {
    return (
      <div className="text-center py-20">
        <BlobDevice mood="worried" size={80} />
        <h2 className="font-heading font-bold text-xl mt-4">Device not found</h2>
        <button className="neo-btn-primary mt-4" onClick={() => router.push('/dashboard')}>Back to Dashboard</button>
      </div>
    )
  }

  const statusMood: Record<string, 'happy' | 'worried' | 'scared' | 'tired' | 'neutral'> = {
    online: 'happy', offline: 'worried', lost: 'scared', locked: 'neutral', wiped: 'tired',
  }
  const statusColor: Record<string, string> = {
    online: '#4ECDC4', offline: '#636E72', lost: '#FF4757', locked: '#A855F7', wiped: '#DFE6E9',
  }

  const currentStatus = deviceLoc ? 'online' : (deviceStatus !== 'offline' ? deviceStatus : device.status)
  const lat = deviceLoc?.lat ?? device.lastLatitude
  const lng = deviceLoc?.lng ?? device.lastLongitude

  const mapDevices = lat && lng ? [{
    id: device.id, name: device.name, deviceType: device.deviceType, status: currentStatus,
    lat, lng, accuracy: device.lastAccuracy,
  }] : []

  const currentThreat = THREAT_CONFIG[threatLevel] || THREAT_CONFIG.none

  return (
    <div className="space-y-6">
      {/* Threat Banner */}
      {threatLevel !== 'none' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="neo-card p-4 border-3 border-danger bg-danger/5 flex items-center gap-3">
          <WarningDiamond size={24} weight="fill" className="text-danger" />
          <div>
            <p className="font-heading font-bold text-sm text-danger">Security Alert Active</p>
            <p className="font-body text-xs text-dark mt-0.5">Threat level: {currentThreat.label}. Review alerts page for details.</p>
          </div>
          <button onClick={() => router.push('/alerts')} className="neo-btn-primary ml-auto text-xs">View Alerts</button>
        </motion.div>
      )}

      {/* Header */}
      <div className="flex items-center gap-4">
        <BlobDevice mood={statusMood[currentStatus] || 'neutral'} type={device.deviceType} size={64} animate={false} />
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-heading font-bold">{device.name}</h1>
            <span className="text-xs px-1.5 py-0.5 border-2 border-dark font-bold" style={{ background: statusColor[currentStatus], color: '#FFF' }}>
              {currentStatus}
            </span>
            <span className="text-xs px-2 py-0.5 border-2 border-dark font-mono" style={{ background: currentThreat.color, color: currentThreat.color === '#FFE66D' || currentThreat.color === '#4ECDC4' ? '#2D3436' : '#FFF' }}>
              {currentThreat.label}
            </span>
          </div>
          <p className="text-dark-light text-sm">
            {device.platform} • {device.deviceType}
            {lastSeen ? ` • Last seen ${timeAgo(lastSeen)}` : device.lastSeenAt ? ` • Last seen ${timeAgo(device.lastSeenAt)}` : ''}
            {deviceLoc && ' • Live'}
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {mapDevices.length > 0 && <LiveMap devices={mapDevices} />}

          {/* Location History */}
          <div className="neo-card bg-surface">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-heading font-bold">Location History</h3>
              <button className="neo-btn-ghost text-xs py-1 px-2" onClick={() => setShowHistory(!showHistory)}>
                {showHistory ? 'Hide' : 'Show'}
              </button>
            </div>
            {showHistory && locations.length > 0 && (
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {(locations as any[]).slice(0, 20).map((loc: any) => (
                  <div key={loc.id} className="flex justify-between items-center py-1.5 border-b-2 border-dark/10 last:border-0 text-sm">
                    <div>
                      <span className="font-mono text-xs">{loc.latitude?.toFixed(5)}, {loc.longitude?.toFixed(5)}</span>
                      {loc.source && <span className="ml-2 text-xs text-dark-light">via {loc.source}</span>}
                    </div>
                    <span className="text-xs text-dark-light">{timeAgo(loc.recordedAt)}</span>
                  </div>
                ))}
              </div>
            )}
            {showHistory && locations.length === 0 && <p className="text-dark-light text-sm">No location history yet.</p>}
          </div>

          {/* Alert History */}
          {deviceAlerts.length > 0 && (
            <div className="neo-card bg-surface">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-heading font-bold">Recent Alerts</h3>
                <button onClick={() => router.push('/alerts')} className="neo-btn-ghost text-xs py-1 px-2">View all</button>
              </div>
              <div className="space-y-2">
                {deviceAlerts.map((alert: any) => (
                  <div key={alert.id} className="flex items-center gap-2 text-sm">
                    <span className={`w-2 h-2 rounded-none ${alert.severity === 'critical' ? 'bg-danger' : alert.severity === 'warning' ? 'bg-accent' : 'bg-secondary'}`} />
                    <span className="font-heading text-xs font-semibold flex-1">{alert.title}</span>
                    <span className="font-mono text-xs text-dark-light">{timeAgo(alert.createdAt)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <DeviceCommands deviceId={device.id} status={device.status} onCommand={(type) => commandMutation.mutate({ type })} loading={commandMutation.isPending} />
          <DeviceHealth batteryLevel={device.batteryLevel} batteryCharging={device.batteryCharging} storageUsed={device.storageUsed} storageTotal={device.storageTotal} ipAddress={device.ipAddress} wifiSsid={device.wifiSsid} agentVersion={device.agentVersion} />
        </div>
      </div>
    </div>
  )
}