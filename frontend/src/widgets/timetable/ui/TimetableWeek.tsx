import Link from 'next/link'
import { Card } from '@/shared/ui/card'
import { PlayIcon } from '@/shared/ui/icon'
import { DATES, DAYS, SUBJECTS, TIMES, TODAY, WEEK, isLive } from '@/shared/mock'
import { tint } from '@/shared/lib/color'
import { cn } from '@/shared/lib/cn'
import { t } from '@/shared/i18n'

/** Desktop week grid. */
export function TimetableWeek({ className }: { className?: string }) {
  return (
    <Card className={cn('px-6', className)}>
      <div className="overflow-x-auto">
        <div className="grid min-w-[650px] grid-cols-[54px_repeat(5,minmax(118px,1fr))] gap-2">
          <div />
          {DAYS.map((day, i) => (
            <div
              key={day}
              className={cn(
                'flex flex-col gap-0.5 px-1 py-2 text-center text-[11px] font-bold',
                day === TODAY ? 'text-primary' : 'text-muted-foreground',
              )}
            >
              <span>{t.timetable.dw[i]}</span>
              <span
                className={cn(
                  'mx-auto h-[30px] w-[30px] rounded-full text-base font-extrabold leading-[30px]',
                  day === TODAY ? 'bg-primary text-primary-foreground' : 'text-foreground',
                )}
              >
                {DATES[day]}
              </span>
            </div>
          ))}
          {TIMES.map((time, row) => (
            <Row key={time} time={time} row={row} />
          ))}
        </div>
      </div>
    </Card>
  )
}

function Row({ time, row }: { time: string; row: number }) {
  return (
    <>
      <div className="flex items-start justify-end pe-1 pt-1 text-[11px] font-bold tabular-nums text-muted-foreground">{time}</div>
      {DAYS.map((day) => {
        const key = WEEK[row][day]
        if (!key) return <div key={day} className="min-h-[66px] rounded-xl border border-dashed border-border" />
        const s = SUBJECTS[key]
        const live = isLive(row, day)
        return (
          <div
            key={day}
            className="min-h-[66px] rounded-xl px-2.5 py-[9px]"
            style={{
              background: tint(s.color, 11),
              border: `1px solid ${tint(s.color, 24, 'var(--color-border)')}`,
              borderInlineStart: `3px solid ${s.color}`,
              boxShadow: live ? `0 0 0 2px ${tint(s.color, 35, 'transparent')}` : undefined,
            }}
          >
            <div className="text-[12.5px] font-bold">{t.subject[key]}</div>
            <div className="mt-[3px] text-[10.5px] text-muted-foreground">
              {s.initials}
              {live && ` · ${t.timetable.liveShort}`}
            </div>
            {live && (
              <Link
                href="/live"
                className="mt-2 inline-flex items-center gap-[5px] rounded-[7px] px-2 py-1 text-[10.5px] font-bold text-primary-foreground"
                style={{ background: s.color }}
              >
                <PlayIcon className="h-[11px] w-[11px]" />
                {t.joinNow}
              </Link>
            )}
          </div>
        )
      })}
    </>
  )
}
