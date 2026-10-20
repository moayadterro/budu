'use client'

import Link from 'next/link'
import { useState } from 'react'
import { HomeworkRow } from '@/entities/homework'
import { LessonRow } from '@/entities/lesson'
import { SubjectTile } from '@/entities/subject'
import { InitialsAvatar as Avatar } from '@/shared/ui/initials-avatar'
import { Badge } from '@/shared/ui/badge'
import { buttonVariants } from '@/shared/ui/button'
import { Card, CardContent } from '@/shared/ui/card'
import { PlayIcon } from '@/shared/ui/icon'
import { Tabs, TabsList, TabsTrigger } from '@/shared/ui/tabs'
import { CLASS_HOMEWORK, CLASSMATES, HUB, LESSONS, SUBJECTS, SubjectKey } from '@/shared/mock'
import { useT } from '@/shared/i18n'

type Tab = 'lessons' | 'homework' | 'classmates'

/** A subject's class: header, next live lesson, and lessons / homework / classmates tabs. */
export function ClassHub({ subject }: { subject: SubjectKey }) {
  const t = useT()
  const [tab, setTab] = useState<Tab>('lessons')
  const s = SUBJECTS[subject]
  const base = `/classes/${subject}`

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-3.5">
        <SubjectTile subject={subject} className="h-[54px] w-[54px] rounded-[14px]" />
        <div className="min-w-0 flex-1">
          <div className="text-xs text-muted-foreground">{t.hub.breadcrumb}</div>
          <h1 className="text-[21px] font-bold">{t.subject[subject]}</h1>
          <div className="text-xs text-muted-foreground">
            {t.withTeacher} {s.teacher} · {HUB.students} {t.hub.students}
          </div>
        </div>
      </div>

      <div className="mb-4 rounded-xl bg-brand p-4 text-primary-foreground shadow-xs">
        <div className="flex items-center gap-2 text-xs font-bold opacity-90">
          <span className="dot-live bg-primary-foreground text-primary-foreground" />
          {t.hub.nextLive}
        </div>
        <h3 className="mt-2.5 text-[17px] font-bold">{HUB.liveTitle}</h3>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <Link href="/live" className={buttonVariants({ variant: 'highlight' })}>
            <PlayIcon />
            {t.joinNow}
          </Link>
          <span className="rounded-[10px] bg-primary-foreground/15 px-3 py-[9px] text-sm font-bold tabular-nums">⏱ 12:00</span>
        </div>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)} className="mb-4">
        <TabsList>
          {(['lessons', 'homework', 'classmates'] as const).map((id) => (
            <TabsTrigger key={id} value={id}>
              {t.hub.tabs[id]}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {tab === 'lessons' && (
        <Card className="py-2">
          <CardContent className="divide-y px-4">
          {LESSONS.map((l) =>
            l.state === 'live' ? (
              <Link key={l.title} href="/live" className="block">
                <LessonRow {...l} />
              </Link>
            ) : (
              <Link key={l.title} href={`${base}/lesson`} className="block">
                <LessonRow {...l} />
              </Link>
            ),
          )}
          </CardContent>
        </Card>
      )}

      {tab === 'homework' && (
        <Card className="py-2">
          <CardContent className="divide-y px-4">
          {CLASS_HOMEWORK.map((hw) => (
            <Link key={hw.title} href={`${base}/homework`} className="block">
              <HomeworkRow
                title={hw.title}
                meta={hw.meta}
                tone={hw.graded ? 'done' : 'urgent'}
                icon={hw.graded ? 'tick' : 'doc'}
                end={
                  hw.graded ? (
                    <Badge variant="success">{t.hub.graded}</Badge>
                  ) : (
                    <span className={buttonVariants({ variant: 'outline', size: 'sm' })}>{t.hub.submit}</span>
                  )
                }
              />
            </Link>
          ))}
          </CardContent>
        </Card>
      )}

      {tab === 'classmates' && (
        <Card>
          <CardContent className="flex-row flex-wrap gap-2">
          {CLASSMATES.map((m) => (
            <span
              key={m.name}
              className="flex items-center gap-2 rounded-full border border-border bg-muted py-[5px] pe-[11px] ps-[5px] text-xs font-semibold"
            >
              <Avatar initials={m.initials} color={m.color} className="h-[26px] w-[26px] rounded-full text-[10px]" />
              {m.name}
            </span>
          ))}
          </CardContent>
        </Card>
      )}
    </>
  )
}
