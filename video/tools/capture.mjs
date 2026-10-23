// Screens of Budu for the product video: signs in as each demo person (local dev app, demo logins
// from the git-ignored credentials file) and saves 1920×1080 @2x JPGs of their key screens.
import puppeteer from 'puppeteer-core'
import { mkdirSync, readFileSync } from 'node:fs'

const BASE = 'http://localhost:3000'
const OUT = new URL('../budu-promo/assets/screens/', import.meta.url).pathname
mkdirSync(OUT, { recursive: true })
const creds = readFileSync(new URL('../../frontend/scripts/demo-accounts.local.md', import.meta.url), 'utf8')
const PASSWORD = creds.match(/`([^`]+)`/)[1]
const only = process.argv[2] // optional: capture one role only

const browser = await puppeteer.launch({
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: true,
  defaultViewport: { width: 1920, height: 1080, deviceScaleFactor: 2 },
  args: ['--hide-scrollbars', '--lang=ru-RU'],
})
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function session(email, scheme = 'light') {
  const ctx = await browser.createBrowserContext()
  const page = await ctx.newPage()
  // the app follows the system theme: show the light one (what most people see)
  await page.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: scheme }])
  await page.setCookie({ name: 'budu_locale', value: 'ru', url: BASE })
  if (email) {
    await page.goto(`${BASE}/login`, { waitUntil: 'networkidle2' })
    await page.type('input[name=email]', email)
    await page.type('input[name=password]', PASSWORD)
    await Promise.all([page.waitForNavigation({ waitUntil: 'networkidle2' }), page.click('button[type=submit]')])
  }
  return { ctx, page }
}

/** Open a page, let animations settle, hide dev badges, scroll if asked, save. */
async function shot(page, name, path, { wait = 1800, scrollTo, scrollBy = 0, before } = {}) {
  if (path) await page.goto(path.startsWith('http') ? path : BASE + path, { waitUntil: 'networkidle2' })
  await sleep(wait)
  await page.evaluate(() => document.querySelectorAll('nextjs-portal').forEach((e) => e.remove()))
  if (scrollTo) {
    await page.evaluate((t) => {
      const el = [...document.querySelectorAll('h1, h2, h3')].find((h) => h.textContent.includes(t))
      el?.scrollIntoView({ block: 'start' })
      window.scrollBy(0, -110)
    }, scrollTo)
    await sleep(900)
  }
  if (scrollBy) {
    await page.evaluate((y) => window.scrollBy(0, y), scrollBy)
    await sleep(900)
  }
  if (before) await before(page)
  await page.screenshot({ path: `${OUT}${name}.jpg`, type: 'jpeg', quality: 88 })
  console.log('·', name)
}

/** The first link whose address matches, e.g. /classes/12/homework/ → its full path. */
const firstHref = (page, re) => page.evaluate((src) => [...document.querySelectorAll('a[href]')].map((a) => a.getAttribute('href')).find((h) => new RegExp(src).test(h)) ?? null, re.source)

const roles = {
  async dark() {
    const { ctx, page } = await session(null, 'dark')
    await shot(page, '00-home-hero-dark', '/ru', { wait: 4500 })
    await ctx.close()
  },
  async visitor() {
    const { ctx, page } = await session(null)
    await shot(page, '01-home-hero', '/ru', { wait: 4500 })
    await shot(page, '02-home-audiences', null, { scrollTo: 'Для всех' })
    await shot(page, '03-home-courses', null, { scrollTo: 'Популярные курсы' })
    await shot(page, '04-catalog', '/ru/catalog', { scrollBy: 300 })
    await shot(page, '05-catalog-filter', '/ru/catalog?subject=cs', { scrollBy: 300 })
    const py = await firstHref(page, /\/catalog\/\d+$/)
    if (py) await shot(page, '06-course-page', py)
    await shot(page, '07-pricing', '/ru/pricing', { wait: 2500 })
    await shot(page, '08-pricing-plans', null, { scrollBy: 640 })
    await shot(page, '09-schools', '/ru/schools')
    const school = await firstHref(page, /\/schools\/[a-z0-9-]+$/)
    if (school) {
      await shot(page, '10-school-page', school)
      await shot(page, '11-school-page-more', null, { scrollBy: 700 })
    }
    await shot(page, '12-contact', '/ru/contact', { wait: 2500 })
    await ctx.close()
  },
  async student() {
    const { ctx, page } = await session('ivan.petrov@demo.budu.test')
    await shot(page, '20-student-home', '/home')
    const hwLink = await firstHref(page, /\/homework\/\d+/)
    const quizLink = await firstHref(page, /\/quizzes\/\d+/)
    await shot(page, '21-student-timetable', '/timetable')
    await shot(page, '22-student-classes', '/classes')
    const course = await firstHref(page, /^\/classes\/\d+$/)
    if (course) {
      await shot(page, '23-student-course', course)
      const lesson = await firstHref(page, /\/lessons\/\d+/)
      if (lesson) await shot(page, '24-student-lesson', lesson)
      if (hwLink) await shot(page, '25-student-homework', hwLink)
      if (quizLink) await shot(page, '25b-student-quiz', quizLink)
    }
    await shot(page, '26-student-explore', '/explore', { scrollBy: 200 })
    await shot(page, '27-student-bell', '/home', {
      before: async (p) => {
        await p.click('button[aria-label*="Уведомлен"], button[aria-label*="уведомлен"]').catch(() => {})
        await sleep(900)
      },
    })
    await ctx.close()
  },
  async teacher() {
    const { ctx, page } = await session('andrey.kozlov@demo.budu.test')
    await shot(page, '30-teacher-dashboard', '/teach')
    await shot(page, '31-teacher-courses', '/courses')
    const course = await firstHref(page, /^\/courses\/\d+$/)
    if (course) {
      await shot(page, '32-teacher-builder', course)
      await shot(page, '33-teacher-quizzes', `${course}/quizzes`)
      await shot(page, '34-teacher-schedule', `${course}/schedule`)
      await shot(page, '35-teacher-students', `${course}/students`)
    }
    await shot(page, '36-teacher-grading', '/grading')
    await shot(page, '37-teacher-gradebook', '/gradebook')
    await shot(page, '38-teacher-messages', '/messages')
    const conv = await firstHref(page, /^\/messages\/\d+$/)
    if (conv) await shot(page, '39-teacher-chat', conv)
    await ctx.close()
  },
  async manager() {
    const { ctx, page } = await session('elena.smirnova@demo.budu.test')
    await shot(page, '40-school-overview', '/school')
    await shot(page, '41-school-people', '/school/people')
    await shot(page, '42-school-classes', '/school/classes')
    const cls = await firstHref(page, /^\/school\/classes\/\d+$/)
    if (cls) await shot(page, '43-school-class', cls)
    await shot(page, '44-school-courses', '/school/courses')
    await shot(page, '45-school-exams', '/school/exams')
    await shot(page, '46-school-page-editor', '/school/page')
    await shot(page, '47-school-settings', '/school/settings')
    await shot(page, '48-school-timetable', '/timetable')
    await ctx.close()
  },
  async parent() {
    const { ctx, page } = await session('natalia.petrova@demo.budu.test')
    await shot(page, '50-parent-family', '/family')
    const child = await firstHref(page, /^\/family\/\d+$/)
    if (child) await shot(page, '51-parent-child', child)
    await shot(page, '52-parent-messages', '/messages')
    const conv = await firstHref(page, /^\/messages\/\d+$/)
    if (conv) await shot(page, '53-parent-chat', conv)
    await ctx.close()
  },
}

for (const [name, run] of Object.entries(roles)) {
  if (only && only !== name) continue
  console.log(name)
  await run().catch((e) => console.log('  !', name, e.message))
}
await browser.close()
