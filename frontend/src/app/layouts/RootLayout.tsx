import '../styles/globals.css'
import type { Metadata } from 'next'
import Script from 'next/script'
import { THEME_KEY } from '@/shared/theme/key'
import { ThemeSync } from '@/shared/theme/ThemeSync'
import { Toaster } from '@/shared/ui/sonner'
import { TooltipProvider } from '@/shared/ui/tooltip'

export const metadata: Metadata = {
  title: 'Budu',
  description: 'Online learning platform',
}

// Apply the saved theme before first paint (zustand persists it as {"state":{"theme":…}}).
const noFlash = `try{var t='system';try{t=JSON.parse(localStorage.getItem('${THEME_KEY}')).state.theme}catch(e){}var d=t==='dark'||(t!=='light'&&matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.classList.toggle('dark',d);document.documentElement.style.colorScheme=d?'dark':'light'}catch(e){}`

export function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <Script id="no-flash-theme" strategy="beforeInteractive">{noFlash}</Script>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Golos+Text:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <ThemeSync />
        <TooltipProvider>{children}</TooltipProvider>
        <Toaster />
      </body>
    </html>
  )
}
