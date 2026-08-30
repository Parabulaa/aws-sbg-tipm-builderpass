import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

export function RequireAuth({ children }) {
  const { isLoading, session } = useAuth()
  const location = useLocation()

  if (isLoading) return <LoadingScreen />

  if (!session) {
    return <Navigate replace state={{ from: location }} to="/login" />
  }

  return children
}

export function RequireAdmin({ children }) {
  const { isLoading, profile, session } = useAuth()

  if (isLoading) return <LoadingScreen />

  if (!session) return <Navigate replace to="/login" />

  if (profile?.role !== 'ADMIN') return <Navigate replace to="/dashboard" />

  return children
}

function LoadingScreen() {
  return (
    <section className="mx-auto max-w-6xl px-5 py-16">
      <p className="text-sm text-slate-600">Checking your session...</p>
    </section>
  )
}
