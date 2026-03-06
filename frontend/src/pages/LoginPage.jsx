import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ username: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async e => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const ok = await login(form)
    if (!ok) {
      setError('Acesso negado. Usuário ou senha incorretos.')
    } else {
      navigate('/escala', { replace: true })
    }
    setLoading(false)
  }

  return (
    <div className="login-container">
      <style>{`
        .login-container {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: radial-gradient(circle at top right, #1e1b4b, #020617);
          position: relative;
          overflow: hidden;
        }

        .login-blob {
          position: absolute;
          width: 600px;
          height: 600px;
          background: linear-gradient(180deg, var(--primary), var(--secondary));
          filter: blur(100px);
          opacity: 0.2;
          border-radius: 50%;
          animation: float 10s ease-in-out infinite;
          top: -200px;
          left: -200px;
        }
        
        .login-blob-2 {
          position: absolute;
          width: 500px;
          height: 500px;
          background: linear-gradient(180deg, var(--accent), var(--primary));
          filter: blur(80px);
          opacity: 0.15;
          border-radius: 50%;
          animation: float 12s ease-in-out infinite reverse;
          bottom: -100px;
          right: -100px;
        }

        .login-card {
          width: 100%;
          max-width: 420px;
          padding: 48px;
          border-radius: 24px;
          background: rgba(15, 23, 42, 0.6);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
          animation: slideUp 0.8s cubic-bezier(0.16, 1, 0.3, 1);
          z-index: 10;
        }

        .login-title {
          font-size: 32px;
          font-weight: 700;
          margin-bottom: 8px;
          background: linear-gradient(to right, #fff, #94a3b8);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          text-align: center;
        }

        .login-subtitle {
          color: var(--text-muted);
          text-align: center;
          margin-bottom: 32px;
          font-size: 15px;
        }

        .input-group {
          margin-bottom: 20px;
          position: relative;
        }

        .input-icon {
          position: absolute;
          left: 16px;
          top: 50%;
          transform: translateY(-50%);
          color: var(--text-muted);
          pointer-events: none;
        }
        
        .login-input {
          width: 100%;
          padding: 16px 16px 16px 48px;
          background: rgba(0, 0, 0, 0.3);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          color: white;
          font-size: 15px;
          transition: all 0.3s ease;
        }

        .login-input:focus {
          outline: none;
          border-color: var(--primary);
          background: rgba(0, 0, 0, 0.5);
          box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.15);
        }

        .login-btn {
          width: 100%;
          padding: 16px;
          border-radius: 12px;
          background: linear-gradient(135deg, var(--primary), #4f46e5);
          color: white;
          font-weight: 600;
          border: none;
          cursor: pointer;
          transition: all 0.3s ease;
          margin-top: 12px;
          font-size: 16px;
          position: relative;
          overflow: hidden;
        }

        .login-btn::after {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
          transition: 0.5s;
        }

        .login-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 25px -5px rgba(99, 102, 241, 0.4);
        }
        
        .login-btn:hover::after {
          left: 100%;
        }

        .error-msg {
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.2);
          color: #fca5a5;
          padding: 12px;
          border-radius: 8px;
          margin-bottom: 20px;
          font-size: 14px;
          text-align: center;
          animation: fadeIn 0.3s ease;
        }
      `}</style>

      <div className="login-blob"></div>
      <div className="login-blob-2"></div>

      <div className="login-card">
        <div style={{ width: 80, height: 80, margin: '0 auto 20px', borderRadius: '50%', overflow: 'hidden', border: '4px solid var(--primary)', background: 'var(--card-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <img 
            src="/monkey-icon.svg" 
            alt="Logo" 
            style={{ width: '70%', height: '70%', objectFit: 'contain' }} 
          />
        </div>
        <div className="login-title">Primatas de Madagascar</div>
        <div className="login-subtitle">Acesse sua conta para continuar</div>

        <form onSubmit={handleSubmit}>
          {error && <div className="error-msg">{error}</div>}
          
          <div className="input-group">
            <span className="input-icon">👤</span>
            <input
              className="login-input"
              placeholder="Usuário"
              value={form.username}
              onChange={e => setForm({ ...form, username: e.target.value })}
              autoFocus
            />
          </div>

          <div className="input-group">
            <span className="input-icon">🔒</span>
            <input
              className="login-input"
              type="password"
              placeholder="Senha"
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
            />
          </div>

          <button className="login-btn" disabled={loading}>
            {loading ? 'Autenticando...' : 'Entrar no Sistema'}
          </button>
        </form>
      </div>
    </div>
  )
}
