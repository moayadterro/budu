'use client'

import Link from 'next/link'
import { useActionState, useEffect, useState, useTransition } from 'react'
import { normalizeSlug, PAGE_LIMITS, type SchoolPage } from '@/entities/school-page'
import { Alert } from '@/shared/ui/alert'
import { Button } from '@/shared/ui/button'
import { Field } from '@/shared/ui/field'
import { Icon } from '@/shared/ui/icon'
import { Input } from '@/shared/ui/input'
import { SubmitButton } from '@/shared/ui/submit-button'
import { cn } from '@/shared/lib/cn'
import { useT } from '@/shared/i18n'
import { checkSlugAction, savePageAction, type PageState, type SlugCheck } from '../server/actions'

const idle: PageState = { status: 'idle' }

/** The page's address (checked live), Published, tagline — and a link to open it. */
export function PageSettings({ page, origin }: { page: SchoolPage; origin: string }) {
  const t = useT()
  const s = t.schoolPage.editor
  const [state, action] = useActionState(savePageAction, idle)
  const [slug, setSlug] = useState(page.slug ?? '')
  const [check, setCheck] = useState<SlugCheck | null>(null)
  const [published, setPublished] = useState(page.published)
  const [, start] = useTransition()

  // live "available?" while typing (after a short pause)
  useEffect(() => {
    const v = normalizeSlug(slug)
    if (!v || v === page.slug) return setCheck(null)
    const id = setTimeout(() => start(async () => setCheck(await checkSlugAction(v))), 400)
    return () => clearTimeout(id)
  }, [slug, page.slug])

  const host = origin.replace(/^https?:\/\//, '')
  return (
    <form action={action} className="flex flex-col">
      {state.status === 'saved' && (
        <Alert key={state.at} variant="success" className="mb-4">
          {s.saved}
        </Alert>
      )}
      {state.status === 'error' && (
        <Alert key={state.at} variant="destructive" className="mb-4">
          {s.slugErrors[state.error]}
        </Alert>
      )}

      <Field label={s.address} hint={s.addressHint}>
        <div className="flex h-10 items-center overflow-hidden rounded-md border border-input bg-background focus-within:ring-3 focus-within:ring-ring/50" dir="ltr">
          <span className="flex h-full items-center border-e bg-muted px-3 text-sm whitespace-nowrap text-muted-foreground">{host}/schools/</span>
          <input
            name="slug"
            value={slug}
            onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
            maxLength={40}
            placeholder="my-school"
            aria-label={s.address}
            className="h-full min-w-0 flex-1 bg-transparent px-3 text-sm outline-none"
          />
        </div>
      </Field>
      {check && (
        <p className={cn('-mt-2 mb-4 flex items-center gap-1.5 text-xs font-medium', check === 'ok' ? 'text-success' : 'text-destructive')} aria-live="polite">
          <Icon name={check === 'ok' ? 'tick' : 'close'} className="size-3.5" />
          {check === 'ok' ? s.available : s.slugErrors[check]}
        </p>
      )}

      <Field label={s.tagline}>
        <Input name="tagline" defaultValue={page.tagline} maxLength={PAGE_LIMITS.tagline} placeholder={s.taglinePh} />
      </Field>

      <label className={cn('mb-5 flex items-start gap-3 rounded-lg border p-3 text-sm', !slug && 'opacity-60')}>
        <input
          type="checkbox"
          name="published"
          checked={published && !!slug}
          disabled={!slug}
          onChange={(e) => setPublished(e.target.checked)}
          className="mt-0.5 size-4 accent-primary"
        />
        <span>
          <span className="font-medium">{s.published}</span>
          <span className="block text-muted-foreground">{published && slug ? s.publishedOn : s.publishedOff}</span>
        </span>
      </label>

      <div className="flex flex-wrap gap-2">
        <SubmitButton label={s.save} pendingLabel={s.saving} />
        {page.slug && (
          <Button variant="outline" asChild>
            <Link href={`/schools/${page.slug}`} target="_blank">
              <Icon name="external" />
              {s.open}
            </Link>
          </Button>
        )}
      </div>
    </form>
  )
}
