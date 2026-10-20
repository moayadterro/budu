import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { THEME_KEY } from './key'

export type Theme = 'light' | 'dark' | 'system'

type ThemeState = {
  theme: Theme
  setTheme: (theme: Theme) => void
  /** flip light/dark, starting from what is currently shown */
  toggle: () => void
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: 'system',
      setTheme: (theme) => set({ theme }),
      toggle: () => {
        const { theme } = get()
        set({ theme: isDark(theme) ? 'light' : 'dark' })
      },
    }),
    { name: THEME_KEY },
  ),
)

/** Is this theme dark right now? ('system' follows the OS.) */
export const isDark = (theme: Theme) =>
  theme === 'dark' || (theme === 'system' && matchMedia('(prefers-color-scheme: dark)').matches)

/** Reflect a theme onto <html class="dark"> (shadcn's dark variant + tokens.css `.dark`). */
export function applyTheme(theme: Theme) {
  const root = document.documentElement
  root.classList.toggle('dark', isDark(theme))
  root.style.colorScheme = isDark(theme) ? 'dark' : 'light'
}
