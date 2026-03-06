import { supabase } from './supabase'
import { mockTickets, mockDashboard } from './mockData'

const useMock = import.meta.env.VITE_USE_MOCK === 'true'

export async function getDashboard() {
  if (useMock) {
    return new Promise(resolve => setTimeout(() => resolve(mockDashboard()), 400))
  }
  
  // 1. Fetch tickets (raw)
  const { data: tickets, error } = await supabase
    .from('tickets')
    .select('id, status, priority, created_at, technician_id, store_id')
    
  if (error) throw error

  const today = new Date().toDateString()
  const now = new Date()

  // 1.1 Fetch auxiliary data for mapping (avoid complex joins that might fail)
  const { data: users } = await supabase.from('app_users').select('id, username')
  const { data: stores } = await supabase.from('stores').select('id, name')

  const userMap = (users || []).reduce((acc, u) => ({ ...acc, [u.id]: u.username }), {})
  const storeMap = (stores || []).reduce((acc, s) => ({ ...acc, [s.id]: s.name }), {})

  // 1.2 Enrich tickets
  const enrichedTickets = tickets.map(t => ({
    ...t,
    technician: t.technician_id ? { username: userMap[t.technician_id] || 'Desconhecido' } : null,
    store: t.store_id ? { name: storeMap[t.store_id] || 'Loja removida' } : null
  }))

  // Use enrichedTickets for calculations
  const open = enrichedTickets.filter(t => t.status === 'novo').length
  const pending = enrichedTickets.filter(t => ['em_analise', 'aguardando_peca'].includes(t.status)).length
  const resolved_today = enrichedTickets.filter(t => 
    t.status === 'resolvido' && 
    new Date(t.created_at).toDateString() === today
  ).length

  // 3. SLA Risk Logic
  // Critica: 4h, Alta: 8h, Media: 24h, Baixa: 48h
  const slaHours = { critica: 4, alta: 8, media: 24, baixa: 48 }
  
  const ticketsWithSLA = enrichedTickets.map(t => {
    if (['resolvido', 'fechado'].includes(t.status)) return { ...t, sla_status: 'ok' }
    
    const created = new Date(t.created_at)
    const deadline = new Date(created.getTime() + (slaHours[t.priority] || 48) * 60 * 60 * 1000)
    const timeLeft = deadline - now
    const hoursLeft = timeLeft / (1000 * 60 * 60)
    
    let sla_status = 'ok'
    if (timeLeft < 0) sla_status = 'overdue'
    else if (hoursLeft < 2) sla_status = 'risk' // Less than 2h warning
    
    return { ...t, deadline, hoursLeft, sla_status }
  })

  const sla_risk = ticketsWithSLA
    .filter(t => ['risk', 'overdue'].includes(t.sla_status) && !['resolvido', 'fechado'].includes(t.status))
    .sort((a, b) => a.hoursLeft - b.hoursLeft)
    .slice(0, 5)

  // 4. Productivity (Technicians)
  const techStats = {}
  enrichedTickets.forEach(t => {
    if (t.technician_id && userMap[t.technician_id]) {
      const name = userMap[t.technician_id]
      if (!techStats[name]) techStats[name] = { name, total: 0, resolved_today: 0 }
      
      techStats[name].total++
      if (t.status === 'resolvido' && new Date(t.created_at).toDateString() === today) {
        techStats[name].resolved_today++
      }
    }
  })
  const productivity = Object.values(techStats).sort((a, b) => b.resolved_today - a.resolved_today)

  // 5. Volume by Hour (Today)
  const volumeByHour = Array(24).fill(0).map((_, i) => ({ hour: i, count: 0 }))
  enrichedTickets.forEach(t => {
    const d = new Date(t.created_at)
    if (d.toDateString() === today) {
      volumeByHour[d.getHours()].count++
    }
  })

  // 6. Recent Tickets (Rich data)
  const recent_tickets = enrichedTickets
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 7)
    .map(t => ({
      ...t,
      store: t.store?.name,
      technician: t.technician?.username
    }))

  return {
    open,
    pending,
    resolved_today,
    sla_risk, // Replaces simple 'overdue'
    recent_tickets,
    productivity,
    volume_by_hour: volumeByHour, // Only show hours with data or full day? Full day is better for chart.
    priority_counts: {
      baixa: enrichedTickets.filter(t => t.priority === 'baixa').length,
      media: enrichedTickets.filter(t => t.priority === 'media').length,
      alta: enrichedTickets.filter(t => t.priority === 'alta').length,
      critica: enrichedTickets.filter(t => t.priority === 'critica').length
    }
  }
}

export async function getTickets() {
  if (useMock) {
    return new Promise(resolve => setTimeout(() => resolve(mockTickets), 400))
  }
  
  const { data, error } = await supabase
    .from('tickets')
    .select(`
      *,
      store:stores(name),
      requester:profiles!requester_id(username),
      technician:profiles!technician_id(username)
    `)
    .order('created_at', { ascending: false })
    
  if (error) throw error
  
  // Transform to match existing frontend expectations
  return data.map(t => ({
    ...t,
    store: t.store?.name,
    requester: t.requester?.username,
    technician: t.technician?.username
  }))
}

export async function getTicketById(id) {
  if (useMock) {
    const ticket = mockTickets.find(item => String(item.id) === String(id))
    return new Promise(resolve => setTimeout(() => resolve(ticket), 400))
  }
  
  const { data, error } = await supabase
    .from('tickets')
    .select(`
      *,
      store:stores(name),
      requester:profiles!requester_id(username),
      technician:profiles!technician_id(username)
    `)
    .eq('id', id)
    .single()
    
  if (error) throw error
  
  return {
    ...data,
    store: data.store?.name,
    requester: data.requester?.username,
    technician: data.technician?.username
  }
}

export async function createTicket(payload) {
  if (useMock) {
    return new Promise(resolve => setTimeout(() => resolve({ ok: true }), 500))
  }
  
  const { data: { user } } = await supabase.auth.getUser()
  
  const { data, error } = await supabase
    .from('tickets')
    .insert([{
      title: payload.title,
      description: payload.description,
      priority: payload.priority,
      store_id: payload.store_id,
      category_id: payload.category_id,
      technician_id: payload.technician_id || null,
      requester_id: user.id
    }])
    .select()
    .single()
    
  if (error) throw error
  return data
}

export async function updateTicket(id, payload) {
  if (useMock) {
    return new Promise(resolve => setTimeout(() => resolve({ ok: true }), 500))
  }
  
  const { data, error } = await supabase
    .from('tickets')
    .update(payload)
    .eq('id', id)
    .select()
    
  if (error) throw error
  return data
}

export async function getStores() {
  const { data, error } = await supabase
    .from('stores')
    .select('*')
    .eq('active', true)
    
  if (error) throw error
  return data
}

export async function getCategories() {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('active', true)
    
  if (error) throw error
  return data
}

export async function getTechnicians() {
  // Now using app_users instead of profiles
  // Only users with is_tech = true should appear
  const { data, error } = await supabase
    .from('app_users')
    .select('id, username')
    .eq('is_tech', true)
    
  if (error) throw error
  return data
}

export async function getTicketEvents(id) {
  const { data, error } = await supabase
    .from('ticket_events')
    .select(`
      *,
      user:profiles(username)
    `)
    .eq('ticket_id', id)
    .order('created_at', { ascending: false })
    
  if (error) throw error
  
  return data.map(e => ({
    ...e,
    user: e.user?.username
  }))
}

export async function addTicketComment(id, text) {
  const { data: { user } } = await supabase.auth.getUser()
  
  const { data, error } = await supabase
    .from('ticket_events')
    .insert([{
      ticket_id: id,
      description: text,
      event_type: 'comment',
      user_id: user.id
    }])
    .select()
    .single()
    
  if (error) throw error
  return data
}
