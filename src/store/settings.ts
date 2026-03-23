import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface SettingsState {
  defaultRestSeconds: number
  soundEnabled: boolean
  setDefaultRest: (seconds: number) => void
  toggleSound: () => void
}

export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      defaultRestSeconds: 60,
      soundEnabled: true,
      setDefaultRest: (seconds) => set({ defaultRestSeconds: seconds }),
      toggleSound: () => set((s) => ({ soundEnabled: !s.soundEnabled })),
    }),
    { name: 'timeout-settings' }
  )
)
