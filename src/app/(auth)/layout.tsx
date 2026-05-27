'use client'

import { motion } from 'framer-motion'
import { BlobDevice } from '@/components/illustrations/blob-device'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-surface-alt relative overflow-hidden flex items-center justify-center p-4">
      {/* Animated blob background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <motion.div
          animate={{ x: [0, 30, 0], y: [0, -20, 0], rotate: [0, 5, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -top-20 -left-20 w-[400px] h-[400px]"
        >
          <svg viewBox="0 0 200 200" className="w-full h-full opacity-[0.06]">
            <path fill="#FF6B6B" d="M44.5,-76.3C57.4,-69.2,67.6,-58.1,75.1,-45.3C82.6,-32.5,87.4,-18,88.6,-2.8C89.8,12.3,87.4,27.8,80.1,40.8C72.8,53.8,60.7,64.3,47.3,72.2C33.9,80.1,19.2,85.3,3.4,86.4C-12.4,87.5,-29.3,84.5,-43.2,76.6C-57.1,68.7,-68,56,-75.8,41.7C-83.6,27.4,-88.3,11.6,-86.8,-3.1C-85.3,-17.8,-77.6,-31.4,-67.2,-42.6C-56.8,-53.8,-43.7,-62.5,-29.9,-69.2C-16.1,-75.9,-1.6,-80.5,12.3,-81C26.2,-81.5,39.5,-77.9,44.5,-76.3Z" transform="translate(100 100)" />
          </svg>
        </motion.div>
        <motion.div
          animate={{ x: [0, -20, 0], y: [0, 15, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
          className="absolute -bottom-16 right-[-80px] w-[350px] h-[350px]"
        >
          <svg viewBox="0 0 200 200" className="w-full h-full opacity-[0.05]">
            <path fill="#4ECDC4" d="M44.5,-76.3C57.4,-69.2,67.6,-58.1,75.1,-45.3C82.6,-32.5,87.4,-18,88.6,-2.8C89.8,12.3,87.4,27.8,80.1,40.8C72.8,53.8,60.7,64.3,47.3,72.2C33.9,80.1,19.2,85.3,3.4,86.4C-12.4,87.5,-29.3,84.5,-43.2,76.6C-57.1,68.7,-68,56,-75.8,41.7C-83.6,27.4,-88.3,11.6,-86.8,-3.1C-85.3,-17.8,-77.6,-31.4,-67.2,-42.6C-56.8,-53.8,-43.7,-62.5,-29.9,-69.2C-16.1,-75.9,-1.6,-80.5,12.3,-81C26.2,-81.5,39.5,-77.9,44.5,-76.3Z" transform="translate(100 100)" />
          </svg>
        </motion.div>
      </div>

      {/* LAPSO logo */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="absolute top-6 left-6 flex items-center gap-2"
      >
        <div className="w-8 h-8 bg-primary border-2 border-dark flex items-center justify-center shadow-neo-sm">
          <span className="text-white font-heading font-bold text-xs">L</span>
        </div>
        <span className="text-xl font-heading font-bold text-dark">LAPSO</span>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.2, 0, 0, 1] }}
        className="w-full max-w-md relative z-10"
      >
        {children}
      </motion.div>
    </div>
  )
}