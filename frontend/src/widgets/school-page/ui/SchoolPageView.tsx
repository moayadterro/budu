import Link from 'next/link'
import type { Block, BlockData, SchoolPage } from '@/entities/school-page'
import { Button } from '@/shared/ui/button'
import { Icon } from '@/shared/ui/icon'
import { InitialsAvatar } from '@/shared/ui/initials-avatar'
import { cn } from '@/shared/lib/cn'
import { getLocale, getT } from '@/shared/i18n/server'

const fileSrc = (id: number) => `/files/${id}`
const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join('')

/**
 * A school's public page: the hero (cover, name, tagline, city · since) and its blocks in one calm,
 * readable column. Everything the manager wrote is shown as text (never HTML).
 */
export async function SchoolPageView({ page, blocks }: { page: SchoolPage; blocks: Block[] }) {
  const [t, locale] = await Promise.all([getT(), getLocale()])
  const s = t.schoolPage
  const year = new Date(page.since * 1000).getFullYear()
  const date = new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'long', year: 'numeric' })
  const visible = blocks.filter((b) => !isEmpty(b))

  return (
    <article className="flex flex-col gap-14">
      {/* hero */}
      <header className="relative isolate flex min-h-72 flex-col justify-end overflow-hidden rounded-3xl bg-brand p-6 text-primary-foreground sm:min-h-96 sm:p-10">
        {page.coverId && (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={fileSrc(page.coverId)} alt="" className="absolute inset-0 -z-20 size-full object-cover" />
            <div className="absolute inset-0 -z-10 bg-linear-to-t from-live/85 via-live/35 to-transparent" />
          </>
        )}
        {page.logoId && (
          <span className="mb-5 grid size-20 place-items-center overflow-hidden rounded-2xl bg-background p-2.5 shadow-lg ring-1 ring-foreground/10 sm:size-24">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={fileSrc(page.logoId)} alt="" className="size-full object-contain" />
          </span>
        )}
        <h1 className="max-w-3xl text-3xl font-semibold tracking-tight text-balance sm:text-5xl">{page.name}</h1>
        {page.tagline && <p className="mt-3 max-w-2xl text-lg text-pretty opacity-90">{page.tagline}</p>}
        <p className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm opacity-85">
          {page.city && (
            <span className="inline-flex items-center gap-1.5">
              <Icon name="pin" className="size-4" />
              {page.city}
            </span>
          )}
          <span>{s.since(year)}</span>
        </p>
      </header>

      <div className="mx-auto flex w-full max-w-3xl flex-col gap-14">
        {visible.length === 0 && <p className="text-center text-muted-foreground">{s.emptyPublic}</p>}
        {visible.map((b) => (
          <section key={b.id} className="flex flex-col gap-5">
            {b.kind === 'text' && <TextBlock d={b.data as BlockData['text']} />}
            {b.kind === 'photos' && <PhotosBlock d={b.data as BlockData['photos']} />}
            {b.kind === 'news' && <NewsBlock d={b.data as BlockData['news']} date={date} title={s.newsDefault} />}
            {b.kind === 'spotlight' && <SpotlightBlock d={b.data as BlockData['spotlight']} />}
            {b.kind === 'top' && <TopBlock d={b.data as BlockData['top']} title={s.topDefault} />}
          </section>
        ))}

        <section className="flex flex-col items-center gap-4 rounded-2xl border bg-muted/40 px-6 py-10 text-center">
          <h2 className="text-xl font-semibold tracking-tight">{s.ctaTitle(page.name)}</h2>
          <p className="max-w-md text-sm text-muted-foreground">{s.ctaSub}</p>
          <div className="flex flex-wrap justify-center gap-3">
            <Button asChild>
              <Link href="/register">{s.ctaJoin}</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/schools">{s.ctaMore}</Link>
            </Button>
          </div>
        </section>
      </div>
    </article>
  )
}

function isEmpty(b: Block) {
  const d = b.data as unknown as Record<string, unknown>
  switch (b.kind) {
    case 'text':
      return !d.heading && !d.body
    case 'spotlight':
      return !d.name && !d.text
    default:
      return !(d.items as unknown[])?.length
  }
}

const H2 = ({ children }: { children: React.ReactNode }) => <h2 className="text-2xl font-semibold tracking-tight text-balance">{children}</h2>

function TextBlock({ d }: { d: BlockData['text'] }) {
  return (
    <>
      {d.heading && <H2>{d.heading}</H2>}
      {d.body && <p className="text-lg leading-relaxed whitespace-pre-line text-pretty text-foreground/85">{d.body}</p>}
    </>
  )
}

function PhotosBlock({ d }: { d: BlockData['photos'] }) {
  const n = d.items.length
  const one = n === 1
  return (
    <>
      {d.heading && <H2>{d.heading}</H2>}
      <div className={cn('grid gap-3', one ? 'grid-cols-1' : n === 2 || n === 4 ? 'grid-cols-2' : 'grid-cols-2 sm:grid-cols-3')}>
        {d.items.map((p, i) => (
          <figure key={p.fileId} className={cn('flex flex-col gap-2', (n === 3 || n === 5) && i === 0 && 'col-span-2 row-span-2')}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={fileSrc(p.fileId)} alt={p.caption} loading="lazy" className="aspect-[4/3] w-full flex-1 rounded-2xl border object-cover" />
            {p.caption && <figcaption className="text-sm text-muted-foreground">{p.caption}</figcaption>}
          </figure>
        ))}
      </div>
    </>
  )
}

function NewsBlock({ d, date, title }: { d: BlockData['news']; date: Intl.DateTimeFormat; title: string }) {
  const items = [...d.items].sort((a, b) => b.date.localeCompare(a.date))
  return (
    <>
      <H2>{d.heading || title}</H2>
      <ol className="flex flex-col gap-4">
        {items.map((n) => (
          <li key={n.id} className="overflow-hidden rounded-2xl border bg-card">
            {n.fileId && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={fileSrc(n.fileId)} alt="" loading="lazy" className="aspect-[2/1] w-full object-cover" />
            )}
            <div className="flex flex-col gap-2 p-5">
              <time dateTime={n.date} className="text-xs font-medium tracking-wide text-primary uppercase">
                {date.format(new Date(`${n.date}T12:00:00`))}
              </time>
              {n.title && <h3 className="text-lg font-semibold text-balance">{n.title}</h3>}
              {n.body && <p className="leading-relaxed whitespace-pre-line text-muted-foreground">{n.body}</p>}
            </div>
          </li>
        ))}
      </ol>
    </>
  )
}

function SpotlightBlock({ d }: { d: BlockData['spotlight'] }) {
  return (
    <div className="grid overflow-hidden rounded-3xl border bg-card sm:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
      <div className="relative aspect-square bg-muted sm:aspect-auto">
        {d.fileId ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={fileSrc(d.fileId)} alt={d.name} className="absolute inset-0 size-full object-cover" />
        ) : (
          <div className="grid size-full place-items-center p-10">
            <InitialsAvatar initials={initials(d.name || '★')} color="var(--color-primary)" className="size-28 text-3xl" />
          </div>
        )}
      </div>
      <div className="flex flex-col justify-center gap-3 p-6 sm:p-8">
        {d.label && (
          <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-highlight px-3 py-1 text-xs font-semibold text-highlight-foreground">
            <Icon name="star" className="size-3.5" />
            {d.label}
          </span>
        )}
        {d.name && <h2 className="text-2xl font-semibold tracking-tight text-balance">{d.name}</h2>}
        {d.text && <p className="leading-relaxed whitespace-pre-line text-muted-foreground">{d.text}</p>}
      </div>
    </div>
  )
}

const MEDAL = ['🥇', '🥈', '🥉']

function TopBlock({ d, title }: { d: BlockData['top']; title: string }) {
  return (
    <>
      <H2>{d.heading || title}</H2>
      <ol className="grid gap-3 sm:grid-cols-3">
        {d.items.map((x, i) => (
          <li
            key={i}
            className={cn('flex flex-col items-center gap-2 rounded-2xl border bg-card p-6 text-center', i === 0 && 'border-highlight/50 bg-highlight/5 sm:-translate-y-2')}
          >
            <span className="text-4xl" aria-hidden>
              {MEDAL[i]}
            </span>
            <span className="sr-only">{i + 1}.</span>
            <p className="text-lg font-semibold text-balance">{x.name}</p>
            {x.note && <p className="text-sm text-muted-foreground">{x.note}</p>}
          </li>
        ))}
      </ol>
    </>
  )
}
