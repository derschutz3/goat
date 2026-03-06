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
  
  // Gerar datas da semana atual (Segunda a Sábado)
  const getNextDays = (days = 6) => {
    const dates = []
    const today = new Date()
    const currentDay = today.getDay() // 0 = Domingo, 1 = Segunda
    
    // Calcular a segunda-feira desta semana
    // Se for domingo (0), volta 6 dias. Se for outro dia, volta (day - 1)
    const diff = currentDay === 0 ? -6 : 1 - currentDay
    
    const monday = new Date(today)
    monday.setDate(today.getDate() + diff)
    
    for (let i = 0; i < days; i++) {
      const d = new Date(monday)
      d.setDate(monday.getDate() + i)
      dates.push(d)
    }
    return dates
  }
  
  const weekDays = getNextDays(6) // Mostrar 6 dias (Segunda a Sábado)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      
      // 1. Buscar técnicos (quem tem a flag is_tech = true)
      const { data: techs } = await supabase
        .from('app_users')
        .select('*')
        .eq('is_tech', true)
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
      
      // Distribuição inteligente: Load Balancing (Justo)
      // Objetivo: Distribuir lojas prioritárias igualmente entre técnicos ao longo da semana
      
      let storeCursor = 0 // Manter cursor global para rodar todas as lojas
      
      // Iterar sobre dias (Colunas)
      weekDays.forEach((day) => {
        if (day.getDay() === 0) return // Pular domingo

        const dateStr = day.toISOString().split('T')[0]
        const isSaturday = day.getDay() === 6
        
        // Sábado: equipe reduzida (ex: metade da equipe, rotacionando)
        // Lógica simples: Se for sábado, pula técnicos pares/ímpares baseado no dia do mês?
        // Ou assume todos disponíveis por enquanto.
        // Vamos manter todos disponíveis para simplificar a distribuição justa
        
        // Quantas lojas visitar por dia? 
        // Vamos tentar agendar TODAS as lojas prioritárias distribuídas na semana
        // Ou agendar N visitas por técnico.
        
        // Nova Lógica: Para cada técnico disponível, atribuir 1 ou 2 lojas prioritárias neste dia
        technicians.forEach((tech) => {
          // Pegar a próxima loja da lista de prioridade (circular)
          // Mas garantir que lojas diferentes sejam visitadas
          
          // Vamos atribuir 1 visita por técnico por dia para começar (carga leve)
          // Se quiser carga pesada, aumentar loop
          const visitsPerDay = 1 
          
          for(let i=0; i < visitsPerDay; i++) {
             // Round-robin global de lojas para garantir que todas sejam atendidas
             const storeIndex = (storeCursor) % targetStores.length
             const storeId = targetStores[storeIndex]
             storeCursor++
             
             if (storeId) {
                newSchedules.push({
                  user_id: tech.id,
                  date: dateStr,
                  store_id: storeId,
                  shift: 'full'
                })
             }
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
