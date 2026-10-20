import { ReactNode } from 'react'
import { Label } from './label'

/** Label + control + optional hint, stacked (wraps the control in the label). */
export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <div className="mb-4 grid gap-2">
      <Label className="grid gap-2">
        <span>{label}</span>
        {children}
      </Label>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  )
}
