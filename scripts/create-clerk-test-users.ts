/**
 * Creates test users in Clerk via Backend API.
 * Requires CLERK_SECRET_KEY in .env or .env.local (from Clerk Dashboard → API Keys).
 * Run: npx tsx scripts/create-clerk-test-users.ts
 *
 * Users will still need to be created in your app DB on first sign-in
 * (your create-user endpoint runs when they open the app).
 */

import * as fs from 'fs'
import * as path from 'path'

// Load .env and .env.local from project root (.env.local overrides)
function loadEnv(file: string) {
  const envPath = path.join(process.cwd(), file)
  if (fs.existsSync(envPath)) {
    const raw = fs.readFileSync(envPath, 'utf-8')
    for (const line of raw.split('\n')) {
      const m = line.match(/^\s*([^#=]+)=(.*)$/)
      if (m) process.env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, '')
    }
  }
}
loadEnv('.env')
loadEnv('.env.local')

const CLERK_SECRET = process.env.CLERK_SECRET_KEY
const TEST_USERS_PATH = path.join(process.cwd(), 'scripts', 'test-users.json')

interface TestUser {
  email: string
  password: string
  firstName: string
  lastName: string
}

async function createUser(user: TestUser): Promise<{ ok: boolean; id?: string; error?: string }> {
  if (!CLERK_SECRET) {
    return { ok: false, error: 'CLERK_SECRET_KEY is not set' }
  }
  const res = await fetch('https://api.clerk.com/v1/users', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${CLERK_SECRET}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email_address: [user.email],
      password: user.password,
      first_name: user.firstName,
      last_name: user.lastName,
    }),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    return { ok: false, error: data.errors?.[0]?.message || data.message || res.statusText }
  }
  return { ok: true, id: data.id }
}

async function main() {
  if (!CLERK_SECRET) {
    console.error('Missing CLERK_SECRET_KEY in .env. Add it from Clerk Dashboard → API Keys.')
    process.exit(1)
  }
  let users: TestUser[]
  try {
    const raw = fs.readFileSync(TEST_USERS_PATH, 'utf-8')
    users = JSON.parse(raw)
  } catch (e) {
    console.error('Failed to read scripts/test-users.json:', e)
    process.exit(1)
  }
  console.log(`Creating ${users.length} users in Clerk...`)
  for (const user of users) {
    const result = await createUser(user)
    if (result.ok) {
      console.log(`  OK: ${user.email} (id: ${result.id})`)
    } else {
      console.log(`  FAIL: ${user.email} — ${result.error}`)
    }
  }
  console.log('Done. Users will appear in your app DB on first sign-in.')
}

main()
