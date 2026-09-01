import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { supabase } from '../services/supabase/client.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const activeUserIdRef = useRef(null)
  const profileRequestIdRef = useRef(0)

  const refreshProfile = useCallback(async () => {
    const userId = activeUserIdRef.current
    if (!userId) return null

    const { data, error } = await supabase
      .from('profiles')
      .select('id, student_number, first_name, last_name, email, course, year_level, section, role')
      .eq('auth_user_id', userId)
      .maybeSingle()

    if (error) throw error

    setProfile(data)
    return data
  }, [])

  useEffect(() => {
    let isActive = true

    async function setActiveSession(nextSession) {
      if (!isActive) return

      setSession(nextSession)
      const nextUserId = nextSession?.user?.id ?? null

      if (!nextUserId) {
        activeUserIdRef.current = null
        profileRequestIdRef.current += 1
        setProfile(null)
        setIsLoading(false)
        return
      }

      // Supabase may emit SIGNED_IN or TOKEN_REFRESHED again when a background
      // tab becomes active. Keep the mounted page stable when the user did not
      // actually change instead of replacing it with the route loading screen.
      if (activeUserIdRef.current === nextUserId) return

      activeUserIdRef.current = nextUserId
      const requestId = profileRequestIdRef.current + 1
      profileRequestIdRef.current = requestId
      setIsLoading(true)

      const { data, error } = await supabase
        .from('profiles')
        .select('id, student_number, first_name, last_name, email, course, year_level, section, role')
        .eq('auth_user_id', nextUserId)
        .maybeSingle()

      if (!isActive || requestId !== profileRequestIdRef.current) return

      setProfile(error ? null : data)
      setIsLoading(false)
    }

    supabase.auth.getSession().then(({ data }) => {
      setActiveSession(data.session)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setActiveSession(nextSession)
    })

    return () => {
      isActive = false
      listener.subscription.unsubscribe()
    }
  }, [])

  async function signOut() {
    const { error } = await supabase.auth.signOut()

    if (error) throw error
  }

  const value = useMemo(
    () => ({
      isLoading,
      profile,
      refreshProfile,
      session,
      signOut,
    }),
    [isLoading, profile, refreshProfile, session],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider.')
  }

  return context
}
