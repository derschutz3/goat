export default function StatsGrid({ data }) {
  const items = [
    { label: 'Abertos', value: data.open ?? 0, tone: 'info' },
    { label: 'Pendentes', value: data.pending ?? 0, tone: 'warning' },
    { label: 'Vencidos', value: data.overdue ?? 0, tone: 'danger' },
    { label: 'Resolvidos hoje', value: data.resolved_today ?? 0, tone: 'success' }
  ]

  return (
    <div className="grid grid-4">
      {items.map(item => (
        <div key={item.label} className="card stat-card" data-tone={item.tone}>
          <div className="stat-label">{item.label}</div>
          <div className="stat-value">{item.value}</div>
        </div>
      ))}
    </div>
  )
}
