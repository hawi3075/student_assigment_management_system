import React, { useState, useEffect } from 'react';
import { systemApi } from '../../services/api.js';

export const ApiDocsPage: React.FC = () => {
  const [docs, setDocs] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    systemApi.getDocs().then(res => {
      setDocs(res.data);
    }).catch(err => {
      console.error('Failed to load API docs:', err);
    }).finally(() => {
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status"></div>
      </div>
    );
  }

  const paths = docs?.paths || {};

  return (
    <div>
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
        <div>
          <h2 className="fw-bold text-dark mb-1">UniTask REST API Documentation</h2>
          <p className="text-muted mb-0">OpenAPI 3.0 specification for backend endpoints, authentication, and payload schemas.</p>
        </div>
        <div>
          <a href="/api/docs" target="_blank" rel="noreferrer" className="btn btn-sm btn-unitask-outline">
            <i className="bi bi-box-arrow-up-right me-1"></i> Raw OpenAPI JSON
          </a>
        </div>
      </div>

      <div className="card card-unitask mb-4 p-4">
        <h5 className="fw-bold text-dark mb-2">API Overview</h5>
        <p className="text-muted small mb-3">
          All endpoints accept and return JSON format with standard HTTP status codes. Authentication is enforced via Bearer JWT in the <code>Authorization</code> request header.
        </p>

        <div className="d-flex flex-wrap gap-2">
          <span className="badge bg-light text-dark border">Version: 1.0.0</span>
          <span className="badge bg-light text-dark border">Base URL: /api</span>
          <span className="badge bg-light text-dark border">Security: JWT Bearer Token</span>
          <span className="badge bg-light text-dark border">Rate Limiting: Active</span>
        </div>
      </div>

      <div className="d-flex flex-column gap-3">
        {Object.entries(paths).map(([endpoint, methods]: [string, any]) => (
          <div key={endpoint} className="card card-unitask overflow-hidden">
            <div className="card-header bg-light py-2 px-3 fw-bold font-monospace small">
              {endpoint}
            </div>
            <div className="card-body p-3">
              {Object.entries(methods).map(([method, details]: [string, any]) => {
                const methodColor = {
                  get: 'bg-primary text-white',
                  post: 'bg-success text-white',
                  patch: 'bg-warning text-dark',
                  delete: 'bg-danger text-white'
                }[method.toLowerCase()] || 'bg-secondary text-white';

                return (
                  <div key={method} className="mb-3 pb-3 border-bottom last:border-0 last:pb-0 last:mb-0">
                    <div className="d-flex align-items-center gap-2 mb-2">
                      <span className={`badge ${methodColor} text-uppercase font-monospace`}>
                        {method}
                      </span>
                      <span className="fw-semibold text-dark small">{details.summary || 'Endpoint'}</span>
                    </div>

                    {details.description && (
                      <p className="text-muted small mb-2">{details.description}</p>
                    )}

                    {details.security && (
                      <div className="small text-muted mb-2">
                        <i className="bi bi-lock me-1"></i> Requires Bearer JWT Authentication
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
