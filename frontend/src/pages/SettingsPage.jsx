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

      {/* Tabs - Estilo Clean (Border Bottom) */}
      <div className="flex border-b border-light mb-8">
        {['sla', 'categories', 'priorities'].map((tab) => (
          <button 
            key={tab}
            className={`px-6 py-4 font-medium text-sm transition-all relative ${
              activeTab === tab 
                ? 'text-primary' 
                : 'text-muted hover:text-white'
            }`}
            onClick={() => setActiveTab(tab)}
          >
            {tab === 'sla' ? 'Políticas de SLA' : tab === 'categories' ? 'Categorias' : 'Prioridades'}
            {/* Active Indicator Line */}
            {activeTab === tab && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary shadow-[0_-2px_6px_rgba(var(--primary-rgb),0.5)] rounded-t-full"></div>
            )}
          </button>
        ))}
      </div>

      {/* Content SLA */}
      {activeTab === 'sla' && (
        <div className="card max-w-3xl animate-fade-in">
          <div className="card-header border-b border-light p-6">
            <h3 className="font-semibold text-lg">Definição de Prazos</h3>
            <p className="text-muted text-sm mt-1">Configure o tempo máximo (em horas) para resolução de cada prioridade.</p>
          </div>
          <div className="p-6 grid gap-4">
            {Object.entries(sla).map(([key, val]) => (
              <div key={key} className="flex items-center justify-between p-4 border border-light rounded-xl bg-muted-5 hover:bg-muted-10 transition-colors">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full bg-${key === 'critica' ? 'danger' : key === 'alta' ? 'orange' : key === 'media' ? 'warning' : 'info'}`}></div>
                  <span className="capitalize font-medium text-base">{key}</span>
                </div>
                <div className="flex items-center gap-3 bg-dark-bg p-2 rounded-lg border border-light focus-within:border-primary transition-colors">
                  <input 
                    type="number" 
                    className="bg-transparent border-none text-right w-16 text-white font-mono outline-none" 
                    style={{ background: 'transparent', boxShadow: 'none' }}
                    value={val} 
                    onChange={(e) => handleSlaChange(key, e.target.value)}
                  />
                  <span className="text-muted text-sm font-medium pr-2">horas</span>
                </div>
              </div>
            ))}
          </div>
          <div className="p-6 border-t border-light flex justify-end bg-muted-5 rounded-b-xl">
            <button className="btn-primary w-full md:w-auto px-8 py-3" onClick={saveSla} disabled={loading}>
              {loading ? 'Salvando...' : 'Salvar Alterações'}
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
                className="input flex-1 bg-dark-bg border-light focus:border-primary h-12" 
                placeholder="Nome da nova categoria..." 
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addCategory()}
              />
              <button className="btn-secondary h-12 px-6" onClick={addCategory}>Adicionar</button>
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
                    className="p-2 text-muted hover:text-danger hover:bg-danger/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
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
            <h3 className="font-semibold text-lg">Níveis de Prioridade</h3>
            <p className="text-muted text-sm mt-1">Visualização das prioridades do sistema e seus indicadores.</p>
          </div>
          <div className="p-6 grid gap-4">
            {priorities.map(p => (
              <div key={p.id} className="flex items-center justify-between p-4 border border-light rounded-xl bg-muted-5 hover:bg-muted-10 transition-colors">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center bg-${p.color === 'neutral' ? 'gray' : p.color === 'warning' ? 'yellow' : p.color === 'orange' ? 'orange' : 'red'}-500/10`}>
                     <div className={`w-3 h-3 rounded-full bg-${p.color === 'neutral' ? 'gray' : p.color === 'warning' ? 'yellow' : p.color === 'orange' ? 'orange' : 'red'}-500`}></div>
                  </div>
                  <div>
                    <div className="font-medium capitalize text-lg">{p.label}</div>
                    <div className="text-xs text-muted font-mono mt-0.5 uppercase tracking-wider">{p.id}</div>
                  </div>
                </div>
                <div className="px-3 py-1 rounded-full bg-muted-10 text-xs text-muted border border-light">
                  Sistema Padrão
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
