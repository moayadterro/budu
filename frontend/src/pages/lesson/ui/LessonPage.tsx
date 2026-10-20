import Link from 'next/link'
import { notFound } from 'next/navigation'
import { MarkComplete } from '@/features/mark-lesson-complete'
import { LESSON, LESSONS, isSubject } from '@/shared/mock'
import { Button, buttonVariants } from '@/shared/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { Icon, PlayIcon } from '@/shared/ui/icon'
import { cn } from '@/shared/lib/cn'
import { getT } from '@/shared/i18n/server'

/** Recorded lesson: video, description, materials, mark complete, course contents. */
export async function LessonPage({ params }: { params: Promise<{ subject: string }> }) {
  const t = await getT()
  const { subject } = await params
  if (!isSubject(subject)) notFound()
  return (
    <>
      <Link href={`/classes/${subject}`} className={buttonVariants({ variant: 'outline', className: 'mb-3.5' })}>
        <Icon name="back" strokeWidth={2} className="rtl:-scale-x-100" />
        {t.lesson.back}
      </Link>
      <div className="grid items-start gap-4 lg:grid-cols-[1.5fr_1fr]">
        <div className="flex min-w-0 flex-col gap-4">
          <div className="relative grid aspect-video place-items-center overflow-hidden rounded-2xl border border-border bg-brand shadow-xs">
            <button className="grid h-16 w-16 place-items-center rounded-full bg-primary-foreground text-primary shadow-lg transition-transform hover:scale-105">
              <PlayIcon className="ms-[3px] h-6 w-6" />
            </button>
            <span className="absolute bottom-3 start-3 rounded-md bg-live-scrim px-2 py-1 text-[11px] font-semibold tabular-nums text-primary-foreground">
              {LESSON.position}
            </span>
            <div className="absolute inset-x-0 bottom-0 h-1 bg-primary-foreground/20">
              <div className="h-full bg-highlight" style={{ width: `${LESSON.watched}%` }} />
            </div>
          </div>
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-primary">{LESSON.breadcrumb}</div>
            <h1 className="mt-1 text-xl font-bold">{LESSON.title}</h1>
            <div className="mt-1 text-[13px] text-muted-foreground">{LESSON.meta}</div>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>{t.lesson.about}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-[13px] leading-relaxed text-muted-foreground">{LESSON.description}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>{t.lesson.materials}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-2">
                {LESSON.materials.map((m) => (
                  <a key={m.name} className="flex cursor-pointer items-center gap-3 rounded-xl border border-border p-3 hover:bg-muted">
                    <span className="grid h-9 w-9 flex-none place-items-center rounded-lg text-primary-foreground" style={{ background: m.color }}>
                      <Icon name="file" className="h-[17px] w-[17px]" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <b className="block text-[13px]">{m.name}</b>
                      <span className="text-[11px] text-muted-foreground">{m.size}</span>
                    </span>
                    <Icon name="download" className="h-[18px] w-[18px] text-muted-foreground" />
                  </a>
                ))}
              </div>
            </CardContent>
          </Card>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline">{t.lesson.prev}</Button>
            <MarkComplete />
            <Button variant="outline" className="ms-auto">
              {t.lesson.next}
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{t.lesson.contents}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-1">
              {LESSONS.map((l) => {
                const current = l.state === 'progress'
                return (
                  <div key={l.title} className={cn('flex items-center gap-3 rounded-xl p-2.5', current && 'bg-primary/10')}>
                    <span
                      className={cn(
                        'grid h-6 w-6 flex-none place-items-center rounded-md',
                        l.state === 'done' && 'bg-success/10 text-success',
                        current && 'bg-primary text-primary-foreground',
                        l.state === 'live' && 'bg-destructive/10 text-destructive',
                      )}
                    >
                      {l.state === 'done' && <Icon name="tick" className="h-[13px] w-[13px]" strokeWidth={2.6} />}
                      {current && <PlayIcon className="h-3 w-3" />}
                      {l.state === 'live' && <Icon name="video" className="h-3 w-3" strokeWidth={2} />}
                    </span>
                    <span className={cn('min-w-0 flex-1 text-[13px]', current && 'font-semibold text-primary')}>{l.title}</span>
                    <span className={cn('text-[11px]', l.state === 'live' ? 'text-destructive' : current ? 'text-primary' : 'text-muted-foreground')}>
                      {l.state === 'live' ? t.lesson.liveShort : `${l.minutes}m`}
                    </span>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  )
}
