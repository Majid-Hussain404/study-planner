import { useCallback, useEffect, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  ArrowLeft,
  CalendarClock,
  Check,
  LoaderCircle,
  Plus,
  Trash2,
} from 'lucide-react'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router-dom'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'

const deadlineSchema = z.object({
  title: z.string().trim().min(1, 'Add a title.').max(180),
  kind: z.enum(['exam', 'assignment', 'project', 'other']),
  subjectId: z.string(),
  dueAt: z.string().min(1, 'Choose a due date and time.'),
  priority: z.enum(['low', 'medium', 'high', 'critical']),
  description: z.string().max(2000),
})

type DeadlineFormValues = z.infer<typeof deadlineSchema>
interface Deadline {
  id: string
  user_id: string
  subject_id: string | null
  kind: DeadlineFormValues['kind']
  title: string
  description: string | null
  due_at: string
  priority: DeadlineFormValues['priority']
  completed_at: string | null
}

interface SubjectOption {
  id: string
  name: string
}

const initialValues: DeadlineFormValues = {
  title: '',
  kind: 'exam',
  subjectId: '',
  dueAt: '',
  priority: 'medium',
  description: '',
}
const fieldClass =
  'mt-1.5 h-11 w-full rounded-xl border border-[#dfe5dc] bg-white px-3.5 text-sm outline-none focus:border-[#548067] focus:ring-2 focus:ring-[#548067]/15'

export function DeadlinesPage() {
  const { user } = useAuth()
  const [deadlines, setDeadlines] = useState<Deadline[]>([])
  const [subjects, setSubjects] = useState<SubjectOption[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [error, setError] = useState('')
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<DeadlineFormValues>({
    resolver: zodResolver(deadlineSchema),
    defaultValues: initialValues,
  })

  const loadData = useCallback(async () => {
    if (!supabase || !user) return
    const [deadlineResult, subjectResult] = await Promise.all([
      supabase
        .from('deadlines')
        .select('*')
        .eq('user_id', user.id)
        .order('due_at'),
      supabase
        .from('subjects')
        .select('id, name')
        .eq('user_id', user.id)
        .order('name'),
    ])
    if (deadlineResult.error) setError(deadlineResult.error.message)
    else setDeadlines(deadlineResult.data ?? [])
    if (subjectResult.error) setError(subjectResult.error.message)
    else setSubjects(subjectResult.data ?? [])
    setLoading(false)
  }, [user])

  useEffect(() => {
    // Results are committed after the Supabase requests finish.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadData()
  }, [loadData])

  const onSubmit = handleSubmit(async (values) => {
    if (!supabase || !user) return
    setSaving(true)
    setError('')
    const { error: saveError } = await supabase.from('deadlines').insert({
      user_id: user.id,
      subject_id: values.subjectId || null,
      kind: values.kind,
      title: values.title,
      description: values.description || null,
      due_at: new Date(values.dueAt).toISOString(),
      priority: values.priority,
    })
    setSaving(false)
    if (saveError) {
      setError(saveError.message)
      return
    }
    reset(initialValues)
    setShowForm(false)
    await loadData()
  })

  async function updateCompleted(deadline: Deadline, completed: boolean) {
    if (!supabase) return
    const completedAt = completed ? new Date().toISOString() : null
    const { error: updateError } = await supabase
      .from('deadlines')
      .update({ completed_at: completedAt })
      .eq('id', deadline.id)
    if (updateError) setError(updateError.message)
    else
      setDeadlines((current) =>
        current.map((item) =>
          item.id === deadline.id
            ? { ...item, completed_at: completedAt }
            : item,
        ),
      )
  }

  async function deleteDeadline(id: string) {
    if (!supabase) return
    const { error: deleteError } = await supabase
      .from('deadlines')
      .delete()
      .eq('id', id)
    if (deleteError) setError(deleteError.message)
    else setDeadlines((current) => current.filter((item) => item.id !== id))
  }

  const subjectNames = new Map(
    subjects.map((subject) => [subject.id, subject.name]),
  )
  const pendingDeadlines = deadlines.filter(
    (deadline) => !deadline.completed_at,
  )
  const completedDeadlines = deadlines.filter(
    (deadline) => deadline.completed_at,
  )

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
              Keep the important dates close
            </p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight">
              Exams &amp; deadlines
            </h1>
            <p className="mt-2 text-sm text-[#687369]">
              Track exams, assignments, and projects in one list.
            </p>
          </div>
          <Button
            className="h-10 rounded-full bg-[#214d3c] px-4 text-white hover:bg-[#193d30]"
            onClick={() => setShowForm((open) => !open)}
          >
            <Plus size={17} /> Add deadline
          </Button>
        </div>

        {error && (
          <p
            role="alert"
            className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
          >
            {error}
          </p>
        )}
        {showForm && (
          <form
            className="mt-6 rounded-2xl border border-[#e5e8df] bg-white p-5 sm:p-7"
            onSubmit={onSubmit}
          >
            <h2 className="text-lg font-semibold">New deadline</h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <label className="text-sm font-medium">
                Title
                <input
                  className={fieldClass}
                  {...register('title')}
                  placeholder="e.g. Operating Systems midterm"
                />
                {errors.title && (
                  <span className="mt-1 block text-xs text-red-700">
                    {errors.title.message}
                  </span>
                )}
              </label>
              <label className="text-sm font-medium">
                Type
                <select className={fieldClass} {...register('kind')}>
                  <option value="exam">Exam</option>
                  <option value="assignment">Assignment</option>
                  <option value="project">Project</option>
                  <option value="other">Other</option>
                </select>
              </label>
              <label className="text-sm font-medium">
                Subject
                <select className={fieldClass} {...register('subjectId')}>
                  <option value="">No subject</option>
                  {subjects.map((subject) => (
                    <option key={subject.id} value={subject.id}>
                      {subject.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-sm font-medium">
                Due date and time
                <input
                  className={fieldClass}
                  type="datetime-local"
                  {...register('dueAt')}
                />
                {errors.dueAt && (
                  <span className="mt-1 block text-xs text-red-700">
                    {errors.dueAt.message}
                  </span>
                )}
              </label>
              <label className="text-sm font-medium">
                Priority
                <select className={fieldClass} {...register('priority')}>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </label>
              <label className="text-sm font-medium sm:col-span-2">
                Details
                <textarea
                  className="mt-1.5 min-h-20 w-full rounded-xl border border-[#dfe5dc] bg-white px-3.5 py-3 text-sm outline-none focus:border-[#548067] focus:ring-2 focus:ring-[#548067]/15"
                  {...register('description')}
                />
              </label>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setShowForm(false)
                  reset(initialValues)
                }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={saving}
                className="rounded-full bg-[#214d3c] px-5 text-white hover:bg-[#193d30]"
              >
                {saving && <LoaderCircle className="animate-spin" />} Save
                deadline
              </Button>
            </div>
          </form>
        )}

        {loading ? (
          <p className="mt-10 flex items-center justify-center gap-2 text-sm text-[#758075]">
            <LoaderCircle className="animate-spin" size={17} /> Loading your
            deadlines…
          </p>
        ) : deadlines.length === 0 ? (
          <div className="mt-7 rounded-2xl border border-dashed border-[#d9dfd6] bg-white/70 px-6 py-14 text-center">
            <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-[#f8f0e6] text-[#a0713d]">
              <CalendarClock size={21} />
            </span>
            <h2 className="mt-4 font-semibold">No deadlines yet</h2>
            <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-[#687369]">
              Add your next exam or assignment so it can be included in your
              study plan.
            </p>
            <Button
              className="mt-5 rounded-full bg-[#214d3c] px-5 text-white hover:bg-[#193d30]"
              onClick={() => setShowForm(true)}
            >
              Add a deadline
            </Button>
          </div>
        ) : (
          <div className="mt-7 space-y-8">
            <DeadlineGroup
              title="Coming up"
              deadlines={pendingDeadlines}
              subjectNames={subjectNames}
              onComplete={(item) => void updateCompleted(item, true)}
              onDelete={(id) => void deleteDeadline(id)}
            />
            {completedDeadlines.length > 0 && (
              <DeadlineGroup
                title="Completed"
                deadlines={completedDeadlines}
                subjectNames={subjectNames}
                onComplete={(item) => void updateCompleted(item, false)}
                onDelete={(id) => void deleteDeadline(id)}
              />
            )}
          </div>
        )}
      </div>
    </main>
  )
}

function DeadlineGroup({
  title,
  deadlines,
  subjectNames,
  onComplete,
  onDelete,
}: {
  title: string
  deadlines: Deadline[]
  subjectNames: Map<string, string>
  onComplete: (deadline: Deadline) => void
  onDelete: (id: string) => void
}) {
  return (
    <section>
      <h2 className="mb-3 font-semibold">{title}</h2>
      <div className="space-y-3">
        {deadlines.length === 0 ? (
          <p className="rounded-xl border border-[#e5e8df] bg-white p-4 text-sm text-[#758075]">
            No upcoming deadlines.
          </p>
        ) : (
          deadlines.map((deadline) => {
            return (
              <article
                key={deadline.id}
                className="flex items-start gap-3 rounded-2xl border border-[#e5e8df] bg-white p-4 sm:items-center sm:p-5"
              >
                <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-xl bg-[#f5f7f2] text-[#45654a]">
                  <CalendarClock size={17} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3
                      className={`font-medium ${deadline.completed_at ? 'text-[#899289] line-through' : ''}`}
                    >
                      {deadline.title}
                    </h3>
                    <span className="rounded-full bg-[#f4f5f0] px-2 py-0.5 text-[11px] text-[#657064]">
                      {deadline.kind}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-[#7a847a]">
                    {subjectNames.get(deadline.subject_id ?? '') ??
                      'No subject'}{' '}
                    ·{' '}
                    {new Date(deadline.due_at).toLocaleString(undefined, {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })}{' '}
                    · {deadline.priority} priority
                  </p>
                  {deadline.description && (
                    <p className="mt-2 text-sm text-[#687369]">
                      {deadline.description}
                    </p>
                  )}
                </div>
                <div className="flex shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={
                      deadline.completed_at
                        ? `Reopen ${deadline.title}`
                        : `Complete ${deadline.title}`
                    }
                    onClick={() => onComplete(deadline)}
                  >
                    {deadline.completed_at ? (
                      <CalendarClock size={16} />
                    ) : (
                      <Check size={16} />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Delete ${deadline.title}`}
                    onClick={() => onDelete(deadline.id)}
                    className="text-[#8a5b52] hover:bg-red-50 hover:text-red-700"
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
              </article>
            )
          })
        )}
      </div>
    </section>
  )
}
