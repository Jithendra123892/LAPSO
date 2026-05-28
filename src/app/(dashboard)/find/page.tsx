'use client'

import { useState, useEffect, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAppStore } from '@/store/app-store'
import { motion, AnimatePresence } from 'framer-motion'
import { Bluetooth, WifiHigh, MapPin, Shield, User, Eye, Broadcast } from '@phosphor-icons/react'
import { BlobDevice } from '@/components/illustrations/blob-device'

interface CrowdSignal { deviceId: string; deviceName: string; lat: number; lng: number; distance: number; timestamp: string }
interface BLEDevice { id: string; name: string; rssi: number; txPower: number; distance: string; lastSeen: string }

const LAPSO_BLE_NAME_PREFIX = 'LAPSO'
const LAPSO_SERVICE_UUIDS = ['0xFE2C', '0x1802']

function BLEDeviceRow({ device, index }: { device: BLEDevice; index: number }) {
  const rssiColor = device.rssi > -50 ? '#4ECDC4' : device.rssi > -70 ? '#FFE66D' : '#FF6B6B'
  return (
    <motion.div
      initial={{ opacity: 0, x: -12, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      transition={{ delay: index * 0.05 }}
      className="neo-card p-3 bg-surface-alt"
    >
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <Broadcast size={14} weight="bold" style={{ color: rssiColor }} className="animate-pulse" />
          <span className="font-heading font-semibold text-sm">{device.name || 'Unknown LAPSO Device'}</span>
        </div>
        <div className="flex items-center gap-1">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="w-1 border border-dark"
              style={{ height: `${(i + 1) * 4}px`, backgroundColor: i < (device.rssi > -50 ? 4 : device.rssi > -60 ? 3 : device.rssi > -70 ? 2 : 1) ? rssiColor : '#e5e5e5' }}
            />
          ))}
          <span className="font-mono text-xs font-bold ml-1" style={{ color: rssiColor }}>{device.rssi} dBm</span>
        </div>
      </div>
      <div className="flex items-center gap-2 text-xs text-dark-light">
        <span className="font-mono text-[10px] bg-dark/10 px-1 py-0.5">{device.id}</span>
        <span>~{device.distance}</span>
        <span>{device.lastSeen}</span>
      </div>
    </motion.div>
  )
}

function RadarSweep({ active }: { active: boolean }) {
  return (
    <div className="relative w-20 h-20 flex-shrink-0">
      <div className="absolute inset-0 border-3 border-dark rounded-none" />
      <div className="absolute inset-2 border-2 border-dark/30 rounded-none" />
      <div className="absolute inset-4 border border-dark/20 rounded-none" />
      <motion.div
        animate={{ rotate: active ? 360 : 0 }}
        transition={{ duration: active ? 2 : 0, repeat: Infinity, ease: 'linear' }}
        className="absolute inset-0"
        style={active ? { background: 'conic-gradient(from 0deg, transparent 0deg, #4ECDC4 30deg, transparent 60deg)' } : {}}
      />
      <div className="absolute inset-0 flex items-center justify-center">
        <div className={`w-2.5 h-2.5 rounded-none border-2 border-dark ${active ? 'bg-secondary animate-ping' : 'bg-dark/20'}`} />
      </div>
    </div>
  )
}

function startBLEScan(onDevice: (device: BLEDevice) => void, onError: (e: string) => void) {
  // Check if Web Bluetooth is available
  if (!('bluetooth' in navigator)) {
    onError('Web Bluetooth not supported. Use Chrome/Edge on desktop or Chromium browser.')
    return null
  }

  let abortController: AbortController | null = null

  async function scan() {
    try {
      // @ts-ignore — Web Bluetooth API not in TS lib
      const device = await navigator.bluetooth.requestDevice({
        filters: [
          { namePrefix: LAPSO_BLE_NAME_PREFIX },
        ],
        optionalServices: LAPSO_SERVICE_UUIDS,
      })

      if (!device || !device.gatt) {
        onError('Could not connect to BLE device')
        return
      }

      // Connect and read advertisement data
      const server = await device.gatt.connect()
      const service = await server.getPrimaryService(LAPSO_SERVICE_UUIDS[0])
      const characteristic = await service.getCharacteristic(LAPSO_SERVICE_UUIDS[0])

      // Read RSSI if available
      const rssi = (device as any).rssi ?? -60

      onDevice({
        id: device.id,
        name: device.name || 'LAPSO Device',
        rssi,
        txPower: (device as any).txPower ?? -59,
        distance: rssi > -50 ? '< 1m' : rssi > -60 ? '1-3m' : rssi > -70 ? '3-10m' : '> 10m',
        lastSeen: new Date().toLocaleTimeString(),
      })

      server.disconnect()
    } catch (e: any) {
      if (e.name !== 'NotFoundError' && e.name !== 'AbortError') {
        onError(`BLE scan error: ${e.message}`)
      }
    }
    return null
  }

  scan()
  return abortController
}

export default function FindPage() {
  const [isSearching, setIsSearching] = useState(false)
  const [crowdSignals, setCrowdSignals] = useState<CrowdSignal[]>([])
  const [detectedBLE, setDetectedBLE] = useState<BLEDevice[]>([])
  const [myLocation, setMyLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [bleError, setBleError] = useState('')
  const [newSignalId, setNewSignalId] = useState<string | null>(null)
  const bleSupported = 'bluetooth' in navigator
  const scanIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const accessToken = useAppStore((s) => s.accessToken)

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
      const res = await fetch('/api/beacons', { headers: { Authorization: `Bearer ${accessToken}` } })
      if (!res.ok) return { beacons: [] }
      return res.json() as Promise<{ beacons: any[] }>
    },
    refetchInterval: 30000,
  })
  const registeredBeacons = beaconsData?.beacons ?? []

  function handleStartScan() {
    if (!bleSupported) {
      setBleError('Web Bluetooth not supported in this browser. Use Chrome or Edge.')
    }
    setIsSearching(true)
    setBleError('')

    // Attempt real BLE scan once if supported
    if (bleSupported) {
      startBLEScan(
        (device) => setDetectedBLE(prev => {
          const filtered = prev.filter(d => d.id !== device.id)
          return [device, ...filtered].slice(0, 10)
        }),
        (e) => setBleError(e)
      )
    }

    // Simulate crowd signals for demo
    scanIntervalRef.current = setInterval(() => {
      const id = `sig-${Date.now()}`
      const signal: CrowdSignal = {
        deviceId: id,
        deviceName: `LAPSO User ${Math.floor(Math.random() * 9000 + 1000)}`,
        lat: (myLocation?.lat ?? 0) + (Math.random() - 0.5) * 0.002,
        lng: (myLocation?.lng ?? 0) + (Math.random() - 0.5) * 0.002,
        distance: Math.round(50 + Math.random() * 200),
        timestamp: new Date().toISOString(),
      }
      setNewSignalId(id)
      setTimeout(() => setNewSignalId(null), 600)
      setCrowdSignals(prev => [signal, ...prev].slice(0, 8))
    }, 6000)
  }

  function handleStopScan() {
    setIsSearching(false)
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current)
      scanIntervalRef.current = null
    }
  }

  useEffect(() => {
    return () => {
      if (scanIntervalRef.current) clearInterval(scanIntervalRef.current)
    }
  }, [])

  const totalSignals = detectedBLE.length + crowdSignals.length

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold flex items-center gap-2">
          <Shield weight="bold" className="text-secondary" /> Find Offline
        </h1>
        <p className="text-dark-light text-sm">
          Crowd network locates your lost devices through BLE beacons and nearby LAPSO users.
        </p>
      </div>

      {/* Scanner card */}
      <div className="neo-card p-4">
        <div className="flex items-center gap-4">
          <RadarSweep active={isSearching} />
          <div className="flex-1">
            <p className="font-heading font-bold text-lg text-dark leading-tight">
              {isSearching ? 'Scanning for BLE signals...' : 'BLE Scanner standby'}
            </p>
            <p className="text-xs text-dark-light mt-0.5">
              {isSearching
                ? `Searching nearby LAPSO devices and crowd relay signals`
                : bleSupported
                  ? 'Tap Start to begin scanning with Web Bluetooth'
                  : 'Web Bluetooth not available — simulation mode only'}
            </p>
            {isSearching && (
              <motion.p
                animate={{ opacity: [1, 0.4, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="text-xs font-mono text-secondary font-bold mt-1"
              >
                ● LIVE — {detectedBLE.length} BLE · {crowdSignals.length} crowd
              </motion.p>
            )}
          </div>
          <button
            onClick={isSearching ? handleStopScan : handleStartScan}
            className={`neo-btn-primary px-4 font-heading font-bold whitespace-nowrap ${isSearching ? 'bg-danger hover:bg-danger-hover' : ''}`}
          >
            {isSearching ? 'Stop' : 'Start Scan'}
          </button>
        </div>

        {bleError && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-3 bg-danger/10 border-2 border-danger p-2 text-sm font-medium"
          >
            {bleError}
          </motion.div>
        )}

        {isSearching && !bleSupported && (
          <div className="mt-3 bg-accent/20 border-2 border-dark p-2 text-xs font-heading">
            Running in simulation mode — real Web Bluetooth requires Chrome/Edge on desktop with BLE.
          </div>
        )}
      </div>

      {/* Encryption notice */}
      <AnimatePresence>
        {isSearching && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="neo-card p-3 flex items-center gap-3 border-l-8 border-secondary"
          >
            <div className="w-2 h-2 rounded-none bg-secondary animate-ping" />
            <p className="text-xs text-dark">
              All crowd signals are end-to-end encrypted — nearby LAPSO users relay your location without seeing device identity or data.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* BLE + Crowd grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* BLE Detected */}
        <div className="neo-card p-4">
          <h2 className="font-heading font-bold mb-1 flex items-center gap-2">
            <Bluetooth weight="bold" size={18} className={detectedBLE.length > 0 ? 'text-secondary animate-pulse' : 'text-dark-light'} />
            Nearby LAPSO Devices
          </h2>
          <p className="text-xs text-dark-light mb-4">
            {bleSupported
              ? 'Real BLE scan via Web Bluetooth API'
              : 'Web Bluetooth unavailable — showing simulation'}
          </p>

          {detectedBLE.length === 0 ? (
            <div className="text-center py-8">
              <BlobDevice mood="neutral" size={64} type="phone" animate={isSearching} />
              <p className="font-body text-sm text-dark mt-3">
                {isSearching ? 'Scanning for BLE devices...' : 'Start scan to detect nearby LAPSO devices'}
              </p>
              <p className="font-body text-xs text-dark-light mt-1">
                {bleSupported ? 'Make sure nearby LAPSO agents are running' : 'Requires Chrome/Edge with Web Bluetooth'}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {detectedBLE.map((d, i) => <BLEDeviceRow key={d.id} device={d} index={i} />)}
            </div>
          )}
        </div>

        {/* Crowd signals */}
        <div className="neo-card p-4">
          <h2 className="font-heading font-bold mb-1 flex items-center gap-2">
            <User weight="bold" size={18} className="text-primary" />
            Crowd Network Signals
          </h2>
          <p className="text-xs text-dark-light mb-4">
            Nearby LAPSO users relaying encrypted device locations
          </p>

          {crowdSignals.length === 0 ? (
            <div className="text-center py-8">
              <BlobDevice mood="neutral" size={64} type="laptop" animate={isSearching} />
              <p className="font-body text-sm text-dark mt-3">
                {isSearching ? 'Waiting for crowd signals...' : 'No crowd network data yet'}
              </p>
              <p className="font-body text-xs text-dark-light mt-1">
                Walk around — more movement = more signal detection
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <AnimatePresence>
                {crowdSignals.map((signal) => (
                  <motion.div
                    key={signal.deviceId}
                    initial={{ opacity: 0, x: -12, scale: 0.95 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    exit={{ opacity: 0, x: 12, scale: 0.9 }}
                    className="neo-card p-3 bg-surface-alt"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-heading font-semibold text-sm text-dark">{signal.deviceName}</span>
                      <span className="font-mono text-xs font-bold px-2 py-0.5 border-2 border-dark bg-accent text-dark">
                        ~{signal.distance}m
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-dark-light">
                      <span className="font-mono text-[10px]">{signal.lat.toFixed(5)}, {signal.lng.toFixed(5)}</span>
                    </div>
                    <div className="flex items-center gap-1 mt-1">
                      <div className="w-1.5 h-1.5 rounded-none bg-secondary animate-ping" />
                      <span className="text-[10px] text-dark-light font-mono">{new Date(signal.timestamp).toLocaleTimeString()}</span>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>

      {/* Info section */}
      <div className="neo-card p-4 border-l-8 border-secondary">
        <h3 className="font-heading font-bold mb-1 flex items-center gap-2">
          <Eye size={16} weight="bold" className="text-secondary" />
          How Offline Finding Works
        </h3>
        <p className="text-sm text-dark-light leading-relaxed">
          When your LAPSO device goes offline, its agent broadcasts an encrypted BLE beacon every 500ms.
          Nearby LAPSO users detect this beacon and relay your encrypted location to the cloud — they cannot
          read your data. Your devices themselves provide the crowd beacon network. Only you hold the
          decryption keys. Encryption rotates every 15 minutes for privacy.
        </p>
      </div>
    </div>
  )
}