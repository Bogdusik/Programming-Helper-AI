# Test accounts (Programming Helper AI)

Use these accounts for beta testers. **One shared password for all:** `PH-Test2025!xK9`

| # | Email | Password |
|---|--------|----------|
| 1 | ph.tester1@gmail.com | PH-Test2025!xK9 |
| 2 | ph.tester2@gmail.com | PH-Test2025!xK9 |
| 3 | ph.tester3@gmail.com | PH-Test2025!xK9 |
| 4 | ph.tester4@gmail.com | PH-Test2025!xK9 |
| 5 | ph.tester5@gmail.com | PH-Test2025!xK9 |
| 6 | ph.tester6@gmail.com | PH-Test2025!xK9 |
| 7 | ph.tester7@gmail.com | PH-Test2025!xK9 |
| 8 | ph.tester8@gmail.com | PH-Test2025!xK9 |
| 9 | ph.tester9@gmail.com | PH-Test2025!xK9 |
| 10 | ph.tester10@gmail.com | PH-Test2025!xK9 |

**Notes:**
- These 10 users are **already created in Clerk** (via `create-clerk-test-users.ts`). Use **Sign in** on the app, not Sign up.
- After first sign-in, each user is created in your app DB automatically.
- Password was set to a strong value (Clerk rejects common passwords like `TestPass123!` due to breach detection). Testers can change it after first login if needed.

## Creating accounts in Clerk automatically

From project root, with `CLERK_SECRET_KEY` in `.env` (from [Clerk Dashboard → API Keys](https://dashboard.clerk.com)):

```bash
npx tsx scripts/create-clerk-test-users.ts
```

This creates the 10 users in Clerk. They will appear in your app database on first sign-in.
