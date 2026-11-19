<div align="center">

<img src="docs/media/chat.png" alt="Chat: a student asks why binary search is faster than linear search and gets a structured answer with numbered points and sub-bullets" width="760">

# Programming Helper AI

**An AI tutor for learning to code: ask questions, practise tasks in a real editor and see your progress. Built as an Honours research project on AI-assisted programming learning.**

[![CI](https://github.com/Bogdusik/Programming-Helper-AI/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/Bogdusik/Programming-Helper-AI/actions/workflows/ci.yml)
[![Live demo](https://img.shields.io/badge/live_demo-vercel-000000?logo=vercel&logoColor=white)](https://programming-helper-ai.vercel.app)
![Next.js 15](https://img.shields.io/badge/Next.js-15-000000?logo=nextdotjs&logoColor=white)
![tRPC](https://img.shields.io/badge/tRPC-11-2596BE?logo=trpc&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-PostgreSQL-2D3748?logo=prisma&logoColor=white)
![OpenAI](https://img.shields.io/badge/OpenAI-API-412991?logo=openai&logoColor=white)
![Honours Project](https://img.shields.io/badge/Honours_Project-GCU-22c55e)
[![License: MIT](https://img.shields.io/badge/license-MIT-2EA44F)](LICENSE)

[Live demo](https://programming-helper-ai.vercel.app) · [What it does](#what-it-does) · [How a message is answered](#how-a-message-is-answered) · [Run it locally](#run-it-locally)

</div>

I built Programming Helper AI for my BSc (Hons) Computing Honours project at Glasgow Caledonian University. The question behind it: does an AI assistant that is limited to programming, and paired with structured practice, help people learn to code? The app is the study instrument: participants take a pre-assessment, learn with the assistant and the tasks, then take a post-assessment, and their interactions are collected anonymously with consent.

## What it does

<table>
<tr>
<td width="50%" valign="top">
<img src="docs/media/task-editor.png" alt="Task page: the Check Palindrome problem with hints and starter code on the left and a Monaco editor with a two-pointer solution on the right"><br>
<b>Practise in a real editor.</b> Tasks by language and difficulty, with hints and starter code, solved in the Monaco editor (the one in VS Code). "Continue in Chat" carries the task into a conversation.
</td>
<td width="50%" valign="top">
<img src="docs/media/tasks.png" alt="Programming tasks page: three JavaScript tasks with difficulty labels, one marked completed"><br>
<b>Tasks for your language.</b> Filtered by the language chosen in chat and by difficulty; completed tasks are marked and can be restarted.
</td>
</tr>
<tr>
<td colspan="2" valign="top">
<img src="docs/media/stats.png" alt="Progress page: pre-assessment score, post-assessment ready, questions asked, tasks completed, days active, average response time and language progress"><br>
<b>Progress and assessments.</b> Pre-assessment score, a post-assessment that unlocks after enough practice, questions asked, tasks completed, response times and progress per language.
</td>
</tr>
</table>

- **Programming-only assistant.** Questions are checked before they reach the model; off-topic ones get a short redirect instead of an API call.
- **Answers that read well.** Headings, numbered steps, bullets, inline code and code blocks are rendered as React elements, so model output is never parsed as HTML.
- **Research by design.** Consent before participation, anonymous identifiers, pre- and post-assessments and an admin dashboard for the study. See [docs/RESEARCH_ETHICS.md](docs/RESEARCH_ETHICS.md).
- **Guard rails.** Per-user rate limits stored in PostgreSQL, a 7-day cache of AI responses, a strict Content-Security-Policy and Clerk authentication.

## How a message is answered

```mermaid
flowchart LR
  U["Chat UI<br/>(React 19)"] -- "tRPC chat.sendMessage" --> R{"Rate limit<br/>(PostgreSQL)"}
  R --> V{"Programming<br/>question?"}
  V -- no --> X["Short redirect,<br/>no API call"]
  V -- yes --> C{"Cached answer?<br/>(7 days)"}
  C -- hit --> A["Answer"]
  C -- miss --> O["OpenAI<br/>(OPENAI_MODEL)"]
  O --> A
  A --> S[("Session, message and<br/>anonymous stats in PostgreSQL")]
  S --> U
```

The model is set in one place (`OPENAI_MODEL`, default `gpt-5.6-terra`), so moving to a new model is a configuration change.

## Tech stack

| Layer | Tech |
|---|---|
| Frontend | Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS 4, TanStack Query, Monaco Editor |
| API | tRPC 11 with Zod validation |
| Data | PostgreSQL, Prisma 6 |
| AI | OpenAI API |
| Auth | Clerk |
| Tests and CI | Jest and React Testing Library; GitHub Actions runs lint, type-check and tests on every push |
| Deployment | Vercel |

## Run it locally

**You need:** Node.js 20+, PostgreSQL, and keys for OpenAI and Clerk.

```bash
git clone https://github.com/Bogdusik/Programming-Helper-AI.git
cd Programming-Helper-AI
npm install
cp .env.example .env.local      # fill in DATABASE_URL, OPENAI_API_KEY and the Clerk keys
npm run db:push                 # create the schema
npm run db:init-rate-limits
npm run dev                     # http://localhost:3000
```

```bash
npm test             # Jest
npm run type-check   # TypeScript
```

<details>
<summary><b>Environment variables</b></summary>

```env
DATABASE_URL="postgresql://user:password@localhost:5432/programming_helper_ai"
OPENAI_API_KEY="sk-..."
# OPENAI_MODEL="gpt-5.6-terra"    # optional override
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_..."
CLERK_SECRET_KEY="sk_..."
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

Never hardcode secrets; keep them in `.env.local` locally and in Vercel's Environment Variables in production.

</details>

<details>
<summary><b>Deploying to Vercel</b></summary>

1. Import the repo in [Vercel](https://vercel.com) (branch `main`).
2. Add the environment variables above under **Settings → Environment Variables**.
3. Run `npm run db:push` against the production `DATABASE_URL` whenever `prisma/schema.prisma` changes.
4. If cloning fails with "There was a permanent problem cloning the repo", see [docs/VERCEL_DEPLOYMENT.md](docs/VERCEL_DEPLOYMENT.md).

</details>

<details>
<summary><b>Project structure</b></summary>

```
Programming-Helper-AI/
├── app/                 # Next.js App Router: chat, tasks, task/[id], stats, admin, settings, legal pages
│   └── api/trpc/        # tRPC endpoint
├── components/          # ChatBox, Message, TaskCodeEditor, ProgressDashboard, ResearchConsent, …
├── lib/                 # trpc.ts (router), openai.ts, prompts, programming-validator, db, rate limits
├── prisma/              # schema.prisma, seed
├── __tests__/           # component, lib and API tests
├── docs/                # API documentation, research ethics, deployment notes, README media
└── postman/             # Postman collection
```

</details>

<details>
<summary><b>Security notes</b></summary>

- All `@trpc/*` packages are kept at 11.8.0+ for the prototype-pollution fix flagged by Snyk.
- The app stays on Next.js 15 until `@clerk/nextjs` supports Next.js 16; the related Snyk finding is ignored in `.snyk` with an expiry.

</details>

## What I learned

- **End-to-end type safety:** tRPC and Prisma give one set of types from the database to the React components.
- **Building on an LLM API:** prompts that keep the assistant on topic, caching and rate limits to control cost, and keeping the model choice configurable after a model was retired.
- **Research ethics in software:** consent flows, anonymous identifiers and data that can be withdrawn.
- **Testing a UI that renders model output:** component tests that check formatting and that HTML in an answer stays text.

## Documentation

- [API documentation](docs/API_DOCUMENTATION.md)
- [Research ethics and GDPR](docs/RESEARCH_ETHICS.md)

## License

[MIT](LICENSE). Author: Bohdan Bozhenko ([Bogdusik](https://github.com/Bogdusik)).
