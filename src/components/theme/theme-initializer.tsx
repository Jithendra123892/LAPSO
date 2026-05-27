'use client'

import { useEffect } from 'react'
import { useAppStore } from '@/store/app-store'

/** Initializes dark mode on mount from persisted state */
export function ThemeInitializer() {
  const darkMode = useAppStore((s) => s.darkMode)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode)
  }, [darkMode])

  return null
}