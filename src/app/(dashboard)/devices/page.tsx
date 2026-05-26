'use client'

import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { useAppStore } from '@/store/app-store'
import { DeviceCard } from '@/components/devices/device-card'
import { DeviceGrid } from '@/components/devices/device-grid'

export default function DevicesPage() {
  const accessToken = useAppStore((s) => s.accessToken)
  const [showAdd, setShowAdd] = useState(false)
  const [newName, setNewName] = useState('My Device')
  const [newType, setNewType] = useState('laptop')
  const [newPlatform, setNewPlatform] = useState('windows')

  const { data: devices = [], refetch } = useQuery({
    queryKey: ['devices'],
    queryFn: async () => {
      const res = await fetch('/api/devices', { headers: { Authorization: `Bearer ${accessToken}` } })
      if (!res.ok) throw new Error()
      return res.json()
    },
    enabled: !!accessToken,
  })

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch('/api/devices', { method: 'POST', headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
      if (!res.ok) throw new Error()
      return res.json()
    },
    onSuccess: () => refetch(),
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-heading font-bold">Devices</h1>
        <button className="neo-btn-primary" onClick={() => setShowAdd(true)}>+ Add Device</button>
      </div>
      <DeviceGrid devices={devices} onAddClick={() => setShowAdd(true)} />
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-dark/50" onClick={(e) => e.target === e.currentTarget && setShowAdd(false)}>
          <div className="neo-card max-w-md w-full">
            <h2 className="text-xl font-heading font-bold mb-4">Add Device</h2>
            <form onSubmit={(e) => { e.preventDefault(); createMutation.mutate({ name: newName, deviceType: newType, platform: newPlatform }); setShowAdd(false) }} className="flex flex-col gap-4">
              <input className="neo-input" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Device name" />
              <select className="neo-input" value={newType} onChange={(e) => setNewType(e.target.value)}>
                <option value="laptop">Laptop</option><option value="phone">Phone</option><option value="tablet">Tablet</option><option value="desktop">Desktop</option>
              </select>
              <select className="neo-input" value={newPlatform} onChange={(e) => setNewPlatform(e.target.value)}>
                <option value="windows">Windows</option><option value="macos">macOS</option><option value="linux">Linux</option><option value="android">Android</option><option value="ios">iOS</option>
              </select>
              <div className="flex gap-3">
                <button type="button" className="neo-btn-ghost flex-1" onClick={() => setShowAdd(false)}>Cancel</button>
                <button type="submit" className="neo-btn-primary flex-1">Add</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}