import '../styles/globals.css'
import type { Metadata } from 'next'
import { dirOf, I18nProvider } from '@/shared/i18n'
import { getLocale } from '@/shared/i18n/server'
import { THEME_KEY } from '@/shared/theme/key'
import { ThemeSync } from '@/shared/theme/ThemeSync'
import { ConnectionStatus } from '@/shared/ui/connection-status'
import { Toaster } from '@/shared/ui/sonner'
import { TooltipProvider } from '@/shared/ui/tooltip'

export const metadata: Metadata = {
  // absolute URLs for canonical / hreflang / Open Graph (the public pages set those per language)
  metadataBase: new URL(process.env.APP_URL ?? 'http://localhost:3000'),
  title: { default: 'Budu', template: '%s · Budu' },
  description: 'Online learning platform',
}

// Apply the saved theme before first paint (zustand persists it as {"state":{"theme":…}}).
const noFlash = `try{var t='system';try{t=JSON.parse(localStorage.getItem('${THEME_KEY}')).state.theme}catch(e){}var d=t==='dark'||(t!=='light'&&matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.classList.toggle('dark',d);document.documentElement.style.colorScheme=d?'dark':'light'}catch(e){}`

export async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale()
  return (
    <html lang={locale} dir={dirOf(locale)} suppressHydrationWarning>
      <head>
        {/* plain server-rendered script: runs before paint; next/script re-renders it on the client and React 19 warns */}
        <script id="no-flash-theme" dangerouslySetInnerHTML={{ __html: noFlash }} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Golos+Text:wght@400;500;600;700;800&family=IBM+Plex+Sans+Arabic:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <I18nProvider locale={locale}>
          <ThemeSync />
          <TooltipProvider>{children}</TooltipProvider>
          <ConnectionStatus />
          <Toaster position={dirOf(locale) === 'rtl' ? 'bottom-left' : 'bottom-right'} />
        </I18nProvider>
      </body>
    </html>
  )
}
