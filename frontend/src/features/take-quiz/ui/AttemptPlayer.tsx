'use client'

import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useRef, useState, useTransition } from 'react'
import type { Attempt, AttemptAnswer, AttemptQuestion } from '@/entities/quiz'
import { cn } from '@/shared/lib/cn'
import { Button } from '@/shared/ui/button'
import { Card, CardContent } from '@/shared/ui/card'
import { Icon } from '@/shared/ui/icon'
import { Input } from '@/shared/ui/input'
import { NativeSelect, NativeSelectOption } from '@/shared/ui/native-select'
import { Textarea } from '@/shared/ui/textarea'
import { useT } from '@/shared/i18n'
import { saveAnswersAction } from '../server/actions'

/** answers save this long after the last change (and every few seconds while answering) */
const AUTOSAVE_MS = 1_500

const answered = (q: AttemptQuestion, a: AttemptAnswer) => {
  if (a === null || a === undefined) return false
  if (typeof a === 'string') return a.trim() !== ''
  if (Array.isArray(a)) return q.type === 'ordering' ? true : a.length > 0
  return Object.values(a).some((v) => v && v !== '0')
}

/**
 * Taking a quiz: every question on one page, a sticky bar with the time left, progress and Submit.
 * Answers autosave; when time is up the attempt is submitted with what was saved.
 */
export function AttemptPlayer({ attempt }: { attempt: Attempt }) {
  const t = useT()
  const s = t.quiz.take
  const router = useRouter()
  const [answers, setAnswers] = useState<Record<number, AttemptAnswer>>(() => Object.fromEntries(attempt.questions.map((q) => [q.slot, q.answer])))
  const dirty = useRef(false)
  const latest = useRef(answers)
  latest.current = answers
  const [saving, startSaving] = useTransition()
  const [savedAt, setSavedAt] = useState<number | null>(null)
  const [confirming, setConfirming] = useState(false)
  const [failed, setFailed] = useState(false)
  // seconds left, corrected for the browser's clock (server time at load)
  const offset = useRef(attempt.serverNow - Date.now() / 1000)
  const [left, setLeft] = useState<number | null>(attempt.endsAt ? attempt.endsAt - attempt.serverNow : null)
  const submitted = useRef(false)

  const save = useCallback(
    async (finish: boolean) => {
      if (submitted.current) return
      if (finish) submitted.current = true
      dirty.current = false
      const r = await saveAnswersAction(attempt.id, latest.current, finish)
      if (!r.ok) {
        dirty.current = true
        if (finish) submitted.current = false
        setFailed(true)
        return
      }
      setFailed(false)
      setSavedAt(Date.now())
      if (r.finished) router.replace(`/quiz/${attempt.id}/review`)
    },
    [attempt.id, router],
  )

  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const change = (slot: number, a: AttemptAnswer) => {
    dirty.current = true
    setAnswers((cur) => ({ ...cur, [slot]: a }))
    // save shortly after each change, so a closed tab or a timeout loses nothing
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => dirty.current && startSaving(() => save(false)), AUTOSAVE_MS)
  }

  // also save when the page is hidden (tab switch, closing)
  useEffect(() => {
    const onHide = () => document.visibilityState === 'hidden' && dirty.current && save(false)
    document.addEventListener('visibilitychange', onHide)
    return () => document.removeEventListener('visibilitychange', onHide)
  }, [save])

  // countdown; at zero the attempt is submitted
  useEffect(() => {
    if (!attempt.endsAt) return
    const tick = () => {
      const l = Math.max(0, Math.round(attempt.endsAt! - (Date.now() / 1000 + offset.current)))
      setLeft(l)
      if (l === 0) startSaving(() => save(true))
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [attempt.endsAt, save])

  const done = attempt.questions.filter((q) => answered(q, answers[q.slot])).length
  const total = attempt.questions.length
  const clock = left === null ? null : `${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}`

  return (
    <div className="flex flex-col gap-4">
      <div className="sticky top-14 z-10 -mx-1 flex flex-wrap items-center gap-3 rounded-xl border bg-background/95 px-4 py-3 shadow-sm backdrop-blur">
        <div className="min-w-0 flex-1">
          <div className="truncate font-semibold">{attempt.name}</div>
          <div className="text-xs text-muted-foreground" aria-live="polite">
            {s.progress(done, total)} · {failed ? <span className="text-destructive">{s.saveFailed}</span> : saving ? s.saving : savedAt ? s.saved : s.autosave}
          </div>
        </div>
        {clock && (
          <div
            className={cn('flex items-center gap-1.5 rounded-md px-2.5 py-1 font-mono text-sm font-semibold tabular-nums', left! <= 60 ? 'bg-destructive/10 text-destructive' : 'bg-muted')}
            role="timer"
            aria-label={s.timeLeft}
          >
            <Icon name="clock" className="size-4" />
            {clock}
          </div>
        )}
        {confirming ? (
          <div className="flex items-center gap-2">
            <span className="text-sm">{done < total ? s.unanswered(total - done) : s.sure}</span>
            <Button size="sm" variant="outline" onClick={() => setConfirming(false)}>
              {s.back}
            </Button>
            <Button size="sm" disabled={saving} onClick={() => startSaving(() => save(true))}>
              {s.submit}
            </Button>
          </div>
        ) : (
          <Button size="sm" onClick={() => setConfirming(true)}>
            {s.submit}
          </Button>
        )}
      </div>

      {attempt.questions.map((q, i) => (
        <Card key={q.slot}>
          <CardContent className="flex flex-col gap-3">
            <div className="flex items-start justify-between gap-3">
              <h2 className="text-sm font-semibold">
                {s.question(i + 1)} <span className="font-normal text-muted-foreground">· {t.quiz.q.points(q.mark)}</span>
              </h2>
              {answered(q, answers[q.slot]) && <Icon name="tick" className="size-4 flex-none text-success" aria-label={s.answered} />}
            </div>
            {q.type !== 'gapselect' && <p className="whitespace-pre-line">{q.text}</p>}
            <AnswerInput q={q} value={answers[q.slot]} onChange={(a) => change(q.slot, a)} />
          </CardContent>
        </Card>
      ))}

      <Button className="self-end" onClick={() => setConfirming(true)}>
        {s.submit}
      </Button>
    </div>
  )
}

/** The input for one question, by type. */
function AnswerInput({ q, value, onChange }: { q: AttemptQuestion; value: AttemptAnswer; onChange: (a: AttemptAnswer) => void }) {
  const t = useT()
  const s = t.quiz.take
  const name = `q${q.slot}`
  const option = (checked: boolean) =>
    cn('flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2.5 text-sm transition-colors', checked ? 'border-primary bg-primary/5' : 'hover:bg-muted')

  switch (q.type) {
    case 'multichoice': {
      const opts = q.ui.options ?? []
      if (q.ui.multiple) {
        const chosen = Array.isArray(value) ? value : []
        return (
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-1 text-xs text-muted-foreground">{s.pickAll}</legend>
            {opts.map((o) => {
              const on = chosen.includes(o.key)
              return (
                <label key={o.key} className={option(on)}>
                  <input type="checkbox" className="size-4 accent-primary" checked={on} onChange={() => onChange(on ? chosen.filter((k) => k !== o.key) : [...chosen, o.key])} />
                  {o.text}
                </label>
              )
            })}
          </fieldset>
        )
      }
      return (
        <div role="radiogroup" className="flex flex-col gap-2">
          {opts.map((o) => (
            <label key={o.key} className={option(value === o.key)}>
              <input type="radio" name={name} className="size-4 accent-primary" checked={value === o.key} onChange={() => onChange(o.key)} />
              {o.text}
            </label>
          ))}
        </div>
      )
    }
    case 'truefalse':
      return (
        <div role="radiogroup" className="grid grid-cols-2 gap-2">
          {[
            ['1', t.quiz.q.true],
            ['0', t.quiz.q.false],
          ].map(([k, label]) => (
            <label key={k} className={option(value === k)}>
              <input type="radio" name={name} className="size-4 accent-primary" checked={value === k} onChange={() => onChange(k)} />
              {label}
            </label>
          ))}
        </div>
      )
    case 'shortanswer':
      return <Input value={typeof value === 'string' ? value : ''} onChange={(e) => onChange(e.target.value)} placeholder={s.typeAnswer} aria-label={s.typeAnswer} className="max-w-md" />
    case 'numerical':
      return <Input inputMode="decimal" value={typeof value === 'string' ? value : ''} onChange={(e) => onChange(e.target.value)} placeholder={s.typeNumber} aria-label={s.typeNumber} className="max-w-48" />
    case 'essay':
      return <Textarea rows={8} value={typeof value === 'string' ? value : ''} onChange={(e) => onChange(e.target.value)} placeholder={s.writeAnswer} aria-label={s.writeAnswer} />
    case 'match': {
      const v = value && typeof value === 'object' && !Array.isArray(value) ? value : {}
      return (
        <div className="flex flex-col gap-2">
          {(q.ui.stems ?? []).map((stem) => (
            <div key={stem.key} className="grid items-center gap-2 sm:grid-cols-[1fr_minmax(10rem,16rem)]">
              <span className="text-sm">{stem.text}</span>
              <NativeSelect value={v[stem.key] ?? ''} onChange={(e) => onChange({ ...v, [stem.key]: e.target.value })} aria-label={stem.text}>
                <NativeSelectOption value="">{s.choose}</NativeSelectOption>
                {(q.ui.choices ?? []).map((c) => (
                  <NativeSelectOption key={c.key} value={c.key}>
                    {c.text}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </div>
          ))}
        </div>
      )
    }
    case 'ordering': {
      const items = q.ui.items ?? []
      const order = Array.isArray(value) && value.length === items.length ? value : items.map((i) => i.key)
      const text = (k: string) => items.find((i) => i.key === k)?.text ?? ''
      const move = (i: number, d: -1 | 1) => {
        const next = [...order]
        ;[next[i], next[i + d]] = [next[i + d], next[i]]
        onChange(next)
      }
      return (
        <ol className="flex flex-col gap-2">
          {order.map((k, i) => (
            <li key={k} className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm">
              <span className="w-5 text-muted-foreground tabular-nums">{i + 1}.</span>
              <span className="flex-1">{text(k)}</span>
              <Button type="button" variant="ghost" size="icon-sm" disabled={i === 0} onClick={() => move(i, -1)} aria-label={s.moveUp}>
                <Icon name="up" />
              </Button>
              <Button type="button" variant="ghost" size="icon-sm" disabled={i === order.length - 1} onClick={() => move(i, 1)} aria-label={s.moveDown}>
                <Icon name="down" />
              </Button>
            </li>
          ))}
        </ol>
      )
    }
    case 'gapselect': {
      const v = value && typeof value === 'object' && !Array.isArray(value) ? value : {}
      const frags = q.ui.fragments ?? []
      const gaps = q.ui.gaps ?? []
      return (
        // a <div>, not <p>: the selects render <div> wrappers
        <div className="leading-loose">
          {frags.map((f, i) => (
            <span key={i}>
              {f}{' '}
              {gaps[i] && (
                <NativeSelect
                  size="sm"
                  value={v[gaps[i].key] ?? ''}
                  onChange={(e) => onChange({ ...v, [gaps[i].key]: e.target.value })}
                  aria-label={s.gap(i + 1)}
                  className="inline-block w-auto align-middle"
                >
                  <NativeSelectOption value="">…</NativeSelectOption>
                  {gaps[i].choices.map((c) => (
                    <NativeSelectOption key={c.key} value={c.key}>
                      {c.text}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
              )}{' '}
            </span>
          ))}
        </div>
      )
    }
  }
}
