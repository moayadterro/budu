'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState, useTransition } from 'react'
import { normalizeSlug } from '@/entities/school-page'
import { Alert } from '@/shared/ui/alert'
import { Button } from '@/shared/ui/button'
import { ConfirmDialog } from '@/shared/ui/confirm-button'
import { Icon } from '@/shared/ui/icon'
import { cn } from '@/shared/lib/cn'
import { useT } from '@/shared/i18n'
import { changeSlugAction, checkSlugAction, type SlugCheck } from '../server/actions'

/**
 * The school page's address (Settings). Made from the school's name; changing it breaks every link
 * people saved or shared — so the form says so as soon as it differs, and asks before saving.
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

  return (
    <div className="flex flex-col gap-3">
      <div className="flex h-10 items-center overflow-hidden rounded-md border border-input bg-background focus-within:ring-3 focus-within:ring-ring/50" dir="ltr">
        <span className="flex h-full items-center border-e bg-muted px-3 text-sm whitespace-nowrap text-muted-foreground">{host}/schools/</span>
        <input
          value={slug}
          onChange={(ev) => {
            setResult(null)
            setSlug(ev.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))
          }}
          maxLength={40}
          aria-label={s.address}
          className="h-full min-w-0 flex-1 bg-transparent px-3 text-sm outline-none"
        />
      </div>
      <p className="text-xs text-muted-foreground">{e.addressHint}</p>
      {check && (
        <p className={cn('flex items-center gap-1.5 text-xs font-medium', check === 'ok' ? 'text-success' : 'text-destructive')} aria-live="polite">
          <Icon name={check === 'ok' ? 'tick' : 'close'} className="size-3.5" />
          {check === 'ok' ? e.available : e.slugErrors[check]}
        </p>
      )}
      {changed && check === 'ok' && <Alert variant="warning">{s.addressWarn}</Alert>}
      {result && result !== 'saved' && <Alert variant="destructive">{result === 'server' ? e.failed : e.slugErrors[result]}</Alert>}
      <div className="flex items-center gap-3">
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
        confirmLabel={s.addressConfirm(`${host}/schools/${value}`)}
        description={s.addressConfirmDesc}
        onConfirm={save}
      />
    </div>
  )
}
