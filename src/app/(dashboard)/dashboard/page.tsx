'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAppStore } from '@/store/app-store'
import dynamic from 'next/dynamic'

const LiveMap = dynamic(() => import('@/components/map/live-map').then(m => m.LiveMap), { ssr: false })
const DeviceGrid = dynamic(() => import('@/components/devices/device-grid').then(m => m.DeviceGrid), { ssr: false })

export default function DashboardPage() {
  const accessToken = useAppStore((s) => s.accessToken)
  const queryClient = useQueryClient()
  const [showAdd, setShowAdd] = useState(false)
  const [newName, setNewName] = useState('')
  const [newType, setNewType] = useState('laptop')
  const [newPlatform, setNewPlatform] = useState('windows')

  const { data: devices = [] } = useQuery({
    queryKey: ['devices'],
    queryFn: async () => {
      const res = await fetch('/api/devices', { headers: { Authorization: `Bearer ${accessToken}` } })
      if (!res.ok) throw new Error('Failed to fetch')
      return res.json()
    },
    enabled: !!accessToken,
  })

  const createMutation = useMutation({
    mutationFn: async (data: { name: string; deviceType: string; platform: string }) => {
      const res = await fetch('/api/devices', {
        method: 'POST', headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Failed')
      return res.json()
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['devices'] }); setShowAdd(false); setNewName('') },
  })

  const mapDevices = devices
    .filter((d: any) => d.lastLatitude && d.lastLongitude)
    .map((d: any) => ({ id: d.id, name: d.name, deviceType: d.deviceType, status: d.status, lat: d.lastLatitude, lng: d.lastLongitude, accuracy: d.lastAccuracy }))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold">Dashboard</h1>
          <p className="text-dark-light text-sm">{devices.length} device{devices.length !== 1 ? 's' : ''} tracked</p>
        </div>
        <button className="neo-btn-primary" onClick={() => setShowAdd(true)}>+ Add Device</button>
      </div>

      {mapDevices.length > 0 && <LiveMap devices={mapDevices} />}

      <div>
        <h2 className="text-lg font-heading font-bold mb-4">Your Devices</h2>
        <DeviceGrid devices={devices} onAddClick={() => setShowAdd(true)} />
      </div>

      {/* Add Device Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-dark/50" onClick={(e) => e.target === e.currentTarget && setShowAdd(false)}>
          <div className="neo-card max-w-md w-full animate-bounce-in">
            <h2 className="text-xl font-heading font-bold mb-4">Add Device</h2>
            <form onSubmit={(e) => { e.preventDefault(); createMutation.mutate({ name: newName, deviceType: newType, platform: newPlatform }) }} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="font-heading font-bold text-sm">Device Name</label>
                <input className="neo-input" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="My Laptop" required />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="font-heading font-bold text-sm">Type</label>
                <select className="neo-input" value={newType} onChange={(e) => setNewType(e.target.value)}>
                  <option value="laptop">Laptop</option><option value="phone">Phone</option><option value="tablet">Tablet</option><option value="desktop">Desktop</option>
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="font-heading font-bold text-sm">Platform</label>
                <select className="neo-input" value={newPlatform} onChange={(e) => setNewPlatform(e.target.value)}>
                  <option value="windows">Windows</option><option value="macos">macOS</option><option value="linux">Linux</option><option value="android">Android</option><option value="ios">iOS</option>
                </select>
              </div>
              <div className="flex gap-3">
                <button type="button" className="neo-btn-ghost flex-1" onClick={() => setShowAdd(false)}>Cancel</button>
                <button type="submit" className="neo-btn-primary flex-1" disabled={createMutation.isPending}>
                  {createMutation.isPending ? 'Adding...' : 'Add Device'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}