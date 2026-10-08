import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'

export function RequireAuth() {
  const { user, loading, configured } = useAuth()
  const location = useLocation()

  if (!configured)
    return <Navigate to="/login" replace state={{ from: location }} />
  if (loading)
    return (
      <main className="grid min-h-screen place-items-center text-sm text-muted-foreground">
        Restoring your session…
      </main>
    )
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />

  return <Outlet />
}
