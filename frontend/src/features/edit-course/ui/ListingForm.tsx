'use client'

import { useActionState, useState } from 'react'
import { CURRENCIES, type Currency } from '@/shared/config/currency'
import { COURSE_LANGUAGES, languageName } from '@/shared/config/course-language'
import { currencyName } from '@/shared/lib/money'
import { Alert } from '@/shared/ui/alert'
import { Field } from '@/shared/ui/field'
import { Input } from '@/shared/ui/input'
import { NativeSelect, NativeSelectOption } from '@/shared/ui/native-select'
import { SubmitButton } from '@/shared/ui/submit-button'
import { useLocale, useT } from '@/shared/i18n'
import { saveListingAction, type ListingState } from '../server/actions'

const idle: ListingState = { status: 'idle' }

/** Teacher: show the course in Explore, with a price in their currency (empty / 0 = free). */
export function ListingForm({
  courseId,
  published,
  listing,
}: {
  courseId: number
  published: boolean
  listing: { listed: boolean; price: number; currency: Currency; language: string | null }
}) {
  const t = useT()
  const locale = useLocale()
  const s = t.market
  const [state, action] = useActionState(saveListingAction, idle)
  const [listed, setListed] = useState(listing.listed)
  return (
    <form action={action} className="flex flex-col">
      <input type="hidden" name="courseId" value={courseId} />
      {state.status === 'saved' && (
        <Alert key={state.at} variant="success" className="mb-3">
          {s.saved}
        </Alert>
      )}
      {state.status === 'error' && (
        <Alert key={state.at} variant="destructive" className="mb-3">
          {s.invalid}
        </Alert>
      )}
      <label className="mb-3 flex items-center gap-2 text-sm font-medium">
        <input type="checkbox" name="listed" checked={listed} onChange={(e) => setListed(e.target.checked)} className="size-4 accent-primary" />
        {s.listed}
      </label>
      {listed && !published && <p className="mb-3 text-xs text-warning">{s.needsPublish}</p>}
      {/* price + currency on one line (same label and control heights); the hint goes under both */}
      <div className="grid grid-cols-[1fr_auto] items-start gap-x-2 [&>div]:mb-0">
        <Field label={s.price}>
          <Input name="price" type="number" inputMode="decimal" min={0} step="0.01" defaultValue={listing.price || ''} placeholder="0" />
        </Field>
        <Field label={s.currency}>
          <NativeSelect name="currency" defaultValue={listing.currency} aria-label={s.currency}>
            {CURRENCIES.map((c) => (
              <NativeSelectOption key={c} value={c} title={currencyName(c, locale)}>
                {c}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </Field>
      </div>
      <p className="mt-2 mb-4 text-xs text-muted-foreground">{s.freeHint}</p>
      <Field label={s.language} hint={s.languageHint}>
        <NativeSelect name="language" defaultValue={listing.language ?? ''} aria-label={s.language}>
          <NativeSelectOption value="">{s.languageNone}</NativeSelectOption>
          {COURSE_LANGUAGES.map((l) => (
            <NativeSelectOption key={l} value={l}>
              {languageName(l, locale)}
            </NativeSelectOption>
          ))}
        </NativeSelect>
      </Field>
      <SubmitButton variant="outline" label={s.save} pendingLabel={s.save} />
    </form>
  )
}
