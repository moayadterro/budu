# Budu (Буду)

Multi-tenant online learning platform — schools first, plus companies, training centres and independent teachers. This repo is the **project base** — a
themed Next.js + Tailwind frontend and a Docker Compose stack for local
development. It is deliberately minimal; features are built on top of it.

## Stack

| Layer            | Choice                        | Runs as |
|------------------|-------------------------------|---------|
| Frontend / UI    | Next.js (React) + Tailwind    | container (`frontend`) |
| App database     | PostgreSQL                    | container (`app-db`) |
| LMS engine       | IOMAD — multi-tenant Moodle (+ MariaDB) | containers (`iomad`, `iomad-db`) |
| Live classes     | BigBlueButton                 | **separate server** (see below) |

Tenants, identity, courses, enrolment and the gradebook live in **IOMAD** (a
multi-tenant Moodle fork; each tenant is an IOMAD "company"); the frontend talks
to it through the Moodle/IOMAD Web Services API. The app's own Postgres is for
data IOMAD doesn't own (custom features later).

## Run it

```bash
cp .env.example .env   # then replace every change_me with random values
docker compose up --build
```

- Frontend → http://localhost:3000 (theme + component base)
- IOMAD    → http://localhost:8080 (first boot builds the image and installs; takes a few minutes)

### Connect the frontend to IOMAD (once per fresh install)

The frontend calls IOMAD's REST API with a token for a dedicated
`budu_integration` user (its own role, only the capabilities it needs — not a
site admin). Create the token and restart the frontend:

```bash
T=$(docker compose exec -T -u www-data iomad php /usr/local/share/budu/ws-setup.php | tr -d '\r\n')
sed -i '' "s/^IOMAD_WS_TOKEN=.*/IOMAD_WS_TOKEN=$T/" .env   # macOS sed; on Linux drop the ''
docker compose up -d frontend
```

Then open http://localhost:3000 — sign up at `/register` (school, teacher or student),
confirm the email, sign in. In dev every email lands in **Mailpit**: http://localhost:8025.
Password reset is at `/forgot-password`. Details: CLAUDE.md → "Auth".

## Theming — one place

All colours are CSS variables in **`frontend/src/theme/tokens.css`**.
Change `--color-primary` / `--color-secondary` (and the rest) there and the
whole UI updates. Tailwind maps its colour names to those variables
(`frontend/tailwind.config.ts`), and components only use token classes
(`bg-primary`, `text-fg`, `border-border`) — never raw hex. Dark mode is the
same tokens with dark values.

## BigBlueButton

BBB is **not** in the compose file. It only installs via the official
`bbb-install` script on a dedicated Ubuntu 22.04 host (public FQDN + TLS, wide
UDP media range, TURN/coturn). Provision it separately, then set `BBB_URL` and
`BBB_SECRET` in `.env`; the frontend and IOMAD call its API.
Docs: https://docs.bigbluebutton.org/administration/install/

For self-hosting notes (incl. Russia reachability) and the full product plan,
see `CLAUDE.md`.
