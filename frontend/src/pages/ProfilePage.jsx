import { useState, useEffect } from 'react'
import { supabase } from '../services/supabase'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'

export default function ProfilePage() {
  const { user, login } = useAuth() // login can be used to update session locally
  const { addToast } = useToast()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    avatar_url: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })

  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        username: user.username || '',
        email: user.email || '',
        avatar_url: user.avatar_url || '' // Assuming we add this to session later
      }))
      
      // Fetch fresh data
      fetchProfile()
    }
  }, [user])

  const fetchProfile = async () => {
    try {
      if (!user?.id) return
      
      const { data, error } = await supabase
        .from('app_users')
        .select('*')
        .eq('id', user.id)
        .single()
      
      if (error) throw error
      
      setFormData(prev => ({
        ...prev,
        username: data.username,
        email: data.email,
        avatar_url: data.avatar_url || ''
      }))
    } catch (err) {
      console.error('Error fetching profile:', err)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const updateData = {
        avatar_url: formData.avatar_url
      }

      // Password change logic
      if (formData.newPassword) {
        if (formData.newPassword !== formData.confirmPassword) {
          throw new Error('A nova senha e a confirmação não coincidem')
        }
        if (formData.newPassword.length < 4) {
          throw new Error('A senha deve ter pelo menos 4 caracteres')
        }
        
        // Verify current password (simple check)
        const { data: verifyData } = await supabase
          .from('app_users')
          .select('id')
          .eq('id', user.id)
          .eq('password', formData.currentPassword)
          .single()
          
        if (!verifyData) {
          throw new Error('Senha atual incorreta')
        }
        
        updateData.password = formData.newPassword
      }

      const { data, error } = await supabase
        .from('app_users')
        .update(updateData)
        .eq('id', user.id)
        .select()
        .single()

      if (error) throw error

      addToast('Perfil atualizado com sucesso!')
      
      // Update local session data if needed (optional, for avatar mainly)
      // login({ username: data.username, password: data.password }) // Re-login to refresh session? Or just ignore for now.
      
      setFormData(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }))
      
    } catch (err) {
      addToast(err.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="grid">
      <div className="dashboard-header">
        <div>
          <div className="title">Meu Perfil</div>
          <div className="subtitle">Gerencie suas informações pessoais</div>
        </div>
      </div>

      <div className="card" style={{ maxWidth: 600 }}>
        <div className="card-header">
          <div className="title" style={{ fontSize: 18 }}>Editar Informações</div>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
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
            </div>
          </div>

          <div>
            <label className="subtitle" style={{ marginBottom: 8, display: 'block' }}>Nome de Usuário (não editável)</label>
            <input className="input" type="text" value={formData.username} disabled style={{ opacity: 0.7 }} />
          </div>

          <div>
            <label className="subtitle" style={{ marginBottom: 8, display: 'block' }}>Email (não editável)</label>
            <input className="input" type="email" value={formData.email} disabled style={{ opacity: 0.7 }} />
          </div>

          <div>
            <label className="subtitle" style={{ marginBottom: 8, display: 'block' }}>URL da Foto de Perfil</label>
            <input 
              className="input" 
              type="text" 
              value={formData.avatar_url}
              onChange={e => setFormData({...formData, avatar_url: e.target.value})}
              placeholder="https://exemplo.com/minha-foto.jpg"
            />
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
              Cole o link direto de uma imagem (ex: imgur, ibb, ou bucket público)
            </div>
          </div>

          <div style={{ borderTop: '1px solid var(--border-light)', margin: '10px 0' }}></div>
          <div className="subtitle" style={{ color: 'var(--primary)', marginBottom: 10 }}>Alterar Senha (opcional)</div>

          <div>
            <label className="subtitle" style={{ marginBottom: 8, display: 'block' }}>Senha Atual</label>
            <input 
              className="input" 
              type="password" 
              value={formData.currentPassword}
              onChange={e => setFormData({...formData, currentPassword: e.target.value})}
              placeholder="Necessária para confirmar alteração"
            />
          </div>

          <div>
            <label className="subtitle" style={{ marginBottom: 8, display: 'block' }}>Nova Senha</label>
            <input 
              className="input" 
              type="password" 
              value={formData.newPassword}
              onChange={e => setFormData({...formData, newPassword: e.target.value})}
              placeholder="Mínimo 4 caracteres"
            />
          </div>

          <div>
            <label className="subtitle" style={{ marginBottom: 8, display: 'block' }}>Confirmar Nova Senha</label>
            <input 
              className="input" 
              type="password" 
              value={formData.confirmPassword}
              onChange={e => setFormData({...formData, confirmPassword: e.target.value})}
              placeholder="Repita a nova senha"
            />
          </div>

          <button type="submit" className="btn-primary" disabled={loading} style={{ marginTop: 10 }}>
            {loading ? 'Salvando...' : 'Salvar Alterações'}
          </button>
        </form>
      </div>
    </div>
  )
}
