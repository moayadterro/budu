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

-- per-user preferences kept outside IOMAD (UI language: used for emails and notifications)
CREATE TABLE IF NOT EXISTS user_prefs (
  iomad_user_id integer PRIMARY KEY,
  locale        text,
  updated_at    timestamptz NOT NULL DEFAULT now()
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
