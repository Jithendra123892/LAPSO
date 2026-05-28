'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAppStore } from '@/store/app-store'
import { motion, AnimatePresence } from 'framer-motion'
import { BlobDevice } from '@/components/illustrations/blob-device'
import { Shield, Crosshair, Users, ChartLine, Lock, CheckCircle } from '@phosphor-icons/react'

export default function WelcomePage() {
  const router = useRouter()
  const user = useAppStore((s) => s.user)
  const [step, setStep] = useState(0)

  useEffect(() => {
    if (!user) router.push('/login')
  }, [user, router])

  if (!user) return null

  const steps = [
    {
      title: `Hey ${user.name?.split(' ')[0] || 'there'}!`,
      desc: "You're about to get the most powerful device tracking system ever made. LAPSO beats Windows Find My Device, Apple Find My, Prey, and Cerberus — combined.",
      mood: 'happy' as const,
      color: '#4ECDC4',
      icon: Shield,
      art: <BlobDevice mood="happy" size={140} />,
    },
    {
      title: 'Install the Agent',
      desc: "Download LAPSO on your laptop or phone. It runs silently in the background — GPS every 30s moving, WiFi/Cell every 5 minutes idle. Your battery will thank you.",
      mood: 'neutral' as const,
      color: '#FF6B6B',
      icon: Crosshair,
      art: <BlobDevice mood="neutral" type="phone" size={140} />,
    },
    {
      title: 'E2E Encrypted — Zero-Knowledge',
      desc: "Your data is encrypted end-to-end. Only you hold the keys. Our servers cannot read your location, device data, or anything you track. Ever.",
      mood: 'neutral' as const,
      color: '#A855F7',
      icon: Lock,
      art: <BlobDevice mood="neutral" size={140} />,
    },
    {
      title: "You're All Set!",
      desc: 'Your dashboard is live. Every location ping updates in real-time. Let\'s add your first device and show you the difference.',
      mood: 'happy' as const,
      color: '#4ECDC4',
      icon: ChartLine,
      art: <BlobDevice mood="happy" type="laptop" size={140} />,
    },
  ]

  const current = steps[step]
  const Icon = current.icon

  return (
    <div className="min-h-dvh bg-surface-alt relative overflow-hidden flex items-center justify-center">
      {/* Ambient blob backgrounds */}
      <div className="blob-bg w-64 h-64 bg-primary top-10 -left-10" />
      <div className="blob-bg w-48 h-48 bg-secondary bottom-20 right-10" style={{ animationDelay: '2s' }} />
      <div className="blob-bg w-32 h-32 bg-accent top-1/2 left-1/2" style={{ animationDelay: '4s' }} />

      <div className="w-full max-w-lg mx-auto px-4 relative z-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.96 }}
            transition={{ duration: 0.25, ease: [0.2, 0, 0, 1] }}
            className="neo-card p-8 text-center bg-surface relative overflow-hidden"
          >
            {/* Step badge */}
            <div className="absolute top-4 right-4">
              <span className="neo-badge" style={{ background: current.color + '20', borderColor: current.color, color: current.color }}>
                {step + 1} / {steps.length}
              </span>
            </div>

            {/* Icon */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.15, type: 'spring', stiffness: 300, damping: 20 }}
              className="w-16 h-16 mx-auto mb-4 rounded-none border-3 border-dark flex items-center justify-center"
              style={{ background: current.color, boxShadow: '4px 4px 0 0 #2D3436' }}
            >
              <Icon size={28} weight="fill" color="white" />
            </motion.div>

            {/* BlobDevice Illustration */}
            <motion.div
              className="flex justify-center mb-4"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.3 }}
            >
              {current.art}
            </motion.div>

            <motion.h2
              className="font-heading text-2xl font-bold text-dark mb-3"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
            >
              {current.title}
            </motion.h2>

            <motion.p
              className="font-body text-sm text-dark-light leading-relaxed max-w-sm mx-auto"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              {current.desc}
            </motion.p>

            {/* Divider */}
            <hr className="neo-divider my-6 mx-auto max-w-xs" />

            {/* Progress Dots */}
            <div className="flex gap-2.5 justify-center mb-6">
              {steps.map((_, i) => (
                <motion.div
                  key={i}
                  className="h-2.5 rounded-none border-2 border-dark transition-colors"
                  animate={{
                    width: i === step ? 32 : 12,
                    backgroundColor: i <= step ? current.color : 'transparent',
                  }}
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              ))}
            </div>

            {/* Actions */}
            <div className="flex gap-3 justify-center">
              {step > 0 && (
                <motion.button
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                  className="neo-btn-ghost"
                  onClick={() => setStep(step - 1)}
                >
                  Back
                </motion.button>
              )}
              {step < steps.length - 1 ? (
                <motion.button
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                  className="neo-btn-primary flex items-center gap-2"
                  onClick={() => setStep(step + 1)}
                  style={{ boxShadow: `4px 4px 0 0 ${current.color}`, borderColor: current.color !== '#4ECDC4' ? current.color : '#2D3436' }}
                >
                  Next
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M3 7h8M7 3l4 4-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </motion.button>
              ) : (
                <motion.button
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1, type: 'spring' }}
                  className="neo-btn-secondary flex items-center gap-2"
                  style={{ boxShadow: `4px 4px 0 0 #3DBDB5` }}
                  onClick={() => router.push('/dashboard')}
                >
                  <CheckCircle size={18} weight="fill" />
                  Enter Dashboard
                </motion.button>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}