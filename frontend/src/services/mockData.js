export const mockStores = [
  { id: 1, name: 'GSM1 - LAGOA' },
  { id: 2, name: 'GSM2 - PRAÇA' },
  { id: 3, name: 'GSM3 - CONDE' },
  { id: 4, name: 'GSM4 - IPANEMA' },
  { id: 5, name: 'GSM5 - COPA' },
  { id: 6, name: 'GSM6 - BARRAMARES' },
  { id: 7, name: 'GSM7 - ICARAI' },
  { id: 8, name: 'GSM8 - RECREIO' },
  { id: 9, name: 'GSM9 - NOVA IGUAÇU' },
  { id: 10, name: 'GSM10 - GILKA' },
  { id: 11, name: 'GSM11 - DARK/SPIRIT' },
  { id: 12, name: 'GSM12 - NA BRASA RECREIO' },
  { id: 13, name: 'GSM13 - SB FREGUESIA' },
  { id: 14, name: 'GSM14 - ABOLIÇÃO' },
  { id: 15, name: 'GSM15 - VENTANIA' },
  { id: 16, name: 'GSM16 - SB PEPE' },
  { id: 17, name: 'GSM17 - MANDALA' },
  { id: 18, name: 'GSM200 - NA BRASA NI' },
  { id: 19, name: 'GSM201 - NA BRASA ABOLIÇÃO' },
  { id: 20, name: 'GSM18 - SB CAXIAS' },
  { id: 21, name: 'GSM19 - SÃO FRANCISCO' },
  { id: 22, name: 'GSM20 - BACKER' },
  { id: 23, name: 'GSM21 - URUGUAI' },
  { id: 24, name: 'GSM99 - ESCRITORIO' },
  { id: 25, name: 'GSMDD - FABRICA' }
]

export const mockTickets = [
  { id: 101, title: 'Impressora não imprime', status: 'aberto', priority: 'alta', store: 'GSM1 - LAGOA', created_at: '2026-02-26T10:00:00Z' },
  { id: 102, title: 'PDV reiniciando sozinho', status: 'em_andamento', priority: 'critica', store: 'GSM2 - PRAÇA', created_at: '2026-02-26T09:00:00Z' },
  { id: 103, title: 'Câmera sem sinal', status: 'resolvido', priority: 'normal', store: 'GSM3 - CONDE', created_at: '2026-02-25T16:40:00Z' }
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
