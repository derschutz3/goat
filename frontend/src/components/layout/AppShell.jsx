import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import './layout.css'

// Simple SVG Icons
const Icons = {
  Dashboard: () => <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>,
  Ticket: () => <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" /></svg>,
  Plus: () => <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>,
  Calendar: () => <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>,
  Moon: () => <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>,
  Sun: () => <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>,
  Logout: () => <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>,
  Users: () => <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>,
  Store: () => <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>,
  Settings: () => <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
  Profile: () => <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>,
  Menu: () => <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>,
  Close: () => <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
}

export default function AppShell({ children }) {
  const { logout, user } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <div className={`app-shell ${menuOpen ? 'menu-open' : ''}`}>
      <div className="sidebar-overlay" onClick={() => setMenuOpen(false)}></div>
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-logo" style={{ width: 40, height: 40, borderRadius: '50%', overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--card-bg)' }}>
            <img 
              src="/monkey-icon.svg" 
              alt="Logo" 
              style={{ width: '80%', height: '80%', objectFit: 'contain' }} 
            />
          </div>
          <span className="brand-text" style={{ color: 'var(--text-main)', opacity: 1, visibility: 'visible', transform: 'none' }}>Primatas de Madagascar</span>
        </div>
        
        <nav className="menu">
          <NavLink to="/dashboard" className="menu-item" onClick={() => setMenuOpen(false)}>
            <span className="menu-icon"><Icons.Dashboard /></span>
            <span className="menu-text">Dashboard</span>
          </NavLink>
          <NavLink to="/chamados" className="menu-item" end onClick={() => setMenuOpen(false)}>
            <span className="menu-icon"><Icons.Ticket /></span>
            <span className="menu-text">Chamados</span>
          </NavLink>
          <NavLink to="/chamados/novo" className="menu-item" onClick={() => setMenuOpen(false)}>
            <span className="menu-icon"><Icons.Plus /></span>
            <span className="menu-text">Novo Chamado</span>
          </NavLink>
          <NavLink to="/lojas" className="menu-item" onClick={() => setMenuOpen(false)}>
            <span className="menu-icon"><Icons.Store /></span>
            <span className="menu-text">Lojas</span>
          </NavLink>
          <NavLink to="/usuarios" className="menu-item" onClick={() => setMenuOpen(false)}>
            <span className="menu-icon"><Icons.Users /></span>
            <span className="menu-text">Usuários</span>
          </NavLink>
          <NavLink to="/configuracoes" className="menu-item" onClick={() => setMenuOpen(false)}>
            <span className="menu-icon"><Icons.Settings /></span>
            <span className="menu-text">Configurações</span>
          </NavLink>
          <NavLink to="/perfil" className="menu-item" onClick={() => setMenuOpen(false)}>
            <span className="menu-icon"><Icons.Profile /></span>
            <span className="menu-text">Meu Perfil</span>
          </NavLink>
        </nav>

        <div className="sidebar-footer">
          <button className="menu-item" onClick={toggleTheme} style={{ width: '100%', background: 'transparent', border: 'none', cursor: 'pointer' }}>
            <span className="menu-icon">{theme === 'dark' ? <Icons.Moon /> : <Icons.Sun />}</span>
            <span className="menu-text">Tema: {theme === 'dark' ? 'Escuro' : 'Claro'}</span>
          </button>
          <button className="menu-item" onClick={logout} style={{ width: '100%', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--danger)' }}>
            <span className="menu-icon"><Icons.Logout /></span>
            <span className="menu-text">Sair</span>
          </button>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', textAlign: 'center', marginTop: 4, opacity: 0.5 }}>v5.55</div>
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <button className="btn-secondary" onClick={() => setMenuOpen(!menuOpen)} style={{ padding: 8, display: 'none' }}>
              <Icons.Menu />
            </button>
            <div className="topbar-title">Visão Geral</div>
          </div>

          <div className="user-profile">
            <div style={{ textAlign: 'right', marginRight: 12 }}>
              <div style={{ fontSize: 14, fontWeight: 600 }}>{user?.username || 'Usuário'}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{user?.role || 'Admin'}</div>
            </div>
            <div className="avatar">
              {user?.avatar_url ? (
                <img 
                  key={user.avatar_url}
                  src={user.avatar_url} 
                  alt={user.username} 
                  style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
                  onError={(e) => { e.target.onerror = null; e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                />
              ) : null}
              <div style={{ 
                width: '100%', height: '100%', borderRadius: '50%', 
                background: 'linear-gradient(135deg, var(--secondary), var(--primary))',
                display: user?.avatar_url ? 'none' : 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'white', fontWeight: 'bold'
              }}>
                {user?.username?.[0]?.toUpperCase() || 'U'}
              </div>
            </div>
          </div>
        </header>

        <div className="content">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="mobile-bottom-nav">
        <NavLink to="/dashboard" className="mobile-nav-item">
          <Icons.Dashboard />
          <span>Início</span>
        </NavLink>
        <NavLink to="/chamados" className="mobile-nav-item" end>
          <Icons.Ticket />
          <span>Chamados</span>
        </NavLink>
        <NavLink to="/chamados/novo" className="mobile-nav-item highlight">
          <div className="plus-circle">
            <Icons.Plus />
          </div>
        </NavLink>
        <NavLink to="/lojas" className="mobile-nav-item">
          <Icons.Store />
          <span>Lojas</span>
        </NavLink>
        <NavLink to="/usuarios" className="mobile-nav-item">
          <Icons.Users />
          <span>Usuários</span>
        </NavLink>
        <NavLink to="/configuracoes" className="mobile-nav-item">
          <Icons.Settings />
          <span>Ajustes</span>
        </NavLink>
        <NavLink to="/perfil" className="mobile-nav-item">
          {user?.avatar_url ? (
            <img src={user.avatar_url} alt="Perfil" className="nav-avatar" />
          ) : (
            <Icons.Profile />
          )}
          <span>Perfil</span>
        </NavLink>
      </nav>

      <style>{`
        @media (max-width: 1024px) {
          .topbar button { display: none !important; }
          .sidebar { display: none !important; }
          .mobile-bottom-nav { display: flex !important; }
          .main { padding-bottom: 80px; margin-left: 0 !important; }
          .topbar { left: 0 !important; width: 100% !important; padding: 0 16px !important; }
          .content { padding: 16px; }
        }
        @media (min-width: 1025px) {
          .mobile-bottom-nav { display: none !important; }
        }
      `}</style>
    </div>
  )
}
