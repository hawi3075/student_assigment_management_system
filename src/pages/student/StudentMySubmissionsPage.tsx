import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { submissionApi } from '../../services/api.js';

export const StudentMySubmissionsPage: React.FC = () => {
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await submissionApi.getMySubmissions();
        setSubmissions(res.data.submissions || []);
      } catch (err) {
        console.error('Failed to load submissions:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div>
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
        <div>
          <h2 className="fw-bold text-dark mb-1">My Submissions Record</h2>
          <p className="text-muted mb-0">Review all your submitted work, uploaded files, and instructor marks.</p>
        </div>
        <Link to="/student/assignments" className="btn btn-unitask-primary d-inline-flex align-items-center gap-2">
          <i className="bi bi-plus-circle"></i> Browse Assignments
        </Link>
      </div>

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status"></div>
        </div>
      ) : submissions.length === 0 ? (
        <div className="card card-unitask">
          <div className="empty-state">
            <i className="bi bi-file-earmark-x"></i>
            <h5>No Submissions Yet</h5>
            <p className="text-muted small">You haven't submitted any assignment coursework yet.</p>
            <Link to="/student/assignments" className="btn btn-unitask-primary btn-sm">
              View Available Assignments
            </Link>
          </div>
        </div>
      ) : (
        <div className="card card-unitask border-0 shadow-sm overflow-hidden">
          <div className="table-responsive">
            <table className="table table-unitask align-middle">
              <thead>
                <tr>
                  <th>Course & Assignment</th>
                  <th>Submitted At</th>
                  <th>Attached Files</th>
                  <th>Status</th>
                  <th>Grade</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {submissions.map(sub => {
                  const subDate = new Date(sub.submitted_at);

                  return (
                    <tr key={sub.id}>
                      <td>
                        <div className="d-flex align-items-center gap-2 mb-1">
                          <span className="badge bg-primary text-white">{sub.course_code}</span>
                          <span className="text-muted small">{sub.course_name}</span>
                        </div>
                        <div className="fw-bold text-dark">{sub.assignment_title}</div>
                      </td>
                      <td>
                        <div className="small fw-semibold">{subDate.toLocaleDateString()}</div>
                        <div className="text-muted small">{subDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                        {sub.is_late && (
                          <span className="badge bg-warning-subtle text-warning border small mt-1">Late Submission</span>
                        )}
                      </td>
                      <td>
                        {sub.files && sub.files.length > 0 ? (
                          <div className="d-flex flex-column gap-1">
                            {sub.files.map((f: any) => (
                              <a
                                key={f.id}
                                href={submissionApi.downloadUrl(sub.id, f.id)}
                                download
                                className="small text-decoration-none d-inline-flex align-items-center gap-1 text-primary fw-medium"
                              >
                                <i className="bi bi-file-earmark-arrow-down"></i>
                                <span className="text-truncate" style={{ maxWidth: '140px' }}>{f.original_filename}</span>
                              </a>
                            ))}
                          </div>
                        ) : (
                          <span className="text-muted small">No file attached</span>
                        )}
                      </td>
                      <td>
                        {sub.status === 'graded' ? (
                          <span className="badge bg-success-subtle text-success border">Graded</span>
                        ) : sub.status === 'resubmitted' ? (
                          <span className="badge bg-info-subtle text-info border">Resubmitted</span>
                        ) : (
                          <span className="badge bg-primary-subtle text-primary border">Under Review</span>
                        )}
                      </td>
                      <td>
                        {sub.marks_obtained !== null && sub.marks_obtained !== undefined ? (
                          <div>
                            <span className="fw-bold text-success fs-6">
                              {sub.marks_obtained} / {sub.max_marks}
                            </span>
                            {sub.feedback && (
                              <div className="text-muted small text-truncate" style={{ maxWidth: '160px' }} title={sub.feedback}>
                                "{sub.feedback}"
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted small fst-italic">Pending Evaluation</span>
                        )}
                      </td>
                      <td className="text-end">
                        <Link
                          to={`/student/assignments/${sub.assignment_id}`}
                          className="btn btn-sm btn-unitask-outline"
                        >
                          View Details
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
