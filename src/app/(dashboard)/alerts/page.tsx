'use client'

import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { Shield, Warning, WarningDiamond, Info, CheckCircle, Trash, Eye, EyeSlash, Bell, BellSlash } from '@phosphor-icons/react'
import { useGeofenceAlerts } from '@/hooks/use-device-socket'

interface Alert {
  id: string
  deviceId: string | null
  type: string
  severity: 'info' | 'warning' | 'critical'
  title: string
  message: string | null
  metadata: Record<string, any>
  read: boolean
  createdAt: string
}

const SEVERITY_CONFIG = {
  info: { icon: Info, color: 'text-secondary', bg: 'bg-secondary/10', border: 'border-secondary', label: 'Info' },
  warning: { icon: Warning, color: 'text-accent', bg: 'bg-accent/10', border: 'border-accent', label: 'Warning' },
  critical: { icon: WarningDiamond, color: 'text-danger', bg: 'bg-danger/10', border: 'border-danger', label: 'Critical' },
}

export default function AlertsPage() {
  const qc = useQueryClient()
  const [filter, setFilter] = useState<'all' | 'unread' | 'critical'>('all')
  const [toast, setToast] = useState<{ id: string; title: string; severity: string } | null>(null)

  const { data, refetch } = useQuery({
    queryKey: ['alerts'],
    queryFn: async () => {
      const res = await fetch('/api/alerts')
      if (!res.ok) throw new Error('Failed')
      return res.json() as Promise<{ alerts: Alert[] }>
    },
    refetchInterval: 15000,
  })

  // Listen for real-time geofence alerts
  useGeofenceAlerts((alert) => {
    qc.invalidateQueries({ queryKey: ['alerts'] })
    setToast({ id: crypto.randomUUID(), title: alert.geofenceName, severity: 'warning' })
    setTimeout(() => setToast(null), 5000)
  })

  const markReadMutation = useMutation({
    mutationFn: async ({ id, read }: { id: string; read: boolean }) => {
      await fetch(`/api/alerts/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ read }) })
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['alerts'] }),
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { await fetch(`/api/alerts/${id}`, { method: 'DELETE' }) },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['alerts'] }),
  })

  const markAllReadMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      await Promise.all(ids.map(id => fetch(`/api/alerts/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ read: true }) })))
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['alerts'] }),
  })

  const alerts = data?.alerts || []
  const filtered = alerts.filter((a) => {
    if (filter === 'unread') return !a.read
    if (filter === 'critical') return a.severity === 'critical'
    return true
  })
  const unreadCount = alerts.filter((a) => !a.read).length

  return (
    <div className="min-h-screen bg-surface-alt p-6">
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="fixed top-4 right-4 z-50 neo-card bg-accent text-dark px-4 py-3 font-body text-sm font-medium shadow-neo flex items-center gap-2"
          >
            <Warning size={16} weight="fill" />
            Geofence alert: {toast.title}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <h1 className="font-heading text-3xl font-bold text-dark flex items-center gap-2">
              <Shield weight="bold" size={28} className="text-primary" />
              Alerts
            </h1>
            {unreadCount > 0 && (
              <span className="neo-badge bg-primary text-white font-mono text-xs">
                {unreadCount} new
              </span>
            )}
          </div>
          {unreadCount > 0 && (
            <button
              onClick={() => markAllReadMutation.mutate(alerts.filter((a) => !a.read).map((a) => a.id))}
              className="neo-btn-ghost text-sm flex items-center gap-1"
            >
              <CheckCircle size={16} weight="bold" />
              Mark all read
            </button>
          )}
        </div>

        {/* Filter Tabs */}
        <div className="neo-card p-1 bg-surface mb-4 inline-flex">
          {(['all', 'unread', 'critical'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 font-body text-sm font-medium transition-all ${filter === f ? 'neo-btn-primary' : 'text-dark-light hover:text-dark'}`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
              {f === 'unread' && unreadCount > 0 && <span className="ml-1 text-xs opacity-70">({unreadCount})</span>}
            </button>
          ))}
        </div>

        {/* Alert List */}
        {filtered.length === 0 ? (
          <div className="neo-card p-12 text-center bg-surface">
            <CheckCircle size={48} className="mx-auto mb-3 text-secondary" weight="duotone" />
            <p className="font-heading text-lg text-dark">All clear!</p>
            <p className="font-body text-sm text-dark-light mt-1">
              {filter === 'unread' ? 'No unread alerts.' : 'No alerts match this filter.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((alert, i) => {
              const cfg = SEVERITY_CONFIG[alert.severity] ?? SEVERITY_CONFIG.info
              const Icon = cfg.icon
              return (
                <motion.div
                  key={alert.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className={`neo-card p-4 bg-surface border-l-8 ${cfg.border} ${!alert.read ? 'ring-2 ring-dark/20' : 'opacity-75'}`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2 ${cfg.bg} ${cfg.color} mt-0.5`}>
                      <Icon size={20} weight="fill" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="font-heading font-bold text-dark text-sm">{alert.title}</h3>
                        <span className={`neo-badge ${cfg.bg} ${cfg.color} border-2 border-current text-xs shrink-0`}>
                          {cfg.label}
                        </span>
                      </div>
                      {alert.message && <p className="font-body text-sm text-dark-light mt-1">{alert.message}</p>}
                      <div className="flex items-center gap-3 mt-2">
                        <span className="font-mono text-xs text-dark-light">{alert.type}</span>
                        <span className="font-mono text-xs text-dark-light">{timeAgo(alert.createdAt)}</span>
                        <span className="font-mono text-xs text-dark-light truncate">{alert.deviceId}</span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <button
                        onClick={() => markReadMutation.mutate({ id: alert.id, read: !alert.read })}
                        className="neo-btn-ghost p-1"
                        title={alert.read ? 'Mark unread' : 'Mark read'}
                      >
                        {alert.read ? <EyeSlash size={16} weight="bold" /> : <Eye size={16} weight="bold" />}
                      </button>
                      <button onClick={() => deleteMutation.mutate(alert.id)} className="neo-btn-danger p-1" title="Delete">
                        <Trash size={16} weight="bold" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

function timeAgo(date: string): string {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
  if (seconds < 60) return 'just now'
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  return `${Math.floor(seconds / 86400)}d ago`
}