'use client'

import Link from 'next/link'
import { fileUrl, LessonItemIcon, type LessonItem } from '@/entities/course'
import { Icon } from '@/shared/ui/icon'
import { ItemContent, ItemDescription, ItemMedia, ItemTitle } from '@/shared/ui/item'
import { LocalTime } from '@/shared/ui/local-time'
import { formatBytes } from '@/shared/lib/format'
import { useT } from '@/shared/i18n'

/** Media + text of a lesson material or task (goes inside an <Item>). */
export function LessonItemView({ item }: { item: LessonItem }) {
  const t = useT()
  const s = t.courses
  const [first] = item.files
  return (
    <>
      <ItemMedia>
        <LessonItemIcon kind={item.kind} mime={first?.mime} />
      </ItemMedia>
      <ItemContent className="min-w-0">
        <ItemTitle className="max-w-full truncate">{item.name}</ItemTitle>
        <ItemDescription>
          {s.kind[item.kind]}
          {(item.kind === 'video' || item.kind === 'file') && first && <> · {formatBytes(first.size)}</>}
          {item.kind === 'task' &&
            (item.dueAt ? (
              <>
                {' '}· {s.dueOn} <LocalTime seconds={item.dueAt} />
              </>
            ) : (
              <> · {s.noDue}</>
            ))}
        </ItemDescription>
        {item.kind === 'text' && item.content && (
          // a plain-text preview of the page (the HTML is cleaned by IOMAD; tags dropped here)
          <p className="line-clamp-2 text-sm text-muted-foreground">{item.content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()}</p>
        )}
        {item.kind === 'task' && item.instructions && (
          <p className="line-clamp-2 whitespace-pre-line text-sm text-muted-foreground">{item.instructions}</p>
        )}
        {(item.files.length > 0 || item.kind === 'task') && (
          <div className="flex flex-wrap gap-x-3 gap-y-1">
            {item.kind === 'task' && (
              <Link
                href={`/grading?homework=${item.id}`}
                className="inline-flex items-center gap-1 text-sm font-medium text-primary underline-offset-4 hover:underline"
              >
                <Icon name="check" className="size-3.5" />
                {t.grading.answer}
              </Link>
            )}
            {item.files.map((f) => (
              <a
                key={f.id}
                href={fileUrl(f)}
                target="_blank"
                rel="noopener"
                className="inline-flex items-center gap-1 text-sm font-medium text-primary underline-offset-4 hover:underline"
              >
                <Icon name="external" className="size-3.5" />
                {item.kind === 'task' ? f.name : s.open}
              </a>
            ))}
          </div>
        )}
      </ItemContent>
    </>
  )
}
