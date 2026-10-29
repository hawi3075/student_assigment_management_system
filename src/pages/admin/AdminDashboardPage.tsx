import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminApi } from '../../services/api.js';

export const AdminDashboardPage: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [activityLogs, setActivityLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [statsRes, logsRes] = await Promise.all([
          adminApi.getStats(),
          adminApi.getActivity()
        ]);
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
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
        <div>
          <h2 className="fw-bold text-dark mb-1">System Administration Console</h2>
          <p className="text-muted mb-0">High-level institutional overview of university users, courses, assignments, and audit trails.</p>
        </div>
        <div className="d-flex gap-2">
          <Link to="/admin/users" className="btn btn-unitask-primary d-inline-flex align-items-center gap-2">
            <i className="bi bi-people"></i> Manage Users
          </Link>
          <Link to="/admin/courses" className="btn btn-unitask-outline d-inline-flex align-items-center gap-2">
            <i className="bi bi-journal-bookmark"></i> Curricula
          </Link>
          <Link to="/admin/activity" className="btn btn-unitask-outline d-inline-flex align-items-center gap-2">
            <i className="bi bi-shield-check"></i> Security Audit Logs
          </Link>
        </div>
      </div>

      {/* University Executive Status Card */}
      <div className="card card-unitask mb-4 p-4 border-0 shadow-sm" style={{ backgroundColor: '#0f2744', color: '#ffffff' }}>
        <div className="row align-items-center g-3">
          <div className="col-12 col-md-8">
            <div className="d-flex align-items-center gap-2 mb-2">
              <span className="badge bg-light text-dark fw-bold px-3 py-1">Academic Year 2026&ndash;2027</span>
              <span className="badge bg-success text-white px-2 py-1">
                <i className="bi bi-check-circle me-1"></i>Institutional Production Active
              </span>
            </div>
            <h4 className="fw-bold text-white mb-2">University Academic Operations Control</h4>
            <p className="text-white-50 mb-0 small" style={{ maxWidth: '650px', lineHeight: '1.6' }}>
              All department submissions, deadlines, and faculty grading evaluations are actively synchronized. System audit trails record administrative actions with role verification.
            </p>
          </div>
          <div className="col-12 col-md-4 text-md-end">
            <div className="d-inline-flex flex-column align-items-md-end gap-1">
              <span className="text-white-50 small">Academic Term</span>
              <span className="fs-5 fw-bold text-white">Fall Semester 2026</span>
              <span className="badge bg-white bg-opacity-10 text-white border border-light border-opacity-25 small mt-1">
                <i className="bi bi-building me-1"></i>Division of Academic Affairs
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-sm-6 col-lg-3">
          <div className="stat-card">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <div className="stat-label">Total Students</div>
                <div className="stat-number text-success">{stats?.students || 0}</div>
              </div>
              <div className="stat-icon bg-success-subtle text-success">
                <i className="bi bi-mortarboard"></i>
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-lg-3">
          <div className="stat-card">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <div className="stat-label">Faculty Teachers</div>
                <div className="stat-number text-primary">{stats?.teachers || 0}</div>
              </div>
              <div className="stat-icon bg-primary-subtle text-primary">
                <i className="bi bi-person-workspace"></i>
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-lg-3">
          <div className="stat-card">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <div className="stat-label">Total Courses</div>
                <div className="stat-number text-info">{stats?.courses || 0}</div>
              </div>
              <div className="stat-icon bg-info-subtle text-info">
                <i className="bi bi-collection"></i>
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-lg-3">
          <div className="stat-card">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <div className="stat-label">Total Submissions</div>
                <div className="stat-number text-warning">{stats?.submissions || 0}</div>
              </div>
              <div className="stat-icon bg-warning-subtle text-warning">
                <i className="bi bi-inbox"></i>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="row g-4">
        {/* Quick System Activity */}
        <div className="col-12 col-lg-8">
          <div className="card card-unitask h-100">
            <div className="card-header card-header-unitask d-flex justify-content-between align-items-center">
              <span className="d-flex align-items-center gap-2">
                <i className="bi bi-clock-history text-primary"></i>
                <span>Recent System Activity & Audit Trail</span>
              </span>
              <Link to="/admin/activity" className="small text-decoration-none fw-semibold">
                View All
              </Link>
            </div>
            <div className="card-body p-0">
              {activityLogs.length === 0 ? (
                <div className="empty-state py-4">
                  <i className="bi bi-activity"></i>
                  <p className="mb-0">No activity events recorded yet.</p>
                </div>
              ) : (
                <div className="list-group list-group-flush">
                  {activityLogs.slice(0, 6).map((log: any) => (
                    <div key={log.id} className="list-group-item p-3 d-flex justify-content-between align-items-start">
                      <div>
                        <div className="d-flex align-items-center gap-2 mb-1">
                          <span className="badge bg-light text-dark border small fw-bold">{log.action}</span>
                          <span className="small text-muted">{new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <div className="small fw-semibold text-dark">{log.details}</div>
                      </div>
                      <span className="badge bg-secondary-subtle text-secondary small">
                        {log.user_name || 'System'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Administration Actions & Info */}
        <div className="col-12 col-lg-4">
          <div className="card card-unitask p-4 mb-4">
            <h6 className="fw-bold text-dark mb-3">Institutional Administration</h6>
            <div className="d-grid gap-2">
              <Link to="/admin/users" className="btn btn-unitask-outline text-start d-flex justify-content-between align-items-center">
                <span><i className="bi bi-person-check me-2 text-primary"></i>Manage User Accounts</span>
                <i className="bi bi-chevron-right text-muted small"></i>
              </Link>
              <Link to="/admin/courses" className="btn btn-unitask-outline text-start d-flex justify-content-between align-items-center">
                <span><i className="bi bi-journal-bookmark me-2 text-primary"></i>Manage Course Curricula</span>
                <i className="bi bi-chevron-right text-muted small"></i>
              </Link>
              <Link to="/admin/activity" className="btn btn-unitask-outline text-start d-flex justify-content-between align-items-center">
                <span><i className="bi bi-shield-lock me-2 text-primary"></i>Security Audit Log Stream</span>
                <i className="bi bi-chevron-right text-muted small"></i>
              </Link>
            </div>
          </div>

          <div className="card card-unitask p-4 bg-light border-0">
            <h6 className="fw-bold text-dark mb-2">Access Governance</h6>
            <div className="small text-muted mb-3">
              <div className="mb-1"><i className="bi bi-shield-check text-success me-1"></i>Role Hierarchy: Enforced</div>
              <div className="mb-1"><i className="bi bi-check2 text-primary me-1"></i>Super Admin Delegation Active</div>
              <div className="mb-1"><i className="bi bi-lock text-primary me-1"></i>Session Security: JWT Encrypted</div>
            </div>
            <Link to="/admin/users" className="btn btn-sm btn-outline-dark w-100">
              Review User Permissions
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
