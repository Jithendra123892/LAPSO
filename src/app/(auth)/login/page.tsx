'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useMutation } from '@tanstack/react-query'
import { useAppStore } from '@/store/app-store'
import { motion } from 'framer-motion'
import { EnvelopeSimple, LockKey, ShieldCheck } from '@phosphor-icons/react'
import { BlobDevice } from '@/components/illustrations/blob-device'

export default function LoginPage() {
  const router = useRouter()
  const setUser = useAppStore((s) => s.setUser)
  const setAccessToken = useAppStore((s) => s.setAccessToken)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [showPw, setShowPw] = useState(false)

  const loginMutation = useMutation({
    mutationFn: async (creds: { email: string; password: string }) => {
      const res = await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(creds) })
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || 'Login failed') }
      return res.json()
    },
    onSuccess: (data) => { setAccessToken(data.accessToken); setUser(data.user); router.push('/dashboard') },
    onError: (err: Error) => setError(err.message),
  })

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="neo-card text-center pb-6"
      >
        <div className="flex justify-center mb-4">
          <BlobDevice mood="happy" type="laptop" size={72} />
        </div>
        <h1 className="text-2xl font-heading font-bold text-dark">Welcome back</h1>
        <p className="font-body text-sm text-dark-light mt-1">Sign in to track your devices</p>
      </motion.div>

      {/* Form */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <form
          onSubmit={(e) => { e.preventDefault(); setError(''); loginMutation.mutate({ email, password }) }}
          className="neo-card flex flex-col gap-5"
        >
          {/* Email */}
          <div className="neo-input-row">
            <label className="neo-label">Email</label>
            <div className="relative">
              <EnvelopeSimple size={16} weight="bold" className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-light" />
              <input
                className="neo-input w-full pl-9"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
          </div>

          {/* Password */}
          <div className="neo-input-row">
            <label className="neo-label">Password</label>
            <div className="relative">
              <LockKey size={16} weight="bold" className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-light" />
              <input
                className="neo-input w-full pl-9 pr-9"
                type={showPw ? 'text' : 'password'}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
              <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-light text-xs font-bold uppercase tracking-wide hover:text-dark transition-colors">
                {showPw ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <motion.p
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-sm font-body font-medium text-danger bg-danger/10 border-l-4 border-danger px-3 py-2"
            >
              {error}
            </motion.p>
          )}

          <motion.button
            type="submit"
            whileHover={{ y: -2, boxShadow: '5px 5px 0 0 #2D3436' }}
            whileTap={{ scale: 0.97, boxShadow: '2px 2px 0 0 #2D3436' }}
            className="neo-btn-primary w-full font-heading font-bold py-3 text-base disabled:opacity-40"
            disabled={loginMutation.isPending}
          >
            {loginMutation.isPending ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-none animate-spin" />
                Logging in...
              </span>
            ) : (
              'Log In'
            )}
          </motion.button>
        </form>
      </motion.div>

      {/* Footer */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="text-center text-sm font-body text-dark-light"
      >
        Don't have an account?{' '}
        <Link href="/register" className="font-heading font-bold text-primary hover:underline">Register</Link>
      </motion.p>

      {/* Encryption note */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="neo-card p-3 bg-surface flex items-center gap-3 border-l-4 border-secondary"
      >
        <ShieldCheck size={20} weight="fill" className="text-secondary flex-shrink-0" />
        <p className="font-body text-xs text-dark-light">All sessions are E2E encrypted. We never see your data.</p>
      </motion.div>
    </div>
  )
}