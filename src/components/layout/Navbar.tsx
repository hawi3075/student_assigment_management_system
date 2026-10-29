import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.js';

interface NavbarProps {
  onToggleSidebar?: () => void;
}

const ROLE_CONFIG = {
  super_admin: {
    label: 'Super Admin',
    badgeClass: 'role-badge-superadmin',
    avatarClass: 'avatar-superadmin',
    icon: 'bi-shield-fill-exclamation',
    accentColor: '#ef4444',
  },
  admin: {
    label: 'Administrator',
    badgeClass: 'role-badge-admin',
    avatarClass: 'avatar-admin',
    icon: 'bi-shield-fill-check',
    accentColor: '#6366f1',
  },
  teacher: {
    label: 'Faculty',
    badgeClass: 'role-badge-teacher',
    avatarClass: 'avatar-teacher',
    icon: 'bi-person-workspace',
    accentColor: '#0ea5e9',
  },
  student: {
    label: 'Student',
    badgeClass: 'role-badge-student',
    avatarClass: 'avatar-student',
    icon: 'bi-mortarboard-fill',
    accentColor: '#10b981',
  },
};

function LiveClock() {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return (
    <div className="navbar-clock d-none d-xl-flex flex-column align-items-end">
      <span className="clock-time">
        {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
      </span>
      <span className="clock-date">
        {time.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}
      </span>
    </div>
  );
}

function getInitials(name: string) {
  return name
    .split(' ')
    .slice(0, 2)
    .map(n => n[0])
    .join('')
    .toUpperCase();
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleSidebar }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const role = user?.role ?? 'student';
  const cfg = ROLE_CONFIG[role as keyof typeof ROLE_CONFIG] ?? ROLE_CONFIG.student;

  const profilePath =
    role === 'super_admin' || role === 'admin'
      ? '/admin/profile'
      : `/${role}/profile`;

  return (
    <>
      {/* ── Inline styles (scoped to navbar) ── */}
      <style>{`
        .navbar-unitask {
          background: linear-gradient(135deg, #0a1628 0%, #0d213a 55%, #0f2f55 100%);
          border-bottom: 1px solid rgba(255,255,255,0.07);
          box-shadow: ${scrolled ? '0 4px 24px rgba(0,0,0,0.35)' : '0 2px 10px rgba(0,0,0,0.15)'};
          transition: box-shadow 0.3s ease;
          padding: 0 1.25rem;
          height: 62px;
        }

        /* Brand */
        .brand-logo-ring {
          width: 40px; height: 40px;
          background: linear-gradient(135deg, #2563eb, #1e40af);
          border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 0 0 2px rgba(37,99,235,0.4), 0 4px 12px rgba(37,99,235,0.35);
          transition: transform 0.2s ease;
        }
        .navbar-brand:hover .brand-logo-ring { transform: rotate(-6deg) scale(1.08); }
        .brand-name {
          font-size: 1.15rem; font-weight: 800;
          background: linear-gradient(90deg, #e2e8f0, #94a3b8);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
          letter-spacing: -0.02em;
        }
        .brand-sub {
          font-size: 0.68rem; font-weight: 600; letter-spacing: 0.1em;
          color: rgba(255,255,255,0.38); text-transform: uppercase;
        }

        /* Separator */
        .nav-separator {
          width: 1px; height: 28px;
          background: rgba(255,255,255,0.1);
          margin: 0 0.5rem;
        }

        /* Clock */
        .navbar-clock { gap: 1px; }
        .clock-time {
          font-size: 0.88rem; font-weight: 700; color: #e2e8f0;
          font-variant-numeric: tabular-nums; letter-spacing: 0.03em;
        }
        .clock-date { font-size: 0.68rem; color: rgba(255,255,255,0.4); letter-spacing: 0.04em; }

        /* Sidebar toggle btn */
        .sidebar-toggle-btn {
          width: 36px; height: 36px;
          background: rgba(255,255,255,0.07);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 8px; color: #94a3b8;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; transition: all 0.15s ease;
        }
        .sidebar-toggle-btn:hover { background: rgba(255,255,255,0.14); color: #fff; }

        /* Icon pill buttons */
        .nav-icon-btn {
          width: 38px; height: 38px;
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.09);
          border-radius: 9px; color: #94a3b8;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; transition: all 0.18s ease;
          position: relative;
        }
        .nav-icon-btn:hover { background: rgba(255,255,255,0.13); color: #e2e8f0; border-color: rgba(255,255,255,0.18); }
        .nav-icon-btn .badge-dot {
          position: absolute; top: 6px; right: 6px;
          width: 8px; height: 8px;
          background: #f59e0b; border-radius: 50%;
          border: 1.5px solid #0d213a;
          animation: pulse-dot 2s ease-in-out infinite;
        }
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(0.75); }
        }

        /* Avatar */
        .user-avatar {
          width: 38px; height: 38px; border-radius: 10px;
          font-size: 0.9rem; font-weight: 700;
          display: flex; align-items: center; justify-content: center;
          border: 2px solid rgba(255,255,255,0.2);
          transition: border-color 0.2s ease, transform 0.2s ease;
          flex-shrink: 0;
        }
        .avatar-superadmin { background: linear-gradient(135deg,#ef4444,#b91c1c); color:#fff; }
        .avatar-admin      { background: linear-gradient(135deg,#6366f1,#4338ca); color:#fff; }
        .avatar-teacher    { background: linear-gradient(135deg,#0ea5e9,#0369a1); color:#fff; }
        .avatar-student    { background: linear-gradient(135deg,#10b981,#047857); color:#fff; }

        /* User dropdown trigger */
        .user-trigger {
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 10px; padding: 4px 10px 4px 5px;
          cursor: pointer; transition: all 0.18s ease;
          display: flex; align-items: center; gap: 9px;
        }
        .user-trigger:hover { background: rgba(255,255,255,0.12); border-color: rgba(255,255,255,0.2); }
        .user-trigger:hover .user-avatar { transform: scale(1.05); border-color: rgba(255,255,255,0.4); }
        .user-name-text { font-size: 0.85rem; font-weight: 600; color: #e2e8f0; line-height: 1.2; }
        .user-role-text { font-size: 0.65rem; font-weight: 600; letter-spacing: 0.06em; text-transform: uppercase; }

        /* Role badge colors */
        .role-badge-superadmin { color: #fca5a5; }
        .role-badge-admin      { color: #a5b4fc; }
        .role-badge-teacher    { color: #7dd3fc; }
        .role-badge-student    { color: #6ee7b7; }

        /* Dropdown */
        .navbar-dropdown {
          min-width: 250px;
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 14px;
          box-shadow: 0 20px 50px rgba(0,0,0,0.18), 0 4px 12px rgba(0,0,0,0.1);
          padding: 0; overflow: hidden;
          margin-top: 8px !important;
        }
        .dropdown-header-band {
          padding: 1.1rem 1.2rem 1rem;
          background: linear-gradient(135deg, #0a1628, #0d213a);
          position: relative; overflow: hidden;
        }
        .dropdown-header-band::before {
          content: '';
          position: absolute; inset: 0;
          background: radial-gradient(circle at 80% 20%, rgba(37,99,235,0.25), transparent 60%);
        }
        .dropdown-avatar-lg {
          width: 46px; height: 46px; border-radius: 12px;
          font-size: 1.1rem; font-weight: 700;
          display: flex; align-items: center; justify-content: center;
          border: 2px solid rgba(255,255,255,0.25);
          flex-shrink: 0; position: relative; z-index: 1;
        }
        .dropdown-user-name {
          font-weight: 700; font-size: 0.95rem; color: #f1f5f9; line-height: 1.25;
        }
        .dropdown-user-email {
          font-size: 0.75rem; color: rgba(255,255,255,0.5);
          max-width: 160px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
        }
        .dropdown-role-chip {
          display: inline-flex; align-items: center; gap: 4px;
          background: rgba(255,255,255,0.12);
          border: 1px solid rgba(255,255,255,0.18);
          border-radius: 20px; padding: 2px 8px;
          font-size: 0.65rem; font-weight: 700; letter-spacing: 0.06em;
          text-transform: uppercase; color: rgba(255,255,255,0.8);
          margin-top: 4px; position: relative; z-index: 1;
        }
        .dropdown-body { padding: 0.4rem; }
        .dropdown-item-custom {
          display: flex; align-items: center; gap: 10px;
          padding: 0.6rem 0.75rem;
          border-radius: 8px; text-decoration: none;
          font-size: 0.875rem; font-weight: 500; color: #334155;
          transition: all 0.13s ease; cursor: pointer; border: none;
          background: transparent; width: 100%; text-align: left;
        }
        .dropdown-item-custom:hover { background: #f1f5f9; color: #0f2744; }
        .dropdown-item-custom .item-icon {
          width: 30px; height: 30px; border-radius: 7px;
          display: flex; align-items: center; justify-content: center;
          font-size: 0.9rem; flex-shrink: 0;
        }
        .dropdown-item-custom .item-label { flex: 1; }
        .dropdown-divider-custom { height: 1px; background: #f1f5f9; margin: 0.3rem 0; }
        .dropdown-item-custom.logout-item:hover { background: #fef2f2; color: #dc2626; }

        /* Online indicator */
        .online-dot {
          width: 9px; height: 9px; background: #10b981;
          border-radius: 50%; border: 1.5px solid #fff;
          position: absolute; bottom: -2px; right: -2px;
        }

        /* Auth buttons */
        .btn-nav-signin {
          padding: 0.4rem 1rem; border-radius: 8px; font-size: 0.85rem; font-weight: 600;
          border: 1px solid rgba(255,255,255,0.25); color: #e2e8f0;
          background: transparent; transition: all 0.15s ease;
        }
        .btn-nav-signin:hover { background: rgba(255,255,255,0.1); color: #fff; }
        .btn-nav-register {
          padding: 0.4rem 1rem; border-radius: 8px; font-size: 0.85rem; font-weight: 600;
          background: linear-gradient(135deg, #2563eb, #1d4ed8);
          color: #fff; border: none;
          box-shadow: 0 2px 8px rgba(37,99,235,0.4);
          transition: all 0.15s ease;
        }
        .btn-nav-register:hover { background: linear-gradient(135deg, #1d4ed8, #1e40af); transform: translateY(-1px); }
      `}</style>

      <nav className="navbar navbar-unitask sticky-top d-flex align-items-center">
        <div className="container-fluid px-0 d-flex align-items-center gap-2" style={{ height: '62px' }}>

          {/* ── Left: Toggle + Brand ── */}
          <div className="d-flex align-items-center gap-2 flex-shrink-0">
            {user && (
              <button
                className="sidebar-toggle-btn d-lg-none"
                onClick={onToggleSidebar}
                aria-label="Toggle sidebar"
              >
                <i className="bi bi-list" style={{ fontSize: '1.2rem' }}></i>
              </button>
            )}

            <Link to="/" className="navbar-brand d-flex align-items-center gap-2 m-0 text-decoration-none">
              <div className="brand-logo-ring">
                <i className="bi bi-mortarboard-fill text-white" style={{ fontSize: '1.1rem' }}></i>
              </div>
              <div className="d-none d-sm-flex flex-column" style={{ gap: '1px' }}>
                <span className="brand-name">UniTask</span>
                <span className="brand-sub">University Portal</span>
              </div>
            </Link>
          </div>

          {/* ── Middle spacer ── */}
          <div className="flex-grow-1"></div>

          {/* ── Right controls ── */}
          <div className="d-flex align-items-center gap-2">

            {user ? (
              <>
                <LiveClock />
                <div className="nav-separator d-none d-xl-block"></div>

                {/* Notification bell */}
                <div className="nav-icon-btn" title="Notifications">
                  <i className="bi bi-bell" style={{ fontSize: '1rem' }}></i>
                  <span className="badge-dot"></span>
                </div>

                <div className="nav-separator"></div>

                {/* User dropdown */}
                <div className="dropdown">
                  <div
                    className="user-trigger dropdown-toggle"
                    data-bs-toggle="dropdown"
                    aria-expanded="false"
                    style={{ listStyle: 'none' }}
                  >
                    <div className={`user-avatar ${cfg.avatarClass}`} style={{ position: 'relative' }}>
                      {getInitials(user.full_name)}
                      <span className="online-dot"></span>
                    </div>
                    <div className="d-none d-md-flex flex-column">
                      <span className="user-name-text">{user.full_name.split(' ')[0]}</span>
                      <span className={`user-role-text ${cfg.badgeClass}`}>{cfg.label}</span>
                    </div>
                    <i className="bi bi-chevron-down d-none d-md-block" style={{ fontSize: '0.7rem', color: '#64748b' }}></i>
                  </div>

                  <ul className="dropdown-menu dropdown-menu-end navbar-dropdown p-0">
                    {/* Header band */}
                    <li>
                      <div className="dropdown-header-band">
                        <div className="d-flex align-items-center gap-3">
                          <div className={`dropdown-avatar-lg ${cfg.avatarClass}`} style={{ position: 'relative' }}>
                            {getInitials(user.full_name)}
                            <span className="online-dot"></span>
                          </div>
                          <div style={{ minWidth: 0 }}>
                            <div className="dropdown-user-name">{user.full_name}</div>
                            <div className="dropdown-user-email">{user.email}</div>
                            <div className="dropdown-role-chip">
                              <i className={`bi ${cfg.icon}`}></i>
                              {cfg.label}
                            </div>
                          </div>
                        </div>
                      </div>
                    </li>

                    {/* Menu items */}
                    <li>
                      <div className="dropdown-body">
                        <Link to={profilePath} className="dropdown-item-custom">
                          <span className="item-icon" style={{ background: '#eff6ff', color: '#2563eb' }}>
                            <i className="bi bi-person-gear"></i>
                          </span>
                          <span className="item-label">My Profile</span>
                          <i className="bi bi-chevron-right" style={{ fontSize: '0.7rem', color: '#94a3b8' }}></i>
                        </Link>

                        <Link
                          to={
                            role === 'admin' || role === 'super_admin'
                              ? '/admin/dashboard'
                              : `/${role}/dashboard`
                          }
                          className="dropdown-item-custom"
                        >
                          <span className="item-icon" style={{ background: '#f0fdf4', color: '#16a34a' }}>
                            <i className="bi bi-grid-1x2"></i>
                          </span>
                          <span className="item-label">Dashboard</span>
                          <i className="bi bi-chevron-right" style={{ fontSize: '0.7rem', color: '#94a3b8' }}></i>
                        </Link>

                        <div className="dropdown-divider-custom"></div>

                        <button onClick={handleLogout} className="dropdown-item-custom logout-item">
                          <span className="item-icon" style={{ background: '#fef2f2', color: '#dc2626' }}>
                            <i className="bi bi-box-arrow-right"></i>
                          </span>
                          <span className="item-label">Sign Out</span>
                        </button>
                      </div>
                    </li>
                  </ul>
                </div>
              </>
            ) : (
              <>
                <Link to="/login" className="btn-nav-signin">Sign In</Link>
                <Link to="/register" className="btn-nav-register">Register</Link>
              </>
            )}
          </div>
        </div>
      </nav>
    </>
  );
};
