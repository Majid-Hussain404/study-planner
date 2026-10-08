import { useCallback, useEffect, useState } from 'react'
import { ArrowLeft, ChartNoAxesColumnIncreasing, Clock3, LoaderCircle, Target } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { buildAnalytics, type AnalyticsSession, type AnalyticsSubject, type AnalyticsTopic } from '@/lib/analytics'

export function AnalyticsPage() {
  const { user } = useAuth()
  const [data, setData] = useState<ReturnType<typeof buildAnalytics> | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadAnalytics = useCallback(async () => {
    if (!supabase || !user) {
      setLoading(false)
      return
    }
    const since = new Date()
    since.setDate(since.getDate() - 6)
    const [subjectsResult, topicsResult, sessionsResult] = await Promise.all([
      supabase.from('subjects').select('id, name, progress').eq('user_id', user.id),
      supabase.from('topics').select('subject_id, mastery').eq('user_id', user.id),
      supabase.from('study_sessions').select('subject_id, starts_at, status, completed_minutes').eq('user_id', user.id).gte('starts_at', since.toISOString()).neq('status', 'cancelled'),
    ])
    const failed = [subjectsResult, topicsResult, sessionsResult].find((result) => result.error)
    if (failed?.error) setError(failed.error.message)
    if (subjectsResult.data && topicsResult.data && sessionsResult.data) {
      setData(buildAnalytics(
        subjectsResult.data as AnalyticsSubject[],
        topicsResult.data as AnalyticsTopic[],
        sessionsResult.data as AnalyticsSession[],
      ))
    }
    setLoading(false)
  }, [user])

  useEffect(() => {
    // Commit fetched analytics after the Supabase requests resolve.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadAnalytics()
  }, [loadAnalytics])

  return (
    <main className="min-h-screen bg-[#f8f8f4] px-5 py-8 sm:px-10">
      <div className="mx-auto max-w-5xl">
        <Link to="/dashboard" className="inline-flex items-center gap-2 text-sm text-[#758075] hover:text-[#214d3c]"><ArrowLeft size={16} /> Back to dashboard</Link>
        <header className="mt-8">
          <p className="text-sm text-[#7a847a]">Your progress over the past week</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">Study analytics</h1>
        </header>
        {error && <p role="alert" className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>}
        {loading ? <p className="mt-10 flex items-center justify-center gap-2 text-sm text-[#758075]"><LoaderCircle className="animate-spin" size={17} /> Loading analytics…</p> : data && <>
          <section className="mt-7 grid gap-3 sm:grid-cols-3">
            <MetricCard label="Study time (7 days)" value={`${data.totalStudyHours} h`} icon={<Clock3 size={18} />} />
            <MetricCard label="Completed sessions" value={String(data.completed)} icon={<ChartNoAxesColumnIncreasing size={18} />} />
            <MetricCard label="Completion rate" value={`${data.completionRate}%`} icon={<Target size={18} />} detail={`${data.missed} missed session${data.missed === 1 ? '' : 's'}`} />
          </section>
          <section className="mt-5 grid gap-5 lg:grid-cols-2">
            <article className="rounded-2xl border border-[#e5e8df] bg-white p-5 sm:p-6">
              <h2 className="font-semibold">Weekly study hours</h2>
              <p className="mt-1 text-xs text-[#7a847a]">Based on completed session time</p>
              <div className="mt-5 h-64" role="img" aria-label="Bar chart of study hours for the past seven days">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.weeklyStudy} margin={{ top: 8, right: 8, left: -24, bottom: 0 }}>
                    <CartesianGrid stroke="#edf0e9" vertical={false} />
                    <XAxis dataKey="day" tickLine={false} axisLine={false} tick={{ fill: '#7a847a', fontSize: 12 }} />
                    <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fill: '#7a847a', fontSize: 12 }} />
                    <Tooltip formatter={(value) => [`${value} h`, 'Study time']} />
                    <Bar dataKey="hours" fill="#548067" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </article>
            <article className="rounded-2xl border border-[#e5e8df] bg-white p-5 sm:p-6">
              <h2 className="font-semibold">Subject progress</h2>
              <p className="mt-1 text-xs text-[#7a847a]">Average topic mastery, or subject progress if no topics exist</p>
              {data.subjectProgress.length ? <div className="mt-5 space-y-4">
                {data.subjectProgress.map((subject) => <div key={subject.subjectId}>
                  <div className="mb-1.5 flex justify-between gap-3 text-sm"><span className="truncate">{subject.name}</span><span className="font-medium text-[#416b4c]">{subject.progress}%</span></div>
                  <div className="h-2 overflow-hidden rounded-full bg-[#edf0e9]"><div className="h-full rounded-full bg-[#548067]" style={{ width: `${subject.progress}%` }} /></div>
                </div>)}
              </div> : <EmptyMessage>Once you add subjects, your progress will appear here.</EmptyMessage>}
            </article>
          </section>
          <section className="mt-5 rounded-2xl border border-[#e5e8df] bg-white p-5 sm:p-6">
            <h2 className="font-semibold">Needs attention</h2>
            <p className="mt-1 text-xs text-[#7a847a]">Suggestions based on your saved progress and sessions</p>
            {data.subjectProgress.filter((subject) => subject.progress < 50 || subject.missedSessions > 0).length ? <ul className="mt-4 space-y-3">
              {data.subjectProgress.filter((subject) => subject.progress < 50 || subject.missedSessions > 0).map((subject) => <li key={subject.subjectId} className="rounded-xl bg-[#f8f8f4] px-4 py-3 text-sm leading-6">
                <strong>{subject.name}</strong>: {subject.progress < 50 ? `only ${subject.progress}% topic mastery; schedule a focused review` : 'progress is on track'}{subject.missedSessions ? `, and ${subject.missedSessions} missed session${subject.missedSessions === 1 ? '' : 's'} to make up` : ''}.
              </li>)}
            </ul> : <EmptyMessage>No subjects need extra attention from the data available. Keep logging your sessions to improve these insights.</EmptyMessage>}
          </section>
        </>}
      </div>
    </main>
  )
}

function MetricCard({ label, value, icon, detail }: { label: string; value: string; icon: React.ReactNode; detail?: string }) {
  return <article className="rounded-2xl border border-[#e5e8df] bg-white p-4"><p className="flex items-center gap-2 text-xs text-[#7a847a]">{icon}{label}</p><p className="mt-2 text-2xl font-semibold tracking-tight">{value}</p>{detail && <p className="mt-1 text-xs text-[#7a847a]">{detail}</p>}</article>
}

function EmptyMessage({ children }: { children: React.ReactNode }) {
  return <p className="mt-5 rounded-xl border border-dashed border-[#d9dfd6] px-4 py-6 text-center text-sm text-[#687369]">{children}</p>
}
