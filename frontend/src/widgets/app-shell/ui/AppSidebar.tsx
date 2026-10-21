'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { HugeiconsIcon } from '@hugeicons/react'
import { ArrowUpDownIcon, UserCircleIcon } from '@hugeicons/core-free-icons'
import { initialsOf, pictureUrl, useSession } from '@/entities/session'
import { SignOutMenuItem } from '@/features/sign-out'
import { NAV, activeHref } from '@/shared/config/nav'
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu'
import { BrandMark, Icon } from '@/shared/ui/icon'
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

/** App sidebar: Budu brand (+ the user's school), the role's screens, signed-in user menu. */
export function AppSidebar({ inSchool, schoolName }: { inSchool: boolean; schoolName: string | null }) {
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
              <Link href="/" onClick={closeOnMobile}>
                <BrandMark />
                <div className="grid flex-1 text-start text-sm leading-tight">
                  <span className="truncate font-semibold">{t.appName}</span>
                  <span className="truncate text-xs text-muted-foreground">{schoolName ?? t.role[user.role]}</span>
                </div>
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
                  <Avatar className="size-8 rounded-lg">
                    {user.pictureId && <AvatarImage src={pictureUrl(user.pictureId)!} alt="" />}
                    <AvatarFallback className="rounded-lg">{initialsOf(user.name)}</AvatarFallback>
                  </Avatar>
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
