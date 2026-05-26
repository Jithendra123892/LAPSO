'use client'

import Link from 'next/link'
import { DeviceCard } from '@/components/devices/device-card'
import { NButton } from '@/components/ui/n-button'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-surface-alt">
      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Header */}
        <header className="flex items-center justify-between mb-20">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary border-3 border-dark flex items-center justify-center font-heading font-bold text-white text-sm">L</div>
            <span className="text-2xl font-heading font-bold tracking-tight">LAPSO</span>
          </div>
          <div className="flex gap-3">
            <Link href="/login"><button className="neo-btn-ghost">Log In</button></Link>
            <Link href="/register"><button className="neo-btn-primary">Get Started</button></Link>
          </div>
        </header>

        {/* Hero */}
        <section className="text-center max-w-3xl mx-auto mb-20">
          <h1 className="text-5xl sm:text-6xl font-heading font-bold leading-tight mb-6">
            Never lose a device <span className="text-primary">ever again</span>
          </h1>
          <p className="text-xl text-dark-light mb-8 max-w-xl mx-auto">
            Real-time tracking, offline finding, anti-theft AI. Your devices, always found. Built with privacy-first encryption.
          </p>
          <Link href="/register">
            <button className="neo-btn-primary text-lg px-8 py-3">Start Tracking — Free Forever</button>
          </Link>
        </section>

        {/* Features */}
        <section className="grid md:grid-cols-3 gap-6 mb-20">
          {[
            { title: 'Real-Time Location', desc: 'GPS + WiFi + Cell fusion. Sub-meter accuracy, live updates every second.', emoji: '📍' },
            { title: 'Offline Finding', desc: 'Crowd-sourced Bluetooth network finds devices even when offline.', emoji: '🔍' },
            { title: 'Anti-Theft AI', desc: 'Detects theft patterns instantly. Auto-captures screenshots and photos.', emoji: '🛡️' },
            { title: 'Geofencing', desc: 'Custom zones with instant alerts. Know when devices leave safe areas.', emoji: '🗺️' },
            { title: 'Device Health', desc: 'Battery, storage, CPU monitoring. Prevent issues before they happen.', emoji: '💚' },
            { title: 'E2E Encrypted', desc: 'Your keys, your data. Signal-level encryption. We cannot see your location.', emoji: '🔐' },
          ].map((f) => (
            <div key={f.title} className="neo-card neo-card-hover">
              <span className="text-3xl mb-3 block">{f.emoji}</span>
              <h3 className="font-heading font-bold text-lg mb-2">{f.title}</h3>
              <p className="text-dark-light text-sm">{f.desc}</p>
            </div>
          ))}
        </section>

        {/* Footer */}
        <footer className="border-t-3 border-dark pt-8 text-center">
          <p className="text-dark-light text-sm">LAPSO — Built with privacy and power. Open source.</p>
        </footer>
      </div>
    </div>
  )
}