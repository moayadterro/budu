'use client'

import { useRef, useState, useTransition } from 'react'
import { PAGE_LIMITS, type Photo } from '@/entities/school-page'
import { Button } from '@/shared/ui/button'
import { Icon } from '@/shared/ui/icon'
import { Input } from '@/shared/ui/input'
import { useT } from '@/shared/i18n'
import { uploadPhotoAction } from '../server/actions'

const src = (id: number) => `/files/${id}`

/** Pick an image → uploaded at once (IOMAD) → its file id. */
function usePhotoUpload() {
  const t = useT()
  const [pending, start] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const upload = (file: File, done: (id: number) => void) =>
    start(async () => {
      setError(null)
      const fd = new FormData()
      fd.set('photo', file)
      const r = await uploadPhotoAction(fd)
      if (r.ok) done(r.id)
      else setError(t.schoolPage.editor.photoErrors[r.error])
    })
  return { pending, error, upload }
}

/** One optional photo (news item, spotlight, cover): thumbnail + Upload / Change / Remove. */
export function PhotoField({ value, onChange, wide }: { value: number | null; onChange: (id: number | null) => void; wide?: boolean }) {
  const t = useT()
  const s = t.schoolPage.editor
  const input = useRef<HTMLInputElement>(null)
  const { pending, error, upload } = usePhotoUpload()
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-3">
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={src(value)} alt="" className={wide ? 'aspect-[3/1] w-full max-w-md rounded-lg border object-cover' : 'size-16 rounded-lg border object-cover'} />
        ) : (
          <span className={wide ? 'grid aspect-[3/1] w-full max-w-md place-items-center rounded-lg border border-dashed text-muted-foreground' : 'grid size-16 place-items-center rounded-lg border border-dashed text-muted-foreground'}>
            <Icon name="image" />
          </span>
        )}
        <div className="flex gap-2">
          <Button type="button" variant="outline" size="sm" disabled={pending} onClick={() => input.current?.click()}>
            <Icon name="camera" />
            {pending ? s.uploading : value ? s.changePhoto : s.addPhoto}
          </Button>
          {value && (
            <Button type="button" variant="ghost" size="sm" className="text-muted-foreground" onClick={() => onChange(null)}>
              {s.removePhoto}
            </Button>
          )}
        </div>
      </div>
      <input
        ref={input}
        type="file"
        accept="image/png,image/jpeg,image/gif,image/webp"
        className="sr-only"
        onChange={(e) => {
          const f = e.target.files?.[0]
          e.target.value = ''
          if (f) upload(f, onChange)
        }}
      />
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}

/** The gallery: up to 6 photos, each with a caption; add more, remove any. */
export function PhotosField({ items, onChange }: { items: Photo[]; onChange: (items: Photo[]) => void }) {
  const t = useT()
  const s = t.schoolPage.editor
  const input = useRef<HTMLInputElement>(null)
  const { pending, error, upload } = usePhotoUpload()
  const full = items.length >= PAGE_LIMITS.photos
  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {items.map((p, i) => (
          <div key={p.fileId} className="flex flex-col gap-1.5">
            <div className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src(p.fileId)} alt={p.caption} className="aspect-[4/3] w-full rounded-lg border object-cover" />
              <Button
                type="button"
                size="icon-sm"
                variant="secondary"
                className="absolute end-1.5 top-1.5 shadow-sm"
                aria-label={s.removePhoto}
                onClick={() => onChange(items.filter((_, j) => j !== i))}
              >
                <Icon name="close" />
              </Button>
            </div>
            <Input
              value={p.caption}
              onChange={(e) => onChange(items.map((x, j) => (j === i ? { ...x, caption: e.target.value } : x)))}
              maxLength={PAGE_LIMITS.note}
              placeholder={s.caption}
              aria-label={s.caption}
              className="h-9 text-sm"
            />
          </div>
        ))}
        {!full && (
          <button
            type="button"
            disabled={pending}
            onClick={() => input.current?.click()}
            className="grid aspect-[4/3] place-items-center rounded-lg border border-dashed text-sm text-muted-foreground transition-colors hover:border-primary/40 hover:bg-primary/5 disabled:opacity-60"
          >
            <span className="flex flex-col items-center gap-1">
              <Icon name="plus" />
              {pending ? s.uploading : s.addPhoto}
            </span>
          </button>
        )}
      </div>
      <input
        ref={input}
        type="file"
        accept="image/png,image/jpeg,image/gif,image/webp"
        className="sr-only"
        onChange={(e) => {
          const f = e.target.files?.[0]
          e.target.value = ''
          if (f) upload(f, (id) => onChange([...items, { fileId: id, caption: '' }]))
        }}
      />
      {error && <p className="text-xs text-destructive">{error}</p>}
      <p className="text-xs text-muted-foreground">{s.photosHint(PAGE_LIMITS.photos)}</p>
    </div>
  )
}

/** The hero's cover photo — saved as soon as it's chosen. */
export function CoverField({ value, onSave }: { value: number | null; onSave: (id: number | null) => Promise<void> }) {
  const [current, setCurrent] = useState(value)
  const [, start] = useTransition()
  return (
    <PhotoField
      wide
      value={current}
      onChange={(id) => {
        setCurrent(id)
        start(() => onSave(id))
      }}
    />
  )
}
