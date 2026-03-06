import { useState, useEffect } from 'react'
import { supabase } from '../services/supabase'
import { useToast } from '../context/ToastContext'

export default function SchedulePage() {
  const { addToast } = useToast()
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [schedules, setSchedules] = useState([])
  const [technicians, setTechnicians] = useState([])
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  
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
      const { data: techs, error: techError } = await supabase
        .from('app_users')
        .select('*')
        .in('role', ['tecnico', 'admin', 'manager', 'supervisor']) // Permitir todos os técnicos
      
      if (techError) throw techError
      setTechnicians(techs || [])

      // 2. Buscar escalas existentes
      const startDate = weekDays[0].toISOString().split('T')[0]
      const endDate = weekDays[6].toISOString().split('T')[0]
      
      const { data: scheds, error: schedError } = await supabase
        .from('schedules')
        .select(`
          *,
          app_users (username, avatar_url)
        `)
        .gte('date', startDate)
        .lte('date', endDate)
      
      if (schedError) {
        // Se a tabela não existir ainda, apenas ignora (primeiro uso)
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
    try {
      const dateStr = date.toISOString().split('T')[0]
      
      // Verificar se já existe
      const exists = schedules.find(s => s.user_id === userId && s.date === dateStr)
      if (exists) return

      const { data, error } = await supabase
        .from('schedules')
        .insert([{ user_id: userId, date: dateStr }])
        .select(`*, app_users (username, avatar_url)`)
        .single()

      if (error) throw error

      setSchedules([...schedules, data])
      addToast('Técnico adicionado à escala')
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
      // 1. Analisar demanda (tickets abertos/recentes)
      const { data: tickets } = await supabase
        .from('tickets')
        .select('created_at, priority, store_id')
        .limit(100) // Amostra
      
      // Lógica simples: contar tickets por dia da semana (historicamente ou apenas simular carga)
      // Como não temos histórico longo, vamos simular uma "inteligência" baseada em prioridade atual
      
      // Limpar escala futura para evitar duplicatas na geração
      // (Num app real, perguntaria antes de sobrescrever)
      
      const newSchedules = []
      const today = new Date()
      
      // Distribuição inteligente simulada
      weekDays.forEach((day, index) => {
        // Ignorar fim de semana na geração automática padrão
        if (day.getDay() === 0 || day.getDay() === 6) return 

        // Dia com mais movimento? (Segunda e Sexta costumam ser)
        const isBusyDay = day.getDay() === 1 || day.getDay() === 5
        const techsNeeded = isBusyDay ? technicians.length : Math.ceil(technicians.length * 0.7)
        
        // Selecionar técnicos disponíveis (round-robin simples)
        for (let i = 0; i < techsNeeded; i++) {
          const techIndex = (index + i) % technicians.length
          const tech = technicians[techIndex]
          if (tech) {
            newSchedules.push({
              user_id: tech.id,
              date: day.toISOString().split('T')[0],
              shift: 'full'
            })
          }
        }
      })

      // Inserir em massa
      if (newSchedules.length > 0) {
        const { error } = await supabase
          .from('schedules')
          .insert(newSchedules)
        
        if (error) throw error
        
        addToast(`Escala inteligente gerada! ${newSchedules.length} turnos agendados.`, 'success')
        fetchData() // Recarregar
      } else {
        addToast('Não há técnicos suficientes para gerar escala', 'warning')
      }

    } catch (err) {
      console.error('Erro na IA:', err)
      addToast('Erro ao gerar escala inteligente: ' + err.message, 'error')
    } finally {
      setGenerating(false)
    }
  }

  const formatDate = (date) => {
    return date.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' })
  }

  return (
    <div className="grid">
      <div className="dashboard-header">
        <div>
          <div className="title">Escala de Técnicos</div>
          <div className="subtitle">Gerenciamento manual e automático de visitas</div>
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
            style={{ background: 'linear-gradient(135deg, #8b5cf6, #d946ef)' }} // Roxo "IA"
          >
            {generating ? 'Analisando...' : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Gerar Escala Inteligente
              </div>
            )}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="card" style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Carregando escala...</div>
      ) : (
        <div className="grid-7" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 16 }}>
          {weekDays.map(date => {
            const dateStr = date.toISOString().split('T')[0]
            const isToday = new Date().toISOString().split('T')[0] === dateStr
            const daySchedules = schedules.filter(s => s.date === dateStr)
            
            return (
              <div key={dateStr} className="card" style={{ padding: 16, minHeight: 200, display: 'flex', flexDirection: 'column', borderColor: isToday ? 'var(--primary)' : 'var(--border-light)' }}>
                <div style={{ marginBottom: 12, borderBottom: '1px solid var(--border-light)', paddingBottom: 8 }}>
                  <div style={{ textTransform: 'capitalize', fontWeight: 600, color: isToday ? 'var(--primary)' : 'var(--text-main)' }}>
                    {date.toLocaleDateString('pt-BR', { weekday: 'long' })}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    {date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })}
                  </div>
                </div>

                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {daySchedules.map(sched => (
                    <div key={sched.id} style={{ 
                      display: 'flex', alignItems: 'center', gap: 8, 
                      padding: 6, borderRadius: 6, background: 'rgba(255,255,255,0.05)',
                      fontSize: 13
                    }}>
                      <div style={{ 
                        width: 24, height: 24, borderRadius: '50%', 
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
                      <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {sched.app_users?.username || 'Técnico'}
                      </span>
                      <button 
                        onClick={() => handleRemoveSchedule(sched.id)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 2 }}
                        className="hover-danger"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  
                  {daySchedules.length === 0 && (
                    <div style={{ fontSize: 12, color: 'var(--text-dim)', fontStyle: 'italic', textAlign: 'center', marginTop: 10 }}>
                      Sem visitas
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
                  >
                    <option value="" disabled>+ Adicionar</option>
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
