'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAppStore } from '@/store/app-store'
import { motion, AnimatePresence } from 'framer-motion'
import { BlobDevice } from '@/components/illustrations/blob-device'
import { Devices, Plus, X, Laptop, DeviceMobile, Desktop } from '@phosphor-icons/react'
import dynamic from 'next/dynamic'

const LiveMap = dynamic(() => import('@/components/map/live-map').then(m => m.LiveMap), { ssr: false })

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
}
const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.25, ease: [0.2, 0, 0, 1] } },
}

const DEVICE_TYPES = [
  { value: 'laptop', label: 'Laptop', icon: Laptop, color: '#4ECDC4' },
  { value: 'phone', label: 'Phone', icon: DeviceMobile, color: '#A855F7' },
  { value: 'tablet', label: 'Tablet', icon: Devices, color: '#FFE66D' },
  { value: 'desktop', label: 'Desktop', icon: Desktop, color: '#3B82F6' },
]

const PLATFORMS = [
  { value: 'windows', label: 'Windows' },
  { value: 'macos', label: 'macOS' },
  { value: 'linux', label: 'Linux' },
  { value: 'android', label: 'Android' },
  { value: 'ios', label: 'iOS' },
]

export default function DashboardPage() {
  const qc = useQueryClient()
  const accessToken = useAppStore((s) => s.accessToken)
  const [showAdd, setShowAdd] = useState(false)
  const [newName, setNewName] = useState('')
  const [newType, setNewType] = useState('laptop')
  const [newPlatform, setNewPlatform] = useState('windows')
  const [submitSuccess, setSubmitSuccess] = useState(false)

  const { data: devices = [], isLoading } = useQuery({
    queryKey: ['devices'],
    queryFn: async () => {
      const res = await fetch('/api/devices', { headers: { Authorization: `Bearer ${accessToken}` } })
      if (!res.ok) throw new Error('Failed to fetch')
      const json = await res.json()
      return Array.isArray(json) ? json : json.devices || []
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
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['devices'] })
      setSubmitSuccess(true)
      setTimeout(() => { setShowAdd(false); setSubmitSuccess(false); setNewName('') }, 1500)
    },
  })

  const mapDevices = devices
    .filter((d: any) => d.lastLatitude && d.lastLongitude)
    .map((d: any) => ({ id: d.id, name: d.name, deviceType: d.deviceType, status: d.status, lat: d.lastLatitude, lng: d.lastLongitude, accuracy: d.lastAccuracy }))

  const onlineCount = devices.filter((d: any) => d.status === 'online').length

  return (
    <div className="space-y-8 p-6 max-w-7xl mx-auto">
      {/* Header */}
      <motion.div variants={itemVariants} initial="hidden" animate="show" className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold text-dark flex items-center gap-3">
            <Devices size={28} weight="bold" />
            Dashboard
          </h1>
          <p className="text-dark-light text-sm mt-1 font-body">
            {isLoading ? 'Loading...' : `${devices.length} device${devices.length !== 1 ? 's' : ''} tracked`}
            {isLoading ? '' : onlineCount > 0 && ` · ${onlineCount} online`}
          </p>
        </div>

        <motion.button
          whileHover={{ y: -2, boxShadow: '6px 6px 0 0 #2D3436' }}
          whileTap={{ scale: 0.97 }}
          className="neo-btn-primary flex items-center gap-2"
          onClick={() => setShowAdd(true)}
        >
          <Plus size={18} weight="bold" />
          Add Device
        </motion.button>
      </motion.div>

      {/* Stats Row */}
      {!isLoading && devices.length > 0 && (
        <motion.div variants={containerVariants} initial="hidden" animate="show" className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Total Devices', value: devices.length, color: '#FF6B6B' },
            { label: 'Online Now', value: onlineCount, color: '#4ECDC4' },
            { label: 'Offline', value: devices.length - onlineCount, color: '#636E72' },
            { label: 'Tracking Locations', value: mapDevices.length, color: '#A855F7' },
          ].map((stat) => (
            <motion.div key={stat.label} variants={itemVariants} className="neo-stat-card">
              <p className="font-mono text-2xl font-bold" style={{ color: stat.color }}>{isLoading ? '—' : stat.value}</p>
              <p className="font-heading text-xs font-bold text-dark-light mt-1 uppercase tracking-wide">{stat.label}</p>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Map */}
      {mapDevices.length > 0 && (
        <motion.div variants={itemVariants} initial="hidden" animate="show">
          <LiveMap devices={mapDevices} />
        </motion.div>
      )}

      {/* Devices Heading */}
      <motion.div variants={itemVariants} initial="hidden" animate="show" className="flex items-center justify-between">
        <h2 className="font-heading text-xl font-bold">Your Devices</h2>
        {devices.length > 0 && (
          <span className="neo-badge bg-dark text-white">{devices.length} total</span>
        )}
      </motion.div>

      {/* Devices Grid */}
      {isLoading ? (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="neo-card animate-pulse h-24 bg-surface-alt" />
          ))}
        </div>
      ) : devices.length === 0 ? (
        <motion.div variants={itemVariants} initial="hidden" animate="show" className="neo-empty-state">
          <div className="flex justify-center mb-4">
            <BlobDevice mood="neutral" size={100}>
              <animateTransform attributeName="transform" type="rotate" from="0 40 40" to="360 40 40" dur="8s" repeatCount="indefinite" />
            </BlobDevice>
          </div>
          <h3 className="font-heading font-bold text-xl text-dark mb-2">No devices yet</h3>
          <p className="font-body text-sm text-dark-light mb-6 max-w-xs mx-auto">
            Add your first device to start tracking. Install the LAPSO agent on your laptop or phone.
          </p>
          <motion.button
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.97 }}
            className="neo-btn-primary"
            onClick={() => setShowAdd(true)}
          >
            <Plus size={16} weight="bold" className="inline mr-1" />
            Add First Device
          </motion.button>
        </motion.div>
      ) : (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4"
        >
          {devices.map((device: any, i: number) => (
            <motion.div
              key={device.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06, duration: 0.25, ease: [0.2, 0, 0, 1] }}
            >
              <DeviceCard device={device} />
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Add Device Modal */}
      <AnimatePresence>
        {showAdd && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="neo-modal-backdrop"
            onClick={(e) => e.target === e.currentTarget && !submitSuccess && setShowAdd(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: 24, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.97 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              className="neo-card max-w-md w-full max-h-[90vh] overflow-y-auto"
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-heading text-xl font-bold text-dark flex items-center gap-2">
                  <Plus size={20} weight="bold" className="text-primary" />
                  Add New Device
                </h2>
                {!submitSuccess && (
                  <button onClick={() => setShowAdd(false)} className="neo-btn-ghost p-1.5">
                    <X size={18} weight="bold" />
                  </button>
                )}
              </div>

              {/* Success State */}
              <AnimatePresence>
                {submitSuccess ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-8"
                  >
                    <div className="w-16 h-16 mx-auto mb-4 border-3 border-dark rounded-none flex items-center justify-center" style={{ background: '#4ECDC4', boxShadow: '4px 4px 0 0 #2D3436' }}>
                      <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                        <path d="M5 14l7 7L23 7" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                    <p className="font-heading font-bold text-lg text-dark">Device added!</p>
                    <p className="font-body text-sm text-dark-light mt-1">Setting up agent...</p>
                  </motion.div>
                ) : (
                  <motion.form
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    onSubmit={(e) => {
                      e.preventDefault()
                      if (!newName.trim()) return
                      createMutation.mutate({ name: newName, deviceType: newType, platform: newPlatform })
                    }}
                    className="space-y-5"
                  >
                    {/* Device Name */}
                    <div className="neo-input-row">
                      <label className="neo-label">Device Name</label>
                      <input
                        className="neo-input w-full"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        placeholder="e.g. MacBook Pro, Work Laptop"
                        required
                        autoFocus
                      />
                    </div>

                    {/* Type Selection */}
                    <div className="neo-input-row">
                      <label className="neo-label">Device Type</label>
                      <div className="grid grid-cols-4 gap-2">
                        {DEVICE_TYPES.map(({ value, label, icon: TypeIcon, color }) => (
                          <motion.button
                            key={value}
                            type="button"
                            whileHover={{ y: -2 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setNewType(value)}
                            className={`p-3 border-3 text-center transition-all ${newType === value ? 'border-dark bg-surface-alt' : 'border-dark/30'}`}
                            style={newType === value ? { boxShadow: `4px 4px 0 0 ${color}` } : {}}
                          >
                            <TypeIcon size={22} weight={newType === value ? 'fill' : 'regular'} className="mx-auto mb-1" style={{ color: newType === value ? color : '#636E72' }} />
                            <span className="font-heading font-bold text-[10px] block" style={{ color: newType === value ? '#2D3436' : '#636E72' }}>{label}</span>
                          </motion.button>
                        ))}
                      </div>
                    </div>

                    {/* Platform Selection */}
                    <div className="neo-input-row">
                      <label className="neo-label">Platform / OS</label>
                      <select
                        className="neo-input w-full"
                        value={newPlatform}
                        onChange={(e) => setNewPlatform(e.target.value)}
                      >
                        {PLATFORMS.map(({ value, label }) => (
                          <option key={value} value={value}>{label}</option>
                        ))}
                      </select>
                    </div>

                    {/* Agent install hint */}
                    <div className="neo-card p-3 bg-surface-alt border-l-4 border-primary">
                      <p className="font-heading font-bold text-xs text-dark mb-0.5">How to install LAPSO agent:</p>
                      <p className="font-body text-xs text-dark-light">
                        After adding, head to Settings → Agents to get the download link for your device.
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-1">
                      <button type="button" className="neo-btn-ghost flex-1" onClick={() => setShowAdd(false)}>
                        Cancel
                      </button>
                      <motion.button
                        type="submit"
                        whileHover={{ y: -1, boxShadow: '5px 5px 0 0 #2D3436' }}
                        whileTap={{ scale: 0.97 }}
                        className="neo-btn-primary flex-1"
                        disabled={createMutation.isPending || !newName.trim()}
                      >
                        {createMutation.isPending ? (
                          <span className="flex items-center justify-center gap-2">
                            <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-none animate-spin" />
                            Adding...
                          </span>
                        ) : (
                          <span className="flex items-center justify-center gap-2">
                            <Plus size={16} weight="bold" />
                            Add Device
                          </span>
                        )}
                      </motion.button>
                    </div>
                  </motion.form>
                )}
              </AnimatePresence>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}