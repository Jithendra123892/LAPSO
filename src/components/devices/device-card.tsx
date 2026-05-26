'use client'

import Link from 'next/link'
import { BatteryHigh, BatteryLow, BatteryMedium, BatteryWarning } from '@phosphor-icons/react'
import { timeAgo } from '@/lib/utils'
import { BlobDevice } from './blob-device'

const statusColor: Record<string, 'secondary' | 'default' | 'danger' | 'primary' | 'accent'> = {
  online: 'secondary', offline: 'default', lost: 'danger', locked: 'primary', wiped: 'accent',
}
const statusLabel: Record<string, string> = {
  online: 'Online', offline: 'Offline', lost: 'Lost', locked: 'Locked', wiped: 'Wiped',
}
const statusMood: Record<string, 'happy' | 'worried' | 'scared' | 'tired' | 'neutral'> = {
  online: 'happy', offline: 'worried', lost: 'scared', locked: 'neutral', wiped: 'tired',
}

function BatteryIcon({ level }: { level: number | null }) {
  if (level === null) return null
  if (level > 75) return <BatteryHigh size={14} weight="bold" />
  if (level > 40) return <BatteryMedium size={14} weight="bold" />
  if (level > 15) return <BatteryLow size={14} weight="bold" />
  return <BatteryWarning size={14} weight="bold" />
}

export function DeviceCard({ device }: { device: any }) {
  const mood = statusMood[device.status] || 'neutral'
  const color = device.status === 'online' ? '#4ECDC4' : device.status === 'lost' ? '#FF4757' : device.status === 'locked' ? '#A855F7' : '#636E72'

  return (
    <Link href={`/devices/${device.id}`}>
      <div className="neo-card neo-card-hover cursor-pointer flex items-center gap-4">
        <BlobDevice mood={mood} type={device.deviceType} size={56} />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-heading font-bold text-sm truncate">{device.name}</h3>
            <span className="text-xs px-1.5 py-0.5 border-2 border-dark font-bold" style={{ background: color, color: '#FFF' }}>
              {statusLabel[device.status] || device.status}
            </span>
          </div>
          <div className="flex items-center gap-3 text-xs text-dark-light">
            {device.batteryLevel !== null && (
              <span className="flex items-center gap-1">
                <BatteryIcon level={device.batteryLevel} />
                {device.batteryLevel}%
              </span>
            )}
            {device.lastSeenAt && <span>{timeAgo(device.lastSeenAt)}</span>}
          </div>
          {device.lastLatitude && (
            <p className="text-xs text-dark-light mt-1 truncate font-mono text-[10px]">
              {device.lastLatitude?.toFixed(4)}, {device.lastLongitude?.toFixed(4)}
            </p>
          )}
        </div>
      </div>
    </Link>
  )
}