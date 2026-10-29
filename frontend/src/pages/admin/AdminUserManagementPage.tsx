import React, { useState, useEffect } from 'react';
import { adminApi } from '../../services/api.js';
import { useAuth } from '../../context/AuthContext.js';

export const AdminUserManagementPage: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: '',
    role: 'student',
    department: ''
  });
  const [createError, setCreateError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getUsers({
        search: search || undefined,
        role: roleFilter || undefined
      });
      setUsers(res.data.users || []);
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [roleFilter]);

  const handleToggleStatus = async (user: any) => {
    const action = user.is_active ? 'deactivate' : 'activate';
    if (!window.confirm(`Are you sure you want to ${action} account for ${user.full_name}?`)) return;

    try {
      await adminApi.updateUserStatus(user.id, !user.is_active);
      await loadUsers();
    } catch (err: any) {
      alert(err.response?.data?.error || `Failed to ${action} user.`);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setCreateError(null);

    try {
      await adminApi.createUser(formData);
      setShowCreateModal(false);
      setFormData({ full_name: '', email: '', password: '', role: 'student', department: '' });
      await loadUsers();
    } catch (err: any) {
      setCreateError(err.response?.data?.error || 'Failed to create user.');
    } finally {
      setCreating(false);
    }
  };

  const isSuperAdmin = currentUser?.role === 'super_admin';

  return (
    <div>
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
        <div>
          <h2 className="fw-bold text-dark mb-1">User Account Management</h2>
          <p className="text-muted mb-0">
            Control student and faculty access. {isSuperAdmin ? (
              <span className="badge bg-danger-subtle text-danger border ms-1">Super Admin Authority Active</span>
            ) : (
              <span className="badge bg-secondary-subtle text-secondary border ms-1">Standard Admin Authority</span>
            )}
          </p>
        </div>
        <button
          onClick={() => { setCreateError(null); setFormData({ full_name: '', email: '', password: '', role: 'student', department: '' }); setShowCreateModal(true); }}
          className="btn btn-unitask-primary d-inline-flex align-items-center gap-2"
        >
          <i className="bi bi-person-plus"></i> Create User Account
        </button>
      </div>

      {/* Search and Filters */}
      <div className="card card-unitask mb-4 p-3">
        <div className="row g-3 align-items-center">
          <div className="col-12 col-md-7">
            <form onSubmit={e => { e.preventDefault(); loadUsers(); }} className="input-group">
              <span className="input-group-text bg-white border-end-0 text-muted">
                <i className="bi bi-search"></i>
              </span>
              <input
                type="text"
                className="form-control border-start-0 ps-0"
                placeholder="Search by full name or university email..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              <button className="btn btn-unitask-primary" type="submit">Search</button>
            </form>
          </div>

          <div className="col-12 col-md-5">
            <div className="d-flex gap-2 justify-content-md-end">
              <select
                className="form-select form-select-sm"
                value={roleFilter}
                onChange={e => setRoleFilter(e.target.value)}
                style={{ maxWidth: '200px' }}
              >
                <option value="">All Account Roles</option>
                <option value="student">Students</option>
                <option value="teacher">Teachers / Faculty</option>
                <option value="admin">Administrators</option>
                <option value="super_admin">Super Administrators</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Users Table */}
      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status"></div>
        </div>
      ) : users.length === 0 ? (
        <div className="card card-unitask">
          <div className="empty-state">
            <i className="bi bi-people"></i>
            <h5>No user accounts match criteria</h5>
            <p className="text-muted small">Try modifying your search or role filter.</p>
          </div>
        </div>
      ) : (
        <div className="card card-unitask border-0 shadow-sm overflow-hidden">
          <div className="table-responsive">
            <table className="table table-unitask align-middle">
              <thead>
                <tr>
                  <th>User & Email</th>
                  <th>Role</th>
                  <th>Department</th>
                  <th>Account Status</th>
                  <th>Registration Date</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => {
                  const roleBadge = {
                    super_admin: 'bg-danger text-white border border-danger-subtle',
                    admin: 'bg-dark text-white',
                    teacher: 'bg-info text-white',
                    student: 'bg-success text-white'
                  }[u.role as string] || 'bg-secondary text-white';

                  const roleLabel = {
                    super_admin: 'Super Admin',
                    admin: 'Administrator',
                    teacher: 'Faculty',
                    student: 'Student'
                  }[u.role as string] || u.role;

                  const canManageThisUser =
                    isSuperAdmin ? u.id !== currentUser?.id :
                    u.role !== 'admin' && u.role !== 'super_admin' && u.id !== currentUser?.id;

                  return (
                    <tr key={u.id}>
                      <td>
                        <div className="d-flex align-items-center gap-2">
                          <div
                            className="rounded-circle bg-light text-dark fw-bold d-flex align-items-center justify-content-center shadow-sm"
                            style={{ width: '38px', height: '38px' }}
                          >
                            {u.full_name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="fw-bold text-dark">{u.full_name}</div>
                            <div className="text-muted small">{u.email}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${roleBadge} text-uppercase`} style={{ fontSize: '0.72rem' }}>
                          {roleLabel}
                        </span>
                      </td>
                      <td className="small text-muted">{u.department || 'General'}</td>
                      <td>
                        {u.is_active ? (
                          <span className="badge bg-success-subtle text-success border">Active</span>
                        ) : (
                          <span className="badge bg-danger-subtle text-danger border">Suspended</span>
                        )}
                      </td>
                      <td className="small text-muted">
                        {u.created_at ? new Date(u.created_at).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="text-end">
                        {canManageThisUser ? (
                          <button
                            onClick={() => handleToggleStatus(u)}
                            className={`btn btn-sm ${u.is_active ? 'btn-outline-danger' : 'btn-outline-success'}`}
                          >
                            {u.is_active ? 'Deactivate' : 'Activate'}
                          </button>
                        ) : (
                          <span className="badge bg-light text-muted border small">
                            {u.id === currentUser?.id ? 'Self' : 'Protected'}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow">
              <div className="modal-header bg-primary text-white" style={{ backgroundColor: '#0f2744' }}>
                <h5 className="modal-title fs-6 fw-bold">Provision New Academic User</h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowCreateModal(false)}></button>
              </div>
              <form onSubmit={handleCreateUser}>
                <div className="modal-body p-4">
                  {createError && <div className="alert alert-danger py-2 small">{createError}</div>}

                  <div className="mb-3">
                    <label className="form-label">Full Name</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. Dr. Arthur Pendelton"
                      value={formData.full_name}
                      onChange={e => setFormData({ ...formData, full_name: e.target.value })}
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label">University Email</label>
                    <input
                      type="email"
                      className="form-control"
                      placeholder="user@university.edu"
                      value={formData.email}
                      onChange={e => setFormData({ ...formData, email: e.target.value })}
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Initial Password</label>
                    <input
                      type="password"
                      className="form-control"
                      placeholder="Min 6 characters"
                      value={formData.password}
                      onChange={e => setFormData({ ...formData, password: e.target.value })}
                      required
                    />
                  </div>

                  <div className="row g-2 mb-3">
                    <div className="col-6">
                      <label className="form-label">System Role</label>
                      <select
                        className="form-select"
                        value={formData.role}
                        onChange={e => setFormData({ ...formData, role: e.target.value })}
                      >
                        <option value="student">Student</option>
                        <option value="teacher">Teacher (Faculty)</option>
                        {isSuperAdmin && (
                          <>
                            <option value="admin">Administrator</option>
                            <option value="super_admin">Super Administrator</option>
                          </>
                        )}
                      </select>
                      {!isSuperAdmin && (
                        <div className="form-text small text-muted" style={{ fontSize: '0.72rem' }}>
                          Only Super Admins can provision Administrators.
                        </div>
                      )}
                    </div>

                    <div className="col-6">
                      <label className="form-label">Department</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. Mathematics"
                        value={formData.department}
                        onChange={e => setFormData({ ...formData, department: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowCreateModal(false)}>Cancel</button>
                  <button type="submit" disabled={creating} className="btn btn-unitask-primary btn-sm">
                    {creating && <span className="spinner-border spinner-border-sm me-1" role="status"></span>}
                    Provision User
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
