import 'server-only'
import { Pool, QueryResultRow } from 'pg'

/**
 * The frontend's own Postgres (app-db): sessions, one-time tokens, tenant records.
 * NOT a second source of truth for identity — users and roles live in IOMAD.
 * SERVER-SIDE ONLY.
 */

const SCHEMA = `
CREATE TABLE IF NOT EXISTS sessions (
  token_hash    text PRIMARY KEY,              -- sha256 of the cookie value
  iomad_user_id integer NOT NULL,
  role          text NOT NULL,                 -- snapshot taken from IOMAD at sign-in
  company_id    integer,
  name          text NOT NULL,
  email         text NOT NULL,
  expires_at    timestamptz NOT NULL,
  created_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS sessions_user ON sessions (iomad_user_id);
-- last time role/name were re-read from IOMAD ('epoch' = check on next request)
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS refreshed_at timestamptz NOT NULL DEFAULT 'epoch';
-- IOMAD profile picture file id (served by /files/:id); NULL = initials
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS picture_id integer;

CREATE TABLE IF NOT EXISTS auth_tokens (
  token_hash    text PRIMARY KEY,              -- sha256; the raw token only travels in the email
  purpose       text NOT NULL,                 -- verify_email | reset_password | invite
  iomad_user_id integer NOT NULL,
  expires_at    timestamptz NOT NULL,
  used_at       timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS auth_tokens_user ON auth_tokens (iomad_user_id, purpose);

CREATE TABLE IF NOT EXISTS tenants (
  id         serial PRIMARY KEY,
  iomad_url  text NOT NULL,                    -- which IOMAD instance (shard-ready)
  company_id integer NOT NULL,                 -- the IOMAD company
  kind       text NOT NULL,                    -- school | teacher
  name       text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (iomad_url, company_id)
);
-- the school's grade display scale (grades are always stored 0–100; see shared/lib/grade-scale)
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS grade_scale text NOT NULL DEFAULT 'percent';

-- in-app notifications (bell); text is rendered from kind + params in the reader's language
CREATE TABLE IF NOT EXISTS notifications (
  id            bigserial PRIMARY KEY,
  iomad_user_id integer NOT NULL,
  kind          text NOT NULL,
  params        jsonb NOT NULL DEFAULT '{}',
  link          text,
  created_at    timestamptz NOT NULL DEFAULT now(),
  read_at       timestamptz
);
CREATE INDEX IF NOT EXISTS notifications_user ON notifications (iomad_user_id, created_at DESC);

-- invitations into a school for people who already have an account: they join only when they accept
CREATE TABLE IF NOT EXISTS school_invites (
  id            bigserial PRIMARY KEY,
  iomad_url     text NOT NULL,
  company_id    integer NOT NULL,
  iomad_user_id integer NOT NULL,
  role          text NOT NULL,                 -- manager | teacher | student
  invited_by    text NOT NULL,                 -- inviting manager's name (for the invitation text)
  status        text NOT NULL DEFAULT 'pending', -- pending | accepted | declined | cancelled
  created_at    timestamptz NOT NULL DEFAULT now(),
  responded_at  timestamptz
);
CREATE INDEX IF NOT EXISTS school_invites_user ON school_invites (iomad_user_id, status);
CREATE INDEX IF NOT EXISTS school_invites_company ON school_invites (company_id, status);
ALTER TABLE school_invites ADD COLUMN IF NOT EXISTS invited_by_id integer;   -- told when they answer

-- per-user preferences kept outside IOMAD (UI language: used for emails and notifications)
CREATE TABLE IF NOT EXISTS user_prefs (
  iomad_user_id integer PRIMARY KEY,
  locale        text,
  updated_at    timestamptz NOT NULL DEFAULT now()
);
-- a student who skipped the "add your parent" step after signing up (the home card still reminds them)
ALTER TABLE user_prefs ADD COLUMN IF NOT EXISTS parent_prompt_skipped_at timestamptz;

-- a student asks someone to be their parent; the link itself lives in IOMAD once the parent accepts
CREATE TABLE IF NOT EXISTS parent_requests (
  id           bigserial PRIMARY KEY,
  child_id     integer NOT NULL,
  parent_id    integer NOT NULL,
  status       text NOT NULL DEFAULT 'pending',  -- pending | accepted | declined | cancelled
  created_at   timestamptz NOT NULL DEFAULT now(),
  responded_at timestamptz
);
CREATE INDEX IF NOT EXISTS parent_requests_parent ON parent_requests (parent_id, status);
CREATE INDEX IF NOT EXISTS parent_requests_child ON parent_requests (child_id, status);

-- parent ↔ teacher chat, one conversation per parent + teacher + child
CREATE TABLE IF NOT EXISTS conversations (
  id              bigserial PRIMARY KEY,
  parent_id       integer NOT NULL,
  teacher_id      integer NOT NULL,
  child_id        integer NOT NULL,
  created_at      timestamptz NOT NULL DEFAULT now(),
  last_message_at timestamptz NOT NULL DEFAULT now(),
  parent_read_at  timestamptz NOT NULL DEFAULT 'epoch',
  teacher_read_at timestamptz NOT NULL DEFAULT 'epoch',
  UNIQUE (parent_id, teacher_id, child_id)
);
CREATE INDEX IF NOT EXISTS conversations_parent ON conversations (parent_id, last_message_at DESC);
CREATE INDEX IF NOT EXISTS conversations_teacher ON conversations (teacher_id, last_message_at DESC);
-- delivery receipts: the newest moment each side's device received the other's messages (✓✓)
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS parent_delivered_at  timestamptz NOT NULL DEFAULT now();
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS teacher_delivered_at timestamptz NOT NULL DEFAULT now();
CREATE TABLE IF NOT EXISTS messages (
  id              bigserial PRIMARY KEY,
  conversation_id bigint NOT NULL REFERENCES conversations (id) ON DELETE CASCADE,
  sender_id       integer NOT NULL,
  body            text NOT NULL,
  created_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS messages_conversation ON messages (conversation_id, id);

-- school announcements (posted by managers; shown to students, teachers and parents of the school)
CREATE TABLE IF NOT EXISTS announcements (
  id          bigserial PRIMARY KEY,
  iomad_url   text NOT NULL,
  company_id  integer NOT NULL,
  author_id   integer NOT NULL,
  author_name text NOT NULL,
  title       text NOT NULL,
  body        text NOT NULL DEFAULT '',
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS announcements_company ON announcements (company_id, created_at DESC);
-- who it is for: the whole school, one class (cohort id) or one course (course id)
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS audience text NOT NULL DEFAULT 'school';  -- school | class | course
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS target_id integer;
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS target_name text NOT NULL DEFAULT '';
CREATE INDEX IF NOT EXISTS announcements_target ON announcements (audience, target_id, created_at DESC);
-- class announcements can go to several classes at once (one row, so nobody gets it twice)
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS class_ids integer[];
UPDATE announcements SET class_ids = ARRAY[target_id] WHERE audience = 'class' AND class_ids IS NULL AND target_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS announcements_classes ON announcements USING gin (class_ids);

-- the currency a user sees prices in (converted); NULL = the platform default (RUB)
ALTER TABLE user_prefs ADD COLUMN IF NOT EXISTS currency text;

-- a course in the marketplace (Explore): listed or not, and its price in the teacher's currency (0 = free)
CREATE TABLE IF NOT EXISTS course_listings (
  iomad_url  text NOT NULL,
  course_id  integer NOT NULL,
  listed     boolean NOT NULL DEFAULT false,
  price      numeric(14,2) NOT NULL DEFAULT 0,
  currency   text NOT NULL DEFAULT 'RUB',
  updated_by integer,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (iomad_url, course_id)
);

-- exchange rates: units per 1 USD (automatic, refreshed daily) and the platform admin's overrides
CREATE TABLE IF NOT EXISTS fx_rates (
  currency   text PRIMARY KEY,
  per_usd    numeric NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS fx_overrides (
  currency   text PRIMARY KEY,
  per_usd    numeric NOT NULL,
  updated_by integer,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- course purchases: paid by hand (bank transfer), confirmed by the platform admin
CREATE TABLE IF NOT EXISTS orders (
  id           bigserial PRIMARY KEY,
  iomad_url    text NOT NULL,
  student_id   integer NOT NULL,
  course_id    integer NOT NULL,
  course_title text NOT NULL,
  price        numeric(14,2) NOT NULL,     -- in the course's currency, when ordered
  currency     text NOT NULL,
  amount_rub   numeric(14,2) NOT NULL,     -- what to transfer
  status       text NOT NULL DEFAULT 'pending', -- pending | reported | confirmed | rejected
  created_at   timestamptz NOT NULL DEFAULT now(),
  reported_at  timestamptz,                -- the student pressed "I've paid"
  decided_at   timestamptz,
  decided_by   integer
);
CREATE INDEX IF NOT EXISTS orders_status ON orders (status, created_at);
CREATE INDEX IF NOT EXISTS orders_student ON orders (student_id, course_id);
-- at most one open order per student + course (a double click can't create two)
CREATE UNIQUE INDEX IF NOT EXISTS orders_one_open ON orders (iomad_url, student_id, course_id) WHERE status IN ('pending', 'reported');

-- "closes within a day" quiz reminders already sent (one per student and quiz)
CREATE TABLE IF NOT EXISTS quiz_reminders (
  iomad_url text NOT NULL,
  quiz_id   integer NOT NULL,
  user_id   integer NOT NULL,
  sent_at   timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (iomad_url, quiz_id, user_id)
);
-- scheduled quizzes already announced (students told when the publish time came)
CREATE TABLE IF NOT EXISTS quiz_announcements (
  iomad_url text NOT NULL,
  quiz_id   integer NOT NULL,
  open_at   integer NOT NULL,
  sent_at   timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (iomad_url, quiz_id, open_at)
);

-- the language a course is taught in (ISO 639-1, e.g. 'ru'); NULL = not said
ALTER TABLE course_listings ADD COLUMN IF NOT EXISTS language text;

-- students' ratings of courses they finished (1–5 stars, optional comment); one per student and course
CREATE TABLE IF NOT EXISTS course_reviews (
  iomad_url   text NOT NULL,
  course_id   integer NOT NULL,
  user_id     integer NOT NULL,
  author_name text NOT NULL DEFAULT '',
  stars       smallint NOT NULL CHECK (stars BETWEEN 1 AND 5),
  comment     text NOT NULL DEFAULT '',
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (iomad_url, course_id, user_id)
);

-- a student finished a course (opened its last lesson) → asked to rate it; "Not now" hides the ask
CREATE TABLE IF NOT EXISTS course_finishes (
  iomad_url    text NOT NULL,
  course_id    integer NOT NULL,
  user_id      integer NOT NULL,
  finished_at  timestamptz NOT NULL DEFAULT now(),
  dismissed_at timestamptz,
  PRIMARY KEY (iomad_url, course_id, user_id)
);
`

// One pool per server process (survives dev hot reloads). The schema check re-runs whenever SCHEMA
// changes, so additive changes (CREATE … IF NOT EXISTS / ADD COLUMN IF NOT EXISTS) apply without a
// restart. Keep every statement idempotent; for anything destructive, add real migrations.
const g = globalThis as unknown as { __buduPool?: Pool; __buduSchema?: { sql: string; done: Promise<void> } }
const pool = (g.__buduPool ??= new Pool({ connectionString: process.env.DATABASE_URL, max: 10 }))

function ready() {
  if (g.__buduSchema?.sql !== SCHEMA) {
    const done = pool.query(SCHEMA).then(
      () => undefined,
      (e) => {
        g.__buduSchema = undefined // retry on the next call
        throw e
      },
    )
    g.__buduSchema = { sql: SCHEMA, done }
  }
  return g.__buduSchema!.done
}

export async function query<T extends QueryResultRow>(text: string, params: unknown[] = []): Promise<T[]> {
  await ready()
  const res = await pool.query<T>(text, params)
  return res.rows
}
