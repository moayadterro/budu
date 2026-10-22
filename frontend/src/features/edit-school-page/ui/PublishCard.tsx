'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { Button } from '@/shared/ui/button'
import { Icon } from '@/shared/ui/icon'
import { cn } from '@/shared/lib/cn'
import { useT } from '@/shared/i18n'
import { setPublishedAction } from '../server/actions'

/**
 * Where the page lives and whether it is on the internet. The address is made from the school's
 * name (changed in Settings); Publish is one click — the page exists to be public, so no alert,
 * just one quiet line saying what publishing means.
 */
export function PublishCard({ slug, published, origin }: { slug: string; published: boolean; origin: string }) {
  const t = useT()
  const s = t.schoolPage.editor
  const router = useRouter()
  const [live, setLive] = useState(published)
  const [copied, setCopied] = useState(false)
  const [pending, start] = useTransition()
  const path = `/schools/${slug}`
  const shown = `${origin.replace(/^https?:\/\//, '')}${path}`

  const toggle = (next: boolean) =>
    start(async () => {
      setLive(next)
      await setPublishedAction(next)
      router.refresh()
    })
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(`${origin}${path}`)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      /* clipboard blocked — the address is visible anyway */
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="flex items-center gap-2 text-sm font-medium">
        <span className={cn('size-2 rounded-full', live ? 'bg-success' : 'bg-muted-foreground/40')} aria-hidden />
        {live ? s.live : s.notLive}
      </p>

      <div className="flex items-center gap-1 rounded-xl bg-muted/60 p-1 ps-3" dir="ltr">
        <Icon name="globe" className="size-4 flex-none text-muted-foreground" />
        <span className="min-w-0 flex-1 truncate text-sm">{shown}</span>
        <Button type="button" variant="ghost" size="icon-sm" onClick={copy} aria-label={s.copyLink} title={copied ? s.copied : s.copyLink}>
          <Icon name={copied ? 'tick' : 'copy'} className={cn(copied && 'text-success')} />
        </Button>
        <Button variant="ghost" size="icon-sm" asChild>
          <a href={path} target="_blank" rel="noopener" aria-label={s.open} title={s.open}>
            <Icon name="external" />
          </a>
        </Button>
      </div>

      {live ? (
        <Button type="button" variant="ghost" size="sm" className="self-start text-muted-foreground" disabled={pending} onClick={() => toggle(false)}>
          {s.unpublish}
        </Button>
      ) : (
        <div className="flex flex-col gap-2">
          <Button type="button" className="w-full" disabled={pending} onClick={() => toggle(true)}>
            <Icon name="web" />
            {s.publish}
          </Button>
          <p className="text-xs text-muted-foreground">{s.publishNote}</p>
        </div>
      )}

      <a href="/school/settings#address" className="w-fit text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">
        {s.changeAddress}
      </a>
    </div>
  )
}
