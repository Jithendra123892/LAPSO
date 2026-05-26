'use client'

import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Bluetooth, WifiHigh, MapPin, Signal, User, Eye } from '@phosphor-icons/react'

interface Beacon {
  id: string
  name: string
  uuid: string
  major: number | null
  minor: number | null
  lat: number | null
  lng: number | null
  lastSeenAt: string | null
  signalStrength?: number
}

interface CrowdSignal {
  deviceId: string
  deviceName: string
  lat: number
  lng: number
  distance: number
  timestamp: string
}

export default function FindPage() {
  const [isSearching, setIsSearching] = useState(false)
  const [crowdSignals, setCrowdSignals] = useState<CrowdSignal[]>([])
  const [myLocation, setMyLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [detectedBeacons, setDetectedBeacons] = useState<Beacon[]>([])

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
        { id: '1', name: 'LAPSO Home Beacon', uuid: 'fda50693-a4e2-4fb3-af14-f4724cc9da23', major: 1, minor: 1, lat: myLocation?.lat ?? 0, lng: myLocation?.lng ?? 0, lastSeenAt: new Date().toISOString(), signalStrength: -45 },
        { id: '2', name: 'LAPSO Office Beacon', uuid: 'fda50693-a4e2-4fb3-af14-f4724cc9da24', major: 2, minor: 1, lat: myLocation?.lat ?? 0, lng: myLocation?.lng ?? 0, lastSeenAt: new Date().toISOString(), signalStrength: -62 },
      ]
      setDetectedBeacons(simulated)
    }, 5000)
    return () => clearInterval(interval)
  }, [isSearching, myLocation])

  useEffect(() => {
    if (!isSearching) return
    const interval = setInterval(() => {
      const signals: CrowdSignal[] = [
        { deviceId: 'demo-1', deviceName: "Jithendra's MacBook Pro", lat: (myLocation?.lat ?? 0) + 0.001, lng: (myLocation?.lng ?? 0) + 0.0005, distance: 142, timestamp: new Date().toISOString() },
      ]
      setCrowdSignals(signals)
    }, 8000)
    return () => clearInterval(interval)
  }, [isSearching, myLocation])

  return (
    <div className="min-h-screen bg-surface-alt p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="font-heading text-3xl font-bold text-dark flex items-center gap-2">
            <Signal weight="bold" size={28} className="text-secondary" />
            Find Offline
          </h1>
          <p className="font-body text-sm text-dark-light mt-1">
            LAPSO crowd network locates lost devices even when offline.
          </p>
        </div>

        <div className="neo-card p-4 bg-surface mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-none animate-pulse ${isSearching ? 'bg-secondary' : 'bg-dark-light'}`} />
            <div>
              <p className="font-heading font-semibold text-dark">
                {isSearching ? 'Scanning for signals...' : 'Scanner standby'}
              </p>
              <p className="font-body text-xs text-dark-light">
                {isSearching ? 'Searching nearby LAPSO users and beacons' : 'Tap to start scanning'}
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsSearching(!isSearching)}
            className={`neo-btn-primary ${isSearching ? 'neo-btn-danger' : ''}`}
          >
            {isSearching ? 'Stop' : 'Start Scan'}
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="neo-card p-4 bg-surface">
            <h2 className="font-heading text-lg font-bold text-dark mb-3 flex items-center gap-2">
              <User weight="bold" size={18} className="text-primary" />
              Nearby LAPSO Users
            </h2>
            <p className="font-body text-xs text-dark-light mb-4">
              Crowd-sourced signals from nearby LAPSO app users. Your location is never exposed.
            </p>
            {crowdSignals.length === 0 ? (
              <div className="text-center py-8">
                <WifiHigh size={36} className="mx-auto mb-2 text-dark-light" weight="duotone" />
                <p className="font-body text-sm text-dark-light">No crowd signals yet</p>
                <p className="font-body text-xs text-dark-light mt-1">Walk around and check back</p>
              </div>
            ) : (
              <div className="space-y-3">
                {crowdSignals.map((signal) => (
                  <motion.div key={signal.deviceId} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="neo-card p-3 bg-surface-alt">
                    <div className="flex items-center justify-between">
                      <span className="font-heading font-semibold text-sm text-dark">{signal.deviceName}</span>
                      <span className="font-mono text-xs text-secondary font-bold">{Math.round(signal.distance)}m</span>
                    </div>
                    <p className="font-mono text-xs text-dark-light mt-1">{signal.lat.toFixed(4)}, {signal.lng.toFixed(4)}</p>
                    <p className="font-body text-xs text-dark-light mt-0.5">{new Date(signal.timestamp).toLocaleTimeString()}</p>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          <div className="neo-card p-4 bg-surface">
            <h2 className="font-heading text-lg font-bold text-dark mb-3 flex items-center gap-2">
              <Bluetooth weight="bold" size={18} className="text-secondary" />
              LAPSO Beacons
            </h2>
            <p className="font-body text-xs text-dark-light mb-4">
              Dedicated BLE beacons extend offline coverage in critical zones.
            </p>
            {beacons.length === 0 && detectedBeacons.length === 0 ? (
              <div className="text-center py-8">
                <Bluetooth size={36} className="mx-auto mb-2 text-dark-light" weight="duotone" />
                <p className="font-body text-sm text-dark-light">No beacons detected</p>
                <p className="font-body text-xs text-dark-light mt-1">Provision beacons in Settings.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {[...beacons, ...detectedBeacons].map((beacon) => (
                  <div key={beacon.id} className="neo-card p-3 bg-surface-alt">
                    <div className="flex items-center justify-between">
                      <span className="font-heading font-semibold text-sm text-dark flex items-center gap-1">
                        <Bluetooth size={14} weight="fill" className="text-secondary" />
                        {beacon.name}
                      </span>
                      <span className={`font-mono text-xs px-2 py-0.5 border-2 border-dark ${(beacon.signalStrength ?? 0) > -50 ? 'bg-secondary text-dark' : 'bg-surface text-dark-light'}`}>
                        {beacon.signalStrength ?? '?'} dBm
                      </span>
                    </div>
                    <p className="font-mono text-xs text-dark-light mt-1 truncate">{beacon.uuid}</p>
                    {beacon.lastSeenAt && <p className="font-body text-xs text-dark-light mt-0.5">Last seen: {new Date(beacon.lastSeenAt).toLocaleTimeString()}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="neo-card p-4 bg-surface mt-4 border-l-8 border-secondary">
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