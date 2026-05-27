'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import 'leaflet/dist/leaflet.css'
const GeofenceMapPicker = dynamic(
  () => import('@/components/geofences/geofence-map-picker').then(m => m.GeofenceMapPicker),
  { ssr: false, loading: () => <div className="border-3 border-dark h-[360px] bg-surface-alt flex items-center justify-center"><span className="font-mono text-xs text-dark-light">Loading map...</span></div> }
)

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { Crosshair, Plus, Trash, ToggleLeft, ToggleRight, MapPin } from '@phosphor-icons/react'
import { BlobDevice } from '@/components/illustrations/blob-device'

interface Geofence {
  id: string; name: string; coordinates: { lat: number; lng: number }; radius: number
  notifyOnEnter: boolean; notifyOnExit: boolean; enabled: boolean; color: string; createdAt: string
}

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
}
const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.25, ease: [0.2, 0, 0, 1] } },
}

function GeofenceCard({ geofence, onToggle, onDelete }: {
  geofence: Geofence; onToggle: (enabled: boolean) => void; onDelete: () => void
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2, transition: { duration: 0.1 } }}
      className="neo-card p-4 bg-surface"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-none border-2 border-dark" style={{ backgroundColor: geofence.color }} />
          <span className="font-heading font-semibold text-dark">{geofence.name}</span>
        </div>
        <span className={`text-xs font-mono font-bold px-2 py-0.5 border-2 border-dark ${geofence.enabled ? 'bg-secondary text-dark' : 'bg-surface-alt text-dark-light'}`}>
          {geofence.enabled ? 'Active' : 'Paused'}
        </span>
      </div>

      <div className="font-body text-xs text-dark-light space-y-1 mb-4">
        <p className="font-mono">{geofence.coordinates.lat.toFixed(4)}, {geofence.coordinates.lng.toFixed(4)}</p>
        <p className="font-heading font-bold">{geofence.radius}m radius</p>
        <div className="flex gap-3 mt-1">
          {geofence.notifyOnEnter && <span className="text-secondary font-bold text-[11px]">↗ Enter alerts</span>}
          {geofence.notifyOnExit && <span className="text-primary font-bold text-[11px]">↘ Exit alerts</span>}
        </div>
      </div>

      <div className="flex gap-2">
        <motion.button
          whileHover={{ y: -1 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => onToggle(!geofence.enabled)}
          className={`neo-btn-ghost flex-1 flex items-center justify-center gap-1 text-xs ${geofence.enabled ? '' : 'opacity-50'}`}
        >
          {geofence.enabled ? <ToggleRight size={16} weight="bold" className="text-secondary" /> : <ToggleLeft size={16} weight="bold" />}
          {geofence.enabled ? 'Disable' : 'Enable'}
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onDelete}
          className="neo-btn-danger text-xs px-3 py-1"
        >
          <Trash size={14} weight="bold" />
        </motion.button>
      </div>
    </motion.div>
  )
}

function CreateGeofenceView({ formData, setFormData, selectedCoords, setSelectedCoords, onSubmit, isPending }: {
  formData: { name: string; radius: number; notifyOnEnter: boolean; notifyOnExit: boolean; enabled: boolean; color: string }
  setFormData: (d: typeof formData) => void
  selectedCoords: { lat: number; lng: number } | null
  setSelectedCoords: (c: { lat: number; lng: number } | null) => void
  onSubmit: () => void
  isPending: boolean
}) {
  const COLOR_OPTIONS = ['#FF6B6B', '#4ECDC4', '#FFE66D', '#A855F7', '#3B82F6', '#22C55E']

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="neo-card p-6 bg-surface"
    >
      <h2 className="font-heading text-xl font-bold text-dark mb-6 flex items-center gap-2">
        <Crosshair weight="bold" size={20} className="text-primary" />
        Create New Zone
      </h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Map Pick */}
        <div>
          <p className="font-heading font-bold text-xs text-dark mb-2 uppercase tracking-wide">Click map to set center</p>
          <div className="border-3 border-dark overflow-hidden" style={{ boxShadow: '4px 4px 0 0 #2D3436', height: '360px' }}>
            <GeofenceMapPicker selectedCoords={selectedCoords} onSelect={setSelectedCoords} radius={formData.radius} color={formData.color} />
          </div>
          <AnimatePresence>
            {selectedCoords && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="font-mono text-xs text-dark-light mt-2 font-bold"
              >
                Selected: {selectedCoords.lat.toFixed(6)}, {selectedCoords.lng.toFixed(6)}
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        {/* Form */}
        <div className="space-y-5">
          <div className="neo-input-row">
            <label className="neo-label">Zone Name</label>
            <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="e.g. Home, Office" className="neo-input w-full" />
          </div>

          <div className="neo-input-row">
            <label className="neo-label">Radius: {formData.radius}m</label>
            <input type="range" min="50" max="2000" step="50" value={formData.radius} onChange={(e) => setFormData({ ...formData, radius: parseInt(e.target.value) })} className="w-full" />
            <div className="flex justify-between font-mono text-[10px] text-dark-light">
              <span>50m</span><span>2km</span>
            </div>
          </div>

          <div className="neo-input-row">
            <label className="neo-label">Zone Color</label>
            <div className="flex gap-2">
              {COLOR_OPTIONS.map((c) => (
                <motion.button
                  key={c}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setFormData({ ...formData, color: c })}
                  className={`w-8 h-8 border-3 ${formData.color === c ? 'border-dark scale-110' : 'border-transparent'}`}
                  style={{ backgroundColor: c, transform: formData.color === c ? 'scale(1.1)' : undefined }}
                />
              ))}
            </div>
          </div>

          <div className="space-y-2 neo-input-row">
            <label className="neo-label">Alert Triggers</label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={formData.notifyOnEnter} onChange={(e) => setFormData({ ...formData, notifyOnEnter: e.target.checked })} className="neo-checkbox" />
              <span className="font-body text-sm text-dark">Device enters zone</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={formData.notifyOnExit} onChange={(e) => setFormData({ ...formData, notifyOnExit: e.target.checked })} className="neo-checkbox" />
              <span className="font-body text-sm text-dark">Device exits zone</span>
            </label>
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={formData.enabled} onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })} className="neo-checkbox" />
            <span className="font-body text-sm text-dark font-heading font-bold">Enable immediately</span>
          </label>

          <motion.button
            whileHover={{ y: -2, boxShadow: '5px 5px 0 0 #2D3436' }}
            whileTap={{ scale: 0.97, boxShadow: '2px 2px 0 0 #2D3436' }}
            onClick={onSubmit}
            disabled={isPending || !selectedCoords}
            className="neo-btn-primary w-full mt-2 font-heading font-bold disabled:opacity-40"
          >
            {isPending ? 'Creating...' : 'Create Geofence'}
          </motion.button>
        </div>
      </div>
    </motion.div>
  )
}

export default function GeofencesPage() {
  const qc = useQueryClient()
  const [mode, setMode] = useState<'list' | 'create'>('list')
  const [selectedCoords, setSelectedCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [formData, setFormData] = useState({ name: '', radius: 100, notifyOnEnter: true, notifyOnExit: true, enabled: true, color: '#FF6B6B' })
  const [toast, setToast] = useState<string | null>(null)

  const { data, refetch } = useQuery({
    queryKey: ['geofences'],
    queryFn: async () => {
      const res = await fetch('/api/geofences')
      if (!res.ok) throw new Error('Failed')
      return res.json() as Promise<{ geofences: Geofence[] }>
    },
  })

  const createMutation = useMutation({
    mutationFn: async (payload: typeof formData & { coordinates: { lat: number; lng: number } }) => {
      const res = await fetch('/api/geofences', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      if (!res.ok) throw new Error()
      return res.json()
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['geofences'] })
      setMode('list')
      setSelectedCoords(null)
      setFormData({ name: '', radius: 100, notifyOnEnter: true, notifyOnExit: true, enabled: true, color: '#FF6B6B' })
      showToast('Geofence created!')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { await fetch(`/api/geofences/${id}`, { method: 'DELETE' }) },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['geofences'] }); showToast('Geofence deleted') },
  })

  const toggleMutation = useMutation({
    mutationFn: async ({ id, enabled }: { id: string; enabled: boolean }) => {
      await fetch(`/api/geofences/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ enabled }) })
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['geofences'] }),
  })

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000) }
  const geofences = data?.geofences || []

  return (
    <div className="min-h-screen bg-surface-alt p-6">
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10 }}
            className="fixed top-4 right-4 z-50 neo-card bg-primary text-white px-4 py-3 font-body text-sm font-bold shadow-neo"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-heading text-3xl font-bold text-dark flex items-center gap-2">
              <MapPin size={28} weight="bold" className="text-primary" />
              Geofences
            </h1>
            <p className="font-body text-sm text-dark-light mt-1">
              {geofences.length} zone{geofences.length !== 1 ? 's' : ''} defined
            </p>
          </div>
          <motion.button
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setMode(mode === 'list' ? 'create' : 'list')}
            className={`neo-btn-primary flex items-center gap-2 ${mode === 'create' ? 'bg-dark text-white' : ''}`}
          >
            <Plus weight="bold" size={18} />
            {mode === 'list' ? 'New Zone' : 'Back to List'}
          </motion.button>
        </div>

        {mode === 'list' ? (
          geofences.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="neo-empty-state"
            >
              <BlobDevice mood="neutral" size={80} type="laptop" />
              <h3 className="font-heading font-bold text-xl text-dark mt-4">No geofences yet</h3>
              <p className="font-body text-sm text-dark-light mt-2 max-w-xs mx-auto">
                Create a zone to get notified when devices enter or leave areas.
              </p>
              <motion.button whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }} onClick={() => setMode('create')} className="neo-btn-primary mt-6">
                <Plus size={16} weight="bold" className="inline mr-1" /> Create first zone
              </motion.button>
            </motion.div>
          ) : (
            <motion.div variants={containerVariants} initial="hidden" animate="show" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {geofences.map((gf) => (
                <GeofenceCard key={gf.id} geofence={gf} onToggle={(enabled) => toggleMutation.mutate({ id: gf.id, enabled })} onDelete={() => { if (confirm(`Delete "${gf.name}"?`)) deleteMutation.mutate(gf.id) }} />
              ))}
            </motion.div>
          )
        ) : (
          <CreateGeofenceView formData={formData} setFormData={setFormData} selectedCoords={selectedCoords} setSelectedCoords={setSelectedCoords} onSubmit={() => { if (!selectedCoords) { alert('Click on the map to set a location'); return }; if (!formData.name.trim()) { alert('Enter a name'); return }; createMutation.mutate({ ...formData, coordinates: selectedCoords }) }} isPending={createMutation.isPending} />
        )}
      </div>
    </div>
  )
}