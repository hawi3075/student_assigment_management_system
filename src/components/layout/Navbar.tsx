import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.js';

interface NavbarProps {
  onToggleSidebar?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleSidebar }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const roleBadgeClass = {
    super_admin: 'bg-danger text-white border-danger',
    admin: 'bg-dark text-white',
    teacher: 'bg-info text-white',
    student: 'bg-success text-white'
  }[user?.role || 'student'];

  const roleLabel = {
    super_admin: 'Super Admin',
    admin: 'Administrator',
    teacher: 'Faculty',
    student: 'Student'
  }[user?.role || 'student'];

  return (
    <nav className="navbar navbar-expand-lg navbar-dark navbar-unitask sticky-top py-2 px-3">
      <div className="container-fluid px-0">
        <div className="d-flex align-items-center">
          {user && (
            <button
              className="btn btn-link text-white d-lg-none me-2 p-1"
              onClick={onToggleSidebar}
              aria-label="Toggle Navigation"
            >
              <i className="bi bi-list fs-4"></i>
            </button>
          )}

          <Link to="/" className="navbar-brand d-flex align-items-center gap-2 m-0 text-decoration-none">
            <div
              className="d-flex align-items-center justify-content-center bg-primary text-white rounded-3 shadow-sm"
              style={{ width: '38px', height: '38px', backgroundColor: '#1e3a8a' }}
            >
              <i className="bi bi-mortarboard-fill fs-5"></i>
            </div>
            <div>
              <span className="fw-bold tracking-tight text-white fs-5">UniTask</span>
              <span className="d-none d-sm-inline-block brand-badge ms-2">University Portal</span>
            </div>
          </Link>
        </div>

        <div className="d-flex align-items-center gap-3">
          {/* User Profile / Logout */}
          {user ? (
            <div className="dropdown">
              <button
                className="btn btn-link text-white text-decoration-none dropdown-toggle d-flex align-items-center gap-2 p-0"
                type="button"
                data-bs-toggle="dropdown"
              >
                <div
                  className="rounded-circle bg-light text-dark fw-bold d-flex align-items-center justify-content-center shadow-sm"
                  style={{ width: '36px', height: '36px', fontSize: '0.9rem' }}
                >
                  {user.full_name.charAt(0).toUpperCase()}
                </div>
                <div className="d-none d-lg-block text-start" style={{ lineHeight: '1.2' }}>
                  <div className="small fw-semibold">{user.full_name}</div>
                  <span className={`badge ${roleBadgeClass} text-uppercase`} style={{ fontSize: '0.65rem' }}>
                    {roleLabel}
                  </span>
                </div>
              </button>
              <ul className="dropdown-menu dropdown-menu-end shadow-lg border-0 py-2" style={{ minWidth: '220px' }}>
                <li className="px-3 py-2 border-bottom">
                  <div className="fw-bold text-dark">{user.full_name}</div>
                  <div className="text-muted small text-truncate">{user.email}</div>
                  <span className={`badge ${roleBadgeClass} mt-1`} style={{ fontSize: '0.65rem' }}>
                    {roleLabel}
                  </span>
                </li>
                <li>
                  <Link to={`/${user.role === 'super_admin' ? 'admin' : user.role}/profile`} className="dropdown-item d-flex align-items-center gap-2 py-2">
                    <i className="bi bi-person-gear text-primary"></i> Account Profile
                  </Link>
                </li>
                <li><hr className="dropdown-divider" /></li>
                <li>
                  <button onClick={handleLogout} className="dropdown-item text-danger d-flex align-items-center gap-2 py-2">
                    <i className="bi bi-box-arrow-right"></i> Sign Out
                  </button>
                </li>
              </ul>
            </div>
          ) : (
            <div className="d-flex align-items-center gap-2">
              <Link to="/login" className="btn btn-sm btn-outline-light px-3">Sign In</Link>
              <Link to="/register" className="btn btn-sm btn-light px-3 text-dark fw-semibold">Register</Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};
