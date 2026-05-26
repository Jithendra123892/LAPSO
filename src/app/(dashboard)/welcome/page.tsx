'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAppStore } from '@/store/app-store'

export default function WelcomePage() {
  const router = useRouter()
  const user = useAppStore((s) => s.user)
  const [step, setStep] = useState(0)

  useEffect(() => {
    if (!user) router.push('/login')
  }, [user, router])

  if (!user) return null

  const steps = [
    { title: `Welcome, ${user.name}!`, desc: 'Your device tracking system is ready. Let\'s set up your first device.' },
    { title: 'Install LAPSO Agent', desc: 'Download the LAPSO agent for your laptop or phone. It runs quietly in the background.' },
    { title: 'E2E Encrypted', desc: 'Your data is encrypted end-to-end. Only you hold the keys. Even we cannot see your location.' },
    { title: 'All Set!', desc: 'Your tracking is live. Add more devices, set up geofences, and customize alerts anytime.' },
  ]

  return (
    <div className="min-h-screen bg-surface-alt flex items-center justify-center p-4">
      <div className="w-full max-w-md neo-card text-center">
        <div className="text-5xl mb-4 animate-float">📍</div>
        <h2 className="text-2xl font-heading font-bold mb-3">{steps[step].title}</h2>
        <p className="text-dark-light mb-8">{steps[step].desc}</p>

        <div className="flex gap-2 justify-center mb-6">
          {steps.map((_, i) => (
            <div key={i} className={`w-3 h-3 border-2 border-dark ${i === step ? 'bg-primary' : 'bg-surface-alt'}`} />
          ))}
        </div>

        <div className="flex gap-3 justify-center">
          {step > 0 && <button className="neo-btn-ghost" onClick={() => setStep(step - 1)}>Back</button>}
          {step < steps.length - 1 ? (
            <button className="neo-btn-primary" onClick={() => setStep(step + 1)}>Next</button>
          ) : (
            <button className="neo-btn-primary" onClick={() => router.push('/dashboard')}>Go to Dashboard</button>
          )}
        </div>
      </div>
    </div>
  )
}