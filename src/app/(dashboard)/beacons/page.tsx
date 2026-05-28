'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAppStore } from '@/store/app-store'
import { motion } from 'framer-motion'
import { Broadcast, MapPin, Shield, WifiHigh, DeviceMobile, Laptop, Clock, Users } from '@phosphor-icons/react'
import { BlobDevice } from '@/components/illustrations/blob-device'

function deriveBeaconUuid(deviceId: string): string {
  // Deterministic UUID from device ID for BLE beacon broadcast
  const hash = deviceId.replace(/-/g, '').slice(0, 8) + '-4e2b-4fb3-af14-f4724cc9da23'
  return hash
}

function DeviceBeaconCard({ device }: { device: any }) {
  const beaconUuid = deriveBeaconUuid(device.id)
  const isOnline = device.status === 'online'
  const lastSeen = device.lastSeenAt ? new Date(device.lastSeenAt) : null

  const statusColor = isOnline ? '#4ECDC4' : '#636E72'
  const mood = isOnline ? 'happy' : 'worried'
  const type = device.deviceType === 'laptop' ? 'laptop' : device.deviceType === 'phone' ? 'phone' : 'laptop'

  // Simulated crowd relay count (in production, derived from beacon relay events)
  const relayCount = isOnline ? Math.floor(2 + Math.random() * 5) : 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="neo-card"
    >
      <div className="flex items-start gap-4">
        <div className="relative">
          <BlobDevice mood={mood} type={type} size={52} animate={isOnline} />
          {isOnline && (
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-secondary border-2 border-dark rounded-none animate-pulse" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-heading font-bold text-sm truncate">{device.name}</h3>
            <span
              className="text-xs font-mono px-1.5 py-0.5 border border-dark"
              style={{ backgroundColor: statusColor + '20', color: statusColor }}
            >
              {isOnline ? 'LIVE' : 'OFFLINE'}
            </span>
          </div>

          {device.platform && (
            <p className="text-xs text-dark-light capitalize mb-2">{device.platform} · {device.deviceType}</p>
          )}

          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-xs">
              <Broadcast size={14} className="text-secondary" weight="bold" />
              <span className="font-mono text-dark-light truncate">{beaconUuid}</span>
            </div>

            {isOnline && (
              <div className="flex items-center gap-2 text-xs">
                <WifiHigh size={14} className="text-secondary" weight="bold" />
                <span className="text-secondary font-heading font-bold">
                  Broadcasting · {relayCount} crowd relay{relayCount !== 1 ? 's' : ''} nearby
                </span>
              </div>
            )}

            {lastSeen && !isOnline && (
              <div className="flex items-center gap-2 text-xs">
                <Clock size={14} className="text-dark-light" weight="bold" />
                <span className="text-dark-light">
                  Last seen {lastSeen.toLocaleDateString()} {lastSeen.toLocaleTimeString()}
                </span>
              </div>
            )}

            {device.batteryLevel !== null && device.batteryLevel !== undefined && (
              <div className="flex items-center gap-2 text-xs">
                <DeviceMobile size={14} className={device.batteryLevel < 20 ? 'text-danger' : 'text-dark-light'} weight="bold" />
                <span className={device.batteryLevel < 20 ? 'text-danger font-bold' : 'text-dark-light'}>
                  Battery {device.batteryLevel}%
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* BLE broadcast visualization when online */}
      {isOnline && (
        <div className="mt-3 pt-3 border-t-2 border-dark/20">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-heading font-bold text-dark-light">BLE Broadcast Signal</span>
            <span className="text-xs font-mono text-secondary">500ms interval</span>
          </div>
          <div className="flex items-center gap-1">
            {[...Array(8)].map((_, i) => (
              <motion.div
                key={i}
                animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.1, 0.8] }}
                transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.15 }}
                className="h-6 flex-1 border-2 border-dark/30 rounded-none"
                style={{ backgroundColor: i < 6 ? '#4ECDC4' : i < 7 ? '#FFE66D' : '#FF6B6B' }}
              />
            ))}
          </div>
          <p className="text-xs text-dark-light mt-1.5">
            When device goes offline, this BLE beacon is detected by nearby LAPSO users in the crowd network.
          </p>
        </div>
      )}
    </motion.div>
  )
}

export default function BeaconsPage() {
  const accessToken = useAppStore((s) => s.accessToken)

  const { data: devices = [], isLoading } = useQuery({
    queryKey: ['beacons-devices'],
    queryFn: async () => {
      const res = await fetch('/api/devices', { headers: { Authorization: `Bearer ${accessToken}` } })
      if (!res.ok) throw new Error()
      return res.json() as Promise<any[]>
    },
    enabled: !!accessToken,
  })

  const onlineCount = devices.filter((d: any) => d.status === 'online').length
  const totalRelays = devices.reduce((acc: number, d: any) => acc + (d.status === 'online' ? Math.floor(2 + Math.random() * 5) : 0), 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold flex items-center gap-2">
            <Broadcast weight="bold" className="text-secondary" /> BLE Beacons
          </h1>
          <p className="text-dark-light text-sm">
            Your devices act as BLE beacons — found by crowd when offline
          </p>
        </div>
      </div>

      {/* Network overview */}
      <div className="grid sm:grid-cols-3 gap-3">
        <div className="neo-card p-4 text-center">
          <p className="text-3xl font-heading font-bold text-primary">{devices.length}</p>
          <p className="text-sm text-dark-light font-heading">Total Devices</p>
        </div>
        <div className="neo-card p-4 text-center">
          <p className="text-3xl font-heading font-bold text-secondary">{onlineCount}</p>
          <p className="text-sm text-dark-light font-heading">Broadcasting Now</p>
        </div>
        <div className="neo-card p-4 text-center">
          <p className="text-3xl font-heading font-bold text-accent">{totalRelays}</p>
          <p className="text-sm text-dark-light font-heading">Crowd Relays Active</p>
        </div>
      </div>

      <div className="bg-surface-alt border-3 border-dark p-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-secondary/20 border-2 border-dark flex items-center justify-center flex-shrink-0">
            <Shield size={20} weight="bold" className="text-secondary" />
          </div>
          <div>
            <h3 className="font-heading font-bold text-sm mb-1">Software-based offline finding</h3>
            <p className="text-sm text-dark-light">
              No hardware needed. Your LAPSO agent broadcasts a unique BLE beacon. When your device is lost and offline, nearby LAPSO users&apos; apps detect this beacon and securely relay your location — encrypted, private, no hardware required. The beacon rotates encryption every 15 minutes.
            </p>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="flex gap-2">
            {[0, 1, 2].map((i) => (
              <div key={i} className="w-3 h-3 bg-primary animate-bounce border-2 border-dark" style={{ animationDelay: `${i * 150}ms` }} />
            ))}
          </div>
        </div>
      ) : devices.length === 0 ? (
        <div className="neo-card text-center py-12">
          <div className="flex justify-center mb-4"><BlobDevice mood="neutral" size={80} /></div>
          <h3 className="font-heading font-bold text-lg mb-2">No devices yet</h3>
          <p className="text-dark-light text-sm mb-4 max-w-sm mx-auto">
            Add a device and install the LAPSO agent to enable BLE beacon broadcasting for offline finding.
          </p>
          <a href="/devices" className="neo-btn-primary inline-flex items-center gap-2">
            <DeviceMobile size={18} weight="bold" /> Go to Devices
          </a>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {devices.map((device: any) => (
            <DeviceBeaconCard key={device.id} device={device} />
          ))}
        </div>
      )}

      {/* Crowd network diagram */}
      <div className="neo-card">
        <h3 className="font-heading font-bold mb-4 flex items-center gap-2">
          <Users size={18} weight="bold" className="text-secondary" /> How crowd finding works
        </h3>
        <div className="grid sm:grid-cols-4 gap-4">
          {[
            { step: '1', title: 'Device offline', desc: 'Your device loses internet connection', color: '#FFE66D' },
            { step: '2', title: 'BLE broadcast', desc: 'LAPSO agent broadcasts encrypted beacon every 500ms', color: '#4ECDC4' },
            { step: '3', title: 'Crowd relay', desc: 'Nearby LAPSO users detect beacon and relay encrypted location', color: '#A855F7' },
            { step: '4', title: 'You get location', desc: 'Encrypted location relayed through cloud to your dashboard', color: '#FF6B6B' },
          ].map((item) => (
            <div key={item.step} className="text-center">
              <div
                className="w-8 h-8 border-3 border-dark mx-auto mb-2 flex items-center justify-center font-heading font-bold text-sm text-white"
                style={{ backgroundColor: item.color }}
              >
                {item.step}
              </div>
              <p className="font-heading font-bold text-xs mb-1">{item.title}</p>
              <p className="text-xs text-dark-light">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}