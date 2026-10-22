'use client'

import { useRouter } from 'next/navigation'
import { useRef, useState, useTransition } from 'react'
import { BrandImage } from '@/shared/ui/brand-image'
import { Button } from '@/shared/ui/button'
import { Icon } from '@/shared/ui/icon'
import { useT } from '@/shared/i18n'
import { setLogoAction } from '../server/actions'

/** The school's logo, icon or photo: a square preview (fits logos, fills photos), Upload / Change, Remove. Saved at once (IOMAD's company logo). */
export function LogoEditor({ value, name }: { value: number | null; name: string }) {
  const t = useT()
  const s = t.schoolPage.editor
  const router = useRouter()
  const input = useRef<HTMLInputElement>(null)
  const [current, setCurrent] = useState(value)
  const [error, setError] = useState<string | null>(null)
  const [pending, start] = useTransition()

  const send = (file: File | null) =>
    start(async () => {
      setError(null)
      const fd = new FormData()
      if (file) fd.set('photo', file)
      const r = await setLogoAction(fd)
      if (!r.ok) return setError(s.photoErrors[r.error])
      setCurrent(r.id || null)
      router.refresh()
    })

  return (
    <div className="flex items-center gap-4">
      {current ? (
        <BrandImage key={current} src={`/files/${current}`} alt={name} className="size-20 flex-none rounded-2xl border" />
      ) : (
        <span className="grid size-20 flex-none place-items-center rounded-2xl border border-dashed text-muted-foreground">
          <Icon name="image" className="size-6" />
        </span>
      )}
      <div className="flex flex-col items-start gap-2">
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" size="sm" disabled={pending} onClick={() => input.current?.click()}>
            <Icon name="camera" />
            {pending ? s.uploading : current ? s.changePhoto : s.addLogo}
          </Button>
          {current && (
            <Button type="button" variant="ghost" size="sm" className="text-muted-foreground" disabled={pending} onClick={() => send(null)}>
              {s.removePhoto}
            </Button>
          )}
        </div>
        {error && <p className="text-xs text-destructive">{error}</p>}
      </div>
      <input
        ref={input}
        type="file"
        accept="image/png,image/jpeg,image/gif,image/webp"
        className="sr-only"
        onChange={(e) => {
          const f = e.target.files?.[0]
          e.target.value = ''
          if (f) send(f)
        }}
      />
    </div>
  )
}
