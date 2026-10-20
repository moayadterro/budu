import { requireRole } from '@/entities/session/server'
import { getAccount } from '@/entities/user/server'
import { NameForm, PasswordForm, ProfilePhoto } from '@/features/edit-profile'
import { SignOutButton } from '@/features/sign-out'
import { LanguagePicker } from '@/features/switch-language'
import { ThemePicker } from '@/features/switch-theme'
import { ROLES } from '@/shared/config/nav'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card'
import { Separator } from '@/shared/ui/separator'
import { ScreenHead } from '@/shared/ui/screen-head'
import { getT } from '@/shared/i18n/server'

/** Personal settings: profile (photo, name), password, language, theme. */
export async function AccountPage() {
  const t = await getT()
  const user = await requireRole(...ROLES)
  const account = await getAccount(user.email)
  const [first = '', ...rest] = user.name.split(' ')
  const firstName = account.found ? account.firstname : first
  const lastName = account.found ? account.lastname : rest.join(' ')
  const s = t.account

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <ScreenHead title={s.title} sub={s.sub} />

      <Card>
        <CardHeader>
          <CardTitle>{s.profile}</CardTitle>
          <CardDescription>{s.profileHint}</CardDescription>
        </CardHeader>
        <CardContent className="gap-6">
          <ProfilePhoto />
          <Separator />
          <NameForm firstName={firstName} lastName={lastName} email={user.email} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{s.password}</CardTitle>
          <CardDescription>{s.passwordHint}</CardDescription>
        </CardHeader>
        <CardContent>
          <PasswordForm />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{s.language}</CardTitle>
          <CardDescription>{s.languageHint}</CardDescription>
        </CardHeader>
        <CardContent>
          <LanguagePicker />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{s.theme}</CardTitle>
          <CardDescription>{s.themeHint}</CardDescription>
        </CardHeader>
        <CardContent>
          <ThemePicker />
        </CardContent>
      </Card>

      <div>
        <SignOutButton />
      </div>
    </div>
  )
}
