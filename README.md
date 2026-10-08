# AI Study Planner

An AI-assisted study planner for organizing subjects, deadlines, study time, and progress. It includes a responsive landing page, Supabase authentication flow, profile and subject/topic management, deadlines, weekly availability, study plan generation, a session calendar, a persistent study timer, personal analytics, and an AI study assistant grounded in the signed-in user's planner data.

## Technology

- React, Vite, TypeScript, Tailwind CSS, shadcn/ui, React Router
- Node.js, Express, TypeScript, Zod
- Supabase Auth and PostgreSQL (configure your own Supabase project)
- OpenAI Responses API through the server-side TypeScript SDK

## Project layout

```text
src/                 React application
  components/        Shared and shadcn/ui components
  contexts/          Authentication session state
  lib/               Supabase client and shared helpers
  pages/             Landing, authentication, and dashboard pages
server/src/          Express API
database/migrations/ PostgreSQL schema migrations
docs/                Project documentation
```

## Run locally

Requirements: Node.js 20.19+ and npm.

```sh
npm install
Copy-Item .env.example .env
npm run dev:all
```

The Vite app runs at `http://localhost:5173`; the API runs at `http://localhost:3000`. Check the API at `http://localhost:3000/api/health`.

## Database setup

Create a Supabase project, then open its SQL Editor and run [`database/migrations/0001_initial_schema.sql`](./database/migrations/0001_initial_schema.sql), followed by [`database/migrations/0002_session_timer.sql`](./database/migrations/0002_session_timer.sql). These migrations create the profile and study-planning tables, owner-scoped Row Level Security policies, a profile trigger for new accounts, and the persistent session timer field. Configure the project URL and public anon key in `.env` before using the app.

## Environment variables

Copy `.env.example` to `.env` and add the values from your Supabase project. Keep `.env` private; it is ignored by Git.

| Variable                    | Used by     | Purpose                                                        |
| --------------------------- | ----------- | -------------------------------------------------------------- |
| `VITE_SUPABASE_URL`         | Browser     | Supabase project URL                                           |
| `VITE_SUPABASE_ANON_KEY`    | Browser     | Supabase public anon key; protect data with Row Level Security |
| `VITE_API_URL`              | Browser     | Optional API base URL for deployment; blank uses the local Vite proxy |
| `SUPABASE_SERVICE_ROLE_KEY` | Server only | Privileged Supabase key; never expose in browser code          |
| `DATABASE_URL`              | Server only | PostgreSQL connection string                                   |
| `OPENAI_API_KEY`            | Server only | AI API key; never expose in browser code                       |
| `OPENAI_MODEL`              | Server only | Optional model name (defaults to `gpt-5.4-mini`)               |
| `PORT`                      | Server      | API port (default `3000`)                                      |
| `CLIENT_ORIGIN`             | Server      | Allowed browser origin (default `http://localhost:5173`)       |

Authentication routes are available at `/register` and `/login`. The private `/assistant` page sends requests to `POST /api/assistant/chat`; the API verifies the Supabase access token, loads only that user's data through Row Level Security, and calls OpenAI from the server. It has a per-user in-memory request limit. Until Supabase URL and anon key are configured, authentication is unavailable; the assistant also requires a server-only `OPENAI_API_KEY`. Do not put the OpenAI key in a `VITE_` variable.

## Scripts

```sh
npm run dev:all       # Start the frontend and API
npm run build         # Type-check and build frontend and API
npm run lint          # Run ESLint
npm run test          # Run scheduler tests
npm run format        # Format project files with Prettier
```

## API

| Method | Endpoint      | Purpose                          |
| ------ | ------------- | -------------------------------- |
| `GET`  | `/api/health` | Check whether the API is running |
| `POST` | `/api/assistant/chat` | Secure, authenticated study assistant grounded in the signed-in user's data |

## Roadmap

1. Landing page and initial frontend/backend setup — complete
2. Supabase sign-up, login, session persistence, protected routes, and initial schema — scaffolded; requires Supabase credentials for end-to-end use
3. Profile, subjects, topics, exams, assignments, and availability — implemented
4. Scheduling algorithm, calendar, study sessions, and persistent timer — implemented
5. Analytics dashboard and progress-based study suggestions — implemented
6. AI study assistant with personal planner context — implemented
7. Revision plans, notes, notifications, security review, deployment, and college project documentation

Supabase credentials, the database migrations, and a server-only OpenAI API key are required for the authenticated planner and AI assistant to work end to end. The assistant is advisory and does not change the saved plan.
