/**
 * Demo data for the product video (owner, 2026-10-23): a believable Russian world on every part of
 * Budu — three schools with classes, teachers, students and parents; independent teachers; a full
 * marketplace (subjects, languages, free and paid); lessons, homework (handed in and graded),
 * quizzes and an exam; a timetable; announcements; a parent ↔ teacher chat; reviews; school pages.
 *
 * Everything goes through the app's OWN server code (same rules as the real screens). Nothing is
 * emailed: notifications are written to the bell only. Run once, inside the frontend container:
 *
 *   docker compose exec -T frontend node scripts/seed-demo.mjs
 *
 * It stops if the demo already exists. Accounts share one random password, written to the
 * git-ignored scripts/demo-accounts.local.md (never printed, never committed).
 */
import { createJiti } from 'jiti'
import { randomBytes } from 'node:crypto'
import { writeFileSync } from 'node:fs'

const src = new URL('../src', import.meta.url).pathname
const jiti = createJiti(import.meta.url, {
  alias: { '@': src, 'server-only': new URL('../node_modules/server-only/empty.js', import.meta.url).pathname },
  interopDefault: true,
  jsx: true, // some modules on the way import React components
})
const load = (p) => jiti.import(p)

const { query } = await load('@/shared/server/db')
const { defaultInstance, iomadCall } = await load('@/shared/server/iomad')
const { createAccount } = await load('@/features/sign-up/server/createAccount')
const course = await load('@/entities/course/server')
const klass = await load('@/entities/school-class/server')
const tenant = await load('@/entities/tenant/server')
const homework = await load('@/entities/homework/server')
const quiz = await load('@/entities/quiz/server')
const schedule = await load('@/entities/schedule/server')
const announce = await load('@/entities/announcement/server')
const family = await load('@/entities/family/server')
const chat = await load('@/entities/conversation/server')
const review = await load('@/entities/review/server')
const page = await load('@/entities/school-page/server')
const notif = await load('@/entities/notification/server')

const DOMAIN = 'demo.budu.test'
const PASSWORD = `Demo-${randomBytes(9).toString('base64url')}7a`
const log = (...a) => console.log('·', ...a)
const iomad = defaultInstance()

// ---------- guard: run once -------------------------------------------------------------------
const exists = await iomadCall(iomad, 'core_user_get_users_by_field', { field: 'email', values: [`elena.smirnova@${DOMAIN}`] })
if (exists.length) {
  console.log('Demo data already exists (elena.smirnova@…). Nothing to do.')
  process.exit(0)
}

// ---------- people ----------------------------------------------------------------------------
const accounts = [] // for the credentials file
const people = {} // key → { id, name, email }

async function person(key, fullName, kind = 'student', extra = {}) {
  const email = `${key}@${DOMAIN}`
  const r = await createAccount({ kind, fullName, email, password: PASSWORD, country: 'RU', ...extra })
  await notif.rememberLocale(r.userId, 'ru')
  people[key] = { id: r.userId, name: fullName, email, companyId: r.companyId ?? null }
  accounts.push({ email, name: fullName, kind: extra.role ?? kind })
  if (r.companyId) {
    await query(`INSERT INTO tenants (iomad_url, company_id, kind, name) VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING`, [
      r.iomadUrl,
      r.companyId,
      kind,
      r.tenantName,
    ])
  }
  return people[key]
}

/** A school: its manager signs it up, then teachers and students join it. */
async function school(key, name, city, managerKey, managerName) {
  const m = await person(managerKey, managerName, 'school', { schoolName: name, city, role: `manager, ${name}` })
  log('school', name)
  return { key, name, companyId: m.companyId, manager: m }
}

async function member(s, key, fullName, role) {
  const p = await person(key, fullName, 'student', { role: `${role}, ${s.name}` })
  await tenant.addToSchool(s.companyId, p.id, role)
  // IOMAD ignores the teacher flag on adding; the app sets roles with its own call (as Invite does)
  if (role !== 'student') await tenant.setSchoolRole(s.manager.id, s.companyId, p.id, role)
  return p
}

// ---------- courses ---------------------------------------------------------------------------
const day = 86400
const now = Math.floor(Date.now() / 1000)

/**
 * A course with lessons: lesson 1 has an intro text page; lessons can carry homework. Published,
 * and listed in the marketplace when `price` is given (0 = free).
 */
async function makeCourse(teacher, companyId, c) {
  const id = await course.createCourse(teacher.id, companyId, c.title, c.description)
  const lessons = []
  for (const [i, l] of c.lessons.entries()) {
    const { id: lessonId } = await course.saveLesson(teacher.id, id, 0, l.title, l.text ?? '')
    if (i === 0) {
      await course.savePage(teacher.id, id, lessonId, 0, {
        name: 'Введение',
        html: `<h2>${c.title}</h2><p>${c.intro}</p><p>В курсе ${c.lessons.length} уроков: видео, конспекты и задания с проверкой.</p>`,
      })
    }
    let taskId = null
    if (l.task) {
      const r = await course.saveTask(teacher.id, id, lessonId, 0, { name: l.task, instructions: l.taskText ?? 'Решите задания и пришлите ответ с решением.', dueAt: now + (l.due ?? 7) * day, file: null })
      taskId = r.id
    }
    lessons.push({ id: lessonId, taskId })
  }
  await course.setCourseSubject(teacher.id, id, c.subject)
  await course.setCourseLanguage(teacher.id, id, c.language ?? 'ru')
  await course.updateCourse(teacher.id, id, { title: c.title, description: c.description, published: true })
  if (c.price !== undefined) await course.saveListing(teacher.id, { courseId: id, listed: true, price: c.price, currency: c.currency ?? 'RUB' })
  log('course', c.title)
  return { id, title: c.title, teacher, lessons }
}

const L = (titles, tasks = {}) => titles.map((title, i) => ({ title, ...(tasks[i] ? { task: tasks[i] } : {}) }))

// =============================================================================================
// 1. Schools, their people and classes
// =============================================================================================
const s1 = await school('s1', 'Лицей «Перспектива»', 'Москва', 'elena.smirnova', 'Смирнова Елена Викторовна')
const kozlov = await member(s1, 'andrey.kozlov', 'Андрей Козлов', 'teacher')
const belova = await member(s1, 'maria.belova', 'Мария Белова', 'teacher')
const kim = await member(s1, 'olga.kim', 'Ольга Ким', 'teacher')
const s1Students9 = []
for (const [k, n] of [
  ['ivan.petrov', 'Иван Петров'],
  ['sofia.morozova', 'София Морозова'],
  ['artem.volkov', 'Артём Волков'],
  ['alisa.novikova', 'Алиса Новикова'],
  ['maxim.sokolov', 'Максим Соколов'],
  ['darya.lebedeva', 'Дарья Лебедева'],
])
  s1Students9.push(await member(s1, k, n, 'student'))
const s1Students10 = []
for (const [k, n] of [
  ['mikhail.popov', 'Михаил Попов'],
  ['anna.kozlova', 'Анна Козлова'],
  ['egor.vasiliev', 'Егор Васильев'],
  ['viktoria.pavlova', 'Виктория Павлова'],
  ['kirill.semenov', 'Кирилл Семёнов'],
  ['polina.golubeva', 'Полина Голубева'],
])
  s1Students10.push(await member(s1, k, n, 'student'))
const m1 = s1.manager.id
const class9 = await klass.saveClass(m1, s1.companyId, 0, '9-А', 'Класс с углублённой математикой')
const class10 = await klass.saveClass(m1, s1.companyId, 0, '10-Б', 'Естественно-научный профиль')
await klass.setClassStudents(m1, class9, s1Students9.map((p) => p.id), [])
await klass.setClassStudents(m1, class10, s1Students10.map((p) => p.id), [])
await klass.setClassTeachers(m1, class9, [kozlov.id])
await klass.setClassTeachers(m1, class10, [belova.id])
await tenant.setGradeScale(s1.companyId, 'russia')
log('classes 9-А, 10-Б')

const s2 = await school('s2', 'Школа «Новый горизонт»', 'Казань', 'timur.khairullin', 'Тимур Хайруллин')
const safina = await member(s2, 'dina.safina', 'Дина Сафина', 'teacher')
const lebedev = await member(s2, 'igor.lebedev', 'Игорь Лебедев', 'teacher')
const s2Students = []
for (const [k, n] of [
  ['amir.galiev', 'Амир Галиев'],
  ['leila.khasanova', 'Лейла Хасанова'],
  ['ruslan.zaripov', 'Руслан Зарипов'],
  ['kamila.nurieva', 'Камила Нуриева'],
])
  s2Students.push(await member(s2, k, n, 'student'))
const class8 = await klass.saveClass(s2.manager.id, s2.companyId, 0, '8-В', '')
await klass.setClassStudents(s2.manager.id, class8, s2Students.map((p) => p.id), [])

const s3 = await school('s3', 'Гимназия «Северная звезда»', 'Санкт-Петербург', 'pavel.orlov', 'Павел Орлов')

// =============================================================================================
// 2. Independent teachers and learners
// =============================================================================================
const nikitin = await person('dmitry.nikitin', 'Дмитрий Никитин', 'teacher', { city: 'Новосибирск', role: 'teacher (independent)' })
const volkova = await person('anna.volkova', 'Анна Волкова', 'teacher', { city: 'Екатеринбург', role: 'teacher (independent)' })
const haddad = await person('sara.haddad', 'Сара Хаддад', 'teacher', { city: 'Дубай', role: 'teacher (independent)' })
const miller = await person('john.miller', 'Джон Миллер', 'teacher', { city: 'Лондон', role: 'teacher (independent)' })
const tarasov = await person('oleg.tarasov', 'Олег Тарасов', 'teacher', { city: 'Самара', role: 'teacher (independent)' })
const learners = []
for (const [k, n] of [
  ['elizaveta.krylova', 'Елизавета Крылова'],
  ['nikita.fedorov', 'Никита Фёдоров'],
  ['ksenia.orlova', 'Ксения Орлова'],
])
  learners.push(await person(k, n, 'student', { role: 'student (independent)' }))

const parentPetrov = await person('natalia.petrova', 'Наталья Петрова', 'student', { role: 'parent of Иван Петров' })
const parentMorozov = await person('sergey.morozov', 'Сергей Морозов', 'student', { role: 'parent of София Морозова' })

// =============================================================================================
// 3. Courses (school courses linked to classes; most also in the marketplace)
// =============================================================================================
const algebra = await makeCourse(kozlov, s1.companyId, {
  title: 'Алгебра 9 класс: подготовка к ОГЭ',
  description: 'Все темы ОГЭ по алгебре: уравнения, неравенства, функции и прогрессии. Разбор задач и пробные варианты.',
  intro: 'Шаг за шагом пройдём весь курс алгебры 9 класса и подготовимся к ОГЭ без стресса.',
  subject: 'math',
  price: 2990,
  lessons: L(['Квадратные уравнения', 'Теорема Виета', 'Неравенства и системы', 'Функции и графики', 'Прогрессии', 'Пробный вариант ОГЭ'], {
    1: 'Задачи на теорему Виета',
    2: 'Решение систем неравенств',
  }),
})
const physics = await makeCourse(belova, s1.companyId, {
  title: 'Физика: механика с нуля',
  description: 'Кинематика, законы Ньютона, импульс и энергия. Понятно, наглядно и с опытами дома.',
  intro: 'Механика — основа всей физики. Разберёмся, почему всё движется именно так.',
  subject: 'physics',
  price: 0,
  lessons: L(['Движение и скорость', 'Ускорение', 'Законы Ньютона', 'Импульс', 'Энергия и работа'], { 2: 'Задачи на второй закон Ньютона' }),
})
const english = await makeCourse(kim, s1.companyId, {
  title: 'Английский для старшеклассников',
  description: 'Грамматика, словарный запас и разговорная практика уровня B1–B2 для учеников 10–11 классов.',
  intro: 'Будем говорить по-английски с первого урока.',
  subject: 'languages',
  language: 'en',
  price: 3500,
  lessons: L(['Present Perfect vs Past Simple', 'Conditionals', 'Phrasal verbs', 'Writing an essay'], { 3: 'Essay: My future profession' }),
})
const biology = await makeCourse(belova, s1.companyId, {
  title: 'Биология: клетка и генетика',
  description: 'Строение клетки, деление, ДНК и законы Менделя. Для 10–11 классов и подготовки к ЕГЭ.',
  intro: 'Заглянем внутрь клетки и разберёмся, как работает наследственность.',
  subject: 'biology',
  price: 2490,
  lessons: L(['Строение клетки', 'Митоз и мейоз', 'ДНК и РНК', 'Законы Менделя']),
})
const chemistry = await makeCourse(safina, s2.companyId, {
  title: 'Химия: подготовка к ЕГЭ',
  description: 'Все задания ЕГЭ по химии: от строения атома до органики. Сотни разобранных задач.',
  intro: 'Готовимся к ЕГЭ по химии системно и с разбором типичных ошибок.',
  subject: 'exams',
  price: 3900,
  lessons: L(['Строение атома', 'Химическая связь', 'Реакции ионного обмена', 'Окислительно-восстановительные реакции', 'Органическая химия'], {
    1: 'Тест: типы химической связи',
  }),
})
const web = await makeCourse(lebedev, s2.companyId, {
  title: 'Основы веб-разработки: HTML и CSS',
  description: 'Сверстаем свой первый сайт: разметка, стили, адаптивность для телефонов.',
  intro: 'К концу курса у вас будет собственный сайт-визитка.',
  subject: 'cs',
  price: 1990,
  lessons: L(['Как устроен веб', 'Теги HTML', 'Стили CSS', 'Flexbox и Grid', 'Сайт-визитка'], { 4: 'Проект: сайт-визитка' }),
})
const history = await makeCourse(s3.manager, s3.companyId, {
  title: 'История России: XX век',
  description: 'Ключевые события века: революции, войны, реформы. С картами, документами и тестами.',
  intro: 'Разберём XX век так, чтобы события сложились в одну понятную историю.',
  subject: 'history',
  price: 0,
  lessons: L(['Начало века', 'Революции 1917 года', 'Великая Отечественная война', 'Оттепель', 'Конец века']),
})
const python = await makeCourse(nikitin, nikitin.companyId, {
  title: 'Python для начинающих',
  description: 'Первый язык программирования: переменные, циклы, функции и маленькие проекты.',
  intro: 'Научимся программировать на Python с нуля и напишем свою игру.',
  subject: 'cs',
  price: 4900,
  lessons: L(['Установка и первая программа', 'Переменные и типы', 'Условия и циклы', 'Функции', 'Проект: игра «Угадай число»'], { 2: 'Задачи на циклы' }),
})
const economics = await makeCourse(nikitin, nikitin.companyId, {
  title: 'Экономика для старшеклассников',
  description: 'Деньги, рынок, бюджет и инвестиции простым языком.',
  intro: 'Разберёмся, как устроена экономика вокруг нас.',
  subject: 'economics',
  price: 1500,
  lessons: L(['Что такое экономика', 'Спрос и предложение', 'Личный бюджет', 'Банки и вклады']),
})
const literature = await makeCourse(volkova, volkova.companyId, {
  title: 'Русская литература XIX века',
  description: 'Пушкин, Гоголь, Толстой, Достоевский: читаем, обсуждаем, учимся писать о прочитанном.',
  intro: 'Классика может быть живой и интересной. Проверим вместе.',
  subject: 'literature',
  price: 0,
  lessons: L(['Пушкин: «Евгений Онегин»', 'Гоголь: «Мёртвые души»', 'Толстой: «Война и мир»', 'Достоевский: «Преступление и наказание»']),
})
const essay = await makeCourse(volkova, volkova.companyId, {
  title: 'Сочинение на ЕГЭ: пошагово',
  description: 'Структура, аргументы и типичные ошибки. Пишем сочинения и получаем подробную обратную связь.',
  intro: 'Научимся писать сочинение на высокий балл по понятному плану.',
  subject: 'exams',
  price: 1990,
  lessons: L(['Как читают сочинение эксперты', 'Проблема и комментарий', 'Аргументы', 'Пишем сочинение'], { 3: 'Сочинение по тексту' }),
})
const arabic = await makeCourse(haddad, haddad.companyId, {
  title: 'Арабский язык для начинающих',
  description: 'Алфавит, чтение и первые фразы. Уроки ведёт носитель языка.',
  intro: 'Начнём с алфавита и уже через месяц будем читать простые тексты.',
  subject: 'languages',
  language: 'ar',
  price: 0,
  lessons: L(['Алфавит: часть 1', 'Алфавит: часть 2', 'Чтение слов', 'Приветствия и знакомство']),
})
const speaking = await makeCourse(miller, miller.companyId, {
  title: 'Speaking Club: разговорный английский',
  description: 'Говорим на живые темы с носителем языка. Уровень B1 и выше.',
  intro: 'Stop being shy: start speaking English with confidence.',
  subject: 'languages',
  language: 'en',
  price: 30,
  currency: 'USD',
  lessons: L(['Travel', 'Work and careers', 'Technology', 'Culture and art']),
})
const chess = await makeCourse(tarasov, tarasov.companyId, {
  title: 'Шахматы: от новичка до разряда',
  description: 'Правила, тактика, дебюты и эндшпиль. Для детей и взрослых.',
  intro: 'Шахматы развивают мышление. Начнём с первых ходов.',
  subject: 'sports',
  price: 0,
  lessons: L(['Как ходят фигуры', 'Мат в один ход', 'Тактические приёмы', 'Дебюты', 'Эндшпиль']),
})

// classes take school courses (cohort enrolment: the whole class joins)
await klass.linkClassCourse(m1, class9, algebra.id, true)
await klass.linkClassCourse(m1, class9, physics.id, true)
await klass.linkClassCourse(m1, class10, english.id, true)
await klass.linkClassCourse(m1, class10, biology.id, true)
await klass.linkClassCourse(m1, class10, physics.id, true)
await klass.linkClassCourse(s2.manager.id, class8, chemistry.id, true)
await klass.linkClassCourse(s2.manager.id, class8, web.id, true)
log('classes linked to courses')

// independent learners buy / join marketplace courses
for (const l of learners) {
  for (const c of [python, literature, speaking, chess].slice(0, 2 + (l.id % 3))) await course.enrolLearner(c.id, l.id)
}
await course.enrolLearner(python.id, s1Students10[0].id)
await course.enrolLearner(arabic.id, learners[2].id)

// =============================================================================================
// 4. Homework handed in and graded
// =============================================================================================
const answers = [
  'По теореме Виета x₁ + x₂ = 7, x₁·x₂ = 10, значит корни 2 и 5. Проверка подстановкой сходится.',
  'Решила все задачи, в №4 сомневаюсь в знаке, посмотрите, пожалуйста.',
  'Ответы: 1) 3 и 4; 2) −2 и 6; 3) 1 и 9. Решение во вложении в тетради.',
  'Сделал, но последнюю задачу не успел до конца.',
]
const feedback = ['Отлично! Чисто и с проверкой.', 'Хорошо, в №4 знак верный, молодец.', 'Верно, но распиши решение подробнее.', 'Неплохо, доделай последнюю задачу.']
const vieta = algebra.lessons[1].taskId
for (const [i, st] of s1Students9.slice(0, 5).entries()) {
  await homework.submitHomework(st.id, vieta, answers[i % answers.length], [])
  if (i < 3) await homework.gradeSubmission(kozlov.id, vieta, st.id, [95, 88, 76][i], feedback[i])
}
const newton = physics.lessons[2].taskId
for (const [i, st] of [...s1Students9.slice(0, 3), ...s1Students10.slice(0, 3)].entries()) {
  await homework.submitHomework(st.id, newton, 'F = ma: 1) 20 Н; 2) 2,5 м/с²; 3) 4 кг.', [])
  if (i % 2 === 0) await homework.gradeSubmission(belova.id, newton, st.id, [92, 84, 70][i / 2], 'Всё верно, хорошее оформление.')
}
const pyLoops = python.lessons[2].taskId
for (const l of learners.slice(0, 2)) await homework.submitHomework(l.id, pyLoops, 'for i in range(1, 11):\n    print(i * i)', [])
log('homework handed in and graded')

// =============================================================================================
// 5. Quizzes: a practice quiz and an exam
// =============================================================================================
const practice = await quiz.saveQuiz(belova.id, physics.id, 0, {
  name: 'Тест: законы Ньютона',
  intro: 'Проверьте себя после урока. Попыток сколько угодно, ответы сразу.',
  kind: 'quiz',
  closesAt: null,
  timeLimit: 0,
  passMark: 60,
  classIds: [],
})
await quiz.saveQuestion(belova.id, practice, 0, {
  text: 'Какой закон Ньютона описывает формула F = ma?',
  mark: 1,
  data: { type: 'multichoice', multiple: false, options: [{ text: 'Первый', correct: false }, { text: 'Второй', correct: true }, { text: 'Третий', correct: false }] },
})
await quiz.saveQuestion(belova.id, practice, 0, { text: 'Тело в покое остаётся в покое, если на него не действуют силы.', mark: 1, data: { type: 'truefalse', correct: true } })
await quiz.saveQuestion(belova.id, practice, 0, {
  text: 'Сила 10 Н действует на тело массой 2 кг. Какое ускорение (м/с²)?',
  mark: 1,
  data: { type: 'numerical', answers: [{ value: 5, tolerance: 0 }] },
})
await quiz.saveQuestion(belova.id, practice, 0, {
  text: 'Сопоставьте величину и единицу измерения.',
  mark: 1,
  data: { type: 'match', pairs: [{ left: 'Сила', right: 'Ньютон' }, { left: 'Масса', right: 'Килограмм' }, { left: 'Ускорение', right: 'м/с²' }] },
})
await quiz.publishQuiz(belova.id, practice, true)

const exam = await quiz.saveQuiz(kozlov.id, algebra.id, 0, {
  name: 'Контрольная: квадратные уравнения',
  intro: 'Одна попытка, 30 минут. Балл увидите после сдачи.',
  kind: 'exam',
  closesAt: now + 5 * day,
  timeLimit: 30 * 60,
  passMark: 60,
  classIds: [],
})
await quiz.saveQuestion(kozlov.id, exam, 0, { text: 'Найдите больший корень уравнения x² − 7x + 10 = 0.', mark: 2, data: { type: 'numerical', answers: [{ value: 5, tolerance: 0 }] } })
await quiz.saveQuestion(kozlov.id, exam, 0, {
  text: 'Сколько корней у уравнения x² + 4 = 0?',
  mark: 1,
  data: { type: 'multichoice', multiple: false, options: [{ text: 'Ни одного', correct: true }, { text: 'Один', correct: false }, { text: 'Два', correct: false }] },
})
await quiz.saveQuestion(kozlov.id, exam, 0, { text: 'Объясните, как найти дискриминант и что он показывает.', mark: 3, data: { type: 'essay', graderInfo: 'D = b² − 4ac; знак D — число корней.' } })
await quiz.publishQuiz(kozlov.id, exam, true)
log('quiz and exam published')

// =============================================================================================
// 6. Timetable: this week and the next ones
// =============================================================================================
const monday = (() => {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7))
  return d
})()
const at = (weekday, h, m = 0, week = 0) => {
  const d = new Date(monday)
  d.setDate(d.getDate() + weekday + week * 7)
  d.setHours(h, m, 0, 0)
  return Math.floor(d.getTime() / 1000)
}
const weeks = [0, 1, 2, 3]
await schedule.addLessons(kozlov.id, algebra.id, class9, 'Кабинет 301', 45 * 60, weeks.flatMap((w) => [at(0, 9, 0, w), at(2, 9, 0, w), at(4, 10, 0, w)]))
await schedule.addLessons(belova.id, physics.id, class9, 'Лаборатория физики', 45 * 60, weeks.flatMap((w) => [at(1, 11, 0, w), at(3, 11, 0, w)]))
await schedule.addLessons(kim.id, english.id, class10, 'Кабинет 214', 45 * 60, weeks.flatMap((w) => [at(0, 12, 0, w), at(3, 9, 0, w)]))
await schedule.addLessons(belova.id, biology.id, class10, 'Кабинет 118', 45 * 60, weeks.flatMap((w) => [at(1, 9, 0, w), at(4, 12, 0, w)]))
await schedule.addLessons(safina.id, chemistry.id, class8, 'Кабинет химии', 45 * 60, weeks.flatMap((w) => [at(0, 10, 0, w), at(2, 12, 0, w)]))
await schedule.addSchoolEvent(m1, s1.companyId, { title: 'Родительское собрание', description: 'Актовый зал, итоги четверти', start: at(3, 18, 30), duration: 90 * 60 })
await schedule.addSchoolEvent(m1, s1.companyId, { title: 'День открытых дверей', description: 'Для будущих учеников и родителей', start: at(5, 11, 0), duration: 3 * 3600 })
log('timetable')

// =============================================================================================
// 7. Announcements, families, chat, notifications
// =============================================================================================
const author = (p) => ({ id: p.id, name: p.name })
await announce.createAnnouncement({
  companyId: s1.companyId,
  author: author(s1.manager),
  audience: 'school',
  target: null,
  title: 'Расписание на вторую четверть',
  body: 'Расписание уроков на вторую четверть уже в Budu. Проверьте свой календарь и уведомления.',
})
await announce.createAnnouncement({
  companyId: s1.companyId,
  author: author(s1.manager),
  audience: 'class',
  target: { ids: [class9], name: '9-А' },
  title: 'Пробный ОГЭ в пятницу',
  body: 'В пятницу пишем пробный ОГЭ по математике. Возьмите черновики, калькулятор не понадобится.',
})
await announce.createAnnouncement({
  companyId: s1.companyId,
  author: author(belova),
  audience: 'course',
  target: { ids: [physics.id], name: physics.title },
  title: 'Новый тест по законам Ньютона',
  body: 'Добавила тест для самопроверки. Попыток сколько угодно, правильные ответы сразу.',
})

for (const [parent, child] of [
  [parentPetrov, s1Students9[0]],
  [parentMorozov, s1Students9[1]],
]) {
  await family.createParentRequest(child.id, parent.id)
  await family.acceptAllFor(parent.id)
}
const conv = await chat.openConversation(parentPetrov.id, kozlov.id, s1Students9[0].id)
const c = await chat.getConversation(parentPetrov.id, conv)
for (const [who, text] of [
  [parentPetrov, 'Здравствуйте, Андрей Сергеевич! Как Иван справляется с алгеброй? Он говорит, что теорема Виета даётся сложно.'],
  [kozlov, 'Добрый день, Наталья! Иван молодец: за последнее задание 95 баллов. Немного торопится в неравенствах, поработаем над этим.'],
  [parentPetrov, 'Спасибо большое! Будем заниматься дома.'],
  [kozlov, 'Отлично. В пятницу пробный ОГЭ, пусть повторит квадратные уравнения.'],
])
  await chat.sendMessage(c, who.id, text)

// the bell only (no emails to demo addresses)
const bell = (userId, kind, params, link) =>
  query(`INSERT INTO notifications (iomad_user_id, kind, params, link) VALUES ($1, $2, $3::jsonb, $4)`, [userId, kind, JSON.stringify(params), link])
const ivan = s1Students9[0]
await bell(ivan.id, 'homeworkNew', { homework: 'Решение систем неравенств', course: algebra.title }, `/classes/${algebra.id}/homework/${algebra.lessons[2].taskId}`)
await bell(ivan.id, 'quizPublished', { kind: 'exam', quiz: 'Контрольная: квадратные уравнения', course: algebra.title }, `/classes/${algebra.id}`)
await bell(ivan.id, 'homeworkGraded', { homework: 'Задачи на теорему Виета', course: algebra.title, grade: '5' }, `/classes/${algebra.id}/homework/${vieta}`)
for (const st of s1Students9.slice(3, 5))
  await bell(kozlov.id, 'homeworkSubmitted', { student: st.name, homework: 'Задачи на теорему Виета', course: algebra.title }, '/grading')
log('announcements, families, chat, notifications')

// =============================================================================================
// 8. Reviews and ratings
// =============================================================================================
const reviews = [
  [python, learners[0], 5, 'Объясняет очень понятно, к концу курса написала свою игру!'],
  [python, learners[1], 5, 'Лучший курс для старта. Задания интересные.'],
  [python, s1Students10[0], 4, 'Хорошо, но хотелось бы больше практики.'],
  [literature, learners[0], 5, 'Классика заиграла новыми красками.'],
  [literature, learners[2], 5, 'Анна Сергеевна потрясающе рассказывает!'],
  [speaking, learners[1], 5, 'Finally I am not afraid to speak. Thank you, John!'],
  [chess, learners[2], 4, 'Дочке очень нравится, особенно задачи на мат.'],
]
for (const [crs, who, stars, comment] of reviews) {
  await course.enrolLearner(crs.id, who.id).catch(() => {})
  await review.markFinished(who.id, crs.id)
  await review.saveReview(who.id, crs.id, { authorName: who.name, stars, comment })
}
log('reviews')

// =============================================================================================
// 9. School pages (published, listed on /schools)
// =============================================================================================
async function schoolPage(s, tagline, blocks) {
  await page.ensureSlug(s.companyId, s.name)
  await page.setTagline(s.companyId, tagline)
  for (const [kind, data] of blocks) {
    const id = await page.addBlock(s.companyId, kind)
    await page.saveBlock(s.companyId, id, data)
  }
  await page.setPublished(s.companyId, true)
}
await tenant.setSchoolLocation(m1, s1.companyId, 'Москва', 'RU')
await schoolPage(s1, 'Лицей, где любят математику и науки', [
  [
    'text',
    {
      heading: 'О лицее',
      body: 'Лицей «Перспектива» готовит учеников к олимпиадам и экзаменам с 2005 года. Небольшие классы, сильные учителя и современная лаборатория.',
    },
  ],
  [
    'news',
    {
      heading: 'Новости',
      items: [
        { id: 'n1', title: 'Наши ученики — призёры олимпиады по физике', body: 'Трое учеников 10-Б заняли призовые места на городской олимпиаде.', date: '2026-10-15', fileId: null },
        { id: 'n2', title: 'Открыта запись в кружок робототехники', body: 'Занятия по средам и пятницам после уроков.', date: '2026-10-02', fileId: null },
      ],
    },
  ],
  ['spotlight', { label: 'Учитель месяца', name: 'Мария Белова', text: 'Учитель физики, автор курса «Механика с нуля». Её ученики любят опыты и побеждают на олимпиадах.', fileId: null }],
  [
    'top',
    {
      heading: 'Лучшие ученики четверти',
      items: [
        { name: 'Иван Петров', note: 'Алгебра, 95 баллов', userId: null, fileId: null, fromPicture: null },
        { name: 'София Морозова', note: 'Физика, олимпиада', userId: null, fileId: null, fromPicture: null },
        { name: 'Михаил Попов', note: 'Английский, B2', userId: null, fileId: null, fromPicture: null },
      ],
    },
  ],
])
await tenant.setSchoolLocation(s2.manager.id, s2.companyId, 'Казань', 'RU')
await schoolPage(s2, 'Школа будущего в сердце Казани', [
  ['text', { heading: 'О школе', body: 'Современная школа с углублённым изучением химии и информатики. Проектное обучение с 5 класса.' }],
  ['news', { heading: 'Новости', items: [{ id: 'n1', title: 'Хакатон для 8–11 классов', body: 'Команды создавали сайты для городских музеев.', date: '2026-10-10', fileId: null }] }],
])
await tenant.setSchoolLocation(s3.manager.id, s3.companyId, 'Санкт-Петербург', 'RU')
await schoolPage(s3, 'Гуманитарная гимназия с историей', [
  ['text', { heading: 'О гимназии', body: 'Гимназия «Северная звезда»: история, языки и литература. Музей гимназии и собственный театр.' }],
])
log('school pages published')

// =============================================================================================
// credentials (git-ignored) — the password is never printed
// =============================================================================================
const lines = [
  '# Demo accounts (local, made by scripts/seed-demo.mjs). NEVER commit.',
  '',
  `Password for every account: \`${PASSWORD}\``,
  '',
  '| Email | Name | Role |',
  '|---|---|---|',
  ...accounts.map((a) => `| ${a.email} | ${a.name} | ${a.kind} |`),
  '',
]
writeFileSync(new URL('./demo-accounts.local.md', import.meta.url), lines.join('\n'))
console.log(`Done: ${accounts.length} accounts, ${Object.keys({ algebra, physics, english, biology, chemistry, web, history, python, economics, literature, essay, arabic, speaking, chess }).length} courses. Logins: scripts/demo-accounts.local.md`)
process.exit(0)
