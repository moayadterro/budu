/**
 * Languages a course can be taught in (the teacher picks one; shown on the course card and page).
 * Not the UI languages (shared/i18n) — a Russian UI can sell an English course. Names come from
 * Intl in the viewer's language.
 */
export const COURSE_LANGUAGES = ['ru', 'en', 'ar', 'tr', 'kk', 'uz', 'de', 'fr', 'es', 'zh'] as const
export type CourseLanguage = (typeof COURSE_LANGUAGES)[number]

export const isCourseLanguage = (v: unknown): v is CourseLanguage => COURSE_LANGUAGES.includes(v as CourseLanguage)

/** "Русский", "English", "العربية" … in the viewer's language. */
export function languageName(code: string, locale: string) {
  try {
    const name = new Intl.DisplayNames(locale, { type: 'language' }).of(code) ?? code
    return name.charAt(0).toLocaleUpperCase(locale) + name.slice(1)
  } catch {
    return code
  }
}
