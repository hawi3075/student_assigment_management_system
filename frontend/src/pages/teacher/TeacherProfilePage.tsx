import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { userApi } from '../../services/api.js';

function initials(name: string) {
  return name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();
}

export const TeacherProfilePage: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const [fullName,   setFullName]   = useState(user?.full_name  || '');
  const [department, setDepartment] = useState(user?.department || '');
  const [bio,        setBio]        = useState(user?.bio        || '');
  const [saving,     setSaving]     = useState(false);
  const [message,    setMessage]    = useState<{ type: 'success' | 'danger'; text: string } | null>(null);

  useEffect(() => {
    if (user) {
      setFullName(user.full_name  || '');
      setDepartment(user.department || '');
      setBio(user.bio  || '');
    }
  }, [user]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      await userApi.updateProfile({ full_name: fullName, department, bio });
      await refreshUser();
      setMessage({ type: 'success', text: 'Faculty profile saved successfully.' });
    } catch (err: any) {
      setMessage({ type: 'danger', text: err.response?.data?.error || 'Failed to update profile.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <style>{`
        .prof-cover {
          height: 120px;
          background: linear-gradient(135deg,#0a1628 0%,#0d213a 55%,#1e3a8a 100%);
          border-radius: 14px 14px 0 0;
          position: relative; overflow: hidden;
        }
        .prof-cover::before {
          content:''; position:absolute; inset:0;
          background: radial-gradient(circle at 85% 40%, rgba(37,99,235,0.35), transparent 55%);
        }
        .prof-cover::after {
          content:''; position:absolute; inset:0;
          background: radial-gradient(circle at 15% 75%, rgba(14,165,233,0.15), transparent 50%);
        }
        .prof-avatar {
          width: 88px; height: 88px; border-radius: 20px;
          background: linear-gradient(135deg,#1e3a8a,#2563eb);
          color: #fff; font-size: 2rem; font-weight: 800;
          display: flex; align-items: center; justify-content: center;
          border: 3px solid rgba(37,99,235,0.25);
          box-shadow: 0 0 0 4px rgba(37,99,235,0.08), 0 8px 24px rgba(37,99,235,0.2);
          position: relative; flex-shrink: 0;
        }
        .prof-online {
          position: absolute; bottom: -3px; right: -3px;
          width: 14px; height: 14px; border-radius: 50%;
          background: #10b981; border: 2.5px solid #fff;
        }
        .info-row {
          display: flex; align-items: center; gap: 10px;
          padding: 0.6rem 0.85rem; border-bottom: 1px solid #f1f5f9;
          font-size: 0.875rem;
        }
        .info-row:last-child { border-bottom: none; }
        .info-icon {
          width: 32px; height: 32px; border-radius: 8px;
          display: flex; align-items: center; justify-content: center;
          font-size: 0.9rem; flex-shrink: 0;
        }
        .fi { display: flex; flex-direction: column; gap: 5px; margin-bottom: 1rem; }
        .fi label { font-size: 0.82rem; font-weight: 700; color: #334155; display: flex; align-items: center; gap: 5px; }
        .fi-input {
          width: 100%; padding: 0.62rem 0.9rem;
          border: 1.5px solid #e2e8f0; border-radius: 9px;
          font-size: 0.9rem; color: #1e293b;
          background: #fff; outline: none;
          transition: border-color 0.15s, box-shadow 0.15s;
          font-family: inherit;
        }
        .fi-input:focus { border-color: #2563eb; box-shadow: 0 0 0 3px rgba(37,99,235,0.1); }
        .fi-input:disabled { background: #f8fafc; color: #94a3b8; cursor: not-allowed; }
        .submit-btn {
          width: 100%; padding: 0.72rem;
          background: linear-gradient(135deg,#1e3a8a,#2563eb);
          border: none; border-radius: 10px;
          color: #fff; font-weight: 700; font-size: 0.9rem;
          cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px;
          box-shadow: 0 3px 12px rgba(37,99,235,0.35);
          transition: all 0.15s;
        }
        .submit-btn:hover:not(:disabled) { box-shadow: 0 5px 18px rgba(37,99,235,0.45); transform: translateY(-1px); }
        .submit-btn:disabled { opacity: 0.7; cursor: not-allowed; }
        .toast-msg {
          display: flex; align-items: center; gap: 8px;
          padding: 0.7rem 1rem; border-radius: 10px;
          font-size: 0.875rem; font-weight: 500;
          margin-bottom: 1.25rem; position: relative;
        }
        .toast-success { background: #f0fdf4; border: 1px solid #bbf7d0; color: #059669; }
        .toast-danger  { background: #fef2f2; border: 1px solid #fecaca; color: #dc2626; }
        .toast-close {
          position: absolute; right: 10px; top: 50%; transform: translateY(-50%);
          background: none; border: none; cursor: pointer;
          font-size: 1rem; color: inherit; opacity: 0.6; padding: 0;
        }
        .section-label {
          font-size: 0.72rem; font-weight: 700; color: #94a3b8;
          text-transform: uppercase; letter-spacing: 0.08em;
          margin-bottom: 0.9rem;
        }
      `}</style>

      {/* ── Page header ── */}
      <div className="page-header fade-up">
        <div>
          <h1 className="page-title">Faculty Profile</h1>
          <p className="page-subtitle">Manage your academic profile and institutional information.</p>
        </div>
      </div>

      {/* ── Toast ── */}
      {message && (
        <div className={`toast-msg ${message.type === 'success' ? 'toast-success' : 'toast-danger'} fade-up`}>
          <i className={`bi ${message.type === 'success' ? 'bi-check-circle-fill' : 'bi-exclamation-triangle-fill'}`}></i>
          {message.text}
          <button className="toast-close" onClick={() => setMessage(null)}>×</button>
        </div>
      )}

      <div className="row g-4 justify-content-center">

        {/* ── Profile display card ── */}
        <div className="col-12 col-lg-4 fade-up fade-up-1">
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '14px', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.07)' }}>
            <div className="prof-cover"></div>
            <div style={{ padding: '0 1.5rem 1.5rem' }}>
              {/* Avatar row */}
              <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: '-44px', marginBottom: '1rem' }}>
                <div className="prof-avatar">
                  {initials(user?.full_name || 'F')}
                  <span className="prof-online"></span>
                </div>
                <span style={{ background: '#eff6ff', color: '#2563eb', border: '1px solid rgba(37,99,235,0.25)', borderRadius: '20px', padding: '4px 12px', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px' }}>
                  <i className="bi bi-person-workspace me-1"></i>Faculty
                </span>
              </div>

              <h4 style={{ fontWeight: 800, color: '#0f2744', marginBottom: '2px', fontSize: '1.15rem' }}>{user?.full_name}</h4>
              <div style={{ fontSize: '0.83rem', color: '#64748b', marginBottom: '1.1rem' }}>{user?.email}</div>

              {/* Info pills */}
              <div style={{ background: '#f8fafc', border: '1px solid #f1f5f9', borderRadius: '10px', overflow: 'hidden', marginBottom: '1rem' }}>
                {[
                  { icon: 'bi-building',       bg: '#eff6ff', color: '#2563eb', label: 'Department',   value: user?.department || '—' },
                  { icon: 'bi-person-badge',    bg: '#f0fdf4', color: '#059669', label: 'Role',         value: 'Faculty Member' },
                  { icon: 'bi-calendar3',       bg: '#fffbeb', color: '#d97706', label: 'Member since', value: user?.created_at ? new Date(user.created_at).toLocaleDateString([], { month: 'long', year: 'numeric' }) : '—' },
                ].map(f => (
                  <div key={f.label} className="info-row">
                    <div className="info-icon" style={{ background: f.bg, color: f.color }}>
                      <i className={`bi ${f.icon}`}></i>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.68rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{f.label}</div>
                      <div style={{ fontWeight: 600, color: '#1e293b', fontSize: '0.875rem' }}>{f.value}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Bio preview */}
              {user?.bio && (
                <div style={{ background: '#f8fafc', borderLeft: '3px solid #2563eb', borderRadius: '0 8px 8px 0', padding: '0.65rem 0.85rem', fontSize: '0.83rem', color: '#475569', lineHeight: 1.6, fontStyle: 'italic' }}>
                  "{user.bio}"
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Edit form card ── */}
        <div className="col-12 col-lg-6 fade-up fade-up-2">
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '1.75rem', boxShadow: '0 4px 20px rgba(0,0,0,0.07)' }}>
            <div className="section-label">
              <i className="bi bi-pencil-square me-1" style={{ color: '#2563eb' }}></i>
              Edit Profile Information
            </div>

            <form onSubmit={handleUpdate}>
              <div className="fi">
                <label><i className="bi bi-person" style={{ color: '#2563eb' }}></i> Full Name & Academic Title</label>
                <input className="fi-input" type="text" value={fullName} onChange={e => setFullName(e.target.value)} required placeholder="e.g. Dr. Robert Smith" />
              </div>

              <div className="fi">
                <label><i className="bi bi-envelope" style={{ color: '#2563eb' }}></i> Institutional Email</label>
                <input className="fi-input" type="email" value={user?.email} disabled />
                <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Faculty email is tied to the university directory and cannot be changed.</span>
              </div>

              <div className="fi">
                <label><i className="bi bi-building" style={{ color: '#2563eb' }}></i> Academic Department</label>
                <input className="fi-input" type="text" value={department} onChange={e => setDepartment(e.target.value)} placeholder="e.g. Computer Science & Engineering" />
              </div>

              <div className="fi" style={{ marginBottom: '1.5rem' }}>
                <label><i className="bi bi-chat-quote" style={{ color: '#2563eb' }}></i> Faculty Biography & Office Hours</label>
                <textarea
                  className="fi-input"
                  rows={5}
                  value={bio}
                  onChange={e => setBio(e.target.value)}
                  placeholder="Teaching interests, research areas, office location, and office hour schedule..."
                  style={{ resize: 'vertical' }}
                ></textarea>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                  This will be visible to students on your course pages.
                </span>
              </div>

              {/* Security note */}
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '0.85rem 1rem', marginBottom: '1.25rem', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                <i className="bi bi-shield-lock-fill" style={{ color: '#2563eb', fontSize: '1.1rem', flexShrink: 0, marginTop: '1px' }}></i>
                <div style={{ fontSize: '0.8rem', color: '#475569', lineHeight: 1.6 }}>
                  <strong style={{ color: '#0f2744' }}>Account security:</strong> To change your password or email address, please contact your system administrator. Profile changes are logged in the audit trail.
                </div>
              </div>

              <button type="submit" className="submit-btn" disabled={saving}>
                {saving
                  ? <><span style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin-ut 0.6s linear infinite', display: 'inline-block' }}></span>Saving…</>
                  : <><i className="bi bi-check2-circle"></i>Save Faculty Profile</>
                }
              </button>
            </form>
          </div>
        </div>

      </div>
    </div>
  );
};
