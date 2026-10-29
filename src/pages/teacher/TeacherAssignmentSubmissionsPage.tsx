import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { submissionApi, gradeApi } from '../../services/api.js';

export const TeacherAssignmentSubmissionsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'graded' | 'ungraded' | 'late'>('all');

  // Grading Modal State
  const [activeSub, setActiveSub] = useState<any>(null);
  const [marks, setMarks] = useState<string>('');
  const [feedback, setFeedback] = useState<string>('');
  const [savingGrade, setSavingGrade] = useState(false);
  const [gradeError, setGradeError] = useState<string | null>(null);

  const loadSubmissions = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await submissionApi.getAssignmentSubmissions(id, {
        filter: filter === 'all' ? undefined : filter
      });
      setData(res.data);
    } catch (err) {
      console.error('Failed to load submissions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSubmissions();
  }, [id, filter]);

  const openGradingModal = (sub: any) => {
    setActiveSub(sub);
    setMarks(sub.marks_obtained !== null && sub.marks_obtained !== undefined ? String(sub.marks_obtained) : '');
    setFeedback(sub.feedback || '');
    setGradeError(null);
  };

  const handleSaveGrade = async (publish: boolean) => {
    if (!activeSub) return;
    const numMarks = parseFloat(marks);

    if (isNaN(numMarks) || numMarks < 0) {
      setGradeError('Marks must be a valid non-negative number.');
      return;
    }

    if (data?.assignment && numMarks > parseFloat(data.assignment.max_marks)) {
      setGradeError(`Marks cannot exceed the maximum of ${data.assignment.max_marks} points.`);
      return;
    }

    setSavingGrade(true);
    setGradeError(null);

    try {
      await gradeApi.saveGrade(activeSub.id, {
        marks_obtained: numMarks,
        feedback,
        publish
      });
      setActiveSub(null);
      await loadSubmissions();
    } catch (err: any) {
      setGradeError(err.response?.data?.error || 'Failed to record grade.');
    } finally {
      setSavingGrade(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status"></div>
      </div>
    );
  }

  const assignment = data?.assignment;
  const submissions = data?.submissions || [];

  return (
    <div>
      <div className="mb-3">
        <Link to="/teacher/assignments" className="text-decoration-none small text-muted">
          <i className="bi bi-arrow-left me-1"></i> Back to Assignments
        </Link>
      </div>

      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
        <div>
          <h2 className="fw-bold text-dark mb-1">Submissions & Grading</h2>
          <p className="text-muted mb-0">
            <strong>{assignment?.title}</strong> &bull; Max Marks: <strong>{assignment?.max_marks} pts</strong>
          </p>
        </div>

        {/* Filter Pills */}
        <div className="d-flex flex-wrap gap-2">
          {(['all', 'ungraded', 'graded', 'late'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`btn btn-sm text-capitalize ${filter === tab ? 'btn-dark' : 'btn-outline-secondary'}`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {submissions.length === 0 ? (
        <div className="card card-unitask">
          <div className="empty-state">
            <i className="bi bi-inbox"></i>
            <h5>No submissions received yet</h5>
            <p className="text-muted small">No student submissions match your active filter.</p>
          </div>
        </div>
      ) : (
        <div className="card card-unitask border-0 shadow-sm overflow-hidden">
          <div className="table-responsive">
            <table className="table table-unitask align-middle">
              <thead>
                <tr>
                  <th>Student Info</th>
                  <th>Submission Timestamp</th>
                  <th>Submitted Files</th>
                  <th>Student Notes</th>
                  <th>Grade & Status</th>
                  <th className="text-end">Evaluation</th>
                </tr>
              </thead>
              <tbody>
                {submissions.map((sub: any) => {
                  const subDate = new Date(sub.submitted_at);

                  return (
                    <tr key={sub.id}>
                      <td>
                        <div className="fw-bold text-dark">{sub.student_name}</div>
                        <div className="text-muted small">{sub.student_email}</div>
                        <span className="badge bg-light text-secondary border small">{sub.student_department || 'Student'}</span>
                      </td>
                      <td>
                        <div className="small fw-semibold">{subDate.toLocaleDateString()}</div>
                        <div className="text-muted small">{subDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                        {sub.is_late && (
                          <span className="badge bg-warning-subtle text-warning border small mt-1">LATE</span>
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
                          <span className="text-muted small">No file</span>
                        )}
                      </td>
                      <td style={{ maxWidth: '200px' }}>
                        {sub.submission_text ? (
                          <div className="small text-muted text-truncate" title={sub.submission_text}>
                            "{sub.submission_text}"
                          </div>
                        ) : (
                          <span className="text-muted small">&mdash;</span>
                        )}
                      </td>
                      <td>
                        {sub.marks_obtained !== null && sub.marks_obtained !== undefined ? (
                          <div>
                            <span className="fw-bold text-success fs-6">
                              {sub.marks_obtained} / {assignment.max_marks}
                            </span>
                            <div>
                              {sub.grade_published_at ? (
                                <span className="badge bg-success-subtle text-success border small">Published</span>
                              ) : (
                                <span className="badge bg-secondary-subtle text-secondary border small">Draft Grade</span>
                              )}
                            </div>
                          </div>
                        ) : (
                          <span className="badge bg-warning-subtle text-warning border">Awaiting Grading</span>
                        )}
                      </td>
                      <td className="text-end">
                        <div className="d-flex justify-content-end gap-1">
                          <button
                            onClick={() => openGradingModal(sub)}
                            className="btn btn-sm btn-unitask-primary"
                          >
                            <i className="bi bi-pencil-square me-1"></i>
                            {sub.marks_obtained !== null ? 'Edit Grade' : 'Grade Work'}
                          </button>
                          <Link
                            to={`/teacher/submissions/${sub.id}/grade`}
                            className="btn btn-sm btn-outline-secondary"
                            title="Full Screen Grading"
                          >
                            <i className="bi bi-arrows-fullscreen"></i>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Quick Grading Modal */}
      {activeSub && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow">
              <div className="modal-header bg-primary text-white" style={{ backgroundColor: '#0f2744' }}>
                <h5 className="modal-title fs-6 fw-bold">
                  Grade Submission: {activeSub.student_name}
                </h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setActiveSub(null)}></button>
              </div>
              <div className="modal-body p-4">
                {gradeError && <div className="alert alert-danger py-2 small">{gradeError}</div>}

                <div className="mb-3 p-2 bg-light rounded border small">
                  <div><strong>Assignment:</strong> {assignment.title}</div>
                  <div><strong>Max Marks:</strong> {assignment.max_marks} Points</div>
                  {activeSub.is_late && <div className="text-warning fw-bold">Note: This assignment was submitted late.</div>}
                </div>

                <div className="mb-3">
                  <label className="form-label">Marks Obtained (out of {assignment.max_marks})</label>
                  <input
                    type="number"
                    min="0"
                    max={assignment.max_marks}
                    step="0.5"
                    className="form-control"
                    placeholder={`0 - ${assignment.max_marks}`}
                    value={marks}
                    onChange={e => setMarks(e.target.value)}
                    required
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label">Written Feedback to Student</label>
                  <textarea
                    rows={4}
                    className="form-control"
                    placeholder="Provide constructive feedback, praise strengths, and specify corrections..."
                    value={feedback}
                    onChange={e => setFeedback(e.target.value)}
                  ></textarea>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setActiveSub(null)}>Cancel</button>
                <button
                  type="button"
                  disabled={savingGrade}
                  onClick={() => handleSaveGrade(false)}
                  className="btn btn-outline-secondary btn-sm"
                >
                  Save as Draft
                </button>
                <button
                  type="button"
                  disabled={savingGrade}
                  onClick={() => handleSaveGrade(true)}
                  className="btn btn-unitask-primary btn-sm"
                >
                  {savingGrade && <span className="spinner-border spinner-border-sm me-1" role="status"></span>}
                  Save & Publish to Student
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
