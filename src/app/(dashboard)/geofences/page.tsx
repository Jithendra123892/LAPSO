'use client'

import { useState, useEffect, useCallback } from 'react'
import { useMap, MapContainer, TileLayer, Circle, useMapEvents } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { Crosshair, Plus, Trash, ToggleLeft, ToggleRight, MapPin } from '@phosphor-icons/react'

interface Geofence {
  id: string
  name: string
  coordinates: { lat: number; lng: number }
  radius: number
  notifyOnEnter: boolean
  notifyOnExit: boolean
  enabled: boolean
  color: string
  createdAt: string
}

function AddGeofenceMode({ onAdd }: { onAdd: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onAdd(e.latlng.lat, e.latlng.lng)
    },
  })
  return null
}

export default function GeofencesPage() {
  const qc = useQueryClient()
  const [mode, setMode] = useState<'list' | 'create'>('list')
  const [selectedCoords, setSelectedCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    radius: 100,
    notifyOnEnter: true,
    notifyOnExit: true,
    enabled: true,
    color: '#FF6B6B',
  })
  const [toast, setToast] = useState<string | null>(null)

  const { data, refetch } = useQuery({
    queryKey: ['geofences'],
    queryFn: async () => {
      const res = await fetch('/api/geofences')
      if (!res.ok) throw new Error('Failed to fetch geofences')
      return res.json() as Promise<{ geofences: Geofence[] }>
    },
  })

  const createMutation = useMutation({
    mutationFn: async (payload: typeof formData & { coordinates: { lat: number; lng: number } }) => {
      const res = await fetch('/api/geofences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error('Failed to create geofence')
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
    mutationFn: async (id: string) => {
      await fetch(`/api/geofences/${id}`, { method: 'DELETE' })
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['geofences'] })
      showToast('Geofence deleted')
    },
  })

  const toggleMutation = useMutation({
    mutationFn: async ({ id, enabled }: { id: string; enabled: boolean }) => {
      const res = await fetch(`/api/geofences/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled }),
      })
      if (!res.ok) throw new Error('Failed to toggle')
      return res.json()
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['geofences'] }),
  })

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  const geofences = data?.geofences || []

  return (
    <div className="min-h-screen bg-surface-alt p-6">
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="fixed top-4 right-4 z-50 neo-card bg-primary text-white px-4 py-3 font-body text-sm font-medium shadow-neo"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-heading text-3xl font-bold text-dark">Geofences</h1>
            <p className="font-body text-sm text-dark-light mt-1">
              {geofences.length} zone{geofences.length !== 1 ? 's' : ''} defined
            </p>
          </div>
          <button
            onClick={() => setMode(mode === 'list' ? 'create' : 'list')}
            className={`neo-btn-primary flex items-center gap-2 ${mode === 'create' ? 'bg-dark text-white' : ''}`}
          >
            <Plus weight="bold" size={18} />
            {mode === 'list' ? 'New Zone' : 'Back to List'}
          </button>
        </div>

        {mode === 'list' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {geofences.length === 0 && (
              <div className="col-span-full text-center py-16 neo-card">
                <MapPin size={48} className="mx-auto mb-3 text-dark-light" weight="duotone" />
                <p className="font-heading text-lg text-dark">No geofences yet</p>
                <p className="font-body text-sm text-dark-light mt-1">Create a zone to get notified when devices enter or leave areas.</p>
                <button onClick={() => setMode('create')} className="neo-btn-primary mt-4">
                  <Plus size={16} weight="bold" className="inline mr-1" /> Create first zone
                </button>
              </div>
            )}
            {geofences.map((gf) => (
              <GeofenceCard
                key={gf.id}
                geofence={gf}
                onToggle={(enabled) => toggleMutation.mutate({ id: gf.id, enabled })}
                onDelete={() => {
                  if (confirm(`Delete "${gf.name}"?`)) deleteMutation.mutate(gf.id)
                }}
              />
            ))}
          </div>
        ) : (
          <CreateGeofenceView
            formData={formData}
            setFormData={setFormData}
            selectedCoords={selectedCoords}
            setSelectedCoords={setSelectedCoords}
            onSubmit={() => {
              if (!selectedCoords) { alert('Click on the map to set a location'); return }
              if (!formData.name.trim()) { alert('Enter a name'); return }
              createMutation.mutate({ ...formData, coordinates: selectedCoords })
            }}
            isPending={createMutation.isPending}
          />
        )}
      </div>
    </div>
  )
}

function GeofenceCard({ geofence, onToggle, onDelete }: {
  geofence: Geofence
  onToggle: (enabled: boolean) => void
  onDelete: () => void
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="neo-card p-4 bg-surface"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-none" style={{ backgroundColor: geofence.color }} />
          <span className="font-heading font-semibold text-dark">{geofence.name}</span>
        </div>
        <span className={`text-xs font-mono px-2 py-0.5 border-2 ${geofence.enabled ? 'bg-secondary text-dark border-dark' : 'bg-surface-alt text-dark-light border-dark-light'}`}>
          {geofence.enabled ? 'Active' : 'Paused'}
        </span>
      </div>

      <div className="font-body text-xs text-dark-light space-y-1 mb-4">
        <p>Location: {geofence.coordinates.lat.toFixed(4)}, {geofence.coordinates.lng.toFixed(4)}</p>
        <p>Radius: {geofence.radius}m</p>
        <div className="flex gap-3 mt-1">
          {geofence.notifyOnEnter && <span className="text-secondary font-medium">↗ Enter alerts</span>}
          {geofence.notifyOnExit && <span className="text-primary font-medium">↘ Exit alerts</span>}
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => onToggle(!geofence.enabled)}
          className={`neo-btn-ghost flex-1 flex items-center justify-center gap-1 text-xs ${geofence.enabled ? '' : 'opacity-50'}`}
        >
          {geofence.enabled ? <ToggleRight size={16} weight="bold" className="text-secondary" /> : <ToggleLeft size={16} weight="bold" />}
          {geofence.enabled ? 'Disable' : 'Enable'}
        </button>
        <button onClick={onDelete} className="neo-btn-danger text-xs px-3">
          <Trash size={14} weight="bold" />
        </button>
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
    <div className="neo-card p-6 bg-surface">
      <h2 className="font-heading text-xl font-bold text-dark mb-4 flex items-center gap-2">
        <Crosshair weight="bold" size={20} className="text-primary" />
        Create New Zone
      </h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Map Pick */}
        <div>
          <p className="font-body text-sm font-medium text-dark mb-2">Click map to set center point</p>
          <div className="border-3 border-dark shadow-neo overflow-hidden" style={{ height: '350px' }}>
            <MapContainer center={[20.5937, 78.9629]} zoom={5} className="h-full w-full">
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <AddGeofenceMode onAdd={(lat, lng) => setSelectedCoords({ lat, lng })} />
              {selectedCoords && (
                <>
                  <Circle
                    center={[selectedCoords.lat, selectedCoords.lng]}
                    radius={formData.radius}
                    pathOptions={{ color: formData.color, fillOpacity: 0.2, weight: 3, dashArray: '5,5' }}
                  />
                </>
              )}
            </MapContainer>
          </div>
          {selectedCoords && (
            <p className="font-mono text-xs text-dark-light mt-2">
              Selected: {selectedCoords.lat.toFixed(6)}, {selectedCoords.lng.toFixed(6)}
            </p>
          )}
        </div>

        {/* Form */}
        <div className="space-y-4">
          <div>
            <label className="neo-label">Zone Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Home, Office, School"
              className="neo-input w-full"
            />
          </div>

          <div>
            <label className="neo-label">Radius: {formData.radius}m</label>
            <input
              type="range"
              min="50"
              max="2000"
              step="50"
              value={formData.radius}
              onChange={(e) => setFormData({ ...formData, radius: parseInt(e.target.value) })}
              className="w-full"
            />
            <div className="flex justify-between font-mono text-xs text-dark-light mt-1">
              <span>50m</span><span>2km</span>
            </div>
          </div>

          <div>
            <label className="neo-label">Zone Color</label>
            <div className="flex gap-2">
              {COLOR_OPTIONS.map((c) => (
                <button
                  key={c}
                  onClick={() => setFormData({ ...formData, color: c })}
                  className={`w-8 h-8 border-3 ${formData.color === c ? 'border-dark scale-110' : 'border-transparent'}`}
                  style={{ backgroundColor: c, transform: formData.color === c ? 'scale(1.1)' : undefined }}
                />
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="neo-label">Alert Triggers</label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.notifyOnEnter}
                onChange={(e) => setFormData({ ...formData, notifyOnEnter: e.target.checked })}
                className="neo-checkbox"
              />
              <span className="font-body text-sm text-dark">Notify when device enters zone</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.notifyOnExit}
                onChange={(e) => setFormData({ ...formData, notifyOnExit: e.target.checked })}
                className="neo-checkbox"
              />
              <span className="font-body text-sm text-dark">Notify when device exits zone</span>
            </label>
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.enabled}
              onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })}
              className="neo-checkbox"
            />
            <span className="font-body text-sm text-dark">Enable immediately</span>
          </label>

          <button
            onClick={onSubmit}
            disabled={isPending || !selectedCoords}
            className="neo-btn-primary w-full mt-2 disabled:opacity-50"
          >
            {isPending ? 'Creating...' : 'Create Geofence'}
          </button>
        </div>
      </div>
    </div>
  )
}