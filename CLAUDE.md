# CLAUDE.md — Budu (Буду)

Guidance for Claude Code working in this repo. Read this first — it is the project's memory.
**Keep it current:** when you finish a piece of work or the owner makes a decision, update
"Status", "Decision log" and "Open questions" below in the same session.

## What Budu is
Budu (Russian "Буду", "I will") is a multi-tenant online learning platform: schools first, but not only schools. Every organisation is a **tenant** (an IOMAD "company") with its own users, courses, branding and seats:
- **Schools / institutions** — run classes, enrol students, buy seats (B2B).
- **Companies / training centres** — staff training, onboarding, certification (B2B).
- **Independent teachers** — publish courses under their own name (a solo teacher is just a one-person tenant).
- **Learners** — belong to a tenant (e.g. a school class with a timetable), and can take extra marketplace courses.

Market focus: RU / AR / EN audiences; live + self-paced + marketplace in one place.

## Architecture (do not drift from this)
- **IOMAD = system of record** for tenants (companies), identity, users, roles, courses, enrolment, assignments, and the **gradebook**. IOMAD is a multi-tenant fork of Moodle 4.5 LTS, so Moodle docs/APIs apply, plus IOMAD's `block_iomad_company_admin_*` web-service functions for tenants. Never write its DB directly — integrate through the **Web Services REST API** (enable Web Services on day one). Built from source in `iomad/` (branch `IOMAD_405_STABLE`).
- **Tenancy:** a tenant (school, company, solo teacher) is an **IOMAD company** inside one IOMAD instance, not a separate install. Each tenant record in app-db stores `iomad_url` + `company_id`, and every IOMAD call is parameterized by those two fields — never hardcode a single IOMAD URL (keeps it shard-ready).
- **BigBlueButton = live classes** (recording, in-session chat). Runs on its own server (not containerised here).
- **Frontend = Next.js 16 (React 19) + Tailwind 4** — custom UI over IOMAD/BBB. In `frontend/`.
- **PostgreSQL (`app-db`)** — the frontend's own data, things IOMAD doesn't own: sessions, one-time auth tokens, the tenant registry (`tenants`), later AI outputs/custom features. Not a second source of truth for identity or roles.
- Chat: BBB chat in-session; IOMAD (Moodle) Forum for persistent class discussion; add Supabase/Realtime only if a custom in-app chat is needed later.

## Product rules (from the design spec — don't change without the owner)
- **Roles:** student, teacher, manager (school). A solo teacher = a one-person tenant.
- **Grades:** always stored 0–100; displayed in the tenant's chosen scale (0–100, A–F, GPA 4.0, ECTS,
  Germany 1–5, France 0–20, Russia 1–5, Russia 1–5 + ECTS "5A/4B/4C/3D/3E/2F", 0–10, Japan S/A/B/C).
  The scale is a manager setting; teachers always enter 0–100.
- **Course lifecycle:** teachers publish under their own name. Free course → a manager adds it to the
  school and picks classes (instant). Paid course → the manager requests it and the platform admin
  arranges the deal off-app. Students can also buy courses individually or "ask school".

## Repo layout
```
docker-compose.yml      # app-db (postgres 18) · iomad + iomad-db (mariadb 11.8) · frontend; BBB not included; email = a real SMTP mailbox
.env.example            # copy to .env, then replace every change_me with random values (never commit .env)
iomad/                  # IOMAD image built from source (no maintained upstream image)
  Dockerfile            #   php:8.3.x-apache (pinned) + IOMAD_405_STABLE + our files
  config.php            #   all settings from env vars (no secrets in the image)
  entrypoint.sh         #   first boot installs, later boots upgrade; runs cron every minute
  ws-setup.php          #   API setup for the frontend (integration user/role/token) — see "Running"
  local_budu/           #   our Moodle plugin: WS functions IOMAD lacks (get_account, check_password)
frontend/
  app/                  # Next.js ROUTING ONLY — each page.tsx re-exports a page from src/pages
  proxy.ts              # Next 16 "proxy" (ex-middleware): no session cookie → /login
  pages/README.md       # empty on purpose: stops Next treating src/pages as the Pages Router
  src/                  # Feature-Sliced Design (see below)
```

## Frontend architecture — Feature-Sliced Design
Docs: https://feature-sliced.design/ . Layers, top to bottom. **A layer may only import from layers
below it**, and never from a sibling slice on the same layer (no feature → feature imports).

| Layer | What goes there | Examples here |
|---|---|---|
| `src/app` | app-wide setup: root layout, global styles, providers | `layouts/RootLayout`, `styles/globals.css` |
| `src/pages` | one slice per screen; composes widgets/features/entities | `home`, `timetable`, `classes`, `class-hub`, `lesson`, `homework`, `explore`, `live`, `account`, `admin-tenants`, `login`, `register`, `forgot-password`, `reset-password`, `verify-email` |
| `src/widgets` | big self-contained UI blocks used by pages | `app-shell`, `week-calendar`, `class-hub`, `course-catalog`, `live-classroom` |
| `src/features` | one user action each (interactive, may call the server) | `sign-in`, `sign-up`, `sign-out`, `reset-password`, `verify-email`, `switch-theme`, `mark-lesson-complete`, `submit-homework`, `request-course`, `upload-avatar` |
| `src/entities` | business objects: their model + display UI | `session` (signed-in user), `user` (IOMAD accounts), `tenant`, `subject`, `lesson`, `homework`, `course` |
| `src/shared` | no business logic; reused everywhere | `ui` (kit), `lib` (cn, color, password), `server` (IOMAD client, db, tokens, mailer), `mock` (prototype data), `config` (nav, roles, auth), `i18n`, `theme` |

Slice layout: `ui/` (components), `model/` (types, client state, validation), `lib/`, `config/`,
`server/` (server-only code), plus an `index.ts` **public API**. Import slices only through it:
`import { SubjectCard } from '@/entities/subject'` — never `@/entities/subject/ui/SubjectCard`.
`shared` is the exception: import per segment (`@/shared/ui/button`, `@/shared/lib/cn`).

**Server code & security — NO API routes (two exceptions: `/files`, `/uploads`, see Decision log); the browser talks to server actions.**
- `server/actions.ts` (file starts with `'use server'`) = **server actions**: the only server code the
  browser can call. Each one is a public endpoint — validate input, check the session/role inside it.
- Every other file in a `server/` folder is a **private helper** (db, tokens, IOMAD, mail, cookies) and
  starts with `import 'server-only'`, so importing it into client code fails the build. Never turn a
  helper into a server action (that would expose it to the internet).
- A slice's server API is `server/index.ts`, imported as `@/entities/session/server` etc. — only from
  server components, server actions and other server modules. `index.ts` stays client-safe.
- Entities may use each other only via FSD cross-imports: `entities/user/@x/session.ts` = what the
  session entity may import from user.

Adding a screen: write `src/pages/<name>/ui/<Name>Page.tsx` + `index.ts`, then a one-line route in
`frontend/app/(shell)/<path>/page.tsx`: `export { NamePage as default } from '@/pages/<name>'`.
Unbuilt screens stay in `shared/config/nav.ts` with `href: null` (rendered disabled).

## UI conventions
- **shadcn/ui (real components)**: generated by the shadcn CLI into `src/shared/ui` (style
  `radix-vega`, Radix primitives, `components.json` aliases point at FSD folders). Add one with
  `docker compose exec -T frontend npx shadcn@4.21.3 add <name> -y` — then fix its imports: the CLI
  writes `from "cn"` (must be `@/shared/lib/cn`) and adds stray deps (`cn`, `lucide-react`,
  `next-themes`) that must be uninstalled. Compose screens from Card (`CardHeader`/`CardTitle`/
  `CardContent` — a bare `<Card>` has no horizontal padding and is `flex-col gap-6`), Item, Empty,
  Sidebar, Badge, Alert, Button (`asChild` for links). Budu-only variants added to generated files:
  Badge `success|warning|info|live`, Alert `success|info`, Button `highlight` (amber CTA).
  Dangerous actions (delete, remove, cancel, reject) ALWAYS use `ConfirmButton`: a calm NEUTRAL
  button (outline / link / ghost icon; red only on hover) that opens an iOS/macOS-style alert — compact centred card, the action's `icon` in a red circle, a title
  that NAMES the thing ("Remove Class 10 from “Physics 101”?" — never just "Remove?"), the
  consequence (`description`), then two big stacked buttons: solid red action (icon + verb) and
  "Cancel" (focused). When the action itself is a cancel, pass `keepLabel` ("Keep the invitation").
  Red is only for the point of no return (the alert's final button, a menu's Delete item) — owner:
  red everywhere looks alarming. One primary (green) action per card; secondary ones as quiet links.
  Lists with many rows (lessons, lesson items): no red button per row — put the row's actions in a
  quiet "⋯" `MoreMenu` (ordinary actions, a divider, then the red one, which opens `ConfirmDialog`).
  Our own helpers in shared/ui: `Field`, `SubmitButton`, `ConfirmButton`, `PasswordInput`,
  `PasswordStrength`/`PasswordMatch`, `ScreenHead`, `InitialsAvatar`, `LocalTime`, `Icon`.
  Auth screens use `AuthShell` (widgets/auth-shell): split screen on desktop (form + brand panel),
  form only on phones, `back` = "← Back to sign in" above the title.
- **Icons: Hugeicons** (free set, `@hugeicons/react` + `@hugeicons/core-free-icons`). App code uses
  `<Icon name="book" />` (`shared/ui/icon.tsx` maps names → icons); add a name there. Don't cast
  strings to `IconName` — a missing name crashes at runtime ("currentIcon is not iterable").
- **Animation: Motion** — `import { motion } from 'motion/react'` (the `motion` package, not
  `framer-motion`). Keep it subtle: `PageTransition` (screens fade in), `Appear` (confirmations),
  animated tab underline. Respect reduced motion (`useReducedMotion`).
- **State: Zustand.** Per-user state uses a store created per request via context
  (`SessionProvider` + `useSession` in `entities/session`) — never a module-level store for user data,
  or the server would share it between requests. Global, user-agnostic state (the persisted theme,
  `shared/theme/store`) may use a plain `create()` store. Form/local UI state stays in `useState`.
- **Mutations: server actions**, not API routes. Forms use React 19 `useActionState` (from `react`) +
  `SubmitButton` (`useFormStatus`). Example: `features/sign-up/server/actions.ts`.
- Next 16: `cookies()`, `headers()`, `params`, `searchParams` are **async** (await them); page props
  are `{ params: Promise<…> }`.
- Password fields use `PasswordInput` (`shared/ui/password-input`): show/hide toggle, every form.
- Mock data lives in `shared/mock` and is replaced screen by screen with IOMAD data.

## Design principles — how to work on ANY screen (owner, 2026-10-22: "always think like this")
Design is a first-class task here, not decoration. For every screen or component:
1. **Research first, then design.** Look at how the best current products solve it (Apple HIG,
   Linear, Stripe, Airbnb, Telegram …) and say what you took from where. Aim for a 2027 feel —
   clean, calm, confident — but never at the cost of clarity.
2. **Fit the app.** Reuse our components, sizes, radii and tokens; nothing that looks foreign (the
   owner rejected a round "pill" picker: "we don't have anything rounded like this"). Consistency
   beats novelty.
3. **Calm by default.** One primary (green) action per card; secondary ones as quiet outline/link
   buttons. Red only at the point of no return (the alert's final button, a menu's Delete). Many
   rows → a "⋯" menu, not a button per row. No alarming colours "everywhere".
4. **Say exactly what happens.** Titles name the thing ("Remove Class 10 from “Physics 101”?"),
   one line says the consequence. No vague "Remove?", no "≈", no labels that add nothing
   ("Popular"). Show real data only — empty config = hidden, never invented.
5. **Mobile is critical.** Design phone-first: one column, full-width controls, ≥44 px touch targets,
   cards become compact rows, no horizontal scroll; desktop can add a second column / panel.
6. **Delight through feedback, not ornaments.** Live, useful micro-interactions: strength meters,
   ✓ checklists, "passwords match", sent/delivered/seen ticks, instant updates, subtle Motion
   (respect reduced motion). Every state designed: empty, loading, error, success.
7. **All three languages and both themes.** Check RU (long words), AR (RTL: logical classes, mirrored
   arrows) and dark mode; plurals via `plural()`.
8. **Showcase, not boxes (owner, 2026-10-22).** For public / highlight content (school page blocks,
   rankings, people) don't default to a grid of bordered cards — that reads as "old". Do what the
   top-students podium does: content floating on the page, a layout with meaning (winner centred,
   raised, bigger), depth from gradients that fade into the background and a soft glow, big
   photos/initials with a ring, small custom badges from tokens (round medal) instead of emoji;
   hierarchy by size, not borders. Dark mode = lower opacities; RTL mirrors; phones keep it.
9. **Verify by looking.** Open it in the browser (desktop AND narrow width) before saying it's done;
   say what was and wasn't checked. If the owner doesn't like a change, revert it fully, no argument.

**Everything visual is a token in `frontend/src/shared/theme/tokens.css`** — the ONLY theme file
(Tailwind 4: no tailwind.config). It is the owner's shadcn theme (emerald primary, neutral base):
`:root` = light, `.dark` = dark (the `<html>` class, set by `shared/theme/store` + `ThemeSync`, and
before paint by the script in RootLayout), mapped to Tailwind by `@theme inline`. Use the standard
shadcn classes: `bg-background`, `bg-card`, `text-foreground`, `text-muted-foreground`, `bg-muted`,
`border-border`, `border-input`, `bg-primary`/`text-primary-foreground`, `text-destructive`,
`bg-sidebar` … Budu extras: `success`/`warning`/`info` (tints via opacity, `bg-success/10`),
`highlight` (amber CTA), `subject-purple`/`subject-terra`, `bg-brand` (gradient utility), and the
fixed dark live-classroom stage (`bg-live`, `text-live-foreground` …). Rules:
- **Never hardcode hex/oklch, `white`/`black`, or rgba** in components; add a token instead.
- Inline `style` is OK only to pass a token through (e.g. a subject's `var(--color-info)`), or to mix
  tokens with `tint()` from `shared/lib/color`.
- Base styles go in `@layer base` in `src/app/styles/globals.css` (unlayered CSS would beat utilities).

## Conventions
- TypeScript + Tailwind utilities. Use `cn()` for conditional classes.
- Dark mode = same tokens, dark values (`.dark` class; 'system' follows the OS). Don't add a parallel colour system.
- **Localization: English, Russian, Arabic** (up to ~10 planned). The languages are ONE list,
  `LANGUAGES` in `src/shared/i18n/config.ts` (code, native name, dir); pickers, `<html lang/dir>`, RTL
  and Accept-Language matching all derive from it — see the steps in that file to add one.
  **Language pickers must scale to 10+ languages (owner, 2026-10-22):** a row/button with the current
  language that opens a scrollable list (`LanguageMenu` dropdown, `LanguageSheet` bottom sheet on
  phones, `LanguagePicker` select) — never a segmented control or one button per language.
  `Segmented` (`shared/ui/segmented`) is only for small FIXED sets (e.g. theme light/dark/auto).
  Strings live in `src/shared/i18n/en.ts` (reference);
  `ru.ts` and `ar.ts` are typed `typeof en`, so a missing key fails the build — add every new string
  to all three. Server components / server code: `const t = await getT()` (`@/shared/i18n/server`);
  client components: `const t = useT()` (`@/shared/i18n`). Never import a dictionary directly or use
  `t` at module level (nav items hold label *keys*). Locale = `budu_locale` cookie (Settings / globe
  menu, `features/switch-language`), else the browser's PREFERRED language if we have it,
  else English — never a lower-ranked one (owner: German browser → English, not Russian; `matchLocale`).
  At sign-in the ACCOUNT's language (IOMAD pref `budu_locale`) wins and is written to the cookie, so
  it follows the user to every device; a first sign-in saves what they see as their language (`syncLocale`). `<html lang dir>` is set in RootLayout:
  Arabic is RTL with IBM Plex Sans Arabic (`:root[lang='ar']` in tokens.css) and the sidebar on the
  right. Use logical classes only (`ms-`/`me-`/`ps-`/`pe-`/`start-`/`end-`/`text-start`, `rtl:`).
  Dates via `LocalTime` (viewer's zone + UI language). Emails use the requester's language.
  Course/lesson titles and other content are data (mock now, IOMAD later), not strings.
- Keep it **simple-first** — minimal implementations, no premature complexity.

## Roles
`admin` (platform administrator) · `manager` (runs a school/company) · `teacher` · `student` ·
`parent` (follows their children; linked in IOMAD, see Decision log).
- Resolved at sign-in **from IOMAD**, first match wins (`entities/user/lib/role.ts` → `roleFor`):
  IOMAD site admin → admin; school manager → manager; educator → teacher; other manager → manager;
  parent of ≥ 1 child → parent; else → student. One role per session for now (multi-role switching =
  future; today a student or teacher who is also a parent sees only one side).
- Each role has its nav in `shared/config/nav.ts` (`NAV`, `homeFor`); unbuilt screens `href: null`.
- **Authorization is server-side:** pages/actions that need a role call
  `await requireRole('admin', …)` (`@/entities/session/server`) — wrong role → 404. Hiding a nav item
  is not access control. Today: `/admin` is admin-only; student screens are mock UI.
- **Adding a role:** add it to `Role`/`ROLES` (`shared/config/nav.ts`), fix every compile error
  (`NAV`, `t.role`, `t.ctx` …), add its rule to `roleFor` (most powerful first), give its pages
  `requireRole`, and record it in the Decision log.

## Auth (IOMAD = identity; app-db = sessions & one-time tokens)
Routes (public): `/login`, `/register`, `/forgot-password`, `/reset-password?token=`, `/verify-email?token=`.
Everything else needs a session: `proxy.ts` redirects when the cookie is missing (fast), and
`AppShell` validates it against Postgres (`getSession()`), so expired/revoked sessions also bounce.
Sessions re-read role/name from IOMAD every 5 minutes (`refreshed_at`): role changes apply without
signing out; a suspended/deleted account's sessions end. (An email change in IOMAD also ends them.)
- **Register** (`features/sign-up`): school → IOMAD company + manager; teacher → own one-person company,
  manager + educator; student → independent learner (joins a school later by invite). The account is
  then **suspended in IOMAD** until the emailed confirmation link (48 h, single-use) is opened.
  Schools/teachers also get a `tenants` row (`iomad_url` + `company_id`).
- **Sign in** (`features/sign-in`): email → `local_budu_get_account` (username, suspended, memberships) →
  `local_budu_check_password` (Moodle's `authenticate_user_login`: lockout after 10 failures,
  suspension, logging; no Moodle session) → session row + HttpOnly cookie `budu_session` (30 days) →
  the role's home (`homeFor`). Role from IOMAD membership: educator → teacher, manager → manager,
  else student. Unconfirmed accounts get "confirm your email" + resend.
- **Reset** (`features/reset-password`): always answers "if an account exists…" (no enumeration),
  emails a 1-hour single-use link, new password + confirmation → `core_user_update_users`, then
  **all of that user's sessions are revoked**.
- **Sign out** (`features/sign-out`): deletes the session row + cookie.
- Tokens/sessions: random secrets, **only sha256 hashes stored** (`shared/server/tokens.ts`).
  Tables (`sessions`, `auth_tokens`, `tenants`) are created by `shared/server/db.ts` (`SCHEMA`); it
  re-applies whenever `SCHEMA` changes — additive, idempotent statements only (no real migrations yet).
- Email: `shared/server/mailer.ts` (nodemailer) through a REAL mailbox, also in dev (owner removed
  Mailpit 2026-10-22): `no-reply@budu-school.ru` on Timeweb (`smtp.timeweb.ru:465`, SSL); settings
  `SMTP_*`, `MAIL_FROM`, `APP_URL` in `.env`. Dev emails now really go out — test with your own address. Email text lives in
  `t.email`; EVERY email uses ONE layout, `shared/server/mail-layout.ts` `composeMail`: modern and
  minimal, everything CENTRED (owner — same in Arabic): logo loaded from the site
  (`public/email-logo.png`) when APP_URL is a real domain — no attachment; on localhost it travels
  inline (cid, no file name; `src/assets/logo-email.png`) because nobody can reach your Mac; heading, message, one green button that
  works in Outlook, link fallback, quiet footer, plain-text twin —
  the only place hex colours are allowed outside tokens.css (clients can't read CSS variables).
- IOMAD side: `iomad/local_budu` (plugin: `get_account` incl. `siteadmin`, `check_password`) + `iomad/ws-setup.php`
  (integration user/role/token, allowed functions, lockout). New IOMAD function needed → add it to
  `FUNCTIONS` (and any capability) there and re-run the script.
- Not done yet: rate limiting beyond IOMAD lockout (e.g. on register/forgot), captcha, inviting
  users into a school, changing email from Settings.

## Running
```bash
cp .env.example .env            # fill every change_me with random values (DB users/names too)
docker compose up -d --build    # first IOMAD boot builds + installs (a few minutes)
# once per fresh IOMAD install — create the API token and give it to the frontend:
T=$(docker compose exec -T -u www-data iomad php /usr/local/share/budu/ws-setup.php | tr -d '\r\n')
sed -i '' "s/^IOMAD_WS_TOKEN=.*/IOMAD_WS_TOKEN=$T/" .env && docker compose up -d frontend
```
- Frontend http://localhost:3000 · IOMAD `IOMAD_URL` (currently http://localhost:9999; host port =
  `IOMAD_PORT`, keep both in sync) · Postgres on 5432.
- IOMAD admin login: `IOMAD_ADMIN_USER` / `IOMAD_ADMIN_PASSWORD` from `.env`.
- Re-run `ws-setup.php` (idempotent) after changing its function/capability lists or the plugin.
- After adding frontend deps: `docker compose up -d --build -V frontend` (`-V` refreshes node_modules).
- Versions (Oct 2026): Node 24.21 (image), Next 16.3, React 19.3, TypeScript 6.0 (not 7 — Next
  type-checks via the TS JS API), Tailwind 4.3, Postgres 18.6, MariaDB 11.8.8 LTS, PHP 8.3.33,
  IOMAD 4.5 LTS. Pick new versions that are ≥ 2 weeks old and pin exact tags (no floating `latest`).
- DB credentials are baked into the volumes on first boot: changing them in `.env` means
  `docker compose down -v` (wipes ALL data — ask the owner first).
- Typecheck: `docker compose exec -T frontend npx tsc --noEmit`.

## Status (update this as work lands)
Built and verified:
- Infra: IOMAD 4.5 (multi-tenant Moodle) from source, MariaDB, app Postgres, Next.js frontend.
- IOMAD API: restricted integration user + token; `local_budu` plugin; account lockout after 10 failures.
- Auth: register (school / teacher / student; no password confirmation — owner: forgotten = reset) → email confirmation → sign in →
  sign out; forgot/reset password; sessions in Postgres; route protection. Tested end to end.
- Student screens (UI on **mock data**): home, timetable (week grid + mobile day view), my classes,
  class hub (lessons/homework/classmates tabs), lesson, homework submit, explore (marketplace), live
  classroom (student + teacher controls), account settings (photo preview, language, theme, sign out).
- Design system: shadcn/ui components + owner's shadcn theme (tokens.css), Hugeicons, sidebar shell, Motion
  animations, dark mode, show/hide password on every password field.
- Roles: admin / manager / teacher / student from IOMAD; admin "Tenants" page (live IOMAD data);
  server-side `requireRole`; sessions refresh role every 5 min.
- Stack upgraded 2026-10-19 (see Running → Versions).
- Public catalog (tested 2026-10-21 as a visitor over HTTP): `/catalog` and `/catalog/:id` need no
  account (route group `(public)`, `PublicLayout`: language, currency, Sign in / Sign up). `/` is the
  marketing landing page for visitors (hero, who it's for, featured courses; signed-in users → home). Course covers: teachers upload one in the course builder (Moodle course image,
  `course/overviewfiles`); without one a generated gradient + initials (`entities/course` CourseCover).
  Students keep `/explore` (same `widgets/course-catalog`). "I have an account" signs in straight to
  that course's enrol page. Visitors' currency = cookie `budu_currency`.
- School exams without a course (tested 2026-10-21, API + browser): managers' nav Exams
  (`/school/exams`). An exam lives in the school's hidden exam space (`local_budu` `school_exams.php`)
  and is given to an audience: whole classes (current students), chosen students, or candidates
  pasted as "Name, email" lines (new people get an invite link naming the exam; existing accounts
  are added + notified). Results show pass / fail colours; "Invite to school" (one or all who passed)
  uses the normal school invite (they still accept). Candidates take it from their home page.
- Quizzes & exams (tested 2026-10-21, API + browser, RU UI): Moodle's quiz engine via `local_budu`
  `quizzes.php`. A quiz belongs to a course (optionally only some classes = their groups). Kinds: quiz
  (practice: unlimited tries, answers right after) / exam (1 try, score after submit, answers after
  close; per-question marks hidden until then). 8 question types (multiple choice one/many, true/false,
  short answer, number ± tolerance, written answer graded by hand, matching, ordering, missing words).
  Teacher: course tab Quizzes (`/courses/:id/quizzes`, editor, results, grading). Publish now or
  scheduled (hidden by an availability date until then; announced by the after-page-load job).
  Time limit per student: autosave ~1.5 s after each change; at zero what was answered is submitted.
  Student: course tab Quizzes, home card, `/quiz/:attemptId` (+ `/review`). Quiz/exam grades are
  gradebook columns; parents see exam results. Notifications: published (students; parents for
  exams), to grade (teachers), graded (student), exam result (parents), closes-in-24-h reminder.
- Courses & marketplace (tested 2026-10-21 in the browser): lessons hold videos, files, homework and
  rich-text pages (Tiptap editor `shared/ui/rich-text-editor`; stored as Moodle mod_page, HTML cleaned
  by Moodle's HTMLPurifier on save AND read, shown with `RichText`). Teachers list a course in
  Explore with a price in any currency (`course_listings`; empty/0 = free). Students see prices in
  their Settings currency (default RUB), converted with daily rates (`shared/server/fx.ts`, admin
  overrides at `/admin/settings`) and rounded UP to a tidy figure, no "≈" (`roundUpPrice`: 1 239 → 1 240;
  the RUB transfer amount uses the same figure). The Settings currency is mirrored into the
  `budu_currency` cookie (on change and at sign-in), so the signed-out catalog matches. Free → "Enrol for free" (no school step). Paid → order
  (`orders`, number BU-000001) + popup: transfer the RUB amount to +79219263517 via Sberbank / SBP
  with the order number, receipt to billing@budu.ru (`shared/config/payment.ts`) → "I've paid" →
  platform admin confirms at `/admin/payments` → enrolled + notified. Admin confirm step not
  browser-tested (needs the IOMAD admin password).
- Parents (tested 2026-10-21 in the browser, all paths): after sign-in a student without a parent
  gets the "Add your parent" step (`/welcome/parent`, skippable; home keeps an "Add a parent" card
  until one accepts; Settings → Parents to add / cancel / remove). Existing account → request in
  `/invites` (bell + email); no account → suspended account + emailed link, choosing a password =
  accepting. Parent home `/family` (per child: last 7 days, overdue, averages; announcements, school
  events), `/family/:id` (24 h / 7 d / 30 d: handed in, late, overdue, feedback, course averages,
  teachers + Message). Parent ↔ teacher chat `/messages` (polls every 5 s; teachers start from a
  course's Students tab → `/messages/new?student=`); the first unread message is emailed, not every
  line. Announcements have an audience: whole school or one / several classes at once (managers,
  on `/school`), or one course (its teachers, course tab Announcements — teachers never post to
  classes or the school). Each reaches its people + their parents (bell +
  email; class teachers for a class) and shows on their home, class ones / course ones with a badge;
  course ones also on the student's course page. Teachers see all their schools, grouped by school
  (newest 5 per school).
- Timetable (tested 2026-10-21, all roles): `/timetable` = week calendar on real IOMAD calendar
  events (`widgets/week-calendar`): lessons of the user's courses positioned by time, one colour per
  course, school events in an all-day/amber lane, now-line, popover details, mobile day strip +
  agenda, `?week=` navigation. Teachers/managers schedule repeating lessons per course
  (`/courses/:id/schedule`: weekdays, time, duration, date range, optional class); school managers
  add/delete school events (members notified). Student/teacher home shows next lesson, today and
  school events from the same data.
- Classes (tested 2026-10-21): a class ("Class 10", "11-A") = Moodle cohort in the school's category
  (component local_budu). Managers create classes, add students, pick optional class teachers and
  enrol the class into courses (cohort sync: joining/leaving the class enrols/unenrols); the class
  page shows each course's handed-in % and average grade; the gradebook filters by class. Teachers:
  "My courses" (`/courses`, tabs Content | Students — enrol a class or single students) and "My
  classes" (`/teach/classes`, classes they're class teacher of, read-only; hidden outside a school).
  Students see their class names on home. Solo teachers/students simply have no classes.
- School manager (live IOMAD data, tested end to end 2026-10-21 with a fresh school): overview
  (`/school`), people with invites + role changes (`/school/people`), courses (`/school/courses`),
  gradebook, grade-scale setting (`/school/settings`). Invites: new people get a 7-day link
  (`/accept-invite`); existing accounts get a pending invite they accept or decline (home banner +
  notification) — a school can never add someone without their approval.
- Notifications: bell in the header (unread count, list, mark read, polls every 60 s) + email for
  enrolled / new homework / homework handed in / graded / added to school, in the recipient's language.
- Grades shown in the school's scale everywhere (stored 0–100; `shared/lib/grade-scale.ts`).
- Homework loop on live IOMAD data (tested in the browser 2026-10-21): teacher adds students by
  email (`/teach/classes/:id`), adds homework to lessons (course builder), grades answers 0–100 with
  feedback (`/grading`, "Save & next"), sees the students × homework grid (`/gradebook`) and a
  dashboard (`/teach`). Students see their enrolled courses (`/classes`), lessons with streamed
  video / PDFs (`/classes/:id/lessons/:lessonId`), hand in text + files and see grade + feedback
  (`/classes/:id/homework/:homeworkId`); student home shows real courses and homework due.
- Settings: profile photo saved as the IOMAD user picture (shown in the sidebar via `/files/:id`),
  first/last name, password change (current password checked by IOMAD, other devices signed out),
  language, theme. Tested 2026-10-21.
- UI fully in English / Russian / Arabic (RTL), switchable in Settings or the header globe menu.
- School public page (tested 2026-10-22 as a manager + visitor): `/school/page` editor, public
  `/schools/<slug>` with hero + 5 block kinds, photos via IOMAD, draft preview for managers only.
  Content keeps its own text direction (`shared/lib/text-dir` `contentDir`): an Arabic school reads
  right-to-left in any UI language; hero and each block decide separately.
- Connection strip (`shared/ui/connection-status`, in RootLayout, every page): offline → dark strip at
  the bottom; back online → green "Back online" for 3 s (like YouTube).
- Teacher course builder (live IOMAD data): `/courses` (my courses), `/courses/new`, `/courses/:id`
  (details, publish/draft, lessons add/rename/move/delete, upload video/PDF/files, tasks with due date
  + attachment). Files via `/files/:id`. Tested in the browser 2026-10-20.
- Resumable lesson-material uploads (tus, 5 MB pieces, progress / speed / time left, continues after
  a dropped connection or a reload, cancel). Protocol + ownership tested 2026-10-21.

Not built yet (rough priority):
1. Still mock: live classroom. Live courses at a set time (BBB) — later. Real payment provider (then
   orders confirm themselves); images in rich text; course search / filters in Explore.
   Video: transcoding / CDN (Kinescope, Bunny Stream or self-hosted HLS) behind `/files` later —
   NOT YouTube/RuTube (their terms require their branded player; see Decision log).
2. Teacher follow-ups: invite link for students without an account, lesson completion / progress,
   pricing / audience / subject fields (prototype), AI feedback draft.
   Admin screens: people, course deals, platform settings (only "Tenants" exists).
3. Manager follow-ups: course catalog + approvals (paid courses), remove
   someone from the school, resend an invite.
4. Timetable: edit/cancel a single lesson (today: delete the whole series), rooms/online links,
   month view. Lesson completion / progress; removing a single student who
   came in through a class (today: remove them from the class).
5. Push notifications for the mobile app (add a channel in `entities/notification/server/channels.ts`),
   live chat (websockets instead of polling), unread badge on the Messages nav item, parent-side
   "remove child", multi-role accounts (parent + teacher).
6. BigBlueButton: real live classes (join URLs), recordings → AI summaries.
7. Account: change email (needs a confirmation flow); remember the language per user in IOMAD
   (today it's per browser, a cookie).
8. Abuse protection for public sign-up/forgot (rate limit, captcha). Translate the mock data.
9. Move IOMAD to Moodle 5.3 LTS when IOMAD publishes `IOMAD_503_STABLE` (5.1+ moves the web root
   to `public/` — update the Dockerfile/config accordingly). 4.5 LTS has security fixes to 2027-10-04.

## Decision log (newest first)
- 2026-10-22 Mobile app = it will call a Budu API (`/api/v1`, token login — to build), NOT IOMAD
  directly (owner). Storage audit for it — IOMAD now holds what has a natural home there:
  per-user settings (Moodle user preferences budu_locale / budu_currency / budu_parent_skipped via
  `shared/server/user-prefs.ts`), school name & city (the IOMAD company — `schoolsInfo`), "finished a
  course" (Moodle course completion — `local_budu_complete_course`), a course's teaching language
  (course custom field `budu_language`). App-db keeps what IOMAD has no good home for or what we chose
  on purpose: sessions/tokens, chat + ticks, notifications, announcements, prices/orders/fx, ratings,
  school pages, invites, contact messages, quiz bookkeeping. No longer read (kept, schema is additive):
  table `user_prefs`, `tenants.city`, `tenants.name` (sign-up snapshot), `course_listings.language`,
  `course_finishes.finished_at` (the table now only means "Not now"). Keep server logic in plain
  `entities/*/server` modules so the API can reuse it.
- 2026-10-22 School public pages (owner): `/schools/<slug>` (not `/school/<slug>` — that's the
  manager area). Managers edit at `/school/page` (nav "School page"): address (live check; a–z 0–9 -,
  3–40, reserved words), Published, tagline, cover, and blocks — text, photos (≤6), news (dated),
  spotlight (one person), top students (round 1 / 2 / 3 medals, `Medal`). Stored in app-db (`tenants.slug`, `school_pages`,
  `school_page_blocks` JSON, cleaned per kind by `entities/school-page` `cleanBlock`; rendered as
  TEXT, never HTML). Photos live in IOMAD (category context, `local_budu/schoolpage`, served via
  `/files`; `file_access` makes that area public; plugin `lib.php` pluginfile + `save_school_photo`).
  Drafts: only the school's managers see them (with a banner). ONE switch (owner): published page =
  listed on `/schools` (card opens the page); unpublished = private, not listed, page 404. City lives
  on the IOMAD company, edited in the page settings.
  Top students: a name matching exactly one school member (on save, server-side) gets their profile
  photo — COPIED into `local_budu/schoolpage` by `local_budu_member_photo` (profile pictures are for
  signed-in users only, the page is public); a new copy only when their picture changes. Others get
  initials.
  Logo = IOMAD's own company logo (system context `core_admin/logo<companyid>` + config, what IOMAD's
  admin uses; `local_budu_set_school_logo`, PNG/JPG/GIF/WebP — no SVG), public via `/files`; shown in
  the page hero and on `/schools` cards. Privacy: editors remind managers to publish students only with families' consent.
- 2026-10-22 Password rule (owner): 8+ characters with an upper-case letter, a lower-case letter and
  a digit; symbols allowed, not required. Same in the app (`shared/lib/password` passwordOk) and in
  IOMAD (forced in `iomad/config.php`: minpasswordnonalphanum = 0 — Moodle's setting name). Sign-up
  is ONE step (owner rejected two steps); student is preselected and listed first.
  No "repeat password" field anywhere (sign-up, reset, invite, Settings) — owner: if you forget it,
  reset it; the show/hide toggle covers typos.
  Names: ONE "full name" field (owner: Russians have an отчество) → `shared/lib/person-name`
  `splitFullName` → IOMAD firstname / middlename (отчество, found by its ending) / lastname; both
  "Имя Отчество Фамилия" and "Фамилия Имя Отчество" work; non-patronymic names: first word = first name.
- 2026-10-22 Email: Mailpit removed (owner); all mail goes through `no-reply@budu-school.ru`
  (Timeweb SMTP, credentials only in `.env`). The domain had no public DNS yet on 2026-10-22 —
  until SPF/DKIM/DMARC are set at Timeweb, mail may land in spam.
- 2026-10-22 Public site (owner): /about (+ #values), /pricing, /schools, /help, /contact, /privacy
  in the `(public)` group with a shared footer; header nav Courses · Pricing · Schools · About. ALL
  public facts live in `shared/config/site.ts` (emails, Telegram/WhatsApp, legal details, free
  school limits) — null = not shown; nothing invented. Plans: students free; teachers free (AI
  features paid later); schools free up to `SITE.freeSchool` (placeholder 5 teachers / 50 students —
  owner to confirm), then a quote via Contact. Schools are listed only when a manager turns it on
  (Settings → "Show your school", `tenants.public_listing`, off by default). Contact form: stored in
  `contact_messages`, emailed to CONTACT_EMAIL if set; honeypot + 5/hour per IP hash. Privacy
  policy describes what Budu really stores — have a lawyer review it (152-FZ) and add legal details.
- 2026-10-22 Real-time chat (owner asked for it, "websocket"): Server-Sent Events, not WebSockets —
  Next has no WebSocket server without a custom one, and the chat only needs server → browser pushes
  (sending stays a server action). Postgres LISTEN/NOTIFY is the bus (`shared/server/realtime.ts`:
  `publish` / `subscribe`, one listening connection per server process, works with several servers);
  THIRD route-handler exception `GET /events` (`src/app/routes/events.ts`) streams the signed-in
  user's events (today `chat` = { conversationId }, ids only, participants only); the browser keeps
  ONE EventSource per tab (`shared/lib/live-events.ts`, `useLiveEvent`), reconnects and catches up;
  a 30 s fallback poll covers strict proxies. Behind nginx: `X-Accel-Buffering: no` is set.
  Message ticks: ✓ sent, ✓✓ delivered (the recipient's app got the live event, or they opened
  Messages), ✓✓ green seen (the conversation open and in view; a background tab only "delivers").
  Stored as `parent/teacher_delivered_at` + `_read_at` on `conversations`; changes push a
  `receipt` event. Messages live in app-db (`conversations`, `messages`), not in IOMAD.
- 2026-10-21 Course language + ratings (owner). The teacher picks the language a course is taught in
  (`course_listings.language`, list in `shared/config/course-language.ts`), shown on cards and the
  course page. Students rate 1–5 stars (+ optional comment) once they FINISH a course = open its last
  lesson (no progress tracking yet) — asked on that lesson and on the course page until they rate or
  say "Not now" (`course_finishes`, `course_reviews`, entity `review`, feature `rate-course`).
  Shown: average stars, reviews count, students enrolled (IOMAD `catalog.students`), latest comments.
  No reviews yet → 5.0 marked "New" (owner: "initially 5").
- 2026-10-21 Draft changes (owner): editing a PUBLISHED course never changes what students see until
  "Publish changes". New lessons / items are created hidden; edits of live lesson titles, text pages
  and homework are kept in the plugin table `local_budu_draft` (a new task attachment in file area
  `local_budu/taskdraft`); deletions are only marked. Teachers see badges (New / Edited / Will be
  removed), "Undo" per lesson / item, and Publish / Discard changes on the status card. Publishing
  notifies students of newly visible homework (no longer on save). Lesson order changes apply at
  once. "Unpublish" hides the whole course (students lose access) and applies pending changes.
  A draft (unpublished) course is edited directly, as before.
- 2026-10-21 Free preview (owner): a marketplace course's FIRST lesson (usually the intro) opens for
  anyone at `/catalog/:id/preview` — its videos, files and text pages, never homework. Every other
  lesson shows a lock; visitors must create an account even for free courses. IOMAD decides what
  is preview (`local_budu_preview_lesson`; `file_access` lets user 0 / non-members open lesson 1's
  `mod_resource` files of a PUBLISHED course and flags them `preview`), and the `/files` route
  additionally requires the course to be listed in the marketplace (school-only courses stay private).
- 2026-10-21 Lesson materials upload resumably (owner: "it just need to be resumable", storage stays
  in IOMAD). tus protocol: tus-js-client in the browser, @tus/server + @tus/file-store behind the
  SECOND route-handler exception `/uploads` (`app/uploads/[[...tus]]/route.ts` →
  `features/upload-material/server/tus.ts`). Creating checks session + course edit rights + lesson;
  the uploader's id is stored in the upload's metadata and every later request must come from them
  (else 404). Pieces sit in the `upload-chunks` volume (`UPLOAD_DIR`); when complete the file goes to
  IOMAD via `addMaterial` and is deleted; unfinished ones expire after a day (`cleanUpUploads`, run
  from AppShell `after()`). With several frontend servers, `/uploads` needs a shared volume or sticky
  routing. Homework/cover/avatar uploads stay plain server actions (small files).
- 2026-10-21 The course catalog is public (owner: visitors browse, then sign up to enrol). `/files` is
  reachable without a session but then asks IOMAD as user 0, which allows ONLY covers of published
  courses (everything else 404). `/catalog` and `/files` are in PUBLIC_PATHS; nothing else is.
- 2026-10-21 School exams (entrance / placement) = exam-kind quizzes in one hidden "exam space" course
  per school (idnumber `budu-exams-<companyid>`, skipped by every course list); each exam's audience
  is its own group (idnumber `budu-exam-<cmid>`) — empty = nobody sees it. Only school managers manage
  them (teachers of the school cannot).
- 2026-10-21 Access rule (owner asked about guessing ids in URLs): ids are IOMAD/Postgres numbers
  (unique across all schools, 64-bit — no per-school numbering needed), and they are NOT secrets.
  Every read/write checks the acting user against that object (enrolled + visible, own attempt,
  teaches the course, manages the school, parent of the child, conversation participant); anything
  else is a 404. Keep it that way for every new function: never trust an id from the URL alone.
- 2026-10-21 Quizzes/exams use Moodle's quiz engine (owner) — grades land in IOMAD's gradebook. They
  belong to a course (optionally limited to classes). Budu stores nothing quiz-specific except the
  notification bookkeeping (`quiz_reminders`, `quiz_announcements`). Kind = cm idnumber ('exam').
  Scheduled publishing = cm visible + availability date (hidden until then) + timeopen. Background
  chores (scheduled announcements, reminders) run via `after()` from the app shell, throttled — fine
  while there's traffic; move to a real scheduler (cron / worker) later.
- 2026-10-21 Marketplace & money (owner): prices in the teacher's currency, shown converted to each
  user's currency (Settings; platform default RUB). Rates: free daily service (open.er-api.com, USD
  base) + admin overrides (e.g. a market rate for SYP). No payment provider yet: manual transfer to
  the platform's phone (Sberbank/SBP) + receipt to billing@budu.ru; orders tracked, admin confirms →
  auto-enrol. Free courses: students enrol themselves, no school approval. Listing/price/orders live
  in app-db; enrolment stays in IOMAD (`local_budu_enrol_learner`).
- 2026-10-21 Lesson text = Moodle mod_page edited with Tiptap (`@tiptap/react` 3.31.4, owner chose a
  rich editor over Markdown). The browser's HTML is never trusted: IOMAD `clean_text()` on save/read.
- 2026-10-21 New role `parent`. The parent ↔ child link lives in IOMAD as the role `budu_parent` in
  the child's user context (Moodle's parent-role pattern; `local_budu` `family.php`); requests and
  their status in app-db `parent_requests`. A student asks, the parent must accept (owner rule).
  Parents join only through a child's request (no "parent" option on the register page).
- 2026-10-21 Parent ↔ teacher chat in app-db (`conversations` per parent + teacher + child,
  `messages`), polled; both sides may start one (parent → a teacher of the child's course; teacher →
  a parent of a student they teach). Owner chose app-db over Moodle messaging so it can move into a
  separate backend later: the logic sits in plain `entities/*/server` modules, not in actions.
- 2026-10-21 Notifications go through delivery channels (`CHANNELS`: email today; mobile push will be
  one more channel). Announcements in app-db (`announcements`) with an audience (owner):
  `school` (everyone + students' parents), `class` (`class_ids` = one or more cohorts, one row so
  nobody gets it twice) or `course` (target_id =
  course; company_id = the course's company). Readers get a scope (their schools, classes, courses).
- 2026-10-21 Timetable data = Moodle calendar events (no app-db table): a lesson = course event, or
  a group event for one class (group created on demand from the class cohort), component local_budu,
  `repeatid` = the series; a school event = category event of the company's category. All via
  `local_budu` schedule functions (`my_week`, `add_lessons`, `add_school_event`…). Times are rendered
  in the viewer's browser time zone.
- 2026-10-21 Joining a school always needs the person's approval: managers send invites
  (`school_invites`, status pending/accepted/declined); existing accounts accept in the app.
- 2026-10-21 A student is in at most ONE class per school (a class = a year group). Adding a student
  who is in another class moves them (enforced in `local_budu_set_students`); solo students have none.
- 2026-10-21 Classes = IOMAD-side Moodle cohorts + cohort enrolment (not app-db), so enrolment stays in
  IOMAD; class teachers live in the plugin table `local_budu_class_teacher` (db/install.xml +
  db/upgrade.php) so the plugin can authorise them. Teachers usually teach courses, not classes; a
  class teacher (optional, several allowed) only follows the class. Students and teachers may be solo
  (no school) — every class feature is optional and school-only.
- 2026-10-21 Notifications live in app-db (`notifications`: kind + params, text rendered in the
  reader's language) and are emailed via `entities/notification/server` `notify()`; emails are
  best-effort (logged on failure). A user's language is kept in `user_prefs` (saved on sign-in and on
  switching language) so emails/notifications use it.
- 2026-10-21 Role rule: IOMAD flags every company manager as an educator, so `roleFor` checks
  "manager of a company registered as a school (tenants.kind='school')" BEFORE "educator → teacher".
  Companies not in `tenants` (made outside our sign-up) fall back to educator → teacher.
- 2026-10-21 School managers invite people (new → suspended IOMAD account + `invite` token email;
  existing → added at once) and change roles via `local_budu_set_role` (IOMAD's assign_users never
  updates the educator flag of an existing member). Managers may also teach/grade their school's courses.
- 2026-10-21 Grade scale = per-tenant setting in app-db (`tenants.grade_scale`); 10 scales from the
  product spec; teachers still enter 0–100; colours by the 0–100 value.
- 2026-10-21 Homework = IOMAD assignments; students are manual enrolments (student role) added by
  the teacher by email; answers handed in and graded through `local_budu` learning functions (the
  integration user acts with editothersubmission / grade after checking the real user). No drafts:
  handing in = submitted; a graded answer is locked. Grades 0–100 (tenant scale display: later).
- 2026-10-21 Lesson videos stay on our own server (IOMAD files via `/files`). Owner asked about
  hiding videos on YouTube/RuTube: rejected — their terms require their branded player, private
  videos can't be embedded, it's visible in devtools, and YouTube is throttled in Russia. A
  white-label video service can sit behind `/files` later without students seeing it.
- 2026-10-21 Languages EN/RU/AR (owner: "fully supported"). Own tiny i18n (no library): typed
  dictionaries + `getT()`/`useT()`; locale in a cookie, Accept-Language fallback.
- 2026-10-21 Profile photo = the IOMAD (Moodle) user picture via `core_user_update_picture`; served
  through `/files/:id` (profile pictures are visible to any signed-in user). Session row caches
  `picture_id`.
- 2026-10-20 UI moves to real shadcn/ui components (owner: "professional look", not the prototype's
  custom styling) with the owner's generated theme and Hugeicons. App shell = shadcn Sidebar (sheet on
  mobile; the bottom tab bar is gone). Layout/structure of screens still follows the prototype.
- 2026-10-20 Code lives at github.com/moayadterro/budu. Commits are authored by the owner, EC/Angular
  convention (`type(scope): subject`, imperative, lowercase, ≤100 chars/line), small and focused.
- 2026-10-20 Course builder: course = IOMAD company course (draft = hidden), lesson = course section,
  video/PDF/file = mod_resource, task = mod_assign (graded 0–100). Done by `local_budu` functions
  (`classes/external/courses.php`) that take the acting `userid` and check THAT user's rights in Moodle
  (manageactivities to edit, enrolment to view); the integration user performs the change.
- 2026-10-20 ONE exception to "no API routes": `GET /files/:fileId` (`src/app/routes/lesson-file.ts`)
  streams lesson files from IOMAD (`webservice/pluginfile.php`, Range → video seeking) after
  `local_budu_file_access`. Uploads go through server actions (limit 250 MB, `shared/config/upload.ts`
  + next.config.js + iomad/php.ini). Only video/audio/image/PDF are served inline; everything else
  downloads, with a sandbox CSP (uploaded HTML must never run on our origin).
- 2026-10-19 Stack upgraded to current versions: Next 16 (proxy, async request APIs), React 19
  (`useActionState`), TypeScript 6, Tailwind 4 (theme now only in tokens.css), Node 24 LTS,
  Postgres 18 (dump/restore into new volume `app-db-data-18`), MariaDB 11.8 LTS (in place,
  `MARIADB_AUTO_UPGRADE`), PHP 8.3.33. IOMAD stays 4.5 LTS until IOMAD ships a 5.3 LTS branch.
- 2026-10-19 No API routes; server code lives in `server/` folders. Only `server/actions.ts` is
  callable from the browser; helpers carry `import 'server-only'`.
- 2026-10-19 `admin` role = IOMAD site admin; roles are a typed list designed to grow; authorization
  is server-side (`requireRole`); sessions refresh role from IOMAD every 5 minutes.
- 2026-10-19 Auth: sessions + one-time tokens in Postgres (`pg`); email via nodemailer, Mailpit in dev;
  email confirmation required (account suspended in IOMAD until confirmed). Password check via our
  plugin's `authenticate_user_login` wrapper — not `login/token.php` (it refuses site admins and
  needed a token permission for every user; both removed).
- 2026-10-19 Roles come from IOMAD membership (educator → teacher, manager → manager, else student),
  read by `local_budu_get_account`; no role copy kept in app-db besides the session snapshot.
- 2026-10-18 Registration offers school / teacher / student; students join schools later by invite.
- 2026-10-18 Server actions instead of API routes; Feature-Sliced Design; shadcn-style UI on Tailwind;
  `motion` (`motion/react`) for animation; Zustand for client state.
- 2026-10-18 IOMAD (multi-tenant Moodle) replaces plain Moodle, so the platform serves more than
  schools; a tenant = an IOMAD company (not a Moodle category).
- 2026-10-18 App renamed Lumio → **Budu (Буду)**. DB users/names and passwords are random, never the
  app name.
- 2026-10-18 Bitnami images dropped (moved to unmaintained `bitnamilegacy`); IOMAD built from source,
  official `mariadb` image.

## Open questions (ask the owner)
- Public site facts still empty in `shared/config/site.ts`: support/hello emails, Telegram, WhatsApp,
  company legal details (INN, OGRN, address); and the real free-school limits (placeholder 5 / 50).
- Old Postgres 16 volume `budu_app-db-data` is kept for rollback; delete it once 18 is confirmed fine
  (`docker volume rm budu_app-db-data`). Backups from the upgrade were only in the session scratchpad.
- Owner (2026-10-20): all current data is test data — a full wipe is acceptable when useful.
  Still confirm before actually running `down -v` / deleting volumes. Test data includes companies
  "Test School Alpha/Gamma/Beta", "Test Teacher", "Test Teacher (…)", users `*@example.test`.
- Accounts created before 2026-10-19 were never suspended, so they can sign in without confirming.

## Working with the owner (Moayad)
- Prefers security by default: random, non-guessable DB users/names, no defaults in compose,
  secrets only in `.env` (never echo them).
- Wants things built from the design prototype, not redesigned; one screen fully, then the next.
- Ask before: architecture changes, new dependencies, deleting data/volumes. Explicit requests
  ("use zustand", "use motion") count as approval for that dependency.

## Gotchas we hit
- Moodle 4.5: `question_get_default_category($contextid)` has no "create" flag — use
  `question_make_default_categories([$ctx])` when it returns false. A quiz's pass mark lives on its
  grade item, not the quiz row. `quiz_update_events($quiz)` — the 2nd arg is an override, not the cm.
- Response summaries (`get_response_summary`) are in Moodle's language ("True"): true/false answers are
  sent as values and translated in the UI; gapselect ones look like "{mass} {acceleration}" (braces
  stripped).
- shadcn `CardContent` is `flex-col`: a row inside it needs `flex-row` explicitly.
- `<p>` can't contain shadcn NativeSelect (it renders a `<div>` wrapper) → hydration error.
- Moodle `page_add_instance()` copies `$data->page['text']` into `content` only when given a form —
  from the API set `content`/`contentformat` yourself or pages are saved empty.
- Exchange rates: the feed gave ≈ 122 SYP per USD on 2026-10-21 (looks like the redenominated pound,
  not the old ≈ 13 000) — check admin overrides for currencies whose official and market rates differ.
- PHP: an apostrophe inside a single-quoted string (`'A user's …'`) breaks the whole plugin, so EVERY
  IOMAD call fails with "syntax error". Use ’ or double quotes; `php -l` new plugin files.
- Next dev (Turbopack) can get stuck on "The default export is not a React Component in …/page"
  after many edits even though the code is fine: `docker compose restart frontend`.
- Chrome's `scrollIntoView()` returns a promise: `useEffect(() => el.scrollIntoView())` then "returns"
  it and React crashes ("destroy is not a function"). Use a block body in effects.
- IOMAD/Moodle redirects any request whose host ≠ `wwwroot`. Server-to-server calls use
  `http://iomad`, allowed by an exact-match rule in `iomad/config.php`.
- Send the WS token in a POST body (never the query string — it lands in access logs).
- `core_user_get_users_by_field` returns `[]` for emails unless the caller has
  `moodle/site:viewuseridentity`.
- Moodle usernames allow only `a-z 0-9 _ - @ .` — `usernameFor()` maps emails to that.
- With a root `pages/` folder, `usePathname()` may be typed `string | null` — handle null.
- Tailwind 4: `bg-gradient-to-*` is `bg-linear-to-*`; borders default to currentColor and buttons
  lose `cursor: pointer` (both restored in globals.css `@layer base`).
- TypeScript 6 deprecates `baseUrl` — `paths` work without it (removed from tsconfig).
- Postgres 18 images store data under `/var/lib/postgresql/18/…`: mount `/var/lib/postgresql`.
  Major Postgres upgrades need dump/restore (or pg_upgrade); minor ones don't.
- `ALTER`s in `SCHEMA` only re-run when the SCHEMA text changes (handled) — never edit a statement
  in a way that isn't idempotent.
- React: a button that switches `type="button"` → `"submit"` on click submits on THAT click (re-render
  happens before the browser's default action). Call `form.requestSubmit()` instead.
- Moodle `get_section_name()`/`format_string()` return HTML-escaped text; return raw DB values to the
  frontend (React escapes) or you get `&amp;` on screen.
- Moodle REST `webservice/upload.php` / `pluginfile.php` need the service's `uploadfiles` /
  `downloadfiles` flags (set by ws-setup.php); the token goes in the POST body, not the URL.
- IOMAD: every company manager is also flagged `educator=1` (iomad_autoenrol_managers), and
  `block_iomad_company_admin_assign_users` only sets `educator` when first adding a member — use
  `local_budu_set_role` to change roles.
- React 19 resets a `<form action>` after the action runs; a controlled radio/select inside it can
  show the reset value. Call the server action directly (useTransition) for such pickers.
- Browser automation: `form.role` is the form's ARIA role, not a field named "role" — use
  `form.elements.namedItem('role')`. Radix dropdowns open on pointerdown/keyboard, not synthetic click.
- Claude-in-Chrome screenshots of this app sometimes come out tiled/washed out and ref clicks can
  miss; drive forms with `form_input` + `requestSubmit()` and read results as page text.

## Self-hosting / Russia reachability
Both IOMAD and BBB are self-hosted on purpose: some foreign IPs are blocked for Russian users, and live media is unforgiving of bad routing. Place servers where RU students can reach them. BBB additionally needs TURN/coturn and an open UDP media range.

## AI layer (future, not built)
BBB records a class → "recording ready" webhook → speech-to-text (Whisper) → LLM summary/quiz → written back into IOMAD via API. Enable recording + webhooks + web-services early so the data exists.

## Design reference
The design prototype is the visual spec: artifact "Lumio" (the old name),
https://claude.ai/artifact/BzMTBJSEPLvtBDJbtqtjwv — read it with the Artifact tool (`action: read`).
It contains every screen (student / teacher / manager: timetable, gradebook, courses, course builder,
lessons, homework, live classroom, settings, grade-scale page), EN/RU/AR strings, and the mock data
used here. Implement its screens one at a time, rebranded as Budu. The claude.ai project
"Online school management system" also has `claude/lumio-state.md` (product spec) — not reachable
from Claude Code; ask the owner if needed.
