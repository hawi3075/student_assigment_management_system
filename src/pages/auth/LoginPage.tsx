import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.js';

export const LoginPage: React.FC = () => {
  const { login, error, clearError } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showCredentials, setShowCredentials] = useState(true);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setLoading(true);
    const success = await login(email, password);
    setLoading(false);

    if (success) {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      if (user.role === 'admin' || user.role === 'super_admin') navigate('/admin/dashboard');
      else if (user.role === 'teacher') navigate('/teacher/dashboard');
      else navigate('/student/dashboard');
    }
  };

  const fillCredential = (fillEmail: string, fillPass: string) => {
    setEmail(fillEmail);
    setPassword(fillPass);
  };

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center p-3 p-md-4" style={{ backgroundColor: '#09182a' }}>
      <div className="card card-unitask border-0 shadow-lg overflow-hidden w-100" style={{ maxWidth: '1050px', borderRadius: '1rem' }}>
        <div className="row g-0">
          {/* Left Column: Visual Campus Hero & Branding */}
          <div className="col-12 col-lg-6 d-none d-lg-flex flex-column justify-content-between p-5 text-white position-relative" style={{
            backgroundImage: `linear-gradient(180deg, rgba(13, 33, 58, 0.85) 0%, rgba(15, 39, 68, 0.95) 100%), url('/src/assets/images/campus_hero.jpg')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}>
            <div className="d-flex align-items-center gap-3">
              <div
                className="d-flex align-items-center justify-content-center bg-white text-primary rounded-3 shadow"
                style={{ width: '44px', height: '44px' }}
              >
                <i className="bi bi-mortarboard-fill fs-4" style={{ color: '#0f2744' }}></i>
              </div>
              <div>
                <h4 className="fw-bold tracking-tight mb-0 text-white">UniTask</h4>
                <div className="small text-white-50">University Academic Management</div>
              </div>
            </div>

            <div className="my-5">
              <span className="badge bg-primary bg-opacity-50 text-white border border-light border-opacity-25 px-3 py-2 rounded-pill small mb-3">
                <i className="bi bi-stars me-1 text-warning"></i> Production University Portal
              </span>
              <h2 className="display-6 fw-bold text-white mb-3" style={{ lineHeight: '1.2' }}>
                Seamless Coursework, Submissions & Grading.
              </h2>
              <p className="text-white-50 small mb-4" style={{ lineHeight: '1.7' }}>
                A unified digital platform connecting students, faculty instructors, and academic administrators with deadline auditing and structured evaluations.
              </p>

              <div className="d-flex flex-column gap-2 small text-white-50">
                <div className="d-flex align-items-center gap-2">
                  <i className="bi bi-check-circle-fill text-success"></i>
                  <span>Strict and late deadline compliance engine</span>
                </div>
                <div className="d-flex align-items-center gap-2">
                  <i className="bi bi-check-circle-fill text-success"></i>
                  <span>Secure multi-file attachments (PDF, DOCX, ZIP, code)</span>
                </div>
                <div className="d-flex align-items-center gap-2">
                  <i className="bi bi-check-circle-fill text-success"></i>
                  <span>Role-governed authorization with Super Admin oversight</span>
                </div>
              </div>
            </div>

            <div className="small text-white-50 border-top border-light border-opacity-10 pt-3 d-flex justify-content-between align-items-center">
              <span>&copy; {new Date().getFullYear()} UniTask Portal</span>
              <span>Academic Session 2026&ndash;2027</span>
            </div>
          </div>

          {/* Right Column: Sign In Form & Evaluation Credentials */}
          <div className="col-12 col-lg-6 bg-white p-4 p-md-5 d-flex flex-column justify-content-center">
            <div className="mb-4">
              <div className="d-lg-none d-flex align-items-center gap-2 mb-3">
                <div className="p-2 bg-primary text-white rounded">
                  <i className="bi bi-mortarboard-fill"></i>
                </div>
                <span className="fw-bold fs-5">UniTask Portal</span>
              </div>
              <h3 className="fw-bold text-dark mb-1">Sign in to your account</h3>
              <p className="text-muted small">Enter your institutional university credentials to proceed.</p>
            </div>

            {error && (
              <div className="alert alert-danger alert-dismissible fade show small py-2 mb-3" role="alert">
                <i className="bi bi-exclamation-triangle-fill me-2"></i>{error}
                <button type="button" className="btn-close py-2" onClick={clearError}></button>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label className="form-label">University Email</label>
                <div className="input-group">
                  <span className="input-group-text bg-light text-muted border-end-0">
                    <i className="bi bi-envelope"></i>
                  </span>
                  <input
                    type="email"
                    className="form-control border-start-0"
                    placeholder="name@university.edu"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="mb-3">
                <div className="d-flex justify-content-between align-items-center">
                  <label className="form-label mb-0">Password</label>
                  <Link to="/forgot-password" className="small text-decoration-none text-muted">
                    Forgot password?
                  </Link>
                </div>
                <div className="input-group mt-1">
                  <span className="input-group-text bg-light text-muted border-end-0">
                    <i className="bi bi-lock"></i>
                  </span>
                  <input
                    type="password"
                    className="form-control border-start-0"
                    placeholder="••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn btn-unitask-primary w-100 py-2 mt-2 mb-3 d-flex align-items-center justify-content-center gap-2 shadow-sm"
              >
                {loading && <span className="spinner-border spinner-border-sm" role="status"></span>}
                <i className="bi bi-box-arrow-in-right"></i> Sign In to Portal
              </button>
            </form>

            <div className="text-center small text-muted mb-4">
              Need a new student or faculty account?{' '}
              <Link to="/register" className="fw-bold text-decoration-none">
                Register here
              </Link>
            </div>

            {/* Evaluation & Testing Roles Guide */}
            <div className="border rounded-3 p-3 bg-light">
              <div
                className="d-flex justify-content-between align-items-center cursor-pointer"
                style={{ cursor: 'pointer' }}
                onClick={() => setShowCredentials(!showCredentials)}
              >
                <div className="fw-bold small text-dark d-flex align-items-center gap-1">
                  <i className="bi bi-key-fill text-warning"></i>
                  <span>Role & Access Credentials</span>
                </div>
                <button
                  type="button"
                  className="btn btn-link btn-sm p-0 text-decoration-none text-muted"
                >
                  <i className={`bi bi-chevron-${showCredentials ? 'up' : 'down'}`}></i>
                </button>
              </div>

              {showCredentials && (
                <div className="mt-3 d-flex flex-column gap-2">
                  {/* Super Admin */}
                  <div className="d-flex justify-content-between align-items-center p-2 bg-white rounded border small">
                    <div>
                      <div className="fw-bold text-danger">Super Administrator</div>
                      <div className="text-muted" style={{ fontSize: '0.75rem' }}>superadmin@university.edu &bull; <code>SuperAdmin@123</code></div>
                    </div>
                    <button
                      type="button"
                      onClick={() => fillCredential('superadmin@university.edu', 'SuperAdmin@123')}
                      className="btn btn-sm btn-outline-danger py-0 px-2"
                      style={{ fontSize: '0.75rem' }}
                    >
                      Fill
                    </button>
                  </div>

                  {/* Regular Admin */}
                  <div className="d-flex justify-content-between align-items-center p-2 bg-white rounded border small">
                    <div>
                      <div className="fw-bold text-dark">Administrator</div>
                      <div className="text-muted" style={{ fontSize: '0.75rem' }}>admin@university.edu &bull; <code>Admin@123</code></div>
                    </div>
                    <button
                      type="button"
                      onClick={() => fillCredential('admin@university.edu', 'Admin@123')}
                      className="btn btn-sm btn-outline-secondary py-0 px-2"
                      style={{ fontSize: '0.75rem' }}
                    >
                      Fill
                    </button>
                  </div>

                  {/* Teacher */}
                  <div className="d-flex justify-content-between align-items-center p-2 bg-white rounded border small">
                    <div>
                      <div className="fw-bold text-primary">Teacher (Faculty)</div>
                      <div className="text-muted" style={{ fontSize: '0.75rem' }}>dr.smith@university.edu &bull; <code>Teacher@123</code></div>
                    </div>
                    <button
                      type="button"
                      onClick={() => fillCredential('dr.smith@university.edu', 'Teacher@123')}
                      className="btn btn-sm btn-outline-primary py-0 px-2"
                      style={{ fontSize: '0.75rem' }}
                    >
                      Fill
                    </button>
                  </div>

                  {/* Student */}
                  <div className="d-flex justify-content-between align-items-center p-2 bg-white rounded border small">
                    <div>
                      <div className="fw-bold text-success">Student</div>
                      <div className="text-muted" style={{ fontSize: '0.75rem' }}>alex.chen@student.university.edu &bull; <code>Student@123</code></div>
                    </div>
                    <button
                      type="button"
                      onClick={() => fillCredential('alex.chen@student.university.edu', 'Student@123')}
                      className="btn btn-sm btn-outline-success py-0 px-2"
                      style={{ fontSize: '0.75rem' }}
                    >
                      Fill
                    </button>
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};
