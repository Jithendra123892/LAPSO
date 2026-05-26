'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { House, Devices, MapPin, Shield, Bell, Users, Gear, SignOut } from '@phosphor-icons/react'
import { useAppStore } from '@/store/app-store'

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

  return (
    <aside className="hidden lg:flex flex-col w-64 border-r-3 border-dark bg-surface h-screen sticky top-0">
      <div className="p-5 border-b-3 border-dark flex items-center gap-3">
        <div className="w-9 h-9 bg-primary border-3 border-dark flex items-center justify-center text-white font-heading font-bold text-sm">L</div>
        <span className="text-xl font-heading font-bold">LAPSO</span>
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon
          const active = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 font-heading font-bold text-sm transition-all duration-100 ${
                active
                  ? 'bg-primary text-white border-2 border-dark -translate-x-1 -translate-y-0.5 shadow-neo-sm'
                  : 'hover:bg-surface-alt border-2 border-transparent'
              }`}
            >
              <Icon size={20} weight="bold" />
              {item.label}
            </Link>
          )
        })}
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