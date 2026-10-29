import React, { useState } from 'react';
import { Link } from 'react-router-dom';

export const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setSubmitted(true);
    }
  };

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-12 col-md-8 col-lg-5">
          <div className="card card-unitask border-0 shadow-sm p-4 p-md-5">
            <div className="text-center mb-4">
              <div
                className="d-inline-flex align-items-center justify-content-center bg-primary text-white rounded-3 mb-3 p-3"
                style={{ backgroundColor: '#0f2744' }}
              >
                <i className="bi bi-shield-lock-fill fs-2"></i>
              </div>
              <h3 className="fw-bold text-dark mb-1">Reset Password</h3>
              <p className="text-muted small">Academic identity verification</p>
            </div>

            {submitted ? (
              <div className="text-center py-3">
                <div className="alert alert-success d-flex align-items-center gap-2 mb-3">
                  <i className="bi bi-check-circle-fill fs-5"></i>
                  <div className="text-start small">
                    Password recovery instructions generated for <strong>{email}</strong>.
                  </div>
                </div>

                <div className="alert alert-warning text-start small mb-4">
                  <h6 className="fw-bold fs-6 mb-1">
                    <i className="bi bi-envelope-exclamation me-1"></i>Production Email Delivery Requirement:
                  </h6>
                  <p className="mb-1">
                    Direct automated password recovery requires an institutional SMTP gateway (e.g. Amazon SES, SendGrid, or Google Workspace Mail API) configured with verified SPF/DKIM records.
                  </p>
                  <p className="mb-0">
                    For local testing, you can use the default demo credentials or contact the administrator (<code>admin@university.edu</code>).
                  </p>
                </div>

                <Link to="/login" className="btn btn-unitask-primary w-100">
                  Return to Sign In
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label className="form-label">University Email Address</label>
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

                <div className="alert alert-info small py-2 mb-3">
                  <i className="bi bi-info-circle me-1"></i> Enter your registered university email to receive a password reset token.
                </div>

                <button type="submit" className="btn btn-unitask-primary w-100 py-2 mb-3">
                  Send Recovery Link
                </button>

                <div className="text-center small text-muted">
                  Remembered password? <Link to="/login" className="fw-bold text-decoration-none">Sign In</Link>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
