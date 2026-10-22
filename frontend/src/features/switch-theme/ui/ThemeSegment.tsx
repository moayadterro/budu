'use client'

import { Icon, type IconName } from '@/shared/ui/icon'
import { Segmented } from '@/shared/ui/segmented'
import { useThemeStore, type Theme } from '@/shared/theme/store'
import { useT } from '@/shared/i18n'

const ICONS: Record<Theme, IconName> = { light: 'sun', dark: 'moon', system: 'monitor' }

/** Light / dark / system as a labelled segmented control (the public site's phone menu). */
export function ThemeSegment() {
  const t = useT()
  const { theme, setTheme } = useThemeStore()
  return (
    <Segmented
      id="theme-segment"
      label={t.account.theme}
      value={theme}
      onChange={setTheme}
      options={(['light', 'dark', 'system'] as const).map((id) => ({
        value: id,
        label: (
          <>
            <Icon name={ICONS[id]} className="size-4 flex-none" />
            <span className="truncate">{id === 'system' ? t.account.themeAuto : t.account.themes[id]}</span>
          </>
        ),
      }))}
    />
  )
}
