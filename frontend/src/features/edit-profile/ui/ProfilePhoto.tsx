'use client'

import { useActionState, useRef } from 'react'
import { initialsOf, pictureUrl, useSession } from '@/entities/session'
import { Alert } from '@/shared/ui/alert'
import { Button } from '@/shared/ui/button'
import { ConfirmButton } from '@/shared/ui/confirm-button'
import { Icon } from '@/shared/ui/icon'
import { InitialsAvatar } from '@/shared/ui/initials-avatar'
import { useT } from '@/shared/i18n'
import { removePhoto, updatePhoto } from '../server/actions'
import { PHOTO_TYPES, type ProfileState } from '../model/types'

const idle: ProfileState = { status: 'idle' }

/** Profile photo: pick an image → uploads at once; remove when one is set. */
export function ProfilePhoto() {
  const t = useT()
  const user = useSession((s) => s.user)
  const [state, action, pending] = useActionState(updatePhoto, idle)
  const form = useRef<HTMLFormElement>(null)
  const input = useRef<HTMLInputElement>(null)
  const s = t.account

  return (
    <div className="flex flex-col gap-3">
      {state.status === 'error' && <Alert variant="destructive">{s.errors[state.error]}</Alert>}
      <div className="flex items-center gap-4">
        <InitialsAvatar
          initials={initialsOf(user.name)}
          color="var(--color-primary)"
          photo={pictureUrl(user.pictureId)}
          className="size-16 rounded-full text-lg"
        />
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap gap-2">
            <form ref={form} action={action}>
              <input
                ref={input}
                type="file"
                name="photo"
                accept={PHOTO_TYPES.join(',')}
                className="sr-only"
                onChange={() => form.current?.requestSubmit()}
              />
              <Button type="button" variant="outline" size="sm" disabled={pending} onClick={() => input.current?.click()}>
                <Icon name="camera" />
                {pending ? s.uploading : s.changePhoto}
              </Button>
            </form>
            {user.pictureId && (
              <form action={removePhoto}>
                <ConfirmButton label={s.removePhoto} confirmLabel={t.confirm.photoTitle} disabled={pending} />
              </form>
            )}
          </div>
          <p className="text-xs text-muted-foreground">{s.photoHint}</p>
        </div>
      </div>
    </div>
  )
}
