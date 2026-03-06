import { Route, Routes, Navigate } from 'react-router-dom'
import AppShell from './components/layout/AppShell'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import TicketsPage from './pages/TicketsPage'
import TicketCreatePage from './pages/TicketCreatePage'
import TicketDetailPage from './pages/TicketDetailPage'
import SchedulePage from './pages/SchedulePage'
import UsersPage from './pages/UsersPage'
import StoresPage from './pages/StoresPage'
import ProfilePage from './pages/ProfilePage'
import { useAuth } from './context/AuthContext'

export default function App() {
  const { user, loading } = useAuth()

  if (loading) {
    return <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#05050a', color: 'white' }}>Carregando...</div>
  }

  if (!user) {
    return <LoginPage />
  }

  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/chamados" element={<TicketsPage />} />
        <Route path="/chamados/novo" element={<TicketCreatePage />} />
        <Route path="/chamados/:id" element={<TicketDetailPage />} />
        <Route path="/escala" element={<SchedulePage />} />
        <Route path="/lojas" element={<StoresPage />} />
        <Route path="/usuarios" element={<UsersPage />} />
        <Route path="/perfil" element={<ProfilePage />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </AppShell>
  )
}
