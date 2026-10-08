import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft, BookOpenCheck, LoaderCircle } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'

const authSchema = z.object({
  fullName: z.string(),
  email: z.email('Enter a valid email address.'),
  password: z.string().min(8, 'Use at least 8 characters.'),
  confirmPassword: z.string(),
})

type AuthValues = z.infer<typeof authSchema>

interface AuthPageProps {
  mode: 'login' | 'register'
}

export function AuthPage({ mode }: AuthPageProps) {
  const isRegister = mode === 'register'
  const { user, configured } = useAuth()
  const navigate = useNavigate()
  const [submitError, setSubmitError] = useState('')
  const [confirmationMessage, setConfirmationMessage] = useState('')
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AuthValues>({
    resolver: zodResolver(
      authSchema.superRefine((values, context) => {
        if (isRegister && values.fullName.trim().length < 2) {
          context.addIssue({
            code: 'custom',
            path: ['fullName'],
            message: 'Enter your name.',
          })
        }
        if (isRegister && values.confirmPassword !== values.password) {
          context.addIssue({
            code: 'custom',
            path: ['confirmPassword'],
            message: 'Passwords do not match.',
          })
        }
      }),
    ),
    defaultValues: {
      fullName: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  })

  if (user) return <Navigate to="/dashboard" replace />

  const onSubmit = handleSubmit(async (values) => {
    setSubmitError('')
    setConfirmationMessage('')
    if (!supabase) return

    const result = isRegister
      ? await supabase.auth.signUp({
          email: values.email,
          password: values.password,
          options: { data: { full_name: values.fullName.trim() } },
        })
      : await supabase.auth.signInWithPassword({
          email: values.email,
          password: values.password,
        })

    if (result.error) {
      setSubmitError(result.error.message)
      return
    }

    if (isRegister && !result.data.session) {
      setConfirmationMessage(
        'Check your email for a confirmation link, then come back to log in.',
      )
      return
    }

    navigate('/dashboard', { replace: true })
  })

  return (
    <main className="grid min-h-screen bg-[#f8f8f4] lg:grid-cols-[1fr_0.9fr]">
      <section className="flex min-h-screen flex-col px-6 py-6 sm:px-10 lg:px-16">
        <Link
          to="/"
          className="flex w-fit items-center gap-2.5 font-semibold tracking-tight text-[#26352a]"
        >
          <span className="grid size-9 place-items-center rounded-xl bg-[#214d3c] text-white">
            <BookOpenCheck size={19} />
          </span>
          studywise
        </Link>
        <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-12">
          <Link
            to="/"
            className="mb-8 inline-flex w-fit items-center gap-2 text-sm text-[#758075] hover:text-[#214d3c]"
          >
            <ArrowLeft size={16} /> Back to home
          </Link>
          <p className="text-xs font-semibold tracking-[0.16em] text-[#548067] uppercase">
            {isRegister ? 'Start your semester fresh' : 'Welcome back'}
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-[#20271f]">
            {isRegister ? 'Create your account' : 'Log in to Studywise'}
          </h1>
          <p className="mt-2 text-sm leading-6 text-[#6c776d]">
            {isRegister
              ? 'Set up your account and bring your study plans together.'
              : 'Pick up where you left off and see what’s next.'}
          </p>

          {!configured && (
            <div
              role="status"
              className="mt-6 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm leading-6 text-amber-950"
            >
              Authentication needs Supabase configuration. Add{' '}
              <code>VITE_SUPABASE_URL</code> and{' '}
              <code>VITE_SUPABASE_ANON_KEY</code> to a local <code>.env</code>{' '}
              file, then restart the dev server.
            </div>
          )}

          <form className="mt-8 space-y-4" onSubmit={onSubmit} noValidate>
            {isRegister && (
              <Field label="Full name" error={errors.fullName?.message}>
                <input
                  autoComplete="name"
                  className={inputClass}
                  {...register('fullName')}
                />
              </Field>
            )}
            <Field label="Email address" error={errors.email?.message}>
              <input
                type="email"
                autoComplete="email"
                className={inputClass}
                {...register('email')}
              />
            </Field>
            <Field label="Password" error={errors.password?.message}>
              <input
                type="password"
                autoComplete={isRegister ? 'new-password' : 'current-password'}
                className={inputClass}
                {...register('password')}
              />
            </Field>
            {isRegister && (
              <Field
                label="Confirm password"
                error={errors.confirmPassword?.message}
              >
                <input
                  type="password"
                  autoComplete="new-password"
                  className={inputClass}
                  {...register('confirmPassword')}
                />
              </Field>
            )}
            {submitError && (
              <p
                role="alert"
                className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800"
              >
                {submitError}
              </p>
            )}
            {confirmationMessage && (
              <p
                role="status"
                className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-900"
              >
                {confirmationMessage}
              </p>
            )}
            <Button
              type="submit"
              disabled={!configured || isSubmitting}
              className="h-11 w-full rounded-full bg-[#214d3c] text-white hover:bg-[#193d30] disabled:opacity-50"
            >
              {isSubmitting && <LoaderCircle className="animate-spin" />}
              {isRegister ? 'Create account' : 'Log in'}
            </Button>
          </form>
          <p className="mt-6 text-center text-sm text-[#6c776d]">
            {isRegister ? 'Already have an account? ' : 'New to Studywise? '}
            <Link
              className="font-semibold text-[#315b48] hover:underline"
              to={isRegister ? '/login' : '/register'}
            >
              {isRegister ? 'Log in' : 'Create an account'}
            </Link>
          </p>
        </div>
        <p className="text-center text-xs text-[#929b91]">
          Your study data stays connected to your account.
        </p>
      </section>
      <aside className="relative hidden overflow-hidden bg-[#214d3c] p-12 text-white lg:flex lg:flex-col lg:justify-end">
        <div className="absolute -right-24 -top-20 size-[30rem] rounded-full border border-white/10" />
        <div className="absolute -right-4 -top-1 size-[25rem] rounded-full border border-white/10" />
        <div className="relative mb-12 max-w-lg">
          <span className="text-sm font-medium text-[#bfd4c1]">
            A little more focus. A lot less overwhelm.
          </span>
          <p className="mt-5 text-4xl leading-tight font-medium tracking-tight">
            “Small, steady study sessions make the biggest difference.”
          </p>
          <p className="mt-5 text-sm text-[#c9d9cb]">
            Studywise helps you find a rhythm that works for your week.
          </p>
        </div>
      </aside>
    </main>
  )
}

const inputClass =
  'mt-1.5 h-11 w-full rounded-xl border border-[#dfe5dc] bg-white px-3.5 text-sm outline-none transition focus:border-[#548067] focus:ring-2 focus:ring-[#548067]/15'

function Field({
  label,
  error,
  children,
}: {
  label: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <label className="block text-sm font-medium text-[#364338]">
      {label}
      {children}
      {error && (
        <span className="mt-1 block text-xs font-normal text-red-700">
          {error}
        </span>
      )}
    </label>
  )
}
