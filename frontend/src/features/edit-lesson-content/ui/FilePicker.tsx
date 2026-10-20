'use client'

import { useState } from 'react'
import { Icon } from '@/shared/ui/icon'
import { formatBytes } from '@/shared/lib/format'

/** Dashed drop-style file field (as in the homework design) showing the chosen file. */
export function FilePicker({ name, label, hint, accept, required }: { name: string; label: string; hint: string; accept?: string; required?: boolean }) {
  const [file, setFile] = useState<File | null>(null)
  return (
    <label className="flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed border-input bg-background p-6 text-center transition-colors hover:bg-muted">
      <Icon name="upload" className="size-5 text-primary" />
      <span className="text-sm font-medium text-primary">{file ? file.name : label}</span>
      <span className="text-xs text-muted-foreground">{file ? formatBytes(file.size) : hint}</span>
      <input
        type="file"
        name={name}
        accept={accept}
        required={required}
        className="sr-only"
        onChange={(e) => setFile(e.currentTarget.files?.[0] ?? null)}
      />
    </label>
  )
}
