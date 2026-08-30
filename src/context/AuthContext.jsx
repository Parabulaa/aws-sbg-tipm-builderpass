import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { supabase } from '../services/supabase/client.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let isActive = true

    async function setActiveSession(nextSession) {
      if (!isActive) return

      setIsLoading(true)
      setSession(nextSession)

      if (!nextSession) {
        setProfile(null)
        setIsLoading(false)
        return
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, role')
        .eq('auth_user_id', nextSession.user.id)
        .maybeSingle()

      if (!isActive) return

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
      session,
      signOut,
    }),
    [isLoading, profile, session],
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
