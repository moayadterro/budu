'use client'

import { useState, useTransition, type ReactNode } from 'react'
import { QUESTION_TYPES, type Question, type QuestionData, type QuestionType } from '@/entities/quiz'
import { cn } from '@/shared/lib/cn'
import { Alert } from '@/shared/ui/alert'
import { Button } from '@/shared/ui/button'
import { Field } from '@/shared/ui/field'
import { Icon } from '@/shared/ui/icon'
import { Input } from '@/shared/ui/input'
import { Textarea } from '@/shared/ui/textarea'
import { useT } from '@/shared/i18n'
import { saveQuestionAction } from '../server/actions'

type Opt = { text: string; correct: boolean }
type State = {
  text: string
  mark: string
  explanation: string
  multiple: boolean
  options: Opt[]
  tf: boolean
  answers: string[]
  caseSensitive: boolean
  numbers: Array<{ value: string; tolerance: string }>
  graderInfo: string
  pairs: Array<{ left: string; right: string }>
  items: string[]
  /** gapselect: the sentence with the right words in [brackets] */
  sentence: string
  extras: string
}

const blank: State = {
  text: '',
  mark: '1',
  explanation: '',
  multiple: false,
  options: [
    { text: '', correct: true },
    { text: '', correct: false },
    { text: '', correct: false },
  ],
  tf: true,
  answers: [''],
  caseSensitive: false,
  numbers: [{ value: '', tolerance: '0' }],
  graderInfo: '',
  pairs: [
    { left: '', right: '' },
    { left: '', right: '' },
  ],
  items: ['', '', ''],
  sentence: '',
  extras: '',
}

/** A saved question → editor state. */
function fromQuestion(q: Question): State {
  const s: State = { ...blank, text: q.text, mark: String(q.mark), explanation: q.data.explanation ?? '' }
  const d = q.data
  switch (d.type) {
    case 'multichoice':
      return { ...s, multiple: d.multiple, options: d.options }
    case 'truefalse':
      return { ...s, tf: d.correct }
    case 'shortanswer':
      return { ...s, answers: d.answers.length ? d.answers : [''], caseSensitive: d.caseSensitive }
    case 'numerical':
      return { ...s, numbers: d.answers.map((a) => ({ value: String(a.value), tolerance: String(a.tolerance) })) }
    case 'essay':
      return { ...s, graderInfo: d.graderInfo }
    case 'match':
      return { ...s, pairs: d.pairs }
    case 'ordering':
      return { ...s, items: d.items }
    case 'gapselect': {
      let gaps = 0
      const sentence = q.text.replace(/\[\[(\d+)\]\]/g, (_, n: string) => {
        gaps = Math.max(gaps, Number(n))
        return `[${d.choices[Number(n) - 1] ?? ''}]`
      })
      return { ...s, text: '', sentence, extras: d.choices.slice(gaps).join(', ') }
    }
  }
}

type Built = { text: string; mark: number; data: QuestionData & { explanation?: string } } | { error: string }

/** Editor state → what the server saves, or an error key (t.quiz.q.errors). */
function build(type: QuestionType, s: State): Built {
  const mark = Number(s.mark)
  if (!(mark > 0 && mark <= 100)) return { error: 'mark' }
  const explanation = s.explanation.trim()
  const clean = (xs: string[]) => xs.map((x) => x.trim()).filter(Boolean)
  const text = s.text.trim()
  if (type !== 'gapselect' && !text) return { error: 'text' }
  switch (type) {
    case 'multichoice': {
      const options = s.options.map((o) => ({ text: o.text.trim(), correct: o.correct })).filter((o) => o.text)
      const correct = options.filter((o) => o.correct).length
      if (options.length < 2) return { error: 'options' }
      if (correct < 1 || (!s.multiple && correct !== 1)) return { error: 'correct' }
      return { text, mark, data: { type, multiple: s.multiple, options, explanation } }
    }
    case 'truefalse':
      return { text, mark, data: { type, correct: s.tf, explanation } }
    case 'shortanswer': {
      const answers = clean(s.answers)
      if (!answers.length) return { error: 'answers' }
      return { text, mark, data: { type, answers, caseSensitive: s.caseSensitive, explanation } }
    }
    case 'numerical': {
      const answers = s.numbers
        .filter((n) => n.value.trim() !== '')
        .map((n) => ({ value: Number(n.value.replace(',', '.')), tolerance: Math.abs(Number((n.tolerance || '0').replace(',', '.'))) }))
      if (!answers.length || answers.some((a) => !Number.isFinite(a.value) || !Number.isFinite(a.tolerance))) return { error: 'numbers' }
      return { text, mark, data: { type, answers, explanation } }
    }
    case 'essay':
      return { text, mark, data: { type, graderInfo: s.graderInfo.trim(), explanation } }
    case 'match': {
      const pairs = s.pairs.map((p) => ({ left: p.left.trim(), right: p.right.trim() })).filter((p) => p.right)
      if (pairs.filter((p) => p.left).length < 2) return { error: 'pairs' }
      return { text, mark, data: { type, pairs, explanation } }
    }
    case 'ordering': {
      const items = clean(s.items)
      if (items.length < 2) return { error: 'items' }
      return { text, mark, data: { type, items, explanation } }
    }
    case 'gapselect': {
      // "Force equals [mass] times [acceleration]." → "Force equals [[1]] times [[2]]." + choices
      const words: string[] = []
      const gapped = s.sentence.replace(/\[([^\[\]]+)\]/g, (_, w: string) => {
        words.push(w.trim())
        return `[[${words.length}]]`
      })
      const extras = clean(s.extras.split(','))
      if (!words.length || words.length + extras.length < 2) return { error: 'gaps' }
      return { text: gapped.trim(), mark, data: { type, choices: [...words, ...extras], explanation } }
    }
  }
}

/** Add a question (type picker first) or edit `question`. */
export function QuestionEditor({ quizId, question, onDone }: { quizId: number; question?: Question; onDone: () => void }) {
  const t = useT()
  const s = t.quiz.q
  const [type, setType] = useState<QuestionType | null>(question?.type ?? null)
  const [st, setSt] = useState<State>(() => (question ? fromQuestion(question) : blank))
  const [error, setError] = useState<string | null>(null)
  const [pending, start] = useTransition()
  const set = (patch: Partial<State>) => setSt((cur) => ({ ...cur, ...patch }))

  if (!type) {
    return (
      <div className="rounded-lg border bg-muted/40 p-4">
        <div className="mb-3 text-sm font-medium">{s.pickType}</div>
        <div className="grid gap-2 sm:grid-cols-2">
          {QUESTION_TYPES.map((k) => (
            <button key={k} type="button" onClick={() => setType(k)} className="rounded-lg border bg-background px-3 py-2 text-start transition-colors hover:border-primary">
              <span className="block text-sm font-medium">{s.types[k]}</span>
              <span className="block text-xs text-muted-foreground">{s.typeHints[k]}</span>
            </button>
          ))}
        </div>
        <Button type="button" variant="ghost" size="sm" className="mt-3" onClick={onDone}>
          {s.cancel}
        </Button>
      </div>
    )
  }

  const save = () => {
    const b = build(type, st)
    if ('error' in b) return setError(s.errors[b.error as keyof typeof s.errors] ?? s.errors.server)
    setError(null)
    start(async () => {
      const err = await saveQuestionAction(quizId, question?.slot ?? 0, b)
      if (err) setError(s.errors[err])
      else onDone()
    })
  }

  return (
    <div className="rounded-lg border bg-muted/40 p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <span className="text-sm font-semibold">{s.types[type]}</span>
        {!question && (
          <Button type="button" variant="ghost" size="sm" onClick={() => setType(null)}>
            {s.changeType}
          </Button>
        )}
      </div>
      {error && (
        <Alert variant="destructive" className="mb-4">
          {error}
        </Alert>
      )}

      {type === 'gapselect' ? (
        <Field label={s.sentence} hint={s.sentenceHint}>
          <Textarea rows={3} value={st.sentence} onChange={(e) => set({ sentence: e.target.value })} placeholder={s.sentencePh} />
        </Field>
      ) : (
        <Field label={s.text}>
          <Textarea rows={3} value={st.text} onChange={(e) => set({ text: e.target.value })} placeholder={s.textPh} />
        </Field>
      )}

      {type === 'multichoice' && (
        <div className="mb-4">
          <label className="mb-2 flex items-center gap-2 text-sm">
            <input type="checkbox" checked={st.multiple} onChange={(e) => set({ multiple: e.target.checked })} className="size-4 accent-primary" />
            {s.multiple}
          </label>
          <span className="mb-2 block text-sm font-medium">{s.options}</span>
          <div className="flex flex-col gap-2">
            {st.options.map((o, i) => (
              <Row key={i} onRemove={st.options.length > 2 ? () => set({ options: st.options.filter((_, j) => j !== i) }) : undefined} removeLabel={s.remove}>
                <input
                  type={st.multiple ? 'checkbox' : 'radio'}
                  name="correct"
                  checked={o.correct}
                  aria-label={s.correctOption}
                  title={s.correctOption}
                  onChange={(e) =>
                    set({ options: st.options.map((x, j) => (j === i ? { ...x, correct: e.target.checked } : st.multiple ? x : { ...x, correct: false })) })
                  }
                  className="size-4 flex-none accent-primary"
                />
                <Input value={o.text} onChange={(e) => set({ options: st.options.map((x, j) => (j === i ? { ...x, text: e.target.value } : x)) })} placeholder={s.optionPh(i + 1)} />
              </Row>
            ))}
          </div>
          <AddButton onClick={() => set({ options: [...st.options, { text: '', correct: false }] })} label={s.addOption} />
          <p className="mt-1 text-xs text-muted-foreground">{s.correctHint}</p>
        </div>
      )}

      {type === 'truefalse' && (
        <fieldset className="mb-4">
          <legend className="mb-2 text-sm font-medium">{s.rightAnswer}</legend>
          <div className="flex gap-2">
            {[true, false].map((v) => (
              <button
                key={String(v)}
                type="button"
                aria-pressed={st.tf === v}
                onClick={() => set({ tf: v })}
                className={cn('h-10 rounded-md border px-4 text-sm font-medium', st.tf === v ? 'border-primary bg-primary text-primary-foreground' : 'hover:bg-muted')}
              >
                {v ? s.true : s.false}
              </button>
            ))}
          </div>
        </fieldset>
      )}

      {type === 'shortanswer' && (
        <div className="mb-4">
          <span className="mb-2 block text-sm font-medium">{s.accepted}</span>
          <StringList values={st.answers} onChange={(answers) => set({ answers })} placeholder={s.acceptedPh} addLabel={s.addAnswer} removeLabel={s.remove} />
          <label className="mt-2 flex items-center gap-2 text-sm">
            <input type="checkbox" checked={st.caseSensitive} onChange={(e) => set({ caseSensitive: e.target.checked })} className="size-4 accent-primary" />
            {s.caseSensitive}
          </label>
        </div>
      )}

      {type === 'numerical' && (
        <div className="mb-4">
          <span className="mb-2 block text-sm font-medium">{s.numbers}</span>
          <div className="flex flex-col gap-2">
            {st.numbers.map((n, i) => (
              <Row key={i} onRemove={st.numbers.length > 1 ? () => set({ numbers: st.numbers.filter((_, j) => j !== i) }) : undefined} removeLabel={s.remove}>
                <Input inputMode="decimal" value={n.value} onChange={(e) => set({ numbers: st.numbers.map((x, j) => (j === i ? { ...x, value: e.target.value } : x)) })} placeholder={s.value} aria-label={s.value} />
                <span className="text-sm text-muted-foreground">±</span>
                <Input inputMode="decimal" value={n.tolerance} onChange={(e) => set({ numbers: st.numbers.map((x, j) => (j === i ? { ...x, tolerance: e.target.value } : x)) })} placeholder="0" aria-label={s.tolerance} className="w-24" />
              </Row>
            ))}
          </div>
          <AddButton onClick={() => set({ numbers: [...st.numbers, { value: '', tolerance: '0' }] })} label={s.addAnswer} />
          <p className="mt-1 text-xs text-muted-foreground">{s.toleranceHint}</p>
        </div>
      )}

      {type === 'essay' && (
        <Field label={s.graderInfo} hint={s.graderInfoHint}>
          <Textarea rows={2} value={st.graderInfo} onChange={(e) => set({ graderInfo: e.target.value })} />
        </Field>
      )}

      {type === 'match' && (
        <div className="mb-4">
          <span className="mb-2 block text-sm font-medium">{s.pairs}</span>
          <div className="flex flex-col gap-2">
            {st.pairs.map((p, i) => (
              <Row key={i} onRemove={st.pairs.length > 2 ? () => set({ pairs: st.pairs.filter((_, j) => j !== i) }) : undefined} removeLabel={s.remove}>
                <Input value={p.left} onChange={(e) => set({ pairs: st.pairs.map((x, j) => (j === i ? { ...x, left: e.target.value } : x)) })} placeholder={s.left} aria-label={s.left} />
                <Icon name="chevRight" className="size-4 flex-none text-muted-foreground rtl:-scale-x-100" />
                <Input value={p.right} onChange={(e) => set({ pairs: st.pairs.map((x, j) => (j === i ? { ...x, right: e.target.value } : x)) })} placeholder={s.right} aria-label={s.right} />
              </Row>
            ))}
          </div>
          <AddButton onClick={() => set({ pairs: [...st.pairs, { left: '', right: '' }] })} label={s.addPair} />
          <p className="mt-1 text-xs text-muted-foreground">{s.pairsHint}</p>
        </div>
      )}

      {type === 'ordering' && (
        <div className="mb-4">
          <span className="mb-2 block text-sm font-medium">{s.items}</span>
          <StringList values={st.items} onChange={(items) => set({ items })} placeholder={s.itemPh} addLabel={s.addItem} removeLabel={s.remove} min={2} numbered />
          <p className="mt-1 text-xs text-muted-foreground">{s.itemsHint}</p>
        </div>
      )}

      {type === 'gapselect' && (
        <Field label={s.extras} hint={s.extrasHint}>
          <Input value={st.extras} onChange={(e) => set({ extras: e.target.value })} placeholder={s.extrasPh} />
        </Field>
      )}

      <div className="grid gap-x-4 sm:grid-cols-[1fr_8rem]">
        <Field label={s.explanation} hint={s.explanationHint}>
          <Input value={st.explanation} onChange={(e) => set({ explanation: e.target.value })} />
        </Field>
        <Field label={s.mark}>
          <Input type="number" min={0.5} max={100} step={0.5} inputMode="decimal" value={st.mark} onChange={(e) => set({ mark: e.target.value })} />
        </Field>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button type="button" onClick={save} disabled={pending}>
          {pending ? s.saving : s.save}
        </Button>
        <Button type="button" variant="outline" onClick={onDone}>
          {s.cancel}
        </Button>
      </div>
    </div>
  )
}

function Row({ children, onRemove, removeLabel }: { children: ReactNode; onRemove?: () => void; removeLabel: string }) {
  return (
    <div className="flex items-center gap-2">
      {children}
      <Button type="button" variant="ghost" size="icon-sm" onClick={onRemove} disabled={!onRemove} aria-label={removeLabel} title={removeLabel}>
        <Icon name="close" />
      </Button>
    </div>
  )
}

function AddButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <Button type="button" variant="ghost" size="sm" className="mt-2" onClick={onClick}>
      <Icon name="plus" />
      {label}
    </Button>
  )
}

/** Editable list of strings (accepted answers, items in order). */
function StringList({
  values,
  onChange,
  placeholder,
  addLabel,
  removeLabel,
  min = 1,
  numbered = false,
}: {
  values: string[]
  onChange: (v: string[]) => void
  placeholder: string
  addLabel: string
  removeLabel: string
  min?: number
  numbered?: boolean
}) {
  return (
    <>
      <div className="flex flex-col gap-2">
        {values.map((v, i) => (
          <Row key={i} onRemove={values.length > min ? () => onChange(values.filter((_, j) => j !== i)) : undefined} removeLabel={removeLabel}>
            {numbered && <span className="w-5 flex-none text-end text-sm text-muted-foreground tabular-nums">{i + 1}.</span>}
            <Input value={v} onChange={(e) => onChange(values.map((x, j) => (j === i ? e.target.value : x)))} placeholder={placeholder} />
          </Row>
        ))}
      </div>
      <AddButton onClick={() => onChange([...values, ''])} label={addLabel} />
    </>
  )
}
