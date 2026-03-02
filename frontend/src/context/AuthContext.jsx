import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { supabase } from '../services/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check active sessions and sets the user
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session?.user) {
        fetchProfile(session.user.id)
      } else {
        setLoading(false)
      }
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session?.user) {
        fetchProfile(session.user.id)
      } else {
        setUser(null)
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const fetchProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()
      
      if (error && error.code !== 'PGRST116') {
        throw error
      }

      if (data) {
        setUser({ ...data, email: session?.user?.email })
      } else {
        // Fallback if profile doesn't exist yet
        setUser({ id: userId, email: session?.user?.email, role: 'user' })
      }
    } catch (error) {
      console.error('Error fetching profile:', error.message)
    } finally {
      setLoading(false)
    }
  }

  const login = async ({ username, password }) => {
    // Supabase uses email/password by default. 
    // If username is provided, we assume it's an email for this migration, 
    // or we'd need a cloud function to map username->email.
    // For simplicity in this step, let's assume the user inputs email.
    
    // However, the previous system used usernames. 
    // If we want to keep usernames, we need to sign up with metadata.
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email: username, // Temporarily treating username as email
      password,
    })

    if (error) return false
    return true
  }

  const logout = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setSession(null)
  }

  const value = useMemo(() => ({ 
    user, 
    session, 
    login, 
    logout,
    loading 
  }), [user, session, loading])

  return <AuthContext.Provider value={value}>{!loading && children}</AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext)
}
