'use client'

import { useEffect, useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { useAppStore } from '@/store/app-store'
import { useParams, useRouter } from 'next/navigation'
import { BlobDevice } from '@/components/illustrations/blob-device'
import { DeviceCommands } from './device-commands'
import { DeviceHealth } from './device-health'
import { timeAgo } from '@/lib/utils'
import dynamic from 'next/dynamic'

const LiveMap = dynamic(() => import('@/components/map/live-map').then(m => m.LiveMap), { ssr: false })

export default function DeviceDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const accessToken = useAppStore((s) => s.accessToken)
  const [showHistory, setShowHistory] = useState(false)

  const { data: devices = [] } = useQuery({
    queryKey: ['devices'],
    queryFn: async () => {
      const res = await fetch('/api/devices', { headers: { Authorization: `Bearer ${accessToken}` } })
      if (!res.ok) throw new Error()
      return res.json()
    },
    enabled: !!accessToken,
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

  const device = (devices as any[]).find((d: any) => d.id === id)

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

  const mapDevices = device.lastLatitude && device.lastLongitude ? [{
    id: device.id, name: device.name, deviceType: device.deviceType, status: device.status,
    lat: device.lastLatitude, lng: device.lastLongitude, accuracy: device.lastAccuracy,
  }] : []

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <BlobDevice mood={statusMood[device.status] || 'neutral'} type={device.deviceType} size={64} animate={false} />
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-heading font-bold">{device.name}</h1>
            <span className="text-xs px-1.5 py-0.5 border-2 border-dark font-bold" style={{ background: statusColor[device.status], color: device.status === 'online' ? '#FFF' : '#FFF' }}>
              {device.status}
            </span>
          </div>
          <p className="text-dark-light text-sm">
            {device.platform} • {device.deviceType}
            {device.lastSeenAt && ` • Last seen ${timeAgo(device.lastSeenAt)}`}
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {mapDevices.length > 0 && <LiveMap devices={mapDevices} />}

          <div className="neo-card">
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
                    <span className="font-mono text-xs">{loc.latitude?.toFixed(4)}, {loc.longitude?.toFixed(4)}</span>
                    <span className="text-xs text-dark-light">{timeAgo(loc.recordedAt)}</span>
                  </div>
                ))}
              </div>
            )}
            {showHistory && locations.length === 0 && (
              <p className="text-dark-light text-sm">No location history yet.</p>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <DeviceCommands deviceId={device.id} status={device.status} onCommand={(type) => commandMutation.mutate({ type })} loading={commandMutation.isPending} />
          <DeviceHealth batteryLevel={device.batteryLevel} batteryCharging={device.batteryCharging} storageUsed={device.storageUsed} storageTotal={device.storageTotal} ipAddress={device.ipAddress} wifiSsid={device.wifiSsid} agentVersion={device.agentVersion} />
        </div>
      </div>
    </div>
  )
}