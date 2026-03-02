import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { addTicketComment, getCategories, getStores, getTechnicians, getTicketById, getTicketEvents, updateTicket } from '../services/ticketService'
import EmptyState from '../components/common/EmptyState'

export default function TicketDetailPage() {
  const { id } = useParams()
  const [ticket, setTicket] = useState(null)
  const [form, setForm] = useState({
    status: '',
    priority: '',
    store_id: '',
    category: '',
    technician_id: '',
    description: '',
    additional_info: ''
  })
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [loadingOptions, setLoadingOptions] = useState(true)
  const [error, setError] = useState('')
  const [saveError, setSaveError] = useState('')
  const [commentError, setCommentError] = useState('')
  const [commentSaving, setCommentSaving] = useState(false)
  const [stores, setStores] = useState([])
  const [categories, setCategories] = useState([])
  const [technicians, setTechnicians] = useState([])
  const [events, setEvents] = useState([])
  const [loadingEvents, setLoadingEvents] = useState(true)
  const [eventsError, setEventsError] = useState('')

  useEffect(() => {
    let active = true
    getTicketById(id)
      .then(result => {
        if (active) {
          setTicket(result)
          setForm({
            status: result?.status || '',
            priority: result?.priority || '',
            store_id: result?.store_id ? String(result.store_id) : '',
            category: result?.category || '',
            technician_id: result?.technician_id ? String(result.technician_id) : '',
            description: result?.description || '',
            additional_info: result?.additional_info || ''
          })
        }
      })
      .catch(() => active && setError('Erro ao carregar detalhes'))
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [id])

  useEffect(() => {
    let active = true
    Promise.all([getStores(), getCategories(), getTechnicians()])
      .then(([storesResult, categoriesResult, techniciansResult]) => {
        if (!active) return
        setStores(storesResult || [])
        setCategories(categoriesResult || [])
        setTechnicians(techniciansResult || [])
      })
      .finally(() => active && setLoadingOptions(false))
    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    let active = true
    setLoadingEvents(true)
    getTicketEvents(id)
      .then(result => {
        if (active) {
          setEvents(result || [])
        }
      })
      .catch(() => active && setEventsError('Erro ao carregar histórico'))
      .finally(() => active && setLoadingEvents(false))
    return () => {
      active = false
    }
  }, [id])

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  const handleSave = async () => {
    setSaving(true)
    setSaveError('')
    try {
      const payload = {
        status: form.status,
        priority: form.priority,
        store_id: form.store_id || null,
        category: form.category || null,
        technician_id: form.technician_id || null,
        description: form.description,
        additional_info: form.additional_info
      }
      const updated = await updateTicket(id, payload)
      setTicket(updated)
      setForm({
        status: updated?.status || '',
        priority: updated?.priority || '',
        store_id: updated?.store_id ? String(updated.store_id) : '',
        category: updated?.category || '',
        technician_id: updated?.technician_id ? String(updated.technician_id) : '',
        description: updated?.description || '',
        additional_info: updated?.additional_info || ''
      })
    } catch {
      setSaveError('Erro ao salvar alterações')
    } finally {
      setSaving(false)
    }
  }

  const handleComment = async () => {
    if (!comment.trim()) return
    setCommentSaving(true)
    setCommentError('')
    try {
      const created = await addTicketComment(id, comment.trim())
      setEvents(prev => [created, ...prev])
      setComment('')
    } catch {
      setCommentError('Erro ao enviar comentário')
    } finally {
      setCommentSaving(false)
    }
  }

  const formatDate = value => {
    if (!value) return ''
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return value
    return date.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
  }

  if (loading) {
    return <div className="card">Carregando detalhes...</div>
  }

  if (error) {
    return <div className="card">{error}</div>
  }

  if (!ticket) {
    return <EmptyState title="Chamado não encontrado" description="Verifique o número informado." />
  }

  return (
    <div className="grid" style={{ maxWidth: 860 }}>
      <div className="card">
        <div className="title">#{ticket.id} {ticket.title}</div>
        <div className="subtitle" style={{ marginTop: 6 }}>{ticket.store}</div>
        <div className="row" style={{ marginTop: 16 }}>
          <div className="col-6">
            <label className="subtitle">Status</label>
            <select className="select" value={form.status} onChange={e => handleChange('status', e.target.value)}>
              <option value="novo">Novo</option>
              <option value="em_analise">Em Análise</option>
              <option value="aguardando_peca">Esperando Peça</option>
              <option value="resolvido">Concluído</option>
              <option value="nao_resolvido">Não Concluído</option>
              <option value="fechado">Fechado</option>
            </select>
          </div>
          <div className="col-6">
            <label className="subtitle">Prioridade</label>
            <select className="select" value={form.priority} onChange={e => handleChange('priority', e.target.value)}>
              <option value="baixa">Baixa</option>
              <option value="media">Média</option>
              <option value="alta">Alta</option>
              <option value="critica">Crítica</option>
            </select>
          </div>
          <div className="col-6">
            <label className="subtitle">Loja</label>
            <select className="select" value={form.store_id} onChange={e => handleChange('store_id', e.target.value)} disabled={loadingOptions}>
              <option value="">Selecione...</option>
              {stores.map(store => (
                <option key={store.id} value={store.id}>{store.name}</option>
              ))}
            </select>
          </div>
          <div className="col-6">
            <label className="subtitle">Categoria</label>
            <select className="select" value={form.category} onChange={e => handleChange('category', e.target.value)} disabled={loadingOptions}>
              <option value="">Selecione...</option>
              {categories.map(category => (
                <option key={category.id} value={category.name}>{category.name}</option>
              ))}
            </select>
          </div>
          <div className="col-6">
            <label className="subtitle">Técnico</label>
            <select className="select" value={form.technician_id} onChange={e => handleChange('technician_id', e.target.value)} disabled={loadingOptions}>
              <option value="">Nenhum</option>
              {technicians.map(tech => (
                <option key={tech.id} value={tech.id}>{tech.username}</option>
              ))}
            </select>
          </div>
          <div className="col-12">
            <label className="subtitle">Descrição</label>
            <textarea className="textarea" rows="4" value={form.description} onChange={e => handleChange('description', e.target.value)} />
          </div>
          <div className="col-12">
            <label className="subtitle">Observações internas</label>
            <textarea className="textarea" rows="3" value={form.additional_info} onChange={e => handleChange('additional_info', e.target.value)} />
          </div>
          <div className="col-12" style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <button className="btn" onClick={handleSave} disabled={saving}>{saving ? 'Salvando...' : 'Salvar alterações'}</button>
            {saveError && <div className="subtitle" style={{ color: 'var(--danger)' }}>{saveError}</div>}
          </div>
        </div>
      </div>
      <div className="card">
        <div className="title">Histórico</div>
        <div style={{ marginTop: 12, display: 'grid', gap: 10 }}>
          {loadingEvents && <div className="subtitle">Carregando histórico...</div>}
          {eventsError && <div className="subtitle" style={{ color: 'var(--danger)' }}>{eventsError}</div>}
          {!loadingEvents && !eventsError && events.length === 0 && (
            <div className="subtitle">Sem histórico registrado.</div>
          )}
          {events.map(item => (
            <div key={item.id} className="subtitle">{formatDate(item.created_at)} · {item.user || 'Sistema'} · {item.description}</div>
          ))}
        </div>
      </div>
      <div className="card">
        <div className="title">Comentários</div>
        <div className="subtitle" style={{ marginTop: 6 }}>Adicione atualizações para o time</div>
        <div style={{ marginTop: 12, display: 'grid', gap: 10 }}>
          <textarea className="textarea" rows="3" value={comment} onChange={e => setComment(e.target.value)} />
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <button className="btn" onClick={handleComment} disabled={commentSaving}>{commentSaving ? 'Enviando...' : 'Enviar comentário'}</button>
            {commentError && <div className="subtitle" style={{ color: 'var(--danger)' }}>{commentError}</div>}
          </div>
        </div>
      </div>
    </div>
  )
}
