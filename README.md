# AI Study Planner

An AI-assisted study planner for organizing subjects, deadlines, study time, and progress. This project is being built in phases; the landing page, responsive layouts, Express health endpoint, and Supabase authentication flow are in place. Academic planning and AI features are still under development.

## Technology

- React, Vite, TypeScript, Tailwind CSS, shadcn/ui, React Router
- Node.js, Express, TypeScript, Zod
- Supabase Auth and PostgreSQL (configure your own Supabase project)
- OpenAI API package for future server-side AI features

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

Create a Supabase project, then open its SQL Editor and run [`database/migrations/0001_initial_schema.sql`](./database/migrations/0001_initial_schema.sql). The migration creates the initial profile and study-planning tables, owner-scoped Row Level Security policies, and a profile trigger for new accounts. Configure the project URL and public anon key in `.env` before testing registration.

## Environment variables

Copy `.env.example` to `.env` and add the values from your Supabase project. Keep `.env` private; it is ignored by Git.

| Variable                    | Used by     | Purpose                                                        |
| --------------------------- | ----------- | -------------------------------------------------------------- |
| `VITE_SUPABASE_URL`         | Browser     | Supabase project URL                                           |
| `VITE_SUPABASE_ANON_KEY`    | Browser     | Supabase public anon key; protect data with Row Level Security |
| `SUPABASE_SERVICE_ROLE_KEY` | Server only | Privileged Supabase key; never expose in browser code          |
| `DATABASE_URL`              | Server only | PostgreSQL connection string                                   |
| `OPENAI_API_KEY`            | Server only | AI API key; never expose in browser code                       |
| `PORT`                      | Server      | API port (default `3000`)                                      |
| `CLIENT_ORIGIN`             | Server      | Allowed browser origin (default `http://localhost:5173`)       |

Authentication routes are available at `/register` and `/login`. Until Supabase URL and anon key are configured, they show setup guidance and disable submission rather than pretending to authenticate.

## Scripts

```sh
npm run dev:all       # Start the frontend and API
npm run build         # Type-check and build frontend and API
npm run lint          # Run ESLint
npm run format        # Format project files with Prettier
```

## API

| Method | Endpoint      | Purpose                          |
| ------ | ------------- | -------------------------------- |
| `GET`  | `/api/health` | Check whether the API is running |

## Roadmap

1. Landing page and initial frontend/backend setup — complete
2. Supabase sign-up, login, session persistence, protected routes, and initial schema — scaffolded; requires Supabase credentials for end-to-end use
3. Profile, subjects, topics, exams, assignments, and availability
4. Scheduling algorithm, calendar, study sessions, and progress
5. Analytics and server-side AI recommendations
6. Security review, tests, deployment, and college project documentation

The planner and AI endpoints are not implemented yet. Credentials and a Supabase project are required before authentication can be exercised end to end.
