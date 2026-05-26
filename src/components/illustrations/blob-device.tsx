'use client'

import { motion } from 'framer-motion'

type DeviceMood = 'happy' | 'worried' | 'scared' | 'tired' | 'neutral'
type DeviceType = 'laptop' | 'phone' | 'tablet'

interface BlobDeviceProps {
  mood?: DeviceMood
  type?: DeviceType
  size?: number
  animate?: boolean
}

const moodColors: Record<DeviceMood, string> = {
  happy: '#4ECDC4', worried: '#FFE66D', scared: '#FF6B6B', tired: '#DFE6E9', neutral: '#A855F7',
}
const moodEmoji: Record<DeviceMood, string> = {
  happy: '😊', worried: '😟', scared: '😱', tired: '😴', neutral: '😐',
}

export function BlobDevice({ mood = 'neutral', type = 'laptop', size = 120, animate = true }: BlobDeviceProps) {
  const color = moodColors[mood]

  return (
    <motion.svg
      width={size} height={size} viewBox="0 0 80 80"
      animate={animate ? { y: [0, -3, 0], rotate: [0, 0.5, -0.5, 0] } : {}}
      transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
    >
      <motion.path
        d="M 15 20 C 15 8, 65 8, 65 20 L 65 55 C 65 67, 15 67, 15 55 Z"
        fill={color}
        stroke="#2D3436"
        strokeWidth="3"
        animate={animate ? { d: [
          'M 15 20 C 15 8, 65 8, 65 20 L 65 55 C 65 67, 15 67, 15 55 Z',
          'M 14 21 C 10 8, 70 8, 66 20 L 66 54 C 63 68, 17 68, 14 55 Z',
          'M 16 20 C 19 8, 61 8, 64 20 L 64 56 C 67 66, 13 66, 16 54 Z',
        ]} : {}}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      />
      <rect x="22" y="19" width="36" height="24" rx="2" fill="white" stroke="#2D3436" strokeWidth="2.5" />
      <line x1="26" y1="25" x2="42" y2="25" stroke="#2D3436" strokeWidth="2" strokeLinecap="round" />
      <line x1="26" y1="29" x2="48" y2="29" stroke="#A855F7" strokeWidth="2" strokeLinecap="round" />
      <line x1="26" y1="33" x2="36" y2="33" stroke="#4ECDC4" strokeWidth="2" strokeLinecap="round" />
      {type === 'laptop' && <rect x="18" y="43" width="44" height="4" rx="1" fill={color} stroke="#2D3436" strokeWidth="2.5" />}
      {type === 'phone' && <circle cx="40" cy="47" r="3" fill="none" stroke="#2D3436" strokeWidth="2" />}
      <motion.circle
        cx="32" cy="39" r="2.5" fill="#2D3436"
        animate={mood === 'scared' && animate ? { r: [2.5, 3.2, 2.5] } : {}}
        transition={{ duration: 0.8, repeat: Infinity }}
      />
      <motion.circle
        cx="48" cy="39" r="2.5" fill="#2D3436"
        animate={mood === 'scared' && animate ? { r: [2.5, 3.2, 2.5] } : {}}
        transition={{ duration: 0.8, repeat: Infinity, delay: 0.1 }}
      />
      <text x="40" y="65" textAnchor="middle" fontSize="12" fill="#2D3436">{moodEmoji[mood]}</text>
    </motion.svg>
  )
}