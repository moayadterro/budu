'use client'

import { useState } from 'react'
import { Icon } from '@/shared/ui/icon'
import { formatBytes } from '@/shared/lib/format'

/** Dashed drop-style file field showing the chosen file(s). `multiple` allows several. */
export function FilePicker({
  name,
  label,
  hint,
  accept,
  required,
  multiple,
}: {
  name: string
  label: string
  hint: string
  accept?: string
  required?: boolean
  multiple?: boolean
}) {
  const [files, setFiles] = useState<File[]>([])
  const file = files[0] ?? null
  const total = files.reduce((n, f) => n + f.size, 0)
  return (
    <label className="flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed border-input bg-background p-6 text-center transition-colors hover:bg-muted">
      <Icon name="upload" className="size-5 text-primary" />
      <span className="text-sm font-medium text-primary">{files.length > 1 ? files.map((f) => f.name).join(', ') : file ? file.name : label}</span>
      <span className="text-xs text-muted-foreground">{file ? formatBytes(total) : hint}</span>
      <input
        type="file"
        name={name}
        accept={accept}
        required={required}
        multiple={multiple}
        className="sr-only"
        onChange={(e) => setFiles(Array.from(e.currentTarget.files ?? []))}
      />
    </label>
  )
}
