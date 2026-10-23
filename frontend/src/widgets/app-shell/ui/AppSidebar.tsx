'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { HugeiconsIcon } from '@hugeicons/react'
import { ArrowUpDownIcon, UserCircleIcon } from '@hugeicons/core-free-icons'
import { initialsOf, pictureUrl, useSession } from '@/entities/session'
import { SignOutMenuItem } from '@/features/sign-out'
import { NAV, activeHref } from '@/shared/config/nav'
import { InitialsAvatar } from '@/shared/ui/initials-avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu'
import { Icon } from '@/shared/ui/icon'
import { Logo } from '@/shared/ui/logo'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from '@/shared/ui/sidebar'
import { dirOf, useLocale, useT } from '@/shared/i18n'

/** App sidebar: the Budu brand (app only — never a school's name), the role's screens, signed-in user menu. */
export function AppSidebar({ inSchool }: { inSchool: boolean }) {
  const t = useT()
  const user = useSession((s) => s.user)
  const path = usePathname()
  const { isMobile, setOpenMobile } = useSidebar()
  const locale = useLocale()
  const closeOnMobile = () => isMobile && setOpenMobile(false)
  const items = NAV[user.role].filter((i) => !i.schoolOnly || inSchool)
  const active = activeHref(items, path)

  return (
    <Sidebar collapsible="icon" side={dirOf(locale) === 'rtl' ? 'right' : 'left'}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/start" onClick={closeOnMobile} aria-label={t.appName}>
                {/* full logo; only the steps mark when the sidebar is collapsed to icons
                    (`!`: the menu button shrinks every <svg> inside it to icon size) */}
                <span className="flex w-full group-data-[collapsible=icon]:justify-center">
                  <Logo className="h-7! w-auto! group-data-[collapsible=icon]:hidden!" label={t.appName} />
                  <Logo mark className="hidden! size-5! group-data-[collapsible=icon]:block!" label={t.appName} />
                </span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>{t.role[user.role]}</SidebarGroupLabel>
          <SidebarMenu>
            {items.map((item) => (
              <SidebarMenuItem key={item.label}>
                {item.href ? (
                  <SidebarMenuButton asChild isActive={item.href === active} tooltip={t.nav[item.label]}>
                    <Link href={item.href} onClick={closeOnMobile}>
                      <Icon name={item.icon} />
                      <span>{t.nav[item.label]}</span>
                    </Link>
                  </SidebarMenuButton>
                ) : (
                  <SidebarMenuButton disabled tooltip={`${t.nav[item.label]} · ${t.soon}`}>
                    <Icon name={item.icon} />
                    <span>{t.nav[item.label]}</span>
                  </SidebarMenuButton>
                )}
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton size="lg" className="data-[state=open]:bg-sidebar-accent">
                  <InitialsAvatar
                    initials={initialsOf(user.name)}
                    color="var(--color-primary)"
                    photo={pictureUrl(user.pictureId)}
                    className="size-8 rounded-lg"
                  />
                  <div className="grid flex-1 text-start text-sm leading-tight">
                    <span className="truncate font-medium">{user.name}</span>
                    <span className="truncate text-xs text-muted-foreground">{user.email}</span>
                  </div>
                  <HugeiconsIcon icon={ArrowUpDownIcon} strokeWidth={2} className="ms-auto size-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="min-w-56" side={isMobile ? 'bottom' : dirOf(locale) === 'rtl' ? 'left' : 'right'} align="end" sideOffset={4}>
                <DropdownMenuLabel className="font-normal">
                  <div className="grid text-sm leading-tight">
                    <span className="truncate font-medium">{user.name}</span>
                    <span className="truncate text-xs text-muted-foreground">{t.role[user.role]}</span>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/account" onClick={closeOnMobile}>
                    <HugeiconsIcon icon={UserCircleIcon} strokeWidth={2} />
                    {t.settings}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <SignOutMenuItem />
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
