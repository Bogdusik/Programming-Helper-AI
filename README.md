# Programming Helper AI

An AI-powered programming assistant designed for academic research on AI-assisted learning. Features instant AI responses, smart code analysis, structured learning tasks, and progress tracking. Built with Next.js, tRPC, and OpenAI GPT to help developers learn programming concepts, debug code, and solve programming challenges.

## Demo

![Chat Interface](screenshots/chat.png)
![Code Analysis](screenshots/code-analysis.png)
![Learning Dashboard](screenshots/dashboard.png)
![Statistics](screenshots/statistics.png)

## Why It's Cool

- **AI-Powered Assistance**: Real-time help with programming questions using OpenAI GPT with context-aware responses and conversation history
- **Smart Code Analysis**: Intelligent code review, bug detection, error explanations, and performance optimization recommendations
- **Structured Learning**: Pre and post-assessment quizzes, programming tasks by difficulty, and personalized learning paths
- **Type-Safe APIs**: Full-stack TypeScript with tRPC for end-to-end type safety from frontend to database
- **Progress Tracking**: Comprehensive analytics dashboard with user statistics, learning metrics, and progress visualization
- **Research Compliant**: GDPR-compliant data collection with anonymous user identification for academic research

## Tech Stack

- **Frontend**: Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS 4
- **Backend**: tRPC 11, Node.js, Prisma 6, PostgreSQL
- **AI**: OpenAI GPT (via OpenAI API)
- **Authentication**: Clerk
- **State Management**: TanStack Query (React Query)
- **Testing**: Jest, React Testing Library
- **Deployment**: Vercel

## How to Run Locally

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Bogdusik/Programming-Helper-AI.git
   cd Programming-Helper-AI
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment variables:**
   Create `.env.local` file:
   ```
   DATABASE_URL="postgresql://user:password@localhost:5432/programming_helper_ai"
   OPENAI_API_KEY="your-openai-api-key"
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="your-clerk-publishable-key"
   CLERK_SECRET_KEY="your-clerk-secret-key"
   NEXT_PUBLIC_APP_URL="http://localhost:3000"
   ```

4. **Set up the database:**
   ```bash
   npm run db:generate
   npm run db:push
   npm run db:init-rate-limits
   ```

5. **Start the development server:**
   ```bash
   npm run dev
   ```
   Application will be available at `http://localhost:3000`

> **Important**: Never hardcode secrets. Always use `.env.local` file for sensitive data.

## Project Structure

```
Programming-Helper-AI/
├── app/                         # Next.js App Router
│   ├── api/                    # API routes
│   │   └── trpc/               # tRPC API endpoint
│   ├── chat/                   # Chat interface page
│   ├── admin/                  # Admin dashboard
│   ├── stats/                  # Statistics page
│   └── [other pages]
│
├── components/                  # React Components
│   ├── ChatBox.tsx             # Main chat interface
│   ├── ChatSidebar.tsx         # Chat sessions sidebar
│   ├── Navbar.tsx              # Navigation bar
│   └── [other components]
│
├── lib/                         # Core Libraries
│   ├── trpc/                   # tRPC setup
│   │   ├── router.ts           # tRPC router
│   │   └── procedures/        # tRPC procedures
│   ├── openai.ts               # OpenAI integration
│   ├── db.ts                   # Prisma client
│   ├── auth.ts                 # Authentication utilities
│   └── [other utilities]
│
├── prisma/                      # Database
│   ├── schema.prisma           # Prisma schema
│   └── migrations/             # Database migrations
│
├── hooks/                       # Custom React Hooks
│   └── [custom hooks]
│
├── __tests__/                   # Test Files
│   ├── components/             # Component tests
│   ├── lib/                    # Library tests
│   └── api/                    # API tests
│
├── scripts/                     # Utility Scripts
│   └── [script files]
│
└── [config files]              # Configuration files
    ├── next.config.ts
    ├── tsconfig.json
    └── jest.config.js
```

## What I Learned

- **Full-Stack TypeScript**: Built complete type-safe application with tRPC, ensuring type safety from frontend to database
- **AI Integration**: Integrated OpenAI GPT API for intelligent code analysis, debugging assistance, and conversational AI
- **Next.js App Router**: Leveraged Next.js 15 App Router for modern React patterns, server components, and API routes
- **Database Design**: Designed relational schema with Prisma for users, conversations, tasks, assessments, and analytics
- **Research Ethics**: Implemented GDPR-compliant data collection with anonymous user identification and research consent mechanisms
- **Testing Strategies**: Wrote comprehensive tests for React components, API endpoints, and business logic using Jest and React Testing Library

Fork it, use it, improve it — open to PRs!
