export default function TicketsFilterBar({ filters, onChange, onSearch }) {
  return (
    <div className="card row">
      <div className="col-6">
        <label className="subtitle">Buscar</label>
        <input
          className="input"
          placeholder="Número, título ou loja"
          value={filters.search}
          onChange={e => onSearch(e.target.value)}
        />
      </div>
      <div className="col-6">
        <label className="subtitle">Status</label>
        <select
          className="select"
          value={filters.status}
          onChange={e => onChange('status', e.target.value)}
        >
          <option value="todos">Todos</option>
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
        <select
          className="select"
          value={filters.priority}
          onChange={e => onChange('priority', e.target.value)}
        >
          <option value="todas">Todas</option>
          <option value="baixa">Baixa</option>
          <option value="media">Média</option>
          <option value="alta">Alta</option>
          <option value="critica">Crítica</option>
        </select>
      </div>
      <div className="col-6" style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-end' }}>
        <button className="btn">Aplicar filtros</button>
      </div>
    </div>
  )
}
