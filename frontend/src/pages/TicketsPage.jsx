import { useEffect, useMemo, useState } from 'react'
import { getTickets } from '../services/ticketService'
import TicketsFilterBar from '../components/tickets/TicketsFilterBar'
import TicketsTable from '../components/tickets/TicketsTable'
import EmptyState from '../components/common/EmptyState'

export default function TicketsPage() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filters, setFilters] = useState({
    status: 'todos',
    priority: 'todas',
    search: ''
  })

  useEffect(() => {
    let active = true
    getTickets()
      .then(result => active && setItems(result))
      .catch(() => active && setError('Erro ao carregar chamados'))
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [])

  const filtered = useMemo(() => {
    return items.filter(ticket => {
      const matchStatus = filters.status === 'todos' || ticket.status === filters.status
      const matchPriority = filters.priority === 'todas' || ticket.priority === filters.priority
      const searchable = `${ticket.id} ${ticket.title} ${ticket.store}`.toLowerCase()
      const matchSearch = searchable.includes(filters.search.toLowerCase())
      return matchStatus && matchPriority && matchSearch
    })
  }, [items, filters])

  if (loading) {
    return <div className="card">Carregando chamados...</div>
  }

  if (error) {
    return <div className="card">{error}</div>
  }

  return (
    <div className="grid">
      <TicketsFilterBar
        filters={filters}
        onSearch={search => setFilters(prev => ({ ...prev, search }))}
        onChange={(field, value) => setFilters(prev => ({ ...prev, [field]: value }))}
      />
      {filtered.length === 0 ? (
        <EmptyState title="Nenhum chamado encontrado" description="Ajuste os filtros para visualizar resultados." />
      ) : (
        <TicketsTable items={filtered} />
      )}
    </div>
  )
}
