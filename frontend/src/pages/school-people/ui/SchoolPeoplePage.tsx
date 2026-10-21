import Link from 'next/link'
import { requireRole } from '@/entities/session/server'
import { pendingInvitesOf, schoolPeople } from '@/entities/tenant/server'
import { getUserById } from '@/entities/user/server'
import { cancelInviteAction } from '@/features/respond-to-invite'
import { ConfirmButton } from '@/shared/ui/confirm-button'
import { InviteForm, RoleSelect } from '@/features/invite-to-school'
import { Badge } from '@/shared/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card'
import { Item, ItemActions, ItemContent, ItemDescription, ItemMedia, ItemTitle } from '@/shared/ui/item'
import { LocalTime } from '@/shared/ui/local-time'
import { PersonAvatar } from '@/shared/ui/person-avatar'
import { ScreenHead } from '@/shared/ui/screen-head'
import { cn } from '@/shared/lib/cn'
import { getT } from '@/shared/i18n/server'

/** School manager: everyone in the school (tabs by role, plus pending invitations) + invite form. */
export async function SchoolPeoplePage({ searchParams }: { searchParams: Promise<{ role?: string }> }) {
  const user = await requireRole('manager')
  const t = await getT()
  const s = t.school
  const role = (await searchParams).role
  const filter = (['teacher', 'student', 'manager', 'invites'] as const).find((r) => r === role) ?? null
  const people = user.companyId ? await schoolPeople(user.userId, user.companyId) : []
  const shown = filter && filter !== 'invites' ? people.filter((p) => p.role === filter) : people
  const invites = user.companyId ? await pendingInvitesOf(user.companyId) : []
  const invitees = await Promise.all(invites.map(async (i) => ({ invite: i, person: await getUserById(i.userId) })))

  return (
    <div className="flex max-w-4xl flex-col gap-6">
      <ScreenHead title={s.peopleTitle} sub={s.peopleSub} />
      <Card>
        <CardHeader>
          <CardTitle>{s.inviteTitle}</CardTitle>
          <CardDescription>{s.inviteSub}</CardDescription>
        </CardHeader>
        <CardContent>
          <InviteForm />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap gap-1 rounded-lg bg-muted p-1 text-sm">
            {([null, 'teacher', 'student', 'manager', 'invites'] as const).map((r) => (
              <Link
                key={r ?? 'all'}
                href={r ? `/school/people?role=${r}` : '/school/people'}
                className={cn(
                  'rounded-md px-3 py-1.5 font-medium transition-colors',
                  filter === r ? 'bg-background shadow-xs' : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {s.filters[r ?? 'all']}{' '}
                <span className="tabular-nums text-muted-foreground">
                  ({r === 'invites' ? invitees.length : r ? people.filter((p) => p.role === r).length : people.length})
                </span>
              </Link>
            ))}
          </div>
        </CardHeader>
        {filter === 'invites' ? (
          // invitations to people who already have an account: they join only if they accept
          <CardContent className="gap-1">
            <p className="pb-2 text-sm text-muted-foreground">{t.invites.pendingSub}</p>
            {invitees.length === 0 && <p className="py-4 text-sm text-muted-foreground">{s.noInvites}</p>}
            {invitees.map(({ invite, person }) => (
              <Item key={invite.id} size="sm" className="px-0">
                <ItemMedia>
                  <PersonAvatar person={{ name: person?.name ?? '?', pictureId: null }} />
                </ItemMedia>
                <ItemContent className="min-w-0">
                  <ItemTitle className="truncate">{person?.name ?? '—'}</ItemTitle>
                  <ItemDescription className="truncate">
                    {person?.email} · <LocalTime seconds={invite.createdAt} />
                  </ItemDescription>
                </ItemContent>
                <ItemActions>
                  <Badge variant="warning">{s.awaiting}</Badge>
                  <Badge variant="secondary">{t.role[invite.role]}</Badge>
                  <form action={cancelInviteAction}>
                    <input type="hidden" name="inviteId" value={invite.id} />
                    <ConfirmButton label={t.invites.cancel} confirmLabel={t.invites.confirmCancel} />
                  </form>
                </ItemActions>
              </Item>
            ))}
          </CardContent>
        ) : (
          <CardContent className="gap-1">
            {shown.length === 0 && <p className="py-4 text-sm text-muted-foreground">{s.noPeople}</p>}
            {shown.map((p) => (
              <Item key={p.id} size="sm" className="px-0">
                <ItemMedia>
                  <PersonAvatar person={p} />
                </ItemMedia>
                <ItemContent className="min-w-0">
                  <ItemTitle className="truncate">{p.name}</ItemTitle>
                  <ItemDescription className="truncate">{p.email}</ItemDescription>
                </ItemContent>
                <ItemActions>
                  {p.pending && <Badge variant="warning">{s.pending}</Badge>}
                  {p.className && <Badge variant="outline">{p.className}</Badge>}
                  {p.id === user.userId ? <Badge variant="secondary">{t.role[p.role]}</Badge> : <RoleSelect userId={p.id} role={p.role} />}
                </ItemActions>
              </Item>
            ))}
          </CardContent>
        )}
      </Card>
    </div>
  )
}
