import { useState, useEffect, useRef } from 'react'
import { supabase } from '../services/supabase'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'

export default function ProfilePage() {
  const { user } = useAuth()
  const { addToast } = useToast()
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef(null)
  
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
        avatar_url: user.avatar_url || ''
      }))
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
      
      // Validar tipo de arquivo
      if (!file.type.startsWith('image/')) {
        throw new Error('Por favor, envie apenas imagens.')
      }

      // Validar tamanho (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        throw new Error('A imagem deve ter no máximo 2MB.')
      }

      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}-${Math.random()}.${fileExt}`
      const filePath = `${fileName}`

      // Upload para o Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file)

      if (uploadError) {
        throw uploadError
      }

      // Pegar URL pública
      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)

      if (data) {
        setFormData(prev => ({ ...prev, avatar_url: data.publicUrl }))
        addToast('Imagem carregada com sucesso! Clique em Salvar para confirmar.')
      }
    } catch (error) {
      console.error('Erro no upload:', error)
      addToast(error.message || 'Erro ao enviar imagem', 'error')
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const updateData = {
        avatar_url: formData.avatar_url
      }

      if (formData.newPassword) {
        if (formData.newPassword !== formData.confirmPassword) {
          throw new Error('A nova senha e a confirmação não coincidem')
        }
        if (formData.newPassword.length < 4) {
          throw new Error('A senha deve ter pelo menos 4 caracteres')
        }
        
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

      const { error } = await supabase
        .from('app_users')
        .update(updateData)
        .eq('id', user.id)

      if (error) throw error

      addToast('Perfil atualizado com sucesso!')
      
      // Update local session data to reflect changes immediately in UI
      if (typeof updateUser === 'function') {
        updateUser({
          username: formData.username,
          email: formData.email,
          avatar_url: formData.avatar_url
        })
      }
      
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
          {/* Avatar Upload Area */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
            <div style={{ position: 'relative' }}>
              {formData.avatar_url ? (
                <img 
                  src={formData.avatar_url} 
                  alt="Avatar" 
                  style={{ width: 120, height: 120, borderRadius: '50%', objectFit: 'cover', border: '4px solid var(--bg-app)' }} 
                  onError={(e) => { e.target.onerror = null; e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                />
              ) : null}
              <div style={{ 
                width: 120, height: 120, borderRadius: '50%', 
                background: 'linear-gradient(135deg, var(--secondary), var(--primary))',
                display: formData.avatar_url ? 'none' : 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'white', fontWeight: 'bold', fontSize: 40, border: '4px solid var(--bg-app)'
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
                padding: '20px',
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
              <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                {uploading ? 'Enviando...' : 'Arraste uma foto ou clique para selecionar'}
              </p>
            </div>
          </div>

          <div>
            <label className="subtitle" style={{ marginBottom: 8, display: 'block' }}>Nome de Usuário</label>
            <input className="input" type="text" value={formData.username} disabled style={{ opacity: 0.7 }} />
          </div>

          <div>
            <label className="subtitle" style={{ marginBottom: 8, display: 'block' }}>Email</label>
            <input className="input" type="email" value={formData.email} disabled style={{ opacity: 0.7 }} />
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
