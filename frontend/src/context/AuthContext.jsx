import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { supabase } from '../services/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check local storage for existing session
    const savedUser = localStorage.getItem('app_session')
    if (savedUser) {
      setUser(JSON.parse(savedUser))
    }
    setLoading(false)
  }, [])

  const login = async ({ username, password }) => {
    // Fallback/Dev Login
    if (username === 'admin' && password === 'admin') {
      const devUser = {
        id: 'dev-admin',
        username: 'admin',
        role: 'admin',
        email: 'admin@sistema.com',
        avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix'
      }
      setUser(devUser)
      localStorage.setItem('app_session', JSON.stringify(devUser))
      return true
    }

    try {
      const { data, error } = await supabase
        .from('app_users')
        .select('*')
        .eq('username', username)
        .eq('password', password)
        .single()

      if (error || !data) {
        console.error('Login error:', error)
        return false
      }

      const userData = {
        id: data.id,
        username: data.username,
        role: data.role,
        email: data.email,
        avatar_url: data.avatar_url
      }
      
      setUser(userData)
      localStorage.setItem('app_session', JSON.stringify(userData))
      return true
    } catch (err) {
      console.error('Login exception:', err)
      return false
    }
  }

  const logout = async () => {
    setUser(null)
    localStorage.removeItem('app_session')
  }

  const updateUser = (newData) => {
    setUser(prev => {
      if (!prev) return null
      const updated = { ...prev, ...newData }
      localStorage.setItem('app_session', JSON.stringify(updated))
      return updated
    })
  }

  const value = useMemo(() => ({ 
    user, 
    login, 
    logout,
    updateUser,
    loading 
  }), [user, loading])

  return <AuthContext.Provider value={value}>{!loading && children}</AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext)
}
