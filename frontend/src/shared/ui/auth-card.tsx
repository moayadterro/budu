'use client'

import { ReactNode } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card'
import { Logo } from './logo'
import { cn } from '@/shared/lib/cn'
import { useT } from '@/shared/i18n'

/** Centered card used by every auth screen (sign in, register, reset …). */
export function AuthCard({ title, sub, children, wide }: { title: string; sub?: ReactNode; children: ReactNode; wide?: boolean }) {
  const t = useT()
  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-6 bg-muted p-6 md:p-10">
      <div className={cn('flex w-full flex-col gap-6', wide ? 'max-w-lg' : 'max-w-sm')}>
        {/* optical centring: the heavy steps sit on the left, so the logo LOOKS left of centre — nudge it right */}
        <Logo className="h-10 w-auto self-center translate-x-[4.5%]" label={t.appName} />
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">{title}</CardTitle>
            {sub && <CardDescription>{sub}</CardDescription>}
          </CardHeader>
          <CardContent>{children}</CardContent>
        </Card>
      </div>
    </main>
  )
}
