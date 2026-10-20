'use client'

import { useRef } from 'react'
import { useSession } from '@/entities/session'
import { InitialsAvatar as Avatar } from '@/shared/ui/initials-avatar'
import { Icon } from '@/shared/ui/icon'
import { t } from '@/shared/i18n'

/** Profile photo picker. Preview only for now; later uploads to the IOMAD user picture. */
export function AvatarUpload({ initials, color }: { initials: string; color: string }) {
  const photo = useSession((s) => s.photo)
  const setPhoto = useSession((s) => s.setPhoto)
  const input = useRef<HTMLInputElement>(null)

  function onPick(file: File | undefined) {
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setPhoto(reader.result as string)
    reader.readAsDataURL(file)
  }

  return (
    <div className="relative flex-none">
      <Avatar initials={initials} color={color} photo={photo} className="h-14 w-14 rounded-full text-[19px]" />
      <button
        type="button"
        aria-label={t.account.changePhoto}
        onClick={() => input.current?.click()}
        className="absolute -bottom-0.5 -end-0.5 grid h-7 w-7 place-items-center rounded-full border-2 border-card bg-primary text-primary-foreground"
      >
        <Icon name="camera" className="h-3.5 w-3.5" strokeWidth={2} />
      </button>
      <input ref={input} type="file" accept="image/*" className="hidden" onChange={(e) => onPick(e.target.files?.[0])} />
    </div>
  )
}

export function RemoveAvatar() {
  const photo = useSession((s) => s.photo)
  const setPhoto = useSession((s) => s.setPhoto)
  if (!photo) return null
  return (
    <button type="button" onClick={() => setPhoto(null)} className="mt-1.5 text-[11px] font-semibold text-destructive">
      {t.account.removePhoto}
    </button>
  )
}
