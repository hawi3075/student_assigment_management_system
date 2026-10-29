import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.js';

export const RegisterPage: React.FC = () => {
  const { register, error, clearError } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: '',
    confirm_password: '',
    role: 'student',
    department: 'Computer Science'
  });
  const [localError, setLocalError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    if (formData.password !== formData.confirm_password) {
      setLocalError('Passwords do not match.');
      return;
    }

    if (formData.password.length < 6) {
      setLocalError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    const success = await register({
      full_name: formData.full_name,
      email: formData.email,
      password: formData.password,
      role: formData.role,
      department: formData.department
    });
    setLoading(false);

    if (success) {
      if (formData.role === 'teacher') {
        navigate('/teacher/dashboard');
      } else {
        navigate('/student/dashboard');
      }
    }
  };

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-12 col-md-8 col-lg-6">
          <div className="card card-unitask border-0 shadow-sm p-4 p-md-5">
            <div className="text-center mb-4">
              <div
                className="d-inline-flex align-items-center justify-content-center bg-primary text-white rounded-3 mb-3 p-3"
                style={{ backgroundColor: '#0f2744' }}
              >
                <i className="bi bi-person-plus-fill fs-2"></i>
              </div>
              <h3 className="fw-bold text-dark mb-1">Create University Account</h3>
              <p className="text-muted small">Join the UniTask academic portal</p>
            </div>

            {(localError || error) && (
              <div className="alert alert-danger alert-dismissible fade show small py-2" role="alert">
                <i className="bi bi-exclamation-triangle-fill me-2"></i>{localError || error}
                <button type="button" className="btn-close py-2" onClick={() => { setLocalError(null); clearError(); }}></button>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label className="form-label">Full Name</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Jane Doe"
                  value={formData.full_name}
                  onChange={e => setFormData({ ...formData, full_name: e.target.value })}
                  required
                />
              </div>

              <div className="mb-3">
                <label className="form-label">University Email Address</label>
                <input
                  type="email"
                  className="form-control"
                  placeholder="jane.doe@university.edu"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>

              <div className="row g-2 mb-3">
                <div className="col-md-6">
                  <label className="form-label">Account Role</label>
                  <select
                    className="form-select"
                    value={formData.role}
                    onChange={e => setFormData({ ...formData, role: e.target.value })}
                    required
                  >
                    <option value="student">Student</option>
                    <option value="teacher">Teacher / Faculty</option>
                  </select>
                  <div className="form-text text-muted" style={{ fontSize: '0.72rem' }}>
                    <i className="bi bi-shield-lock me-1"></i>
                    Administrator accounts cannot self-register. They are provisioned by Super Administrators only.
                  </div>
                </div>

                <div className="col-md-6">
                  <label className="form-label">Academic Department</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Computer Science"
                    value={formData.department}
                    onChange={e => setFormData({ ...formData, department: e.target.value })}
                  />
                </div>
              </div>

              <div className="row g-2 mb-3">
                <div className="col-md-6">
                  <label className="form-label">Password</label>
                  <input
                    type="password"
                    className="form-control"
                    placeholder="Min 6 characters"
                    value={formData.password}
                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                    required
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Confirm Password</label>
                  <input
                    type="password"
                    className="form-control"
                    placeholder="Re-enter password"
                    value={formData.confirm_password}
                    onChange={e => setFormData({ ...formData, confirm_password: e.target.value })}
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn btn-unitask-primary w-100 py-2 mt-2 mb-3 d-flex align-items-center justify-content-center gap-2"
              >
                {loading && <span className="spinner-border spinner-border-sm" role="status"></span>}
                Create Account
              </button>
            </form>

            <div className="text-center small text-muted">
              Already have an account? <Link to="/login" className="fw-bold text-decoration-none">Sign In</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
