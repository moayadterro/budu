'use client'

import { useState, useTransition, type ClipboardEvent } from 'react'
import { cn } from '@/shared/lib/cn'
import { Button } from '@/shared/ui/button'
import { Icon } from '@/shared/ui/icon'
import { Input } from '@/shared/ui/input'
import { Appear } from '@/shared/ui/motion'
import { useT } from '@/shared/i18n'
import { inviteCandidatesAction, type CandidateOutcome } from '../server/actions'

type Problem = Extract<CandidateOutcome, 'badEmail' | 'needName' | 'admin' | 'failed'>
type Row = { key: number; fullName: string; email: string; problem?: Problem }

const PROBLEMS: CandidateOutcome[] = ['badEmail', 'needName', 'admin', 'failed']
let nextKey = 1
const blank = (): Row => ({ key: nextKey++, fullName: '', email: '' })

/** "Anna Petrova, anna@mail.ru" | "anna@mail.ru" per line → rows (a pasted list or spreadsheet column pair). */
function rowsFromText(text: string): Row[] {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const email = line.match(/[^\s,;<>\t]+@[^\s,;<>\t]+\.[^\s,;<>\t]+/)?.[0] ?? ''
      const fullName = (email ? line.replace(email, '') : line).replace(/[<>,;\t]/g, ' ').replace(/\s+/g, ' ').trim()
      return { key: nextKey++, fullName, email }
    })
}

/**
 * Invite candidates one row per person (full name + email), like Slack / Linear invite forms.
 * Pasting a list into any field fills several rows. After sending, rows that worked leave the form
 * (they appear in the list below) and the ones that didn't stay, each with its own reason — so with
 * ten people and three problems you fix exactly those three and send again.
 */
export function CandidateRows({ quizId }: { quizId: number }) {
  const t = useT()
  const s = t.exams.audience
  const [rows, setRows] = useState<Row[]>(() => [blank()])
  const [summary, setSummary] = useState<{ ok: boolean; error?: boolean; text: string } | null>(null)
  const [pending, start] = useTransition()
  const filled = rows.filter((r) => r.fullName.trim() || r.email.trim())

  const edit = (key: number, patch: Partial<Row>) =>
    setRows((rs) => rs.map((r) => (r.key === key ? { ...r, ...patch, problem: undefined } : r)))
  const remove = (key: number) => setRows((rs) => (rs.length > 1 ? rs.filter((r) => r.key !== key) : [blank()]))

  // a pasted list (several lines) becomes rows; a single value pastes normally
  const paste = (key: number) => (ev: ClipboardEvent<HTMLInputElement>) => {
    const text = ev.clipboardData.getData('text')
    if (!/\n/.test(text.trim())) return
    ev.preventDefault()
    const pasted = rowsFromText(text)
    setRows((rs) => {
      const i = rs.findIndex((r) => r.key === key)
      const here = rs[i]
      const keep = here && (here.fullName.trim() || here.email.trim()) ? [here] : []
      return [...rs.slice(0, i), ...keep, ...pasted, ...rs.slice(i + 1)]
    })
  }

  const send = () =>
    start(async () => {
      const sent = filled
      const r = await inviteCandidatesAction(
        quizId,
        sent.map((x) => ({ fullName: x.fullName, email: x.email })),
      )
      if (!r.ok) return setSummary({ ok: false, error: true, text: s.failed })
      const count = (o: CandidateOutcome[]) => r.rows.filter((x) => o.includes(x)).length
      const left = sent.flatMap((x, i) => (PROBLEMS.includes(r.rows[i]) ? [{ ...x, problem: r.rows[i] as Problem }] : []))
      const mailFailed = count(['mailFailed'])
      setRows(left.length ? left : [blank()])
      setSummary({
        ok: !left.length && !mailFailed,
        text: s.sent({ invited: count(['invited', 'reinvited']), added: count(['added']), already: count(['already']), mailFailed, left: left.length }),
      })
    })

  return (
    <div className="flex flex-col gap-3">
      {/* phones stack name over email, so people need more air between them */}
      <div className="flex flex-col gap-5 sm:gap-2.5">
        {rows.map((row) => (
          <div key={row.key} className="flex flex-col gap-1">
            <div className="flex items-start gap-2">
              <div className="grid min-w-0 flex-1 gap-2 sm:grid-cols-2">
                <Input
                  value={row.fullName}
                  onChange={(e) => edit(row.key, { fullName: e.target.value })}
                  onPaste={paste(row.key)}
                  placeholder={s.fullName}
                  aria-label={s.fullName}
                  aria-invalid={row.problem === 'needName' || undefined}
                  autoComplete="off"
                  className="h-11"
                />
                <Input
                  value={row.email}
                  onChange={(e) => edit(row.key, { email: e.target.value })}
                  onPaste={paste(row.key)}
                  type="email"
                  inputMode="email"
                  dir="ltr"
                  placeholder={s.email}
                  aria-label={s.email}
                  aria-invalid={(row.problem && row.problem !== 'needName') || undefined}
                  autoComplete="off"
                  spellCheck={false}
                  className="h-11 rtl:text-end"
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-11 flex-none text-muted-foreground"
                aria-label={s.removeRow}
                title={s.removeRow}
                disabled={rows.length === 1 && !row.fullName && !row.email}
                onClick={() => remove(row.key)}
              >
                <Icon name="close" />
              </Button>
            </div>
            {row.problem && (
              <Appear>
                <p className="flex items-start gap-1.5 text-xs font-medium text-destructive">
                  <Icon name="alert" className="mt-px size-3.5 flex-none" />
                  {s.rowError[row.problem]}
                </p>
              </Appear>
            )}
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <Button type="button" variant="ghost" size="sm" className="-ms-2 text-muted-foreground" onClick={() => setRows((rs) => [...rs, blank()])}>
          <Icon name="plus" />
          {s.addRow}
        </Button>
        <span className="text-xs text-muted-foreground">{s.pasteHint}</span>
      </div>

      <Button className="self-start" disabled={pending || !filled.length} onClick={send}>
        <Icon name="send" />
        {s.inviteCount(filled.length)}
      </Button>
      {summary && (
        <Appear>
          <p role="status" className={cn('flex items-start gap-2 text-sm', summary.error ? 'text-destructive' : summary.ok ? 'text-success' : 'text-muted-foreground')}>
            <Icon name={summary.ok ? 'tick' : 'alert'} className="mt-0.5 size-4 flex-none" />
            <span className={cn(!summary.error && 'text-foreground/80')}>{summary.text}</span>
          </p>
        </Appear>
      )}
    </div>
  )
}
