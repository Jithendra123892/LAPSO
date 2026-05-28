'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAppStore } from '@/store/app-store'
import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const accessToken = useAppStore((s) => s.accessToken)

  useEffect(() => {
    if (!accessToken) router.push('/login')
  }, [accessToken, router])

  if (!accessToken) return null

  return (
    <div className="min-h-dvh bg-surface-alt relative overflow-hidden">
      {/* Ambient blob background */}
      <div className="blob-dashboard blob-dashboard-primary" />
      <div className="blob-dashboard blob-dashboard-secondary" />
      <div className="blob-dashboard blob-dashboard-accent" />

      <div className="relative z-10">
        <Header />
        <div className="flex">
          <Sidebar />
          <main className="flex-1 p-4 lg:p-6 max-w-[1600px]">
            {children}
          </main>
        </div>
      </div>
    </div>
  )
}