import { redirect } from 'next/navigation'
import { after } from 'next/server'
import { ReactNode } from 'react'
import { SessionProvider } from '@/entities/session'
import { listNotifications, unreadCount } from '@/entities/notification/server'
import { getSession } from '@/entities/session/server'
import { isSchool } from '@/entities/tenant/server'
import { runQuizReminders } from '@/features/remind-quizzes/server'
import { cleanUpUploads } from '@/features/upload-material/server'
import { PageTransition } from '@/shared/ui/motion'
import { SidebarInset, SidebarProvider } from '@/shared/ui/sidebar'
import { AppSidebar } from './AppSidebar'
import { SiteHeader } from './SiteHeader'

/** Signed-in app frame (shadcn sidebar layout). No valid session (expired, revoked) → sign-in. */
export async function AppShell({ children }: { children: ReactNode }) {
  const user = await getSession()
  if (!user) redirect('/login')
  after(runQuizReminders) // background chores ride on page loads (throttled inside)
  after(cleanUpUploads)
  const [items, unread, inSchool] = await Promise.all([
    listNotifications(user.userId),
    unreadCount(user.userId),
    isSchool(user.companyId),
  ])

  return (
    <SessionProvider user={user}>
      <SidebarProvider>
        <AppSidebar inSchool={inSchool} />
        <SidebarInset>
          <SiteHeader inbox={{ items, unread }} />
          <main className="flex-1 p-4 md:p-6">
            {/* pages that need the room (the timetable) opt out of the max width with data-wide */}
            <div className="mx-auto w-full max-w-6xl has-[[data-wide]]:max-w-none">
              <PageTransition>{children}</PageTransition>
            </div>
          </main>
        </SidebarInset>
      </SidebarProvider>
    </SessionProvider>
  )
}
