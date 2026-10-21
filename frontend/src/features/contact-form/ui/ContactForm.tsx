'use client'

import { useActionState } from 'react'
import { Alert } from '@/shared/ui/alert'
import { Field } from '@/shared/ui/field'
import { Input } from '@/shared/ui/input'
import { NativeSelect, NativeSelectOption } from '@/shared/ui/native-select'
import { SubmitButton } from '@/shared/ui/submit-button'
import { Textarea } from '@/shared/ui/textarea'
import { useT } from '@/shared/i18n'
import { CONTACT_TOPICS, type ContactTopic } from '../model/topics'
import { sendContactAction, type ContactState } from '../server/actions'

const idle: ContactState = { status: 'idle' }

/** Name, email, topic, message → Budu's team. `topic` preselects e.g. "school" (from Pricing). */
export function ContactForm({ topic = 'general' }: { topic?: ContactTopic }) {
  const t = useT()
  const s = t.site.contact
  const [state, action] = useActionState(sendContactAction, idle)
  if (state.status === 'sent') return <Alert variant="success">{s.sent}</Alert>
  return (
    <form action={action} className="flex flex-col">
      {state.status === 'error' && (
        <Alert variant="destructive" className="mb-4">
          {s.errors[state.error]}
        </Alert>
      )}
      {/* bots fill every field; people never see this one */}
      <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
      <div className="grid gap-x-3 sm:grid-cols-2">
        <Field label={s.name}>
          <Input name="name" required maxLength={100} autoComplete="name" />
        </Field>
        <Field label={s.email}>
          <Input name="email" type="email" required maxLength={200} autoComplete="email" />
        </Field>
      </div>
      <Field label={s.topic}>
        <NativeSelect name="topic" defaultValue={topic} className="w-full">
          {CONTACT_TOPICS.map((k) => (
            <NativeSelectOption key={k} value={k}>
              {s.topics[k]}
            </NativeSelectOption>
          ))}
        </NativeSelect>
      </Field>
      <Field label={s.message}>
        <Textarea name="message" required minLength={10} maxLength={4000} rows={6} placeholder={s.messagePh} />
      </Field>
      <div>
        <SubmitButton label={s.send} pendingLabel={s.sending} />
      </div>
    </form>
  )
}
