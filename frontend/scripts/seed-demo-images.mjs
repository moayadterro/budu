/**
 * Pictures for the demo (after seed-demo.mjs): course covers and school page covers (free Unsplash
 * photos, credits in video/assets/photos/sources.tsv), school logos (drawn) and everyone's avatar
 * (DiceBear "avataaars", drawn, no real faces). Uploaded through the app's own functions, as the
 * course's teacher / the school's manager / the person themself would.
 *
 *   docker compose cp video/assets frontend:/tmp/demo-assets
 *   docker compose exec -T frontend node scripts/seed-demo-images.mjs
 */
import { createJiti } from 'jiti'
import { readFileSync, readdirSync } from 'node:fs'

const jiti = createJiti(import.meta.url, {
  alias: { '@': new URL('../src', import.meta.url).pathname, 'server-only': new URL('../node_modules/server-only/empty.js', import.meta.url).pathname },
  interopDefault: true,
  jsx: true,
})
const load = (p) => jiti.import(p)
const { query } = await load('@/shared/server/db')
const { defaultInstance, iomadCall } = await load('@/shared/server/iomad')
const course = await load('@/entities/course/server')
const tenant = await load('@/entities/tenant/server')
const page = await load('@/entities/school-page/server')
const user = await load('@/entities/user/server')

const DIR = '/tmp/demo-assets'
const DOMAIN = 'demo.budu.test'
const file = (path, type) => new File([readFileSync(path)], path.split('/').pop(), { type })
const iomad = defaultInstance()
const byEmail = async (email) => (await iomadCall(iomad, 'core_user_get_users_by_field', { field: 'email', values: [email] }))[0]

// ---- course covers: the photo that matches each demo course --------------------------------------
const COVERS = {
  'Алгебра 9 класс: подготовка к ОГЭ': 'math',
  'Физика: механика с нуля': 'physics',
  'Английский для старшеклассников': 'english',
  'Биология: клетка и генетика': 'biology',
  'Химия: подготовка к ЕГЭ': 'chemistry',
  'Основы веб-разработки: HTML и CSS': 'web',
  'История России: XX век': 'history',
  'Python для начинающих': 'python',
  'Экономика для старшеклассников': 'economics',
  'Русская литература XIX века': 'literature',
  'Сочинение на ЕГЭ: пошагово': 'essay',
  'Арабский язык для начинающих': 'arabic',
  'Speaking Club: разговорный английский': 'speaking',
  'Шахматы: от новичка до разряда': 'chess',
}
const listed = await course.listedCourses()
const courses = await course.catalog(listed.map((l) => l.courseId))
let covers = 0
for (const c of courses) {
  const photo = COVERS[c.title]
  if (!photo || !c.teachers[0]) continue
  await course.setCourseImage(c.teachers[0].id, c.id, file(`${DIR}/photos/${photo}.jpg`, 'image/jpeg'))
  covers++
}
console.log('· course covers:', covers)

// ---- schools: logo + page cover, as the manager -------------------------------------------------
const SCHOOLS = [
  { name: 'Лицей «Перспектива»', manager: 'elena.smirnova', logo: 'perspektiva', cover: 'school2' },
  { name: 'Школа «Новый горизонт»', manager: 'timur.khairullin', logo: 'gorizont', cover: 'school1' },
  { name: 'Гимназия «Северная звезда»', manager: 'pavel.orlov', logo: 'zvezda', cover: 'school3' },
]
for (const s of SCHOOLS) {
  const [row] = await query(`SELECT company_id FROM tenants WHERE iomad_url = $1 AND name = $2 AND kind = 'school' ORDER BY company_id DESC LIMIT 1`, [iomad.url, s.name])
  const manager = await byEmail(`${s.manager}@${DOMAIN}`)
  if (!row || !manager) {
    console.log('  skip', s.name)
    continue
  }
  const companyId = Number(row.company_id)
  await tenant.setSchoolLogo(manager.id, companyId, file(`${DIR}/logos/${s.logo}.png`, 'image/png'))
  const fileId = await page.savePhoto(manager.id, companyId, file(`${DIR}/photos/${s.cover}.jpg`, 'image/jpeg'))
  await page.setCover(companyId, fileId)
}
console.log('· school logos and covers:', SCHOOLS.length)

// ---- everyone's avatar -------------------------------------------------------------------------
let avatars = 0
for (const name of readdirSync(`${DIR}/avatars`)) {
  const email = `${name.replace(/\.png$/, '')}@${DOMAIN}`
  const u = await byEmail(email)
  if (!u) continue
  await user.setPicture(u.id, email, file(`${DIR}/avatars/${name}`, 'image/png'))
  avatars++
}
console.log('· avatars:', avatars)
process.exit(0)
