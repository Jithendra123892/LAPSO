import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface User {
  id: string
  email: string
  name: string
  avatarUrl?: string | null
  totpEnabled?: boolean
}

interface AppState {
  user: User | null
  accessToken: string | null
  selectedDeviceId: string | null
  mapCenter: [number, number]
  mapZoom: number
  darkMode: boolean

  setUser: (user: User | null) => void
  setAccessToken: (token: string | null) => void
  setSelectedDeviceId: (id: string | null) => void
  setMapCenter: (center: [number, number]) => void
  setMapZoom: (zoom: number) => void
  toggleDarkMode: () => void
  logout: () => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      selectedDeviceId: null,
      mapCenter: [20.5937, 78.9629] as [number, number],
      mapZoom: 5,
      darkMode: false,
      setUser: (user) => set({ user }),
      setAccessToken: (accessToken) => set({ accessToken }),
      setSelectedDeviceId: (id) => set({ selectedDeviceId: id }),
      setMapCenter: (center) => set({ mapCenter: center }),
      setMapZoom: (zoom) => set({ mapZoom: zoom }),
      toggleDarkMode: () => {
        const next = !get().darkMode
        set({ darkMode: next })
        if (typeof document !== 'undefined') {
          document.documentElement.classList.toggle('dark', next)
        }
      },
      logout: () => set({ user: null, accessToken: null, selectedDeviceId: null }),
    }),
    {
      name: 'lapso-storage',
      partialize: (state) => ({
        accessToken: state.accessToken,
        darkMode: state.darkMode,
      }),
    }
  )
)