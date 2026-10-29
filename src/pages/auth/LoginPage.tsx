import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.js';

const CREDS = [
  { role: 'Super Admin', email: 'superadmin@university.edu', pass: 'SuperAdmin@123', icon: 'bi-shield-fill-exclamation', accent: '#7c3aed', bg: '#f5f3ff' },
  { role: 'Administrator', email: 'admin@university.edu',   pass: 'Admin@123',      icon: 'bi-shield-fill-check',       accent: '#1d4ed8', bg: '#eff6ff' },
  { role: 'Faculty',       email: 'dr.smith@university.edu', pass: 'Teacher@123',   icon: 'bi-person-workspace',         accent: '#0369a1', bg: '#f0f9ff' },
  { role: 'Student',       email: 'alex.chen@student.university.edu', pass: 'Student@123', icon: 'bi-mortarboard-fill', accent: '#059669', bg: '#f0fdf4' },
];

export const LoginPage: React.FC = () => {
  const { login, error, clearError } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [showCreds, setShowCreds] = useState(true);

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

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem', background: 'linear-gradient(135deg,#060d1a 0%,#09182a 50%,#0d213a 100%)' }}>

      {/* Background orbs */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 0 }}>
        <div style={{ position: 'absolute', top: '-10%', left: '-5%', width: '500px', height: '500px', borderRadius: '50%', background: 'radial-gradient(circle,rgba(37,99,235,0.1),transparent 70%)' }}></div>
        <div style={{ position: 'absolute', bottom: '-10%', right: '-5%', width: '400px', height: '400px', borderRadius: '50%', background: 'radial-gradient(circle,rgba(37,99,235,0.08),transparent 70%)' }}></div>
      </div>

      <div style={{ width: '100%', maxWidth: '1020px', borderRadius: '1.25rem', overflow: 'hidden', boxShadow: '0 30px 80px rgba(0,0,0,0.5)', display: 'flex', position: 'relative', zIndex: 1 }}>

        {/* ── Left panel ── */}
        <div style={{
          flex: '0 0 46%', padding: '2.5rem 2rem',
          display: 'none',
          flexDirection: 'column', justifyContent: 'space-between',
          backgroundImage: 'linear-gradient(170deg,rgba(8,15,30,0.92) 0%,rgba(10,22,40,0.96) 100%), url(/src/assets/images/campus_hero.jpg)',
          backgroundSize: 'cover', backgroundPosition: 'center',
          color: '#fff',
        }} className="d-none d-lg-flex">

          {/* Brand */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'linear-gradient(135deg,#2563eb,#1e40af)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 0 2px rgba(37,99,235,0.4), 0 4px 14px rgba(37,99,235,0.4)' }}>
              <i className="bi bi-mortarboard-fill" style={{ fontSize: '1.2rem', color: '#fff' }}></i>
            </div>
            <div>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#f1f5f9', letterSpacing: '-0.02em' }}>UniTask</div>
              <div style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>University Portal</div>
            </div>
          </div>

          {/* Headline */}
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(37,99,235,0.2)', border: '1px solid rgba(37,99,235,0.35)', borderRadius: '20px', padding: '4px 12px', fontSize: '0.72rem', fontWeight: 700, color: '#93c5fd', marginBottom: '1.2rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              <i className="bi bi-stars" style={{ color: '#fbbf24' }}></i> Production University Portal
            </div>
            <h2 style={{ fontSize: 'clamp(1.4rem,2.5vw,2rem)', fontWeight: 800, color: '#fff', lineHeight: 1.2, letterSpacing: '-0.03em', marginBottom: '0.85rem' }}>
              Seamless Coursework, Submissions & Grading.
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.875rem', lineHeight: 1.7, marginBottom: '1.5rem' }}>
              A unified digital platform connecting students, faculty, and administrators with deadline auditing and structured evaluations.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {['Strict and late deadline compliance engine', 'Secure multi-file attachments (PDF, DOCX, ZIP)', 'Role-governed authorization with Super Admin oversight'].map(f => (
                <div key={f} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: 'rgba(255,255,255,0.65)' }}>
                  <i className="bi bi-check-circle-fill" style={{ color: '#10b981', flexShrink: 0 }}></i>
                  {f}
                </div>
              ))}
            </div>
          </div>

          <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.3)', display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '1rem' }}>
            <span>&copy; {new Date().getFullYear()} UniTask Portal</span>
            <span>Academic Session 2026–2027</span>
          </div>
        </div>

        {/* ── Right panel (form) ── */}
        <div style={{ flex: 1, background: '#fff', padding: 'clamp(1.5rem,4vw,2.75rem)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>

          {/* Mobile brand */}
          <div className="d-lg-none" style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.5rem' }}>
            <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'linear-gradient(135deg,#2563eb,#1e40af)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <i className="bi bi-mortarboard-fill text-white"></i>
            </div>
            <div>
              <div style={{ fontWeight: 800, color: '#0f2744', fontSize: '1rem' }}>UniTask Portal</div>
              <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>University Academic Management</div>
            </div>
          </div>

          <div style={{ marginBottom: '1.75rem' }}>
            <h2 style={{ fontWeight: 800, fontSize: '1.5rem', color: '#0f2744', marginBottom: '0.25rem', letterSpacing: '-0.02em' }}>Sign in to your account</h2>
            <p style={{ color: '#64748b', fontSize: '0.875rem', margin: 0 }}>Enter your institutional university credentials to proceed.</p>
          </div>

          {error && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '0.65rem 0.9rem', marginBottom: '1.1rem', fontSize: '0.875rem', color: '#dc2626' }}>
              <i className="bi bi-exclamation-triangle-fill"></i>
              <span style={{ flex: 1 }}>{error}</span>
              <button onClick={clearError} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626', fontSize: '1rem', padding: '0', lineHeight: 1 }}>×</button>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Email */}
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontWeight: 600, fontSize: '0.855rem', color: '#334155', marginBottom: '0.35rem' }}>University Email</label>
              <div style={{ position: 'relative' }}>
                <i className="bi bi-envelope" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: '0.9rem' }}></i>
                <input
                  type="email"
                  placeholder="name@university.edu"
                  value={email}
                  onChange={e => { setEmail(e.target.value); clearError?.(); }}
                  required
                  style={{ width: '100%', padding: '0.6rem 0.9rem 0.6rem 2.4rem', border: '1.5px solid #e2e8f0', borderRadius: '8px', fontSize: '0.9rem', outline: 'none', transition: 'border-color 0.15s', color: '#1e293b' }}
                  onFocus={e => e.target.style.borderColor = '#2563eb'}
                  onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                />
              </div>
            </div>

            {/* Password */}
            <div style={{ marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                <label style={{ fontWeight: 600, fontSize: '0.855rem', color: '#334155' }}>Password</label>
                <Link to="/forgot-password" style={{ fontSize: '0.8rem', color: '#64748b', textDecoration: 'none' }}>Forgot password?</Link>
              </div>
              <div style={{ position: 'relative' }}>
                <i className="bi bi-lock" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: '0.9rem' }}></i>
                <input
                  type={showPass ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  style={{ width: '100%', padding: '0.6rem 2.6rem 0.6rem 2.4rem', border: '1.5px solid #e2e8f0', borderRadius: '8px', fontSize: '0.9rem', outline: 'none', transition: 'border-color 0.15s', color: '#1e293b' }}
                  onFocus={e => e.target.style.borderColor = '#2563eb'}
                  onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                />
                <button type="button" onClick={() => setShowPass(p => !p)} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: '0.9rem', padding: 0 }}>
                  <i className={`bi bi-eye${showPass ? '-slash' : ''}`}></i>
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{ width: '100%', padding: '0.7rem', borderRadius: '8px', background: 'linear-gradient(135deg,#1e3a8a,#2563eb)', border: 'none', color: '#fff', fontWeight: 700, fontSize: '0.9rem', cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 2px 10px rgba(37,99,235,0.35)', transition: 'opacity 0.15s', opacity: loading ? 0.8 : 1 }}
            >
              {loading ? <span style={{ width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin-ut 0.6s linear infinite', display: 'inline-block' }}></span> : <i className="bi bi-box-arrow-in-right"></i>}
              {loading ? 'Signing in…' : 'Sign In to Portal'}
            </button>
          </form>

          <p style={{ textAlign: 'center', fontSize: '0.855rem', color: '#64748b', margin: '1.25rem 0' }}>
            Need an account?{' '}
            <Link to="/register" style={{ fontWeight: 700, color: '#2563eb', textDecoration: 'none' }}>Register here</Link>
          </p>

          {/* Credentials panel */}
          <div style={{ border: '1.5px solid #e2e8f0', borderRadius: '10px', overflow: 'hidden' }}>
            <button
              type="button"
              onClick={() => setShowCreds(p => !p)}
              style={{ width: '100%', padding: '0.7rem 1rem', background: '#f8fafc', border: 'none', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '7px', fontWeight: 700, fontSize: '0.83rem', color: '#334155' }}>
                <i className="bi bi-key-fill" style={{ color: '#d97706' }}></i>
                Role & Access Credentials
              </span>
              <i className={`bi bi-chevron-${showCreds ? 'up' : 'down'}`} style={{ fontSize: '0.8rem', color: '#94a3b8' }}></i>
            </button>

            {showCreds && (
              <div style={{ padding: '0.6rem', display: 'flex', flexDirection: 'column', gap: '0.4rem', background: '#fff' }}>
                {CREDS.map(c => (
                  <div key={c.role} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.55rem 0.75rem', background: '#fafbfc', border: '1px solid #f1f5f9', borderRadius: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '28px', height: '28px', borderRadius: '7px', background: c.bg, color: c.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem', flexShrink: 0 }}>
                        <i className={`bi ${c.icon}`}></i>
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.8rem', color: c.accent }}>{c.role}</div>
                        <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{c.email}</div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => { setEmail(c.email); setPassword(c.pass); clearError?.(); }}
                      style={{ padding: '0.25rem 0.65rem', borderRadius: '6px', background: c.bg, border: `1px solid ${c.accent}30`, color: c.accent, fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', flexShrink: 0 }}
                    >
                      Fill
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
