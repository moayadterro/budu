'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Textarea } from '@/shared/ui/textarea'
import { useT } from '@/shared/i18n'
import { gradeAnswerAction } from '../server/actions'

/** Points + comment for one answer (written answers; can also override an automatic mark). */
export function GradeAnswer({ attemptId, slot, maxMark, mark, comment }: { attemptId: number; slot: number; maxMark: number; mark: number | null; comment: string }) {
  const t = useT()
  const s = t.quiz.grade
  const [points, setPoints] = useState(mark === null ? '' : String(mark))
  const [text, setText] = useState(comment)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [pending, start] = useTransition()
  const save = () => {
    const m = Number(points.replace(',', '.'))
    if (points.trim() === '' || !(m >= 0 && m <= maxMark)) return setError(s.range(maxMark))
    setError(null)
    start(async () => {
      const err = await gradeAnswerAction(attemptId, slot, m, text)
      setError(err ? s.errors[err] : null)
      setSaved(!err)
    })
  }
  return (
    <div className="flex flex-col gap-2 rounded-lg bg-muted/50 p-3">
      <div className="flex flex-wrap items-center gap-2">
        <Input
          inputMode="decimal"
          value={points}
          onChange={(e) => {
            setPoints(e.target.value)
            setSaved(false)
          }}
          aria-label={s.points}
          className="w-24"
        />
        <span className="text-sm text-muted-foreground">/ {maxMark}</span>
      </div>
      <Textarea
        rows={2}
        value={text}
        onChange={(e) => {
          setText(e.target.value)
          setSaved(false)
        }}
        placeholder={s.commentPh}
        aria-label={s.comment}
      />
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="button" size="sm" className="self-start" onClick={save} disabled={pending}>
        {saved ? s.saved : s.save}
      </Button>
    </div>
  )
}
