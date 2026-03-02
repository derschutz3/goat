import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getDashboard } from '../services/ticketService'
import StatsGrid from '../components/dashboard/StatsGrid'
import EmptyState from '../components/common/EmptyState'

export default function DashboardPage() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    getDashboard()
      .then(result => active && setData(result))
      .catch(() => active && setError('Não foi possível carregar o dashboard'))
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [])

  if (loading) {
    return <div className="card">Carregando dashboard...</div>
  }

  if (error) {
    return <div className="card">{error}</div>
  }

  if (!data) {
    return <EmptyState title="Sem dados" description="Nenhuma informação disponível no momento." />
  }

  const statusLabel = status => {
    const labels = {
      novo: 'Novo',
      em_analise: 'Em análise',
      aguardando_peca: 'Aguardando peça',
      resolvido: 'Resolvido',
      nao_resolvido: 'Não resolvido',
      fechado: 'Fechado'
    }
    return labels[status] || status
  }

  const priorityLabel = priority => {
    const labels = {
      baixa: 'Baixa',
      media: 'Média',
      alta: 'Alta',
      critica: 'Crítica'
    }
    return labels[priority] || priority
  }

  const formatDate = value => {
    if (!value) return '-'
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return '-'
    return date.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div>
          <div className="title">Visão geral</div>
          <div className="subtitle">Status do suporte hoje</div>
        </div>
        <div className="dashboard-actions">
          <Link className="btn" to="/chamados/novo">Novo chamado</Link>
          <Link className="btn-secondary" to="/chamados">Ver chamados</Link>
        </div>
      </div>

      <StatsGrid data={data} />

      <div className="dashboard-columns">
        <div className="card dashboard-card">
          <div className="card-header">
            <div className="title">Chamados recentes</div>
            <Link className="link" to="/chamados">Ver todos</Link>
          </div>
          <div className="list">
            {(data.recent_tickets || []).length === 0 && (
              <div className="empty-row">Nenhum chamado recente</div>
            )}
            {(data.recent_tickets || []).map(ticket => (
              <div key={ticket.id} className="list-item">
                <div className="list-main">
                  <div className="list-title">#{ticket.id} • {ticket.title}</div>
                  <div className="list-meta">
                    <span>{ticket.store || 'Sem loja'}</span>
                    <span>•</span>
                    <span>{formatDate(ticket.created_at)}</span>
                  </div>
                </div>
                <div className="list-side">
                  <span className="pill" data-tone={ticket.status === 'resolvido' ? 'success' : 'neutral'}>
                    {statusLabel(ticket.status)}
                  </span>
                  <span className="pill" data-tone={ticket.priority === 'critica' ? 'danger' : ticket.priority === 'alta' ? 'warning' : 'info'}>
                    {priorityLabel(ticket.priority)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="stack">
          <div className="card dashboard-card">
            <div className="card-header">
              <div className="title">Produtividade hoje</div>
            </div>
            <div className="list compact">
              {(data.productivity || []).length === 0 && (
                <div className="empty-row">Sem atividades hoje</div>
              )}
              {(data.productivity || []).map(item => (
                <div key={item.name} className="list-item compact">
                  <div className="list-title">{item.name}</div>
                  <div className="pill" data-tone="info">{item.count}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="card dashboard-card">
            <div className="card-header">
              <div className="title">Prioridades</div>
            </div>
            <div className="priority-grid">
              {Object.entries(data.priority_counts || {}).map(([key, value]) => (
                <div key={key} className="priority-item">
                  <div className="subtitle">{priorityLabel(key)}</div>
                  <div className="stat-value">{value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
