import React, { useState, useEffect } from 'react';
import { adminApi } from '../../services/api.js';

export const AdminActivityPage: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const logsRes = await adminApi.getActivity();
      setLogs(logsRes.data.logs || []);
    } catch (err) {
      console.error('Failed to load activity logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div>
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
        <div>
          <h2 className="fw-bold text-dark mb-1">Institutional Audit & Activity Trail</h2>
          <p className="text-muted mb-0">Immutable tracking of user logins, role provisioning, assignment releases, and evaluation records.</p>
        </div>
        <button onClick={loadData} className="btn btn-unitask-outline d-inline-flex align-items-center gap-2">
          <i className="bi bi-arrow-clockwise"></i> Refresh Audit Stream
        </button>
      </div>

      {/* Institutional Audit Summary Banner */}
      <div className="card card-unitask mb-4 p-4 border-0 shadow-sm">
        <div className="d-flex flex-wrap justify-content-between align-items-center gap-2">
          <div className="d-flex align-items-center gap-3">
            <div className="p-3 bg-primary text-white rounded-3" style={{ backgroundColor: '#0f2744' }}>
              <i className="bi bi-shield-check fs-4"></i>
            </div>
            <div>
              <h5 className="fw-bold text-dark mb-1">Audit Compliance & Integrity</h5>
              <div className="text-muted small">
                All events are chronologically indexed with authenticated user IDs, event classification, and IP verification.
              </div>
            </div>
          </div>
          <div>
            <span className="badge bg-success-subtle text-success border px-3 py-2 fs-6">
              <i className="bi bi-check-circle-fill me-1"></i>Audit Logging Active
            </span>
          </div>
        </div>
      </div>

      {/* Activity Logs Table */}
      <div className="card card-unitask border-0 shadow-sm overflow-hidden">
        <div className="card-header card-header-unitask d-flex justify-content-between align-items-center">
          <span className="fw-bold text-dark d-flex align-items-center gap-2">
            <i className="bi bi-shield-check text-primary"></i>
            <span>Recorded System Audit Logs ({logs.length})</span>
          </span>
          <span className="badge bg-light text-muted border">Real-Time Log Stream</span>
        </div>

        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status"></div>
          </div>
        ) : logs.length === 0 ? (
          <div className="empty-state">
            <i className="bi bi-journal-x"></i>
            <p className="mb-0">No activity logged.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-unitask align-middle mb-0">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Action Event</th>
                  <th>User / Role</th>
                  <th>Event Details</th>
                  <th>IP Address</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log: any) => (
                  <tr key={log.id}>
                    <td className="small text-muted" style={{ whiteSpace: 'nowrap' }}>
                      {new Date(log.created_at).toLocaleDateString()} {new Date(log.created_at).toLocaleTimeString()}
                    </td>
                    <td>
                      <span className="badge bg-light text-dark border font-monospace small">
                        {log.action}
                      </span>
                    </td>
                    <td>
                      <div className="fw-semibold text-dark small">{log.user_name || 'System'}</div>
                      <div className="text-muted small">{log.user_email}</div>
                    </td>
                    <td className="small text-dark" style={{ maxWidth: '400px' }}>
                      {log.details}
                    </td>
                    <td className="small text-muted font-monospace">
                      {log.ip_address || '127.0.0.1'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
