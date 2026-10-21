'use client'

import { useActionState } from 'react'
import { Alert } from '@/shared/ui/alert'
import { Field } from '@/shared/ui/field'
import { Input } from '@/shared/ui/input'
import { SubmitButton } from '@/shared/ui/submit-button'
import { useT } from '@/shared/i18n'
import { saveVisibilityAction, type VisibilityState } from '../server/actions'

const idle: VisibilityState = { status: 'idle' }

/** "Show our school on Budu's website" (off by default) + the city shown next to the name. */
export function SchoolVisibilityForm({ on, city }: { on: boolean; city: string }) {
  const t = useT()
  const s = t.school.visibility
  const [state, action] = useActionState(saveVisibilityAction, idle)
  return (
    <form action={action} className="flex max-w-md flex-col gap-4">
      {state.status === 'saved' && (
        <Alert key={state.at} variant="success">
          {s.saved}
        </Alert>
      )}
      {state.status === 'error' && <Alert variant="destructive">{s.failed}</Alert>}
      <label className="flex items-start gap-3 text-sm">
        <input type="checkbox" name="public" defaultChecked={on} className="mt-0.5 size-4 accent-primary" />
        <span>
          <span className="font-medium">{s.label}</span>
          <span className="block text-muted-foreground">{s.hint}</span>
        </span>
      </label>
      <Field label={s.city}>
        <Input name="city" defaultValue={city} maxLength={80} placeholder={s.cityPh} />
      </Field>
      <div>
        <SubmitButton variant="outline" label={s.save} pendingLabel={s.save} />
      </div>
    </form>
  )
}
