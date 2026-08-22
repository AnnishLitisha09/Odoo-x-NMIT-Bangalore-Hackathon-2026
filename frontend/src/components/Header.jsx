import React from 'react';

export default function Header({ user, onLogout }) {
  return (
    <header className="bg-[var(--color-surface)] border-b border-[var(--color-border)] px-6 py-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <h2 className="text-xl font-bold text-white">HRMS Portal</h2>
      </div>
      <div className="flex items-center gap-4">
        <span className="text-sm text-[var(--color-text-muted)]">
          {user?.employee?.first_name || user?.email} ({user?.role?.toUpperCase()})
        </span>
        <button onClick={onLogout} className="btn-secondary text-xs">Logout</button>
      </div>
    </header>
  );
}
