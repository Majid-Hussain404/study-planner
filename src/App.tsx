import { useState } from 'react'
import {
  ArrowRight,
  BookOpenCheck,
  BrainCircuit,
  CalendarDays,
  ChartNoAxesColumnIncreasing,
  Check,
  Clock3,
  Menu,
  Sparkles,
  Target,
  X,
} from 'lucide-react'
import { BrowserRouter, Link, Route, Routes } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { RequireAuth } from '@/components/RequireAuth'
import { AuthPage } from '@/pages/AuthPage'
import { DashboardPage } from '@/pages/DashboardPage'

const features = [
  {
    icon: BrainCircuit,
    title: 'A plan that fits your life',
    description:
      'Turn your subjects, deadlines, and available hours into a realistic weekly study plan.',
  },
  {
    icon: CalendarDays,
    title: 'Every deadline in view',
    description:
      'Keep exams, assignments, and study sessions together so the next step is always clear.',
  },
  {
    icon: ChartNoAxesColumnIncreasing,
    title: 'Progress you can feel',
    description:
      'See your completed work, study streaks, and the subjects that need more attention.',
  },
  {
    icon: Sparkles,
    title: 'Helpful AI guidance',
    description:
      'Get practical recommendations grounded in your goals, progress, and time available.',
  },
]

const steps = [
  ['01', 'Add your subjects', 'List your courses, topics, and upcoming exams.'],
  [
    '02',
    'Set your availability',
    'Tell us when you can study and how much time you have.',
  ],
  [
    '03',
    'Follow your plan',
    'Work through focused sessions and adjust as your week changes.',
  ],
]

function HomePage() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <div className="min-h-screen overflow-hidden bg-[#f8f8f4] text-[#20271f]">
      <header className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-8 lg:px-12">
        <Link
          to="/"
          className="flex items-center gap-2.5 font-semibold tracking-tight"
          aria-label="Studywise home"
        >
          <span className="grid size-9 place-items-center rounded-xl bg-[#214d3c] text-white">
            <BookOpenCheck size={19} />
          </span>
          <span className="text-lg">studywise</span>
        </Link>
        <nav
          className="hidden items-center gap-8 text-sm text-[#626c62] md:flex"
          aria-label="Main navigation"
        >
          <a className="transition hover:text-[#214d3c]" href="#features">
            Features
          </a>
          <a className="transition hover:text-[#214d3c]" href="#how-it-works">
            How it works
          </a>
          <a className="transition hover:text-[#214d3c]" href="#about">
            About
          </a>
        </nav>
        <div className="hidden items-center gap-3 md:flex">
          <Button variant="ghost" asChild className="h-10 px-4 text-[#37433a]">
            <Link to="/login">Log in</Link>
          </Button>
          <Button
            asChild
            className="h-10 rounded-full bg-[#214d3c] px-5 text-white hover:bg-[#193d30]"
          >
            <Link to="/register">
              Get started <ArrowRight />
            </Link>
          </Button>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {menuOpen ? <X /> : <Menu />}
        </Button>
      </header>

      {menuOpen && (
        <nav
          className="grid gap-1 border-t border-[#e8e9e1] px-5 py-4 text-sm md:hidden"
          aria-label="Mobile navigation"
        >
          <a
            className="rounded-lg px-3 py-2 hover:bg-white"
            href="#features"
            onClick={() => setMenuOpen(false)}
          >
            Features
          </a>
          <a
            className="rounded-lg px-3 py-2 hover:bg-white"
            href="#how-it-works"
            onClick={() => setMenuOpen(false)}
          >
            How it works
          </a>
          <Link className="rounded-lg px-3 py-2 hover:bg-white" to="/login">
            Log in
          </Link>
          <Link
            className="rounded-lg px-3 py-2 font-medium text-[#214d3c] hover:bg-white"
            to="/register"
          >
            Get started <ArrowRight className="ml-1 inline" size={16} />
          </Link>
        </nav>
      )}

      <main>
        <section className="mx-auto grid max-w-7xl items-center gap-14 px-5 pb-20 pt-14 sm:px-8 sm:pt-20 lg:grid-cols-[1fr_0.95fr] lg:gap-16 lg:px-12 lg:pb-28 lg:pt-24">
          <div>
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-[#dce7db] bg-white/75 px-3.5 py-2 text-xs font-medium text-[#315b48] shadow-sm">
              <Sparkles size={14} /> Your semester, a little more manageable
            </div>
            <h1 className="max-w-2xl text-5xl leading-[1.06] font-semibold tracking-[-0.055em] sm:text-6xl lg:text-[4.35rem]">
              Make room for{' '}
              <span className="font-serif font-normal italic text-[#548067]">
                better
              </span>{' '}
              study days.
            </h1>
            <p className="mt-6 max-w-xl text-base leading-7 text-[#626c62] sm:text-lg sm:leading-8">
              Bring your subjects, deadlines, and available time together. Get a
              clear plan for what to study next—and feel good about the progress
              you make.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Button
                asChild
                className="h-12 rounded-full bg-[#214d3c] px-6 text-sm text-white hover:bg-[#193d30]"
              >
                <Link to="/register">
                  Build my study plan <ArrowRight />
                </Link>
              </Button>
              <a
                className="rounded-full px-5 py-3 text-sm font-medium text-[#47554a] transition hover:bg-white"
                href="#how-it-works"
              >
                See how it works
              </a>
            </div>
            <div className="mt-9 flex items-center gap-3 text-sm text-[#687369]">
              <span className="flex -space-x-2" aria-hidden="true">
                <span className="grid size-8 place-items-center rounded-full border-2 border-[#f8f8f4] bg-[#d9eadc] text-xs">
                  A
                </span>
                <span className="grid size-8 place-items-center rounded-full border-2 border-[#f8f8f4] bg-[#f0dfcb] text-xs">
                  M
                </span>
                <span className="grid size-8 place-items-center rounded-full border-2 border-[#f8f8f4] bg-[#deddf1] text-xs">
                  S
                </span>
              </span>
              <span>Made for real student schedules</span>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-[34rem]">
            <div className="absolute -right-8 -top-10 size-48 rounded-full bg-[#e9e5cf] blur-3xl" />
            <div className="absolute -bottom-10 -left-7 size-48 rounded-full bg-[#d9e8d9] blur-3xl" />
            <div className="relative rounded-[1.6rem] border border-[#e5e8df] bg-white p-5 shadow-[0_28px_80px_-35px_rgba(33,77,60,0.28)] sm:p-7">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-[#7a847a]">Example schedule</p>
                  <h2 className="mt-1 text-xl font-semibold tracking-tight">
                    A sample study day
                  </h2>
                </div>
                <span className="grid size-10 place-items-center rounded-xl bg-[#f0f5ee] text-[#356348]">
                  <CalendarDays size={19} />
                </span>
              </div>
              <div className="mt-6 rounded-2xl bg-[#f5f7f2] p-4 sm:p-5">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">Example week</span>
                  <span className="text-[#637064]">6 of 10 sessions</span>
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#e2e8df]">
                  <div className="h-full w-[62%] rounded-full bg-[#548067]" />
                </div>
                <p className="mt-2 text-xs text-[#7a847a]">
                  You’re building a steady rhythm.
                </p>
              </div>
              <div className="mt-6 flex items-center justify-between text-xs font-medium tracking-wide text-[#7a847a] uppercase">
                <span>Up next</span>
                <span>2h 30m planned</span>
              </div>
              <div className="mt-3 space-y-3">
                <div className="flex items-center gap-3 rounded-2xl border border-[#e9ece6] p-3.5 sm:p-4">
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#edf3e8] text-[#416b4c]">
                    <Target size={18} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">
                      Data Structures
                    </p>
                    <p className="mt-1 text-xs text-[#7a847a]">
                      Trees &amp; graph traversal
                    </p>
                  </div>
                  <span className="flex items-center gap-1 text-xs text-[#717b71]">
                    <Clock3 size={13} /> 50 min
                  </span>
                </div>
                <div className="flex items-center gap-3 rounded-2xl border border-[#e9ece6] p-3.5 sm:p-4">
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#f8f0e6] text-[#a0713d]">
                    <BookOpenCheck size={18} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">
                      Computer Networks
                    </p>
                    <p className="mt-1 text-xs text-[#7a847a]">
                      Review transport layer
                    </p>
                  </div>
                  <span className="flex items-center gap-1 text-xs text-[#717b71]">
                    <Clock3 size={13} /> 40 min
                  </span>
                </div>
                <div className="flex items-center gap-3 rounded-2xl border border-[#e9ece6] p-3.5 sm:p-4">
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#efedf7] text-[#74679a]">
                    <Check size={18} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">
                      Operating Systems
                    </p>
                    <p className="mt-1 text-xs text-[#7a847a]">
                      Flashcard revision
                    </p>
                  </div>
                  <span className="flex items-center gap-1 text-xs text-[#717b71]">
                    <Clock3 size={13} /> 30 min
                  </span>
                </div>
              </div>
              <div className="mt-5 flex items-center gap-2 border-t border-[#edf0e9] pt-4 text-xs text-[#667467]">
                <Sparkles size={14} className="text-[#548067]" /> Balanced
                An example balanced around deadlines and study time
              </div>
            </div>
          </div>
        </section>

        <section
          id="features"
          className="border-y border-[#e9eae2] bg-white/70 px-5 py-20 sm:px-8 lg:px-12 lg:py-24"
        >
          <div className="mx-auto max-w-7xl">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold tracking-[0.18em] text-[#548067] uppercase">
                A calmer way to study
              </p>
              <h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
                Less juggling. More meaningful progress.
              </h2>
              <p className="mt-4 leading-7 text-[#687369]">
                One thoughtful place for your semester—from the first study plan
                to the last exam review.
              </p>
            </div>
            <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {features.map(({ icon: Icon, title, description }) => (
                <article
                  key={title}
                  className="rounded-2xl border border-[#ebede6] bg-[#fcfcfa] p-6 transition hover:-translate-y-1 hover:shadow-md"
                >
                  <span className="grid size-11 place-items-center rounded-xl bg-[#edf3e8] text-[#416b4c]">
                    <Icon size={20} />
                  </span>
                  <h3 className="mt-5 font-semibold tracking-tight">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-[#687369]">
                    {description}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section
          id="how-it-works"
          className="mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:px-12 lg:py-24"
        >
          <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
            <div>
              <p className="text-xs font-semibold tracking-[0.18em] text-[#548067] uppercase">
                Simple by design
              </p>
              <h2 className="mt-4 text-3xl leading-tight font-semibold tracking-tight sm:text-4xl">
                A good plan starts with knowing where you are.
              </h2>
              <p className="mt-4 leading-7 text-[#687369]">
                Set up what matters to you. Your schedule grows around your
                goals, not the other way around.
              </p>
            </div>
            <div className="divide-y divide-[#e5e8df]">
              {steps.map(([number, title, description]) => (
                <article
                  key={number}
                  className="grid gap-3 py-6 sm:grid-cols-[3rem_1fr]"
                >
                  <span className="font-mono text-sm text-[#8b968a]">
                    {number}
                  </span>
                  <div>
                    <h3 className="font-semibold">{title}</h3>
                    <p className="mt-1.5 text-sm leading-6 text-[#687369]">
                      {description}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="about" className="px-5 pb-20 sm:px-8 lg:px-12 lg:pb-24">
          <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-7 rounded-[1.75rem] bg-[#214d3c] px-7 py-10 text-white sm:px-10 sm:py-12 lg:flex-row lg:items-center lg:px-14">
            <div>
              <p className="text-xs font-semibold tracking-[0.18em] text-[#b8d2b8] uppercase">
                One step at a time
              </p>
              <h2 className="mt-3 max-w-xl text-3xl font-semibold tracking-tight sm:text-4xl">
                Make your next study session count.
              </h2>
              <p className="mt-3 max-w-xl text-sm leading-6 text-[#d3e0d3]">
                Start with your subjects and deadlines. You can shape the rest
                as you go.
              </p>
            </div>
            <Button
              asChild
              className="h-12 shrink-0 rounded-full bg-white px-6 text-sm text-[#214d3c] hover:bg-[#edf3e8]"
            >
              <Link to="/register">
                Get started <ArrowRight />
              </Link>
            </Button>
          </div>
        </section>
      </main>

      <footer className="border-t border-[#e5e8df] px-5 py-7 sm:px-8 lg:px-12">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 text-sm text-[#7a847a] sm:flex-row sm:items-center sm:justify-between">
          <Link
            to="/"
            className="flex items-center gap-2 font-semibold text-[#37473b]"
          >
            <BookOpenCheck size={17} /> studywise
          </Link>
          <p>Make time for what matters.</p>
          <p>© {new Date().getFullYear()} Studywise</p>
        </div>
      </footer>
    </div>
  )
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<AuthPage mode="login" />} />
        <Route path="/register" element={<AuthPage mode="register" />} />
        <Route element={<RequireAuth />}>
          <Route path="/dashboard" element={<DashboardPage />} />
        </Route>
        <Route path="*" element={<HomePage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
