import 'server-only'
import type { Metadata } from 'next'
import { DEFAULT_LOCALE, LANGUAGES, localePath, type Locale } from '@/shared/i18n'
import { getLocale, getT } from '@/shared/i18n/server'
import type { Messages } from '@/shared/i18n'

/** Open Graph wants "ll_CC"; languages not listed here fall back to their plain code. */
const OG_LOCALE: Partial<Record<Locale, string>> = { en: 'en_US', ru: 'ru_RU', ar: 'ar_AR' }
const og = (l: Locale) => OG_LOCALE[l] ?? l

type StaticPage = 'home' | 'catalog' | 'schools' | 'pricing' | 'about' | 'help' | 'contact' | 'privacy' | 'terms'

/**
 * Metadata for a public page that exists in every language (SEO): title, description, its own
 * address in this language as canonical, every language version as hreflang alternates (English is
 * x-default) and Open Graph / Twitter cards. `path` is the English address ("/pricing").
 */
export async function pageMetadata({
  path,
  title,
  description,
  image,
}: {
  path: string
  title: string | { absolute: string }
  description: string
  image?: string | null
}): Promise<Metadata> {
  const locale = await getLocale()
  const plainTitle = typeof title === 'string' ? title : title.absolute
  return {
    title,
    description,
    alternates: {
      canonical: localePath(path, locale),
      languages: { ...Object.fromEntries(LANGUAGES.map((l) => [l.code, localePath(path, l.code)])), 'x-default': localePath(path, DEFAULT_LOCALE) },
    },
    openGraph: {
      type: 'website',
      siteName: 'Budu',
      title: plainTitle,
      description,
      url: localePath(path, locale),
      locale: og(locale),
      alternateLocale: LANGUAGES.filter((l) => l.code !== locale).map((l) => og(l.code)),
      images: image ? [image] : undefined,
    },
    twitter: { card: image ? 'summary_large_image' : 'summary', title: plainTitle, description },
  }
}

/** generateMetadata for a fixed public page, from `t.seo[page]`: `export const generateMetadata = staticPageMetadata('pricing', '/pricing')`. */
export const staticPageMetadata = (page: StaticPage, path: string) => async (): Promise<Metadata> => {
  const s: Messages['seo'][StaticPage] = (await getT()).seo[page]
  // the home page's title is complete on its own (no " · Budu" suffix)
  return pageMetadata({ path, title: page === 'home' ? { absolute: s.title } : s.title, description: s.description })
}

/** A description from free text: one line, at most ~160 characters, cut at a word. */
export function snippet(text: string, max = 160) {
  const one = text.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
  if (one.length <= max) return one
  const cut = one.slice(0, max - 1)
  return `${cut.slice(0, Math.max(cut.lastIndexOf(' '), max * 0.6))}…`
}
