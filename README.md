# Portfolio Monorepo (Frontend + Backend)

## Structure
- `frontend/public`: Static frontend files (host separately on Netlify/Vercel/GitHub Pages)
- `backend`: TypeScript Express API + PostgreSQL integration

## Backend setup
1. `cd backend`
2. `npm install`
3. `cp .env.example .env`
4. Configure `.env` for DB, admin auth, SMTP, and optional storage upload.
5. Run schema on Supabase database:
   - `backend/sql/schema.sql`
   - Optional seed data: `backend/sql/seed.sql`
6. Start API: `npm run dev`

## Backend scripts
- `npm run dev`: run TS server in watch mode
- `npm run start`: run TS server once
- `npm run typecheck`: TypeScript type check
- `npm test`: run backend tests

## Frontend setup
Serve `frontend/public` with any static server.

Examples:
- VS Code Live Server (root = `frontend/public`)
- `cd frontend && npx serve public`

## Cloud hosting (GitHub Pages + Hugging Face Spaces)
This repo now includes ready workflows for:
- Frontend deploy to GitHub Pages
- Backend deploy to Hugging Face Docker Space
- Keepalive ping for Hugging Face API (2 times per week)
- Keepalive query for Supabase DB (2 times per week)

### 1) Required GitHub repository secrets
Add these in `Settings -> Secrets and variables -> Actions -> New repository secret`.

- `HF_TOKEN`: Hugging Face access token with write access to the target Space
- `HF_SPACE_ID`: Hugging Face Space ID in format `username/space-name`
- `HF_API_HEALTH_URL`: Your API health URL (example: `https://your-space-name.hf.space/api/health`)
- `SUPABASE_DB_URL`: Supabase PostgreSQL connection string (pooler URL is fine)

### 2) One-time Hugging Face setup
- Create a new Hugging Face Space with SDK type `Docker`
- First deployment is done by workflow `.github/workflows/deploy-hf-backend.yml`
- Backend Docker files are in:
  - `backend/Dockerfile`
  - `backend/.dockerignore`
  - `backend/hf-space-README.md` (copied as Space `README.md` during deploy)

### 3) One-time GitHub Pages setup
- In GitHub repository settings, set Pages source to `GitHub Actions`
- Frontend deploy workflow is `.github/workflows/deploy-frontend-gh-pages.yml`

### 4) Set frontend runtime API URL
Edit `frontend/public/js/runtime-config.js` before deploying:
- `window.PORTFOLIO_API_BASE`: set to your Hugging Face API base URL, for example:
  - `https://your-space-name.hf.space/api`
- `window.PORTFOLIO_TURNSTILE_SITE_KEY`: set your Cloudflare Turnstile site key (or keep empty)

### 5) Trigger deployments
- Push to `main` branch:
  - Changes in `frontend/public/**` deploy frontend
  - Changes in `backend/**` deploy backend
- Or run workflows manually via `Actions -> Run workflow`

## Admin dashboard
- URL: `/admin.html`
- Login with `ADMIN_USERNAME` + `ADMIN_PASSWORD`
- Uses JWT token from `POST /api/admin/login`
- Features:
  - Create, list, edit, delete projects
  - Create, list, edit, delete blogs
  - Upload images to Supabase Storage bucket (`/api/admin/upload`)
  - View contact messages
  - View admin audit logs (`/api/admin/audit-logs`)

## Content lifecycle
Projects and blogs support:
- `is_published`
- `publish_at`
- `featured`
- `sort_order`
- `updated_by`

Public endpoints (`/api/projects`, `/api/blogs`) only return published + schedule-eligible content.

## Contact form behavior
- Frontend posts to `POST /api/contact`
- Backend stores message in `contact_messages`
- Backend sends email via Resend API when `RESEND_API_KEY` is configured (recommended for cloud)
- If Resend is not configured, backend falls back to SMTP settings
- Optional Turnstile captcha check via `TURNSTILE_SECRET_KEY` and `TURNSTILE_REQUIRED=true`

## Security and quality features
- Helmet headers
- CORS allow-list
- Rate limiting (public/auth/contact/admin)
- Zod payload validation
- JWT admin auth
- TypeScript backend with strict type checking
- Unit tests for validation utilities (`npm test`)
- CI workflow in `.github/workflows/ci.yml`
