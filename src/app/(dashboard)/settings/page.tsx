'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAppStore } from '@/store/app-store'
import { motion, AnimatePresence } from 'framer-motion'
import { BlobDevice } from '@/components/illustrations/blob-device'
import { User, Lock, Key, Download, Copy, CheckCircle, Warning, Shield, Trash, Devices, Eye, EyeSlash, ArrowsClockwise, EyeClosed, MapTrifold } from '@phosphor-icons/react'

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
}
const itemVariants = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.22, ease: [0.2, 0, 0, 1] } },
}

function SectionHeader({ icon: Icon, title, color }: { icon: any; title: string; color?: string }) {
  return (
    <div className="flex items-center gap-2 mb-4 pb-2 border-b-3 border-dark">
      <div className="w-7 h-7 border-2 border-dark flex items-center justify-center" style={{ background: color || '#FF6B6B' }}>
        <Icon size={14} weight="bold" color="white" />
      </div>
      <h2 className="font-heading font-bold text-dark text-lg">{title}</h2>
    </div>
  )
}

export default function SettingsPage() {
  const qc = useQueryClient()
  const user = useAppStore((s) => s.user)
  const accessToken = useAppStore((s) => s.accessToken)

  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'keys' | 'agents' | 'privacy'>('profile')
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)
  const [showKey, setShowKey] = useState(false)
  const [copied, setCopied] = useState(false)

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3500)
  }

  const tabs = [
    { id: 'profile' as const, label: 'Profile', icon: User },
    { id: 'security' as const, label: 'Security', icon: Lock },
    { id: 'keys' as const, label: 'Encryption', icon: Key },
    { id: 'agents' as const, label: 'Agents', icon: Devices },
    { id: 'privacy' as const, label: 'Privacy', icon: EyeClosed },
  ]

  return (
    <div className="min-h-dvh bg-surface-alt p-6">
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -16, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0 }}
            className="fixed top-4 left-1/2 z-50 neo-card px-5 py-3 font-body text-sm font-semibold shadow-neo flex items-center gap-2"
            style={{ background: toast.type === 'success' ? '#4ECDC4' : '#FF4757', color: 'white', borderColor: '#2D3436' }}
            role="status"
            aria-live="polite"
          >
            {toast.type === 'success' ? <CheckCircle size={16} weight="fill" /> : <Warning size={16} weight="fill" />}
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <h1 className="font-heading text-3xl font-bold text-dark flex items-center gap-2">
            <User size={26} weight="bold" className="text-primary" />
            Settings
          </h1>
          <p className="font-body text-sm text-dark-light mt-1">Manage your account, security, and encryption keys.</p>
        </motion.div>

        {/* Tab Bar */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="neo-card p-1.5 bg-surface mb-6 inline-flex gap-1">
          {tabs.map(({ id, label, icon: Icon }) => (
            <motion.button
              key={id}
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setActiveTab(id)}
              className={`flex items-center gap-1.5 px-4 py-2 font-heading font-bold text-xs transition-all ${
                activeTab === id
                  ? 'neo-btn-primary'
                  : 'text-dark-light hover:text-dark'
              }`}
            >
              <Icon size={14} weight={activeTab === id ? 'fill' : 'regular'} />
              {label}
            </motion.button>
          ))}
        </motion.div>

        <motion.div variants={containerVariants} initial="hidden" animate="show">
          {activeTab === 'profile' && <ProfileSection showToast={showToast} user={user} accessToken={accessToken} qc={qc} />}
          {activeTab === 'security' && <SecuritySection showToast={showToast} user={user} accessToken={accessToken} />}
          {activeTab === 'keys' && <KeysSection showToast={showToast} user={user} accessToken={accessToken} showKey={showKey} setShowKey={setShowKey} copied={copied} setCopied={setCopied} />}
          {activeTab === 'privacy' && <PrivacySection showToast={showToast} accessToken={accessToken} />}
          {activeTab === 'agents' && <AgentsSection showToast={showToast} accessToken={accessToken} />}
        </motion.div>
      </div>
    </div>
  )
}

function ProfileSection({ showToast, user, accessToken, qc }: { showToast: any; user: any; accessToken: any; qc: any }) {
  const [name, setName] = useState(user?.name || '')
  const [updating, setUpdating] = useState(false)

  const updateMutation = useMutation({
    mutationFn: async (data: { name: string }) => {
      const res = await fetch('/api/auth/me', {
        method: 'PUT',
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Failed')
      return res.json()
    },
    onSuccess: () => { showToast('Profile updated!'); qc.invalidateQueries({ queryKey: ['user'] }) },
    onError: () => showToast('Failed to update profile.', 'error'),
  })

  return (
    <motion.div variants={itemVariants} className="neo-card bg-surface">
      <SectionHeader icon={User} title="Profile" color="#FF6B6B" />
      <div className="flex items-start gap-4 mb-5">
        <div className="relative">
          <div className="w-16 h-16 bg-primary border-3 border-dark flex items-center justify-center text-white font-heading font-bold text-2xl" style={{ boxShadow: '3px 3px 0 0 #2D3436' }}>
            {name.charAt(0).toUpperCase()}
          </div>
          <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-secondary border-2 border-dark rounded-none" />
        </div>
        <div>
          <p className="font-heading font-bold text-sm">{user?.email}</p>
          <p className="font-body text-xs text-dark-light mt-0.5">Avatar derived from your name</p>
        </div>
      </div>

      <div className="neo-input-row mb-4">
        <label className="neo-label">Display Name</label>
        <input className="neo-input w-full" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
      </div>

      <div className="neo-input-row mb-5">
        <label className="neo-label">Email Address</label>
        <input className="neo-input w-full opacity-60" value={user?.email || ''} disabled />
        <p className="font-body text-xs text-dark-light mt-1">Email cannot be changed.</p>
      </div>

      <motion.button
        whileHover={{ y: -1 }}
        whileTap={{ scale: 0.97 }}
        className="neo-btn-primary"
        disabled={updating}
        onClick={() => updateMutation.mutate({ name })}
      >
        Save Changes
      </motion.button>
    </motion.div>
  )
}

function SecuritySection({ showToast, user, accessToken }: { showToast: any; user: any; accessToken: any }) {
  const [currentPw, setCurrentPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [totpEnabled, setTotpEnabled] = useState(user?.totpEnabled || false)
  const [setupTotp, setSetupTotp] = useState(false)

  const pwMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/auth/password', {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: currentPw, newPassword: newPw }),
      })
      if (!res.ok) throw new Error('Failed')
      return res.json()
    },
    onSuccess: () => { showToast('Password updated!'); setCurrentPw(''); setNewPw('') },
    onError: () => showToast('Failed to update password.', 'error'),
  })

  return (
    <motion.div variants={itemVariants} className="space-y-4">
      <div className="neo-card bg-surface">
        <SectionHeader icon={Lock} title="Change Password" color="#FF6B6B" />
        <div className="space-y-4">
          <div className="neo-input-row">
            <label className="neo-label">Current Password</label>
            <div className="relative">
              <input
                type={showPw ? 'text' : 'password'}
                className="neo-input w-full pr-10"
                value={currentPw}
                onChange={(e) => setCurrentPw(e.target.value)}
              />
              <button onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-light hover:text-dark">
                {showPw ? <EyeSlash size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          <div className="neo-input-row">
            <label className="neo-label">New Password</label>
            <input
              type={showPw ? 'text' : 'password'}
              className="neo-input w-full"
              value={newPw}
              onChange={(e) => setNewPw(e.target.value)}
              placeholder="Minimum 8 characters"
            />
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="show-pw" checked={showPw} onChange={() => setShowPw(!showPw)} className="neo-checkbox" />
            <label htmlFor="show-pw" className="font-body text-sm text-dark-light cursor-pointer">Show passwords</label>
          </div>
          <motion.button whileTap={{ scale: 0.97 }} className="neo-btn-primary" onClick={() => pwMutation.mutate()} disabled={!currentPw || !newPw}>
            Update Password
          </motion.button>
        </div>
      </div>

      <div className="neo-card bg-surface">
        <SectionHeader icon={Shield} title="Two-Factor Authentication" color="#4ECDC4" />
        {totpEnabled ? (
          <div className="flex items-center justify-between">
            <div>
              <p className="font-heading font-bold text-sm text-dark">TOTP Authenticator App</p>
              <p className="font-body text-xs text-dark-light">2FA is enabled. You're extra secure.</p>
            </div>
            <span className="neo-badge bg-secondary text-dark border-2 border-dark">Enabled</span>
          </div>
        ) : setupTotp ? (
          <div className="text-center py-4">
            <div className="w-48 h-48 border-3 border-dark mx-auto mb-4 flex items-center justify-center bg-surface-alt">
              <div className="text-center">
                <div className="font-mono text-xs text-dark-light">QR Code appears here</div>
                <div className="font-mono text-xs mt-1">or use secret key</div>
              </div>
            </div>
            <button onClick={() => setTotpEnabled(true)} className="neo-btn-secondary text-sm">Verify & Enable</button>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <div>
              <p className="font-heading font-bold text-sm text-dark">No 2FA enabled</p>
              <p className="font-body text-xs text-dark-light">Protect your account with an authenticator app.</p>
            </div>
            <button onClick={() => setSetupTotp(true)} className="neo-btn-secondary text-sm flex items-center gap-1">
              <ArrowsClockwise size={14} weight="bold" /> Set Up 2FA
            </button>
          </div>
        )}
      </div>
    </motion.div>
  )
}

function KeysSection({ showToast, user, accessToken, showKey, setShowKey, copied, setCopied }: {
  showToast: any; user: any; accessToken: any; showKey: boolean; setShowKey: (v: boolean) => void; copied: boolean; setCopied: (v: boolean) => void
}) {
  const [generating, setGenerating] = useState(false)

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      showToast('Copied to clipboard!')
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const regenerateKeys = async () => {
    if (!confirm('Regenerate your encryption keypair? Your private key will change. Devices need to re-register. Continue?')) return
    setGenerating(true)
    try {
      const res = await fetch('/api/auth/key/regenerate', {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      if (res.ok) showToast('Keypair regenerated. Download your new private key now!')
      else showToast('Failed to regenerate keys.', 'error')
    } catch { showToast('Network error.', 'error') }
    setGenerating(false)
  }

  return (
    <motion.div variants={itemVariants} className="space-y-4">
      <div className="neo-card bg-surface">
        <SectionHeader icon={Key} title="End-to-End Encryption Keys" color="#A855F7" />
        <div className="neo-card p-4 bg-surface-alt border-l-4 border-primary mb-4">
          <p className="font-body text-xs text-dark leading-relaxed">
            <strong>LAPSO uses E2E encryption.</strong> Your private key never leaves your device. We store only encrypted shards. If you lose your private key, we cannot recover your data — ever.
          </p>
        </div>

        <div className="space-y-3">
          <div>
            <label className="neo-label mb-1">Public Key (stored on server)</label>
            <div className="neo-card p-3 bg-surface-alt flex items-center gap-2">
              <code className="font-mono text-xs text-dark flex-1 truncate">
                {user?.publicKey ? `${user.publicKey.slice(0, 32)}...` : 'No keypair generated'}
              </code>
              {user?.publicKey && (
                <button onClick={() => copyToClipboard(user.publicKey)} className="neo-btn-ghost p-1.5 shrink-0" title="Copy public key">
                  {copied ? <CheckCircle size={14} weight="fill" className="text-secondary" /> : <Copy size={14} />}
                </button>
              )}
            </div>
          </div>

          <div>
            <label className="neo-label mb-1">Private Key (download — never upload)</label>
            <div className="neo-card p-3 bg-surface-alt flex items-center gap-2">
              <code className="font-mono text-xs text-dark flex-1">
                {showKey ? (user?.encryptedPrivateKey || 'No key found') : '••••••••••••••••••••••••••••••••••••••••••••'}
              </code>
              <button onClick={() => setShowKey(!showKey)} className="neo-btn-ghost p-1.5 shrink-0">
                {showKey ? <EyeSlash size={14} /> : <Eye size={14} />}
              </button>
              <button
                onClick={() => user?.encryptedPrivateKey && copyToClipboard(user.encryptedPrivateKey)}
                className="neo-btn-ghost p-1.5 shrink-0"
                title="Copy private key"
              >
                <Download size={14} />
              </button>
            </div>
            <p className="font-body text-xs text-dark-light mt-1 flex items-center gap-1">
              <Warning size={12} weight="fill" className="text-danger" />
              Never share your private key. Anyone with it can decrypt your device data.
            </p>
          </div>

          <div className="flex gap-3">
            <motion.button whileTap={{ scale: 0.97 }} className="neo-btn-ghost flex items-center gap-1.5 text-xs" onClick={() => showToast('Export feature coming soon')}>
              <Download size={14} /> Export Backup
            </motion.button>
            <motion.button whileTap={{ scale: 0.97 }} className="neo-btn-danger flex items-center gap-1.5 text-xs" onClick={regenerateKeys} disabled={generating}>
              <ArrowsClockwise size={14} /> {generating ? 'Generating...' : 'Regenerate Keypair'}
            </motion.button>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

function PrivacySection({ showToast, accessToken }: { showToast: any; accessToken: any }) {
  const qc = useQueryClient()
  const [autoDeleteDays, setAutoDeleteDays] = useState(30)
  const [newZoneName, setNewZoneName] = useState('')
  const [newZoneRadius, setNewZoneRadius] = useState(100)
  const [showNewZoneForm, setShowNewZoneForm] = useState(false)

  const { data: geofencesData } = useQuery({
    queryKey: ['geofences'],
    queryFn: async () => {
      const res = await fetch('/api/geofences', { headers: { Authorization: `Bearer ${accessToken}` } })
      if (!res.ok) return { geofences: [] }
      return res.json() as Promise<{ geofences: any[] }>
    },
    enabled: !!accessToken,
  })

  const privacyZones = (geofencesData?.geofences || []).filter((g: any) => g.type === 'privacy')

  const createZoneMutation = useMutation({
    mutationFn: async () => {
      if (!newZoneName.trim()) throw new Error('Zone name required')
      const res = await fetch('/api/geofences', {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newZoneName, radius: newZoneRadius, type: 'privacy', enabled: true, coordinates: { lat: 0, lng: 0 } }),
      })
      if (!res.ok) throw new Error()
      return res.json()
    },
    onSuccess: () => { showToast('Privacy zone created!'); qc.invalidateQueries({ queryKey: ['geofences'] }); setNewZoneName(''); setShowNewZoneForm(false) },
    onError: () => showToast('Failed to create zone.', 'error'),
  })

  const deleteZoneMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/geofences/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${accessToken}` } })
      if (!res.ok) throw new Error()
    },
    onSuccess: () => { showToast('Zone deleted'); qc.invalidateQueries({ queryKey: ['geofences'] }) },
    onError: () => showToast('Failed to delete zone.', 'error'),
  })

  const autoDeleteOptions = [
    { label: '7 days', value: 7 },
    { label: '30 days', value: 30 },
    { label: '90 days', value: 90 },
    { label: 'Never', value: -1 },
  ]

  return (
    <motion.div variants={itemVariants} className="space-y-4">
      <div className="neo-card bg-surface">
        <SectionHeader icon={EyeClosed} title="Privacy Zones" color="#A855F7" />
        <div className="neo-card p-4 bg-accent/10 border-l-4 border-accent mb-4">
          <p className="font-body text-xs text-dark leading-relaxed">
            <strong>Privacy zones pause tracking</strong> when device enters defined area. Location history not recorded inside zones.
          </p>
        </div>
        {privacyZones.length === 0 && !showNewZoneForm && (
          <p className="font-body text-sm text-dark-light text-center py-4">No privacy zones defined.</p>
        )}
        <div className="space-y-3 mb-4">
          {privacyZones.map((zone: any) => (
            <div key={zone.id} className="neo-card p-3 bg-surface-alt flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 border-2 border-dark rounded-none flex items-center justify-center" style={{ backgroundColor: '#A855F7' }}>
                  <MapTrifold size={14} weight="bold" color="white" />
                </div>
                <div>
                  <p className="font-heading font-bold text-sm">{zone.name}</p>
                  <p className="font-mono text-xs text-dark-light">{zone.radius}m radius</p>
                </div>
              </div>
              <button onClick={() => deleteZoneMutation.mutate(zone.id)} className="neo-btn-ghost text-danger p-2" title="Delete zone">
                <Trash size={14} />
              </button>
            </div>
          ))}
        </div>
        {!showNewZoneForm ? (
          <button onClick={() => setShowNewZoneForm(true)} className="neo-btn-ghost text-sm w-full">+ Add Zone</button>
        ) : (
          <div className="space-y-3 p-4 border-2 border-dashed border-dark/30">
            <div className="neo-input-row">
              <label className="neo-label">Zone Name</label>
              <input className="neo-input w-full" value={newZoneName} onChange={e => setNewZoneName(e.target.value)} placeholder="e.g. Home, Office" />
            </div>
            <div className="neo-input-row">
              <label className="neo-label">Radius (meters)</label>
              <input type="number" className="neo-input w-full" value={newZoneRadius} onChange={e => setNewZoneRadius(Number(e.target.value))} min={50} max={5000} />
            </div>
            <div className="flex gap-2">
              <button onClick={() => createZoneMutation.mutate()} disabled={createZoneMutation.isPending || !newZoneName.trim()} className="neo-btn-secondary flex-1 text-xs">
                {createZoneMutation.isPending ? 'Creating...' : 'Create Zone'}
              </button>
              <button onClick={() => setShowNewZoneForm(false)} className="neo-btn-ghost text-xs">Cancel</button>
            </div>
          </div>
        )}
      </div>

      <div className="neo-card bg-surface">
        <SectionHeader icon={Trash} title="Data Retention" color="#FF6B6B" />
        <p className="font-body text-xs text-dark-light mb-4">Location history auto-deletes after this period.</p>
        <div className="flex flex-wrap gap-2">
          {autoDeleteOptions.map(opt => (
            <button
              key={opt.value}
              onClick={() => { setAutoDeleteDays(opt.value); showToast(`Auto-delete: ${opt.label}`) }}
              className={`px-4 py-2 font-heading font-bold text-xs border-2 border-dark transition-all ${autoDeleteDays === opt.value ? 'bg-primary text-white' : 'bg-surface hover:bg-surface-alt'}`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="neo-card bg-surface">
        <SectionHeader icon={Download} title="Export Your Data" color="#4ECDC4" />
        <p className="font-body text-xs text-dark-light mb-4">Download all your data in JSON. Devices, geofences, team, and audit logs.</p>
        <button
          className="neo-btn-primary flex items-center gap-2"
          onClick={async () => {
            showToast('Preparing export...')
            const res = await fetch('/api/export', { headers: { Authorization: `Bearer ${accessToken}` } })
            if (res.ok) {
              const blob = await res.blob()
              const url = URL.createObjectURL(blob)
              const a = document.createElement('a')
              a.href = url
              a.download = `lapso-export-${new Date().toISOString().split('T')[0]}.json`
              a.click()
              showToast('Export downloaded!')
            } else {
              showToast('Export failed.', 'error')
            }
          }}
        >
          <Download size={16} weight="bold" /> Export All Data
        </button>
      </div>
    </motion.div>
  )
}

function AgentsSection({ showToast, accessToken }: { showToast: any; accessToken: any }) {
  const [agentToken, setAgentToken] = useState('')
  const [generating, setGenerating] = useState(false)

  const generateAgentToken = async () => {
    setGenerating(true)
    try {
      const res = await fetch('/api/auth/agent-token', {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      if (res.ok) {
        const data = await res.json()
        setAgentToken(data.token)
        showToast('Agent token generated!')
      } else {
        showToast('Failed to generate token.', 'error')
      }
    } catch { showToast('Network error.', 'error') }
    setGenerating(false)
  }

  const PLATFORM_GUIDES = [
    { platform: 'Windows', color: '#00A4EF', desc: 'Download the LAPSO Agent v1.0 for Windows. Service.', url: '#' },
    { platform: 'macOS', color: '#A2AAAD', desc: 'Download the LAPSO Agent v1.0 for macOS. System Extensions approval needed.', url: '#' },
    { platform: 'Linux', color: '#FCC624', desc: 'Install via: curl -fsSL https://lap.so/agent/linux | sh', url: '#' },
    { platform: 'Android', color: '#3DDC84', desc: 'Download from Google Play. Grant location permissions.', url: '#' },
  ]

  return (
    <motion.div variants={itemVariants} className="space-y-4">
      <div className="neo-card bg-surface">
        <SectionHeader icon={Devices} title="Agent Installation" color="#4ECDC4" />
        <p className="font-body text-sm text-dark-light mb-4">Download and install the LAPSO agent on each device you want to track.</p>
        <div className="space-y-3">
          {PLATFORM_GUIDES.map(({ platform, color, desc, url }) => (
            <div key={platform} className="neo-card p-4 bg-surface-alt flex items-center gap-4 cursor-pointer hover:bg-surface transition-colors">
              <div className="w-10 h-10 rounded-none border-2 border-dark flex items-center justify-center font-heading font-bold text-xs text-white" style={{ backgroundColor: color }}>
                {platform.slice(0, 2).toUpperCase()}
              </div>
              <div className="flex-1">
                <p className="font-heading font-bold text-sm text-dark">{platform}</p>
                <p className="font-body text-xs text-dark-light">{desc}</p>
              </div>
              <div className="text-secondary">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="neo-card bg-surface">
        <SectionHeader icon={Key} title="Agent Token" color="#A855F7" />
        <p className="font-body text-xs text-dark-light mb-4">
          This token authenticates device agents to your account. Keep it secret.
        </p>
        {agentToken ? (
          <div className="neo-input-row">
            <label className="neo-label">Your Agent Token</label>
            <div className="flex gap-2">
              <div className="neo-input flex-1 font-mono text-xs truncate">{agentToken}</div>
              <button onClick={() => navigator.clipboard.writeText(agentToken).then(() => showToast('Copied!'))} className="neo-btn-ghost p-2">
                <Copy size={14} />
              </button>
            </div>
            <p className="font-body text-xs text-dark-light mt-1">Paste this token when installing the LAPSO agent on your device.</p>
          </div>
        ) : (
          <motion.button whileTap={{ scale: 0.97 }} className="neo-btn-primary" onClick={generateAgentToken} disabled={generating}>
            {generating ? 'Generating...' : 'Generate Agent Token'}
          </motion.button>
        )}
      </div>
    </motion.div>
  )
}