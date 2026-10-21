import { ReactNode } from 'react'

/** The heading block of a public page (About, Pricing …): title, one line under it, optional actions. */
export function PublicHero({ title, sub, children }: { title: string; sub: string; children?: ReactNode }) {
  return (
    <section className="flex flex-col items-center gap-4 py-6 text-center sm:py-10">
      <h1 className="max-w-3xl text-3xl font-semibold tracking-tight text-balance sm:text-4xl">{title}</h1>
      <p className="max-w-2xl text-lg text-pretty text-muted-foreground">{sub}</p>
      {children && <div className="mt-2 flex flex-wrap justify-center gap-3">{children}</div>}
    </section>
  )
}
