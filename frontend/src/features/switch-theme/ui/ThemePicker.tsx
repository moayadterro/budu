'use client'

import { Icon, IconName } from '@/shared/ui/icon'
import { Theme, useThemeStore } from '@/shared/theme/store'
import { cn } from '@/shared/lib/cn'
import { useT } from '@/shared/i18n'

const OPTIONS: Array<{ id: Theme; icon: IconName }> = [
  { id: 'light', icon: 'sun' },
  { id: 'dark', icon: 'moon' },
  { id: 'system', icon: 'monitor' },
]

/** Light / dark / system choice (account settings). */
export function ThemePicker() {
  const t = useT()
  const { theme, setTheme } = useThemeStore()

  return (
    <div className="grid grid-cols-3 gap-2">
      {OPTIONS.map((o) => (
        <button
          key={o.id}
          type="button"
          aria-pressed={theme === o.id}
          onClick={() => setTheme(o.id)}
          className={cn(
            'flex flex-col items-center gap-1.5 rounded-xl border p-3 text-xs font-semibold transition-colors',
            theme === o.id ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:bg-muted',
          )}
        >
          <Icon name={o.icon} className="h-[19px] w-[19px]" />
          {t.account.themes[o.id]}
        </button>
      ))}
    </div>
  )
}
