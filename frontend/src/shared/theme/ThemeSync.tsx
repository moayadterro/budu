'use client'

import { useEffect } from 'react'
import { applyTheme, useThemeStore } from './store'

/** Keeps <html class="dark"> in step with the chosen theme and, for 'system', with the OS. */
export function ThemeSync() {
  const theme = useThemeStore((s) => s.theme)
  useEffect(() => {
    applyTheme(theme)
    if (theme !== 'system') return
    const mq = matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => applyTheme('system')
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [theme])
  return null
}
