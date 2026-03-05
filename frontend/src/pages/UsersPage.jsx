import { useState, useEffect } from 'react'
import { supabase } from '../services/supabase'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { createClient } from '@supabase/supabase-js'

export default function UsersPage() {
  const { user } = useAuth()
  const { addToast } = useToast()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [newUser, setNewUser] = useState({ email: '', password: '', username: '', role: 'user' })
  const [creating, setCreating] = useState(false)
  const [showForm, setShowForm] = useState(false)

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) throw error
      setUsers(data || [])
    } catch (err) {
      console.error('Error fetching users:', err)
      addToast('Erro ao carregar usuários', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateUser = async (e) => {
    e.preventDefault()
    setCreating(true)

    try {
      // Create a temporary client to sign up the user without logging out the admin
      const tempSupabase = createClient(
        import.meta.env.VITE_SUPABASE_URL,
        import.meta.env.VITE_SUPABASE_ANON_KEY,
        {
          auth: {
            persistSession: false,
            autoRefreshToken: false,
            detectSessionInUrl: false
          }
        }
      )

      // 1. Sign up the user in Supabase Auth
      const { data: authData, error: authError } = await tempSupabase.auth.signUp({
        email: newUser.email,
        password: newUser.password,
        options: {
          data: {
            username: newUser.username,
            role: newUser.role
          }
        }
      })

      if (authError) throw authError

      if (authData.user) {
        // Manually insert profile if trigger didn't catch it (redundancy)
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', authData.user.id)
          .single()

        if (!existingProfile) {
          await supabase.from('profiles').insert([
            {
              id: authData.user.id,
              username: newUser.username,
              role: newUser.role,
              created_at: new Date().toISOString()
            }
          ])
        }

        addToast(`Usuário ${newUser.username} criado com sucesso!`)
        setNewUser({ email: '', password: '', username: '', role: 'user' })
        setShowForm(false)
        fetchUsers()
      }
    } catch (err) {
      console.error('Error creating user:', err)
      addToast(err.message || 'Erro ao criar usuário', 'error')
    } finally {
      setCreating(false)
    }
  }

  const handleDeleteUser = async (userId) => {
    if (!confirm('Tem certeza que deseja remover este usuário do sistema?')) return

    try {
        const { error } = await supabase
            .from('profiles')
            .delete()
            .eq('id', userId)
        
        if (error) throw error
        
        setUsers(users.filter(u => u.id !== userId))
        addToast('Usuário removido com sucesso')
    } catch (err) {
        addToast('Erro ao remover usuário: ' + err.message, 'error')
    }
  }

  // Stats
  const totalUsers = users.length
  // Assuming all users in profiles are "active" for now as we don't have a status field yet
  // We can add a simple logic: if created in last 30 days = "New", else "Active"
  const activeUsers = totalUsers 
  const adminCount = users.filter(u => u.role === 'admin' || u.role === 'manager').length
  const techCount = users.filter(u => u.role === 'tecnico').length

  return (
    <div className="grid">
      <div className="dashboard-header" style={{ marginBottom: 32 }}>
        <div>
          <div className="title">Gerenciar Usuários</div>
          <div className="subtitle">Administre o acesso e permissões do sistema</div>
        </div>
        <button 
          className="btn-primary" 
          onClick={() => setShowForm(!showForm)}
          style={{ display: 'flex', alignItems: 'center', gap: 8 }}
        >
          <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          {showForm ? 'Cancelar' : 'Novo Usuário'}
        </button>
      </div>

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 24, marginBottom: 32 }}>
        <div className="card" style={{ padding: 24, display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ padding: 12, borderRadius: 12, background: 'rgba(99, 102, 241, 0.1)', color: '#6366f1' }}>
            <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <div>
            <div style={{ fontSize: 14, color: 'var(--text-muted)' }}>Total de Usuários</div>
            <div style={{ fontSize: 24, fontWeight: 700 }}>{totalUsers}</div>
          </div>
        </div>

        <div className="card" style={{ padding: 24, display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ padding: 12, borderRadius: 12, background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
            <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <div style={{ fontSize: 14, color: 'var(--text-muted)' }}>Usuários Ativos</div>
            <div style={{ fontSize: 24, fontWeight: 700 }}>{activeUsers}</div>
          </div>
        </div>

        <div className="card" style={{ padding: 24, display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ padding: 12, borderRadius: 12, background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}>
            <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div>
            <div style={{ fontSize: 14, color: 'var(--text-muted)' }}>Técnicos</div>
            <div style={{ fontSize: 24, fontWeight: 700 }}>{techCount}</div>
          </div>
        </div>
      </div>

      {/* Form Section */}
      {showForm && (
        <div className="card" style={{ marginBottom: 32, animation: 'fadeIn 0.3s ease' }}>
          <div className="card-header">
            <div className="title" style={{ fontSize: 18 }}>Novo Usuário</div>
          </div>
          <form onSubmit={handleCreateUser} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, alignItems: 'end' }}>
            <div>
              <label className="subtitle" style={{ marginBottom: 8, display: 'block' }}>Email</label>
              <input 
                className="input" 
                type="email" 
                value={newUser.email}
                onChange={e => setNewUser({...newUser, email: e.target.value})}
                placeholder="colaborador@empresa.com"
                required
              />
            </div>
            <div>
              <label className="subtitle" style={{ marginBottom: 8, display: 'block' }}>Senha</label>
              <input 
                className="input" 
                type="password" 
                value={newUser.password}
                onChange={e => setNewUser({...newUser, password: e.target.value})}
                placeholder="Mínimo 6 caracteres"
                required
                minLength={6}
              />
            </div>
            <div>
              <label className="subtitle" style={{ marginBottom: 8, display: 'block' }}>Nome de Usuário</label>
              <input 
                className="input" 
                type="text" 
                value={newUser.username}
                onChange={e => setNewUser({...newUser, username: e.target.value})}
                placeholder="Ex: joaosilva"
                required
              />
            </div>
            <div>
              <label className="subtitle" style={{ marginBottom: 8, display: 'block' }}>Função</label>
              <select 
                className="input"
                value={newUser.role}
                onChange={e => setNewUser({...newUser, role: e.target.value})}
              >
                <option value="user">Usuário (Padrão)</option>
                <option value="tecnico">Técnico</option>
                <option value="supervisor">Supervisor</option>
                <option value="manager">Gerente</option>
                <option value="admin">Administrador</option>
              </select>
            </div>
            <button type="submit" className="btn-primary" disabled={creating} style={{ height: 42 }}>
              {creating ? 'Criando...' : 'Criar Usuário'}
            </button>
          </form>
        </div>
      )}

      {/* Users List */}
      <div className="card">
        <div className="card-header">
          <div className="title" style={{ fontSize: 18 }}>Lista de Usuários</div>
        </div>
        
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Carregando...</div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th style={{ paddingLeft: 24 }}>Usuário</th>
                  <th>Função</th>
                  <th>Status</th>
                  <th>Data Cadastro</th>
                  <th style={{ textAlign: 'right', paddingRight: 24 }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id} style={{ transition: 'background 0.2s' }}>
                    <td style={{ paddingLeft: 24 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ 
                          width: 32, height: 32, borderRadius: '50%', 
                          background: 'linear-gradient(135deg, var(--secondary), var(--primary))',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: 'white', fontWeight: 'bold', fontSize: 12
                        }}>
                          {(u.username || '?').charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: 500 }}>{u.username || 'Sem nome'}</div>
                          {/* We don't have email in profiles table usually, but if we did we'd show it */}
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`badge badge-${
                        u.role === 'admin' ? 'high' : 
                        u.role === 'manager' ? 'medium' : 
                        u.role === 'tecnico' ? 'low' : 'default'
                      }`}>
                        {u.role || 'user'}
                      </span>
                    </td>
                    <td>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#10b981' }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981' }}></span>
                        Ativo
                      </span>
                    </td>
                    <td style={{ color: 'var(--text-muted)' }}>{new Date(u.created_at).toLocaleDateString()}</td>
                    <td style={{ textAlign: 'right', paddingRight: 24 }}>
                      {u.id !== user?.id && (
                          <button 
                              onClick={() => handleDeleteUser(u.id)}
                              style={{ color: 'var(--danger)', background: 'rgba(239, 68, 68, 0.1)', border: 'none', cursor: 'pointer', padding: 8, borderRadius: 6, transition: 'all 0.2s' }}
                              title="Remover acesso"
                              className="hover-danger"
                          >
                              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                          </button>
                      )}
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>Nenhum usuário encontrado.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
