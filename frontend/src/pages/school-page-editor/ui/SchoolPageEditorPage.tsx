import { notFound } from 'next/navigation'
import { blocksOf, pageOf } from '@/entities/school-page/server'
import { requireRole } from '@/entities/session/server'
import { isSchool, schoolPeople } from '@/entities/tenant/server'
import { BlocksEditor, CoverEditor, LogoEditor, PageSettings } from '@/features/edit-school-page'
import { appUrl } from '@/shared/server/mailer'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { ScreenHead } from '@/shared/ui/screen-head'
import { getT } from '@/shared/i18n/server'

/**
 * School manager: the school's public page (/schools/<slug>) — address & publishing, the cover, and
 * the blocks (text, photos, news, spotlight, top students). Simple on purpose: cards and a ⋯ menu.
 */
export async function SchoolPageEditorPage() {
  const user = await requireRole('manager')
  if (!user.companyId || !(await isSchool(user.companyId))) notFound()
  const [t, page, blocks, people] = await Promise.all([
    getT(),
    pageOf(user.companyId),
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
      <div className="flex min-w-0 flex-col gap-6 lg:order-1">
        <ScreenHead title={s.title} sub={s.sub} />
        <section className="flex flex-col gap-3">
          <h2 className="text-base font-semibold">{s.blocks}</h2>
          <BlocksEditor blocks={blocks} people={members} />
        </section>
      </div>
      <aside className="flex flex-col gap-4 lg:order-2 lg:sticky lg:top-20">
        <Card size="sm">
          <CardHeader>
            <CardTitle>{s.settings}</CardTitle>
          </CardHeader>
          <CardContent>
            <PageSettings page={page} origin={appUrl('/').replace(/\/$/, '')} />
          </CardContent>
        </Card>
        <Card size="sm">
          <CardHeader>
            <CardTitle>{s.logo}</CardTitle>
          </CardHeader>
          <CardContent>
            <LogoEditor value={page.logoId} name={page.name} />
          </CardContent>
        </Card>
        <Card size="sm">
          <CardHeader>
            <CardTitle>{s.cover}</CardTitle>
          </CardHeader>
          <CardContent>
            <CoverEditor value={page.coverId} />
          </CardContent>
        </Card>
      </aside>
    </div>
  )
}
