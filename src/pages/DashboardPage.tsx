import { BookOpen, LogOut, UserRound } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'

export function DashboardPage() {
  const { user } = useAuth()
  const navigate = useNavigate()

  async function handleSignOut() {
    if (!supabase) return
    const { error } = await supabase.auth.signOut()
    if (error) console.error('Could not sign out:', error.message)
    else navigate('/', { replace: true })
  }

  return (
    <main className="min-h-screen bg-[#f8f8f4] px-5 py-8 sm:px-10">
      <div className="mx-auto flex max-w-5xl items-center justify-between">
        <p className="font-semibold tracking-tight text-[#214d3c]">studywise</p>
        <Button
          variant="outline"
          className="gap-2 rounded-full"
          onClick={handleSignOut}
        >
          <LogOut size={16} /> Log out
        </Button>
      </div>
      <section className="mx-auto mt-16 max-w-5xl rounded-3xl border border-[#e5e8df] bg-white p-8 sm:p-12">
        <p className="text-sm text-[#7a847a]">Your study space</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">
          Welcome
          {user?.user_metadata.full_name
            ? `, ${user.user_metadata.full_name}`
            : ''}
          .
        </h1>
        <p className="mt-4 max-w-xl leading-7 text-[#687369]">
          Your account is connected. Subject tracking and personalized plans
          will appear here as the next features are built.
        </p>
        <div className="mt-7 flex flex-wrap gap-3">
          <Button
            asChild
            className="rounded-full bg-[#214d3c] text-white hover:bg-[#193d30]"
          >
            <Link to="/subjects">
              <BookOpen size={16} /> Manage subjects
            </Link>
          </Button>
          <Button asChild variant="outline" className="rounded-full">
            <Link to="/profile">
              <UserRound size={16} /> Edit profile
            </Link>
          </Button>
        </div>
      </section>
    </main>
  )
}
