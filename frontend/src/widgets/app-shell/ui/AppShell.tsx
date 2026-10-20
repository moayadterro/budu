import { redirect } from 'next/navigation'
import { ReactNode } from 'react'
import { SessionProvider } from '@/entities/session'
import { getSession } from '@/entities/session/server'
import { PageTransition } from '@/shared/ui/motion'
import { SidebarInset, SidebarProvider } from '@/shared/ui/sidebar'
import { AppSidebar } from './AppSidebar'
import { SiteHeader } from './SiteHeader'

/** Signed-in app frame (shadcn sidebar layout). No valid session (expired, revoked) → sign-in. */
export async function AppShell({ children }: { children: ReactNode }) {
  const user = await getSession()
  if (!user) redirect('/login')

  return (
    <SessionProvider user={user}>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <SiteHeader />
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
