export default function EmptyState({ title, description }) {
  return (
    <div className="card">
      <div className="title">{title}</div>
      <div className="subtitle" style={{ marginTop: 8 }}>{description}</div>
    </div>
  )
}
