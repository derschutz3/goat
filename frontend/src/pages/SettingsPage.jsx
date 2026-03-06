import React, { useState, useEffect } from 'react'
import { useToast } from '../context/ToastContext'
import { getCategories } from '../services/ticketService'

// Mock de dados iniciais (já que não temos backend para tudo ainda)
const INITIAL_SLA = {
  critica: 4,
  alta: 8,
  media: 24,
  baixa: 48
}

const INITIAL_PRIORITIES = [
  { id: 'baixa', label: 'Baixa', color: 'neutral' },
  { id: 'media', label: 'Média', color: 'warning' },
  { id: 'alta', label: 'Alta', color: 'orange' },
  { id: 'critica', label: 'Crítica', color: 'danger' }
]

export default function SettingsPage() {
  const { addToast } = useToast()
  const [activeTab, setActiveTab] = useState('sla')
  
  // States
  const [sla, setSla] = useState(INITIAL_SLA)
  const [categories, setCategories] = useState([])
  const [priorities, setPriorities] = useState(INITIAL_PRIORITIES)
  
  // Loading states
  const [loading, setLoading] = useState(false)

  // Load Data
  useEffect(() => {
    // Carregar SLA do localStorage ou usar inicial
    const savedSla = localStorage.getItem('primatas_sla')
    if (savedSla) setSla(JSON.parse(savedSla))

    // Carregar Categorias (Real + Mock local)
    loadCategories()
  }, [])

  const loadCategories = async () => {
    try {
      // Tenta buscar do backend, se falhar ou vazio, usa lista local
      const data = await getCategories().catch(() => [])
      if (data.length > 0) {
        setCategories(data)
      } else {
        // Fallback mock
        setCategories([
          { id: 1, name: 'Hardware', active: true },
          { id: 2, name: 'Software', active: true },
          { id: 3, name: 'Rede', active: true }
        ])
      }
    } catch (err) {
      console.error(err)
    }
  }

  // --- Handlers SLA ---
  const handleSlaChange = (key, value) => {
    setSla(prev => ({ ...prev, [key]: parseInt(value) || 0 }))
  }

  const saveSla = () => {
    setLoading(true)
    setTimeout(() => {
      localStorage.setItem('primatas_sla', JSON.stringify(sla))
      addToast('Políticas de SLA salvas com sucesso!')
      setLoading(false)
    }, 800)
  }

  // --- Handlers Categories ---
  const [newCategory, setNewCategory] = useState('')
  
  const addCategory = () => {
    if (!newCategory.trim()) return
    const newItem = { id: Date.now(), name: newCategory, active: true }
    setCategories([...categories, newItem])
    setNewCategory('')
    addToast('Categoria adicionada (localmente)')
  }

  const removeCategory = (id) => {
    setCategories(categories.filter(c => c.id !== id))
    addToast('Categoria removida')
  }

  // --- Handlers Priorities ---
  const [newPriority, setNewPriority] = useState({ label: '', color: 'neutral' })
  const [editingPriority, setEditingPriority] = useState(null)

  const addPriority = () => {
    if (!newPriority.label.trim()) return
    const id = newPriority.label.toLowerCase().replace(/\s+/g, '_')
    const newItem = { id, label: newPriority.label, color: newPriority.color }
    
    // Evitar duplicatas de ID
    if (priorities.some(p => p.id === id)) {
      addToast('Já existe uma prioridade com esse nome.', 'error')
      return
    }

    const updated = [...priorities, newItem]
    setPriorities(updated)
    savePriorities(updated)
    setNewPriority({ label: '', color: 'neutral' })
    addToast('Prioridade adicionada')
  }

  const removePriority = (id) => {
    const updated = priorities.filter(p => p.id !== id)
    setPriorities(updated)
    savePriorities(updated)
    addToast('Prioridade removida')
  }

  const startEditingPriority = (priority) => {
    setEditingPriority({ ...priority })
  }

  const saveEditedPriority = () => {
    if (!editingPriority || !editingPriority.label.trim()) return
    
    const updated = priorities.map(p => p.id === editingPriority.id ? editingPriority : p)
    setPriorities(updated)
    savePriorities(updated)
    setEditingPriority(null)
    addToast('Prioridade atualizada')
  }

  const savePriorities = (data) => {
    localStorage.setItem('primatas_priorities', JSON.stringify(data))
  }

  // Load Priorities on Mount
  useEffect(() => {
    const savedPriorities = localStorage.getItem('primatas_priorities')
    if (savedPriorities) {
      setPriorities(JSON.parse(savedPriorities))
    }
  }, [])
  
  return (
    <div className="dashboard-container">
      <div className="dashboard-header mb-6">
        <div>
          <h1 className="title text-2xl">Configurações</h1>
          <p className="subtitle">Gerencie as regras do sistema</p>
        </div>
      </div>

      {/* Tabs - Botões Padrão do Sistema */}
      <div className="flex flex-wrap gap-3 mb-8">
        {['sla', 'categories', 'priorities'].map((tab) => (
          <button 
            key={tab}
            className={activeTab === tab ? 'btn btn-primary' : 'btn btn-secondary'}
            onClick={() => setActiveTab(tab)}
          >
            {tab === 'sla' ? 'Políticas de SLA' : tab === 'categories' ? 'Categorias' : 'Prioridades'}
          </button>
        ))}
      </div>

      {/* Content SLA */}
      {activeTab === 'sla' && (
        <div className="card max-w-3xl animate-fade-in overflow-hidden">
          <div className="card-header border-b border-light p-6">
            <h3 className="font-semibold text-lg">Definição de Prazos</h3>
            <p className="text-muted text-sm mt-1">Configure o tempo máximo (em horas) para resolução de cada prioridade.</p>
          </div>
          
          <div className="flex flex-col">
            {Object.entries(sla).map(([key, val], index, arr) => (
              <div key={key} className={`flex items-center justify-between p-6 hover:bg-muted-5 transition-colors ${index !== arr.length - 1 ? 'border-b border-light' : ''}`}>
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center bg-${key === 'critica' ? 'red' : key === 'alta' ? 'orange' : key === 'media' ? 'yellow' : 'blue'}-500/10`}>
                     <div className={`w-4 h-4 rounded-full bg-${key === 'critica' ? 'red' : key === 'alta' ? 'orange' : key === 'media' ? 'yellow' : 'blue'}-500 shadow-sm`}></div>
                  </div>
                  <div>
                    <span className="capitalize font-semibold text-lg block">{key}</span>
                    <span className="text-xs text-muted uppercase tracking-wider font-medium">Prioridade</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-4 bg-muted-5 p-2 pr-4 rounded-xl border border-light focus-within:border-primary transition-all">
                  <input 
                    type="number" 
                    className="bg-transparent border-none text-right w-20 text-white outline-none font-bold text-xl" 
                    value={val} 
                    onChange={(e) => handleSlaChange(key, e.target.value)}
                  />
                  <span className="text-muted text-sm font-medium border-l border-light pl-4 py-1">horas</span>
                </div>
              </div>
            ))}
          </div>
          
          <div className="p-6 bg-muted-5 border-t border-light">
            <button className="btn btn-primary w-full py-4 text-base shadow-lg shadow-primary/20" onClick={saveSla} disabled={loading}>
              {loading ? 'Salvando alterações...' : 'Salvar Alterações'}
            </button>
          </div>
        </div>
      )}

      {/* Content Categories */}
      {activeTab === 'categories' && (
        <div className="card max-w-3xl animate-fade-in">
          <div className="card-header border-b border-light p-6">
            <h3 className="font-semibold text-lg">Gerenciar Categorias</h3>
            <p className="text-muted text-sm mt-1">Adicione ou remova categorias para classificação dos chamados.</p>
          </div>
          
          <div className="p-6">
            <div className="flex gap-3 mb-6">
              <input 
                className="input flex-1 h-12" 
                placeholder="Nome da nova categoria..." 
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addCategory()}
              />
              <button className="btn btn-secondary h-12 px-6" onClick={addCategory}>Adicionar</button>
            </div>

            <div className="grid gap-4">
              {categories.map(cat => (
                <div key={cat.id} className="flex items-center justify-between p-4 border border-light rounded-xl bg-muted-5 hover:bg-muted-10 transition-colors group">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                      <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>
                    </div>
                    <span className="font-medium">{cat.name}</span>
                  </div>
                  <button 
                    className="btn-icon-danger"
                    onClick={() => removeCategory(cat.id)}
                    title="Remover"
                  >
                    <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                </div>
              ))}
              {categories.length === 0 && (
                <div className="text-center text-muted p-8 border-2 border-dashed border-light rounded-xl">
                  Nenhuma categoria cadastrada.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Content Priorities */}
      {activeTab === 'priorities' && (
        <div className="card max-w-3xl animate-fade-in">
          <div className="card-header border-b border-light p-6">
            <h3 className="font-semibold text-lg">Gerenciar Prioridades</h3>
            <p className="text-muted text-sm mt-1">Defina os níveis de urgência para os chamados.</p>
          </div>
          
          <div className="p-6">
            {/* Add New Priority */}
            <div className="flex gap-3 mb-6 items-center bg-muted-5 p-4 rounded-xl border border-light">
              <input 
                className="input flex-1 h-12" 
                placeholder="Nome da prioridade (ex: Urgentíssimo)" 
                value={newPriority.label}
                onChange={(e) => setNewPriority({ ...newPriority, label: e.target.value })}
                onKeyDown={(e) => e.key === 'Enter' && addPriority()}
              />
              <select 
                className="select h-12 w-32"
                value={newPriority.color}
                onChange={(e) => setNewPriority({ ...newPriority, color: e.target.value })}
              >
                <option value="neutral">Cinza</option>
                <option value="info">Azul</option>
                <option value="success">Verde</option>
                <option value="warning">Amarelo</option>
                <option value="orange">Laranja</option>
                <option value="danger">Vermelho</option>
              </select>
              <button className="btn btn-secondary h-12 px-6" onClick={addPriority}>Adicionar</button>
            </div>

            <div className="grid gap-3">
              {priorities.map(p => (
                <div key={p.id} className="flex items-center justify-between p-4 border border-light rounded-xl hover:bg-muted-5 transition-colors group">
                  {editingPriority && editingPriority.id === p.id ? (
                    <div className="flex flex-1 gap-3 items-center">
                      <input 
                        className="input flex-1 h-10" 
                        value={editingPriority.label}
                        onChange={(e) => setEditingPriority({ ...editingPriority, label: e.target.value })}
                      />
                      <select 
                        className="select h-10 w-32"
                        value={editingPriority.color}
                        onChange={(e) => setEditingPriority({ ...editingPriority, color: e.target.value })}
                      >
                        <option value="neutral">Cinza</option>
                        <option value="info">Azul</option>
                        <option value="success">Verde</option>
                        <option value="warning">Amarelo</option>
                        <option value="orange">Laranja</option>
                        <option value="danger">Vermelho</option>
                      </select>
                      <button className="btn btn-primary h-10 px-4 text-xs" onClick={saveEditedPriority}>Salvar</button>
                      <button className="btn btn-secondary h-10 px-4 text-xs" onClick={() => setEditingPriority(null)}>Cancelar</button>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center bg-${p.color === 'neutral' ? 'gray' : p.color === 'warning' ? 'yellow' : p.color === 'orange' ? 'orange' : p.color === 'success' ? 'green' : p.color === 'info' ? 'blue' : 'red'}-500/10`}>
                          <div className={`w-3 h-3 rounded-full bg-${p.color === 'neutral' ? 'gray' : p.color === 'warning' ? 'yellow' : p.color === 'orange' ? 'orange' : p.color === 'success' ? 'green' : p.color === 'info' ? 'blue' : 'red'}-500`}></div>
                        </div>
                        <div>
                          <div className="font-medium capitalize text-lg">{p.label}</div>
                          <div className="text-xs text-muted font-mono mt-0.5 uppercase tracking-wider opacity-60">{p.id}</div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button 
                          className="btn-icon-primary"
                          onClick={() => startEditingPriority(p)}
                          title="Editar"
                        >
                          <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                        </button>
                        <button 
                          className="btn-icon-danger"
                          onClick={() => removePriority(p.id)}
                          title="Remover"
                        >
                          <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
