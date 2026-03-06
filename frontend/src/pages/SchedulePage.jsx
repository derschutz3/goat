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
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [manualStore, setManualStore] = useState('')
  
  // Gerar datas da semana atual/próxima
  const getNextDays = (days = 7) => {
    const dates = []
    const today = new Date()
    for (let i = 0; i < days; i++) {
      const d = new Date(today)
      d.setDate(today.getDate() + i)
      dates.push(d)
    }
    return dates
  }
  
  const weekDays = getNextDays(7)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      
      // 1. Buscar técnicos
      const { data: techs } = await supabase
        .from('app_users')
        .select('*')
        .in('role', ['tecnico', 'admin', 'manager', 'supervisor'])
      
      setTechnicians(techs || [])

      // 2. Buscar lojas
      const { data: storesData } = await supabase
        .from('stores')
        .select('id, name')
        .eq('active', true)
      
      setStores(storesData || [])

      // 3. Buscar escalas existentes
      const startDate = weekDays[0].toISOString().split('T')[0]
      const endDate = weekDays[6].toISOString().split('T')[0]
      
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

  const handleAddSchedule = async (userId, date) => {
    if (!manualStore) {
      addToast('Selecione uma loja primeiro', 'error')
      return
    }

    try {
      const dateStr = date.toISOString().split('T')[0]
      
      const { data, error } = await supabase
        .from('schedules')
        .insert([{ user_id: userId, date: dateStr, store_id: manualStore }])
        .select(`*, app_users (username, avatar_url), stores (name)`)
        .single()

      if (error) throw error

      setSchedules([...schedules, data])
      addToast('Técnico escalado com sucesso')
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
      addToast('Removido da escala')
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
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()) // Últimos 30 dias

      // Contar ocorrências por loja
      const demandMap = {}
      tickets?.forEach(t => {
        if (t.store_id) {
          demandMap[t.store_id] = (demandMap[t.store_id] || 0) + 1
        }
      })

      // Ordenar lojas por demanda (maior para menor)
      const rankedStores = Object.entries(demandMap)
        .sort(([, a], [, b]) => b - a)
        .map(([id]) => parseInt(id))

      // Se não houver dados, usar todas as lojas aleatoriamente
      const targetStores = rankedStores.length > 0 
        ? rankedStores 
        : stores.map(s => s.id)

      const newSchedules = []
      
      // Distribuição inteligente
      weekDays.forEach((day, dayIndex) => {
        // Ignorar domingo (0)
        if (day.getDay() === 0) return 

        // Sábado (6) é dia de plantão (menos técnicos)
        const isSaturday = day.getDay() === 6
        const availableTechs = isSaturday 
          ? technicians.slice(0, Math.ceil(technicians.length / 2)) 
          : technicians

        // Atribuir técnicos às lojas mais prioritárias
        availableTechs.forEach((tech, techIndex) => {
          // Round-robin nas lojas prioritárias
          // O técnico 1 vai na loja Top 1, Técnico 2 na Top 2...
          // No dia seguinte, rotaciona para não ficar repetitivo
          const storeIndex = (techIndex + dayIndex) % targetStores.length
          const storeId = targetStores[storeIndex]

          if (storeId) {
            newSchedules.push({
              user_id: tech.id,
              date: day.toISOString().split('T')[0],
              store_id: storeId,
              shift: 'full'
            })
          }
        })
      })

      if (newSchedules.length > 0) {
        const { error } = await supabase
          .from('schedules')
          .insert(newSchedules)
        
        if (error) throw error
        
        addToast(`Escala inteligente gerada baseada na demanda!`, 'success')
        fetchData()
      } else {
        addToast('Não foi possível gerar escala (sem técnicos ou lojas)', 'warning')
      }

    } catch (err) {
      console.error('Erro na IA:', err)
      addToast('Erro ao gerar escala: ' + err.message, 'error')
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="grid">
      <div className="dashboard-header">
        <div>
          <div className="title">Escala de Técnicos</div>
          <div className="subtitle">Gerenciamento de visitas baseado em demanda</div>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button 
            className="btn-secondary" 
            onClick={fetchData}
            title="Atualizar"
          >
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
            {generating ? 'Analisando Demanda...' : 'Gerar Escala Inteligente'}
          </button>
        </div>
      </div>

      <div style={{ marginBottom: 20, padding: 16, background: 'var(--bg-card)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', gap: 16 }}>
        <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-muted)' }}>Configuração Manual:</span>
        <select 
          className="select" 
          style={{ width: 200 }}
          value={manualStore}
          onChange={e => setManualStore(e.target.value)}
        >
          <option value="">Selecione a Loja...</option>
          {stores.map(s => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>← Selecione a loja antes de adicionar um técnico no dia</span>
      </div>

      {loading ? (
        <div className="card" style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Carregando escala...</div>
      ) : (
        <div className="grid-7" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16 }}>
          {weekDays.map(date => {
            const dateStr = date.toISOString().split('T')[0]
            const isToday = new Date().toISOString().split('T')[0] === dateStr
            const daySchedules = schedules.filter(s => s.date === dateStr)
            
            return (
              <div key={dateStr} className="card" style={{ padding: 16, minHeight: 200, display: 'flex', flexDirection: 'column', borderColor: isToday ? 'var(--primary)' : 'var(--border-light)' }}>
                <div style={{ marginBottom: 12, borderBottom: '1px solid var(--border-light)', paddingBottom: 8 }}>
                  <div style={{ textTransform: 'capitalize', fontWeight: 600, color: isToday ? 'var(--primary)' : 'var(--text-main)' }}>
                    {date.toLocaleDateString('pt-BR', { weekday: 'short' })}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    {date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })}
                  </div>
                </div>

                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {daySchedules.map(sched => (
                    <div key={sched.id} style={{ 
                      display: 'flex', flexDirection: 'column', gap: 4,
                      padding: 8, borderRadius: 6, background: 'rgba(255,255,255,0.05)',
                      fontSize: 13, borderLeft: '3px solid var(--accent)'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ 
                          width: 20, height: 20, borderRadius: '50%', 
                          background: 'var(--primary)', color: 'white',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 10, fontWeight: 'bold'
                        }}>
                          {sched.app_users?.avatar_url ? (
                            <img src={sched.app_users.avatar_url} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                          ) : (
                            (sched.app_users?.username?.[0] || '?').toUpperCase()
                          )}
                        </div>
                        <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 500 }}>
                          {sched.app_users?.username}
                        </span>
                        <button 
                          onClick={() => handleRemoveSchedule(sched.id)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 0 }}
                          className="hover-danger"
                        >
                          ×
                        </button>
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <svg width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                        {sched.stores?.name || 'Sem local'}
                      </div>
                    </div>
                  ))}
                  
                  {daySchedules.length === 0 && (
                    <div style={{ fontSize: 12, color: 'var(--text-dim)', fontStyle: 'italic', textAlign: 'center', marginTop: 10 }}>
                      -
                    </div>
                  )}
                </div>

                <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border-light)' }}>
                  <select 
                    className="input" 
                    style={{ padding: '4px 8px', fontSize: 12, width: '100%' }}
                    onChange={(e) => {
                      if (e.target.value) {
                        handleAddSchedule(e.target.value, date)
                        e.target.value = ''
                      }
                    }}
                    value=""
                    disabled={!manualStore}
                  >
                    <option value="" disabled>+ Adicionar Técnico</option>
                    {technicians.map(t => (
                      <option key={t.id} value={t.id} disabled={daySchedules.some(s => s.user_id === t.id)}>
                        {t.username}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
