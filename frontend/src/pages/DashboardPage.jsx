import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getDashboard } from '../services/ticketService'
import EmptyState from '../components/common/EmptyState'

// Componentes internos para o Dashboard
const KpiCard = ({ title, value, subtext, color = 'primary' }) => (
  <div className="card kpi-card" style={{ borderLeft: `4px solid var(--${color})` }}>
    <div className="kpi-title">{title}</div>
    <div className="kpi-value">{value}</div>
    {subtext && <div className="kpi-subtext">{subtext}</div>}
  </div>
)

const StatusPill = ({ status }) => {
  const map = {
    novo: { label: 'Novo', tone: 'info' },
    em_analise: { label: 'Em Análise', tone: 'warning' },
    aguardando_peca: { label: 'Aguardando Peça', tone: 'neutral' },
    resolvido: { label: 'Resolvido', tone: 'success' },
    nao_resolvido: { label: 'Não Resolvido', tone: 'danger' },
    fechado: { label: 'Fechado', tone: 'neutral' }
  }
  const { label, tone } = map[status] || { label: status, tone: 'neutral' }
  return <span className="pill" data-tone={tone}>{label}</span>
}

const PriorityPill = ({ priority }) => {
  const map = {
    baixa: { label: 'Baixa', tone: 'neutral' }, // ou info
    media: { label: 'Média', tone: 'warning' }, // amarelo
    alta: { label: 'Alta', tone: 'orange' }, // laranja (definir no css se não tiver)
    critica: { label: 'Crítica', tone: 'danger' } // vermelho
  }
  const { label, tone } = map[priority] || { label: priority, tone: 'neutral' }
  // Hack para cores específicas se o CSS global não tiver 'orange'
  const style = tone === 'orange' ? { background: 'rgba(249, 115, 22, 0.1)', color: '#f97316', border: '1px solid rgba(249, 115, 22, 0.2)' } : {}
  
  return <span className="pill" data-tone={tone} style={style}>{label}</span>
}

const VolumeChart = ({ data }) => {
  const max = Math.max(...data.map(d => d.count), 1)
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', height: 160, gap: 4, paddingTop: 20 }}>
      {data.map((d, i) => (
        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
          <div 
            style={{ 
              width: '80%', 
              height: `${(d.count / max) * 100}%`, 
              background: d.count > 0 ? 'var(--primary)' : 'var(--border-light)',
              borderRadius: '4px 4px 0 0',
              opacity: d.count > 0 ? 0.8 : 0.3,
              minHeight: 4,
              transition: 'all 0.3s'
            }} 
            title={`${d.count} chamados às ${d.hour}h`}
          />
          <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>
            {i % 3 === 0 ? `${i}h` : ''}
          </span>
        </div>
      ))}
    </div>
  )
}

export default function DashboardPage() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    getDashboard()
      .then(setData)
      .catch((err) => {
        console.error('Dashboard error:', err)
        setError(err.message || 'Erro desconhecido ao carregar dashboard')
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="card p-8 text-center">Carregando dashboard...</div>
  if (error) return (
    <div className="card p-8 text-center text-danger">
      <h3 className="font-bold text-lg mb-2">Erro ao carregar dashboard</h3>
      <p className="font-mono bg-muted/10 p-4 rounded text-sm text-left overflow-auto">{error}</p>
      <button onClick={() => window.location.reload()} className="btn-primary mt-4">Tentar Novamente</button>
    </div>
  )
  if (!data) return <EmptyState title="Sem dados" />

  return (
    <div className="dashboard-container">
      {/* Header da Página */}
      <div className="dashboard-header mb-6">
        <div>
          <h1 className="title text-2xl">Visão Geral</h1>
          <p className="subtitle">Monitoramento em tempo real</p>
        </div>
        <div className="flex gap-3">
          <Link className="btn-secondary" to="/chamados">Ver chamados</Link>
          <Link className="btn-primary" to="/chamados/novo">+ Novo chamado</Link>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <KpiCard title="Em Aberto" value={data.open} subtext="Novos chamados" color="primary" />
        <KpiCard title="Pendentes" value={data.pending} subtext="Em análise / Aguardando" color="warning" />
        <KpiCard title="Resolvidos Hoje" value={data.resolved_today} subtext="Eficiência diária" color="success" />
        <KpiCard title="Risco SLA" value={data.sla_risk.length} subtext="Atenção necessária" color="danger" />
      </div>

      <div className="dashboard-grid mb-6" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24 }}>
        
        {/* Coluna Principal */}
        <div className="flex flex-col gap-6">
          
          {/* Fila de Chamados Recentes */}
          <div className="card">
            <div className="card-header flex justify-between items-center p-4 border-b border-light">
              <h3 className="font-semibold">Chamados Recentes</h3>
              <Link to="/chamados" className="text-sm text-primary hover:underline">Ver todos</Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted/10 text-muted">
                  <tr>
                    <th className="p-3">ID</th>
                    <th className="p-3">Loja / Cliente</th>
                    <th className="p-3">Prioridade</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Técnico</th>
                    <th className="p-3 text-right">Aberto há</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recent_tickets.map(t => (
                    <tr key={t.id} className="border-b border-light hover:bg-muted/5">
                      <td className="p-3 font-mono" data-label="ID">#{t.id}</td>
                      <td className="p-3 font-medium" data-label="Loja">{t.store || 'N/A'}</td>
                      <td className="p-3" data-label="Prioridade"><PriorityPill priority={t.priority} /></td>
                      <td className="p-3" data-label="Status"><StatusPill status={t.status} /></td>
                      <td className="p-3 text-muted" data-label="Técnico">{t.technician || '-'}</td>
                      <td className="p-3 text-right text-muted" data-label="Aberto há">
                        {Math.floor((new Date() - new Date(t.created_at)) / (1000 * 60 * 60))}h
                      </td>
                    </tr>
                  ))}
                  {data.recent_tickets.length === 0 && (
                    <tr><td colSpan="6" className="p-6 text-center text-muted">Nenhum chamado recente.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Gráfico de Volume */}
          <div className="card p-4">
            <h3 className="font-semibold mb-4">Volume de Chamados (Por Hora)</h3>
            <VolumeChart data={data.volume_by_hour} />
          </div>

        </div>

        {/* Coluna Lateral */}
        <div className="flex flex-col gap-6">
          
          {/* SLA em Risco */}
          <div className="card border-danger/20">
            <div className="card-header p-4 border-b border-light bg-danger/5">
              <h3 className="font-semibold text-danger">SLA em Risco</h3>
            </div>
            <div className="p-2">
              {data.sla_risk.length === 0 ? (
                <div className="p-4 text-center text-muted text-sm">Tudo sob controle! 🎉</div>
              ) : (
                data.sla_risk.map(t => (
                  <div key={t.id} className="p-3 border-b border-light last:border-0 flex justify-between items-center">
                    <div>
                      <div className="font-mono text-xs text-muted">#{t.id}</div>
                      <div className="text-sm font-medium">{t.store}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-bold text-danger">
                        {t.hoursLeft < 0 ? 'VENCIDO' : `${t.hoursLeft.toFixed(1)}h restam`}
                      </div>
                      <div className="text-xs text-muted capitalize">{t.priority}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Produtividade */}
          <div className="card">
            <div className="card-header p-4 border-b border-light">
              <h3 className="font-semibold">Produtividade (Hoje)</h3>
            </div>
            <div className="p-2">
              {data.productivity.length === 0 ? (
                <div className="p-4 text-center text-muted text-sm">Nenhuma resolução hoje.</div>
              ) : (
                data.productivity.map((p, i) => (
                  <div key={i} className="p-3 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                        {p.name[0]}
                      </div>
                      <span className="text-sm font-medium">{p.name}</span>
                    </div>
                    <div className="text-sm">
                      <span className="font-bold text-success">{p.resolved_today}</span>
                      <span className="text-muted text-xs ml-1">/ {p.total}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      </div>

      <style>{`
        .kpi-card { padding: 20px; display: flex; flex-direction: column; gap: 4px; }
        .kpi-title { font-size: 14px; color: var(--text-muted); font-weight: 500; }
        .kpi-value { font-size: 28px; font-weight: 700; color: var(--text-main); }
        .kpi-subtext { font-size: 12px; opacity: 0.7; }
        
        .grid-cols-4 { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); }
        .flex-col { flex-direction: column; }
        .gap-6 { gap: 24px; }
        .gap-4 { gap: 16px; }
        .gap-3 { gap: 12px; }
        .mb-6 { margin-bottom: 24px; }
        .mb-4 { margin-bottom: 16px; }
        .p-4 { padding: 16px; }
        .p-3 { padding: 12px; }
        .p-2 { padding: 8px; }
        .w-full { width: 100%; }
        .text-sm { font-size: 14px; }
        .text-xs { font-size: 12px; }
        .font-bold { font-weight: 700; }
        .font-semibold { font-weight: 600; }
        .font-medium { font-weight: 500; }
        .font-mono { font-family: monospace; }
        .text-right { text-align: right; }
        .text-center { text-align: center; }
        .text-muted { color: var(--text-muted); }
        .text-danger { color: var(--danger); }
        .text-success { color: var(--success); }
        .bg-muted\\/10 { background: rgba(255,255,255,0.05); }
        .bg-danger\\/5 { background: rgba(239, 68, 68, 0.05); }
        .border-b { border-bottom-width: 1px; }
        .border-light { border-color: var(--border-light); }
        
        @media (max-width: 1024px) {
          .dashboard-grid { grid-template-columns: 1fr !important; }
        }

        @media (max-width: 768px) {
          .grid-cols-4 { grid-template-columns: 1fr 1fr; }
          
          /* Responsive Table (Card View) */
          table, thead, tbody, th, td, tr { display: block; }
          thead tr { position: absolute; top: -9999px; left: -9999px; }
          tr { border: 1px solid var(--border-light); border-radius: 8px; margin-bottom: 12px; background: rgba(255,255,255,0.02); }
          td { border: none; border-bottom: 1px solid rgba(255,255,255,0.02); position: relative; padding-left: 50%; text-align: right; }
          td:before { position: absolute; top: 16px; left: 16px; width: 45%; white-space: nowrap; text-align: left; font-weight: 600; color: var(--text-muted); content: attr(data-label); }
          td:last-child { border-bottom: none; }
          
          .kpi-value { font-size: 24px; }
        }
    </div>
  )
}
