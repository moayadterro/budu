'use client'

import { initialsOf, useSession } from '@/entities/session'
import { SignOutButton } from '@/features/sign-out'
import { ThemePicker } from '@/features/switch-theme'
import { AvatarUpload, RemoveAvatar } from '@/features/upload-avatar'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { NativeSelect as Select, NativeSelectOption } from '@/shared/ui/native-select'
import { ScreenHead } from '@/shared/ui/screen-head'
import { t } from '@/shared/i18n'

const LANGUAGES: Array<[string, string]> = [
  ['en', 'English'],
  ['ru', 'Русский'],
  ['ar', 'العربية'],
]

/** Personal settings: profile photo, language, theme. */
export function AccountPage() {
  const user = useSession((s) => s.user)
  return (
    <div className="flex max-w-[640px] flex-col gap-4">
      <ScreenHead title={t.account.title} sub={t.account.sub} />
      <Card>
        <CardContent className="flex-row items-center gap-4">
        <AvatarUpload initials={initialsOf(user.name)} color="var(--color-primary)" />
        <div className="min-w-0 flex-1">
          <b className="block text-base font-medium">{user.name}</b>
          <div className="text-xs text-muted-foreground">
            {t.role[user.role]} · {user.email}
          </div>
          <RemoveAvatar />
        </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>{t.account.language}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-3 mt-1 text-xs text-muted-foreground">{t.account.languageHint}</p>
          <Select defaultValue="en">
            {LANGUAGES.map(([code, name]) => (
              <option key={code} value={code} disabled={code !== 'en'}>
                {code === 'en' ? name : `${name} — ${t.account.soon}`}
              </option>
            ))}
          </Select>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>{t.account.theme}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-3 mt-1 text-xs text-muted-foreground">{t.account.themeHint}</p>
          <ThemePicker />
        </CardContent>
      </Card>
      <div>
        <SignOutButton />
      </div>
    </div>
  )
}
