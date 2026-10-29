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
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#f5f7fb' }}>

      {/* Sticky navbar at top */}
      <Navbar onToggleSidebar={() => setSidebarOpen(prev => !prev)} />

      {/* Body: sidebar + content side by side */}
      <div style={{ display: 'flex', flex: 1, alignItems: 'flex-start' }}>
        {user && (
          <Sidebar
            isOpen={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
            collapsed={sidebarCollapsed}
            onToggleCollapse={() => setSidebarCollapsed(prev => !prev)}
          />
        )}

        <main
          className="unitask-main flex-grow-1"
          style={{
            padding: '1.75rem',
            minWidth: 0,
            transition: 'padding 0.28s ease',
          }}
        >
          <Outlet />
        </main>
      </div>

      <footer className="py-3 px-4 bg-white border-top text-center text-muted small">
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
  );
};
