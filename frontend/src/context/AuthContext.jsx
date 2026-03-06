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

    // Listen for custom event to force user update
    const handleUserUpdate = (event) => {
      const updatedUser = event.detail
      setUser(prev => {
        const newState = { ...prev, ...updatedUser }
        localStorage.setItem('app_session', JSON.stringify(newState))
        return newState
      })
    }

    window.addEventListener('auth:update-user', handleUserUpdate)
    return () => window.removeEventListener('auth:update-user', handleUserUpdate)
  }, [])

  const login = async ({ username, password }) => {
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
    // Dispatch custom event to ensure all listeners update
    const event = new CustomEvent('auth:update-user', { detail: newData })
    window.dispatchEvent(event)
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
