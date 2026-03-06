import { supabase } from './supabase'
import { mockTickets, mockDashboard } from './mockData'

const useMock = import.meta.env.VITE_USE_MOCK === 'true'

export async function getDashboard() {
  if (useMock) {
    return new Promise(resolve => setTimeout(() => resolve(mockDashboard()), 400))
  }
  
  // Real implementation: Count tickets by status
  // This is a simplified dashboard query. 
  // In a real app, you might want to use RPC (stored procedures) for complex stats.
  
  const { data: tickets, error } = await supabase
    .from('tickets')
    .select('status, priority, created_at')
  
  if (error) throw error

  const open = tickets.filter(t => t.status === 'novo').length
  const pending = tickets.filter(t => ['em_analise', 'aguardando_peca'].includes(t.status)).length
  const resolved_today = tickets.filter(t => 
    t.status === 'resolvido' && 
    new Date(t.created_at).toDateString() === new Date().toDateString()
  ).length
  
  // Basic overdue logic (e.g., older than 3 days and not resolved)
  const threeDaysAgo = new Date()
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3)
  
  const overdue = tickets.filter(t => 
    !['resolvido', 'fechado'].includes(t.status) && 
    new Date(t.created_at) < threeDaysAgo
  ).length

  return {
    open,
    pending,
    resolved_today,
    overdue,
    recent_tickets: tickets.slice(0, 5), // Simplified
    productivity: [], // Would need separate query
    priority_counts: {
      baixa: tickets.filter(t => t.priority === 'baixa').length,
      media: tickets.filter(t => t.priority === 'media').length,
      alta: tickets.filter(t => t.priority === 'alta').length,
      critica: tickets.filter(t => t.priority === 'critica').length
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
  const { data, error } = await supabase
    .from('app_users')
    .select('id, username')
    .in('role', ['tecnico', 'admin', 'supervisor', 'manager']) // Added manager
    
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
