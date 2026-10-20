'use client'

import { LanguageMenu } from '@/features/switch-language'
import { ThemeToggle } from '@/features/switch-theme'
import { Button } from '@/shared/ui/button'
import { Icon } from '@/shared/ui/icon'
import { Separator } from '@/shared/ui/separator'
import { SidebarTrigger } from '@/shared/ui/sidebar'
import { useT } from '@/shared/i18n'

/** Top bar of the signed-in app: sidebar toggle, search, theme, notifications. */
export function SiteHeader() {
  const t = useT()
  return (
    <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-2 border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <SidebarTrigger className="-ms-1" />
      <Separator orientation="vertical" className="me-2 data-[orientation=vertical]:h-4" />
      <Button variant="outline" className="hidden h-8 w-full max-w-xs justify-start gap-2 text-muted-foreground shadow-none md:flex" disabled>
        <Icon name="search" />
        <span className="text-sm font-normal">{t.searchPh}</span>
      </Button>
      <div className="ms-auto flex items-center gap-1">
        <LanguageMenu />
        <ThemeToggle />
        <Button variant="ghost" size="icon" className="relative" aria-label={t.notifications}>
          <Icon name="bell" />
          <span className="absolute end-2 top-2 size-1.5 rounded-full bg-primary" />
        </Button>
      </div>
    </header>
  )
}
