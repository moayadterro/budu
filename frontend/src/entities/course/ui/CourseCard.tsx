'use client'

import { ReactNode } from 'react'
import { InitialsAvatar as Avatar } from '@/shared/ui/initials-avatar'
import { Badge } from '@/shared/ui/badge'
import { Card } from '@/shared/ui/card'
import { Icon, StarIcon } from '@/shared/ui/icon'
import { CATALOG, SUBJECTS } from '@/shared/mock'
import { tint } from '@/shared/lib/color'
import { useT } from '@/shared/i18n'

type Course = (typeof CATALOG)[number]

export const formatPrice = (price: number, free: string) => (price ? `$${price}` : free)

/** Marketplace course card; `actions` slot holds buy/enrol/ask buttons. */
export function CourseCard({ course, actions }: { course: Course; actions?: ReactNode }) {
  const t = useT()
  const color = SUBJECTS[course.subject].color
  return (
    <Card className="gap-0 overflow-hidden py-0">
      <div
        className="flex h-24 items-start justify-between p-3"
        style={{ background: `linear-gradient(135deg, ${color}, ${tint(color, 70, 'var(--color-foreground)')})` }}
      >
        <Badge className="bg-primary-foreground/15 text-primary-foreground">
          {course.mode === 'live' && <span className="dot-live bg-primary-foreground text-primary-foreground" />}
          {t.explore.mode[course.mode]}
        </Badge>
        <Icon name={course.icon} className="h-7 w-7 text-primary-foreground opacity-80" strokeWidth={1.6} />
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="font-medium leading-tight">{course.title}</h3>
        <div className="flex items-center gap-[7px] truncate text-xs text-muted-foreground">
          <Avatar initials={course.initials} color={color} className="h-5 w-5 rounded-full text-[9px]" />
          {course.by}
        </div>
        <div className="mt-auto flex flex-col gap-3 pt-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-base font-semibold">{formatPrice(course.price, t.explore.free)}</span>
            <span className="inline-flex items-center gap-[3px] text-xs font-bold text-muted-foreground">
              <StarIcon className="h-[13px] w-[13px] text-highlight" />
              {course.rating}
            </span>
          </div>
          {actions}
        </div>
      </div>
    </Card>
  )
}
