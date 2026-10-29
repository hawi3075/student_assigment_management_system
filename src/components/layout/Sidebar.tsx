import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.js';

interface SidebarProps {
  isOpen: boolean;
  onClose?: () => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

/* ── Per-role theme ── */
const ROLE_THEME = {
  super_admin: {
    gradient: 'linear-gradient(160deg, #1a0a2e 0%, #16052a 40%, #0d0320 100%)',
    accent: '#a855f7',
    accentRgb: '168,85,247',
    accentLight: 'rgba(168,85,247,0.15)',
    accentBorder: 'rgba(168,85,247,0.35)',
    sectionColor: 'rgba(168,85,247,0.55)',
    label: 'Super Administration',
    icon: 'bi-shield-fill-exclamation',
    badgeBg: 'rgba(168,85,247,0.2)',
    badgeColor: '#d8b4fe',
  },
  admin: {
    gradient: 'linear-gradient(160deg, #0f0c29 0%, #0d1547 40%, #0a1628 100%)',
    accent: '#6366f1',
    accentRgb: '99,102,241',
    accentLight: 'rgba(99,102,241,0.15)',
    accentBorder: 'rgba(99,102,241,0.35)',
    sectionColor: 'rgba(99,102,241,0.6)',
    label: 'System Administration',
    icon: 'bi-shield-fill-check',
    badgeBg: 'rgba(99,102,241,0.2)',
    badgeColor: '#a5b4fc',
  },
  teacher: {
    gradient: 'linear-gradient(160deg, #071e2e 0%, #0c2a42 40%, #0a1e33 100%)',
    accent: '#0ea5e9',
    accentRgb: '14,165,233',
    accentLight: 'rgba(14,165,233,0.15)',
    accentBorder: 'rgba(14,165,233,0.35)',
    sectionColor: 'rgba(14,165,233,0.6)',
    label: 'Faculty Portal',
    icon: 'bi-person-workspace',
    badgeBg: 'rgba(14,165,233,0.2)',
    badgeColor: '#7dd3fc',
  },
  student: {
    gradient: 'linear-gradient(160deg, #051a14 0%, #0a2a1e 40%, #061810 100%)',
    accent: '#10b981',
    accentRgb: '16,185,129',
    accentLight: 'rgba(16,185,129,0.15)',
    accentBorder: 'rgba(16,185,129,0.35)',
    sectionColor: 'rgba(16,185,129,0.6)',
    label: 'Academic Portal',
    icon: 'bi-mortarboard-fill',
    badgeBg: 'rgba(16,185,129,0.2)',
    badgeColor: '#6ee7b7',
  },
};

/* ── Nav items per role ── */
const NAV_ITEMS = {
  student: [
    { to: '/student/dashboard',   icon: 'bi-grid-1x2-fill',       label: 'Dashboard',        end: true },
    { to: '/student/assignments', icon: 'bi-journal-text',         label: 'Assignments' },
    { to: '/student/submissions', icon: 'bi-file-earmark-check',   label: 'My Submissions' },
    { to: '/student/grades',      icon: 'bi-award-fill',           label: 'Grades & Feedback' },
    { to: '/student/profile',     icon: 'bi-person-badge-fill',    label: 'Student Profile' },
  ],
  teacher: [
    { to: '/teacher/dashboard',          icon: 'bi-speedometer2',         label: 'Dashboard',         end: true },
    { to: '/teacher/courses',            icon: 'bi-book-fill',            label: 'My Courses' },
    { to: '/teacher/assignments',        icon: 'bi-folder2-open',         label: 'Assignments',        end: true },
    { to: '/teacher/assignments/create', icon: 'bi-plus-circle-fill',     label: 'Create Assignment' },
    { to: '/teacher/profile',            icon: 'bi-person-lines-fill',    label: 'Faculty Profile' },
  ],
  admin: [
    { to: '/admin/dashboard', icon: 'bi-speedometer',      label: 'Overview',        end: true },
    { to: '/admin/users',     icon: 'bi-people-fill',      label: 'Users' },
    { to: '/admin/courses',   icon: 'bi-collection-fill',  label: 'Courses' },
    { to: '/admin/activity',  icon: 'bi-shield-check',     label: 'Audit Logs' },
  ],
  super_admin: [
    { to: '/admin/dashboard', icon: 'bi-speedometer',      label: 'Overview',        end: true },
    { to: '/admin/users',     icon: 'bi-people-fill',      label: 'Users' },
    { to: '/admin/courses',   icon: 'bi-collection-fill',  label: 'Courses' },
    { to: '/admin/activity',  icon: 'bi-shield-check',     label: 'Audit Logs' },
  ],
};

function getInitials(name: string) {
  return name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  collapsed = false,
  onToggleCollapse,
}) => {
  const { user } = useAuth();
  const location = useLocation();
  if (!user) return null;

  const role = user.role as keyof typeof ROLE_THEME;
  const theme = ROLE_THEME[role] ?? ROLE_THEME.student;
  const items = NAV_ITEMS[role] ?? NAV_ITEMS.student;

  const sidebarWidth = collapsed ? '72px' : '264px';

  return (
    <>
      <style>{`
        /* ── Sidebar shell ── */
        .ut-sidebar {
          width: ${sidebarWidth};
          /* Height fills the flex parent which is already 100vh - navbar */
          height: 100%;
          background: ${theme.gradient};
          border-right: 1px solid rgba(255,255,255,0.06);
          display: flex;
          flex-direction: column;
          transition: width 0.28s cubic-bezier(0.4,0,0.2,1);
          flex-shrink: 0;
          overflow-y: auto;
          overflow-x: hidden;
          scrollbar-width: thin;
          scrollbar-color: rgba(255,255,255,0.1) transparent;
        }
        .ut-sidebar::-webkit-scrollbar { width: 4px; }
        .ut-sidebar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 99px; }

        /* ── User identity card ── */
        .ut-identity {
          padding: ${collapsed ? '1rem 0' : '1.25rem 1rem'};
          display: flex;
          align-items: center;
          gap: 0.75rem;
          border-bottom: 1px solid rgba(255,255,255,0.07);
          transition: padding 0.28s ease;
          justify-content: ${collapsed ? 'center' : 'flex-start'};
          position: relative;
          overflow: hidden;
        }
        .ut-identity::before {
          content: '';
          position: absolute; inset: 0;
          background: radial-gradient(circle at 0% 50%, ${theme.accentLight}, transparent 70%);
          pointer-events: none;
        }
        .ut-avatar {
          width: 42px; height: 42px; border-radius: 12px;
          background: linear-gradient(135deg, ${theme.accent}, rgba(${theme.accentRgb},0.5));
          color: #fff; font-size: 1rem; font-weight: 700;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
          border: 2px solid ${theme.accentBorder};
          box-shadow: 0 0 16px rgba(${theme.accentRgb},0.25);
          position: relative;
        }
        .ut-avatar-online {
          position: absolute; bottom: -2px; right: -2px;
          width: 10px; height: 10px; border-radius: 50%;
          background: #10b981; border: 2px solid #0a1628;
        }
        .ut-user-name {
          font-size: 0.87rem; font-weight: 700; color: #f1f5f9;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
          max-width: 150px;
        }
        .ut-role-chip {
          display: inline-flex; align-items: center; gap: 4px;
          background: ${theme.badgeBg};
          color: ${theme.badgeColor};
          border: 1px solid ${theme.accentBorder};
          border-radius: 20px; padding: 1px 8px;
          font-size: 0.62rem; font-weight: 700; letter-spacing: 0.07em;
          text-transform: uppercase; margin-top: 2px;
        }

        /* ── Section label ── */
        .ut-section-label {
          font-size: 0.64rem; font-weight: 700; letter-spacing: 0.1em;
          text-transform: uppercase; color: ${theme.sectionColor};
          padding: ${collapsed ? '1rem 0 0.4rem' : '1.1rem 1.1rem 0.4rem'};
          display: flex; align-items: center; gap: 6px;
          white-space: nowrap; overflow: hidden;
          transition: padding 0.28s ease;
          justify-content: ${collapsed ? 'center' : 'flex-start'};
        }
        .ut-section-label::after {
          content: '';
          display: ${collapsed ? 'none' : 'block'};
          flex: 1; height: 1px;
          background: rgba(255,255,255,0.07);
        }

        /* ── Nav link ── */
        .ut-nav-link {
          display: flex; align-items: center;
          gap: 0.75rem;
          padding: ${collapsed ? '0.72rem 0' : '0.65rem 1rem'};
          margin: ${collapsed ? '0.15rem 0.5rem' : '0.12rem 0.6rem'};
          border-radius: 10px;
          color: rgba(255,255,255,0.5);
          text-decoration: none;
          font-size: 0.885rem; font-weight: 500;
          position: relative; overflow: hidden;
          transition: color 0.15s ease, background 0.15s ease, transform 0.12s ease;
          justify-content: ${collapsed ? 'center' : 'flex-start'};
          white-space: nowrap;
        }
        .ut-nav-link::before {
          content: '';
          position: absolute; inset: 0; border-radius: 10px;
          background: ${theme.accentLight};
          opacity: 0; transition: opacity 0.15s ease;
        }
        .ut-nav-link:hover { color: #fff; transform: translateX(${collapsed ? '0' : '3px'}); }
        .ut-nav-link:hover::before { opacity: 1; }

        .ut-nav-link.active {
          color: #fff;
          background: linear-gradient(135deg, rgba(${theme.accentRgb},0.3), rgba(${theme.accentRgb},0.1));
          border: 1px solid ${theme.accentBorder};
          box-shadow: 0 4px 16px rgba(${theme.accentRgb},0.2), inset 0 1px 0 rgba(255,255,255,0.08);
          font-weight: 600;
        }
        .ut-nav-link.active::before { opacity: 0; }

        /* Active left bar */
        .ut-nav-link.active::after {
          content: '';
          position: absolute; left: 0; top: 25%; bottom: 25%;
          width: 3px; border-radius: 0 3px 3px 0;
          background: ${theme.accent};
          box-shadow: 0 0 8px ${theme.accent};
          display: ${collapsed ? 'none' : 'block'};
        }

        /* Icon wrapper */
        .ut-nav-icon {
          font-size: 1.05rem;
          width: 22px; text-align: center; flex-shrink: 0;
          position: relative; z-index: 1;
          filter: drop-shadow(0 0 6px rgba(${theme.accentRgb},0));
          transition: filter 0.15s ease;
        }
        .ut-nav-link.active .ut-nav-icon,
        .ut-nav-link:hover .ut-nav-icon {
          filter: drop-shadow(0 0 6px rgba(${theme.accentRgb},0.7));
        }
        .ut-nav-label { position: relative; z-index: 1; }

        /* Tooltip for collapsed */
        .ut-nav-link[data-tooltip] { position: relative; }

        /* ── Collapse toggle button ── */
        .ut-collapse-btn {
          margin: auto 0.6rem 0.8rem;
          padding: 0.55rem;
          border-radius: 10px;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.08);
          color: rgba(255,255,255,0.4);
          cursor: pointer; transition: all 0.15s ease;
          display: flex; align-items: center;
          gap: 8px;
          white-space: nowrap; overflow: hidden;
          justify-content: ${collapsed ? 'center' : 'flex-start'};
        }
        .ut-collapse-btn:hover { background: rgba(255,255,255,0.1); color: rgba(255,255,255,0.8); }
        .ut-collapse-icon { transition: transform 0.28s ease; flex-shrink: 0; }
        .ut-collapse-icon.flipped { transform: scaleX(-1); }

        /* ── Bottom glow decoration ── */
        .ut-bottom-glow {
          position: absolute;
          bottom: 80px; left: ${collapsed ? '16px' : '60px'};
          width: ${collapsed ? '40px' : '140px'};
          height: 120px;
          background: radial-gradient(ellipse, rgba(${theme.accentRgb},0.12) 0%, transparent 70%);
          pointer-events: none;
          transition: all 0.28s ease;
        }

        /* ── Mobile overlay ── */
        .ut-overlay {
          position: fixed; inset: 0; z-index: 1039;
          background: rgba(0,0,0,0.5);
          backdrop-filter: blur(2px);
          animation: fadeIn 0.18s ease;
        }
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }

        /* ── Mobile sidebar ── */
        .ut-sidebar-mobile {
          position: fixed;
          top: 62px; left: 0; bottom: 0;
          width: 264px; z-index: 1040;
          background: ${theme.gradient};
          border-right: 1px solid rgba(255,255,255,0.06);
          display: flex; flex-direction: column;
          overflow-y: auto;
          animation: slideIn 0.22s cubic-bezier(0.4,0,0.2,1);
          scrollbar-width: thin;
          scrollbar-color: rgba(255,255,255,0.1) transparent;
        }
        @keyframes slideIn { from { transform: translateX(-100%) } to { transform: translateX(0) } }
      `}</style>

      {/* ── DESKTOP sidebar ── */}
      <div className="ut-sidebar d-none d-lg-flex" style={{ position: 'relative' }}>
        <SidebarContent
          user={user}
          theme={theme}
          items={items}
          collapsed={collapsed}
          onToggleCollapse={onToggleCollapse}
          onClose={undefined}
        />
        <div className="ut-bottom-glow"></div>
      </div>

      {/* ── MOBILE overlay + drawer ── */}
      {isOpen && (
        <>
          <div className="ut-overlay" onClick={onClose}></div>
          <div className="ut-sidebar-mobile">
            <SidebarContent
              user={user}
              theme={theme}
              items={items}
              collapsed={false}
              onClose={onClose}
            />
          </div>
        </>
      )}
    </>
  );
};

/* ── Extracted content so both desktop & mobile share it ── */
interface ContentProps {
  user: any;
  theme: typeof ROLE_THEME['student'];
  items: typeof NAV_ITEMS['student'];
  collapsed: boolean;
  onToggleCollapse?: () => void;
  onClose?: () => void;
}

function SidebarContent({ user, theme, items, collapsed, onToggleCollapse, onClose }: ContentProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>

      {/* Identity card */}
      <div className="ut-identity">
        <div className="ut-avatar">
          {getInitials(user.full_name)}
          <span className="ut-avatar-online"></span>
        </div>
        {!collapsed && (
          <div style={{ minWidth: 0 }}>
            <div className="ut-user-name">{user.full_name}</div>
            <div className="ut-role-chip">
              <i className={`bi ${(ROLE_THEME[user.role as keyof typeof ROLE_THEME] ?? ROLE_THEME.student).icon}`}></i>
              {(ROLE_THEME[user.role as keyof typeof ROLE_THEME] ?? ROLE_THEME.student).label}
            </div>
          </div>
        )}
      </div>

      {/* Section label */}
      <div className="ut-section-label">
        {collapsed
          ? <i className="bi bi-grid" style={{ fontSize: '0.75rem', opacity: 0.5 }}></i>
          : <><i className={`bi ${theme.icon}`}></i>{theme.label}</>
        }
      </div>

      {/* Nav items */}
      <nav style={{ flex: 1 }}>
        {items.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={onClose}
            className={({ isActive }) => `ut-nav-link${isActive ? ' active' : ''}`}
            title={collapsed ? item.label : undefined}
          >
            <i className={`bi ${item.icon} ut-nav-icon`}></i>
            {!collapsed && <span className="ut-nav-label">{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Collapse toggle (desktop only) */}
      {onToggleCollapse && (
        <button className="ut-collapse-btn" onClick={onToggleCollapse}>
          <i className={`bi bi-layout-sidebar-reverse ut-collapse-icon${collapsed ? ' flipped' : ''}`}
             style={{ fontSize: '1rem' }}></i>
          {!collapsed && <span style={{ fontSize: '0.8rem' }}>Collapse sidebar</span>}
        </button>
      )}

      {/* Mobile close row */}
      {onClose && (
        <div style={{ padding: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
          <button
            onClick={onClose}
            style={{
              width: '100%', padding: '0.55rem', borderRadius: '10px',
              background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
              color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: '0.85rem',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
            }}
          >
            <i className="bi bi-x-lg"></i> Close Menu
          </button>
        </div>
      )}
    </div>
  );
}

function getInitials(name: string) {
  return name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();
}
