import { useState, useEffect } from 'react'
import { supabase } from '../services/supabase'
import { useToast } from '../context/ToastContext'

export default function SchedulePage() {
  const { addToast } = useToast()
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [schedules, setSchedules] = useState([])
  const [technicians, setTechnicians] = useState([])
  const [stores, setStores] = useState([])
  const [editingCell, setEditingCell] = useState(null) // { techId, dateStr }
  const [manualStore, setManualStore] = useState('')
  
  // Gerar datas da semana atual/próxima (Segunda a Sexta ou Sábado)
  const getNextDays = (days = 5) => {
    const dates = []
    const today = new Date()
    // Find next Monday if today is weekend, otherwise start from today or this week's Monday
    // For simplicity, let's show next 5 days starting from today for now, or fixed Mon-Fri logic
    // Implementing fixed logic: Start from today
    for (let i = 0; i < days; i++) {
      const d = new Date(today)
      d.setDate(today.getDate() + i)
      dates.push(d)
    }
    return dates
  }
  
  const weekDays = getNextDays(5) // Show 5 days (matrix columns)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      
      // 1. Buscar técnicos (APENAS quem pode atuar como técnico)
      // Strict filter: only users with role 'tecnico' should appear in rows? 
      // User said "Usuarios que nao tem o sub usuario tecnico, nao irao aparecer".
      // But also said admin/manager can act as techs.
      // Let's stick to the roles that CAN be techs.
      const { data: techs } = await supabase
        .from('app_users')
        .select('*')
        .in('role', ['tecnico', 'admin', 'manager', 'supervisor'])
        .order('username')
      
      setTechnicians(techs || [])

      // 2. Buscar lojas
      const { data: storesData } = await supabase
        .from('stores')
        .select('id, name')
        .eq('active', true)
        .order('name')
      
      setStores(storesData || [])

      // 3. Buscar escalas existentes
      const startDate = weekDays[0].toISOString().split('T')[0]
      const endDate = weekDays[weekDays.length - 1].toISOString().split('T')[0]
      
      const { data: scheds, error: schedError } = await supabase
        .from('schedules')
        .select(`
          *,
          app_users (username, avatar_url),
          stores (name)
        `)
        .gte('date', startDate)
        .lte('date', endDate)
      
      if (schedError) {
        console.warn('Tabela schedules pode não existir', schedError)
        setSchedules([])
      } else {
        setSchedules(scheds || [])
      }

    } catch (err) {
      console.error('Erro ao carregar dados:', err)
      addToast('Erro ao carregar escala', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleAddSchedule = async (techId, dateStr) => {
    if (!manualStore) {
      addToast('Selecione uma loja primeiro', 'error')
      return
    }

    try {
      const { data, error } = await supabase
        .from('schedules')
        .insert([{ user_id: techId, date: dateStr, store_id: manualStore }])
        .select(`*, app_users (username, avatar_url), stores (name)`)
        .single()

      if (error) throw error

      setSchedules([...schedules, data])
      addToast('Agendado')
      setEditingCell(null) // Close popover
    } catch (err) {
      addToast('Erro ao adicionar: ' + err.message, 'error')
    }
  }

  const handleRemoveSchedule = async (scheduleId) => {
    try {
      const { error } = await supabase
        .from('schedules')
        .delete()
        .eq('id', scheduleId)

      if (error) throw error

      setSchedules(schedules.filter(s => s.id !== scheduleId))
      addToast('Removido')
    } catch (err) {
      addToast('Erro ao remover', 'error')
    }
  }

  const generateSmartSchedule = async () => {
    setGenerating(true)
    try {
      // 1. Analisar demanda por loja (tickets recentes)
      const { data: tickets } = await supabase
        .from('tickets')
        .select('store_id')
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()) 

      const demandMap = {}
      tickets?.forEach(t => {
        if (t.store_id) {
          demandMap[t.store_id] = (demandMap[t.store_id] || 0) + 1
        }
      })

      const rankedStores = Object.entries(demandMap)
        .sort(([, a], [, b]) => b - a)
        .map(([id]) => parseInt(id))

      const targetStores = rankedStores.length > 0 
        ? rankedStores 
        : stores.map(s => s.id)

      const newSchedules = []
      
      // Distribuição inteligente: Load Balancing
      // Objetivo: Preencher a grade (Techs x Days) distribuindo as lojas prioritárias
      
      let storeCursor = 0
      
      // Iterar sobre dias (Colunas)
      weekDays.forEach((day) => {
        // Ignorar fim de semana se quiser, mas vamos assumir dias úteis
        if (day.getDay() === 0 || day.getDay() === 6) return 

        const dateStr = day.toISOString().split('T')[0]

        // Iterar sobre técnicos (Linhas)
        technicians.forEach((tech) => {
          // Round-robin nas lojas
          const storeId = targetStores[storeCursor % targetStores.length]
          storeCursor++

          if (storeId) {
            newSchedules.push({
              user_id: tech.id,
              date: dateStr,
              store_id: storeId,
              shift: 'full'
            })
          }
        })
      })

      if (newSchedules.length > 0) {
        // Opcional: Limpar semana atual antes de inserir?
        // Por segurança, apenas insere. O usuário remove o que não quer.
        
        const { error } = await supabase
          .from('schedules')
          .insert(newSchedules)
        
        if (error) throw error
        
        addToast(`Escala gerada e distribuída!`, 'success')
        fetchData()
      } else {
        addToast('Não foi possível gerar escala', 'warning')
      }

    } catch (err) {
      console.error('Erro na IA:', err)
      addToast('Erro: ' + err.message, 'error')
    } finally {
      setGenerating(false)
    }
  }

  // Helper para agrupar
  const getSchedulesForCell = (techId, dateStr) => {
    return schedules.filter(s => s.user_id === techId && s.date === dateStr)
  }

  return (
    <div className="grid">
      <div className="dashboard-header">
        <div>
          <div className="title">Escala de Visitas</div>
          <div className="subtitle">Planejamento semanal de técnicos nas lojas</div>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button className="btn-secondary" onClick={fetchData} title="Atualizar">
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
          <button 
            className="btn-primary" 
            onClick={generateSmartSchedule}
            disabled={generating || technicians.length === 0}
            style={{ background: 'linear-gradient(135deg, #8b5cf6, #d946ef)' }}
          >
            {generating ? 'Distribuindo...' : 'Gerar Escala Automática'}
          </button>
        </div>
      </div>

      <div style={{ marginBottom: 20, padding: 16, background: 'var(--bg-card)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-muted)' }}>1. Selecione a Loja:</span>
          <select 
            className="select" 
            style={{ width: 220 }}
            value={manualStore}
            onChange={e => setManualStore(e.target.value)}
          >
            <option value="">Selecione...</option>
            {stores.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>2. Clique no ícone de lápis na grade para adicionar a visita</span>
      </div>

      {loading ? (
        <div className="card" style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Carregando grade...</div>
      ) : (
        <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
          <table className="table" style={{ width: '100%', minWidth: 800 }}>
            <thead>
              <tr>
                <th style={{ width: 200, paddingLeft: 24, background: 'var(--bg-app)' }}>Técnico</th>
                {weekDays.map(day => (
                  <th key={day.toISOString()} style={{ textAlign: 'center', background: 'var(--bg-app)' }}>
                    <div style={{ textTransform: 'capitalize' }}>{day.toLocaleDateString('pt-BR', { weekday: 'long' })}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 400 }}>{day.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {technicians.map(tech => (
                <tr key={tech.id}>
                  <td style={{ paddingLeft: 24, verticalAlign: 'middle' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ 
                        width: 36, height: 36, borderRadius: '50%', 
                        background: 'var(--primary)', color: 'white',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 14, fontWeight: 'bold'
                      }}>
                        {tech.avatar_url ? (
                          <img src={tech.avatar_url} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                        ) : (
                          (tech.username?.[0] || '?').toUpperCase()
                        )}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600 }}>{tech.username}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'capitalize' }}>{tech.role}</div>
                      </div>
                    </div>
                  </td>
                  
                  {weekDays.map(day => {
                    const dateStr = day.toISOString().split('T')[0]
                    const cellSchedules = getSchedulesForCell(tech.id, dateStr)
                    const isEditing = editingCell?.techId === tech.id && editingCell?.dateStr === dateStr

                    return (
                      <td key={dateStr} style={{ verticalAlign: 'top', height: 100, padding: 8, background: 'rgba(255,255,255,0.01)', borderRight: '1px solid var(--border-light)' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, height: '100%' }}>
                          {cellSchedules.map(s => (
                            <div key={s.id} style={{ 
                              background: 'var(--bg-app)', border: '1px solid var(--border-light)', 
                              borderRadius: 6, padding: '6px 8px', fontSize: 12,
                              display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                            }}>
                              <span style={{ fontWeight: 500 }}>{s.stores?.name}</span>
                              <button 
                                onClick={() => handleRemoveSchedule(s.id)}
                                style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 0 }}
                                className="hover-danger"
                              >
                                ×
                              </button>
                            </div>
                          ))}
                          
                          {/* Botão de Adicionar (Lápis/Mais) */}
                          <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'flex-end' }}>
                            <button
                              onClick={() => {
                                if (manualStore) {
                                  handleAddSchedule(tech.id, dateStr)
                                } else {
                                  addToast('Selecione uma loja no topo primeiro', 'info')
                                }
                              }}
                              style={{ 
                                background: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: '50%', 
                                width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                cursor: 'pointer', color: 'var(--text-muted)', transition: 'all 0.2s'
                              }}
                              title="Adicionar Loja Selecionada"
                              className="hover-primary"
                            >
                              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </td>
                    )
                  })}
                </tr>
              ))}
              {technicians.length === 0 && (
                <tr>
                  <td colSpan={weekDays.length + 1} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
                    Nenhum técnico disponível para a escala.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
