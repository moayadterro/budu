import { redirect } from 'next/navigation'
import { ReactNode } from 'react'
import { SessionProvider } from '@/entities/session'
import { listNotifications, unreadCount } from '@/entities/notification/server'
import { getSession } from '@/entities/session/server'
import { getTenantName, isSchool } from '@/entities/tenant/server'
import { PageTransition } from '@/shared/ui/motion'
import { SidebarInset, SidebarProvider } from '@/shared/ui/sidebar'
import { AppSidebar } from './AppSidebar'
import { SiteHeader } from './SiteHeader'

/** Signed-in app frame (shadcn sidebar layout). No valid session (expired, revoked) → sign-in. */
export async function AppShell({ children }: { children: ReactNode }) {
  const user = await getSession()
  if (!user) redirect('/login')
  const [items, unread, inSchool] = await Promise.all([
    listNotifications(user.userId),
    unreadCount(user.userId),
    isSchool(user.companyId),
  ])
  // under the Budu logo: the school's name for school members; solo users see their role instead
  const schoolName = inSchool ? await getTenantName(user.companyId) : null

  return (
    <SessionProvider user={user}>
      <SidebarProvider>
        <AppSidebar inSchool={inSchool} schoolName={schoolName} />
        <SidebarInset>
          <SiteHeader inbox={{ items, unread }} />
          <main className="flex-1 p-4 md:p-6">
            <div className="mx-auto w-full max-w-6xl">
              <PageTransition>{children}</PageTransition>
            </div>
          </main>
        </SidebarInset>
      </SidebarProvider>
    </SessionProvider>
  )
}
