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
  // (Apenas visual por enquanto, já que exige mudanças profundas no backend para adicionar novas)
  
  return (
    <div className="dashboard-container">
      <div className="dashboard-header mb-6">
        <div>
          <h1 className="title text-2xl">Configurações</h1>
          <p className="subtitle">Gerencie as regras do sistema</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-6 border-b border-light pb-1">
        <button 
          className={`px-4 py-2 font-medium transition-colors ${activeTab === 'sla' ? 'text-primary border-b-2 border-primary' : 'text-muted hover:text-white'}`}
          onClick={() => setActiveTab('sla')}
        >
          Políticas de SLA
        </button>
        <button 
          className={`px-4 py-2 font-medium transition-colors ${activeTab === 'categories' ? 'text-primary border-b-2 border-primary' : 'text-muted hover:text-white'}`}
          onClick={() => setActiveTab('categories')}
        >
          Categorias
        </button>
        <button 
          className={`px-4 py-2 font-medium transition-colors ${activeTab === 'priorities' ? 'text-primary border-b-2 border-primary' : 'text-muted hover:text-white'}`}
          onClick={() => setActiveTab('priorities')}
        >
          Prioridades
        </button>
      </div>

      {/* Content SLA */}
      {activeTab === 'sla' && (
        <div className="card max-w-2xl animate-fade-in">
          <div className="card-header border-b">
            <h3 className="font-semibold">Definição de Prazos (Horas)</h3>
          </div>
          <div className="grid gap-4">
            {Object.entries(sla).map(([key, val]) => (
              <div key={key} className="flex items-center justify-between p-3 bg-muted-10 rounded-lg">
                <span className="capitalize font-medium">{key}</span>
                <div className="flex items-center gap-2">
                  <input 
                    type="number" 
                    className="input w-24 text-center" 
                    value={val} 
                    onChange={(e) => handleSlaChange(key, e.target.value)}
                  />
                  <span className="text-muted text-sm">horas</span>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 flex justify-end">
            <button className="btn-primary" onClick={saveSla} disabled={loading}>
              {loading ? 'Salvando...' : 'Salvar Alterações'}
            </button>
          </div>
        </div>
      )}

      {/* Content Categories */}
      {activeTab === 'categories' && (
        <div className="card max-w-2xl animate-fade-in">
          <div className="card-header border-b">
            <h3 className="font-semibold">Gerenciar Categorias</h3>
          </div>
          
          <div className="flex gap-2 mb-6">
            <input 
              className="input" 
              placeholder="Nova categoria..." 
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addCategory()}
            />
            <button className="btn-secondary" onClick={addCategory}>Adicionar</button>
          </div>

          <div className="list">
            {categories.map(cat => (
              <div key={cat.id} className="list-item">
                <span>{cat.name}</span>
                <button 
                  className="text-danger hover:text-white transition-colors"
                  onClick={() => removeCategory(cat.id)}
                  title="Remover"
                >
                  <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
              </div>
            ))}
            {categories.length === 0 && <div className="text-center text-muted p-4">Nenhuma categoria encontrada.</div>}
          </div>
        </div>
      )}

      {/* Content Priorities */}
      {activeTab === 'priorities' && (
        <div className="card max-w-2xl animate-fade-in">
          <div className="card-header border-b">
            <h3 className="font-semibold">Níveis de Prioridade</h3>
          </div>
          <p className="text-muted mb-4 text-sm">
            As prioridades definem a ordem de atendimento e o SLA aplicado.
            (Edição avançada desabilitada nesta versão)
          </p>
          <div className="list">
            {priorities.map(p => (
              <div key={p.id} className="list-item">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full bg-${p.color === 'neutral' ? 'gray-500' : p.color === 'warning' ? 'yellow-500' : p.color === 'orange' ? 'orange-500' : 'red-500'}`}></div>
                  <span className="font-medium capitalize">{p.label}</span>
                </div>
                <span className="text-sm text-muted font-mono">{p.id}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
