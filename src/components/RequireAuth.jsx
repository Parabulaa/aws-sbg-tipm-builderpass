import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

export function RequireAuth({ children }) {
  const { isLoading, profile, session } = useAuth()
  const location = useLocation()

  if (isLoading) return <LoadingScreen />

  if (!session) {
    return <Navigate replace state={{ from: location }} to="/login" />
  }

  if (!profile) return <Navigate replace to="/account-recovery" />

  return children
}

export function RequireGuest({ children }) {
  const { isLoading, profile, session } = useAuth()
  const location = useLocation()

  if (isLoading) return <LoadingScreen />

  if (session && !profile) return <Navigate replace to="/account-recovery" />

  if (session && profile) {
    const requestedPath = location.state?.from?.pathname
    const destination = profile.role === 'ADMIN' ? '/admin' : requestedPath || '/dashboard'
    return <Navigate replace to={destination} />
  }

  return children
}

export function RequireAdmin({ children }) {
  const { isLoading, profile, session } = useAuth()

  if (isLoading) return <LoadingScreen />

  if (!session) return <Navigate replace to="/login" />

  if (!profile) return <Navigate replace to="/account-recovery" />

  if (profile?.role !== 'ADMIN') return <Navigate replace to="/dashboard" />

  return children
}

export function RequireOfficer({ children }) {
  const { isLoading, profile, session } = useAuth()

  if (isLoading) return <LoadingScreen />

  if (!session) return <Navigate replace to="/login" />

  if (!profile) return <Navigate replace to="/account-recovery" />

  if (!['OFFICER', 'ADMIN'].includes(profile?.role)) {
    return <Navigate replace to="/dashboard" />
  }

  return children
}

function LoadingScreen() {
  return (
    <section className="mx-auto max-w-6xl px-5 py-16">
      <p className="text-sm text-slate-600">Checking your session...</p>
    </section>
  )
}
