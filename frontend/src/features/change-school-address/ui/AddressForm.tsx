'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState, useTransition } from 'react'
import { normalizeSlug } from '@/entities/school-page'
import { Button } from '@/shared/ui/button'
import { ConfirmDialog } from '@/shared/ui/confirm-button'
import { Icon } from '@/shared/ui/icon'
import { cn } from '@/shared/lib/cn'
import { useT } from '@/shared/i18n'
import { changeSlugAction, checkSlugAction, type SlugCheck } from '../server/actions'

/**
 * The school's username (Settings) — its page lives at /schools/<username>. Made from the school's
 * name; changing it breaks every link people saved or shared, so a small line always says so and
 * saving asks first.
 */
export function AddressForm({ slug: current, origin }: { slug: string; origin: string }) {
  const t = useT()
  const s = t.school
  const e = t.schoolPage.editor
  const router = useRouter()
  const [slug, setSlug] = useState(current)
  const [check, setCheck] = useState<SlugCheck | null>(null)
  const [confirming, setConfirming] = useState(false)
  const [result, setResult] = useState<'saved' | SlugCheck | 'server' | null>(null)
  const [pending, start] = useTransition()
  const value = normalizeSlug(slug)
  const changed = value !== current

  // live "available?" while typing (after a short pause)
  useEffect(() => {
    if (!value || !changed) return setCheck(null)
    const id = setTimeout(() => start(async () => setCheck(await checkSlugAction(value))), 400)
    return () => clearTimeout(id)
  }, [value, changed])

  const host = origin.replace(/^https?:\/\//, '')
  const save = () =>
    start(async () => {
      const r = await changeSlugAction(value)
      setResult(r.ok ? 'saved' : r.error)
      if (r.ok) router.refresh()
    })
  const bad = changed && check !== null && check !== 'ok'

  return (
    <div className="flex flex-col gap-2.5">
      {/* the school's username, like @handle: the page lives at host/schools/<username> */}
      <div
        dir="ltr"
        className={cn(
          'flex h-11 items-center gap-1 rounded-xl border border-input bg-background ps-3.5 pe-2 transition-colors focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50',
          bad && 'border-destructive/60 focus-within:border-destructive/60 focus-within:ring-destructive/20',
        )}
      >
        <span className="text-base font-medium text-muted-foreground" aria-hidden>
          @
        </span>
        <input
          value={slug}
          onChange={(ev) => {
            setResult(null)
            setSlug(ev.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))
          }}
          maxLength={40}
          aria-label={s.address}
          aria-invalid={bad || undefined}
          spellCheck={false}
          autoCapitalize="off"
          className="h-full min-w-0 flex-1 bg-transparent text-base font-medium outline-none"
        />
        {changed && check === 'ok' && (
          <span className="grid size-6 place-items-center rounded-full bg-success/15 text-success" aria-label={e.available} title={e.available}>
            <Icon name="tick" className="size-3.5" />
          </span>
        )}
        {bad && <Icon name="close" className="size-4 text-destructive" />}
      </div>
      {/* the saved address opens the page; a new one being typed is only a preview (no page there yet) */}
      {changed ? (
        <p dir="ltr" className="truncate text-xs text-muted-foreground">
          {host}/schools/<span className="font-medium text-foreground">{value || '…'}</span>
        </p>
      ) : (
        <a
          href={`/schools/${current}`}
          target="_blank"
          rel="noopener"
          dir="ltr"
          className="group flex w-fit max-w-full items-center gap-1 truncate text-xs text-muted-foreground transition-colors hover:text-primary"
        >
          <span className="truncate">
            {host}/schools/<span className="font-medium text-foreground group-hover:text-primary">{current}</span>
          </span>
          <Icon name="external" className="size-3 flex-none" />
        </a>
      )}
      {bad && (
        <p className="text-xs font-medium text-destructive" aria-live="polite">
          {e.slugErrors[check!]}
        </p>
      )}
      {result && result !== 'saved' && <p className="text-xs font-medium text-destructive">{result === 'server' ? e.failed : e.slugErrors[result]}</p>}
      <div className="flex items-center gap-2.5 rounded-xl bg-warning/10 p-2 pe-3">
        <span className="grid size-7 flex-none place-items-center rounded-lg bg-warning/15 text-warning" aria-hidden>
          <Icon name="alert" className="size-4" />
        </span>
        <p className="text-xs leading-relaxed text-foreground/80">{s.addressWarn}</p>
      </div>
      <div className="mt-1 flex items-center gap-3">
        <Button type="button" disabled={!changed || check !== 'ok' || pending} onClick={() => setConfirming(true)}>
          {s.addressChange}
        </Button>
        {result === 'saved' && !changed && <span className="text-sm text-success">{s.saved}</span>}
      </div>
      <ConfirmDialog
        open={confirming}
        onOpenChange={setConfirming}
        icon="link"
        label={s.addressChange}
        confirmLabel={s.addressConfirm(value)}
        description={s.addressConfirmDesc}
        onConfirm={save}
      />
    </div>
  )
}
