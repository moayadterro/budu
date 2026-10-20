import Link from 'next/link'
import { notFound } from 'next/navigation'
import { SubmitHomework } from '@/features/submit-homework'
import { ASSIGNMENT, isSubject } from '@/shared/mock'
import { Badge } from '@/shared/ui/badge'
import { buttonVariants } from '@/shared/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { Icon } from '@/shared/ui/icon'
import { getT } from '@/shared/i18n/server'

/** Homework: instructions + attachment, then the student's submission. */
export async function HomeworkPage({ params }: { params: Promise<{ subject: string }> }) {
  const t = await getT()
  const { subject } = await params
  if (!isSubject(subject)) notFound()
  return (
    <>
      <Link href={`/classes/${subject}`} className={buttonVariants({ variant: 'outline', className: 'mb-3.5' })}>
        <Icon name="back" strokeWidth={2} className="rtl:-scale-x-100" />
        {t.homework.back}
      </Link>
      <div className="flex max-w-[680px] flex-col gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="warning">{ASSIGNMENT.due}</Badge>
            <span className="text-xs text-muted-foreground">{ASSIGNMENT.course}</span>
          </div>
          <h1 className="mt-2 text-xl font-bold">{ASSIGNMENT.title}</h1>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>{t.homework.instructions}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-[13px] leading-relaxed text-muted-foreground">{ASSIGNMENT.instructions}</p>
            <a className="mt-3 flex cursor-pointer items-center gap-3 rounded-xl border border-border p-3 hover:bg-muted">
              <span className="grid h-9 w-9 flex-none place-items-center rounded-lg bg-destructive text-primary-foreground">
                <Icon name="file" className="h-[17px] w-[17px]" />
              </span>
              <span className="min-w-0 flex-1">
                <b className="block text-[13px]">{ASSIGNMENT.file.name}</b>
                <span className="text-[11px] text-muted-foreground">{ASSIGNMENT.file.size}</span>
              </span>
              <Icon name="download" className="h-[18px] w-[18px] text-muted-foreground" />
            </a>
          </CardContent>
        </Card>
        <SubmitHomework />
      </div>
    </>
  )
}
