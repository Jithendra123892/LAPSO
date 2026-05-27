'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { House, Devices, MapPin, Shield, Bell, Users, Gear, SignOut } from '@phosphor-icons/react'
import { useAppStore } from '@/store/app-store'
import { motion } from 'framer-motion'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: House },
  { href: '/devices', label: 'Devices', icon: Devices },
  { href: '/geofences', label: 'Geofences', icon: MapPin },
  { href: '/find', label: 'Find', icon: Shield },
  { href: '/alerts', label: 'Alerts', icon: Bell },
  { href: '/team', label: 'Team', icon: Users },
  { href: '/settings', label: 'Settings', icon: Gear },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const logout = useAppStore((s) => s.logout)

  const activeIndex = navItems.findIndex(
    (item) => pathname === item.href || pathname.startsWith(item.href + '/')
  )

  return (
    <aside className="hidden lg:flex flex-col w-64 border-r-3 border-dark bg-surface h-screen sticky top-0">
      <div className="p-5 border-b-3 border-dark flex items-center gap-3">
        <div
          className="w-9 h-9 bg-primary border-3 border-dark flex items-center justify-center shadow-neo-sm"
        >
          <span className="text-white font-heading font-bold text-sm">L</span>
        </div>
        <span className="text-xl font-heading font-bold">LAPSO</span>
      </div>

      <nav className="flex-1 p-3 relative">
        {/* Active indicator track */}
        <div className="absolute left-0 right-0 top-3 bottom-3 pointer-events-none">
          {activeIndex >= 0 && (
            <motion.div
              key={activeIndex}
              initial={false}
              animate={{
                y: activeIndex * 48,
                opacity: 1,
              }}
              transition={{
                type: 'spring',
                stiffness: 400,
                damping: 32,
              }}
              className="absolute left-0 right-0 h-11 bg-primary rounded-none"
              style={{ y: activeIndex * 48 }}
            />
          )}
        </div>

        <div className="space-y-1 relative">
          {navItems.map((item) => {
            const Icon = item.icon
            const active = pathname === item.href || pathname.startsWith(item.href + '/')
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 font-heading font-bold text-sm transition-all duration-100 ${
                  active
                    ? 'text-white'
                    : 'text-dark hover:bg-surface-alt border-2 border-transparent'
                }`}
              >
                <Icon size={20} weight="bold" />
                {item.label}
              </Link>
            )
          })}
        </div>
      </nav>

      <div className="p-3 border-t-3 border-dark">
        <button
          onClick={async () => { await fetch('/api/auth/logout', { method: 'POST' }); logout(); router.push('/login') }}
          className="flex items-center gap-3 px-3 py-2.5 font-heading font-bold text-sm w-full hover:bg-surface-alt border-2 border-transparent transition-colors"
        >
          <SignOut size={20} weight="bold" />
          Sign Out
        </button>
      </div>
    </aside>
  )
}