import { useCallback, useEffect, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft, BookOpen, LoaderCircle, Plus, Trash2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router-dom'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'

const subjectSchema = z.object({
  name: z.string().trim().min(1, 'Enter a subject name.').max(120),
  code: z.string().trim().max(24),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  priority: z.enum(['low', 'medium', 'high', 'critical']),
  examDate: z.string(),
})

type SubjectFormValues = z.infer<typeof subjectSchema>
interface Subject extends SubjectFormValues {
  id: string
  user_id: string
  progress: number
  created_at: string
}

const emptyValues: SubjectFormValues = {
  name: '',
  code: '',
  difficulty: 'medium',
  priority: 'medium',
  examDate: '',
}

const fieldClass =
  'mt-1.5 h-11 w-full rounded-xl border border-[#dfe5dc] bg-white px-3.5 text-sm outline-none focus:border-[#548067] focus:ring-2 focus:ring-[#548067]/15'

export function SubjectsPage() {
  const { user } = useAuth()
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SubjectFormValues>({
    resolver: zodResolver(subjectSchema),
    defaultValues: emptyValues,
  })

  const loadSubjects = useCallback(async () => {
    if (!supabase || !user) return
    const { data, error: loadError } = await supabase
      .from('subjects')
      .select(
        'id, user_id, name, code, difficulty, priority, progress, exam_date, created_at',
      )
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (loadError) setError(loadError.message)
    else {
      setSubjects(
        (data ?? []).map((row) => ({
          ...row,
          code: row.code ?? '',
          examDate: row.exam_date ?? '',
        })),
      )
    }
    setLoading(false)
  }, [user])

  useEffect(() => {
    // The loader updates state only after its Supabase request settles.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadSubjects()
  }, [loadSubjects])

  const onSubmit = handleSubmit(async (values) => {
    if (!supabase || !user) return
    setSaving(true)
    setError('')
    const { error: saveError } = await supabase.from('subjects').insert({
      user_id: user.id,
      name: values.name,
      code: values.code || null,
      difficulty: values.difficulty,
      priority: values.priority,
      exam_date: values.examDate || null,
    })
    setSaving(false)

    if (saveError) {
      setError(saveError.message)
      return
    }

    reset(emptyValues)
    setShowForm(false)
    await loadSubjects()
  })

  async function deleteSubject(id: string) {
    if (!supabase) return
    setError('')
    const { error: deleteError } = await supabase
      .from('subjects')
      .delete()
      .eq('id', id)
    if (deleteError) setError(deleteError.message)
    else
      setSubjects((current) => current.filter((subject) => subject.id !== id))
  }

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
            <p className="text-sm text-[#7a847a]">Your semester</p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight">
              Subjects
            </h1>
            <p className="mt-2 text-sm text-[#687369]">
              Add your courses and keep their deadlines in one place.
            </p>
          </div>
          <Button
            className="h-10 rounded-full bg-[#214d3c] px-4 text-white hover:bg-[#193d30]"
            onClick={() => setShowForm((open) => !open)}
          >
            <Plus size={17} /> Add subject
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
            <h2 className="text-lg font-semibold">New subject</h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <label className="text-sm font-medium">
                Subject name
                <input
                  className={fieldClass}
                  {...register('name')}
                  placeholder="e.g. Data Structures"
                />
                {errors.name && (
                  <span className="mt-1 block text-xs text-red-700">
                    {errors.name.message}
                  </span>
                )}
              </label>
              <label className="text-sm font-medium">
                Course code{' '}
                <input
                  className={fieldClass}
                  {...register('code')}
                  placeholder="e.g. CS201"
                />
              </label>
              <label className="text-sm font-medium">
                Difficulty
                <select className={fieldClass} {...register('difficulty')}>
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
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
                Exam date{' '}
                <input
                  className={fieldClass}
                  type="date"
                  {...register('examDate')}
                />
              </label>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setShowForm(false)
                  reset(emptyValues)
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
                subject
              </Button>
            </div>
          </form>
        )}

        {loading ? (
          <div className="mt-10 flex items-center justify-center gap-2 text-sm text-[#758075]">
            <LoaderCircle className="animate-spin" size={17} /> Loading your
            subjects…
          </div>
        ) : subjects.length === 0 ? (
          <div className="mt-7 rounded-2xl border border-dashed border-[#d9dfd6] bg-white/70 px-6 py-14 text-center">
            <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-[#edf3e8] text-[#416b4c]">
              <BookOpen size={21} />
            </span>
            <h2 className="mt-4 font-semibold">
              Your subjects will show up here
            </h2>
            <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-[#687369]">
              Add your first course to start organizing topics, exams, and your
              study plan.
            </p>
            <Button
              className="mt-5 rounded-full bg-[#214d3c] px-5 text-white hover:bg-[#193d30]"
              onClick={() => setShowForm(true)}
            >
              Add your first subject
            </Button>
          </div>
        ) : (
          <div className="mt-7 grid gap-4 sm:grid-cols-2">
            {subjects.map((subject) => (
              <article
                key={subject.id}
                className="rounded-2xl border border-[#e5e8df] bg-white p-5"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h2 className="truncate font-semibold">{subject.name}</h2>
                    <p className="mt-1 text-xs text-[#778277]">
                      {subject.code || 'No course code'} · {subject.difficulty}{' '}
                      · {subject.priority} priority
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Delete ${subject.name}`}
                    onClick={() => void deleteSubject(subject.id)}
                    className="shrink-0 text-[#8a5b52] hover:bg-red-50 hover:text-red-700"
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
                <div className="mt-5 flex items-center justify-between text-xs text-[#778277]">
                  <span>Progress</span>
                  <span>{subject.progress}%</span>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#e7ece4]">
                  <div
                    className="h-full rounded-full bg-[#548067]"
                    style={{ width: `${subject.progress}%` }}
                  />
                </div>
                {subject.examDate && (
                  <p className="mt-4 text-xs text-[#667467]">
                    Exam:{' '}
                    {new Date(
                      `${subject.examDate}T00:00:00`,
                    ).toLocaleDateString()}
                  </p>
                )}
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
