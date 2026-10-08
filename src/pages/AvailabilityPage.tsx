import { useCallback, useEffect, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft, Clock3, LoaderCircle, Plus, Trash2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router-dom'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'

const availabilitySchema = z
  .object({
    weekday: z.number().int().min(0).max(6),
    startsAt: z.string().regex(/^\d{2}:\d{2}$/),
    endsAt: z.string().regex(/^\d{2}:\d{2}$/),
  })
  .refine((values) => values.startsAt < values.endsAt, {
    path: ['endsAt'],
    message: 'End time must be after start time.',
  })

type AvailabilityFormValues = z.infer<typeof availabilitySchema>
interface AvailabilityBlock {
  id: string
  user_id: string
  weekday: number
  starts_at: string
  ends_at: string
}

const weekdays = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
]
const initialValues: AvailabilityFormValues = {
  weekday: 1,
  startsAt: '16:00',
  endsAt: '18:00',
}
const inputClass =
  'mt-1.5 h-11 w-full rounded-xl border border-[#dfe5dc] bg-white px-3.5 text-sm outline-none focus:border-[#548067] focus:ring-2 focus:ring-[#548067]/15'

export function AvailabilityPage() {
  const { user } = useAuth()
  const [blocks, setBlocks] = useState<AvailabilityBlock[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AvailabilityFormValues>({
    resolver: zodResolver(availabilitySchema),
    defaultValues: initialValues,
  })

  const loadBlocks = useCallback(async () => {
    if (!supabase || !user) return
    const { data, error: loadError } = await supabase
      .from('availability')
      .select('*')
      .eq('user_id', user.id)
      .order('weekday')
      .order('starts_at')
    if (loadError) setError(loadError.message)
    else setBlocks(data ?? [])
    setLoading(false)
  }, [user])

  useEffect(() => {
    // Results are committed after the Supabase request finishes.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadBlocks()
  }, [loadBlocks])

  const onSubmit = handleSubmit(async (values) => {
    if (!supabase || !user) return
    const overlaps = blocks.some(
      (block) =>
        block.weekday === values.weekday &&
        values.startsAt < block.ends_at &&
        values.endsAt > block.starts_at,
    )
    if (overlaps) {
      setError('This time overlaps another study window on that day.')
      return
    }

    setSaving(true)
    setError('')
    const { error: saveError } = await supabase.from('availability').insert({
      user_id: user.id,
      weekday: values.weekday,
      starts_at: values.startsAt,
      ends_at: values.endsAt,
    })
    setSaving(false)
    if (saveError) {
      setError(saveError.message)
      return
    }
    reset(initialValues)
    await loadBlocks()
  })

  async function deleteBlock(id: string) {
    if (!supabase) return
    const { error: deleteError } = await supabase
      .from('availability')
      .delete()
      .eq('id', id)
    if (deleteError) setError(deleteError.message)
    else setBlocks((current) => current.filter((block) => block.id !== id))
  }

  const groupedBlocks = weekdays.map((name, weekday) => ({
    name,
    weekday,
    blocks: blocks.filter((block) => block.weekday === weekday),
  }))

  return (
    <main className="min-h-screen bg-[#f8f8f4] px-5 py-8 sm:px-10">
      <div className="mx-auto max-w-4xl">
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 text-sm text-[#758075] hover:text-[#214d3c]"
        >
          <ArrowLeft size={16} /> Back to dashboard
        </Link>
        <div className="mt-8">
          <p className="text-sm text-[#7a847a]">
            Build a plan that fits your week
          </p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">
            Study availability
          </h1>
          <p className="mt-2 text-sm leading-6 text-[#687369]">
            Add the recurring time windows when you can study. Times use your
            device’s local timezone.
          </p>
        </div>

        {error && (
          <p
            role="alert"
            className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
          >
            {error}
          </p>
        )}

        <form
          className="mt-7 rounded-2xl border border-[#e5e8df] bg-white p-5 sm:p-7"
          onSubmit={onSubmit}
        >
          <h2 className="font-semibold">Add a weekly time window</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-[1fr_1fr_1fr_auto] sm:items-end">
            <label className="text-sm font-medium">
              Day
              <select
                className={inputClass}
                {...register('weekday', { valueAsNumber: true })}
              >
                {weekdays.map((day, index) => (
                  <option key={day} value={index}>
                    {day}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm font-medium">
              From
              <input
                className={inputClass}
                type="time"
                {...register('startsAt')}
              />
            </label>
            <label className="text-sm font-medium">
              Until
              <input
                className={inputClass}
                type="time"
                {...register('endsAt')}
              />
              {errors.endsAt && (
                <span className="mt-1 block text-xs text-red-700">
                  {errors.endsAt.message}
                </span>
              )}
            </label>
            <Button
              type="submit"
              disabled={saving}
              className="h-11 rounded-full bg-[#214d3c] px-5 text-white hover:bg-[#193d30]"
            >
              {saving ? (
                <LoaderCircle className="animate-spin" />
              ) : (
                <Plus size={17} />
              )}{' '}
              Add time
            </Button>
          </div>
        </form>

        {loading ? (
          <p className="mt-8 flex items-center justify-center gap-2 text-sm text-[#758075]">
            <LoaderCircle className="animate-spin" size={17} /> Loading your
            availability…
          </p>
        ) : blocks.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-dashed border-[#d9dfd6] bg-white/70 px-6 py-12 text-center">
            <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-[#edf3e8] text-[#416b4c]">
              <Clock3 size={21} />
            </span>
            <h2 className="mt-4 font-semibold">No study windows added</h2>
            <p className="mt-2 text-sm text-[#687369]">
              Add when you’re usually free so the planner can find suitable
              study times.
            </p>
          </div>
        ) : (
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {groupedBlocks
              .filter((group) => group.blocks.length > 0)
              .map((group) => (
                <section
                  key={group.weekday}
                  className="rounded-2xl border border-[#e5e8df] bg-white p-5"
                >
                  <h2 className="font-semibold">{group.name}</h2>
                  <ul className="mt-3 space-y-2">
                    {group.blocks.map((block) => (
                      <li
                        key={block.id}
                        className="flex items-center justify-between rounded-xl bg-[#f7f8f4] px-3.5 py-2.5 text-sm"
                      >
                        <span>
                          {block.starts_at.slice(0, 5)}–
                          {block.ends_at.slice(0, 5)}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={`Remove ${group.name} ${block.starts_at} availability`}
                          className="size-8 text-[#8a5b52] hover:bg-red-50 hover:text-red-700"
                          onClick={() => void deleteBlock(block.id)}
                        >
                          <Trash2 size={15} />
                        </Button>
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
          </div>
        )}
      </div>
    </main>
  )
}
