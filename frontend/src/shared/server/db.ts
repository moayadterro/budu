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
