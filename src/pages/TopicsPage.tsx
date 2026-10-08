import { useCallback, useEffect, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  ArrowLeft,
  BookOpenCheck,
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

const topicSchema = z.object({
  subjectId: z.string().min(1, 'Choose a subject.'),
  title: z.string().trim().min(1, 'Enter a topic name.').max(160),
  estimatedMinutes: z.number().int().min(5).max(1440),
})
type TopicFormValues = z.infer<typeof topicSchema>

interface Topic {
  id: string
  subject_id: string
  title: string
  status: 'not_started' | 'in_progress' | 'completed'
  estimated_minutes: number
  mastery: number
}
interface SubjectOption {
  id: string
  name: string
}

const initialValues: TopicFormValues = {
  subjectId: '',
  title: '',
  estimatedMinutes: 45,
}
const fieldClass =
  'mt-1.5 h-11 w-full rounded-xl border border-[#dfe5dc] bg-white px-3.5 text-sm outline-none focus:border-[#548067] focus:ring-2 focus:ring-[#548067]/15'

export function TopicsPage() {
  const { user } = useAuth()
  const [topics, setTopics] = useState<Topic[]>([])
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
  } = useForm<TopicFormValues>({
    resolver: zodResolver(topicSchema),
    defaultValues: initialValues,
  })

  const loadData = useCallback(async () => {
    if (!supabase || !user) return
    const [topicResult, subjectResult] = await Promise.all([
      supabase
        .from('topics')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false }),
      supabase
        .from('subjects')
        .select('id, name')
        .eq('user_id', user.id)
        .order('name'),
    ])
    if (topicResult.error) setError(topicResult.error.message)
    else setTopics(topicResult.data ?? [])
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
    const { error: saveError } = await supabase.from('topics').insert({
      user_id: user.id,
      subject_id: values.subjectId,
      title: values.title,
      estimated_minutes: values.estimatedMinutes,
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

  async function setTopicStatus(topic: Topic, status: Topic['status']) {
    if (!supabase) return
    const mastery =
      status === 'completed'
        ? 100
        : status === 'in_progress'
          ? Math.max(topic.mastery, 25)
          : 0
    const { error: updateError } = await supabase
      .from('topics')
      .update({ status, mastery })
      .eq('id', topic.id)
    if (updateError) setError(updateError.message)
    else
      setTopics((current) =>
        current.map((item) =>
          item.id === topic.id ? { ...item, status, mastery } : item,
        ),
      )
  }

  async function deleteTopic(id: string) {
    if (!supabase) return
    const { error: deleteError } = await supabase
      .from('topics')
      .delete()
      .eq('id', id)
    if (deleteError) setError(deleteError.message)
    else setTopics((current) => current.filter((topic) => topic.id !== id))
  }

  const canAddTopic = subjects.length > 0

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
              Break courses into manageable parts
            </p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight">
              Topics
            </h1>
            <p className="mt-2 text-sm text-[#687369]">
              Track syllabus topics and mark what you’ve covered.
            </p>
          </div>
          <Button
            disabled={!canAddTopic}
            className="h-10 rounded-full bg-[#214d3c] px-4 text-white hover:bg-[#193d30]"
            onClick={() => setShowForm((open) => !open)}
          >
            <Plus size={17} /> Add topic
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
            <h2 className="text-lg font-semibold">New topic</h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <label className="text-sm font-medium sm:col-span-2">
                Subject
                <select className={fieldClass} {...register('subjectId')}>
                  <option value="">Choose a subject</option>
                  {subjects.map((subject) => (
                    <option key={subject.id} value={subject.id}>
                      {subject.name}
                    </option>
                  ))}
                </select>
                {errors.subjectId && (
                  <span className="mt-1 block text-xs text-red-700">
                    {errors.subjectId.message}
                  </span>
                )}
              </label>
              <label className="text-sm font-medium">
                Topic
                <input
                  className={fieldClass}
                  {...register('title')}
                  placeholder="e.g. Binary search trees"
                />
                {errors.title && (
                  <span className="mt-1 block text-xs text-red-700">
                    {errors.title.message}
                  </span>
                )}
              </label>
              <label className="text-sm font-medium">
                Estimated study time (minutes)
                <input
                  className={fieldClass}
                  type="number"
                  min="5"
                  max="1440"
                  step="5"
                  {...register('estimatedMinutes', { valueAsNumber: true })}
                />
                {errors.estimatedMinutes && (
                  <span className="mt-1 block text-xs text-red-700">
                    Choose 5 to 1440 minutes.
                  </span>
                )}
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
                {saving && <LoaderCircle className="animate-spin" />} Save topic
              </Button>
            </div>
          </form>
        )}

        {loading ? (
          <p className="mt-10 flex items-center justify-center gap-2 text-sm text-[#758075]">
            <LoaderCircle className="animate-spin" size={17} /> Loading topics…
          </p>
        ) : topics.length === 0 ? (
          <div className="mt-7 rounded-2xl border border-dashed border-[#d9dfd6] bg-white/70 px-6 py-14 text-center">
            <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-[#edf3e8] text-[#416b4c]">
              <BookOpenCheck size={21} />
            </span>
            <h2 className="mt-4 font-semibold">
              Your topics will show up here
            </h2>
            <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-[#687369]">
              Add a subject first, then break its syllabus into topics you can
              track.
            </p>
            <Button
              asChild
              className="mt-5 rounded-full bg-[#214d3c] px-5 text-white hover:bg-[#193d30]"
            >
              <Link to="/subjects">Manage subjects</Link>
            </Button>
          </div>
        ) : (
          <div className="mt-7 space-y-8">
            {subjects.map((subject) => {
              const subjectTopics = topics.filter(
                (topic) => topic.subject_id === subject.id,
              )
              if (subjectTopics.length === 0) return null
              const completedCount = subjectTopics.filter(
                (topic) => topic.status === 'completed',
              ).length
              return (
                <section key={subject.id}>
                  <div className="mb-3 flex items-center justify-between gap-4">
                    <h2 className="font-semibold">{subject.name}</h2>
                    <span className="text-xs text-[#7a847a]">
                      {completedCount} of {subjectTopics.length} complete
                    </span>
                  </div>
                  <div className="space-y-3">
                    {subjectTopics.map((topic) => (
                      <article
                        key={topic.id}
                        className="flex items-start gap-3 rounded-2xl border border-[#e5e8df] bg-white p-4 sm:items-center sm:p-5"
                      >
                        <span
                          className={`mt-0.5 grid size-9 shrink-0 place-items-center rounded-xl ${topic.status === 'completed' ? 'bg-[#edf3e8] text-[#416b4c]' : 'bg-[#f5f7f2] text-[#7a847a]'}`}
                        >
                          {topic.status === 'completed' ? (
                            <Check size={17} />
                          ) : (
                            <BookOpenCheck size={17} />
                          )}
                        </span>
                        <div className="min-w-0 flex-1">
                          <h3
                            className={`font-medium ${topic.status === 'completed' ? 'text-[#899289] line-through' : ''}`}
                          >
                            {topic.title}
                          </h3>
                          <p className="mt-1 text-xs text-[#7a847a]">
                            {topic.estimated_minutes} min ·{' '}
                            {topic.status.replace('_', ' ')} · {topic.mastery}%
                            mastery
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          className="h-8 shrink-0 rounded-full px-3 text-xs"
                          onClick={() =>
                            void setTopicStatus(
                              topic,
                              topic.status === 'not_started'
                                ? 'in_progress'
                                : topic.status === 'in_progress'
                                  ? 'completed'
                                  : 'not_started',
                            )
                          }
                        >
                          {topic.status === 'not_started'
                            ? 'Start'
                            : topic.status === 'in_progress'
                              ? 'Complete'
                              : 'Reopen'}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={`Delete ${topic.title}`}
                          onClick={() => void deleteTopic(topic.id)}
                          className="shrink-0 text-[#8a5b52] hover:bg-red-50 hover:text-red-700"
                        >
                          <Trash2 size={16} />
                        </Button>
                      </article>
                    ))}
                  </div>
                </section>
              )
            })}
          </div>
        )}
        {!canAddTopic && !loading && (
          <p className="mt-5 text-center text-sm text-[#687369]">
            Create a subject before adding a topic.
          </p>
        )}
      </div>
    </main>
  )
}
