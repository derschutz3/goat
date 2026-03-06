import React from 'react'

export default function SettingsPage() {
  return (
    <div className="settings-container">
      <div className="dashboard-header mb-6">
        <div>
          <h1 className="title text-2xl">Configurações</h1>
          <p className="subtitle">Gerencie as preferências do sistema</p>
        </div>
      </div>

      <div className="card p-8 text-center">
        <div style={{ fontSize: 48, marginBottom: 16 }}>⚙️</div>
        <h3 className="font-semibold mb-2">Em Construção</h3>
        <p className="text-muted">As configurações do sistema estarão disponíveis em breve.</p>
      </div>
    </div>
  )
}
