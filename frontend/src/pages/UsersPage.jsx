import { useState, useEffect } from 'react'
import { supabase } from '../services/supabase'
import { useAuth } from '../context/AuthContext'
import { createClient } from '@supabase/supabase-js'

export default function UsersPage() {
  const { user } = useAuth()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [newUser, setNewUser] = useState({ email: '', password: '', username: '', role: 'user' })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [creating, setCreating] = useState(false)

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
      setUsers(data)
    } catch (err) {
      console.error('Error fetching users:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateUser = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setCreating(true)

    try {
      // Create a temporary client to sign up the user without logging out the admin
      const tempSupabase = createClient(
        import.meta.env.VITE_SUPABASE_URL,
        import.meta.env.VITE_SUPABASE_ANON_KEY,
        {
          auth: {
            persistSession: false, // Don't save session to localStorage
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
        // 2. Create the profile entry if it wasn't created automatically by a trigger
        // We check if it exists first
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', authData.user.id)
          .single()

        if (!existingProfile) {
          // Manually insert profile using the admin's session (assuming admin has insert rights)
          const { error: profileError } = await supabase
            .from('profiles')
            .insert([
              {
                id: authData.user.id,
                username: newUser.username,
                role: newUser.role,
                created_at: new Date().toISOString()
              }
            ])

          if (profileError) {
            console.warn('Profile creation error (might be handled by trigger):', profileError)
            // If error is RLS related, we might ignore it if trigger handled it
          }
        }

        setSuccess('Usuário criado com sucesso! O login já pode ser utilizado.')
        setNewUser({ email: '', password: '', username: '', role: 'user' })
        fetchUsers() // Refresh list
      }
    } catch (err) {
      console.error('Error creating user:', err)
      setError(err.message || 'Erro ao criar usuário.')
    } finally {
      setCreating(false)
    }
  }

  const handleDeleteUser = async (userId) => {
    if (!confirm('Tem certeza que deseja remover este usuário do sistema? (A conta de login permanecerá no Supabase, apenas o perfil será removido da lista)')) return

    try {
        // We can only delete from profiles table with client SDK
        // Actual auth user deletion requires service role key or dashboard
        const { error } = await supabase
            .from('profiles')
            .delete()
            .eq('id', userId)
        
        if (error) throw error
        
        setUsers(users.filter(u => u.id !== userId))
        setSuccess('Perfil de usuário removido.')
    } catch (err) {
        setError('Erro ao remover usuário: ' + err.message)
    }
  }

  /*
  if (user?.role !== 'admin' && user?.role !== 'manager') {
    return <div className="card">Acesso restrito a administradores.</div>
  }
  */

  return (
    <div className="grid">
      <div className="dashboard-header">
        <div>
          <div className="title">Gerenciar Usuários</div>
          <div className="subtitle">Cadastre e edite permissões</div>
        </div>
      </div>

      <div className="dashboard-columns">
        <div className="card">
          <div className="card-header">
            <div className="title" style={{ fontSize: 18 }}>Novo Usuário</div>
          </div>
          
          {error && <div style={{ padding: 12, background: '#fee2e2', color: '#dc2626', borderRadius: 8, marginBottom: 16 }}>{error}</div>}
          {success && <div style={{ padding: 12, background: '#dcfce7', color: '#16a34a', borderRadius: 8, marginBottom: 16 }}>{success}</div>}

          <form onSubmit={handleCreateUser} style={{ display: 'grid', gap: 16 }}>
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
            <button type="submit" className="btn-primary" disabled={creating}>
              {creating ? 'Criando...' : 'Criar Usuário'}
            </button>
          </form>
        </div>

        <div className="card">
          <div className="card-header">
            <div className="title" style={{ fontSize: 18 }}>Usuários Cadastrados</div>
          </div>
          
          {loading ? (
            <div>Carregando...</div>
          ) : (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Nome</th>
                    <th>Função</th>
                    <th>Data Cadastro</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id}>
                      <td>
                        <div style={{ fontWeight: 500 }}>{u.username}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>ID: {u.id.slice(0, 8)}...</div>
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
                      <td>{new Date(u.created_at).toLocaleDateString()}</td>
                      <td>
                        {u.id !== user?.id && (
                            <button 
                                onClick={() => handleDeleteUser(u.id)}
                                style={{ color: 'var(--danger)', background: 'none', border: 'none', cursor: 'pointer' }}
                                title="Remover acesso"
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
                      <td colSpan="4" style={{ textAlign: 'center', padding: 20 }}>Nenhum usuário encontrado.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
