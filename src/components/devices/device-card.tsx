'use client'

import Link from 'next/link'
import { BatteryHigh, BatteryLow, BatteryMedium, BatteryWarning, Lightning, WifiHigh } from '@phosphor-icons/react'
import { timeAgo } from '@/lib/utils'
import { BlobDevice } from '@/components/illustrations/blob-device'
import { motion } from 'framer-motion'

const statusColor: Record<string, string> = {
  online: '#4ECDC4', offline: '#636E72', lost: '#FF4757', locked: '#A855F7', wiped: '#DFE6E9',
}
const statusLabel: Record<string, string> = {
  online: 'Online', offline: 'Offline', lost: 'Lost', locked: 'Locked', wiped: 'Wiped',
}
const statusMood: Record<string, 'happy' | 'worried' | 'scared' | 'tired' | 'neutral'> = {
  online: 'happy', offline: 'worried', lost: 'scared', locked: 'neutral', wiped: 'tired',
}
const platformColor: Record<string, string> = {
  windows: '#0078D4', macos: '#A2AAAD', linux: '#FCC624', android: '#3DDC84', ios: '#A2AAAD',
}

function BatteryIcon({ level }: { level: number | null }) {
  if (level === null) return null
  if (level > 75) return <BatteryHigh size={13} weight="fill" />
  if (level > 40) return <BatteryMedium size={13} weight="fill" />
  if (level > 15) return <BatteryLow size={13} weight="fill" />
  return <BatteryWarning size={13} weight="fill" />
}

function BatteryColor({ level }: { level: number | null }) {
  if (level === null) return '#636E72'
  if (level > 60) return '#4ECDC4'
  if (level > 20) return '#FFE66D'
  return '#FF4757'
}

export function DeviceCard({ device }: { device: any }) {
  const mood = statusMood[device.status] || 'neutral'
  const statusBg = statusColor[device.status] || '#636E72'
  const pbColor = BatteryColor(device.batteryLevel)
  const isOnline = device.status === 'online'

  return (
    <motion.div
      whileHover={{ y: -4, transition: { duration: 0.15 } }}
      whileTap={{ scale: 0.98 }}
    >
      <Link href={`/devices/${device.id}`}>
        <div className="neo-card cursor-pointer flex items-start gap-4 relative overflow-hidden">
          {/* Background accent stripe */}
          <div
            className="absolute top-0 left-0 w-1.5 h-full"
            style={{ background: statusBg }}
          />

          {/* BlobDevice with live ring for online */}
          <div className="relative">
            {isOnline && (
              <span className="absolute -top-1 -right-1 w-3 h-3 rounded-none animate-pulse-ring" style={{ background: '#4ECDC4', border: '2px solid #2D3436' }} />
            )}
            <BlobDevice mood={mood} type={device.deviceType} size={56} />
          </div>

          <div className="flex-1 min-w-0 pl-1">
            {/* Name + platform pill */}
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <h3 className="font-heading font-bold text-base truncate">{device.name}</h3>
              <span
                className="text-[10px] px-1.5 py-0.5 border border-dark font-mono font-bold text-white"
                style={{ background: platformColor[device.platform] || '#636E72' }}
              >
                {device.platform?.toUpperCase()}
              </span>
            </div>

            {/* Battery + last seen row */}
            <div className="flex items-center gap-3 mb-1.5">
              {device.batteryLevel !== null && (
                <div className="flex items-center gap-1" style={{ color: pbColor }}>
                  <BatteryIcon level={device.batteryLevel} />
                  <span className="font-mono text-xs font-bold" style={{ color: pbColor }}>{device.batteryLevel}%</span>
                </div>
              )}
              {device.batteryCharging && <Lightning size={12} weight="fill" className="text-accent" />}
              {device.wifiSsid && <WifiHigh size={12} weight="bold" className="text-secondary" />}
              <span className="text-xs text-dark-light">{timeAgo(device.lastSeenAt)}</span>
            </div>

            {/* Status badge */}
            <div className="flex items-center gap-2 mt-1">
              <span
                className="text-[10px] px-2 py-0.5 border-2 border-dark font-heading font-bold"
                style={{ background: statusBg, color: statusBg === '#FFE66D' ? '#2D3436' : '#FFF' }}
              >
                {statusLabel[device.status] || device.status}
              </span>
              {device.lastLatitude && device.lastLongitude && (
                <span className="font-mono text-[10px] text-dark-light">
                  {device.lastLatitude?.toFixed(3)}, {device.lastLongitude?.toFixed(3)}
                </span>
              )}
            </div>
          </div>

          {/* Chevron */}
          <div className="text-dark-light self-center">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>
      </Link>
    </motion.div>
  )
}