# Portfolio Monorepo — Frontend + Backend

Clean, production-ready portfolio with:
- A static frontend (`frontend/public`)
- A TypeScript Express API (`backend`) backed by PostgreSQL (Supabase-ready)

This README focuses on running locally and deploying to GitHub Pages + Hugging Face Spaces.

---

## Project Structure

- `frontend/public/` Static site (HTML/CSS/JS)
- `backend/` API server (TypeScript + Express)
- `backend/sql/` Database schema + seed

---

## Quick Start (Local)

### 1) Backend
```bash
cd backend
npm install
cp .env.example .env
```

Edit `.env` with your settings (DB, admin, email, storage, captcha).

Run DB schema:
```bash
# Run in your Supabase SQL editor or psql
backend/sql/schema.sql

# Optional seed data
backend/sql/seed.sql
```

Start the API:
```bash
npm run dev
```

### 2) Frontend
Serve the static site:
```bash
cd frontend
npx serve public
```

Or use VS Code Live Server with root = `frontend/public`.

---

## Backend Scripts

- `npm run dev` Start API in watch mode
- `npm run start` Start API once
- `npm run typecheck` TypeScript check
- `npm test` Run tests

---

## Environment Variables (Backend)

See `backend/.env.example`. Key settings:

- `DATABASE_URL` PostgreSQL connection string
- `ADMIN_USERNAME` / `ADMIN_PASSWORD` Admin login
- `JWT_SECRET` JWT signing key
- `RESEND_API_KEY` (optional) Email via Resend
- `SMTP_*` (optional) SMTP fallback
- `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` Storage uploads
- `TURNSTILE_SECRET_KEY` (optional) Captcha

---

## Frontend Runtime Config

Edit `frontend/public/js/runtime-config.js` before deploying:

- `window.PORTFOLIO_API_BASE` Your API base URL
- `window.PORTFOLIO_TURNSTILE_SITE_KEY` (optional)

---

## Admin Dashboard

URL: `admin.html`

Login uses:
- `ADMIN_USERNAME`
- `ADMIN_PASSWORD`

Features:
- Manage projects + blogs
- Upload images (Supabase Storage)
- View contact messages
- View audit logs

---

## Content Rules

Projects and blogs support:
- `is_published`
- `publish_at`
- `featured`
- `sort_order`
- `updated_by`

Public endpoints only return published + schedule-eligible content.

---

## Contact Form

`POST /api/contact`:
- Saves to `contact_messages`
- Sends email via Resend if configured
- Falls back to SMTP if Resend is not set
- Optional Turnstile captcha

---

## Deployment (GitHub Pages + Hugging Face)

This repo includes workflows for:
- Frontend deploy to GitHub Pages
- Backend deploy to Hugging Face Space (Docker)
- Keepalive pings for API + DB

### Required GitHub Secrets
Set in:
`Settings → Secrets and variables → Actions`

- `HF_TOKEN` Hugging Face access token
- `HF_SPACE_ID` Space ID (`username/space-name`)
- `HF_API_HEALTH_URL` API health URL
- `SUPABASE_DB_URL` Supabase DB connection string

### Hugging Face (Backend)
- Create a Space with SDK = `Docker`
- First deploy via `.github/workflows/deploy-hf-backend.yml`
- Docker files:
  - `backend/Dockerfile`
  - `backend/.dockerignore`
  - `backend/hf-space-README.md` (used as Space README)

### GitHub Pages (Frontend)
- Set Pages source to `GitHub Actions`
- Workflow: `.github/workflows/deploy-frontend-gh-pages.yml`

### Deploy Triggers
- Push to `main`
  - Changes in `frontend/public/**` deploy frontend
  - Changes in `backend/**` deploy backend
- Or run workflows manually in Actions

---

## Security & Quality

- Helmet headers
- CORS allow-list
- Rate limiting
- Zod validation
- JWT admin auth
- TypeScript strict mode
- CI in `.github/workflows/ci.yml`

---