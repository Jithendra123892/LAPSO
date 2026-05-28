'use client'

import { motion } from 'framer-motion'

type DeviceMood = 'happy' | 'worried' | 'scared' | 'tired' | 'neutral' | 'excited' | 'curious' | 'alert' | 'sleeping'
type DeviceType = 'laptop' | 'phone' | 'tablet'
type DeviceVariant = 'default' | 'mini' | 'large'

interface BlobDeviceProps {
  mood?: DeviceMood
  type?: DeviceType
  size?: number
  animate?: boolean
  variant?: DeviceVariant
}

const moodColors: Record<DeviceMood, string> = {
  happy: '#4ECDC4',
  worried: '#FFE66D',
  scared: '#FF6B6B',
  tired: '#DFE6E9',
  neutral: '#A855F7',
  excited: '#FF6B6B',
  curious: '#A855F7',
  alert: '#FFE66D',
  sleeping: '#636E72',
}

const BLOB_PATH = 'M 15 20 C 15 8, 65 8, 65 20 L 65 55 C 65 67, 15 67, 15 55 Z'

export function BlobDevice({ mood = 'neutral', type = 'laptop', size = 120, animate = true, variant = 'default' }: BlobDeviceProps) {
  const color = moodColors[mood]
  const scale = variant === 'mini' ? 0.5 : variant === 'large' ? 1.2 : 1
  const displaySize = Math.round(size * scale)

  return (
    <motion.div
      animate={
        animate
          ? {
              y: mood === 'excited' ? [0, -8, -4, -8, 0] : mood === 'alert' ? [0, -5, 0, -5, 0] : [0, -4, 0],
              rotate: mood === 'curious' ? [-2, 2, -2] : [0, 0.5, -0.5, 0],
              scale: mood === 'excited' ? [1, 1.05, 1] : [1],
            }
          : {}
      }
      transition={{
        duration: mood === 'excited' ? 2 : mood === 'alert' ? 1.5 : 4,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
      style={{ display: 'inline-block' }}
    >
      <motion.svg
        width={displaySize}
        height={displaySize}
        viewBox="0 0 80 80"
      >
        <motion.path
          d={BLOB_PATH}
          fill={color}
          stroke="#2D3436"
          strokeWidth="3"
        />

        {/* Screen */}
        <rect x="22" y="19" width="36" height="24" rx="2" fill="white" stroke="#2D3436" strokeWidth="2.5" />
        <line x1="26" y1="25" x2="42" y2="25" stroke="#2D3436" strokeWidth="2" strokeLinecap="round" />
        <line x1="26" y1="29" x2="48" y2="29" stroke="#A855F7" strokeWidth="2" strokeLinecap="round" />
        <line x1="26" y1="33" x2="36" y2="33" stroke="#4ECDC4" strokeWidth="2" strokeLinecap="round" />

        {/* Keyboard / device base */}
        {type === 'laptop' && <rect x="18" y="43" width="44" height="4" rx="1" fill={color} stroke="#2D3436" strokeWidth="2.5" />}
        {type === 'phone' && <circle cx="40" cy="47" r="3" fill="none" stroke="#2D3436" strokeWidth="2" />}

        {/* Eyes — left */}
        <motion.circle
          cx="32"
          cy="39"
          r={mood === 'scared' ? 3.2 : mood === 'alert' ? 3.5 : mood === 'sleeping' ? 1.5 : 2.5}
          fill="#2D3436"
          animate={
            animate && (mood === 'scared' || mood === 'alert')
              ? { r: [2.5, 3.5, 2.5] }
              : mood === 'sleeping'
              ? { r: [1.5, 1.5] }
              : {}
          }
          transition={{ duration: mood === 'scared' ? 0.8 : 1.5, repeat: Infinity }}
        />

        {/* Eyes — right */}
        <motion.circle
          cx="48"
          cy="39"
          r={mood === 'scared' ? 3.2 : mood === 'alert' ? 3.5 : mood === 'sleeping' ? 1.5 : 2.5}
          fill="#2D3436"
          animate={
            animate && (mood === 'scared' || mood === 'alert')
              ? { r: [2.5, 3.5, 2.5] }
              : mood === 'sleeping'
              ? { cy: [39, 40, 39] }
              : {}
          }
          transition={{ duration: mood === 'scared' ? 0.8 : 1.5, repeat: Infinity, delay: 0.1 }}
        />

        {/* Sleeping Zzz for sleeping mood */}
        {mood === 'sleeping' && (
          <motion.text
            x="58"
            y="18"
            fontSize="10"
            fontFamily="monospace"
            fontWeight="bold"
            fill="#2D3436"
            animate={{ opacity: [0, 1, 0], y: [18, 14, 10] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            z
          </motion.text>
        )}
      </motion.svg>
    </motion.div>
  )
}