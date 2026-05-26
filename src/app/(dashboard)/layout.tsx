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
    <div className="min-h-screen bg-surface-alt">
      <Header />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-4 lg:p-6 max-w-[1600px]">
          {children}
        </main>
      </div>
    </div>
  )
}