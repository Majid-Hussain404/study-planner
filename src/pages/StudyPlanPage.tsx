import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ArrowLeft,
  CalendarDays,
  Check,
  Clock3,
  LoaderCircle,
  Sparkles,
  WandSparkles,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import {
  generateStudyPlan,
  type GeneratedStudySession,
  type PlannerAvailability,
  type PlannerDeadline,
  type PlannerSubject,
  type PlannerTopic,
  type UnscheduledTopic,
} from '@/lib/studyPlanner'

interface SavedSession {
  id: string
  user_id: string
  subject_id: string | null
  topic_id: string | null
  title: string
  starts_at: string
  ends_at: string
  started_at: string | null
  status: 'planned' | 'in_progress' | 'completed' | 'missed' | 'cancelled'
  completed_minutes: number
}

interface SubjectName {
  id: string
  name: string
}

export function StudyPlanPage({
  calendarOnly = false,
}: {
  calendarOnly?: boolean
}) {
  const { user } = useAuth()
  const [subjects, setSubjects] = useState<PlannerSubject[]>([])
  const [topics, setTopics] = useState<PlannerTopic[]>([])
  const [deadlines, setDeadlines] = useState<PlannerDeadline[]>([])
  const [availability, setAvailability] = useState<PlannerAvailability[]>([])
  const [sessions, setSessions] = useState<SavedSession[]>([])
  const [subjectNames, setSubjectNames] = useState<SubjectName[]>([])
  const [dailyStudyHours, setDailyStudyHours] = useState(2)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [preview, setPreview] = useState<GeneratedStudySession[] | null>(null)
  const [unscheduled, setUnscheduled] = useState<UnscheduledTopic[]>([])

  const loadData = useCallback(async () => {
    if (!supabase || !user) return
    const rangeStart = new Date()
    rangeStart.setDate(rangeStart.getDate() - 7)
    const rangeEnd = new Date()
    rangeEnd.setDate(rangeEnd.getDate() + 7)
    const [
      subjectResult,
      topicResult,
      deadlineResult,
      availabilityResult,
      sessionResult,
      profileResult,
    ] = await Promise.all([
      supabase
        .from('subjects')
        .select('id, name, difficulty, priority, exam_date')
        .eq('user_id', user.id),
      supabase
        .from('topics')
        .select('id, subject_id, title, status, estimated_minutes, mastery')
        .eq('user_id', user.id),
      supabase
        .from('deadlines')
        .select('subject_id, due_at, completed_at, priority')
        .eq('user_id', user.id),
      supabase
        .from('availability')
        .select('weekday, starts_at, ends_at')
        .eq('user_id', user.id),
      supabase
        .from('study_sessions')
        .select('*')
        .eq('user_id', user.id)
        .neq('status', 'cancelled')
        .gte('starts_at', rangeStart.toISOString())
        .lt('starts_at', rangeEnd.toISOString())
        .order('starts_at'),
      supabase
        .from('profiles')
        .select('daily_study_hours')
        .eq('id', user.id)
        .maybeSingle(),
    ])
    const failed = [
      subjectResult,
      topicResult,
      deadlineResult,
      availabilityResult,
      sessionResult,
      profileResult,
    ].find((result) => result.error)
    if (failed?.error) setError(failed.error.message)
    if (subjectResult.data) {
      setSubjects(subjectResult.data)
      setSubjectNames(subjectResult.data.map(({ id, name }) => ({ id, name })))
    }
    if (topicResult.data) setTopics(topicResult.data)
    if (deadlineResult.data) setDeadlines(deadlineResult.data)
    if (availabilityResult.data) setAvailability(availabilityResult.data)
    if (sessionResult.data) setSessions(sessionResult.data)
    if (profileResult.data)
      setDailyStudyHours(Number(profileResult.data.daily_study_hours))
    setLoading(false)
  }, [user])

  useEffect(() => {
    // Results are committed after the Supabase requests finish.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadData()
  }, [loadData])

  const subjectNameMap = useMemo(
    () => new Map(subjectNames.map((subject) => [subject.id, subject.name])),
    [subjectNames],
  )
  const recentSessions = sessions

  function handleGenerate() {
    setError('')
    setGenerating(true)
    setPreview(null)
    setUnscheduled([])
    if (availability.length === 0) {
      setError(
        'Add at least one weekly time window before generating a study plan.',
      )
      setGenerating(false)
      return
    }
    if (topics.length === 0) {
      setError(
        'Add some topics to your subjects before generating a study plan.',
      )
      setGenerating(false)
      return
    }

    const plan = generateStudyPlan({
      subjects,
      topics,
      deadlines,
      availability,
      existingSessions: sessions,
      dailyStudyHours,
    })
    setPreview(plan.sessions)
    setUnscheduled(plan.unscheduled)
    if (plan.sessions.length === 0)
      setError(
        'No study sessions fit in your availability this week. Try adding longer or more time windows.',
      )
    setGenerating(false)
  }

  async function savePlan() {
    if (!supabase || !user || !preview?.length) return
    setSaving(true)
    setError('')
    const rows = preview.map((session) => ({
      user_id: user.id,
      subject_id: session.subjectId,
      topic_id: session.topicId,
      title: session.title,
      starts_at: session.startsAt,
      ends_at: session.endsAt,
      status: 'planned' as const,
    }))
    const { error: saveError } = await supabase
      .from('study_sessions')
      .insert(rows)
    setSaving(false)
    if (saveError) {
      setError(saveError.message)
      return
    }
    setPreview(null)
    await loadData()
  }

  async function setSessionStatus(
    session: SavedSession,
    status: 'completed' | 'missed',
  ) {
    if (!supabase) return
    setError('')
    setNotice('')
    const plannedDuration = Math.max(
      0,
      Math.round(
        (new Date(session.ends_at).getTime() -
          new Date(session.starts_at).getTime()) /
      60_000,
      ),
    )
    const completedMinutes = status === 'completed'
      ? session.status === 'in_progress' && session.started_at
        ? Math.max(0, Math.floor((Date.now() - new Date(session.started_at).getTime()) / 60_000))
        : plannedDuration
      : 0
    const { error: updateError } = await supabase
      .from('study_sessions')
      .update({
        status,
        completed_minutes: completedMinutes,
      })
      .eq('id', session.id)
    if (updateError) setError(updateError.message)
    else {
      const updated = {
        ...session,
        status,
        completed_minutes: completedMinutes,
      }
      setSessions((current) =>
        current.map((item) => (item.id === session.id ? updated : item)),
      )
      if (status === 'missed' && session.topic_id) {
        const replacementPlan = generateStudyPlan({
          subjects,
          topics,
          deadlines,
          availability,
          existingSessions: sessions.map((item) =>
            item.id === session.id
              ? { ...item, status: 'missed' as const }
              : item,
          ),
          dailyStudyHours,
        })
        const replacement = replacementPlan.sessions.find(
          (item) => item.topicId === session.topic_id,
        )
        if (replacement) {
          const { error: rescheduleError } = await supabase
            .from('study_sessions')
            .insert({
              user_id: user?.id,
              subject_id: replacement.subjectId,
              topic_id: replacement.topicId,
              title: replacement.title,
              starts_at: replacement.startsAt,
              ends_at: replacement.endsAt,
              status: 'planned',
            })
            .select('*')
            .single()
          if (rescheduleError)
            setError(
              `Session marked missed, but rescheduling failed: ${rescheduleError.message}`,
            )
          else {
            setNotice(
              `Missed session rescheduled to ${formatSessionTime(replacement.startsAt, replacement.endsAt)}.`,
            )
            await loadData()
          }
        } else {
          setNotice(
            'Session marked missed. There is no free time in your next week; add availability or regenerate after adjusting your schedule.',
          )
        }
      }
    }
  }

  async function startSession(session: SavedSession) {
    if (!supabase) return
    const startedAt = new Date().toISOString()
    const { error: startError } = await supabase
      .from('study_sessions')
      .update({ status: 'in_progress', started_at: startedAt })
      .eq('id', session.id)
    if (startError) setError(startError.message)
    else {
      setSessions((current) => current.map((item) => item.id === session.id
        ? { ...item, status: 'in_progress', started_at: startedAt }
        : item))
    }
  }

  const pageTitle = calendarOnly ? 'Study calendar' : 'Your study plan'

  return (
    <main className="min-h-screen bg-[#f8f8f4] px-5 py-8 sm:px-10">
      <div className="mx-auto max-w-5xl">
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 text-sm text-[#758075] hover:text-[#214d3c]"
        >
          <ArrowLeft size={16} /> Back to dashboard
        </Link>
        <div className="mt-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm text-[#7a847a]">
              {calendarOnly
                ? 'Your upcoming study sessions'
                : 'A practical plan for the next seven days'}
            </p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight">
              {pageTitle}
            </h1>
            <p className="mt-2 text-sm text-[#687369]">
              Sessions use your weekly availability, topic progress, subject
              priority, and deadlines.
            </p>
          </div>
          {!calendarOnly && (
            <Button
              disabled={loading || generating}
              onClick={handleGenerate}
              className="h-10 rounded-full bg-[#214d3c] px-5 text-white hover:bg-[#193d30]"
            >
              {generating ? (
                <LoaderCircle className="animate-spin" />
              ) : (
                <WandSparkles size={17} />
              )}{' '}
              Generate this week
            </Button>
          )}
        </div>

        {error && (
          <p
            role="alert"
            className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
          >
            {error}
          </p>
        )}
        {notice && (
          <p
            role="status"
            className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900"
          >
            {notice}
          </p>
        )}
        {loading ? (
          <p className="mt-10 flex items-center justify-center gap-2 text-sm text-[#758075]">
            <LoaderCircle className="animate-spin" size={17} /> Loading your
            study plan…
          </p>
        ) : (
          <>
            {!calendarOnly && (
              <section className="mt-6 grid gap-3 sm:grid-cols-3">
                <SummaryCard
                  label="Topics to study"
                  value={topics
                    .filter((topic) => topic.status !== 'completed')
                    .length.toString()}
                />
                <SummaryCard
                  label="Weekly study windows"
                  value={availability.length.toString()}
                />
                <SummaryCard
                  label="Daily study limit"
                  value={`${dailyStudyHours} h`}
                />
              </section>
            )}

            {preview && preview.length > 0 && (
              <section className="mt-7 rounded-2xl border border-[#cfe0ce] bg-[#f1f6ee] p-5 sm:p-7">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="flex items-center gap-2 text-sm font-medium text-[#315b48]">
                      <Sparkles size={16} /> Plan preview
                    </p>
                    <p className="mt-1 text-sm text-[#687369]">
                      Review the generated sessions, then save them to your
                      calendar.
                    </p>
                  </div>
                  <Button
                    onClick={() => void savePlan()}
                    disabled={saving}
                    className="rounded-full bg-[#214d3c] text-white hover:bg-[#193d30]"
                  >
                    {saving && <LoaderCircle className="animate-spin" />} Save{' '}
                    {preview.length} sessions
                  </Button>
                </div>
                <div className="mt-5 space-y-3">
                  {preview.map((session) => (
                    <article
                      key={`${session.topicId}-${session.startsAt}`}
                      className="flex flex-wrap items-center gap-3 rounded-xl border border-[#e0e9dd] bg-white p-4"
                    >
                      <span className="grid size-9 place-items-center rounded-lg bg-[#edf3e8] text-[#416b4c]">
                        <Clock3 size={17} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <h3 className="truncate text-sm font-medium">
                          {session.title}
                        </h3>
                        <p className="mt-1 text-xs text-[#7a847a]">
                          {subjectNameMap.get(session.subjectId) ?? 'Subject'} ·{' '}
                          {formatSessionTime(session.startsAt, session.endsAt)}
                        </p>
                      </div>
                      <span className="text-xs text-[#687369]">
                        {session.durationMinutes} min
                      </span>
                    </article>
                  ))}
                </div>
                {unscheduled.length > 0 && (
                  <p className="mt-4 text-xs leading-5 text-[#687369]">
                    {unscheduled.length} topic
                    {unscheduled.length === 1 ? '' : 's'} still need more time
                    than this week allows:{' '}
                    {unscheduled
                      .map(
                        (item) =>
                          `${item.title} (${item.remainingMinutes} min)`,
                      )
                      .join(', ')}
                    .
                  </p>
                )}
              </section>
            )}

            <section className="mt-8">
              <div className="mb-3 flex items-center justify-between gap-4">
                <h2 className="font-semibold">
                  {calendarOnly
                    ? 'Sessions from the past week through next week'
                    : 'Saved sessions'}
                </h2>
                {!calendarOnly && (
                  <Link
                    to="/calendar"
                    className="text-sm font-medium text-[#416b4c] hover:underline"
                  >
                    Open calendar
                  </Link>
                )}
              </div>
              {recentSessions.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-[#d9dfd6] bg-white/70 px-6 py-12 text-center">
                  <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-[#edf3e8] text-[#416b4c]">
                    <CalendarDays size={21} />
                  </span>
                  <h3 className="mt-4 font-semibold">
                    No saved sessions this week
                  </h3>
                  <p className="mt-2 text-sm text-[#687369]">
                    {calendarOnly
                      ? 'Generate a study plan to fill your calendar.'
                      : 'Generate a plan to create your first study sessions.'}
                  </p>
                  {calendarOnly && (
                    <Button
                      asChild
                      className="mt-5 rounded-full bg-[#214d3c] px-5 text-white hover:bg-[#193d30]"
                    >
                      <Link to="/plan">Generate a study plan</Link>
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {calendarOnly ? (
                    groupSessionsByDate(recentSessions).map((group) => (
                      <section key={group.key} className="rounded-2xl border border-[#e5e8df] bg-white p-4">
                        <h3 className="mb-3 text-sm font-semibold">{group.title}</h3>
                        <div className="space-y-3">
                          {group.sessions.map((session) => (
                            <StudySessionCard key={session.id} session={session} subjectName={subjectNameMap.get(session.subject_id ?? '') ?? 'Subject'} onStart={startSession} onComplete={(item) => void setSessionStatus(item, 'completed')} onMissed={(item) => void setSessionStatus(item, 'missed')} />
                          ))}
                        </div>
                      </section>
                    ))
                  ) : (
                    recentSessions.map((session) => (
                      <StudySessionCard key={session.id} session={session} subjectName={subjectNameMap.get(session.subject_id ?? '') ?? 'Subject'} onStart={startSession} onComplete={(item) => void setSessionStatus(item, 'completed')} onMissed={(item) => void setSessionStatus(item, 'missed')} />
                    ))
                  )}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </main>
  )
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[#e5e8df] bg-white p-4">
      <p className="text-xs text-[#7a847a]">{label}</p>
      <p className="mt-1 text-2xl font-semibold tracking-tight">{value}</p>
    </div>
  )
}

function StudySessionCard({
  session,
  subjectName,
  onStart,
  onComplete,
  onMissed,
}: {
  session: SavedSession
  subjectName: string
  onStart: (session: SavedSession) => void
  onComplete: (session: SavedSession) => void
  onMissed: (session: SavedSession) => void
}) {
  const [now, setNow] = useState(0)

  useEffect(() => {
    if (session.status !== 'in_progress') return
    const timerId = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(timerId)
  }, [session.started_at, session.status])

  const elapsedSeconds = session.started_at
    ? Math.max(0, Math.floor((now - new Date(session.started_at).getTime()) / 1000))
    : 0
  const timer = `${Math.floor(elapsedSeconds / 60)
    .toString()
    .padStart(2, '0')}:${(elapsedSeconds % 60).toString().padStart(2, '0')}`
  const durationMinutes = Math.max(
    0,
    Math.round(
      (new Date(session.ends_at).getTime() -
        new Date(session.starts_at).getTime()) /
        60_000,
    ),
  )

  return (
    <article className="flex flex-wrap items-center gap-3 rounded-xl border border-[#e5e8df] bg-white p-4">
      <span className="grid size-9 place-items-center rounded-lg bg-[#edf3e8] text-[#416b4c]">
        {session.status === 'completed' ? <Check size={17} /> : <Clock3 size={17} />}
      </span>
      <div className="min-w-0 flex-1">
        <h3 className="truncate text-sm font-medium">{session.title}</h3>
        <p className="mt-1 text-xs text-[#7a847a]">
          {subjectName} · {formatSessionTime(session.starts_at, session.ends_at)}
        </p>
      </div>
      {session.status === 'in_progress' ? (
        <>
          <span className="font-mono text-sm tabular-nums text-[#315b48]" role="timer" aria-label={`Elapsed study time ${timer}`}>
            {timer}
          </span>
          <Button size="sm" onClick={() => onComplete(session)} className="rounded-full bg-[#214d3c] text-white hover:bg-[#193d30]">
            Finish
          </Button>
          <Button size="sm" variant="outline" onClick={() => onMissed(session)} className="rounded-full">
            Missed
          </Button>
        </>
      ) : session.status === 'planned' ? (
        <>
          <span className="text-xs text-[#687369]">{durationMinutes} min</span>
          <Button size="sm" onClick={() => onStart(session)} className="rounded-full bg-[#214d3c] text-white hover:bg-[#193d30]">
            Start
          </Button>
          <Button size="sm" variant="outline" onClick={() => onMissed(session)} className="rounded-full">
            Missed
          </Button>
        </>
      ) : session.status === 'completed' ? (
        <span className="text-xs text-[#416b4c]">Completed · {session.completed_minutes} min</span>
      ) : (
        <span className="text-xs text-[#7a847a]">{session.status === 'missed' ? 'Missed' : 'Cancelled'}</span>
      )}
    </article>
  )
}

function groupSessionsByDate(sessions: SavedSession[]) {
  const groups = new Map<string, SavedSession[]>()
  for (const session of sessions) {
    const date = new Date(session.starts_at)
    const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`
    groups.set(key, [...(groups.get(key) ?? []), session])
  }
  return [...groups].map(([key, groupedSessions]) => ({
    key,
    title: new Date(groupedSessions[0].starts_at).toLocaleDateString(undefined, {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    }),
    sessions: groupedSessions,
  }))
}

function formatSessionTime(start: string, end: string): string {
  const startDate = new Date(start)
  const endDate = new Date(end)
  return `${startDate.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}, ${startDate.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}–${endDate.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}`
}
