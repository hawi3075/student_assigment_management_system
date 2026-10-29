import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.js';

interface SidebarProps {
  isOpen: boolean;
  onClose?: () => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

const ROLE_THEME = {
  super_admin: {
    gradient: 'linear-gradient(160deg,#1a0a2e 0%,#16052a 40%,#0d0320 100%)',
    accent: '#a855f7', accentRgb: '168,85,247',
    accentLight: 'rgba(168,85,247,0.15)', accentBorder: 'rgba(168,85,247,0.35)',
    sectionColor: 'rgba(168,85,247,0.6)',
    label: 'Super Administration', icon: 'bi-shield-fill-exclamation',
    badgeBg: 'rgba(168,85,247,0.18)', badgeColor: '#d8b4fe',
  },
  admin: {
    gradient: 'linear-gradient(160deg,#0f0c29 0%,#0d1547 40%,#0a1628 100%)',
    accent: '#6366f1', accentRgb: '99,102,241',
    accentLight: 'rgba(99,102,241,0.15)', accentBorder: 'rgba(99,102,241,0.35)',
    sectionColor: 'rgba(99,102,241,0.6)',
    label: 'System Administration', icon: 'bi-shield-fill-check',
    badgeBg: 'rgba(99,102,241,0.18)', badgeColor: '#a5b4fc',
  },
  teacher: {
    gradient: 'linear-gradient(160deg,#071e2e 0%,#0c2a42 40%,#0a1e33 100%)',
    accent: '#0ea5e9', accentRgb: '14,165,233',
    accentLight: 'rgba(14,165,233,0.15)', accentBorder: 'rgba(14,165,233,0.35)',
    sectionColor: 'rgba(14,165,233,0.6)',
    label: 'Faculty Portal', icon: 'bi-person-workspace',
    badgeBg: 'rgba(14,165,233,0.18)', badgeColor: '#7dd3fc',
  },
  student: {
    gradient: 'linear-gradient(160deg,#051a14 0%,#0a2a1e 40%,#061810 100%)',
    accent: '#10b981', accentRgb: '16,185,129',
    accentLight: 'rgba(16,185,129,0.15)', accentBorder: 'rgba(16,185,129,0.35)',
    sectionColor: 'rgba(16,185,129,0.6)',
    label: 'Academic Portal', icon: 'bi-mortarboard-fill',
    badgeBg: 'rgba(16,185,129,0.18)', badgeColor: '#6ee7b7',
  },
};

const NAV_ITEMS: Record<string, { to: string; icon: string; label: string; end?: boolean }[]> = {
  student: [
    { to: '/student/dashboard',   icon: 'bi-grid-1x2-fill',      label: 'Dashboard',        end: true },
    { to: '/student/assignments', icon: 'bi-journal-text',        label: 'Assignments' },
    { to: '/student/submissions', icon: 'bi-file-earmark-check',  label: 'My Submissions' },
    { to: '/student/grades',      icon: 'bi-award-fill',          label: 'Grades & Feedback' },
    { to: '/student/profile',     icon: 'bi-person-badge-fill',   label: 'Student Profile' },
  ],
  teacher: [
    { to: '/teacher/dashboard',          icon: 'bi-speedometer2',       label: 'Dashboard',         end: true },
    { to: '/teacher/courses',            icon: 'bi-book-fill',          label: 'My Courses' },
    { to: '/teacher/assignments',        icon: 'bi-folder2-open',       label: 'Assignments',        end: true },
    { to: '/teacher/assignments/create', icon: 'bi-plus-circle-fill',   label: 'Create Assignment' },
    { to: '/teacher/profile',            icon: 'bi-person-lines-fill',  label: 'Faculty Profile' },
  ],
  admin: [
    { to: '/admin/dashboard', icon: 'bi-speedometer',     label: 'Overview',    end: true },
    { to: '/admin/users',     icon: 'bi-people-fill',     label: 'Users' },
    { to: '/admin/courses',   icon: 'bi-collection-fill', label: 'Courses' },
    { to: '/admin/activity',  icon: 'bi-shield-check',    label: 'Audit Logs' },
  ],
  super_admin: [
    { to: '/admin/dashboard', icon: 'bi-speedometer',     label: 'Overview',    end: true },
    { to: '/admin/users',     icon: 'bi-people-fill',     label: 'Users' },
    { to: '/admin/courses',   icon: 'bi-collection-fill', label: 'Courses' },
    { to: '/admin/activity',  icon: 'bi-shield-check',    label: 'Audit Logs' },
  ],
};

function initials(name: string): string {
  return name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  collapsed = false,
  onToggleCollapse,
}) => {
  const { user } = useAuth();
  if (!user) return null;

  const role = (user.role in ROLE_THEME ? user.role : 'student') as keyof typeof ROLE_THEME;
  const t = ROLE_THEME[role];
  const items = NAV_ITEMS[role] ?? NAV_ITEMS.student;
  const w = collapsed ? '72px' : '264px';

  const css = `
    .ut-sb {
      width: ${w};
      height: 100%;
      background: ${t.gradient};
      border-right: 1px solid rgba(255,255,255,0.06);
      display: flex;
      flex-direction: column;
      flex-shrink: 0;
      overflow-y: auto;
      overflow-x: hidden;
      transition: width 0.28s cubic-bezier(0.4,0,0.2,1);
      scrollbar-width: thin;
      scrollbar-color: rgba(255,255,255,0.1) transparent;
    }
    .ut-sb::-webkit-scrollbar { width: 3px; }
    .ut-sb::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.12); border-radius: 99px; }

    .ut-id {
      padding: ${collapsed ? '1rem 0' : '1.2rem 1rem'};
      display: flex; align-items: center; gap: 0.7rem;
      border-bottom: 1px solid rgba(255,255,255,0.07);
      justify-content: ${collapsed ? 'center' : 'flex-start'};
      position: relative; overflow: hidden; flex-shrink: 0;
    }
    .ut-id::before {
      content:''; position:absolute; inset:0;
      background: radial-gradient(circle at 0% 50%, ${t.accentLight}, transparent 70%);
      pointer-events:none;
    }
    .ut-av {
      width:40px; height:40px; border-radius:10px; flex-shrink:0;
      background: linear-gradient(135deg,${t.accent},rgba(${t.accentRgb},0.5));
      color:#fff; font-size:0.95rem; font-weight:700;
      display:flex; align-items:center; justify-content:center;
      border: 2px solid ${t.accentBorder};
      box-shadow: 0 0 14px rgba(${t.accentRgb},0.28);
      position:relative;
    }
    .ut-dot {
      position:absolute; bottom:-2px; right:-2px;
      width:9px; height:9px; border-radius:50%;
      background:#10b981; border:2px solid #0a1a10;
    }
    .ut-uname {
      font-size:0.86rem; font-weight:700; color:#f1f5f9;
      white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:148px;
    }
    .ut-chip {
      display:inline-flex; align-items:center; gap:3px;
      background:${t.badgeBg}; color:${t.badgeColor};
      border:1px solid ${t.accentBorder}; border-radius:20px;
      padding:1px 7px; font-size:0.6rem; font-weight:700;
      letter-spacing:0.07em; text-transform:uppercase; margin-top:2px;
    }

    .ut-sec {
      font-size:0.62rem; font-weight:700; letter-spacing:0.1em;
      text-transform:uppercase; color:${t.sectionColor};
      padding:${collapsed ? '0.9rem 0 0.35rem' : '1rem 1rem 0.35rem'};
      display:flex; align-items:center; gap:5px;
      white-space:nowrap; overflow:hidden; flex-shrink:0;
      justify-content:${collapsed ? 'center' : 'flex-start'};
    }
    .ut-sec-line {
      flex:1; height:1px; background:rgba(255,255,255,0.07);
    }

    .ut-link {
      display:flex; align-items:center; gap:0.7rem;
      padding:${collapsed ? '0.7rem 0' : '0.6rem 0.9rem'};
      margin:${collapsed ? '0.1rem 0.45rem' : '0.1rem 0.55rem'};
      border-radius:9px; color:rgba(255,255,255,0.48);
      text-decoration:none; font-size:0.875rem; font-weight:500;
      position:relative; overflow:hidden;
      transition:color 0.14s,background 0.14s,transform 0.12s;
      justify-content:${collapsed ? 'center' : 'flex-start'};
      white-space:nowrap; border:1px solid transparent;
    }
    .ut-link::before {
      content:''; position:absolute; inset:0; border-radius:9px;
      background:${t.accentLight}; opacity:0; transition:opacity 0.14s;
    }
    .ut-link:hover { color:#fff; transform:translateX(${collapsed ? '0' : '3px'}); }
    .ut-link:hover::before { opacity:1; }
    .ut-link.active {
      color:#fff; font-weight:600;
      background:linear-gradient(135deg,rgba(${t.accentRgb},0.28),rgba(${t.accentRgb},0.1));
      border:1px solid ${t.accentBorder};
      box-shadow:0 3px 14px rgba(${t.accentRgb},0.18), inset 0 1px 0 rgba(255,255,255,0.07);
    }
    .ut-link.active::before { opacity:0; }
    .ut-link.active::after {
      content:''; position:absolute; left:0; top:22%; bottom:22%;
      width:3px; border-radius:0 3px 3px 0;
      background:${t.accent}; box-shadow:0 0 8px ${t.accent};
      display:${collapsed ? 'none' : 'block'};
    }
    .ut-ico {
      font-size:1rem; width:20px; text-align:center; flex-shrink:0;
      position:relative; z-index:1;
      transition:filter 0.14s;
    }
    .ut-link.active .ut-ico, .ut-link:hover .ut-ico {
      filter:drop-shadow(0 0 5px rgba(${t.accentRgb},0.75));
    }
    .ut-lbl { position:relative; z-index:1; }

    .ut-colbtn {
      margin:auto 0.55rem 0.7rem;
      padding:0.5rem;
      border-radius:9px;
      background:rgba(255,255,255,0.05);
      border:1px solid rgba(255,255,255,0.08);
      color:rgba(255,255,255,0.38);
      cursor:pointer; transition:all 0.14s;
      display:flex; align-items:center; gap:7px;
      white-space:nowrap; overflow:hidden;
      justify-content:${collapsed ? 'center' : 'flex-start'};
      flex-shrink:0;
    }
    .ut-colbtn:hover { background:rgba(255,255,255,0.1); color:rgba(255,255,255,0.8); }
    .ut-colico { transition:transform 0.28s; flex-shrink:0; }
    .ut-colico.flipped { transform:scaleX(-1); }

    .ut-glow {
      position:absolute; bottom:60px; left:${collapsed ? '10px' : '50px'};
      width:${collapsed ? '50px' : '160px'}; height:100px;
      background:radial-gradient(ellipse,rgba(${t.accentRgb},0.1) 0%,transparent 70%);
      pointer-events:none; transition:all 0.28s;
    }

    .ut-overlay {
      position:fixed; inset:0; z-index:1039;
      background:rgba(0,0,0,0.52); backdrop-filter:blur(2px);
    }
    .ut-mob {
      position:fixed; top:62px; left:0; bottom:0;
      width:264px; z-index:1040;
      background:${t.gradient};
      border-right:1px solid rgba(255,255,255,0.06);
      display:flex; flex-direction:column;
      overflow-y:auto; overflow-x:hidden;
      scrollbar-width:thin;
      scrollbar-color:rgba(255,255,255,0.1) transparent;
    }
  `;

  const content = (isCollapsed: boolean, closeFn?: () => void) => (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>

      {/* Identity */}
      <div className="ut-id">
        <div className="ut-av">
          {initials(user.full_name)}
          <span className="ut-dot"></span>
        </div>
        {!isCollapsed && (
          <div style={{ minWidth: 0 }}>
            <div className="ut-uname">{user.full_name}</div>
            <div className="ut-chip">
              <i className={`bi ${t.icon}`}></i>
              {t.label}
            </div>
          </div>
        )}
      </div>

      {/* Section header */}
      <div className="ut-sec">
        <i className={`bi ${t.icon}`} style={{ fontSize: '0.75rem' }}></i>
        {!isCollapsed && (
          <React.Fragment>
            <span>{t.label}</span>
            <span className="ut-sec-line"></span>
          </React.Fragment>
        )}
      </div>

      {/* Nav links */}
      <nav style={{ flex: 1 }}>
        {items.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end ?? false}
            onClick={closeFn}
            title={isCollapsed ? item.label : undefined}
            className={({ isActive }) => `ut-link${isActive ? ' active' : ''}`}
          >
            <i className={`bi ${item.icon} ut-ico`}></i>
            {!isCollapsed && <span className="ut-lbl">{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Collapse button — desktop only */}
      {onToggleCollapse && !closeFn && (
        <button className="ut-colbtn" onClick={onToggleCollapse}>
          <i
            className={`bi bi-layout-sidebar ut-colico${isCollapsed ? ' flipped' : ''}`}
            style={{ fontSize: '1rem' }}
          ></i>
          {!isCollapsed && <span style={{ fontSize: '0.78rem' }}>Collapse sidebar</span>}
        </button>
      )}

      {/* Close button — mobile only */}
      {closeFn && (
        <div style={{ padding: '0.65rem', borderTop: '1px solid rgba(255,255,255,0.07)', flexShrink: 0 }}>
          <button
            onClick={closeFn}
            style={{
              width: '100%', padding: '0.5rem', borderRadius: '9px',
              background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
              color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: '0.83rem',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px',
            }}
          >
            <i className="bi bi-x-lg"></i> Close Menu
          </button>
        </div>
      )}
    </div>
  );

  return (
    <React.Fragment>
      <style>{css}</style>

      {/* Desktop — always visible, fills parent height */}
      <div className="ut-sb d-none d-lg-flex" style={{ position: 'relative' }}>
        {content(collapsed)}
        <div className="ut-glow"></div>
      </div>

      {/* Mobile overlay + drawer */}
      {isOpen && (
        <React.Fragment>
          <div className="ut-overlay" onClick={onClose}></div>
          <div className="ut-mob">
            {content(false, onClose)}
          </div>
        </React.Fragment>
      )}
    </React.Fragment>
  );
};
