import { ReactNode } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card'
import { BrandMark } from './icon'
import { cn } from '@/shared/lib/cn'
import { t } from '@/shared/i18n'

/** Centered card used by every auth screen (sign in, register, reset …). */
export function AuthCard({ title, sub, children, wide }: { title: string; sub?: ReactNode; children: ReactNode; wide?: boolean }) {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-6 bg-muted p-6 md:p-10">
      <div className={cn('flex w-full flex-col gap-6', wide ? 'max-w-lg' : 'max-w-sm')}>
        <div className="flex items-center gap-2 self-center font-semibold">
          <BrandMark />
          {t.appName}
        </div>
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
