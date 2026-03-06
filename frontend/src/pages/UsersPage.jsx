import { useState, useEffect, useRef } from 'react'
import { supabase } from '../services/supabase'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'

export default function UsersPage() {
  const { user } = useAuth()
  const { addToast } = useToast()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [formData, setFormData] = useState({ email: '', password: '', username: '', role: 'user', avatar_url: '', is_tech: false })
  const [creating, setCreating] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  
  const [uploading, setUploading] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef(null)

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('app_users')
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

  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0])
    }
  }

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0])
    }
  }

  const handleFileUpload = async (file) => {
    try {
      setUploading(true)
      
      if (!file.type.startsWith('image/')) {
        throw new Error('Por favor, envie apenas imagens.')
      }

      if (file.size > 2 * 1024 * 1024) {
        throw new Error('A imagem deve ter no máximo 2MB.')
      }

      const fileExt = file.name.split('.').pop()
      // Use editingId if editing, otherwise random temp ID (will be orphaned if not saved, but ok for now)
      const userId = editingId || 'temp-' + Math.random().toString(36).substr(2, 9)
      const fileName = `${userId}-${Math.random()}.${fileExt}`
      const filePath = `${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file)

      if (uploadError) {
        throw uploadError
      }

      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)

      if (data) {
        setFormData(prev => ({ ...prev, avatar_url: data.publicUrl }))
        addToast('Imagem carregada! Salve para confirmar.')
      }
    } catch (error) {
      console.error('Erro no upload:', error)
      addToast(error.message || 'Erro ao enviar imagem', 'error')
    } finally {
      setUploading(false)
    }
  }

  const handleSaveUser = async (e) => {
    e.preventDefault()
    setCreating(true)

    try {
      if (editingId) {
        // Update existing user
        const updateData = {
          username: formData.username,
          email: formData.email,
          role: formData.role,
          avatar_url: formData.avatar_url,
          is_tech: formData.is_tech
        }
        
        // Only update password if provided
        if (formData.password) {
          updateData.password = formData.password
        }

        const { data, error } = await supabase
          .from('app_users')
          .update(updateData)
          .eq('id', editingId)
          .select()
          .single()

        if (error) throw error

        setUsers(users.map(u => u.id === editingId ? data : u))
        addToast(`Usuário ${formData.username} atualizado com sucesso!`)
      } else {
        // Create new user
        const { data: existing } = await supabase
          .from('app_users')
          .select('id')
          .eq('username', formData.username)
          .single()

        if (existing) {
          throw new Error('Nome de usuário já existe')
        }

        const { data, error } = await supabase
          .from('app_users')
          .insert([{
            username: formData.username,
            password: formData.password,
            email: formData.email,
            role: formData.role,
            avatar_url: formData.avatar_url,
            is_tech: formData.is_tech
          }])
          .select()
          .single()

        if (error) throw error

        addToast(`Usuário ${formData.username} criado com sucesso!`)
        setUsers([data, ...users])
      }
      
      resetForm()
    } catch (err) {
      console.error('Error saving user:', err)
      addToast(err.message || 'Erro ao salvar usuário', 'error')
    } finally {
      setCreating(false)
    }
  }

  const handleEditClick = (userToEdit) => {
    setEditingId(userToEdit.id)
    setFormData({
      email: userToEdit.email || '',
      password: '', // Don't show current password
      username: userToEdit.username,
      role: userToEdit.role,
      avatar_url: userToEdit.avatar_url || '',
      is_tech: userToEdit.is_tech || false
    })
    setShowForm(true)
  }

  const resetForm = () => {
    setFormData({ email: '', password: '', username: '', role: 'user', avatar_url: '', is_tech: false })
    setEditingId(null)
    setShowForm(false)
  }

  const handleDeleteUser = async (userId) => {
    if (!confirm('Tem certeza que deseja remover este usuário do sistema?')) return

    try {
        const { error } = await supabase
            .from('app_users')
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
          onClick={() => {
            if (showForm) resetForm()
            else setShowForm(true)
          }}
          style={{ display: 'flex', alignItems: 'center', gap: 8 }}
        >
          <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={showForm ? "M6 18L18 6M6 6l12 12" : "M12 4v16m8-8H4"} />
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
            <div className="title" style={{ fontSize: 18 }}>{editingId ? 'Editar Usuário' : 'Novo Usuário'}</div>
          </div>
          <form onSubmit={handleSaveUser} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, alignItems: 'end' }}>
            {/* Avatar Upload */}
            <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, width: '100%', maxWidth: 300 }}>
                <div style={{ position: 'relative' }}>
                  {formData.avatar_url ? (
                    <img 
                      src={formData.avatar_url} 
                      alt="Avatar" 
                      style={{ width: 100, height: 100, borderRadius: '50%', objectFit: 'cover', border: '4px solid var(--bg-app)' }} 
                      onError={(e) => { e.target.onerror = null; e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                    />
                  ) : null}
                  <div style={{ 
                    width: 100, height: 100, borderRadius: '50%', 
                    background: 'linear-gradient(135deg, var(--secondary), var(--primary))',
                    display: formData.avatar_url ? 'none' : 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'white', fontWeight: 'bold', fontSize: 32, border: '4px solid var(--bg-app)'
                  }}>
                    {(formData.username || '?').charAt(0).toUpperCase()}
                  </div>
                  
                  {uploading && (
                    <div style={{ 
                      position: 'absolute', inset: 0, borderRadius: '50%', 
                      background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                      <div className="spinner"></div>
                    </div>
                  )}
                </div>

                <div 
                  className={`drop-zone ${dragActive ? 'active' : ''}`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    border: `2px dashed ${dragActive ? 'var(--primary)' : 'var(--border-light)'}`,
                    borderRadius: 'var(--radius-md)',
                    padding: '12px',
                    textAlign: 'center',
                    cursor: 'pointer',
                    background: dragActive ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
                    transition: 'all 0.2s',
                    width: '100%'
                  }}
                >
                  <input 
                    ref={fileInputRef}
                    type="file" 
                    accept="image/*" 
                    onChange={handleFileChange}
                    style={{ display: 'none' }}
                  />
                  <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {uploading ? 'Enviando...' : 'Arraste uma foto ou clique'}
                  </p>
                </div>
              </div>
            </div>

            <div>
              <label className="subtitle" style={{ marginBottom: 8, display: 'block' }}>Email</label>
              <input 
                className="input" 
                type="email" 
                value={formData.email}
                onChange={e => setFormData({...formData, email: e.target.value})}
                placeholder="colaborador@empresa.com"
                required
              />
            </div>
            <div>
              <label className="subtitle" style={{ marginBottom: 8, display: 'block' }}>Senha {editingId && '(opcional)'}</label>
              <input 
                className="input" 
                type="text" 
                value={formData.password}
                onChange={e => setFormData({...formData, password: e.target.value})}
                placeholder={editingId ? "Nova senha" : "Senha de acesso"}
                required={!editingId}
                minLength={4}
              />
            </div>
            <div>
              <label className="subtitle" style={{ marginBottom: 8, display: 'block' }}>Nome de Usuário</label>
              <input 
                className="input" 
                type="text" 
                value={formData.username}
                onChange={e => setFormData({...formData, username: e.target.value})}
                placeholder="Ex: joaosilva"
                required
              />
            </div>
            <div>
              <label className="subtitle" style={{ marginBottom: 8, display: 'block' }}>Função</label>
              <select 
                className="input"
                value={formData.role}
                onChange={e => setFormData({...formData, role: e.target.value})}
              >
                <option value="user">Usuário (Padrão)</option>
                <option value="tecnico">Técnico</option>
                <option value="supervisor">Supervisor</option>
                <option value="manager">Gerente</option>
                <option value="admin">Administrador</option>
              </select>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <input 
                type="checkbox" 
                id="is_tech"
                checked={formData.is_tech}
                onChange={e => setFormData({...formData, is_tech: e.target.checked})}
                style={{ width: 16, height: 16, cursor: 'pointer' }}
              />
              <label htmlFor="is_tech" style={{ cursor: 'pointer', fontSize: 14 }}>Exercer função de técnico?</label>
            </div>

            <button type="submit" className="btn-primary" disabled={creating} style={{ height: 42 }}>
              {creating ? 'Salvando...' : (editingId ? 'Salvar Alterações' : 'Criar Usuário')}
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
                        {u.avatar_url ? (
                          <img 
                            src={u.avatar_url} 
                            alt={u.username} 
                            style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' }} 
                            onError={(e) => { e.target.onerror = null; e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                          />
                        ) : null}
                        <div style={{ 
                          width: 32, height: 32, borderRadius: '50%', 
                          background: 'linear-gradient(135deg, var(--secondary), var(--primary))',
                          display: u.avatar_url ? 'none' : 'flex', alignItems: 'center', justifyContent: 'center',
                          color: 'white', fontWeight: 'bold', fontSize: 12
                        }}>
                          {(u.username || '?').charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: 500 }}>{u.username || 'Sem nome'}</div>
                          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                            {u.email && <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{u.email}</div>}
                            {u.is_tech && (
                              <span style={{ 
                                fontSize: 10, background: 'var(--primary)', color: 'white', 
                                padding: '2px 6px', borderRadius: 4, fontWeight: 'bold' 
                              }}>
                                TÉCNICO
                              </span>
                            )}
                          </div>
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
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                        <button 
                          onClick={() => handleEditClick(u)}
                          style={{ color: 'var(--primary)', background: 'rgba(99, 102, 241, 0.1)', border: 'none', cursor: 'pointer', padding: 8, borderRadius: 6, transition: 'all 0.2s' }}
                          title="Editar"
                        >
                          <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        {u.id !== user?.id && (
                            <button 
                                onClick={() => handleDeleteUser(u.id)}
                                style={{ color: 'var(--danger)', background: 'rgba(239, 68, 68, 0.1)', border: 'none', cursor: 'pointer', padding: 8, borderRadius: 6, transition: 'all 0.2s' }}
                                title="Remover acesso"
                            >
                                <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                            </button>
                        )}
                      </div>
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
