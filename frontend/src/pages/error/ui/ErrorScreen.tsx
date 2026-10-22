'use client'

import { useReportError } from '@/features/report-error'
import { Button } from '@/shared/ui/button'
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/shared/ui/empty'
import { Icon } from '@/shared/ui/icon'
import type { Messages } from '@/shared/i18n'

/**
 * "Something went wrong": our own calm words, never the technical message (that goes to the error
 * log and, in production, to the platform admin's email). Try again or go home.
 */
export function ErrorScreen({ t, error, reset }: { t: Messages; error: Error & { digest?: string }; reset: () => void }) {
  useReportError(error)
  return (
    <Empty className="min-h-[60vh]">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <Icon name="alert" />
        </EmptyMedia>
        <EmptyTitle>{t.errorPage.title}</EmptyTitle>
        <EmptyDescription>{t.errorPage.body}</EmptyDescription>
      </EmptyHeader>
      <EmptyContent className="flex-row justify-center gap-2">
        <Button onClick={reset}>{t.errorPage.retry}</Button>
        <Button variant="outline" asChild>
          <a href="/">{t.errorPage.home}</a>
        </Button>
      </EmptyContent>
    </Empty>
  )
}
