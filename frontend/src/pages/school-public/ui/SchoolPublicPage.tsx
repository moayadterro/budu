import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { blocksOf, pageBySlug } from '@/entities/school-page/server'
import { getSession } from '@/entities/session/server'
import { SchoolPageView } from '@/widgets/school-page'
import { Alert } from '@/shared/ui/alert'
import { getT } from '@/shared/i18n/server'
import { pageMetadata, snippet } from '@/shared/server/seo'

type Props = { params: Promise<{ slug: string }> }

/** Who may see an unpublished page: its own school's managers (a preview while they build it). */
async function viewerManages(companyId: number) {
  const user = await getSession()
  return user?.role === 'manager' && user.companyId === companyId
}

async function load(slug: string) {
  const any = await pageBySlug(slug, true)
  if (!any) return null
  if (any.published) return { page: any, draft: false }
  return (await viewerManages(any.companyId)) ? { page: any, draft: true } : null
}

export async function generateSchoolMetadata({ params }: Props): Promise<Metadata> {
  const slug = (await params).slug
  const r = await load(slug)
  if (!r) return {}
  if (r.draft) return { title: r.page.name, robots: { index: false } } // a manager's preview
  const t = await getT()
  return pageMetadata({
    path: `/schools/${slug}`,
    title: r.page.name,
    description: snippet(r.page.tagline || t.seo.schools.description),
    image: r.page.coverId || r.page.logoId ? `/files/${r.page.coverId || r.page.logoId}` : null,
  })
}

/** Public: a school's own page (/schools/<slug>) — published ones for everybody, drafts for its managers. */
export async function SchoolPublicPage({ params }: Props) {
  const r = await load((await params).slug)
  if (!r) notFound()
  const [t, blocks] = await Promise.all([getT(), blocksOf(r.page.companyId)])
  return (
    <>
      {r.draft && (
        <Alert variant="info" className="mb-6">
          {t.schoolPage.draftBanner}
        </Alert>
      )}
      <SchoolPageView page={r.page} blocks={blocks} />
    </>
  )
}
