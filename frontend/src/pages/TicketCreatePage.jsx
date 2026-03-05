import { useEffect, useState } from 'react'
import { createTicket, getCategories, getStores, getTechnicians } from '../services/ticketService'
import { useToast } from '../context/ToastContext'

export default function TicketCreatePage() {
  const { addToast } = useToast()
  const [form, setForm] = useState({
    title: '',
    description: '',
    priority: 'media',
    store_id: '',
    category: '',
    technician_id: '',
    attachment: null
  })
  const [loading, setLoading] = useState(false)
  const [loadingOptions, setLoadingOptions] = useState(true)
  const [stores, setStores] = useState([])
  const [categories, setCategories] = useState([])
  const [technicians, setTechnicians] = useState([])

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

  const handleSubmit = async e => {
    e.preventDefault()
    setLoading(true)
    const payload = {
      title: form.title,
      description: form.description,
      priority: form.priority,
      store_id: form.store_id || null,
      category: form.category || null,
      technician_id: form.technician_id || null,
      attachment: form.attachment?.name || null
    }
    
    try {
      await createTicket(payload)
      addToast('Chamado criado com sucesso!')
      setForm(prev => ({ ...prev, title: '', description: '' }))
    } catch (error) {
      addToast('Erro ao criar chamado', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card" style={{ maxWidth: 720 }}>
      <div className="title">Abrir novo chamado</div>
      <div className="subtitle" style={{ marginTop: 6 }}>Preencha os detalhes para registrar o atendimento</div>
      <form onSubmit={handleSubmit} className="grid" style={{ marginTop: 18 }}>
        <div className="col-12">
          <label className="subtitle">Título</label>
          <input className="input" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
        </div>
        <div className="col-12">
          <label className="subtitle">Descrição</label>
          <textarea className="textarea" rows="4" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
        </div>
        <div className="col-6">
          <label className="subtitle">Prioridade</label>
          <select className="select" value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}>
            <option value="baixa">Baixa</option>
            <option value="media">Média</option>
            <option value="alta">Alta</option>
            <option value="critica">Crítica</option>
          </select>
        </div>
        <div className="col-6">
          <label className="subtitle">Loja/Unidade</label>
          <select className="select" value={form.store_id} onChange={e => setForm({ ...form, store_id: e.target.value })} disabled={loadingOptions}>
            <option value="">Selecione...</option>
            {stores.map(store => (
              <option key={store.id} value={store.id}>{store.name}</option>
            ))}
          </select>
        </div>
        <div className="col-6">
          <label className="subtitle">Categoria</label>
          <select className="select" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} disabled={loadingOptions}>
            <option value="">Selecione...</option>
            {categories.map(category => (
              <option key={category.id} value={category.name}>{category.name}</option>
            ))}
          </select>
        </div>
        <div className="col-6">
          <label className="subtitle">Técnico</label>
          <select className="select" value={form.technician_id} onChange={e => setForm({ ...form, technician_id: e.target.value })} disabled={loadingOptions}>
            <option value="">Nenhum</option>
            {technicians.map(tech => (
              <option key={tech.id} value={tech.id}>{tech.username}</option>
            ))}
          </select>
        </div>
        <div className="col-12">
          <label className="subtitle">Anexos (simulado)</label>
          <input className="input" type="file" onChange={e => setForm({ ...form, attachment: e.target.files?.[0] })} />
        </div>
        <button className="btn" disabled={loading}>{loading ? 'Enviando...' : 'Criar chamado'}</button>
      </form>
    </div>
  )
}
