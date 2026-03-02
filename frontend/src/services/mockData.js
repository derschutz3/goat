export const mockTickets = [
  { id: 101, title: 'Impressora não imprime', status: 'aberto', priority: 'alta', store: 'Loja 1', created_at: '2026-02-26T10:00:00Z' },
  { id: 102, title: 'PDV reiniciando sozinho', status: 'em_andamento', priority: 'critica', store: 'Loja 2', created_at: '2026-02-26T09:00:00Z' },
  { id: 103, title: 'Câmera sem sinal', status: 'resolvido', priority: 'normal', store: 'Loja 3', created_at: '2026-02-25T16:40:00Z' }
]

export function mockDashboard() {
  const open = mockTickets.filter(t => t.status === 'aberto').length
  const pending = mockTickets.filter(t => t.status === 'em_andamento').length
  const overdue = 0
  const resolved_today = mockTickets.filter(t => t.status === 'resolvido').length
  const priority_counts = {
    baixa: mockTickets.filter(t => t.priority === 'baixa').length,
    media: mockTickets.filter(t => t.priority === 'media').length,
    alta: mockTickets.filter(t => t.priority === 'alta').length,
    critica: mockTickets.filter(t => t.priority === 'critica').length
  }
  return { open, pending, overdue, resolved_today, priority_counts, recent_tickets: [], productivity: [] }
}
