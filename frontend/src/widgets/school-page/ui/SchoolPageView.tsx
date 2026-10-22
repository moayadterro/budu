import Link from 'next/link'
import { Medal, type Block, type BlockData, type SchoolPage } from '@/entities/school-page'
import { BrandImage } from '@/shared/ui/brand-image'
import { Button } from '@/shared/ui/button'
import { Icon } from '@/shared/ui/icon'
import { InitialsAvatar } from '@/shared/ui/initials-avatar'
import { cn } from '@/shared/lib/cn'
import { contentDir } from '@/shared/lib/text-dir'
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
 * A school's public page: the hero (cover, logo, name, tagline, city) and its blocks in one calm,
 * readable column. Everything the manager wrote is shown as text (never HTML).
 */
export async function SchoolPageView({ page, blocks }: { page: SchoolPage; blocks: Block[] }) {
  const [t, locale] = await Promise.all([getT(), getLocale()])
  const s = t.schoolPage
  const date = new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'long', year: 'numeric' })
  const visible = blocks.filter((b) => !isEmpty(b))

  return (
    <article className="flex flex-col gap-14">
      {/* hero */}
      {/* each part reads in the language it is written in (Arabic → right-to-left), whatever the UI language */}
      <header dir={contentDir(page.name, page.tagline, page.city)} className="relative isolate flex min-h-72 flex-col justify-end overflow-hidden rounded-3xl bg-brand p-6 text-primary-foreground sm:min-h-96 sm:p-10">
        {page.coverId && (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={fileSrc(page.coverId)} alt="" className="absolute inset-0 -z-20 size-full object-cover" />
            <div className="absolute inset-0 -z-10 bg-linear-to-t from-live/85 via-live/35 to-transparent" />
          </>
        )}
        {page.logoId && (
          <BrandImage src={fileSrc(page.logoId)} className="mb-5 size-20 rounded-2xl shadow-lg ring-1 ring-foreground/10 sm:size-24" />
        )}
        <h1 className="max-w-3xl text-3xl font-semibold tracking-tight text-balance sm:text-5xl">{page.name}</h1>
        {page.tagline && <p className="mt-3 max-w-2xl text-lg text-pretty opacity-90">{page.tagline}</p>}
        {page.city && (
          <p className="mt-4 flex items-center gap-1.5 text-sm opacity-85">
            <Icon name="pin" className="size-4" />
            {page.city}
          </p>
        )}
      </header>

      <div className="mx-auto flex w-full max-w-3xl flex-col gap-14">
        {visible.length === 0 && <p className="text-center text-muted-foreground">{s.emptyPublic}</p>}
        {visible.map((b) => (
          <section key={b.id} dir={contentDir(...textsOf(b.data))} className="flex flex-col gap-5">
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

/** The words in a block (not its JSON keys), to tell its language direction. */
function textsOf(v: unknown): string[] {
  if (typeof v === 'string') return [v]
  if (Array.isArray(v)) return v.flatMap(textsOf)
  if (v && typeof v === 'object') return Object.values(v).flatMap(textsOf)
  return []
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
                <bdi>{date.format(new Date(`${n.date}T12:00:00`))}</bdi>
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
            <span>{d.label}</span>
          </span>
        )}
        {d.name && <h2 className="text-2xl font-semibold tracking-tight text-balance">{d.name}</h2>}
        {d.text && <p className="leading-relaxed whitespace-pre-line text-muted-foreground">{d.text}</p>}
      </div>
    </div>
  )
}

/** Per place: where it stands on the podium (2 · 1 · 3), how big, how tall its step. */
const PODIUM = [
  { order: 'order-2', avatar: 'size-24 text-3xl sm:size-36 sm:text-4xl', medal: 'size-9 text-base sm:size-11 sm:text-lg', name: 'text-base sm:text-xl', step: 'h-24 from-gold/45 sm:h-32 dark:from-gold/25' },
  { order: 'order-1', avatar: 'size-20 text-2xl sm:size-28 sm:text-3xl', medal: 'size-8 text-sm sm:size-9 sm:text-base', name: 'text-sm sm:text-lg', step: 'h-16 from-silver/55 sm:h-20 dark:from-silver/25' },
  { order: 'order-3', avatar: 'size-20 text-2xl sm:size-28 sm:text-3xl', medal: 'size-8 text-sm sm:size-9 sm:text-base', name: 'text-sm sm:text-lg', step: 'h-10 from-bronze/45 sm:h-12 dark:from-bronze/25' },
]

/**
 * The top 3 as a podium: the winner in the middle, raised and glowing, 2nd and 3rd beside. No cards —
 * people on soft steps that fade into the page. (Reading order stays 1, 2, 3 for screen readers.)
 */
function TopBlock({ d, title }: { d: BlockData['top']; title: string }) {
  return (
    <>
      <H2>{d.heading || title}</H2>
      <ol className="grid grid-cols-3 items-end gap-2 sm:gap-6">
        {d.items.map((x, i) => {
          const p = PODIUM[i]!
          return (
            <li key={i} className={cn('flex min-w-0 flex-col items-center text-center', p.order)}>
              <span className="relative isolate" aria-hidden>
                {i === 0 && <span className="absolute inset-0 -z-10 scale-150 rounded-full bg-gold/40 blur-2xl dark:bg-gold/20" />}
                {/* their profile photo when they are a member with one, else their initials */}
                {x.fileId ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={fileSrc(x.fileId)} alt="" loading="lazy" className={cn('rounded-full object-cover shadow-lg ring-4 ring-background', p.avatar)} />
                ) : (
                  <InitialsAvatar initials={initials(x.name)} color="var(--color-primary)" className={cn('shadow-lg ring-4 ring-background', p.avatar)} />
                )}
                <Medal place={i + 1} className={cn('absolute -end-0.5 -bottom-0.5', p.medal)} />
              </span>
              <span className="sr-only">{i + 1}.</span>
              <p className={cn('mt-3 w-full font-semibold text-balance break-words', p.name)}>{x.name}</p>
              {x.note && <p className="mt-0.5 w-full text-xs text-balance text-muted-foreground sm:text-sm">{x.note}</p>}
              <span aria-hidden className={cn('mt-4 w-full rounded-t-3xl bg-linear-to-b to-transparent', p.step)} />
            </li>
          )
        })}
      </ol>
    </>
  )
}
