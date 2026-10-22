'use client'

import { useRouter } from 'next/navigation'
import { useRef, useState, useTransition } from 'react'
import { BrandImage } from '@/shared/ui/brand-image'
import { ConfirmDialog } from '@/shared/ui/confirm-button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/shared/ui/dropdown-menu'
import { Icon } from '@/shared/ui/icon'
import { cn } from '@/shared/lib/cn'
import { useT } from '@/shared/i18n'
import { setCoverAction, setLogoAction, uploadPhotoAction } from '../server/actions'

const TYPES = 'image/png,image/jpeg,image/gif,image/webp'

/**
 * The top of the school page editor, like a profile: the cover across the top and the logo
 * overlapping it, with the school's name and city — what visitors see first. Each image has a small
 * camera button: empty → pick a file; set → a menu (Change · Remove, Remove asks first). Saved at once.
 */
export function ProfileHeader({ name, city, coverId, logoId }: { name: string; city: string; coverId: number | null; logoId: number | null }) {
  const t = useT()
  const s = t.schoolPage.editor
  const router = useRouter()
  const [cover, setCover] = useState(coverId)
  const [logo, setLogo] = useState(logoId)
  const [busy, setBusy] = useState<'cover' | 'logo' | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [, start] = useTransition()

  const saveCover = (file: File | null) =>
    start(async () => {
      setBusy('cover')
      setError(null)
      let id: number | null = null
      if (file) {
        const fd = new FormData()
        fd.set('photo', file)
        const r = await uploadPhotoAction(fd)
        if (!r.ok) {
          setBusy(null)
          return setError(s.photoErrors[r.error])
        }
        id = r.id
      }
      await setCoverAction(id)
      setCover(id)
      setBusy(null)
      router.refresh()
    })

  const saveLogo = (file: File | null) =>
    start(async () => {
      setBusy('logo')
      setError(null)
      const fd = new FormData()
      if (file) fd.set('photo', file)
      const r = await setLogoAction(fd)
      setBusy(null)
      if (!r.ok) return setError(s.photoErrors[r.error])
      setLogo(r.id || null)
      router.refresh()
    })

  return (
    <section className="overflow-hidden rounded-3xl border bg-card">
      {/* cover */}
      <div className="relative h-36 bg-brand sm:h-52">
        {cover && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={`/files/${cover}`} alt="" className="absolute inset-0 size-full object-cover" />
        )}
        {busy === 'cover' && <Busy />}
        <div className="absolute end-3 top-3">
          <ImageButton label={s.changeCover} has={!!cover} onFile={saveCover} confirmTitle={s.removeCoverTitle(name)} />
        </div>
      </div>

      {/* logo + name */}
      <div className="flex items-end gap-4 px-5 pb-5 sm:px-6">
        <div className="relative -mt-10 flex-none sm:-mt-12">
          <div className="relative size-24 overflow-hidden rounded-2xl bg-card shadow-md ring-4 ring-card sm:size-28">
            {logo ? (
              <BrandImage key={logo} src={`/files/${logo}`} alt={name} className="size-full" />
            ) : (
              <span className="grid size-full place-items-center bg-muted text-muted-foreground">
                <Icon name="image" className="size-7" />
              </span>
            )}
            {busy === 'logo' && <Busy />}
          </div>
          <div className="absolute -end-2 -bottom-2">
            <ImageButton label={s.changeLogo} has={!!logo} onFile={saveLogo} confirmTitle={s.removeLogoTitle(name)} />
          </div>
        </div>
        <div className="min-w-0 pt-3 pb-1">
          <h1 dir="auto" className="truncate text-xl font-semibold tracking-tight sm:text-2xl">
            {name}
          </h1>
          {city && (
            <p className="mt-0.5 flex items-center gap-1 text-sm text-muted-foreground">
              <Icon name="pin" className="size-3.5" />
              <span dir="auto" className="truncate">
                {city}
              </span>
            </p>
          )}
        </div>
      </div>
      {error && <p className="px-5 pb-4 text-sm text-destructive sm:px-6">{error}</p>}
    </section>
  )
}

function Busy() {
  return (
    <span className="absolute inset-0 grid place-items-center bg-background/50 backdrop-blur-[2px]">
      <span className="size-6 animate-spin rounded-full border-2 border-foreground/20 border-t-foreground motion-reduce:animate-none" />
    </span>
  )
}

/** A round glass camera button: no image yet → opens the file picker; otherwise Change · Remove. */
function ImageButton({ label, has, onFile, confirmTitle }: { label: string; has: boolean; onFile: (f: File | null) => void; confirmTitle: string }) {
  const t = useT()
  const s = t.schoolPage.editor
  const input = useRef<HTMLInputElement>(null)
  const [confirming, setConfirming] = useState(false)
  const pick = () => input.current?.click()
  const look = 'grid size-9 place-items-center rounded-full bg-background/85 text-foreground shadow-md ring-1 ring-foreground/10 backdrop-blur transition-colors hover:bg-background focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none'

  return (
    <>
      {has ? (
        <DropdownMenu modal={false}>
          <DropdownMenuTrigger asChild>
            <button type="button" aria-label={label} title={label} className={look}>
              <Icon name="camera" className="size-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-44">
            <DropdownMenuItem onSelect={pick}>
              <Icon name="upload" />
              {s.changePhoto}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onSelect={() => setConfirming(true)}>
              <Icon name="trash" />
              {s.removePhoto}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        <button type="button" aria-label={label} title={label} onClick={pick} className={cn(look)}>
          <Icon name="camera" className="size-4" />
        </button>
      )}
      <ConfirmDialog open={confirming} onOpenChange={setConfirming} label={s.removePhoto} confirmLabel={confirmTitle} onConfirm={() => onFile(null)} />
      <input
        ref={input}
        type="file"
        accept={TYPES}
        className="sr-only"
        tabIndex={-1}
        onChange={(e) => {
          const f = e.target.files?.[0]
          e.target.value = ''
          if (f) onFile(f)
        }}
      />
    </>
  )
}
