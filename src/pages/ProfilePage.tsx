import { useEffect, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft, LoaderCircle, Save } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router-dom'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'

const profileSchema = z.object({
  fullName: z.string().trim().min(2, 'Enter your name.').max(120),
  course: z.string().max(120),
  university: z.string().max(160),
  semester: z.string().max(40),
  academicYear: z.string().max(40),
  preferredStudyTime: z.enum(['flexible', 'morning', 'afternoon', 'evening']),
  dailyStudyHours: z.number().min(0.5).max(16),
  studyPreference: z.string().max(500),
})

type ProfileFormValues = z.infer<typeof profileSchema>

const initialValues: ProfileFormValues = {
  fullName: '',
  course: '',
  university: '',
  semester: '',
  academicYear: '',
  preferredStudyTime: 'flexible',
  dailyStudyHours: 2,
  studyPreference: '',
}

const inputClass =
  'mt-1.5 h-11 w-full rounded-xl border border-[#dfe5dc] bg-white px-3.5 text-sm outline-none focus:border-[#548067] focus:ring-2 focus:ring-[#548067]/15'

export function ProfilePage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: initialValues,
  })

  useEffect(() => {
    if (!supabase || !user) return
    let active = true

    void supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle()
      .then(({ data, error: loadError }) => {
        if (!active) return
        if (loadError) setError(loadError.message)
        else if (data) {
          reset({
            fullName: data.full_name,
            course: data.course ?? '',
            university: data.university ?? '',
            semester: data.semester ?? '',
            academicYear: data.academic_year ?? '',
            preferredStudyTime: data.preferred_study_time ?? 'flexible',
            dailyStudyHours: Number(data.daily_study_hours),
            studyPreference: data.study_preference ?? '',
          })
        }
        setLoading(false)
      })

    return () => {
      active = false
    }
  }, [reset, user])

  const onSubmit = handleSubmit(async (values) => {
    if (!supabase || !user) return
    setSaving(true)
    setError('')
    setMessage('')
    const { error: profileError } = await supabase.from('profiles').upsert({
      id: user.id,
      full_name: values.fullName,
      course: values.course || null,
      university: values.university || null,
      semester: values.semester || null,
      academic_year: values.academicYear || null,
      preferred_study_time: values.preferredStudyTime,
      daily_study_hours: values.dailyStudyHours,
      study_preference: values.studyPreference || null,
    })
    if (profileError) {
      setError(profileError.message)
      setSaving(false)
      return
    }

    const { error: metadataError } = await supabase.auth.updateUser({
      data: { full_name: values.fullName },
    })
    setSaving(false)
    if (metadataError)
      setError(
        `Profile saved, but the account name could not be synchronized: ${metadataError.message}`,
      )
    else setMessage('Your profile has been saved.')
  })

  return (
    <main className="min-h-screen bg-[#f8f8f4] px-5 py-8 sm:px-10">
      <div className="mx-auto max-w-3xl">
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 text-sm text-[#758075] hover:text-[#214d3c]"
        >
          <ArrowLeft size={16} /> Back to dashboard
        </Link>
        <section className="mt-8 rounded-2xl border border-[#e5e8df] bg-white p-5 sm:p-8">
          <p className="text-sm text-[#7a847a]">Make the plan yours</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">
            Your profile
          </h1>
          <p className="mt-2 text-sm leading-6 text-[#687369]">
            These details help shape study sessions around your course and daily
            routine.
          </p>
          {error && (
            <p
              role="alert"
              className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
            >
              {error}
            </p>
          )}
          {message && (
            <p
              role="status"
              className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900"
            >
              {message}
            </p>
          )}
          {loading ? (
            <p className="mt-8 flex items-center gap-2 text-sm text-[#758075]">
              <LoaderCircle className="animate-spin" size={16} /> Loading your
              profile…
            </p>
          ) : (
            <form
              className="mt-7 grid gap-4 sm:grid-cols-2"
              onSubmit={onSubmit}
            >
              <label className="text-sm font-medium">
                Full name
                <input
                  className={inputClass}
                  autoComplete="name"
                  {...register('fullName')}
                />
                {errors.fullName && (
                  <span className="mt-1 block text-xs text-red-700">
                    {errors.fullName.message}
                  </span>
                )}
              </label>
              <label className="text-sm font-medium">
                Course
                <input
                  className={inputClass}
                  {...register('course')}
                  placeholder="e.g. B.Tech Computer Science"
                />
              </label>
              <label className="text-sm font-medium">
                University
                <input className={inputClass} {...register('university')} />
              </label>
              <label className="text-sm font-medium">
                Semester
                <input
                  className={inputClass}
                  {...register('semester')}
                  placeholder="e.g. Semester 5"
                />
              </label>
              <label className="text-sm font-medium">
                Academic year
                <input
                  className={inputClass}
                  {...register('academicYear')}
                  placeholder="e.g. 2026–27"
                />
              </label>
              <label className="text-sm font-medium">
                Preferred study time
                <select
                  className={inputClass}
                  {...register('preferredStudyTime')}
                >
                  <option value="flexible">Flexible</option>
                  <option value="morning">Morning</option>
                  <option value="afternoon">Afternoon</option>
                  <option value="evening">Evening</option>
                </select>
              </label>
              <label className="text-sm font-medium">
                Daily study hours
                <input
                  className={inputClass}
                  type="number"
                  min="0.5"
                  max="16"
                  step="0.5"
                  {...register('dailyStudyHours', { valueAsNumber: true })}
                />
                {errors.dailyStudyHours && (
                  <span className="mt-1 block text-xs text-red-700">
                    Choose between 0.5 and 16 hours.
                  </span>
                )}
              </label>
              <label className="text-sm font-medium sm:col-span-2">
                Study preferences
                <textarea
                  className="mt-1.5 min-h-24 w-full rounded-xl border border-[#dfe5dc] bg-white px-3.5 py-3 text-sm outline-none focus:border-[#548067] focus:ring-2 focus:ring-[#548067]/15"
                  {...register('studyPreference')}
                  placeholder="Anything that helps you study well?"
                />
              </label>
              <div className="sm:col-span-2 sm:flex sm:justify-end">
                <Button
                  type="submit"
                  disabled={saving}
                  className="h-11 w-full rounded-full bg-[#214d3c] px-6 text-white hover:bg-[#193d30] sm:w-auto"
                >
                  {saving ? (
                    <LoaderCircle className="animate-spin" />
                  ) : (
                    <Save size={16} />
                  )}{' '}
                  Save profile
                </Button>
              </div>
            </form>
          )}
        </section>
      </div>
    </main>
  )
}
