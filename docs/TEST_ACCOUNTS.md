# Test accounts (Programming Helper AI)

Use these accounts for beta testers. **One shared password for all:** `TestPass123!`

| # | Email | Password |
|---|--------|----------|
| 1 | ph.tester1@gmail.com | TestPass123! |
| 2 | ph.tester2@gmail.com | TestPass123! |
| 3 | ph.tester3@gmail.com | TestPass123! |
| 4 | ph.tester4@gmail.com | TestPass123! |
| 5 | ph.tester5@gmail.com | TestPass123! |
| 6 | ph.tester6@gmail.com | TestPass123! |
| 7 | ph.tester7@gmail.com | TestPass123! |
| 8 | ph.tester8@gmail.com | TestPass123! |
| 9 | ph.tester9@gmail.com | TestPass123! |
| 10 | ph.tester10@gmail.com | TestPass123! |

**Notes:**
- You can create these in Clerk either **manually** (Sign Up on your app) or **in bulk** with the script (see below).
- After first sign-in, each user is created in your app DB automatically.
- Recommend testers to change password after first login if needed.

## Creating accounts in Clerk automatically

From project root, with `CLERK_SECRET_KEY` in `.env` (from [Clerk Dashboard → API Keys](https://dashboard.clerk.com)):

```bash
npx tsx scripts/create-clerk-test-users.ts
```

This creates the 10 users in Clerk. They will appear in your app database on first sign-in.
