// Builds index.html (the 5-minute Budu product video) from the scene list below.
// Run: node build.mjs && npm run check && npm run render
import { readFileSync, writeFileSync } from 'node:fs'
// narration: one clip per scene (macOS voice "Milena", from VOICEOVER.md; see vo.json)
const VO = JSON.parse(readFileSync(new URL('./vo.json', import.meta.url), 'utf8'))

// ---- palette (the app's tokens, as fixed colours for video) ---------------------------------------
const C = {
  ink: '#0f1411',
  muted: '#5b6660',
  bg: '#f7faf8',
  green: '#0f8a5f',
  blue: '#2f6fe0',
  purple: '#7c4ddb',
  rose: '#e2557a',
  amber: '#d9921a',
}
const ROLE = { student: C.green, teacher: C.blue, school: C.purple, parent: C.rose, all: C.green }

// ---- scenes ------------------------------------------------------------------------------------------
// kind: hero | words | section | screen | duo | manifesto | cta
// screen: { img, kicker, title, points[], side: 'left'|'right' (where the text sits), zoom: {x,y,s} }
let t = 0
const S = []
// each scene is at least as long as its narration line (+ room to breathe before and after)
const add = (dur, scene) => {
  const vo = VO[S.length]
  const lead = scene.kind === 'manifesto' ? 1.0 : 0.5
  const d = Math.max(dur, vo ? Math.ceil((vo.dur + lead + 1.0) * 2) / 2 : 0)
  S.push({ start: t, dur: d, vo: vo && { ...vo, start: +(t + lead).toFixed(2) }, ...scene })
  t += d
}

add(13, { kind: 'hero', img: '00-home-hero-dark', title: 'Учёба, которая объединяет школу, учителей и семью', sub: 'Budu' })
add(8, { kind: 'words', words: ['Школы', 'Учителя', 'Ученики', 'Родители'], line: 'Одна платформа. Одно сообщество.' })
add(12, {
  kind: 'screen', role: 'all', img: '02-home-audiences', side: 'left',
  kicker: 'Budu', title: 'Всё обучение в одном месте',
  points: ['Уроки, задания и тесты', 'Расписание и журнал', 'Связь учителей и родителей'],
})

// students
add(4, { kind: 'section', role: 'student', title: 'Ученикам', line: 'День, в котором легко разобраться' })
add(11, {
  kind: 'screen', role: 'student', img: '20-student-home', side: 'left', zoom: { x: 30, y: 25, s: 1.35 },
  kicker: 'Главная', title: 'Всё важное за день', points: ['Следующий урок одним взглядом', 'Задания и тесты со сроками', 'Новости школы и класса'],
})
add(10, {
  kind: 'screen', role: 'student', img: '21-student-timetable', side: 'right',
  kicker: 'Расписание', title: 'Неделя как на ладони', points: ['Уроки по цветам курсов', 'События школы', 'Удобно и на телефоне'],
})
add(10, {
  kind: 'screen', role: 'student', img: '24-student-lesson', side: 'left',
  kicker: 'Уроки', title: 'Учись в своём темпе', points: ['Видео, файлы и конспекты', 'Урок за уроком', 'Первый урок курса бесплатно'],
})
add(10, {
  kind: 'screen', role: 'student', img: '25-student-homework', side: 'right',
  kicker: 'Домашние задания', title: 'Сдал и получил отзыв', points: ['Ответ и файлы в пару кликов', 'Оценка и комментарий учителя', 'Ничего не теряется'],
})
add(9, {
  kind: 'screen', role: 'student', img: '25b-student-quiz', side: 'left',
  kicker: 'Тесты и экзамены', title: 'Проверь себя', points: ['Тренировки с ответами сразу', 'Экзамены с таймером', 'Автосохранение ответов'],
})
add(8, {
  kind: 'screen', role: 'student', img: '27-student-bell', side: 'right', zoom: { x: 82, y: 22, s: 1.5 },
  kicker: 'Уведомления', title: 'Ничего не пропустишь', points: ['Новые задания', 'Оценки', 'Напоминания о тестах'],
})

// teachers
add(4, { kind: 'section', role: 'teacher', title: 'Учителям', line: 'Меньше рутины, больше времени на учеников' })
add(11, {
  kind: 'screen', role: 'teacher', img: '30-teacher-dashboard', side: 'left',
  kicker: 'Обзор', title: 'Весь класс перед глазами', points: ['Кто сдал работу', 'Что ждёт проверки', 'Объявления школы'],
})
add(12, {
  kind: 'screen', role: 'teacher', img: '32-teacher-builder', side: 'right', zoom: { x: 30, y: 45, s: 1.3 },
  kicker: 'Конструктор курса', title: 'Курс за вечер', points: ['Видео, PDF, текст и задания', 'Большие видео без обрывов', 'Черновик, пока не готово'],
})
add(10, {
  kind: 'screen', role: 'teacher', img: '33-teacher-quizzes', side: 'left',
  kicker: 'Тесты', title: '8 типов вопросов', points: ['Выбор, числа, соответствия', 'Тренировки и экзамены', 'Публикация по расписанию'],
})
add(9, {
  kind: 'screen', role: 'teacher', img: '34-teacher-schedule', side: 'right',
  kicker: 'Расписание', title: 'Уроки на всю четверть', points: ['Повторяющиеся уроки', 'Для курса или класса', 'Ученики видят сразу'],
})
add(11, {
  kind: 'duo', role: 'teacher', imgs: ['36-teacher-grading', '37-teacher-gradebook'],
  kicker: 'Проверка и журнал', title: 'Оценить и сразу дальше', points: ['Оценка и отзыв в один экран', 'Журнал в шкале вашей школы'],
})
add(9, {
  kind: 'screen', role: 'teacher', img: '39-teacher-chat', side: 'left',
  kicker: 'Сообщения', title: 'На связи с родителями', points: ['Чат прямо в Budu', 'Видно, что прочитано', 'Без чужих мессенджеров'],
})

// schools
add(4, { kind: 'section', role: 'school', title: 'Школам', line: 'Вся школа в одном окне' })
add(11, {
  kind: 'screen', role: 'school', img: '40-school-overview', side: 'right',
  kicker: 'Школа', title: 'Порядок с первого дня', points: ['Люди, курсы и классы', 'Объявления для всех', 'Приглашения по почте'],
})
add(9, {
  kind: 'screen', role: 'school', img: '43-school-class', side: 'left',
  kicker: 'Классы', title: 'Успеваемость класса', points: ['Курсы всего класса', 'Сдано и средний балл', 'Классные руководители'],
})
add(9, {
  kind: 'screen', role: 'school', img: '47-school-settings', side: 'right', zoom: { x: 35, y: 70, s: 1.35 },
  kicker: 'Шкала оценок', title: '10 систем оценок', points: ['Россия 1–5, ECTS, GPA…', 'Учителя ставят 0–100', 'Все видят в вашей шкале'],
})
add(11, {
  kind: 'screen', role: 'school', img: '10-school-page', side: 'left',
  kicker: 'Страница школы', title: 'Ваша школа в интернете', points: ['Новости и фото', 'Лучшие ученики', 'Свой адрес'],
})

// parents
add(4, { kind: 'section', role: 'parent', title: 'Родителям', line: 'Вы всегда в курсе' })
add(11, {
  kind: 'screen', role: 'parent', img: '51-parent-child', side: 'right',
  kicker: 'Успехи ребёнка', title: 'Неделя ребёнка за минуту', points: ['Сданные и просроченные задания', 'Оценки и отзывы учителей', 'Результаты экзаменов'],
})
add(9, {
  kind: 'screen', role: 'parent', img: '53-parent-chat', side: 'left',
  kicker: 'Связь с учителем', title: 'Спросить напрямую', points: ['Чат с каждым учителем', 'Ответ приходит в Budu', 'И на почту'],
})

// catalog
add(10, {
  kind: 'screen', role: 'all', img: '04-catalog', side: 'right',
  kicker: 'Каталог курсов', title: 'Курсы на любой интерес', points: ['Математика, языки, код, шахматы…', 'Поиск и фильтры', 'Цены в вашей валюте'],
})
add(9, {
  kind: 'screen', role: 'all', img: '08-pricing-plans', side: 'left',
  kicker: 'Тарифы', title: 'Ученикам бесплатно', points: ['Мы поддерживаем тех, кто учится', 'Учителя начинают без оплаты', 'Школам по размеру школы'],
})

// manifesto (to students) and the call to action
add(22, {
  kind: 'manifesto',
  lines: [
    'Учиться должно быть интересно.',
    'Budu помогает учиться. А жизнь учит дальше:',
    'музеи, прогулки в лесу, озеро летом',
    'и вопрос «а как это устроено?»',
    'Знание — это сила.',
    'Мы верим в тебя и в будущее, которое ты создашь.',
  ],
  photos: ['history', 'literature', 'physics', 'chess', 'biology', 'chemistry'],
})
add(18, { kind: 'cta', title: 'Создайте аккаунт в Budu', sub: 'Для учеников бесплатно. Учителям старт без оплаты. Школам по размеру школы.', url: 'budu-school.ru' })

const TOTAL = t

// ---- markup per scene ---------------------------------------------------------------------------------
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
const shot = (name) => `assets/screens/${name}.jpg`
const ph = (name) => `assets/photos/${name}.jpg`

function sceneHtml(s, i) {
  const id = `s${i}`
  const color = ROLE[s.role] ?? C.green
  const base = `id="${id}" class="clip scene" data-start="${s.start}" data-duration="${s.dur}" style="--c:${color}"`
  switch (s.kind) {
    case 'hero':
      return `<section ${base}>
  <div class="hero-bg"><img src="${shot(s.img)}" alt=""></div>
  <div class="hero-veil"></div>
  <div class="hero-text"><div class="brand">${esc(s.sub)}</div><h1>${s.title.split(' ').map((w) => `<span class="w">${esc(w)}</span>`).join(' ')}</h1></div>
</section>`
    case 'words':
      return `<section ${base}>
  <div class="words">${s.words.map((w, k) => `<div class="word" style="--k:${k}">${esc(w)}</div>`).join('')}</div>
  <p class="words-line">${esc(s.line)}</p>
</section>`
    case 'section':
      return `<section ${base}>
  <div class="sec"><div class="sec-dot"></div><h2>${esc(s.title)}</h2><p>${esc(s.line)}</p></div>
</section>`
    case 'screen':
      return `<section ${base} data-side="${s.side}">
  <div class="cap ${s.side}"><div class="kicker">${esc(s.kicker)}</div><h3>${esc(s.title)}</h3><ul>${s.points.map((p) => `<li>${esc(p)}</li>`).join('')}</ul></div>
  <div class="win ${s.side === 'left' ? 'at-right' : 'at-left'}"><div class="bar"><i></i><i></i><i></i></div><div class="view"><img src="${shot(s.img)}" alt="" style="transform-origin:${s.zoom?.x ?? 50}% ${s.zoom?.y ?? 50}%"></div></div>
</section>`
    case 'duo':
      return `<section ${base}>
  <div class="cap top"><div class="kicker">${esc(s.kicker)}</div><h3>${esc(s.title)}</h3><ul class="row">${s.points.map((p) => `<li>${esc(p)}</li>`).join('')}</ul></div>
  <div class="duo">${s.imgs.map((m) => `<div class="win small"><div class="bar"><i></i><i></i><i></i></div><div class="view"><img src="${shot(m)}" alt=""></div></div>`).join('')}</div>
</section>`
    case 'manifesto':
      return `<section ${base}>
  <div class="mosaic">${s.photos.map((p, k) => `<div class="tile" style="--k:${k}"><img src="${ph(p)}" alt=""></div>`).join('')}</div>
  <div class="mani-veil"></div>
  <div class="mani">${s.lines.map((l, k) => `<p class="ml" style="--k:${k}">${esc(l)}</p>`).join('')}</div>
</section>`
    case 'cta':
      return `<section ${base}>
  <div class="cta"><div class="logo"><svg viewBox="0 0 473.2 436.3"><g fill="${C.green}"><rect x="0" y="341.67" width="397.51" height="94.65" rx="17.04"/><rect x="94.65" y="228.1" width="340.73" height="94.65" rx="17.04"/><rect x="189.29" y="114.52" width="283.94" height="94.65" rx="17.04"/><circle cx="369.12" cy="41.64" r="41.64"/></g></svg><span>budu</span></div>
  <h2>${esc(s.title)}</h2><p>${esc(s.sub)}</p><div class="btn">Создать аккаунт →</div><div class="url">${esc(s.url)}</div></div>
</section>`
  }
}

// ---- animation per scene (GSAP, absolute times on the one root timeline) ----------------------------
function sceneTl(s, i) {
  const id = `#s${i}`
  const a = s.start
  const e = s.start + s.dur
  const L = []
  const fadeOut = `tl.to("${id}", { opacity: 0, duration: 0.5, ease: "power1.in" }, ${e - 0.5});`
  L.push(`tl.fromTo("${id}", { opacity: 0 }, { opacity: 1, duration: 0.5, ease: "power1.out" }, ${a});`)
  switch (s.kind) {
    case 'hero':
      L.push(`tl.fromTo("${id} .hero-bg img", { scale: 1.08 }, { scale: 1, duration: ${s.dur}, ease: "none" }, ${a});`)
      L.push(`tl.fromTo("${id} .w", { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.7, stagger: 0.12, ease: "power3.out" }, ${a + 0.6});`)
      L.push(`tl.fromTo("${id} .brand", { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.6 }, ${a + 0.3});`)
      break
    case 'words':
      L.push(`tl.fromTo("${id} .word", { opacity: 0, y: 40, scale: 0.9 }, { opacity: 1, y: 0, scale: 1, duration: 0.6, stagger: 0.55, ease: "back.out(1.6)" }, ${a + 0.3});`)
      L.push(`tl.fromTo("${id} .words-line", { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.6 }, ${a + 2.8});`)
      break
    case 'section':
      L.push(`tl.fromTo("${id} .sec-dot", { scale: 0 }, { scale: 1, duration: 0.6, ease: "back.out(2)" }, ${a + 0.1});`)
      L.push(`tl.fromTo("${id} .sec h2", { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.7, ease: "power3.out" }, ${a + 0.25});`)
      L.push(`tl.fromTo("${id} .sec p", { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.6 }, ${a + 0.7});`)
      break
    case 'screen': {
      const fromX = s.side === 'left' ? 120 : -120
      L.push(`tl.fromTo("${id} .win", { opacity: 0, x: ${fromX}, y: 30, scale: 0.96 }, { opacity: 1, x: 0, y: 0, scale: 1, duration: 0.9, ease: "power3.out" }, ${a + 0.1});`)
      L.push(`tl.fromTo("${id} .kicker", { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.5 }, ${a + 0.35});`)
      L.push(`tl.fromTo("${id} h3", { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.6, ease: "power3.out" }, ${a + 0.5});`)
      L.push(`tl.fromTo("${id} li", { opacity: 0, x: ${s.side === 'left' ? -20 : 20} }, { opacity: 1, x: 0, duration: 0.5, stagger: 0.35 }, ${a + 1.1});`)
      if (s.zoom) L.push(`tl.fromTo("${id} .view img", { scale: 1 }, { scale: ${s.zoom.s}, duration: ${Math.max(2, s.dur - 4)}, ease: "power2.inOut" }, ${a + 2.5});`)
      else L.push(`tl.fromTo("${id} .view img", { scale: 1.0 }, { scale: 1.06, duration: ${s.dur}, ease: "none" }, ${a});`)
      break
    }
    case 'duo':
      L.push(`tl.fromTo("${id} .duo .win", { opacity: 0, y: 60 }, { opacity: 1, y: 0, duration: 0.8, stagger: 0.3, ease: "power3.out" }, ${a + 0.2});`)
      L.push(`tl.fromTo("${id} .cap > *", { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 0.5, stagger: 0.2 }, ${a + 0.3});`)
      L.push(`tl.fromTo("${id} .duo .view img", { scale: 1 }, { scale: 1.05, duration: ${s.dur}, ease: "none" }, ${a});`)
      break
    case 'manifesto': {
      L.push(`tl.fromTo("${id} .tile", { opacity: 0, scale: 1.15 }, { opacity: 1, scale: 1, duration: 1.2, stagger: 0.25, ease: "power2.out" }, ${a});`)
      L.push(`tl.fromTo("${id} .mosaic", { scale: 1 }, { scale: 1.12, duration: ${s.dur}, ease: "none" }, ${a});`)
      const step = (s.dur - 4) / s.lines.length
      s.lines.forEach((_, k) => {
        L.push(`tl.fromTo("${id} .ml:nth-child(${k + 1})", { opacity: 0, y: 26, filter: "blur(8px)" }, { opacity: 1, y: 0, filter: "blur(0px)", duration: 0.9, ease: "power3.out" }, ${a + 1.2 + k * step});`)
      })
      break
    }
    case 'cta':
      L.push(`tl.fromTo("${id} .logo", { opacity: 0, scale: 0.8 }, { opacity: 1, scale: 1, duration: 0.8, ease: "back.out(1.8)" }, ${a + 0.2});`)
      L.push(`tl.fromTo("${id} .cta h2, ${id} .cta p", { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.7, stagger: 0.3, ease: "power3.out" }, ${a + 0.8});`)
      L.push(`tl.fromTo("${id} .btn", { opacity: 0, scale: 0.9 }, { opacity: 1, scale: 1, duration: 0.6, ease: "back.out(2)" }, ${a + 1.8});`)
      L.push(`tl.fromTo("${id} .btn", { scale: 1 }, { scale: 1.05, duration: 0.8, repeat: 9, yoyo: true, ease: "sine.inOut" }, ${a + 2.6});`)
      L.push(`tl.fromTo("${id} .url", { opacity: 0 }, { opacity: 1, duration: 0.6 }, ${a + 2.4});`)
      break
  }
  if (s.kind !== 'cta') L.push(fadeOut)
  return L.join('\n')
}

// ---- the page -----------------------------------------------------------------------------------------
const html = `<!doctype html>
<html lang="ru" data-resolution="landscape">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=1920, height=1080" />
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Geologica:wght@500;600;700&family=Montserrat:wght@400;500;600&display=block&subset=cyrillic" rel="stylesheet">
<script src="https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/gsap.min.js"></script>
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
html, body { width: 1920px; height: 1080px; overflow: hidden; background: ${C.bg}; }
#root { position: relative; width: 1920px; height: 1080px; overflow: hidden; font-family: Montserrat, system-ui, sans-serif; color: ${C.ink}; }
h1, h2, h3 { font-family: Geologica, Montserrat, sans-serif; letter-spacing: -0.02em; }

/* the living aurora behind every scene (one hue per blur) */
.aurora { position: absolute; inset: 0; overflow: hidden; }
.blob { position: absolute; border-radius: 50%; filter: blur(120px); opacity: .55; }
.b1 { width: 900px; height: 700px; left: -200px; top: -200px; background: #9fe3c4; }
.b2 { width: 800px; height: 700px; right: -220px; top: 60px; background: #b8cffb; }
.b3 { width: 700px; height: 600px; left: 520px; bottom: -320px; background: #d6c6f7; }
.b4 { width: 520px; height: 460px; right: 280px; bottom: -160px; background: #f9c9d6; }
.dots { position: absolute; inset: 0; background-image: radial-gradient(rgba(15,20,17,.10) 1.4px, transparent 1.6px); background-size: 28px 28px; opacity: .5; }

.scene { position: absolute; inset: 0; opacity: 0; }

/* hero */
.hero-bg { position: absolute; inset: 0; overflow: hidden; }
.hero-bg img { width: 100%; height: 100%; object-fit: cover; filter: blur(18px) saturate(1.3); }
.hero-veil { position: absolute; inset: 0; background: radial-gradient(ellipse at center, rgba(5,8,7,.45), rgba(5,8,7,.85)); }
.hero-text { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; color: #fff; padding: 0 180px; }
.brand { font-family: Geologica; font-size: 44px; font-weight: 600; color: #5fe0a8; margin-bottom: 28px; letter-spacing: .02em; }
.hero-text h1 { font-size: 104px; line-height: 1.04; font-weight: 600; max-width: 1500px; }
.w { display: inline-block; }

/* words */
.words { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; gap: 44px; }
.word { font-family: Geologica; font-size: 92px; font-weight: 600; }
.word:nth-child(1) { color: ${C.purple}; } .word:nth-child(2) { color: ${C.blue}; } .word:nth-child(3) { color: ${C.green}; } .word:nth-child(4) { color: #c43c62; }
.words-line { position: absolute; left: 0; right: 0; bottom: 300px; text-align: center; font-size: 40px; color: ${C.muted}; }

/* section title */
.sec { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 26px; }
.sec-dot { width: 96px; height: 96px; border-radius: 30px; background: linear-gradient(180deg, color-mix(in oklab, var(--c) 70%, white), var(--c)); box-shadow: 0 20px 40px -18px color-mix(in oklab, var(--c) 70%, black); }
.sec h2 { font-size: 150px; font-weight: 600; color: var(--c); line-height: 1; }
.sec p { font-size: 44px; color: ${C.muted}; }

/* screen + caption */
.cap { position: absolute; top: 0; bottom: 0; width: 560px; display: flex; flex-direction: column; justify-content: center; }
.cap.left { left: 110px; } .cap.right { right: 110px; }
.cap.top { left: 0; right: 0; width: auto; top: 80px; bottom: auto; align-items: center; text-align: center; }
.kicker { display: inline-block; align-self: flex-start; font-size: 26px; font-weight: 600; color: var(--c); background: color-mix(in oklab, var(--c) 12%, white); padding: 10px 20px; border-radius: 14px; margin-bottom: 26px; }
.cap.top .kicker { align-self: center; }
.cap h3 { font-size: 70px; line-height: 1.06; font-weight: 600; margin-bottom: 34px; }
.cap ul { list-style: none; display: flex; flex-direction: column; gap: 20px; }
.cap ul.row { flex-direction: row; gap: 48px; justify-content: center; }
.cap li { font-size: 32px; color: #2c3530; display: flex; align-items: center; gap: 16px; }
.cap li::before { content: ""; flex: none; width: 14px; height: 14px; border-radius: 5px; background: var(--c); }
.win { position: absolute; top: 150px; width: 1140px; border-radius: 26px; background: #fff; overflow: hidden; box-shadow: 0 2px 6px rgba(15,20,17,.06), 0 40px 90px -30px rgba(15,20,17,.35); }
.win.at-right { right: 90px; } .win.at-left { left: 90px; }
.bar { height: 44px; display: flex; align-items: center; gap: 10px; padding: 0 20px; background: #f1f4f2; border-bottom: 1px solid #e3e8e5; }
.bar i { width: 13px; height: 13px; border-radius: 50%; background: #d4dad6; }
.view { aspect-ratio: 16 / 9; overflow: hidden; }
.view img { width: 100%; height: 100%; object-fit: cover; object-position: top center; display: block; }
.duo { position: absolute; left: 90px; right: 90px; bottom: 90px; display: flex; gap: 40px; }
.win.small { position: relative; top: 0; width: 50%; }

/* manifesto */
.mosaic { position: absolute; inset: -60px; display: grid; grid-template-columns: repeat(3, 1fr); grid-template-rows: repeat(2, 1fr); gap: 14px; }
.tile { overflow: hidden; } .tile img { width: 100%; height: 100%; object-fit: cover; }
.mani-veil { position: absolute; inset: 0; background: linear-gradient(180deg, rgba(5,10,8,.72), rgba(5,10,8,.82)); }
.mani { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 22px; text-align: center; padding: 0 160px; }
.ml { font-family: Geologica; font-size: 56px; font-weight: 500; color: #fff; line-height: 1.15; }
.ml:nth-child(5) { font-size: 80px; font-weight: 600; color: #6be3b0; margin-top: 18px; }
.ml:nth-child(6) { font-size: 52px; color: #f5d7e0; }

/* call to action */
.cta { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 28px; text-align: center; }
.logo { display: flex; align-items: center; gap: 22px; }
.logo svg { width: 110px; height: 100px; }
.logo span { font-family: Geologica; font-size: 96px; font-weight: 700; color: #123a2c; letter-spacing: -0.03em; }
.cta h2 { font-size: 96px; font-weight: 600; }
.cta p { font-size: 38px; color: ${C.muted}; max-width: 1300px; }
.btn { margin-top: 18px; font-size: 40px; font-weight: 600; color: #fff; background: ${C.green}; padding: 26px 56px; border-radius: 24px; box-shadow: 0 24px 50px -22px rgba(15,138,95,.8); }
.url { font-size: 34px; color: ${C.green}; font-weight: 600; letter-spacing: .02em; }
</style>
</head>
<body>
<div id="root" data-composition-id="main" data-start="0" data-duration="${TOTAL}" data-width="1920" data-height="1080">
  <div class="aurora"><div class="blob b1"></div><div class="blob b2"></div><div class="blob b3"></div><div class="blob b4"></div><div class="dots"></div></div>
${S.map(sceneHtml).join('\n')}
${S.filter((x) => x.vo).map((x, i) => `<audio id="vo${i}" src="${x.vo.file}" data-start="${x.vo.start}" data-duration="${x.vo.dur}" data-volume="1"></audio>`).join('\n')}
</div>
<script>
const tl = gsap.timeline({ paused: true });
// the aurora drifts slowly the whole time (deterministic)
tl.to(".b1", { x: 260, y: 140, duration: ${TOTAL}, ease: "none" }, 0);
tl.to(".b2", { x: -220, y: 180, duration: ${TOTAL}, ease: "none" }, 0);
tl.to(".b3", { x: 300, y: -160, duration: ${TOTAL}, ease: "none" }, 0);
tl.to(".b4", { x: -260, y: -120, duration: ${TOTAL}, ease: "none" }, 0);
${S.map(sceneTl).join('\n')}
window.__timelines = window.__timelines || {};
window.__timelines["main"] = tl;
tl.seek(0);
</script>
</body>
</html>
`
writeFileSync(new URL('./index.html', import.meta.url), html)
console.log(`index.html: ${S.length} scenes, ${TOTAL}s (${Math.floor(TOTAL / 60)}:${String(TOTAL % 60).padStart(2, '0')})`)
