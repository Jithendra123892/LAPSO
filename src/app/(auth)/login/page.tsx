'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useMutation } from '@tanstack/react-query'
import { useAppStore } from '@/store/app-store'

export default function LoginPage() {
  const router = useRouter()
  const setUser = useAppStore((s) => s.setUser)
  const setAccessToken = useAppStore((s) => s.setAccessToken)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const loginMutation = useMutation({
    mutationFn: async (creds: { email: string; password: string }) => {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(creds),
      })
      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.error || 'Login failed')
      }
      return res.json()
    },
    onSuccess: (data) => {
      setAccessToken(data.accessToken)
      setUser(data.user)
      router.push('/dashboard')
    },
    onError: (err: Error) => setError(err.message),
  })

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="w-full neo-card text-center mb-2">
        <div className="w-16 h-16 mx-auto mb-3 bg-secondary border-3 border-dark rounded-full flex items-center justify-center text-3xl">📍</div>
        <h1 className="text-2xl font-heading font-bold">Welcome back</h1>
      </div>

      <form
        onSubmit={(e) => { e.preventDefault(); setError(''); loginMutation.mutate({ email, password }) }}
        className="w-full neo-card flex flex-col gap-4"
      >
        <div className="flex flex-col gap-1.5">
          <label className="font-heading font-bold text-sm">Email</label>
          <input className="neo-input" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="font-heading font-bold text-sm">Password</label>
          <input className="neo-input" type="password" placeholder="Enter your password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>
        {error && <p className="text-danger text-sm font-medium">{error}</p>}
        <button type="submit" className="neo-btn-primary w-full" disabled={loginMutation.isPending}>
          {loginMutation.isPending ? 'Logging in...' : 'Log In'}
        </button>
      </form>

      <p className="text-center text-sm text-dark-light">
        Don't have an account?{' '}
        <Link href="/register" className="font-bold text-primary hover:underline">Register</Link>
      </p>
    </div>
  )
}