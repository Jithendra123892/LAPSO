'use client'

import { Lock, LockOpen, Bell, Trash, MapPin } from '@phosphor-icons/react'

interface DeviceCommandsProps {
  deviceId: string
  status: string
  onCommand: (type: string) => void
  loading?: boolean
}

export function DeviceCommands({ deviceId, status, onCommand, loading }: DeviceCommandsProps) {
  const isLocked = status === 'locked'
  const cmds = [
    { type: isLocked ? 'unlock' : 'lock', label: isLocked ? 'Unlock' : 'Lock', icon: isLocked ? LockOpen : Lock, variant: isLocked ? 'secondary' as const : 'primary' as const },
    { type: 'alarm', label: 'Alarm', icon: Bell, variant: 'ghost' as const },
    { type: 'locate', label: 'Locate', icon: MapPin, variant: 'ghost' as const },
    { type: 'wipe', label: 'Wipe', icon: Trash, variant: 'danger' as const },
  ]

  return (
    <div className="neo-card">
      <h3 className="font-heading font-bold mb-4">Actions</h3>
      <div className="grid grid-cols-2 gap-2">
        {cmds.map((cmd) => {
          const Icon = cmd.icon
          return (
            <button
              key={cmd.type}
              onClick={() => onCommand(cmd.type)}
              disabled={loading}
              className={`neo-btn-${cmd.variant} text-sm flex items-center justify-center gap-1.5 py-2`}
            >
              <Icon size={16} weight="bold" />
              {cmd.label}
            </button>
          )
        })}
      </div>
      {loading && <p className="text-xs text-dark-light mt-2 text-center">Sending command...</p>}
    </div>
  )
}