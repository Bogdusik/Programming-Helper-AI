# Security Cleanup & Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove all unauthenticated/debug API routes that expose sensitive data or allow unauthorised DB mutations, harden env validation, fix cross-platform scripts, and add `.env.example`.

**Architecture:** Delete nine debug/one-time API route directories and one migration page, then update middleware to remove references to deleted routes. Patch `lib/env.ts` to require Clerk keys on startup. Clean `package.json` of macOS-only scripts. Add `.env.example` for onboarding.

**Tech Stack:** Next.js 15 App Router, Clerk, Prisma, TypeScript

---

## File Map

| Action | Path |
|--------|------|
| DELETE | `app/api/check-database/` |
| DELETE | `app/api/migrate/` |
| DELETE | `app/api/apply-migration/` |
| DELETE | `app/api/seed-tasks/` |
| DELETE | `app/api/final-schema-sync/` |
| DELETE | `app/api/fix-admin-role/` |
| DELETE | `app/api/diagnose/` |
| DELETE | `app/api/check-admin-data/` |
| DELETE | `app/api/check-clerk-env/` |
| DELETE | `app/migrate/` (page + dir) |
| MODIFY | `middleware.ts` |
| MODIFY | `lib/env.ts` |
| MODIFY | `package.json` |
| CREATE | `.env.example` |

---

## Task 1: Delete unauthenticated destructive API routes

These five routes have **zero auth** and allow any internet user to read DB internals or run DDL mutations.

**Files:**
- Delete: `app/api/check-database/route.ts`
- Delete: `app/api/migrate/route.ts`
- Delete: `app/api/apply-migration/route.ts`
- Delete: `app/api/seed-tasks/route.ts`
- Delete: `app/api/final-schema-sync/route.ts`

- [ ] **Step 1: Verify baseline tests pass**

```bash
npm test -- --ci 2>&1 | tail -5
```
Expected: all suites pass before we touch anything.

- [ ] **Step 2: Delete the five route directories**

```bash
rm -rf app/api/check-database app/api/migrate app/api/apply-migration app/api/seed-tasks app/api/final-schema-sync
```

- [ ] **Step 3: Run tests to confirm no breakage**

```bash
npm test -- --ci 2>&1 | tail -5
```
Expected: same pass count as Step 1.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "security: remove unauthenticated destructive API routes

Deleted /api/check-database (exposed DB info), /api/migrate,
/api/apply-migration, /api/seed-tasks, /api/final-schema-sync.
All five accepted requests from unauthenticated callers and
performed DDL mutations or leaked database internals."
```

---

## Task 2: Delete debug/one-time admin routes

Four more routes either lack auth entirely or allow non-admin users to read aggregate DB stats.

**Files:**
- Delete: `app/api/fix-admin-role/route.ts`
- Delete: `app/api/diagnose/route.ts`
- Delete: `app/api/check-admin-data/route.ts`
- Delete: `app/api/check-clerk-env/route.ts`

- [ ] **Step 1: Delete the four route directories**

```bash
rm -rf app/api/fix-admin-role app/api/diagnose app/api/check-admin-data app/api/check-clerk-env
```

- [ ] **Step 2: Run tests**

```bash
npm test -- --ci 2>&1 | tail -5
```
Expected: all pass.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "security: remove debug and privilege-escalation API routes

Deleted /api/fix-admin-role (marked TODO: remove in source),
/api/diagnose (public, leaked env var status + table structure),
/api/check-admin-data (auth but no admin check — any user saw
aggregate stats), /api/check-clerk-env (debug key info)."
```

---

## Task 3: Delete migration UI page

`app/migrate/` is a public page (not in `isProtectedRoute`) that lets anyone click a button to ALTER TABLE on the production database.

**Files:**
- Delete: `app/migrate/page.tsx` (and directory)

- [ ] **Step 1: Delete the migrate page directory**

```bash
rm -rf app/migrate
```

- [ ] **Step 2: Run tests**

```bash
npm test -- --ci 2>&1 | tail -5
```
Expected: all pass.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "security: remove public migration UI page

app/migrate was accessible without auth and triggered
ALTER TABLE via /api/migrate which is also now deleted."
```

---

## Task 4: Update middleware.ts — remove deleted routes from isPublicApiRoute

`/api/check-clerk-env` and `/api/diagnose` are still listed as public API routes in middleware even though the route handlers no longer exist. Clean up the dead references.

**Files:**
- Modify: `middleware.ts`

- [ ] **Step 1: Remove the two dead route matchers**

Open `middleware.ts`. The current `isPublicApiRoute` block is:

```typescript
const isPublicApiRoute = createRouteMatcher([
  '/api/trpc/stats.getGlobalStats(.*)',
  '/api/health(.*)',
  '/api/check-clerk-env(.*)',
  '/api/clear-session(.*)',
  '/api/diagnose(.*)',
])
```

Replace it with:

```typescript
const isPublicApiRoute = createRouteMatcher([
  '/api/trpc/stats.getGlobalStats(.*)',
  '/api/health(.*)',
  '/api/clear-session(.*)',
])
```

- [ ] **Step 2: Run tests**

```bash
npm test -- --ci 2>&1 | tail -5
```
Expected: all pass.

- [ ] **Step 3: Commit**

```bash
git add middleware.ts
git commit -m "fix: remove deleted routes from middleware public allowlist

/api/check-clerk-env and /api/diagnose no longer exist;
remove them from isPublicApiRoute to keep the allowlist accurate."
```

---

## Task 5: Fix lib/env.ts — add Clerk keys to required list

Clerk keys are just as critical as `DATABASE_URL` — the app is completely broken without them. They should throw on startup in production if missing.

**Files:**
- Modify: `lib/env.ts`

- [ ] **Step 1: Add Clerk keys and ADMIN_EMAILS to REQUIRED_ENV_VARS**

Open `lib/env.ts`. Replace the current constant:

```typescript
const REQUIRED_ENV_VARS = [
  'OPENAI_API_KEY',
  'DATABASE_URL',
] as const
```

With:

```typescript
const REQUIRED_ENV_VARS = [
  'OPENAI_API_KEY',
  'DATABASE_URL',
  'CLERK_SECRET_KEY',
  'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY',
] as const
```

- [ ] **Step 2: Run tests**

```bash
npm test -- --ci 2>&1 | tail -5
```
Expected: all pass (tests mock env vars; no change in test behaviour).

- [ ] **Step 3: Commit**

```bash
git add lib/env.ts
git commit -m "fix: add Clerk keys to required env var validation

CLERK_SECRET_KEY and NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY are
as critical as DATABASE_URL — missing them breaks auth entirely.
Now throws on production startup if either is absent."
```

---

## Task 6: Fix package.json — remove macOS-only scripts

`db:start`, `db:stop`, `db:status`, and `db:setup` call `brew` and POSIX `sleep`. The project runs on Windows and uses Neon (cloud Postgres), so local service management scripts are useless.

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Remove the four macOS-only scripts**

Open `package.json`. Remove these four entries from `"scripts"`:

```json
"db:start": "brew services start postgresql@14",
"db:stop": "brew services stop postgresql@14",
"db:status": "brew services list | grep postgresql || echo 'PostgreSQL service not found'",
"db:setup": "npm run db:start && sleep 2 && npm run db:push",
```

The remaining DB scripts (`db:generate`, `db:push`, `db:migrate`, `db:seed`, etc.) are cross-platform and should be kept.

- [ ] **Step 2: Run tests**

```bash
npm test -- --ci 2>&1 | tail -5
```
Expected: all pass.

- [ ] **Step 3: Commit**

```bash
git add package.json
git commit -m "chore: remove macOS-only PostgreSQL service scripts

db:start/stop/status/setup used brew and POSIX sleep.
Project uses Neon (cloud Postgres) and develops on Windows;
these scripts never worked and caused confusion."
```

---

## Task 7: Create .env.example

No `.env.example` exists. This causes the health check to skip env validation and makes onboarding harder.

**Files:**
- Create: `.env.example`

- [ ] **Step 1: Create .env.example with all required and optional variables**

```bash
cat > .env.example << 'EOF'
# ============================================================
# Database (Neon PostgreSQL — https://neon.tech)
# ============================================================
DATABASE_URL="postgresql://user:password@host/dbname?sslmode=require"

# ============================================================
# Clerk Authentication — https://clerk.com
# ============================================================
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_..."
CLERK_SECRET_KEY="sk_test_..."

# ============================================================
# OpenAI
# ============================================================
OPENAI_API_KEY="sk-..."

# Optional: override model defaults
# OPENAI_MODEL="gpt-4"
# OPENAI_TEMPERATURE="0.7"
# OPENAI_MAX_TOKENS="2000"

# ============================================================
# Admin access
# Comma-separated list of emails that receive the admin role
# ============================================================
ADMIN_EMAILS="you@example.com"

# ============================================================
# Email (Resend — https://resend.com) — optional
# Without this, the contact form silently skips sending email
# ============================================================
# RESEND_API_KEY="re_..."
# CONTACT_EMAIL="you@example.com"

# ============================================================
# Vercel Analytics — optional
# Set to "true" to enable @vercel/analytics on your deployment
# ============================================================
# NEXT_PUBLIC_ENABLE_VERCEL_ANALYTICS="true"

# ============================================================
# Rate limiting — optional, these are the defaults
# ============================================================
# RATE_LIMIT_PER_MINUTE="60"
EOF
```

- [ ] **Step 2: Run tests**

```bash
npm test -- --ci 2>&1 | tail -5
```
Expected: all pass.

- [ ] **Step 3: Commit**

```bash
git add .env.example
git commit -m "docs: add .env.example with all required and optional vars

Covers DATABASE_URL, Clerk keys, OpenAI key, ADMIN_EMAILS,
and optional vars (Resend, Vercel Analytics, rate limiting).
Health check will now pick this up correctly."
```
