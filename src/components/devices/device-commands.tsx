'use client'

import { Lock, LockOpen, Bell, MapPin, Trash } from '@phosphor-icons/react'
import { motion } from 'framer-motion'

interface DeviceCommandsProps {
  deviceId: string
  status: string
  onCommand: (type: string) => void
  loading?: boolean
}

const COMMANDS = [
  { type: 'lock', label: 'Lock', icon: Lock, variant: 'primary' as const },
  { type: 'alarm', label: 'Alarm', icon: Bell, variant: 'ghost' as const },
  { type: 'locate', label: 'Locate', icon: MapPin, variant: 'secondary' as const },
  { type: 'wipe', label: 'Wipe', icon: Trash, variant: 'danger' as const },
]

export function DeviceCommands({ deviceId, status, onCommand, loading }: DeviceCommandsProps) {
  const isLocked = status === 'locked'
  const activeType = isLocked ? 'unlock' : 'lock'
  const lockLabel = isLocked ? 'Unlock' : 'Lock'
  const lockIcon = isLocked ? LockOpen : Lock

  const commands = COMMANDS.map(c => c.type === 'lock' ? { ...c, type: activeType, label: lockLabel, icon: lockIcon } : c)

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.2, 0, 0, 1] }}
      className="neo-card"
    >
      <h3 className="font-heading font-bold mb-4 flex items-center gap-2">
        <span className="w-2 h-2 rounded-none bg-primary inline-block" />
        Actions
      </h3>
      <div className="grid grid-cols-2 gap-2">
        {commands.map((cmd, i) => {
          const Icon = cmd.icon
          return (
            <motion.button
              key={cmd.type}
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.08, duration: 0.25, ease: [0.34, 1.56, 0.64, 1] }}
              whileHover={{ y: -2, boxShadow: '4px 4px 0 0 #2D3436' }}
              whileTap={{ scale: 0.95, boxShadow: '1px 1px 0 0 #2D3436' }}
              onClick={() => onCommand(cmd.type)}
              disabled={loading}
              className={`neo-btn-${cmd.variant} text-xs flex items-center justify-center gap-1.5 py-2.5`}
            >
              <Icon size={16} weight="bold" />
              {cmd.label}
            </motion.button>
          )
        })}
      </div>
      {loading && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-xs text-dark-light mt-3 text-center font-body"
        >
          Sending command...
        </motion.p>
      )}
    </motion.div>
  )
}