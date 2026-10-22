import { notFound } from 'next/navigation'
import { blocksOf, ensureSlug, pageOf } from '@/entities/school-page/server'
import { requireRole } from '@/entities/session/server'
import { isSchool, schoolPeople } from '@/entities/tenant/server'
import { BlocksEditor, ProfileHeader, PublishCard } from '@/features/edit-school-page'
import { appUrl } from '@/shared/server/mailer'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { getT } from '@/shared/i18n/server'

/**
 * School manager: the school's public page (/schools/<slug>). On top, like a profile: cover + logo
 * (changed right there) with the name and city; then the blocks (text, photos, news, spotlight,
 * top students) and, aside, the address & publishing. Simple on purpose: cards and a ⋯ menu.
 */
export async function SchoolPageEditorPage() {
  const user = await requireRole('manager')
  if (!user.companyId || !(await isSchool(user.companyId))) notFound()
  const first = await pageOf(user.companyId)
  if (!first) notFound()
  // every school has an address, made from its name the first time (changed in Settings)
  const slug = first.slug ?? (await ensureSlug(user.companyId, first.name))
  const [t, page, blocks, people] = await Promise.all([
    getT(),
    first.slug ? first : pageOf(user.companyId),
    blocksOf(user.companyId),
    schoolPeople(user.userId, user.companyId).catch(() => []),
  ])
  if (!page) notFound()
  const s = t.schoolPage.editor
  const members = people
    .filter((p) => !p.pending)
    .map((p) => ({ name: p.name, pictureId: p.pictureId }))
    .sort((a, b) => a.name.localeCompare(b.name))
  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
      <div className="lg:col-span-2">
        <ProfileHeader name={page.name} tagline={page.tagline} city={page.city} coverId={page.coverId} logoId={page.logoId} />
      </div>
      <div className="flex min-w-0 flex-col gap-6 lg:order-1">
        <section className="flex flex-col gap-3">
          <h2 className="text-base font-semibold">{s.blocks}</h2>
          <BlocksEditor blocks={blocks} people={members} />
        </section>
      </div>
      <aside className="flex flex-col gap-4 lg:order-2 lg:sticky lg:top-20">
        <Card size="sm">
          <CardHeader>
            <CardTitle>{s.publishing}</CardTitle>
          </CardHeader>
          <CardContent>
            <PublishCard slug={slug} published={page.published} origin={appUrl('/').replace(/\/$/, '')} />
          </CardContent>
        </Card>
      </aside>
    </div>
  )
}
