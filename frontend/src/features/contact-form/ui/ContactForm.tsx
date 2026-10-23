'use client'

import { useActionState, useState } from 'react'
import { cn } from '@/shared/lib/cn'
import { Alert } from '@/shared/ui/alert'
import { Button } from '@/shared/ui/button'
import { Icon, type IconName } from '@/shared/ui/icon'
import { motion, useReducedMotion } from 'motion/react'
import { useT } from '@/shared/i18n'
import { CONTACT_TOPICS, type ContactTopic } from '../model/topics'
import { sendContactAction, type ContactState } from '../server/actions'

const idle: ContactState = { status: 'idle' }
const MAX = 4000
/** sending is shown for at least this long, so it never just flickers (owner: "it doesn't show loading") */
const MIN_SENDING_MS = 700

const send = async (prev: ContactState, form: FormData) => {
  const [result] = await Promise.all([sendContactAction(prev, form), new Promise((r) => setTimeout(r, MIN_SENDING_MS))])
  return result
}

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
 * dropdown); the message counts its characters. Sending: the form fades and locks, the button spins
 * (at least MIN_SENDING_MS); then it turns into the "sent" state: a green circle springs in, the
 * tick draws itself, the text fades up (no motion when reduced motion is on).
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
  const [state, action, pending] = useActionState(send, idle)
  const reduce = useReducedMotion()
  const [chosen, setChosen] = useState<ContactTopic>(topic)
  const [length, setLength] = useState(0)

  if (state.status === 'sent') {
    const ease = [0.22, 1, 0.36, 1] as const
    return (
      <div className="flex flex-col items-center gap-5 py-12 text-center">
        <motion.span
          initial={reduce ? false : { scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 260, damping: 18 }}
          className="grid size-20 place-items-center rounded-full bg-linear-to-b from-success/75 to-success text-primary-foreground dark:text-success-foreground"
        >
          <svg viewBox="0 0 24 24" aria-hidden className="size-10">
            <motion.path
              d="M5 12.5l4.5 4.5L19 7.5"
              fill="none"
              stroke="currentColor"
              strokeWidth={2.6}
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={reduce ? false : { pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ delay: 0.25, duration: 0.45, ease }}
            />
          </svg>
        </motion.span>
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45, duration: 0.4, ease }}
          className="flex flex-col items-center gap-5"
        >
          <div className="flex flex-col gap-1.5">
            <h3 className="text-2xl font-semibold tracking-tight">{s.sentTitle}</h3>
            <p className="text-muted-foreground">{s.sent}</p>
          </div>
          <Button variant="ghost" className="h-11 rounded-xl bg-foreground/5 px-5 hover:bg-foreground/8" onClick={again}>
            {s.sendAnother}
          </Button>
        </motion.div>
      </div>
    )
  }

  return (
    <form action={action} aria-busy={pending} className="flex flex-col gap-6">
      {state.status === 'error' && <Alert variant="destructive">{s.errors[state.error]}</Alert>}
      {/* bots fill every field; people never see this one */}
      <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />

      {/* while sending: everything fades and locks (no double sends); the button shows the spinner */}
      <fieldset disabled={pending} className={cn('flex min-w-0 flex-col gap-6 transition-opacity duration-200', pending && 'opacity-50')}>
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

      </fieldset>

      <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">{s.formSub}</p>
        <Send label={s.send} pendingLabel={s.sending} busy={pending} />
      </div>
    </form>
  )
}

/** The one green action: a paper plane that lifts off on hover; a spinner while sending (mirrored in Arabic). */
function Send({ label, pendingLabel, busy }: { label: string; pendingLabel: string; busy: boolean }) {
  return (
    <Button type="submit" size="lg" disabled={busy} className="group h-12 w-full gap-2 rounded-xl px-6 disabled:opacity-100 sm:w-auto">
      {busy ? pendingLabel : label}
      <Icon
        name={busy ? 'loading' : 'send'}
        className={cn('size-4 transition-transform duration-200 rtl:-scale-x-100', busy ? 'animate-spin' : 'group-hover:-translate-y-0.5 group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5')}
      />
    </Button>
  )
}
