'use client'

import { useEffect, useState, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAppStore } from '@/store/app-store'
import { useParams, useRouter } from 'next/navigation'
import { BlobDevice } from '@/components/illustrations/blob-device'
import { DeviceCommands } from '@/components/devices/device-commands'
import { DeviceHealth } from '@/components/devices/device-health'
import { timeAgo } from '@/lib/utils'
import { useDeviceSocket, useLocationUpdates, useStatusUpdates, useGeofenceAlerts } from '@/hooks/use-device-socket'
import { computeOverallThreatLevel } from '@/lib/anti-theft'
import { motion, AnimatePresence } from 'framer-motion'
import { WarningDiamond, MapPin, Clock, ShieldCheck, WifiHigh, BatteryFull } from '@phosphor-icons/react'
import dynamic from 'next/dynamic'

const LiveMap = dynamic(() => import('@/components/map/live-map').then(m => m.LiveMap), { ssr: false })

const THREAT_CONFIG = {
  none: { color: '#4ECDC4', label: 'Secure', icon: ShieldCheck },
  low: { color: '#FFE66D', label: 'Low' },
  medium: { color: '#FFA502', label: 'Medium' },
  high: { color: '#FF6B6B', label: 'High' },
  critical: { color: '#A855F7', label: 'CRITICAL', icon: WarningDiamond },
}

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
}
const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.2, 0, 0, 1] } },
}

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
  const [prevMood, setPrevMood] = useState<string>('neutral')
  const [moodFlash, setMoodFlash] = useState(false)

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
    if (data.deviceId === id || data.deviceId === 'self') qc.invalidateQueries({ queryKey: ['alerts'] })
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

  const currentStatus = deviceLoc ? 'online' : (deviceStatus !== 'offline' ? deviceStatus : device?.status)
  const lat = deviceLoc?.lat ?? device?.lastLatitude
  const lng = deviceLoc?.lng ?? device?.lastLongitude
  const mapDevices = lat && lng ? [{ id: device?.id, name: device?.name, deviceType: device?.deviceType, status: currentStatus, lat, lng, accuracy: device?.lastAccuracy }] : []

  const threatLevel = device ? computeOverallThreatLevel({
    deviceId: device.id, userId: device.userId,
    status: deviceLoc ? 'online' : device.status,
    lastLatitude: deviceLoc?.lat ?? device.lastLatitude,
    lastLongitude: deviceLoc?.lng ?? device.lastLongitude,
    lastSeenAt: lastSeen ? new Date(lastSeen) : device.lastSeenAt,
    batteryLevel: device.batteryLevel,
  }) : 'none'

  const currentThreat = THREAT_CONFIG[threatLevel as keyof typeof THREAT_CONFIG] || THREAT_CONFIG.none

  const statusMood: Record<string, 'happy' | 'worried' | 'scared' | 'tired' | 'neutral'> = {
    online: 'happy', offline: 'worried', lost: 'scared', locked: 'neutral', wiped: 'tired',
  }
  const mood = statusMood[currentStatus] || 'neutral'

  useEffect(() => {
    if (mood !== prevMood) {
      setMoodFlash(true)
      setTimeout(() => setMoodFlash(false), 600)
      setPrevMood(mood)
    }
  }, [mood])

  const commandMutation = useMutation({
    mutationFn: async ({ type }: { type: string }) => {
      const res = await fetch(`/api/devices/${id}/commands`, { method: 'POST', headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ type }) })
      if (!res.ok) throw new Error('Command failed')
      return res.json()
    },
  })

  const statusBg: Record<string, string> = {
    online: '#4ECDC4', offline: '#636E72', lost: '#FF4757', locked: '#A855F7', wiped: '#DFE6E9',
  }

  if (!devices.length) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex gap-2">
          {[0, 1, 2].map(i => <motion.div key={i} animate={{ y: [0, -12, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }} className="w-3 h-3 bg-primary border-2 border-dark" />)}
        </div>
      </div>
    )
  }

  if (!device) {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-20 neo-card max-w-sm mx-auto">
        <BlobDevice mood="worried" size={80} />
        <h2 className="font-heading font-bold text-xl mt-4">Device not found</h2>
        <motion.button whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }} className="neo-btn-primary mt-4 font-heading font-bold" onClick={() => router.push('/dashboard')}>
          Back to Dashboard
        </motion.button>
      </motion.div>
    )
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-6 max-w-6xl"
    >
      {/* Threat Banner */}
      <AnimatePresence>
        {threatLevel !== 'none' && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0, scale: [1, 1.02, 1] }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3 }}
            className="neo-card p-4 border-3 border-danger bg-danger/5 flex items-center gap-4"
          >
            <motion.div
              animate={{ rotate: [0, -5, 5, 0] }}
              transition={{ duration: 0.4 }}
            >
              <WarningDiamond size={28} weight="fill" className="text-danger" />
            </motion.div>
            <div className="flex-1">
              <p className="font-heading font-bold text-sm text-danger">Security Alert Active</p>
              <p className="font-body text-xs text-dark mt-0.5">Threat level: <strong>{currentThreat.label}</strong>. Review alerts for full details.</p>
            </div>
            <motion.button
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => router.push('/alerts')}
              className="neo-btn-danger text-xs font-heading font-bold"
            >
              View Alerts
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Device header */}
      <motion.div variants={itemVariants} className="flex items-center gap-5">
        <motion.div
          animate={moodFlash ? { scale: [1, 1.15, 1] } : {}}
          transition={{ duration: 0.4 }}
          className="relative"
        >
          {currentStatus === 'online' && (
            <motion.span
              animate={{ scale: [1, 1.3, 1], opacity: [0.7, 0, 0.7] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="absolute -top-1 -right-1 w-4 h-4 rounded-none"
              style={{ background: '#4ECDC4', border: '2px solid #2D3436' }}
            />
          )}
          <BlobDevice mood={mood} type={device.deviceType} size={72} animate={true} />
        </motion.div>

        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <motion.h1
              key={device.name}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-2xl font-heading font-bold"
            >
              {device.name}
            </motion.h1>
            <span className="text-xs px-1.5 py-0.5 border-2 border-dark font-bold font-mono" style={{ background: statusBg[currentStatus], color: '#FFF' }}>
              {currentStatus}
            </span>
            <span className="text-xs px-2 py-0.5 border-2 border-dark font-mono font-bold" style={{ background: currentThreat.color, color: currentThreat.color === '#FFE66D' || currentThreat.color === '#4ECDC4' ? '#2D3436' : '#FFF' }}>
              {currentThreat.label}
            </span>
            {deviceLoc && (
              <motion.span
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-[10px] px-2 py-0.5 border-2 border-dark bg-secondary text-dark font-heading font-bold animate-pulse"
              >
                ● LIVE
              </motion.span>
            )}
          </div>
          <div className="flex items-center gap-3 text-dark-light text-xs font-body">
            <span className="font-mono">{device.platform} · {device.deviceType}</span>
            <span className="flex items-center gap-1">
              <Clock size={12} weight="bold" />
              {lastSeen ? timeAgo(lastSeen) : device.lastSeenAt ? timeAgo(device.lastSeenAt) : 'Never'}
            </span>
            {device.batteryLevel !== null && (
              <span className="flex items-center gap-1">
                <BatteryFull size={12} weight="fill" />
                {device.batteryLevel}%
              </span>
            )}
          </div>
        </div>

        {/* Quick commands row */}
        <div className="hidden md:flex gap-2">
          {[
            { label: 'Lock', type: 'lock', color: '#A855F7' },
            { label: 'Locate', type: 'locate', color: '#4ECDC4' },
            { label: 'Alarm', type: 'alarm', color: '#FFE66D' },
          ].map(cmd => (
            <motion.button
              key={cmd.type}
              whileHover={{ y: -2, boxShadow: '3px 3px 0 0 #2D3436' }}
              whileTap={{ scale: 0.95, boxShadow: '1px 1px 0 0 #2D3436' }}
              onClick={() => commandMutation.mutate({ type: cmd.type })}
              disabled={commandMutation.isPending}
              className="text-xs font-heading font-bold px-3 py-2 border-3 border-dark"
              style={{ background: cmd.color, boxShadow: '3px 3px 0 0 #2D3436' }}
            >
              {cmd.label}
            </motion.button>
          ))}
        </div>
      </motion.div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-5">
          {/* Map */}
          <AnimatePresence>
            {mapDevices.length > 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3 }}
              >
                <LiveMap devices={mapDevices} />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Location History */}
          <motion.div variants={itemVariants} className="neo-card bg-surface">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-heading font-bold text-lg flex items-center gap-2">
                <MapPin size={18} weight="bold" className="text-secondary" />
                Location History
              </h3>
              <motion.button
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setShowHistory(!showHistory)}
                className="neo-btn-ghost text-xs font-heading font-bold"
              >
                {showHistory ? 'Hide' : 'Show'}
              </motion.button>
            </div>
            <AnimatePresence>
              {showHistory && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  {locations.length === 0 ? (
                    <p className="text-dark-light text-sm font-body py-4 text-center">No location history yet.</p>
                  ) : (
                    <div className="space-y-1 max-h-52 overflow-y-auto">
                      {(locations as any[]).slice(0, 20).map((loc: any, i: number) => (
                        <motion.div
                          key={loc.id}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.03 }}
                          className="flex justify-between items-center py-2 border-b-2 border-dark/10 last:border-0"
                        >
                          <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-none bg-secondary" />
                            <span className="font-mono text-xs">{loc.latitude?.toFixed(5)}, {loc.longitude?.toFixed(5)}</span>
                            {loc.source && <span className="text-[10px] text-dark-light font-body">{loc.source}</span>}
                          </div>
                          <span className="font-mono text-xs text-dark-light">{timeAgo(loc.recordedAt)}</span>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Alert History */}
          {deviceAlerts.length > 0 && (
            <motion.div variants={itemVariants} className="neo-card bg-surface">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-heading font-bold text-lg">Recent Alerts</h3>
                <motion.button whileHover={{ y: -1 }} whileTap={{ scale: 0.97 }} onClick={() => router.push('/alerts')} className="neo-btn-ghost text-xs font-heading font-bold">
                  View all
                </motion.button>
              </div>
              <div className="space-y-2">
                {deviceAlerts.map((alert: any, i: number) => {
                  const sev = alert.severity === 'critical' ? '#FF6B6B' : alert.severity === 'warning' ? '#FFE66D' : '#4ECDC4'
                  return (
                    <motion.div
                      key={alert.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.06 }}
                      className="flex items-center gap-3 py-2 border-b-2 border-dark/5 last:border-0"
                    >
                      <div className="w-2.5 h-2.5 rounded-none flex-shrink-0" style={{ background: sev }} />
                      <div className="flex-1 min-w-0">
                        <p className="font-heading text-xs font-bold text-dark truncate">{alert.title}</p>
                        {alert.message && <p className="font-body text-[11px] text-dark-light truncate">{alert.message}</p>}
                      </div>
                      <span className="font-mono text-[11px] text-dark-light flex-shrink-0">{timeAgo(alert.createdAt)}</span>
                    </motion.div>
                  )
                })}
              </div>
            </motion.div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <DeviceCommands deviceId={device.id} status={device.status} onCommand={(type) => commandMutation.mutate({ type })} loading={commandMutation.isPending} />
          <DeviceHealth
            batteryLevel={device.batteryLevel}
            batteryCharging={device.batteryCharging}
            storageUsed={device.storageUsed}
            storageTotal={device.storageTotal}
            ipAddress={device.ipAddress}
            wifiSsid={device.wifiSsid}
            agentVersion={device.agentVersion}
          />
        </div>
      </div>
    </motion.div>
  )
}