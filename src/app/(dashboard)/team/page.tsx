'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAppStore } from '@/store/app-store'
import { motion, AnimatePresence } from 'framer-motion'
import { BlobDevice } from '@/components/illustrations/blob-device'
import { Users, Plus, X, Crown, Shield, UserGear, User, Trash, Copy, CheckCircle, EnvelopeSimple, UserCirclePlus } from '@phosphor-icons/react'

const ROLE_CONFIG: Record<string, { label: string; icon: any; color: string; bg: string }> = {
  owner: { label: 'Owner', icon: Crown, color: '#FFE66D', bg: '#FFE66D20' },
  admin: { label: 'Admin', icon: Shield, color: '#A855F7', bg: '#A855F720' },
  manager: { label: 'Manager', icon: UserGear, color: '#4ECDC4', bg: '#4ECDC420' },
  member: { label: 'Member', icon: User, color: '#636E72', bg: '#636E7210' },
}

const ROLE_ORDER = ['owner', 'admin', 'manager', 'member']

function MemberRow({ member, currentUserId, onRemove }: { member: any; currentUserId: string; onRemove: (id: string) => void }) {
  const cfg = ROLE_CONFIG[member.role] || ROLE_CONFIG.member
  const Icon = cfg.icon
  const isSelf = member.userId === currentUserId

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 10 }}
      className="neo-list-item"
    >
      <div className="w-9 h-9 border-2 border-dark flex items-center justify-center font-heading font-bold text-sm shrink-0" style={{ background: cfg.bg, color: cfg.color }}>
        <Icon size={16} weight="bold" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-heading font-bold text-sm text-dark truncate">
          {member.userName}
          {isSelf && <span className="ml-2 text-xs text-dark-light font-normal">(you)</span>}
        </p>
        <p className="font-mono text-xs text-dark-light truncate">{member.userEmail}</p>
      </div>
      <span className="neo-badge text-[10px]" style={{ background: cfg.bg, borderColor: cfg.color, color: cfg.color }}>
        {cfg.label}
      </span>
      {!isSelf && member.role !== 'owner' && (
        <button onClick={() => onRemove(member.id)} className="neo-btn-danger p-1.5 ml-1" title="Remove">
          <Trash size={13} weight="bold" />
        </button>
      )}
    </motion.div>
  )
}

export default function TeamPage() {
  const qc = useQueryClient()
  const accessToken = useAppStore((s) => s.accessToken)
  const userId = useAppStore((s) => s.user?.id)
  const [showInvite, setShowInvite] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<'admin' | 'manager' | 'member'>('member')
  const [toast, setToast] = useState<string | null>(null)

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 3500)
  }

  const { data: teamData, isLoading } = useQuery({
    queryKey: ['team'],
    queryFn: async () => {
      const res = await fetch('/api/team', { headers: { Authorization: `Bearer ${accessToken}` } })
      if (!res.ok) return null
      return res.json()
    },
    enabled: !!accessToken,
  })

  const inviteMutation = useMutation({
    mutationFn: async ({ email, role }: { email: string; role: string }) => {
      const res = await fetch('/api/team/invite', {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, role }),
      })
      if (!res.ok) throw new Error('Failed to invite')
      return res.json()
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['team'] })
      setShowInvite(false)
      setInviteEmail('')
      showToast('Invitation sent!')
    },
    onError: () => showToast('Failed to send invitation.', 'error'),
  } as any)

  const removeMutation = useMutation({
    mutationFn: async (memberId: string) => {
      await fetch(`/api/team/members/${memberId}`, { method: 'DELETE', headers: { Authorization: `Bearer ${accessToken}` } })
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['team'] })
      showToast('Member removed')
    },
  } as any)

  const team = teamData?.team
  const members = teamData?.members || []
  const myRole = members.find((m: any) => m.userId === userId)?.role || 'member'
  const canManage = myRole === 'owner' || myRole === 'admin'

  return (
    <div className="min-h-screen bg-surface-alt p-6">
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="fixed top-4 right-4 z-50 neo-card bg-secondary text-dark px-4 py-3 font-body text-sm font-semibold shadow-neo flex items-center gap-2"
          >
            <CheckCircle size={16} weight="fill" />
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-heading text-3xl font-bold text-dark flex items-center gap-2">
              <Users size={26} weight="bold" className="text-secondary" />
              Team
            </h1>
            <p className="font-body text-sm text-dark-light mt-1">Manage members and roles across your organization.</p>
          </div>
          {canManage && (
            <motion.button
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.97 }}
              className="neo-btn-primary flex items-center gap-2"
              onClick={() => setShowInvite(true)}
            >
              <UserCirclePlus size={18} weight="bold" />
              Invite
            </motion.button>
          )}
        </motion.div>

        {/* Owner's card */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <div key={i} className="neo-card h-16 animate-pulse bg-surface-alt" />)}
          </div>
        ) : (
          <div className="space-y-4">
            {/* Team Info */}
            {team && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="neo-card bg-surface">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 border-3 border-dark flex items-center justify-center bg-primary text-white font-heading font-bold" style={{ boxShadow: '3px 3px 0 0 #2D3436' }}>
                    T
                  </div>
                  <div>
                    <h2 className="font-heading font-bold text-dark text-lg">{team.name}</h2>
                    <p className="font-body text-xs text-dark-light">{members.length} member{members.length !== 1 ? 's' : ''}</p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Members List */}
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="neo-card bg-surface p-0 overflow-hidden">
              <div className="p-4 border-b-3 border-dark">
                <h3 className="font-heading font-bold text-dark">Members</h3>
              </div>

              {members.length === 0 ? (
                <div className="neo-empty-state py-12">
                  <div className="flex justify-center mb-3">
                    <BlobDevice mood="neutral" size={80} />
                  </div>
                  <p className="font-heading font-bold text-dark">No team members yet</p>
                  {canManage && (
                    <button className="neo-btn-primary mt-3" onClick={() => setShowInvite(true)}>
                      <UserCirclePlus size={16} weight="bold" className="inline mr-1" /> Invite First Member
                    </button>
                  )}
                </div>
              ) : (
                <div>
                  {members
                    .sort((a: any, b: any) => ROLE_ORDER.indexOf(a.role) - ROLE_ORDER.indexOf(b.role))
                    .map((member: any) => (
                      <MemberRow
                        key={member.id}
                        member={member}
                        currentUserId={userId}
                        onRemove={(id) => {
                          if (confirm('Remove this member from the team?')) removeMutation.mutate(id)
                        }}
                      />
                    ))}
                </div>
              )}
            </motion.div>

            {/* Role Explanation */}
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="neo-card bg-surface">
              <h3 className="font-heading font-bold text-dark mb-3">Role Permissions</h3>
              <div className="space-y-2">
                {Object.entries(ROLE_CONFIG).filter(([r]) => r !== 'owner').map(([role, cfg]: [string, any]) => (
                  <div key={role} className="flex items-center gap-3 p-2 neo-card p-3" style={{ background: cfg.bg }}>
                    <cfg.icon size={14} weight="bold" style={{ color: cfg.color }} />
                    <span className="font-heading font-bold text-xs" style={{ color: cfg.color }}>{cfg.label}</span>
                    <span className="font-body text-xs text-dark-light flex-1">
                      {role === 'admin' ? 'Full access except delete team' : ''}
                      {role === 'manager' ? 'Add/remove devices, manage geofences' : ''}
                      {role === 'member' ? 'View dashboard, receive alerts' : ''}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </div>

      {/* Invite Modal */}
      <AnimatePresence>
        {showInvite && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="neo-modal-backdrop"
            onClick={(e) => e.target === e.currentTarget && setShowInvite(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: 24, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              className="neo-card max-w-md w-full"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-heading font-bold text-xl text-dark flex items-center gap-2">
                  <EnvelopeSimple size={20} weight="bold" className="text-secondary" />
                  Invite Team Member
                </h2>
                <button onClick={() => setShowInvite(false)} className="neo-btn-ghost p-1.5">
                  <X size={18} weight="bold" />
                </button>
              </div>

              <div className="neo-input-row mb-4">
                <label className="neo-label">Email Address</label>
                <input
                  className="neo-input w-full"
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="colleague@company.com"
                  autoFocus
                />
              </div>

              <div className="neo-input-row mb-4">
                <label className="neo-label">Role</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['admin', 'manager', 'member'] as const).map((role) => {
                    const cfg = ROLE_CONFIG[role]
                    // @ts-ignore
                    const Icon = cfg.icon
                    return (
                      <motion.button
                        key={role}
                        type="button"
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setInviteRole(role as any)}
                        className={`p-3 border-3 text-center transition-all`}
                        style={{
                          background: inviteRole === role ? cfg.bg : '#FFFFFF',
                          borderColor: inviteRole === role ? '#FF6B6B' : '#2D3436',
                          boxShadow: inviteRole === role ? `4px 4px 0 0 #2D3436` : '2px 2px 0 0 #2D3436',
                        }}
                      >
                        <Icon size={20} weight={inviteRole === role ? 'fill' : 'regular'} className="mx-auto mb-1" style={{ color: inviteRole === role ? cfg.color : '#636E72' }} />
                        <span className="font-heading font-bold text-[10px] block" style={{ color: inviteRole === role ? cfg.color : '#636E72' }}>{cfg.label}</span>
                      </motion.button>
                    )
                  })}
                </div>
              </div>

              <div className="flex gap-3">
                <button className="neo-btn-ghost flex-1" onClick={() => setShowInvite(false)}>Cancel</button>
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  className="neo-btn-primary flex-1"
                  disabled={!inviteEmail || inviteMutation.isPending}
                  onClick={() => inviteMutation.mutate({ email: inviteEmail, role: inviteRole })}
                >
                  {inviteMutation.isPending ? 'Sending...' : 'Send Invite'}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}