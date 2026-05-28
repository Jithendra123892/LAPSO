'use client'

import { useQuery } from '@tanstack/react-query'
import { useAppStore } from '@/store/app-store'
import { motion } from 'framer-motion'
import { BlobDevice } from '@/components/illustrations/blob-device'
import { Users, DeviceMobile, Desktop, Shield, Crown, UserGear, User } from '@phosphor-icons/react'

const ROLE_CONFIG: Record<string, { label: string; icon: any; color: string }> = {
  owner: { label: 'Owner', icon: Crown, color: '#FFE66D' },
  admin: { label: 'Admin', icon: Shield, color: '#A855F7' },
  manager: { label: 'Manager', icon: UserGear, color: '#4ECDC4' },
  member: { label: 'Member', icon: User, color: '#636E72' },
}

const DEVICE_COLORS: Record<string, string> = {
  laptop: '#4ECDC4',
  phone: '#A855F7',
  tablet: '#FFE66D',
  desktop: '#3B82F6',
  watch: '#F97316',
}

function PlatformBar({ platform, count, total }: { platform: string; count: number; total: number }) {
  const pct = total > 0 ? (count / total) * 100 : 0
  const color = DEVICE_COLORS[platform.toLowerCase()] ?? '#636E72'
  return (
    <div className="flex items-center gap-2">
      <div className="w-16 text-xs font-heading font-bold capitalize">{platform || 'Unknown'}</div>
      <div className="flex-1 h-4 bg-surface-alt border-2 border-dark">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.5, ease: [0.2, 0, 0, 1] }}
          className="h-full"
          style={{ backgroundColor: color }}
        />
      </div>
      <div className="w-16 text-xs font-mono text-right">{count}</div>
    </div>
  )
}

export default function OrgPage() {
  const accessToken = useAppStore((s) => s.accessToken)
  const user = useAppStore((s) => s.user)

  const { data, isLoading } = useQuery({
    queryKey: ['org-view'],
    queryFn: async () => {
      const [devicesRes, teamRes] = await Promise.all([
        fetch('/api/devices', { headers: { Authorization: `Bearer ${accessToken}` } }),
        fetch('/api/team', { headers: { Authorization: `Bearer ${accessToken}` } }),
      ])
      if (!devicesRes.ok || !teamRes.ok) throw new Error()
      const devices = await devicesRes.json()
      const team = await teamRes.json()
      return { devices, team }
    },
    enabled: !!accessToken,
  })

  const devices: any[] = data?.devices ?? []
  const team: any[] = data?.team ?? []

  const onlineCount = devices.filter((d: any) => d.status === 'online').length
  const totalStorageUsed = devices.reduce((acc: number, d: any) => acc + (d.storageUsed ?? 0), 0)
  const totalStorage = devices.reduce((acc: number, d: any) => acc + (d.storageTotal ?? 0), 0)

  // Group devices by platform
  const byPlatform: Record<string, number> = {}
  for (const d of devices) {
    const p = d.platform ?? 'unknown'
    byPlatform[p] = (byPlatform[p] ?? 0) + 1
  }
  const platformEntries = Object.entries(byPlatform).sort((a, b) => b[1] - a[1])

  // Group team members by role
  const byRole: Record<string, number> = {}
  for (const m of team) {
    const r = m.role ?? 'member'
    byRole[r] = (byRole[r] ?? 0) + 1
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="flex gap-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="w-3 h-3 bg-primary animate-bounce border-2 border-dark" style={{ animationDelay: `${i * 150}ms` }} />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold flex items-center gap-2">
          <Users weight="bold" className="text-secondary" /> Organization
        </h1>
        <p className="text-dark-light text-sm">Team overview and device distribution</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="neo-card p-4 text-center">
          <p className="text-3xl font-heading font-bold text-primary">{devices.length}</p>
          <p className="text-sm text-dark-light font-heading">Total Devices</p>
        </div>
        <div className="neo-card p-4 text-center">
          <p className="text-3xl font-heading font-bold text-secondary">{onlineCount}</p>
          <p className="text-sm text-dark-light font-heading">Online</p>
        </div>
        <div className="neo-card p-4 text-center">
          <p className="text-3xl font-heading font-bold text-accent">{team.length}</p>
          <p className="text-sm text-dark-light font-heading">Team Members</p>
        </div>
        <div className="neo-card p-4 text-center">
          <p className="text-3xl font-heading font-bold text-purple">{totalStorage > 0 ? Math.round(totalStorageUsed / totalStorage * 100) : 0}%</p>
          <p className="text-sm text-dark-light font-heading">Storage Used</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Device distribution by platform */}
        <div className="neo-card p-4">
          <h3 className="font-heading font-bold mb-4 flex items-center gap-2">
            <DeviceMobile size={18} weight="bold" className="text-secondary" />
            Device Distribution
          </h3>
          <p className="text-xs text-dark-light mb-4 font-heading">Platform breakdown across all devices</p>
          {platformEntries.length === 0 ? (
            <p className="text-sm text-dark-light text-center py-8">No devices registered</p>
          ) : (
            <div className="space-y-2">
              {platformEntries.map(([platform, count]) => (
                <PlatformBar key={platform} platform={platform} count={count} total={devices.length} />
              ))}
            </div>
          )}
        </div>

        {/* Team member roles */}
        <div className="neo-card p-4">
          <h3 className="font-heading font-bold mb-4 flex items-center gap-2">
            <Users size={18} weight="bold" className="text-purple" />
            Team Roles
          </h3>
          <p className="text-xs text-dark-light mb-4 font-heading">Member distribution by role</p>
          {team.length === 0 ? (
            <p className="text-sm text-dark-light text-center py-8">No team members</p>
          ) : (
            <div className="space-y-3">
              {Object.entries(byRole).sort(([a], [b]) => {
                const order = ['owner', 'admin', 'manager', 'member']
                return order.indexOf(a) - order.indexOf(b)
              }).map(([role, count]) => {
                const cfg = ROLE_CONFIG[role] || ROLE_CONFIG.member
                const Icon = cfg.icon
                const pct = Math.round((count / team.length) * 100)
                return (
                  <div key={role} className="flex items-center gap-3">
                    <div className="w-8 h-8 border-2 border-dark rounded-none flex items-center justify-center" style={{ backgroundColor: cfg.color }}>
                      <Icon size={14} weight="bold" className="text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-heading font-bold text-sm">{cfg.label}</span>
                        <span className="font-mono text-xs text-dark-light">{count} ({pct}%)</span>
                      </div>
                      <div className="h-2 bg-surface-alt border-2 border-dark">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 0.4 }}
                          className="h-full"
                          style={{ backgroundColor: cfg.color }}
                        />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Team members list */}
      {team.length > 0 && (
        <div className="neo-card p-4">
          <h3 className="font-heading font-bold mb-4">All Members</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-3 border-dark">
                  <th className="text-left py-2 px-2 font-heading font-bold">Name</th>
                  <th className="text-left py-2 px-2 font-heading font-bold">Email</th>
                  <th className="text-left py-2 px-2 font-heading font-bold">Role</th>
                  <th className="text-left py-2 px-2 font-heading font-bold">Joined</th>
                </tr>
              </thead>
              <tbody>
                {team.map((member: any) => {
                  const cfg = ROLE_CONFIG[member.role] || ROLE_CONFIG.member
                  return (
                    <motion.tr
                      key={member.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="border-b border-dark/20 hover:bg-surface-alt transition-colors"
                    >
                      <td className="py-2 px-2 font-heading font-bold">{member.name}</td>
                      <td className="py-2 px-2 text-dark-light font-mono text-xs">{member.email}</td>
                      <td className="py-2 px-2">
                        <span
                          className="px-2 py-0.5 text-xs font-heading font-bold border-2 border-dark"
                          style={{ backgroundColor: cfg.color + '20', color: cfg.color }}
                        >
                          {cfg.label}
                        </span>
                      </td>
                      <td className="py-2 px-2 text-dark-light text-xs font-mono">
                        {member.joinedAt ? new Date(member.joinedAt).toLocaleDateString() : '--'}
                      </td>
                    </motion.tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {devices.length === 0 && team.length === 0 && (
        <div className="neo-card text-center py-12">
          <div className="flex justify-center mb-4"><BlobDevice mood="neutral" size={80} /></div>
          <h3 className="font-heading font-bold text-lg mb-2">No organization data</h3>
          <p className="text-dark-light text-sm">Add devices and invite team members to see your organization overview.</p>
        </div>
      )}
    </div>
  )
}