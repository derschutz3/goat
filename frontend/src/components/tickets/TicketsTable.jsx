import { Link } from 'react-router-dom'
import StatusBadge from '../common/StatusBadge'

export default function TicketsTable({ items }) {
  return (
    <div className="card">
      <div style={{ display: 'grid', gap: 12 }}>
        {items.map(ticket => (
          <div key={ticket.id} className="ticket-row">
            <div>
              <Link to={`/chamados/${ticket.id}`} style={{ color: 'var(--accent-2)', textDecoration: 'none', fontWeight: 600 }}>
                #{ticket.id} {ticket.title}
              </Link>
              <div className="subtitle" style={{ marginTop: 4 }}>{ticket.store}</div>
            </div>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <StatusBadge label={ticket.status} />
              <span className="subtitle" style={{ textTransform: 'capitalize' }}>{ticket.priority}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
