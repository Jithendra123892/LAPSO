'use client'

import { useState } from 'react'
import { List, X, Sun, Moon } from '@phosphor-icons/react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { House, Devices, MapPin, Shield, Bell, Users, Gear, SignOut } from '@phosphor-icons/react'
import { useAppStore } from '@/store/app-store'
import { motion, AnimatePresence } from 'framer-motion'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: House },
  { href: '/devices', label: 'Devices', icon: Devices },
  { href: '/geofences', label: 'Geofences', icon: MapPin },
  { href: '/find', label: 'Find', icon: Shield },
  { href: '/alerts', label: 'Alerts', icon: Bell },
  { href: '/team', label: 'Team', icon: Users },
  { href: '/settings', label: 'Settings', icon: Gear },
]

export function Header() {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const logout = useAppStore((s) => s.logout)
  const darkMode = useAppStore((s) => s.darkMode)
  const toggleDarkMode = useAppStore((s) => s.toggleDarkMode)

  return (
    <header className="lg:hidden sticky top-0 z-40 bg-surface border-b-3 border-dark">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-primary border-2 border-dark flex items-center justify-center shadow-neo-sm">
            <span className="text-white font-heading font-bold text-xs">L</span>
          </div>
          <span className="text-lg font-heading font-bold">LAPSO</span>
        </div>
        <div className="flex items-center gap-2">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={toggleDarkMode}
            className="p-1.5 border-2 border-dark hover:bg-surface-alt transition-colors"
            aria-label="Toggle dark mode"
          >
            <motion.div
              key={String(darkMode)}
              initial={{ rotate: -20, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              transition={{ duration: 0.2 }}
            >
              {darkMode
                ? <Sun size={18} weight="bold" className="text-accent" />
                : <Moon size={18} weight="bold" className="text-dark" />}
            </motion.div>
          </motion.button>
          <button
            onClick={() => setOpen(!open)}
            className="p-1.5 border-2 border-dark hover:bg-surface-alt transition-colors"
            aria-label={open ? 'Close menu' : 'Open menu'}
          >
            {open ? <X size={20} weight="bold" /> : <List size={20} weight="bold" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.nav
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2, ease: [0.2, 0, 0, 1] }}
            className="border-t-3 border-dark overflow-hidden bg-surface"
          >
            <div className="p-2 space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon
                const active = pathname === item.href || pathname.startsWith(item.href + '/')
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 font-heading font-bold text-sm border-2 ${
                      active ? 'bg-primary text-white border-dark' : 'border-transparent hover:bg-surface-alt'
                    }`}
                  >
                    <Icon size={20} weight="bold" />
                    {item.label}
                  </Link>
                )
              })}
              <button
                onClick={async () => { await fetch('/api/auth/logout', { method: 'POST' }); logout(); router.push('/login') }}
                className="flex items-center gap-3 px-3 py-2.5 font-heading font-bold text-sm w-full text-dark border-2 border-transparent hover:bg-surface-alt"
              >
                <SignOut size={20} weight="bold" />
                Sign Out
              </button>
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  )
}