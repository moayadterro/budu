import { requireRole } from '@/entities/session/server'
import { getFamily, requestsOfChild } from '@/entities/family/server'
import { getAccount } from '@/entities/user/server'
import { AddParentForm, CancelParentRequestButton, RemoveParentButton } from '@/features/add-parent'
import { NameForm, PasswordForm, ProfilePhoto } from '@/features/edit-profile'
import { SignOutButton } from '@/features/sign-out'
import { LanguagePicker } from '@/features/switch-language'
import { ThemePicker } from '@/features/switch-theme'
import { ROLES } from '@/shared/config/nav'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card'
import { Item, ItemActions, ItemContent, ItemDescription, ItemMedia, ItemTitle } from '@/shared/ui/item'
import { PersonAvatar } from '@/shared/ui/person-avatar'
import { Separator } from '@/shared/ui/separator'
import { ScreenHead } from '@/shared/ui/screen-head'
import { getT } from '@/shared/i18n/server'

/** Personal settings: profile (photo, name), parents (students), password, language, theme. */
export async function AccountPage() {
  const t = await getT()
  const user = await requireRole(...ROLES)
  const isStudent = user.role === 'student'
  const [account, family, sent] = await Promise.all([
    getAccount(user.email),
    isStudent ? getFamily(user.userId) : null,
    isStudent ? requestsOfChild(user.userId) : [],
  ])
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

      {family && (
        <Card id="parents" className="scroll-mt-20">
          <CardHeader>
            <CardTitle>{t.family.parentsTitle}</CardTitle>
            <CardDescription>{t.family.parentsSub}</CardDescription>
          </CardHeader>
          <CardContent className="gap-4">
            {family.parents.length === 0 && sent.length === 0 && <p className="text-sm text-muted-foreground">{t.family.noParents}</p>}
            {(family.parents.length > 0 || sent.length > 0) && (
              <div className="flex flex-col gap-1">
                {family.parents.map((p) => (
                  <Item key={p.id} size="sm" className="px-0">
                    <ItemMedia>
                      <PersonAvatar person={p} />
                    </ItemMedia>
                    <ItemContent className="min-w-0">
                      <ItemTitle className="truncate">{p.name}</ItemTitle>
                      <ItemDescription className="truncate">{p.email}</ItemDescription>
                    </ItemContent>
                    <ItemActions>
                      <RemoveParentButton parentId={p.id} />
                    </ItemActions>
                  </Item>
                ))}
                {sent.map((r) => (
                  <Item key={`r${r.id}`} size="sm" className="px-0">
                    <ItemMedia>
                      <PersonAvatar person={{ name: r.parentName, pictureId: null }} />
                    </ItemMedia>
                    <ItemContent className="min-w-0">
                      <ItemTitle className="truncate">{r.parentName}</ItemTitle>
                      <ItemDescription className="truncate">
                        {r.parentEmail} · {t.family.waiting}
                      </ItemDescription>
                    </ItemContent>
                    <ItemActions>
                      <CancelParentRequestButton requestId={r.id} />
                    </ItemActions>
                  </Item>
                ))}
              </div>
            )}
            <Separator />
            <AddParentForm />
          </CardContent>
        </Card>
      )}

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
