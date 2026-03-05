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
    try {
      // 1. Busca usuário na nossa tabela personalizada
      const { data, error } = await supabase
        .from('app_users')
        .select('*')
        .eq('username', username)
        .eq('password', password) // Comparação direta para simplicidade
        .single()

      if (error || !data) {
        console.error('Login error:', error)
        return false
      }

      // 2. Salva "sessão" localmente
      const userData = {
        id: data.id,
        username: data.username,
        role: data.role,
        email: data.email
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

  const value = useMemo(() => ({ 
    user, 
    login, 
    logout,
    loading 
  }), [user, loading])

  return <AuthContext.Provider value={value}>{!loading && children}</AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext)
}
