import React from 'react'

function App() {
  return (
    <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text)] flex items-center justify-center p-4">
      <div className="card p-8 text-center max-w-md w-full animate-fade-in">
        <h1 className="text-2xl font-bold text-[var(--color-accent-light)] mb-2">
          HRMS Application
        </h1>
        <p className="text-[var(--color-text-muted)] text-sm mb-4">
          Odoo x NMIT Bangalore Hackathon 2026
        </p>
        <div className="badge badge-purple mb-4">Frontend &amp; Backend Setup</div>
      </div>
    </div>
  )
}

export default App
