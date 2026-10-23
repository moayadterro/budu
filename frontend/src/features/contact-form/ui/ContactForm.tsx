'use client'

import { useActionState, useState } from 'react'
import { cn } from '@/shared/lib/cn'
import { Alert } from '@/shared/ui/alert'
import { Button } from '@/shared/ui/button'
import { Icon, type IconName } from '@/shared/ui/icon'
import { Appear } from '@/shared/ui/motion'
import { useFormStatus } from 'react-dom'
import { useT } from '@/shared/i18n'
import { CONTACT_TOPICS, type ContactTopic } from '../model/topics'
import { sendContactAction, type ContactState } from '../server/actions'

const idle: ContactState = { status: 'idle' }
const MAX = 4000

const TOPIC_ICON: Record<ContactTopic, IconName> = {
  general: 'chat',
  school: 'school',
  support: 'headset',
  billing: 'wallet',
  partnership: 'handshake',
}

/** Soft filled fields (like the catalog search): no border, a light fill, a ring when focused. */
const field =
  'w-full rounded-xl bg-foreground/5 px-4 text-base outline-none transition-colors placeholder:text-muted-foreground/70 focus-visible:bg-background focus-visible:ring-3 focus-visible:ring-ring/30 sm:text-sm'

/**
 * Name, email, topic, message → Budu's team. The topic is a row of chips with icons (one tap, no
 * dropdown); the message counts its characters; a sent message turns into a calm "sent" state.
 * `topic` preselects e.g. "school" (from Pricing).
 */
export function ContactForm({ topic = 'general' }: { topic?: ContactTopic }) {
  // a new key = a fresh, empty form ("Write another message")
  const [round, setRound] = useState(0)
  return <Form key={round} topic={topic} again={() => setRound((r) => r + 1)} />
}

function Form({ topic, again }: { topic: ContactTopic; again: () => void }) {
  const t = useT()
  const s = t.site.contact
  const [state, action] = useActionState(sendContactAction, idle)
  const [chosen, setChosen] = useState<ContactTopic>(topic)
  const [length, setLength] = useState(0)

  if (state.status === 'sent') {
    return (
      <Appear className="flex flex-col items-center gap-4 py-10 text-center">
        <span className="grid size-16 place-items-center rounded-2xl bg-linear-to-b from-success/70 to-success text-primary-foreground dark:text-success-foreground">
          <Icon name="tick" strokeWidth={2.4} className="size-8" />
        </span>
        <div className="flex flex-col gap-1">
          <h3 className="text-xl font-semibold">{s.sentTitle}</h3>
          <p className="text-muted-foreground">{s.sent}</p>
        </div>
        <Button variant="ghost" className="rounded-xl bg-foreground/5 hover:bg-foreground/8" onClick={again}>
          {s.sendAnother}
        </Button>
      </Appear>
    )
  }

  return (
    <form action={action} className="flex flex-col gap-6">
      {state.status === 'error' && <Alert variant="destructive">{s.errors[state.error]}</Alert>}
      {/* bots fill every field; people never see this one */}
      <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />

      <fieldset className="flex flex-col gap-2.5">
        <legend className="mb-2.5 text-sm font-medium">{s.topic}</legend>
        <div className="flex flex-wrap gap-2">
          {CONTACT_TOPICS.map((k) => (
            <label
              key={k}
              className={cn(
                'flex h-10 cursor-pointer items-center gap-2 rounded-xl px-3.5 text-sm font-medium transition-colors has-focus-visible:ring-3 has-focus-visible:ring-ring/40',
                chosen === k
                  ? 'bg-primary/10 text-primary dark:bg-success/15 dark:text-success'
                  : 'bg-foreground/5 text-muted-foreground hover:bg-foreground/8 hover:text-foreground',
              )}
            >
              <input type="radio" name="topic" value={k} checked={chosen === k} onChange={() => setChosen(k)} className="sr-only" />
              <Icon name={TOPIC_ICON[k]} className="size-4" />
              {s.topics[k]}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="grid gap-6 sm:grid-cols-2">
        <label className="flex flex-col gap-2">
          <span className="text-sm font-medium">{s.name}</span>
          <input name="name" required maxLength={100} autoComplete="name" placeholder={s.namePh} className={cn(field, 'h-12')} />
        </label>
        <label className="flex flex-col gap-2">
          <span className="text-sm font-medium">{s.email}</span>
          <input name="email" type="email" required maxLength={200} autoComplete="email" placeholder={s.emailPh} dir="ltr" className={cn(field, 'h-12 rtl:text-end')} />
        </label>
      </div>

      <label className="flex flex-col gap-2">
        <span className="text-sm font-medium">{s.message}</span>
        <span className="relative">
          <textarea
            name="message"
            required
            minLength={10}
            maxLength={MAX}
            rows={6}
            placeholder={s.messagePh}
            onChange={(e) => setLength(e.target.value.length)}
            className={cn(field, 'block min-h-40 resize-y py-3 pb-8')}
          />
          {/* live count, only once typing starts */}
          {length > 0 && (
            <span className={cn('pointer-events-none absolute end-3 bottom-2.5 text-xs tabular-nums', length > MAX * 0.9 ? 'text-warning' : 'text-muted-foreground')}>
              {length} / {MAX}
            </span>
          )}
        </span>
      </label>

      <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">{s.formSub}</p>
        <Send label={s.send} pending={s.sending} />
      </div>
    </form>
  )
}

/** The one green action: a paper plane that lifts off on hover (mirrored in Arabic). */
function Send({ label, pending }: { label: string; pending: string }) {
  const { pending: busy } = useFormStatus()
  return (
    <Button type="submit" size="lg" disabled={busy} className="group h-12 w-full gap-2 rounded-xl px-6 sm:w-auto">
      {busy ? pending : label}
      <Icon
        name={busy ? 'loading' : 'send'}
        className={cn('size-4 transition-transform duration-200 rtl:-scale-x-100', busy ? 'animate-spin' : 'group-hover:-translate-y-0.5 group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5')}
      />
    </Button>
  )
}
