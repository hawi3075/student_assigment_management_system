import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { userApi } from '../../services/api.js';

export const TeacherProfilePage: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [department, setDepartment] = useState(user?.department || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'danger'; text: string } | null>(null);

  useEffect(() => {
    if (user) {
      setFullName(user.full_name || '');
      setDepartment(user.department || '');
      setBio(user.bio || '');
    }
  }, [user]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      await userApi.updateProfile({
        full_name: fullName,
        department,
        bio
      });
      await refreshUser();
      setMessage({ type: 'success', text: 'Faculty profile details saved successfully.' });
    } catch (err: any) {
      setMessage({ type: 'danger', text: err.response?.data?.error || 'Failed to update profile.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="row justify-content-center">
      <div className="col-12 col-md-8 col-lg-6">
        <div className="card card-unitask p-4 p-md-5">
          <div className="d-flex align-items-center gap-3 mb-4">
            <div
              className="rounded-circle bg-primary text-white fs-3 fw-bold d-flex align-items-center justify-content-center"
              style={{ width: '64px', height: '64px', backgroundColor: '#0f2744' }}
            >
              {user?.full_name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h4 className="fw-bold text-dark mb-0">{user?.full_name}</h4>
              <div className="text-muted small">{user?.email}</div>
              <span className="badge bg-primary text-uppercase mt-1" style={{ fontSize: '0.65rem' }}>
                Faculty &bull; {user?.role}
              </span>
            </div>
          </div>

          {message && (
            <div className={`alert alert-${message.type} alert-dismissible fade show small py-2`} role="alert">
              {message.text}
              <button type="button" className="btn-close py-2" onClick={() => setMessage(null)}></button>
            </div>
          )}

          <form onSubmit={handleUpdate}>
            <div className="mb-3">
              <label className="form-label">Full Name & Academic Title</label>
              <input
                type="text"
                className="form-control"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                required
              />
            </div>

            <div className="mb-3">
              <label className="form-label">Institutional Email</label>
              <input
                type="email"
                className="form-control bg-light text-muted"
                value={user?.email}
                disabled
              />
              <div className="form-text small">Faculty email tied to university directory.</div>
            </div>

            <div className="mb-3">
              <label className="form-label">Academic Department</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. Computer Science & Engineering"
                value={department}
                onChange={e => setDepartment(e.target.value)}
              />
            </div>

            <div className="mb-4">
              <label className="form-label">Faculty Biography & Office Hours</label>
              <textarea
                rows={4}
                className="form-control"
                placeholder="Teaching interests, office location, and office hour schedule..."
                value={bio}
                onChange={e => setBio(e.target.value)}
              ></textarea>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="btn btn-unitask-primary w-100 d-flex align-items-center justify-content-center gap-2"
            >
              {saving && <span className="spinner-border spinner-border-sm" role="status"></span>}
              Save Faculty Profile
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
