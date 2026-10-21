'use client'

import { useState, useTransition } from 'react'
import { Appear } from '@/shared/ui/motion'
import { Button } from '@/shared/ui/button'
import { cn } from '@/shared/lib/cn'
import { formatGrade, GRADE_SCALES, type GradeScale } from '@/shared/lib/grade-scale'
import { useT } from '@/shared/i18n'
import { saveGradeScale, type ScaleState } from '../server/actions'

const SAMPLES = [95, 82, 64]

/**
 * Radio list of scales, each with how 95 / 82 / 64 would look. Saves with a direct action call
 * (not a <form action>): React 19 resets forms after an action, which would un-check the radio.
 */
export function GradeScalePicker({ current }: { current: GradeScale }) {
  const t = useT()
  const s = t.school
  const [state, setState] = useState<ScaleState>({ status: 'idle' })
  const [saved, setSaved] = useState<GradeScale>(current)
  const [picked, setPicked] = useState<GradeScale>(current)
  const [pending, start] = useTransition()
  const save = () =>
    start(async () => {
      const form = new FormData()
      form.set('scale', picked)
      const result = await saveGradeScale({ status: 'idle' }, form)
      setState(result)
      if (result.status === 'saved') setSaved(picked)
    })
  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-2 sm:grid-cols-2">
        {GRADE_SCALES.map((scale) => (
          <label
            key={scale}
            className={cn(
              'flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50',
              picked === scale && 'border-primary bg-primary/5',
            )}
          >
            <input
              type="radio"
              name="scale"
              value={scale}
              checked={picked === scale}
              onChange={() => setPicked(scale)}
              className="mt-0.5 size-4 accent-primary"
            />
            <span className="flex flex-col gap-1">
              <span className="text-sm font-medium">{t.scales[scale]}</span>
              <span className="text-xs text-muted-foreground tabular-nums">
                {s.example} {SAMPLES.map((g) => `${g} → ${formatGrade(g, scale)}`).join(' · ')}
              </span>
            </span>
          </label>
        ))}
      </div>
      <div className="flex items-center gap-3">
        <Button type="button" onClick={save} disabled={pending || picked === saved}>
          {pending ? s.saving : s.save}
        </Button>
        {state.status === 'saved' && (
          <Appear key={state.at}>
            <span className="text-sm font-medium text-success">{s.saved}</span>
          </Appear>
        )}
      </div>
    </div>
  )
}
