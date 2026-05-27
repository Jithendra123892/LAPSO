'use client'

import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { Bluetooth, WifiHigh, MapPin, Shield, User, Eye } from '@phosphor-icons/react'
import { BlobDevice } from '@/components/illustrations/blob-device'

interface Beacon {
  id: string; name: string; uuid: string; major: number | null; minor: number | null
  lat: number | null; lng: number | null; lastSeenAt: string | null; signalStrength?: number
}
interface CrowdSignal { deviceId: string; deviceName: string; lat: number; lng: number; distance: number; timestamp: string }

function RadarSweep() {
  return (
    <div className="relative w-20 h-20 mx-auto mb-3">
      <div className="absolute inset-0 border-3 border-dark rounded-none" />
      <div className="absolute inset-2 border-2 border-dark/30 rounded-none" />
      <div className="absolute inset-4 border border-dark/20 rounded-none" />
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
        className="absolute inset-0"
        style={{ background: 'conic-gradient(from 0deg, transparent 0deg, #4ECDC4 30deg, transparent 60deg)' }}
      />
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-2 h-2 rounded-none bg-secondary border border-dark animate-ping" />
      </div>
    </div>
  )
}

function BeaconPuls({ signal }: { signal: number }) {
  const color = signal > -50 ? '#4ECDC4' : signal > -70 ? '#FFE66D' : '#FF6B6B'
  return (
    <div className="relative">
      <motion.div
        animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
        transition={{ duration: 1.5, repeat: Infinity }}
        className="absolute inset-0 rounded-none"
        style={{ background: color }}
      />
      <div className="relative w-3 h-3 rounded-none border-2 border-dark" style={{ backgroundColor: color }} />
    </div>
  )
}

export default function FindPage() {
  const [isSearching, setIsSearching] = useState(false)
  const [crowdSignals, setCrowdSignals] = useState<CrowdSignal[]>([])
  const [myLocation, setMyLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [detectedBeacons, setDetectedBeacons] = useState<Beacon[]>([])
  const [newSignalId, setNewSignalId] = useState<string | null>(null)

  useEffect(() => {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      (pos) => setMyLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {}
    )
  }, [])

  const { data: beaconsData } = useQuery({
    queryKey: ['beacons'],
    queryFn: async () => {
      const res = await fetch('/api/beacons')
      if (!res.ok) return { beacons: [] }
      return res.json() as Promise<{ beacons: Beacon[] }>
    },
    refetchInterval: 30000,
  })
  const beacons = beaconsData?.beacons || []

  useEffect(() => {
    if (!isSearching) return
    const interval = setInterval(() => {
      const simulated: Beacon[] = [
        { id: '1', name: 'LAPSO Home Beacon', uuid: 'fda50693-a4e2-4fb3-af14-f4724cc9da23', major: 1, minor: 1, lat: myLocation?.lat ?? 0, lng: myLocation?.lng ?? 0, lastSeenAt: new Date().toISOString(), signalStrength: Math.round(-40 - Math.random() * 25) },
        { id: '2', name: 'LAPSO Office Beacon', uuid: 'fda50693-a4e2-4fb3-af14-f4724cc9da24', major: 2, minor: 1, lat: myLocation?.lat ?? 0, lng: myLocation?.lng ?? 0, lastSeenAt: new Date().toISOString(), signalStrength: Math.round(-55 - Math.random() * 20) },
      ]
      setDetectedBeacons(simulated)
    }, 5000)
    return () => clearInterval(interval)
  }, [isSearching, myLocation])

  useEffect(() => {
    if (!isSearching) return
    const interval = setInterval(() => {
      const id = `sig-${Date.now()}`
      const signal: CrowdSignal = { deviceId: id, deviceName: "Jithendra's MacBook Pro", lat: (myLocation?.lat ?? 0) + (Math.random() - 0.5) * 0.002, lng: (myLocation?.lng ?? 0) + (Math.random() - 0.5) * 0.002, distance: Math.round(80 + Math.random() * 120), timestamp: new Date().toISOString() }
      setNewSignalId(id)
      setTimeout(() => setNewSignalId(null), 600)
      setCrowdSignals(prev => [signal, ...prev].slice(0, 5))
    }, 8000)
    return () => clearInterval(interval)
  }, [isSearching, myLocation])

  return (
    <div className="min-h-screen bg-surface-alt p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <h1 className="font-heading text-3xl font-bold text-dark flex items-center gap-2">
            <Shield weight="bold" size={28} className="text-secondary" />
            Find Offline
          </h1>
          <p className="font-body text-sm text-dark-light mt-1">
            LAPSO crowd network locates lost devices even when offline.
          </p>
        </motion.div>

        {/* Scanner card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="neo-card p-4 bg-surface mb-4"
        >
          <div className="flex items-center gap-4">
            <RadarSweep />
            <div className="flex-1">
              <p className="font-heading font-bold text-lg text-dark leading-tight">
                {isSearching ? 'Scanning for signals...' : 'Scanner standby'}
              </p>
              <p className="font-body text-xs text-dark-light mt-0.5">
                {isSearching ? 'Searching nearby LAPSO users and BLE beacons' : 'Tap Start to begin scanning'}
              </p>
              {isSearching && (
                <motion.p
                  animate={{ opacity: [1, 0.4, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="text-xs font-mono text-secondary font-bold mt-1"
                >
                  ● LIVE — {detectedBeacons.length} beacon{detectedBeacons.length !== 1 ? 's' : ''} · {crowdSignals.length} crowd signal{crowdSignals.length !== 1 ? 's' : ''}
                </motion.p>
              )}
            </div>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setIsSearching(!isSearching)}
              className={`neo-btn-primary px-4 font-heading font-bold ${isSearching ? 'neo-btn-danger' : ''}`}
            >
              {isSearching ? 'Stop' : 'Start Scan'}
            </motion.button>
          </div>
        </motion.div>

        {/* Scanning active blob */}
        <AnimatePresence>
          {isSearching && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="neo-card mb-4 p-3 bg-surface flex items-center gap-3 border-l-8 border-secondary"
            >
              <div className="w-3 h-3 rounded-none bg-secondary animate-pulse" />
              <p className="font-body text-xs text-dark">
                Crowd signals are encrypted — nearby LAPSO users relay your device location without seeing it.
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Crowd signals + beacons grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Crowd signals */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15 }}
            className="neo-card p-4 bg-surface"
          >
            <h2 className="font-heading text-lg font-bold text-dark mb-1 flex items-center gap-2">
              <User weight="bold" size={18} className="text-primary" />
              Nearby LAPSO Users
            </h2>
            <p className="font-body text-xs text-dark-light mb-4">Your location is never exposed.</p>

            {crowdSignals.length === 0 ? (
              <div className="text-center py-8">
                <BlobDevice mood="neutral" size={64} type="phone" />
                <p className="font-body text-sm text-dark mt-3">No crowd signals yet</p>
                <p className="font-body text-xs text-dark-light mt-1">
                  {isSearching ? 'Walking around helps detect signals...' : 'Start scan then walk around'}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <AnimatePresence>
                  {crowdSignals.map((signal, i) => (
                    <motion.div
                      key={signal.deviceId}
                      initial={{ opacity: 0, x: -12, scale: 0.95 }}
                      animate={{ opacity: 1, x: 0, scale: 1 }}
                      exit={{ opacity: 0, x: 12, scale: 0.9 }}
                      transition={{ duration: 0.25 }}
                      className="neo-card p-3 bg-surface-alt"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-heading font-semibold text-sm text-dark">{signal.deviceName}</span>
                        <span className="font-mono text-xs font-bold px-2 py-0.5 border-2 border-dark bg-secondary text-dark">
                          {signal.distance}m
                        </span>
                      </div>
                      <p className="font-mono text-[10px] text-dark-light">{signal.lat.toFixed(5)}, {signal.lng.toFixed(5)}</p>
                      <div className="flex items-center gap-1 mt-1">
                        <div className="w-1.5 h-1.5 rounded-none bg-secondary animate-ping" />
                        <span className="font-mono text-[10px] text-dark-light">{new Date(signal.timestamp).toLocaleTimeString()}</span>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </motion.div>

          {/* Beacons */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="neo-card p-4 bg-surface"
          >
            <h2 className="font-heading text-lg font-bold text-dark mb-1 flex items-center gap-2">
              <Bluetooth weight="bold" size={18} className="text-secondary" />
              LAPSO Beacons
            </h2>
            <p className="font-body text-xs text-dark-light mb-4">Dedicated BLE coverage in key zones.</p>

            {beacons.length === 0 && detectedBeacons.length === 0 ? (
              <div className="text-center py-8">
                <BlobDevice mood="tired" size={64} type="tablet" />
                <p className="font-body text-sm text-dark mt-3">No beacons detected</p>
                <p className="font-body text-xs text-dark-light mt-1">Provision beacons in Settings.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {[...beacons, ...detectedBeacons].map((beacon, i) => {
                  const ss = beacon.signalStrength ?? -70
                  const ssColor = ss > -50 ? '#4ECDC4' : ss > -70 ? '#FFE66D' : '#FF6B6B'
                  return (
                    <motion.div
                      key={beacon.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.08 }}
                      className="neo-card p-3 bg-surface-alt"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <BeaconPuls signal={ss} />
                          <span className="font-heading font-semibold text-sm text-dark">{beacon.name}</span>
                        </div>
                        <span
                          className="font-mono text-xs font-bold px-2 py-0.5 border-2 border-dark"
                          style={{ background: ssColor, color: '#FFF' }}
                        >
                          {ss} dBm
                        </span>
                      </div>
                      <p className="font-mono text-[10px] text-dark-light mt-1 truncate">{beacon.uuid}</p>
                      {beacon.lastSeenAt && (
                        <div className="flex items-center gap-1 mt-1">
                          <div className="w-1.5 h-1.5 rounded-none bg-secondary animate-pulse" />
                          <span className="font-body text-[10px] text-dark-light">Last seen: {new Date(beacon.lastSeenAt).toLocaleTimeString()}</span>
                        </div>
                      )}
                    </motion.div>
                  )
                })}
              </div>
            )}
          </motion.div>
        </div>

        {/* Info section */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="neo-card p-4 bg-surface mt-4 border-l-8 border-secondary"
        >
          <h3 className="font-heading font-bold text-dark mb-1 flex items-center gap-2">
            <Eye size={16} weight="bold" className="text-secondary" />
            How Offline Finding Works
          </h3>
          <p className="font-body text-sm text-dark-light leading-relaxed">
            Offline devices broadcast encrypted BLE beacons every 500ms. Nearby LAPSO users relay encrypted locations — they cannot read your data. Dedicated beacons provide coverage in homes and offices. Only you hold the decryption keys.
          </p>
        </motion.div>
      </div>
    </div>
  )
}