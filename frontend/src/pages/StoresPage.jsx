import { useState, useEffect } from 'react'
import { supabase } from '../services/supabase'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { mockStores } from '../services/mockData'

// For development without backend, we'll use local state if Supabase fails
const useMock = import.meta.env.VITE_USE_MOCK === 'true'

export default function StoresPage() {
  const { user } = useAuth()
  const { addToast } = useToast()
  const [stores, setStores] = useState([])
  const [loading, setLoading] = useState(true)
  const [newStore, setNewStore] = useState('')
  const [editingStore, setEditingStore] = useState(null)

  useEffect(() => {
    fetchStores()
  }, [])

  const fetchStores = async () => {
    try {
      if (useMock) {
        setStores(mockStores)
        setLoading(false)
        return
      }

      const { data, error } = await supabase
        .from('stores')
        .select('*')
        .order('name', { ascending: true })
      
      if (error) throw error
      setStores(data || [])
    } catch (err) {
      console.error('Error fetching stores:', err)
      // Fallback to mock data if table doesn't exist yet
      setStores(mockStores)
      addToast('Erro ao carregar lojas, usando dados locais', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateStore = async (e) => {
    e.preventDefault()
    
    if (!newStore.trim()) return

    try {
      if (useMock) {
        const mockNew = { id: Date.now(), name: newStore.toUpperCase() }
        setStores([...stores, mockNew])
        addToast('Loja adicionada (Simulação)')
        setNewStore('')
        return
      }

      const { data, error } = await supabase
        .from('stores')
        .insert([{ name: newStore.toUpperCase() }])
        .select()

      if (error) throw error

      setStores([...stores, ...(data || [])])
      addToast('Loja adicionada com sucesso!')
      setNewStore('')
    } catch (err) {
      addToast('Erro ao criar loja: ' + err.message, 'error')
    }
  }

  const handleUpdateStore = async (e) => {
    e.preventDefault()
    if (!editingStore || !editingStore.name.trim()) return

    try {
      if (useMock) {
        setStores(stores.map(s => s.id === editingStore.id ? editingStore : s))
        addToast('Loja atualizada (Simulação)')
        setEditingStore(null)
        return
      }

      const { error } = await supabase
        .from('stores')
        .update({ name: editingStore.name.toUpperCase() })
        .eq('id', editingStore.id)

      if (error) throw error

      setStores(stores.map(s => s.id === editingStore.id ? { ...s, name: editingStore.name.toUpperCase() } : s))
      addToast('Loja atualizada com sucesso!')
      setEditingStore(null)
    } catch (err) {
      addToast('Erro ao atualizar loja: ' + err.message, 'error')
    }
  }

  const handleDeleteStore = async (id) => {
    if (!confirm('Tem certeza que deseja excluir esta loja?')) return

    try {
      if (useMock) {
        setStores(stores.filter(s => s.id !== id))
        addToast('Loja removida (Simulação)')
        return
      }

      const { error } = await supabase
        .from('stores')
        .delete()
        .eq('id', id)

      if (error) throw error

      setStores(stores.filter(s => s.id !== id))
      addToast('Loja removida com sucesso!')
    } catch (err) {
      addToast('Erro ao remover loja: ' + err.message, 'error')
    }
  }

  return (
    <div className="grid">
      <div className="dashboard-header">
        <div>
          <div className="title">Gerenciar Lojas</div>
          <div className="subtitle">Cadastre, edite e remova unidades</div>
        </div>
      </div>

      <div className="dashboard-columns">
        {/* Form Card */}
        <div className="card">
          <div className="card-header">
            <div className="title" style={{ fontSize: 18 }}>
              {editingStore ? 'Editar Loja' : 'Nova Loja'}
            </div>
          </div>
          
          <form onSubmit={editingStore ? handleUpdateStore : handleCreateStore} style={{ display: 'grid', gap: 16 }}>
            <div>
              <label className="subtitle" style={{ marginBottom: 8, display: 'block' }}>Nome da Loja</label>
              <input 
                className="input" 
                type="text" 
                value={editingStore ? editingStore.name : newStore}
                onChange={e => editingStore ? setEditingStore({...editingStore, name: e.target.value}) : setNewStore(e.target.value)}
                placeholder="Ex: GSM1 - LAGOA"
                required
              />
            </div>
            
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="submit" className="btn-primary" style={{ flex: 1 }}>
                {editingStore ? 'Salvar Alterações' : 'Adicionar Loja'}
              </button>
              {editingStore && (
                <button 
                  type="button" 
                  className="btn-secondary" 
                  onClick={() => {
                    setEditingStore(null)
                  }}
                >
                  Cancelar
                </button>
              )}
            </div>
          </form>
        </div>

        {/* List Card */}
        <div className="card">
          <div className="card-header">
            <div className="title" style={{ fontSize: 18 }}>Lojas Cadastradas</div>
            <div className="subtitle">{stores.length} unidades</div>
          </div>
          
          {loading ? (
            <div>Carregando...</div>
          ) : (
            <div className="table-container" style={{ maxHeight: '600px', overflowY: 'auto' }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Nome</th>
                    <th style={{ width: 100, textAlign: 'right' }}>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {stores.map(store => (
                    <tr key={store.id}>
                      <td style={{ fontWeight: 500 }}>{store.name}</td>
                      <td style={{ textAlign: 'right' }}>
                        <button 
                          onClick={() => setEditingStore(store)}
                          style={{ color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer', marginRight: 12 }}
                          title="Editar"
                        >
                          <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button 
                          onClick={() => handleDeleteStore(store.id)}
                          style={{ color: 'var(--danger)', background: 'none', border: 'none', cursor: 'pointer' }}
                          title="Excluir"
                        >
                          <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                  {stores.length === 0 && (
                    <tr>
                      <td colSpan="2" style={{ textAlign: 'center', padding: 20 }}>Nenhuma loja cadastrada.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
