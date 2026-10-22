import { LocalLink as Link } from '@/shared/ui/local-link'
import { SITE } from '@/shared/config/site'
import { getT } from '@/shared/i18n/server'

export type LegalText = {
  title: string
  updated: string
  intro: string
  operator: string
  operatorPending: string
  sections: ReadonlyArray<{ title: string; items: readonly string[] }>
  contact: string
}

/**
 * A legal page (privacy policy, terms of use): title + date, intro, who is responsible (SITE.legal;
 * a plain sentence until those details are filled in), the sections, and a contact link.
 */
export async function LegalDocument({ doc }: { doc: LegalText }) {
  const t = await getT()
  const c = t.site.contact
  const legal = (Object.entries(SITE.legal) as Array<[keyof typeof SITE.legal, string | null]>).filter(([, v]) => v)
  return (
    <article className="mx-auto flex max-w-3xl flex-col gap-8 py-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">{doc.title}</h1>
        <p className="text-sm text-muted-foreground">{doc.updated}</p>
        <p className="mt-2 leading-relaxed text-muted-foreground">{doc.intro}</p>
      </header>
      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold">{doc.operator}</h2>
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
          <p className="text-sm text-muted-foreground">{doc.operatorPending}</p>
        )}
      </section>
      {doc.sections.map((sec) => (
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
          {doc.contact}
        </Link>
      </p>
    </article>
  )
}
