'use client'

import Link from 'next/link'
import { motion, useScroll, useTransform } from 'framer-motion'
import { MapPin, Shield, Bluetooth, DeviceMobile, BatteryFull, LockKey, Gps, WifiHigh, Users, ChartLine } from '@phosphor-icons/react'
import { BlobDevice } from '@/components/illustrations/blob-device'
import { useRef } from 'react'

const FEATURES = [
  { title: 'Real-Time GPS', desc: 'GPS + WiFi + Cell fusion. Sub-meter accuracy, live updates every second.', icon: Gps, color: '#FF6B6B', key: 'gps' },
  { title: 'Offline Finding', desc: 'Crowd-sourced Bluetooth network finds devices even when offline.', icon: Bluetooth, color: '#4ECDC4', key: 'ble' },
  { title: 'Anti-Theft AI', desc: 'Detects theft patterns instantly. Auto-captures screenshots and evidence.', icon: Shield, color: '#A855F7', key: 'ai' },
  { title: 'Geofencing', desc: 'Custom zones with instant alerts. Know when devices leave safe areas.', icon: MapPin, color: '#FFE66D', key: 'geo' },
  { title: 'Device Health', desc: 'Battery, storage, CPU monitoring. Prevent issues before they happen.', icon: BatteryFull, color: '#22C55E', key: 'health' },
  { title: 'E2E Encrypted', desc: 'Your keys, your data. Signal-level encryption. We cannot see your location.', icon: LockKey, color: '#3B82F6', key: 'enc' },
]

const STATS = [
  { value: '99.9%', label: 'Uptime' },
  { value: '<100ms', label: 'Location latency' },
  { value: 'AES-256', label: 'Encryption' },
]

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
}
const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.2, 0, 0, 1] } },
}

export default function LandingPage() {
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: ref })
  const y1 = useTransform(scrollYProgress, [0, 1], [0, -80])
  const y2 = useTransform(scrollYProgress, [0, 1], [0, -160])

  return (
    <div ref={ref} className="min-h-dvh bg-surface-alt overflow-x-hidden">
      {/* Floating ambient blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <motion.div
          animate={{ rotate: 360 }} transition={{ duration: 60, repeat: Infinity, ease: 'linear' }}
          className="absolute -top-32 -left-32 w-[500px] h-[500px]"
        >
          <svg viewBox="0 0 200 200" className="w-full h-full opacity-[0.07]">
            <path fill="#FF6B6B" d="M44.5,-76.3C57.4,-69.2,67.6,-58.1,75.1,-45.3C82.6,-32.5,87.4,-18,88.6,-2.8C89.8,12.3,87.4,27.8,80.1,40.8C72.8,53.8,60.7,64.3,47.3,72.2C33.9,80.1,19.2,85.3,3.4,86.4C-12.4,87.5,-29.3,84.5,-43.2,76.6C-57.1,68.7,-68,56,-75.8,41.7C-83.6,27.4,-88.3,11.6,-86.8,-3.1C-85.3,-17.8,-77.6,-31.4,-67.2,-42.6C-56.8,-53.8,-43.7,-62.5,-29.9,-69.2C-16.1,-75.9,-1.6,-80.5,12.3,-81C26.2,-81.5,39.5,-77.9,44.5,-76.3Z" transform="translate(100 100)" />
          </svg>
        </motion.div>
        <motion.div
          animate={{ rotate: -360 }} transition={{ duration: 45, repeat: Infinity, ease: 'linear' }}
          className="absolute -top-16 right-[-100px] w-[400px] h-[400px]"
        >
          <svg viewBox="0 0 200 200" className="w-full h-full opacity-[0.06]">
            <path fill="#4ECDC4" d="M44.5,-76.3C57.4,-69.2,67.6,-58.1,75.1,-45.3C82.6,-32.5,87.4,-18,88.6,-2.8C89.8,12.3,87.4,27.8,80.1,40.8C72.8,53.8,60.7,64.3,47.3,72.2C33.9,80.1,19.2,85.3,3.4,86.4C-12.4,87.5,-29.3,84.5,-43.2,76.6C-57.1,68.7,-68,56,-75.8,41.7C-83.6,27.4,-88.3,11.6,-86.8,-3.1C-85.3,-17.8,-77.6,-31.4,-67.2,-42.6C-56.8,-53.8,-43.7,-62.5,-29.9,-69.2C-16.1,-75.9,-1.6,-80.5,12.3,-81C26.2,-81.5,39.5,-77.9,44.5,-76.3Z" transform="translate(100 100)" />
          </svg>
        </motion.div>
        <motion.div
          animate={{ x: [0, 30, 0], y: [0, -20, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute bottom-20 left-[10%] w-[200px] h-[200px] opacity-[0.05]"
        >
          <svg viewBox="0 0 200 200" className="w-full h-full">
            <path fill="#A855F7" d="M44.5,-76.3C57.4,-69.2,67.6,-58.1,75.1,-45.3C82.6,-32.5,87.4,-18,88.6,-2.8C89.8,12.3,87.4,27.8,80.1,40.8C72.8,53.8,60.7,64.3,47.3,72.2C33.9,80.1,19.2,85.3,3.4,86.4C-12.4,87.5,-29.3,84.5,-43.2,76.6C-57.1,68.7,-68,56,-75.8,41.7C-83.6,27.4,-88.3,11.6,-86.8,-3.1C-85.3,-17.8,-77.6,-31.4,-67.2,-42.6C-56.8,-53.8,-43.7,-62.5,-29.9,-69.2C-16.1,-75.9,-1.6,-80.5,12.3,-81C26.2,-81.5,39.5,-77.9,44.5,-76.3Z" transform="translate(100 100)" />
          </svg>
        </motion.div>
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 py-12">
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.2, 0, 0, 1] }}
          className="flex items-center justify-between mb-20"
        >
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-primary border-3 border-dark flex items-center justify-center shadow-neo-sm">
              <span className="text-white font-heading font-bold text-sm">L</span>
            </div>
            <span className="text-2xl font-heading font-bold tracking-tight">LAPSO</span>
          </div>
          <div className="flex gap-3">
            <Link href="/login"><button className="neo-btn-ghost">Log In</button></Link>
            <Link href="/register"><button className="neo-btn-primary">Get Started</button></Link>
          </div>
        </motion.header>

        {/* Hero */}
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-3xl mx-auto mb-24 relative"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, ease: [0.2, 0, 0, 1] }}
            className="mb-8"
          >
            <BlobDevice mood="happy" size={120} type="laptop" animate={true} />
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-5xl sm:text-6xl font-heading font-bold leading-tight mb-6"
          >
            Never lose a device{' '}
            <span className="relative inline-block">
              <span className="relative z-10 text-primary">ever again</span>
              <motion.span
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 0.4, delay: 0.5 }}
                className="absolute bottom-0 left-0 right-0 h-3 bg-secondary/30 origin-left -z-0"
                style={{ transformOrigin: 'left' }}
              />
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="text-xl text-dark-light mb-8 max-w-xl mx-auto"
          >
            Real-time tracking, offline finding, anti-theft AI. Your devices, always found. Built with privacy-first encryption.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
          >
            <Link href="/register">
              <motion.button
                whileHover={{ y: -3, boxShadow: '8px 8px 0 0 #2D3436' }}
                whileTap={{ scale: 0.97, boxShadow: '2px 2px 0 0 #2D3436' }}
                className="neo-btn-primary text-lg px-8 py-3 font-heading font-bold"
              >
                Start Tracking — Free Forever
              </motion.button>
            </Link>
          </motion.div>
        </motion.section>

        {/* Stats row */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="grid grid-cols-3 gap-4 mb-24 max-w-2xl mx-auto"
        >
          {STATS.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 + i * 0.1 }}
              className="neo-card text-center py-4"
            >
              <p className="font-mono font-bold text-xl text-primary">{stat.value}</p>
              <p className="font-heading text-xs font-bold text-dark-light uppercase tracking-wide mt-1">{stat.label}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Features */}
        <section className="mb-20">
          <motion.h2
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center font-heading text-3xl font-bold mb-10"
          >
            Everything you need
          </motion.h2>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '-50px' }}
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {FEATURES.map((f) => {
              const Icon = f.icon
              return (
                <motion.div
                  key={f.key}
                  variants={itemVariants}
                  whileHover={{ y: -6, transition: { duration: 0.15 } }}
                  className="neo-card neo-card-hover cursor-default"
                >
                  <div className="flex items-start gap-4">
                    <div
                      className="w-12 h-12 border-3 border-dark flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: f.color, boxShadow: `3px 3px 0 0 #2D3436` }}
                    >
                      <Icon size={22} weight="fill" className="text-white" />
                    </div>
                    <div>
                      <h3 className="font-heading font-bold text-lg mb-2">{f.title}</h3>
                      <p className="text-dark-light text-sm leading-relaxed">{f.desc}</p>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </motion.div>
        </section>

        {/* How it works */}
        <section className="mb-20">
          <motion.h2
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center font-heading text-3xl font-bold mb-10"
          >
            How it works
          </motion.h2>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="grid md:grid-cols-3 gap-8 text-center"
          >
            {[
              { num: '01', title: 'Install the agent', desc: 'Download the LAPSO agent on any device. Takes 60 seconds.', color: '#FF6B6B' },
              { num: '02', title: 'Add your devices', desc: 'Register devices and set up geofences and alert preferences.', color: '#4ECDC4' },
              { num: '03', title: 'Track in real-time', desc: 'See your devices on the live map. Get alerts the moment something changes.', color: '#A855F7' },
            ].map((step, i) => (
              <motion.div
                key={step.num}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="neo-card"
              >
                <div
                  className="w-14 h-14 border-3 border-dark flex items-center justify-center font-mono font-bold text-xl text-white mx-auto mb-4"
                  style={{ backgroundColor: step.color, boxShadow: `4px 4px 0 0 #2D3436` }}
                >
                  {step.num}
                </div>
                <h3 className="font-heading font-bold text-lg mb-2">{step.title}</h3>
                <p className="text-dark-light text-sm">{step.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </section>

        {/* CTA */}
        <motion.section
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="neo-card border-4 border-dark text-center py-12 relative overflow-hidden"
          style={{ boxShadow: '6px 6px 0 0 #2D3436' }}
        >
          <div className="absolute top-4 right-4 opacity-10">
            <BlobDevice mood="happy" type="laptop" size={120} animate={true} />
          </div>
          <h2 className="font-heading text-3xl font-bold mb-4 relative z-10">Ready to never lose a device?</h2>
          <p className="text-dark-light mb-8 max-w-md mx-auto relative z-10">Join thousands of users who trust LAPSO to keep their devices safe.</p>
          <Link href="/register">
            <motion.button
              whileHover={{ y: -3, boxShadow: '8px 8px 0 0 #2D3436' }}
              whileTap={{ scale: 0.97, boxShadow: '2px 2px 0 0 #2D3436' }}
              className="neo-btn-primary text-lg px-8 py-3 font-heading font-bold relative z-10"
            >
              Get Started — It's Free
            </motion.button>
          </Link>
        </motion.section>

        {/* Footer */}
        <footer className="border-t-3 border-dark pt-8 text-center mt-16">
          <p className="text-dark-light text-sm font-body">LAPSO — Built with privacy and power. Open source.</p>
        </footer>
      </div>
    </div>
  )
}