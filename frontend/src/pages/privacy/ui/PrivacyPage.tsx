import { LocalLink as Link } from '@/shared/ui/local-link'
import { SITE } from '@/shared/config/site'
import { getT } from '@/shared/i18n/server'

/**
 * Public: the privacy policy, describing what Budu actually stores (keep it in step with the app).
 * The operator's legal details come from SITE.legal; until they're filled in, a plain sentence says so.
 * Have a lawyer review it before launch (152-FZ / GDPR).
 */
export async function PrivacyPage() {
  const t = await getT()
  const s = t.site.privacy
  const c = t.site.contact
  const legal = (Object.entries(SITE.legal) as Array<[keyof typeof SITE.legal, string | null]>).filter(([, v]) => v)
  return (
    <article className="mx-auto flex max-w-3xl flex-col gap-8 py-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">{s.title}</h1>
        <p className="text-sm text-muted-foreground">{s.updated}</p>
        <p className="mt-2 leading-relaxed text-muted-foreground">{s.intro}</p>
      </header>
      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold">{s.operator}</h2>
        {legal.length ? (
          <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
            {legal.map(([k, v]) => (
              <div key={k} className="contents">
                <dt className="text-muted-foreground">{c.legal[k]}</dt>
                <dd>{v}</dd>
              </div>
            ))}
          </dl>
        ) : (
          <p className="text-sm text-muted-foreground">{s.operatorPending}</p>
        )}
      </section>
      {s.sections.map((sec) => (
        <section key={sec.title} className="flex flex-col gap-2">
          <h2 className="text-lg font-semibold">{sec.title}</h2>
          <ul className="flex list-disc flex-col gap-1.5 ps-5 text-sm leading-relaxed text-muted-foreground">
            {sec.items.map((it) => (
              <li key={it}>{it}</li>
            ))}
          </ul>
        </section>
      ))}
      <p className="text-sm">
        <Link href="/contact" className="font-medium text-primary hover:underline">
          {s.contact}
        </Link>
      </p>
    </article>
  )
}
