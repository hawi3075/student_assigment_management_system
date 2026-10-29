import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar.js';
import { Sidebar } from './Sidebar.js';
import { useAuth } from '../../context/AuthContext.js';

export const MainLayout: React.FC = () => {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    /*
     * Root: full viewport height, no overflow — this is key.
     * Everything is contained inside, so the browser never scrolls
     * the whole page; only <main> scrolls independently.
     */
    <div
      style={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        background: '#f5f7fb',
      }}
    >
      {/* ── Navbar: fixed height, never scrolls away ── */}
      <div style={{ flexShrink: 0 }}>
        <Navbar onToggleSidebar={() => setSidebarOpen(prev => !prev)} />
      </div>

      {/* ── Body row: fills remaining height, no overflow ── */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

        {/* Sidebar: fixed height = remaining viewport, internal scroll only */}
        {user && (
          <Sidebar
            isOpen={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
            collapsed={sidebarCollapsed}
            onToggleCollapse={() => setSidebarCollapsed(prev => !prev)}
          />
        )}

        {/* Main content: this is the ONLY thing that scrolls */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            minWidth: 0,
          }}
        >
          <main style={{ flex: 1, padding: '1.75rem' }}>
            <Outlet />
          </main>

          <footer className="py-3 px-4 bg-white border-top text-muted small">
            <div className="container-fluid d-flex flex-column flex-md-row justify-content-between align-items-center gap-2">
              <div>
                &copy; {new Date().getFullYear()} <strong>UniTask</strong> &mdash; University Student Assignment Management System.
              </div>
              <div className="d-flex gap-3">
                <span className="badge bg-light text-secondary border">Academic Session 2026–2027</span>
                <span className="badge bg-light text-secondary border">Institutional Security Enforced</span>
              </div>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
};
