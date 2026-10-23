// Budu — рекламный инфографик-ролик (~1:30). node build.mjs → index.html
import { readdirSync } from 'node:fs'
import { writeFileSync } from 'node:fs'
import { execSync } from 'node:child_process'

// voice clip lengths (Silero "kseniya", excited) → each scene is long enough for its line + the visuals
const VO = readdirSync(new URL('./assets/vo/', import.meta.url))
  .filter((f) => f.endsWith('.wav'))
  .sort()
  .map((f) => ({ file: `assets/vo/${f}`, dur: +execSync(`ffprobe -v error -show_entries format=duration -of csv=p=0 assets/vo/${f}`, { cwd: new URL('.', import.meta.url).pathname }).toString().trim() }))

const G = '#36d399', B = '#5b8cff', P = '#a77bf3', R = '#ff7a9c', A = '#ffc857'
let t = 0
const S = []
const add = (min, s) => {
  const vo = VO[S.length]
  const d = Math.max(min, vo ? Math.ceil((vo.dur + 2.2) * 2) / 2 : min)
  S.push({ start: t, dur: d, vo: vo && { ...vo, start: +(t + 0.35).toFixed(2) }, ...s })
  t += d
}

// tiny inline icons (stroke, 24×24)
const I = {
  play: '<path d="M8 5v14l11-7z" fill="currentColor"/>',
  doc: '<path d="M7 3h7l5 5v13H7z M14 3v5h5 M10 13h6 M10 17h6" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>',
  star: '<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z" fill="currentColor"/>',
  cal: '<path d="M4 6h16v14H4z M4 10h16 M8 3v5 M16 3v5" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>',
  chat: '<path d="M4 5h16v11H9l-5 4z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>',
  users: '<circle cx="9" cy="8" r="3.2" fill="none" stroke="currentColor" stroke-width="2"/><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6 M16 5.5a3 3 0 010 5.8 M18 14c2 .7 3 2.6 3 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
  book: '<path d="M4 5c3-1.5 6-1.5 8 .5 2-2 5-2 8-.5v14c-3-1.5-6-1.5-8 .5-2-2-5-2-8-.5z M12 5.5v14" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>',
  megaphone: '<path d="M4 10v4h3l8 4V6L7 10z M18 9a4 4 0 010 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>',
  globe: '<circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2"/><path d="M3 12h18 M12 3c3 3.5 3 14.5 0 18 M12 3c-3 3.5-3 14.5 0 18" fill="none" stroke="currentColor" stroke-width="2"/>',
  heart: '<path d="M12 20s-7-4.4-7-10a4 4 0 017-2.6A4 4 0 0119 10c0 5.6-7 10-7 10z" fill="currentColor"/>',
  bolt: '<path d="M13 2L4 14h7l-1 8 9-12h-7z" fill="currentColor"/>',
  moon: '<path d="M20 14.5A8 8 0 019.5 4 8 8 0 1020 14.5z" fill="currentColor"/>',
}
const ico = (n, c, size = 'var(--i,64px)') => `<svg viewBox="0 0 24 24" style="width:${size};height:${size};color:${c}">${I[n]}</svg>`
const tile = (n, c, label) => `<div class="tile" style="--c:${c}"><div class="tile-ico">${ico(n, '#fff', '46%')}</div>${label ? `<span>${label}</span>` : ''}</div>`

// a deterministic "random" for particle positions (fixed in the file, so every render is identical)
let seed = 7
const rnd = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280)
const CONF = Array.from({ length: 40 }, () => ({ x: (rnd() * 100).toFixed(1), c: [G, B, P, R, A][Math.floor(rnd() * 5)], r: Math.floor(rnd() * 360), y: Math.round(700 + rnd() * 400) }))
const STARS = Array.from({ length: 120 }, () => ({ x: (rnd() * 100).toFixed(2), y: (rnd() * 100).toFixed(2), s: (1 + rnd() * 2.5).toFixed(1), o: +(0.3 + rnd() * 0.7).toFixed(2) }))

// ---- scenes (one per voice line) --------------------------------------------------------------------
add(5.5, { k: 'intro' }) //  1 Представь! Одно приложение…
add(6.5, { k: 'four' }) //  2 Уроки. Задания. Тесты. Оценки.
add(5.5, { k: 'week' }) //  3 Расписание…
add(6.5, { k: 'build' }) //  4 Курс за вечер
add(5.5, { k: 'eight' }) //  5 8 типов, 1 клик
add(6, { k: 'parents' }) //  6 Родители в курсе
add(5, { k: 'chat' }) //  7 Написать учителю
add(6, { k: 'school' }) //  8 Вся школа в одном окне
add(6, { k: 'ten' }) //  9 10 систем + языки
add(6.5, { k: 'catalog' }) // 10 Курсы на любой интерес
add(6, { k: 'free' }) // 11 Бесплатно
add(7, { k: 'wonder' }) // 12 Музеи, походы, звёзды
add(7, { k: 'budu' }) // 13 Буду значит буду
add(8, { k: 'cta' }) // 14 CTA
const TOTAL = t

const html_ = {
  intro: () => `<div class="center col"><div class="big kin">Представь!</div><div class="app">${['play', 'doc', 'check', 'star', 'cal', 'chat', 'users', 'book', 'globe'].map((n, i) => `<div class="mini" style="--c:${[G, B, P, R, A][i % 5]}">${ico(n, '#fff', '44%')}</div>`).join('')}</div><div class="sub">Одно приложение. Вся учёба.</div></div>`,
  four: () => `<div class="center col"><div class="row4">${tile('play', G, 'Уроки')}${tile('doc', B, 'Задания')}${tile('check', P, 'Тесты')}${tile('star', R, 'Оценки')}</div><div class="sub big2">Всё в одном месте</div></div>`,
  week: () => `<div class="center col"><div class="kicker" style="--c:${B}">${ico('cal', B, '34px')} Расписание</div><div class="week">${['Пн', 'Вт', 'Ср', 'Чт', 'Пт'].map((d, i) => `<div class="day"><b>${d}</b>${[0, 1, 2].map((j) => `<i class="les" style="--c:${[G, B, P, R, A][(i + j) % 5]};height:${36 + ((i * 7 + j * 13) % 40)}px"></i>`).join('')}</div>`).join('')}</div><div class="sub">Всегда под рукой. Даже на телефоне.</div></div>`,
  build: () => `<div class="center col"><div class="stack">${[['play', G, 'Видео'], ['doc', B, 'Тексты'], ['check', P, 'Задания']].map(([n, c, l]) => `<div class="block" style="--c:${c}">${ico(n, c, '40px')}<span>${l}</span></div>`).join('')}</div><div class="course"><div class="course-cover"></div><b>Мой курс</b><span>${ico('moon', A, '26px')} готов за вечер</span></div></div>`,
  eight: () => `<div class="center"><div class="num" data-to="8">0</div><div class="num-cap">типов вопросов</div><div class="orbit">${['Выбор', 'Да / нет', 'Число', 'Соответствие', 'Порядок', 'Пропуски', 'Короткий ответ', 'Эссе'].map((q, i) => `<span class="chip" style="--a:${i * 45}deg">${q}</span>`).join('')}</div><div class="click">${ico('bolt', '#062', '34px')} Проверка в 1 клик</div></div>`,
  parents: () => `<div class="center col"><div class="kicker" style="--c:${R}">${ico('heart', R, '30px')} Родителям</div><div class="bars">${[['Оценки', 92, G], ['Задания', 80, B], ['Успехи', 96, P]].map(([l, v, c]) => `<div class="bar"><span>${l}</span><div class="track"><i style="--c:${c}" data-w="${v}"></i></div><b data-to="${v}">0</b><em>%</em></div>`).join('')}</div><div class="sub">Всегда в курсе</div></div>`,
  chat: () => `<div class="center col"><div class="chat"><div class="msg in">Здравствуйте! Как успехи у Ивана?</div><div class="msg out">Отлично! За контрольную 5 ${ico('check', G, '26px')}${ico('check', G, '26px')}</div><div class="msg in">Спасибо! ${ico('heart', R, '26px')}</div></div><div class="sub">Прямо в Буду</div></div>`,
  school: () => `<div class="center"><div class="win"><div class="side">${[['users', P, 'Люди'], ['book', B, 'Курсы'], ['cal', G, 'Классы'], ['megaphone', R, 'Объявления']].map(([n, c, l]) => `<div class="nav">${ico(n, c, '30px')}<span>${l}</span></div>`).join('')}</div><div class="main">${[0, 1, 2, 3, 4, 5].map((i) => `<i class="card" style="--c:${[G, B, P, R, A, G][i]}"></i>`).join('')}</div></div><div class="sub over">Вся школа в одном окне</div></div>`,
  ten: () => `<div class="center col"><div class="hrow"><div><div class="num sm" data-to="10">0</div><div class="num-cap">систем оценок</div></div><div class="scales">${['5', 'A', '4.0', '20', '10', 'S', 'ECTS', '100'].map((x) => `<span class="sc">${x}</span>`).join('')}</div></div><div class="langs">${['Русский', 'English', 'العربية', 'Deutsch', 'Français', 'Türkçe', 'Қазақша', '中文'].map((x) => `<span class="lang">${ico('globe', B, '22px')}${x}</span>`).join('')}</div></div>`,
  catalog: () => `<div class="center col"><div class="grid">${['math', 'physics', 'python', 'english', 'chess', 'chemistry'].map((p, i) => `<div class="cc" style="--k:${i}"><img src="assets/photos/${p}.jpg"><span>${['Математика', 'Физика', 'Программирование', 'Языки', 'Шахматы', 'Химия'][i]}</span></div>`).join('')}</div><div class="sub">Курсы на любой интерес</div></div>`,
  free: () => `<div class="center col"><div class="free"><span class="zero">0</span><span class="rub">₽</span></div><div class="sub big2">Для учеников бесплатно!</div><div class="sub small">Мы верим в тех, кто учится</div>${CONF.map((p) => `<i class="conf" style="left:${p.x}%;--c:${p.c}"></i>`).join('')}</div>`,
  wonder: () => `<div class="stars">${STARS.map((p) => `<i class="st" style="left:${p.x}%;top:${p.y}%;--s:${p.s}px"></i>`).join('')}</div><div class="center col"><div class="big2 glow">Учиться интересно!</div><div class="trio"><span>Музеи</span><span>Походы</span><span>Звёзды</span></div><div class="sub q">«Как это работает?»</div></div>`,
  budu: () => `<div class="center col left"><div class="bl"><b>Буду</b> знать.</div><div class="bl"><b>Буду</b> смелой.</div><div class="bl"><b>Буду</b> создавать будущее!</div></div>`,
  cta: () => `<div class="center col"><div class="logo"><svg viewBox="0 0 473.2 436.3"><g fill="${G}"><rect x="0" y="341.67" width="397.51" height="94.65" rx="17.04"/><rect x="94.65" y="228.1" width="340.73" height="94.65" rx="17.04"/><rect x="189.29" y="114.52" width="283.94" height="94.65" rx="17.04"/><circle cx="369.12" cy="41.64" r="41.64"/></g></svg><span>budu</span></div><div class="big2">Создай аккаунт</div><div class="sub">и начни уже сегодня</div><div class="btn">Начать бесплатно →</div></div>`,
}

const anim = (s, i) => {
  const id = `#s${i}`, a = s.start, e = s.start + s.dur
  const L = [`tl.fromTo("${id}", {opacity:0}, {opacity:1, duration:0.35}, ${a});`, `tl.to("${id}", {opacity:0, duration:0.35}, ${e - 0.35});`]
  const pop = (sel, at, extra = '') => L.push(`tl.fromTo("${id} ${sel}", {opacity:0, scale:0.6, y:40}, {opacity:1, scale:1, y:0, duration:0.55, ease:"back.out(2)"${extra}}, ${at});`)
  const up = (sel, at, extra = '') => L.push(`tl.fromTo("${id} ${sel}", {opacity:0, y:30}, {opacity:1, y:0, duration:0.5, ease:"power3.out"${extra}}, ${at});`)
  const count = (sel, to, at, dur = 1.2) => L.push(`(() => { const o = {v:0}; tl.to(o, {v:${to}, duration:${dur}, ease:"power2.out", onUpdate:() => document.querySelectorAll("${id} ${sel}").forEach(el => el.textContent = Math.round(o.v))}, ${at}); })();`)
  switch (s.k) {
    case 'intro': pop('.kin', a + 0.1); L.push(`tl.fromTo("${id} .mini", {opacity:0, scale:0, rotation:-30}, {opacity:1, scale:1, rotation:0, duration:0.5, stagger:0.08, ease:"back.out(2.2)"}, ${a + 0.8});`); up('.sub', a + 1.8); L.push(`tl.to("${id} .app", {rotation:6, scale:1.05, duration:${s.dur - 2}, ease:"sine.inOut"}, ${a + 1.6});`); break
    case 'four': L.push(`tl.fromTo("${id} .tile", {opacity:0, scale:0.4, y:80}, {opacity:1, scale:1, y:0, duration:0.55, stagger:0.42, ease:"back.out(1.8)"}, ${a + 0.3});`); L.push(`tl.to("${id} .row4", {gap:"10px", scale:0.9, duration:0.7, ease:"power3.inOut"}, ${a + 2.6});`); pop('.sub', a + 2.9); break
    case 'week': up('.kicker', a + 0.1); L.push(`tl.fromTo("${id} .day", {opacity:0, y:50}, {opacity:1, y:0, duration:0.45, stagger:0.1}, ${a + 0.3});`); L.push(`tl.fromTo("${id} .les", {scaleY:0, opacity:0}, {scaleY:1, opacity:1, duration:0.4, stagger:0.05, ease:"back.out(2)"}, ${a + 0.8});`); up('.sub', a + 1.8); break
    case 'build': L.push(`tl.fromTo("${id} .block", {opacity:0, x:-200}, {opacity:1, x:0, duration:0.5, stagger:0.35, ease:"power3.out"}, ${a + 0.2});`); L.push(`tl.to("${id} .block", {x:420, y:(i)=>[-40,0,40][i], scale:0.2, opacity:0, duration:0.6, stagger:0.15, ease:"power2.in"}, ${a + 2.2});`); pop('.course', a + 2.8); break
    case 'eight': pop('.num', a + 0.1); count('.num', 8, a + 0.2, 1.1); up('.num-cap', a + 0.6); L.push(`tl.fromTo("${id} .chip", {opacity:0, scale:0}, {opacity:1, scale:1, duration:0.4, stagger:0.12, ease:"back.out(2)"}, ${a + 0.8});`); L.push(`tl.to("${id} .orbit", {rotation:40, duration:${s.dur}, ease:"none"}, ${a});`); pop('.click', a + 2.2); L.push(`tl.to("${id} .click", {scale:1.08, duration:0.35, yoyo:true, repeat:5, ease:"sine.inOut"}, ${a + 2.8});`); break
    case 'parents': up('.kicker', a + 0.1); L.push(`tl.fromTo("${id} .bar", {opacity:0, x:-60}, {opacity:1, x:0, duration:0.45, stagger:0.25}, ${a + 0.4});`); L.push(`tl.fromTo("${id} .track i", {width:"0%"}, {width:(k, el) => el.dataset.w + "%", duration:1.3, stagger:0.25, ease:"power3.out"}, ${a + 0.8});`); count('.bar b', 0, a); L.push(`[92,80,96].forEach((v,k) => { const o={v:0}; tl.to(o, {v, duration:1.3, ease:"power3.out", onUpdate:() => { const el = document.querySelectorAll("${id} .bar b")[k]; if (el) el.textContent = Math.round(o.v) }}, ${a + 0.8} + k*0.25) });`); up('.sub', a + 2.2); break
    case 'chat': L.push(`tl.fromTo("${id} .msg", {opacity:0, scale:0.7, y:30}, {opacity:1, scale:1, y:0, duration:0.45, stagger:0.7, ease:"back.out(2)"}, ${a + 0.2});`); up('.sub', a + 2.4); break
    case 'school': pop('.win', a + 0.1); L.push(`tl.fromTo("${id} .nav", {opacity:0, x:-30}, {opacity:1, x:0, duration:0.35, stagger:0.18}, ${a + 0.5});`); L.push(`tl.fromTo("${id} .card", {opacity:0, scale:0.5}, {opacity:1, scale:1, duration:0.4, stagger:0.1, ease:"back.out(2)"}, ${a + 0.9});`); pop('.sub', a + 2.0); break
    case 'ten': pop('.num', a + 0.1); count('.num', 10, a + 0.2, 1); up('.num-cap', a + 0.5); L.push(`tl.fromTo("${id} .sc", {opacity:0, scale:0, rotation:-20}, {opacity:1, scale:1, rotation:0, duration:0.35, stagger:0.08, ease:"back.out(2.5)"}, ${a + 0.7});`); L.push(`tl.fromTo("${id} .lang", {opacity:0, y:30}, {opacity:1, y:0, duration:0.35, stagger:0.1}, ${a + 1.8});`); break
    case 'catalog': L.push(`tl.fromTo("${id} .cc", {opacity:0, scale:0.7, rotation:(k)=>[-8,6,-4,7,-6,5][k], y:120}, {opacity:1, scale:1, rotation:0, y:0, duration:0.6, stagger:0.15, ease:"back.out(1.6)"}, ${a + 0.2});`); up('.sub', a + 1.8); break
    case 'free': pop('.free', a + 0.1); CONF.forEach((p, k) => L.push(`tl.fromTo("${id} .conf:nth-of-type(${k + 1})", {y:-200, rotation:0}, {y:${p.y}, rotation:${p.r}, duration:2.6, ease:"power1.in"}, ${(a + 0.5 + k * 0.02).toFixed(2)});`)); pop('.big2', a + 0.8); up('.small', a + 2.0); L.push(`tl.to("${id} .zero", {scale:1.12, duration:0.4, yoyo:true, repeat:5, ease:"sine.inOut"}, ${a + 0.8});`); break
    case 'wonder': STARS.forEach((p, k) => L.push(`tl.fromTo("${id} .st:nth-of-type(${k + 1})", {opacity:0}, {opacity:${p.o}, duration:1}, ${(a + k * 0.01).toFixed(2)});`)); L.push(`tl.to("${id} .stars", {scale:1.25, duration:${s.dur}, ease:"none"}, ${a});`); pop('.glow', a + 0.2); L.push(`tl.fromTo("${id} .trio span", {opacity:0, y:30, filter:"blur(8px)"}, {opacity:1, y:0, filter:"blur(0px)", duration:0.5, stagger:0.5}, ${a + 1.2});`); up('.q', a + 3.2); break
    case 'budu': L.push(`tl.fromTo("${id} .bl", {opacity:0, x:-120}, {opacity:1, x:0, duration:0.6, stagger:1.1, ease:"power3.out"}, ${a + 0.8});`); L.push(`tl.fromTo("${id} .bl b", {color:"#ffffff"}, {color:"${G}", duration:0.4, stagger:1.1}, ${a + 1.1});`); break
    case 'cta': pop('.logo', a + 0.1); pop('.big2', a + 0.6); up('.sub', a + 1.0); pop('.btn', a + 1.4); L.push(`tl.to("${id} .btn", {scale:1.07, duration:0.5, yoyo:true, repeat:7, ease:"sine.inOut"}, ${a + 2});`); break
  }
  return L.join('\n')
}

const html = `<!doctype html>
<html lang="ru" data-resolution="landscape">
<head>
<meta charset="UTF-8" /><meta name="viewport" content="width=1920, height=1080" />
<link href="https://fonts.googleapis.com/css2?family=Geologica:wght@500;600;700;800&family=Montserrat:wght@500;600&display=block&subset=cyrillic" rel="stylesheet">
<script src="https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/gsap.min.js"></script>
<style>
*{margin:0;padding:0;box-sizing:border-box}
html,body{width:1920px;height:1080px;overflow:hidden;background:#05080a}
#root{position:relative;width:1920px;height:1080px;overflow:hidden;font-family:Montserrat,sans-serif;color:#fff}
.aur{position:absolute;inset:0;filter:blur(130px)}
.aur i{position:absolute;border-radius:50%;opacity:.55}
.a1{width:900px;height:800px;left:-250px;top:-250px;background:#0f8a5f}
.a2{width:800px;height:700px;right:-250px;top:100px;background:#2f5fd0}
.a3{width:750px;height:650px;left:600px;bottom:-350px;background:#6a3fc9}
.a4{width:520px;height:480px;right:260px;bottom:-200px;background:#c43c62}
.floor{position:absolute;inset:auto -50% 0;height:60%;transform:perspective(500px) rotateX(62deg);transform-origin:bottom;background-image:linear-gradient(rgba(255,255,255,.08) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.08) 1px,transparent 1px);background-size:70px 70px;mask-image:linear-gradient(to top,#000 20%,transparent 85%)}
.scene{position:absolute;inset:0;opacity:0}
.center{position:absolute;inset:0;display:flex;align-items:center;justify-content:center}
.col{flex-direction:column;gap:38px;text-align:center}
.left{align-items:flex-start;padding-left:260px;text-align:left}
.big{font-family:Geologica;font-size:170px;font-weight:800;letter-spacing:-.03em}
.big2{font-family:Geologica;font-size:96px;font-weight:700;letter-spacing:-.02em}
.sub{font-size:42px;color:rgba(255,255,255,.78);font-weight:500}
.sub.small{font-size:34px}
.sub.over{position:absolute;bottom:120px}
.kicker{display:flex;align-items:center;gap:14px;font-size:34px;font-weight:600;color:var(--c);background:color-mix(in oklab,var(--c) 16%,transparent);padding:12px 26px;border-radius:18px}
.app{display:grid;grid-template-columns:repeat(3,110px);gap:18px;padding:30px;border-radius:44px;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.12);backdrop-filter:blur(20px)}
.mini{width:110px;height:110px;border-radius:30px;display:grid;place-items:center;background:linear-gradient(180deg,color-mix(in oklab,var(--c) 75%,white),var(--c))}
.row4{display:flex;gap:44px}
.tile{display:flex;flex-direction:column;align-items:center;gap:20px}
.tile-ico{width:200px;height:200px;border-radius:56px;display:grid;place-items:center;background:linear-gradient(180deg,color-mix(in oklab,var(--c) 70%,white),var(--c));box-shadow:0 30px 60px -30px var(--c)}
.tile span{font-family:Geologica;font-size:48px;font-weight:600}
.week{display:flex;gap:26px;padding:34px;border-radius:36px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1)}
.day{width:170px;display:flex;flex-direction:column;gap:12px}
.day b{font-size:30px;color:rgba(255,255,255,.7);margin-bottom:6px}
.les{display:block;border-radius:14px;background:color-mix(in oklab,var(--c) 70%,transparent);transform-origin:top}
.stack{display:flex;flex-direction:column;gap:22px;position:absolute;left:330px;top:330px}
.block{display:flex;align-items:center;gap:20px;font-size:40px;font-weight:600;padding:22px 34px;border-radius:24px;background:rgba(255,255,255,.08);border:1px solid color-mix(in oklab,var(--c) 50%,transparent)}
.course{position:absolute;right:360px;top:290px;width:520px;border-radius:36px;overflow:hidden;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.14);display:flex;flex-direction:column;gap:14px;padding-bottom:30px;text-align:left}
.course-cover{height:260px;background:linear-gradient(135deg,#0f8a5f,#36d399)}
.course b{font-family:Geologica;font-size:48px;padding:0 34px}
.course span{display:flex;align-items:center;gap:12px;font-size:32px;color:${A};padding:0 34px}
.num{font-family:Geologica;font-size:360px;font-weight:800;line-height:1;background:linear-gradient(180deg,#fff,${G});-webkit-background-clip:text;background-clip:text;color:transparent}
.num.sm{font-size:280px}
.num-cap{font-size:44px;font-weight:600;color:rgba(255,255,255,.85);text-align:center}
.center>.num,.center>.num-cap{position:absolute}
.center>.num{top:200px}.center>.num-cap{top:600px}
.orbit{position:absolute;width:1300px;height:1300px;left:310px;top:-110px}
.chip{position:absolute;left:50%;top:50%;transform:rotate(var(--a)) translateY(-560px) rotate(calc(-1*var(--a)));font-size:30px;font-weight:600;padding:12px 24px;border-radius:999px;background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.18);white-space:nowrap;translate:-50% -50%}
.click{position:absolute;bottom:150px;display:flex;align-items:center;gap:14px;font-size:40px;font-weight:700;color:#04140d;background:${G};padding:22px 40px;border-radius:24px}
.bars{display:flex;flex-direction:column;gap:34px;width:1100px}
.bar{display:grid;grid-template-columns:240px 1fr 120px 40px;align-items:center;gap:26px;font-size:40px;font-weight:600;text-align:left}
.track{height:34px;border-radius:999px;background:rgba(255,255,255,.1);overflow:hidden}
.track i{display:block;height:100%;width:0;border-radius:999px;background:linear-gradient(90deg,color-mix(in oklab,var(--c) 60%,white),var(--c))}
.bar b{font-family:Geologica;font-size:56px;text-align:right}.bar em{font-style:normal;color:rgba(255,255,255,.6)}
.chat{display:flex;flex-direction:column;gap:22px;width:1000px}
.msg{display:flex;align-items:center;gap:8px;font-size:40px;font-weight:500;padding:24px 34px;border-radius:32px;max-width:80%}
.msg.in{align-self:flex-start;background:rgba(255,255,255,.1);border-bottom-left-radius:8px}
.msg.out{align-self:flex-end;background:#0f8a5f;border-bottom-right-radius:8px}
.win{width:1300px;height:640px;border-radius:36px;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.14);display:flex;overflow:hidden;margin-top:-80px}
.side{width:340px;padding:40px 30px;display:flex;flex-direction:column;gap:22px;border-right:1px solid rgba(255,255,255,.1)}
.nav{display:flex;align-items:center;gap:16px;font-size:34px;font-weight:600;padding:14px 18px;border-radius:18px;background:rgba(255,255,255,.05)}
.main{flex:1;display:grid;grid-template-columns:repeat(3,1fr);gap:24px;padding:40px}
.card{display:block;border-radius:24px;background:linear-gradient(160deg,color-mix(in oklab,var(--c) 45%,transparent),rgba(255,255,255,.04));border:1px solid rgba(255,255,255,.08)}
.hrow{display:flex;align-items:center;gap:80px}
.scales{display:grid;grid-template-columns:repeat(4,130px);gap:20px}
.sc{height:130px;border-radius:32px;display:grid;place-items:center;font-family:Geologica;font-size:48px;font-weight:700;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.15)}
.langs{display:flex;flex-wrap:wrap;justify-content:center;gap:16px;max-width:1500px}
.lang{display:flex;align-items:center;gap:10px;font-size:32px;font-weight:600;padding:12px 24px;border-radius:999px;background:rgba(91,140,255,.15)}
.grid{display:grid;grid-template-columns:repeat(3,440px);gap:30px}
.cc{position:relative;height:250px;border-radius:30px;overflow:hidden;box-shadow:0 30px 60px -30px rgba(0,0,0,.8)}
.cc img{width:100%;height:100%;object-fit:cover}
.cc span{position:absolute;left:20px;bottom:18px;font-family:Geologica;font-size:34px;font-weight:600;text-shadow:0 2px 12px rgba(0,0,0,.8)}
.free{display:flex;align-items:flex-start;font-family:Geologica;font-weight:800;line-height:.9}
.zero{font-size:420px;background:linear-gradient(180deg,#fff,${G});-webkit-background-clip:text;background-clip:text;color:transparent;display:inline-block}
.rub{font-size:160px;color:${G};margin-top:40px}
.conf{position:absolute;top:0;width:18px;height:28px;border-radius:5px;background:var(--c)}
.stars{position:absolute;inset:0}
.st{position:absolute;width:var(--s);height:var(--s);border-radius:50%;background:#fff;opacity:0}
.glow{text-shadow:0 0 60px rgba(54,211,153,.6)}
.trio{display:flex;gap:60px;font-family:Geologica;font-size:64px;font-weight:600}
.trio span:nth-child(1){color:${A}}.trio span:nth-child(2){color:${G}}.trio span:nth-child(3){color:${B}}
.q{font-size:52px;font-style:italic}
.bl{font-family:Geologica;font-size:120px;font-weight:700;letter-spacing:-.02em;line-height:1.1}
.bl b{font-weight:800}
.logo{display:flex;align-items:center;gap:24px}.logo svg{width:130px;height:120px}
.logo span{font-family:Geologica;font-size:120px;font-weight:800;letter-spacing:-.03em}
.btn{font-size:46px;font-weight:700;color:#04140d;background:${G};padding:28px 64px;border-radius:28px;margin-top:10px}
</style>
</head>
<body>
<div id="root" data-composition-id="main" data-start="0" data-duration="${TOTAL}" data-width="1920" data-height="1080">
<div class="aur"><i class="a1"></i><i class="a2"></i><i class="a3"></i><i class="a4"></i></div>
<div class="floor"></div>
${S.map((s, i) => `<section id="s${i}" class="clip scene" data-start="${s.start}" data-duration="${s.dur}">${html_[s.k]()}</section>`).join('\n')}
${S.filter((s) => s.vo).map((s, i) => `<audio id="vo${i}" src="${s.vo.file}" data-start="${s.vo.start}" data-duration="${s.vo.dur}" data-volume="1"></audio>`).join('\n')}
</div>
<script>
const tl = gsap.timeline({ paused: true });
tl.to(".a1", {x:300, y:180, duration:${TOTAL}, ease:"none"}, 0);
tl.to(".a2", {x:-260, y:200, duration:${TOTAL}, ease:"none"}, 0);
tl.to(".a3", {x:320, y:-180, duration:${TOTAL}, ease:"none"}, 0);
tl.to(".a4", {x:-300, y:-160, duration:${TOTAL}, ease:"none"}, 0);
tl.fromTo(".floor", {backgroundPosition:"0px 0px"}, {backgroundPosition:"0px ${Math.round(TOTAL * 40)}px", duration:${TOTAL}, ease:"none"}, 0);
${S.map(anim).join('\n')}
window.__timelines = window.__timelines || {};
window.__timelines["main"] = tl;
tl.seek(0);
</script>
</body>
</html>`
writeFileSync(new URL('./index.html', import.meta.url), html)
console.log(`index.html: ${S.length} scenes, ${TOTAL}s`)
