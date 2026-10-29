import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminApi } from '../../services/api.js';

const ACTION_ICON: Record<string, string> = {
  USER_LOGIN:       'bi-box-arrow-in-right',
  USER_LOGOUT:      'bi-box-arrow-left',
  USER_REGISTERED:  'bi-person-plus',
  GRADE_PUBLISHED:  'bi-award',
  SYSTEM_STARTUP:   'bi-lightning-charge',
};

export const AdminDashboardPage: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [activityLogs, setActivityLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [statsRes, logsRes] = await Promise.all([adminApi.getStats(), adminApi.getActivity()]);
        setStats(statsRes.data.stats);
        setActivityLogs(logsRes.data.logs || []);
      } catch (err) {
        console.error('Failed to load admin dashboard:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return <div className="page-loading"><div className="spinner-ut"></div></div>;
  }

  const metricCards = [
    { label: 'Total Students',    value: stats?.students    || 0, icon: 'bi-mortarboard',      cls: 'si-green',  change: 'Enrolled' },
    { label: 'Faculty Members',   value: stats?.teachers    || 0, icon: 'bi-person-workspace',  cls: 'si-blue',   change: 'Active staff' },
    { label: 'Total Courses',     value: stats?.courses     || 0, icon: 'bi-collection',        cls: 'si-sky',    change: 'This semester' },
    { label: 'Submissions',       value: stats?.submissions || 0, icon: 'bi-inbox',             cls: 'si-amber',  change: 'All time' },
  ];

  const quickActions = [
    { to: '/admin/users',    icon: 'bi-person-check',      label: 'Manage User Accounts',    iconBg: '#eff6ff', iconColor: '#2563eb' },
    { to: '/admin/courses',  icon: 'bi-journal-bookmark',  label: 'Manage Course Curricula', iconBg: '#f0fdf4', iconColor: '#059669' },
    { to: '/admin/activity', icon: 'bi-shield-lock',       label: 'Security Audit Logs',     iconBg: '#fef2f2', iconColor: '#dc2626' },
  ];

  return (
    <div>
      {/* ── Page Header ── */}
      <div className="page-header fade-up">
        <div>
          <h1 className="page-title">Administration Console</h1>
          <p className="page-subtitle">Institutional overview of users, courses, assignments, and audit trails.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
          <Link to="/admin/users" className="btn-ut-primary">
            <i className="bi bi-people"></i> Manage Users
          </Link>
          <Link to="/admin/courses" className="btn-ut-outline">
            <i className="bi bi-journal-bookmark"></i> Curricula
          </Link>
          <Link to="/admin/activity" className="btn-ut-outline">
            <i className="bi bi-shield-check"></i> Audit Logs
          </Link>
        </div>
      </div>

      {/* ── Admin Status Banner ── */}
      <div className="admin-status-card fade-up fade-up-1">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.9rem' }}>
          <span style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '20px', padding: '3px 12px', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.8)' }}>
            Academic Year 2026–2027
          </span>
          <span style={{ background: 'rgba(5,150,105,0.25)', border: '1px solid rgba(5,150,105,0.4)', borderRadius: '20px', padding: '3px 12px', fontSize: '0.72rem', fontWeight: 700, color: '#6ee7b7' }}>
            <i className="bi bi-check-circle me-1"></i>System Active
          </span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h3 style={{ fontWeight: 800, fontSize: 'clamp(1.1rem,2.5vw,1.5rem)', color: '#fff', marginBottom: '0.4rem', letterSpacing: '-0.02em' }}>
              University Academic Operations Control
            </h3>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.875rem', lineHeight: 1.6, maxWidth: 580, marginBottom: 0 }}>
              All department submissions, deadlines, and faculty grading evaluations are actively synchronized.
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.72rem', marginBottom: '2px' }}>Current Academic Term</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fff' }}>Fall Semester 2026</div>
            <div style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '6px', padding: '3px 10px', fontSize: '0.72rem', color: 'rgba(255,255,255,0.65)', marginTop: '6px', display: 'inline-block' }}>
              <i className="bi bi-building me-1"></i>Division of Academic Affairs
            </div>
          </div>
        </div>
      </div>

      {/* ── Metric Cards ── */}
      <div className="row g-3 mb-4">
        {metricCards.map((m, i) => (
          <div key={m.label} className={`col-12 col-sm-6 col-lg-3 fade-up fade-up-${i + 1}`}>
            <div className="stat-card">
              <div className="d-flex justify-content-between align-items-start">
                <div>
                  <div className="stat-label">{m.label}</div>
                  <div className="stat-number">{m.value}</div>
                  <div className="stat-change text-muted">
                    <i className="bi bi-arrow-up-right" style={{ fontSize: '0.65rem' }}></i>
                    {m.change}
                  </div>
                </div>
                <div className={`stat-icon ${m.cls}`}>
                  <i className={`bi ${m.icon}`}></i>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Content Row ── */}
      <div className="row g-4">

        {/* Audit trail */}
        <div className="col-12 col-lg-8 fade-up fade-up-3">
          <div className="card-ut h-100">
            <div className="card-ut-header">
              <div className="card-ut-title">
                <i className="bi bi-clock-history"></i>
                Recent System Activity
              </div>
              <Link to="/admin/activity" className="card-ut-link">
                Full Audit Log <i className="bi bi-arrow-right"></i>
              </Link>
            </div>

            {activityLogs.length === 0 ? (
              <div className="empty-state">
                <i className="bi bi-activity"></i>
                <h5>No activity yet</h5>
                <p>System events will appear here as users interact.</p>
              </div>
            ) : (
              activityLogs.slice(0, 7).map((log: any) => (
                <div key={log.id} className="log-item">
                  <div className="log-dot" style={{ marginTop: '4px' }}></div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px', flexWrap: 'wrap' }}>
                      <span style={{ background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: '5px', padding: '1px 7px', fontSize: '0.68rem', fontWeight: 700, color: '#475569', letterSpacing: '0.05em' }}>
                        <i className={`bi ${ACTION_ICON[log.action] || 'bi-activity'} me-1`}></i>
                        {log.action}
                      </span>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text)' }}>{log.details}</div>
                  </div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', background: '#f8fafc', border: '1px solid var(--border)', borderRadius: '6px', padding: '2px 8px', flexShrink: 0, alignSelf: 'flex-start' }}>
                    {log.user_name || 'System'}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Quick Actions + Governance */}
        <div className="col-12 col-lg-4 fade-up fade-up-4">
          <div className="card-ut mb-4">
            <div className="card-ut-header">
              <div className="card-ut-title">
                <i className="bi bi-lightning-charge-fill" style={{ color: '#d97706' }}></i>
                Quick Actions
              </div>
            </div>
            <div style={{ padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {quickActions.map(a => (
                <Link key={a.to} to={a.to} className="quick-action">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div className="quick-action-icon" style={{ background: a.iconBg, color: a.iconColor }}>
                      <i className={`bi ${a.icon}`}></i>
                    </div>
                    <span>{a.label}</span>
                  </div>
                  <i className="bi bi-chevron-right" style={{ fontSize: '0.75rem', opacity: 0.45 }}></i>
                </Link>
              ))}
            </div>
          </div>

          <div className="card-ut" style={{ background: 'linear-gradient(135deg,#f8fafc,#f1f5f9)' }}>
            <div className="card-ut-header">
              <div className="card-ut-title">
                <i className="bi bi-shield-fill-check" style={{ color: '#059669' }}></i>
                Access Governance
              </div>
            </div>
            <div style={{ padding: '1rem 1.25rem' }}>
              {[
                { icon: 'bi-shield-check',  color: '#059669', text: 'Role Hierarchy: Enforced' },
                { icon: 'bi-check2-circle', color: '#2563eb', text: 'Super Admin Delegation Active' },
                { icon: 'bi-lock-fill',     color: '#2563eb', text: 'Session Security: JWT Encrypted' },
              ].map(item => (
                <div key={item.text} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', marginBottom: '8px', color: 'var(--text)' }}>
                  <i className={`bi ${item.icon}`} style={{ color: item.color, fontSize: '1rem' }}></i>
                  {item.text}
                </div>
              ))}
              <Link to="/admin/users" className="btn-ut-outline" style={{ width: '100%', justifyContent: 'center', marginTop: '0.5rem' }}>
                Review User Permissions
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
