'use client'

import { useState } from 'react'
import Link from 'next/link'
import { buttonVariants } from '@/shared/ui/button'
import { PlayIcon } from '@/shared/ui/icon'
import { DATES, DAYS, Day, STUDENT, SUBJECTS, TIMES, TODAY, WEEK, isLive } from '@/shared/mock'
import { tint } from '@/shared/lib/color'
import { cn } from '@/shared/lib/cn'
import { useT } from '@/shared/i18n'

/** Mobile timetable: day strip + agenda for the selected day. */
export function TimetableDay() {
  const t = useT()
  const [sel, setSel] = useState<Day>(TODAY)
  const lessons = TIMES.map((time, row) => ({ time, row, key: WEEK[row][sel] })).filter((l) => l.key)

  return (
    <>
      <div className="mb-1.5 flex gap-1">
        {DAYS.map((day, i) => (
          <button
            key={day}
            onClick={() => setSel(day)}
            className="flex flex-1 flex-col items-center gap-[7px] pb-2 pt-1.5"
          >
            <span className={cn('text-[11px] font-bold uppercase tracking-[.03em]', day === TODAY ? 'text-primary' : 'text-muted-foreground')}>
              {t.timetable.dw[i]}
            </span>
            <span
              className={cn(
                'grid h-[38px] w-[38px] place-items-center rounded-full text-base font-bold tabular-nums',
                day === sel ? 'bg-primary text-primary-foreground' : day === TODAY ? 'text-primary' : 'text-foreground',
              )}
            >
              {DATES[day]}
            </span>
          </button>
        ))}
      </div>

      <div className="mx-0.5 mb-3.5 mt-3 border-b border-border pb-3 text-sm font-bold">
        {t.timetable.dayFull[DAYS.indexOf(sel)]} · {DATES[sel]} {t.timetable.month}
      </div>

      <div className="flex flex-col gap-3.5">
        {lessons.length === 0 && <div className="py-10 text-center text-[13px] text-muted-foreground">{t.timetable.noClasses}</div>}
        {lessons.map(({ time, row, key }) => {
          const s = SUBJECTS[key!]
          const live = isLive(row, sel)
          return (
            <div key={time} className="flex items-stretch gap-3">
              <div className="w-[46px] flex-none pt-3.5 text-end text-xs font-bold tabular-nums text-muted-foreground">{time}</div>
              <div
                className="flex min-w-0 flex-1 items-center gap-3 rounded-[14px] px-[15px] py-[13px]"
                style={{
                  background: tint(s.color, 11),
                  border: `1px solid ${tint(s.color, 22, 'var(--color-border)')}`,
                  borderInlineStart: `3px solid ${s.color}`,
                  boxShadow: live ? `0 0 0 2px ${tint(s.color, 32, 'transparent')}` : undefined,
                }}
              >
                <div className="min-w-0 flex-1">
                  <b className="block text-sm">{t.subject[key!]}</b>
                  <span className="text-xs text-muted-foreground">
                    {s.teacher} · {t.room} {STUDENT.className}
                  </span>
                </div>
                {live ? (
                  <Link href="/live" className={buttonVariants()}>
                    <PlayIcon />
                    {t.joinNow}
                  </Link>
                ) : (
                  <span className="whitespace-nowrap text-[11.5px] font-bold text-muted-foreground">60 {t.min}</span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </>
  )
}
