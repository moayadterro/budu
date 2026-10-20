'use client'

import { Button } from '@/shared/ui/button'
import { Icon } from '@/shared/ui/icon'
import { useThemeStore } from '@/shared/theme/store'
import { useT } from '@/shared/i18n'

/** Flips between light and dark. Starts from the OS preference until the user picks. */
export function ThemeToggle() {
  const t = useT()
  const toggle = useThemeStore((s) => s.toggle)
  return (
    <Button variant="ghost" size="icon" onClick={toggle} aria-label={t.theme}>
      <Icon name="sun" className="size-4 dark:hidden" />
      <Icon name="moon" className="hidden size-4 dark:block" />
    </Button>
  )
}
