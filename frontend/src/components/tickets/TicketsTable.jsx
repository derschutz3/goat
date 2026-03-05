import { Link } from 'react-router-dom'
import StatusBadge from '../common/StatusBadge'

export default function TicketsTable({ items }) {
  const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'critica': return 'var(--danger)';
      case 'alta': return 'var(--warning)';
      case 'media': return 'var(--primary)';
      case 'baixa': return 'var(--success)';
      default: return 'var(--text-muted)';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="tickets-list">
      {items.map(ticket => (
        <div key={ticket.id} className="ticket-card-item">
          <div className="ticket-card-left">
            <div 
              className="priority-indicator" 
              style={{ background: getPriorityColor(ticket.priority) }}
              title={`Prioridade: ${ticket.priority}`}
            />
            <div className="ticket-info">
              <div className="ticket-header">
                <span className="ticket-id">#{ticket.id}</span>
                <Link to={`/chamados/${ticket.id}`} className="ticket-title">
                  {ticket.title}
                </Link>
              </div>
              <div className="ticket-meta">
                <span className="ticket-store">
                  <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  {ticket.store}
                </span>
                <span className="ticket-date">
                  <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {formatDate(ticket.created_at)}
                </span>
              </div>
            </div>
          </div>
          
          <div className="ticket-card-right">
            <div className="ticket-tags">
               {ticket.category && <span className="category-tag">{ticket.category}</span>}
            </div>
            <div className="ticket-status-wrapper">
               <StatusBadge label={ticket.status} />
            </div>
            <Link to={`/chamados/${ticket.id}`} className="btn-icon">
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      ))}
    </div>
  )
}
