const statusColor = {
  aberto: 'var(--accent-2)',
  em_andamento: 'var(--warning)',
  resolvido: 'var(--accent)',
  critico: 'var(--danger)'
}

export default function StatusBadge({ label }) {
  return (
    <span
      style={{
        padding: '4px 10px',
        borderRadius: 999,
        fontSize: 12,
        background: statusColor[label] || 'var(--border)',
        color: '#0f172a'
      }}
    >
      {label.replace('_', ' ')}
    </span>
  )
}
