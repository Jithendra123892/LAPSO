'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAppStore } from '@/store/app-store'
import { motion } from 'framer-motion'
import { BlobDevice } from '@/components/illustrations/blob-device'
import { Clock, ClockCounterClockwise, Shield, DeviceMobile, User, Users, Gear, MapPin } from '@phosphor-icons/react'

const CATEGORY_COLORS: Record<string, string> = {
  auth: 'bg-primary/20 text-primary border-primary',
  device: 'bg-secondary/20 text-secondary border-secondary',
  team: 'bg-purple/20 text-purple border-purple',
  geofence: 'bg-accent/20 text-dark border-accent',
  settings: 'bg-dark-light/20 text-dark border-dark-light',
  alert: 'bg-danger/20 text-danger border-danger',
}

const CATEGORY_ICONS: Record<string, any> = {
  auth: Shield,
  device: DeviceMobile,
  team: Users,
  geofence: MapPin,
  settings: Gear,
  alert: Shield,
  default: Clock,
}

function initials(name: string) {
  return name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
}

function timeAgo(date: string) {
  const s = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
  if (s < 60) return `${s}s ago`
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  return `${Math.floor(s / 86400)}d ago`
}

interface AuditEvent {
  id: string
  action: string
  detail: string | null
  ipAddress: string | null
  deviceId: string | null
  userName: string | null
  userEmail: string | null
  createdAt: string
}

export default function TeamAuditPage() {
  const accessToken = useAppStore((s) => s.accessToken)
  const [category, setCategory] = useState('all')
  const [days, setDays] = useState(7)
  const [page, setPage] = useState(0)

  const { data, isLoading } = useQuery({
    queryKey: ['audit-logs', category, days, page],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), limit: '50', days: String(days) })
      if (category !== 'all') params.set('category', category)
      const res = await fetch(`/api/audit?${params}`, { headers: { Authorization: `Bearer ${accessToken}` } })
      if (!res.ok) throw new Error()
      return res.json() as Promise<{ events: AuditEvent[]; pagination: { pages: number; total: number } }>
    },
    enabled: !!accessToken,
  })

  const events = data?.events ?? []
  const totalPages = data?.pagination?.pages ?? 1
  const total = data?.pagination?.total ?? 0

  // Group by date string
  const grouped: Record<string, AuditEvent[]> = {}
  for (const event of events) {
    const dateKey = new Date(event.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    if (!grouped[dateKey]) grouped[dateKey] = []
    grouped[dateKey].push(event)
  }

  const categories = ['all', 'auth', 'device', 'team', 'geofence', 'settings', 'alert']
  const dayOptions = [
    { label: '7d', value: 7 },
    { label: '30d', value: 30 },
    { label: '90d', value: 90 },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold flex items-center gap-2">
            <ClockCounterClockwise weight="bold" className="text-secondary" /> Audit Log
          </h1>
          <p className="text-dark-light text-sm">{total} events · last {days} days</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-1">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => { setCategory(cat); setPage(0) }}
              className={`px-3 py-1.5 font-heading font-bold text-xs border-2 border-dark transition-all ${
                category === cat
                  ? 'bg-primary text-white'
                  : 'bg-surface hover:bg-surface-alt'
              }`}
            >
              {cat === 'all' ? 'All' : cat.charAt(0).toUpperCase() + cat.slice(1)}
            </button>
          ))}
        </div>
        <div className="flex gap-1 ml-auto">
          {dayOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => { setDays(opt.value); setPage(0) }}
              className={`px-3 py-1.5 font-heading font-bold text-xs border-2 border-dark ${
                days === opt.value ? 'bg-secondary text-white' : 'bg-surface hover:bg-surface-alt'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Timeline */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="flex gap-2">
            {[0, 1, 2].map((i) => (
              <div key={i} className="w-3 h-3 bg-primary animate-bounce border-2 border-dark" style={{ animationDelay: `${i * 150}ms` }} />
            ))}
          </div>
        </div>
      ) : events.length === 0 ? (
        <div className="neo-card text-center py-12">
          <div className="flex justify-center mb-4"><BlobDevice mood="neutral" size={80} /></div>
          <h3 className="font-heading font-bold text-lg mb-2">No audit events</h3>
          <p className="text-dark-light text-sm">No activity recorded in the last {days} days.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([dateStr, dayEvents]) => (
            <div key={dateStr}>
              <h3 className="font-heading font-bold text-sm text-dark-light mb-3 flex items-center gap-2">
                <Clock size={14} weight="bold" /> {dateStr}
              </h3>
              <div className="space-y-2">
                <motion.div
                  initial="hidden"
                  animate="show"
                  variants={{ hidden: {}, show: { transition: { staggerChildren: 0.04 } } }}
                >
                  {dayEvents.map((event) => {
                    const categoryKey = event.action.split('.')[0].toLowerCase()
                    const colorClass = CATEGORY_COLORS[categoryKey] ?? 'bg-dark/20 text-dark border-dark'
                    const Icon = CATEGORY_ICONS[categoryKey] ?? CATEGORY_ICONS.default
                    const actionLabel = event.action.replace('.', ' ').replace('_', ' ')

                    return (
                      <motion.div
                        key={event.id}
                        variants={{ hidden: { opacity: 0, y: 6 }, show: { opacity: 1, y: 0 } }}
                        className="neo-card p-3 grid grid-cols-12 items-center gap-3"
                      >
                        <div className="col-span-1 flex justify-center">
                          <div className={`w-8 h-8 border-2 border-dark rounded-none flex items-center justify-center ${colorClass.split(' ')[0]}`}>
                            <Icon size={14} weight="bold" className={colorClass.split(' ')[1]} />
                          </div>
                        </div>
                        <div className="col-span-7 min-w-0">
                          <p className="font-heading font-bold text-sm truncate capitalize">
                            {actionLabel}
                          </p>
                          {event.detail && (
                            <p className="text-xs text-dark-light truncate mt-0.5">{event.detail}</p>
                          )}
                        </div>
                        <div className="col-span-3 text-right">
                          {event.userName ? (
                            <div className="flex items-center justify-end gap-2">
                              <div className="w-6 h-6 bg-primary border-2 border-dark rounded-none flex items-center justify-center">
                                <span className="text-white font-heading font-bold text-[10px]">
                                  {initials(event.userName)}
                                </span>
                              </div>
                              <span className="text-xs font-heading truncate max-w-[80px]">{event.userName.split(' ')[0]}</span>
                            </div>
                          ) : (
                            <span className="text-xs text-dark-light">System</span>
                          )}
                          {event.ipAddress && (
                            <p className="text-xs text-dark-light font-mono mt-0.5">{event.ipAddress}</p>
                          )}
                        </div>
                        <div className="col-span-1 text-right">
                          <span className="text-xs text-dark-light font-mono">{timeAgo(event.createdAt)}</span>
                        </div>
                      </motion.div>
                    )
                  })}
                </motion.div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => setPage(p => Math.max(0, p - 1))}
            disabled={page === 0}
            className="neo-btn-primary disabled:opacity-40"
          >
            Previous
          </button>
          <span className="font-heading font-bold text-sm">
            Page {page + 1} of {totalPages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
            className="neo-btn-primary disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}
    </div>
  )
}