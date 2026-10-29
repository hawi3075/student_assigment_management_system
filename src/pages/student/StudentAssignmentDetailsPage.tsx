import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { assignmentApi, submissionApi } from '../../services/api.js';

export const StudentAssignmentDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadAssignment() {
      if (!id) return;
      try {
        const res = await assignmentApi.getById(id);
        setData(res.data);
      } catch (err: any) {
        setError(err.response?.data?.error || 'Failed to load assignment details.');
      } finally {
        setLoading(false);
      }
    }
    loadAssignment();
  }, [id]);

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status"></div>
      </div>
    );
  }

  if (error || !data?.assignment) {
    return (
      <div className="alert alert-danger p-4">
        <h5><i className="bi bi-exclamation-octagon me-2"></i>Error</h5>
        <p>{error || 'Assignment not found or inaccessible.'}</p>
        <Link to="/student/assignments" className="btn btn-outline-danger btn-sm">Return to Assignments</Link>
      </div>
    );
  }

  const { assignment, attachments, submission, grade } = data;
  const dueDate = new Date(assignment.due_at);
  const isPastDue = dueDate.getTime() < Date.now();

  return (
    <div>
      <div className="mb-3">
        <Link to="/student/assignments" className="text-decoration-none small text-muted">
          <i className="bi bi-arrow-left me-1"></i> Back to Assignment List
        </Link>
      </div>

      <div className="row g-4">
        {/* Left column: Assignment Details */}
        <div className="col-12 col-lg-8">
          <div className="card card-unitask p-4 mb-4">
            <div className="d-flex flex-wrap align-items-center gap-2 mb-2">
              <span className="badge bg-primary text-white fw-bold">{assignment.course_code}</span>
              <span className="fw-semibold text-muted small">{assignment.course_name}</span>
            </div>

            <h3 className="fw-bold text-dark mb-3">{assignment.title}</h3>

            <div className="p-3 bg-light rounded border mb-4">
              <div className="row g-3 small">
                <div className="col-sm-6 col-md-3">
                  <span className="text-muted d-block">Instructor:</span>
                  <strong>{assignment.teacher_name}</strong>
                </div>
                <div className="col-sm-6 col-md-3">
                  <span className="text-muted d-block">Max Marks:</span>
                  <strong>{assignment.max_marks} Points</strong>
                </div>
                <div className="col-sm-6 col-md-3">
                  <span className="text-muted d-block">Published:</span>
                  <strong>{assignment.published_at ? new Date(assignment.published_at).toLocaleDateString() : 'N/A'}</strong>
                </div>
                <div className="col-sm-6 col-md-3">
                  <span className="text-muted d-block">Due Date:</span>
                  <strong className={isPastDue ? 'text-danger' : 'text-primary'}>
                    {dueDate.toLocaleDateString([], { month: 'short', day: 'numeric' })} at {dueDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </strong>
                </div>
              </div>
            </div>

            <h5 className="fw-bold text-dark mb-2">Description</h5>
            <p className="text-muted mb-4" style={{ whiteSpace: 'pre-line' }}>
              {assignment.description}
            </p>

            {assignment.instructions && (
              <>
                <h5 className="fw-bold text-dark mb-2">Instructions & Requirements</h5>
                <div className="p-3 bg-white rounded border mb-4 font-monospace small" style={{ whiteSpace: 'pre-line', lineHeight: '1.6' }}>
                  {assignment.instructions}
                </div>
              </>
            )}

            {/* Reference Files */}
            <h5 className="fw-bold text-dark mb-2">Reference Documents & Attachments</h5>
            {attachments && attachments.length > 0 ? (
              <div className="list-group">
                {attachments.map((att: any) => (
                  <div key={att.id} className="list-group-item d-flex justify-content-between align-items-center p-3">
                    <div className="d-flex align-items-center gap-2">
                      <i className="bi bi-file-earmark-arrow-down fs-4 text-primary"></i>
                      <div>
                        <div className="fw-semibold small">{att.original_filename}</div>
                        <div className="text-muted small">{(att.file_size / 1024).toFixed(1)} KB</div>
                      </div>
                    </div>
                    <span className="badge bg-light text-dark border">Reference Asset</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted small">No reference files attached by instructor.</p>
            )}
          </div>
        </div>

        {/* Right column: Current Submission & Grade Status */}
        <div className="col-12 col-lg-4">
          <div className="card card-unitask p-4 mb-4">
            <h5 className="fw-bold text-dark mb-3">Your Submission Status</h5>

            {submission ? (
              <div>
                <div className="alert alert-success d-flex align-items-center gap-2 mb-3 py-2">
                  <i className="bi bi-check-circle-fill fs-5"></i>
                  <div className="small">
                    <strong>Work Submitted!</strong>
                    {submission.is_late && <span className="badge bg-warning ms-1">Late Submission</span>}
                  </div>
                </div>

                <div className="small text-muted mb-2">
                  <strong>Timestamp:</strong> {new Date(submission.submitted_at).toLocaleString()}
                </div>

                {submission.submission_text && (
                  <div className="mb-3">
                    <label className="fw-semibold small text-muted">Your Comments:</label>
                    <div className="p-2 bg-light border rounded small fst-italic">
                      "{submission.submission_text}"
                    </div>
                  </div>
                )}

                {submission.files && submission.files.length > 0 && (
                  <div className="mb-3">
                    <label className="fw-semibold small text-muted">Submitted Files:</label>
                    <div className="list-group list-group-flush border rounded">
                      {submission.files.map((f: any) => (
                        <div key={f.id} className="list-group-item p-2 d-flex justify-content-between align-items-center">
                          <span className="small text-truncate" style={{ maxWidth: '180px' }}>
                            <i className="bi bi-file-earmark me-1"></i>{f.original_filename}
                          </span>
                          <a
                            href={submissionApi.downloadUrl(submission.id, f.id)}
                            download
                            className="btn btn-sm btn-outline-primary py-0 px-2 small"
                          >
                            <i className="bi bi-download"></i>
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Grade Display if Available */}
                {grade ? (
                  <div className="p-3 bg-light border border-success rounded mt-3">
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <span className="text-success fw-bold">Published Grade</span>
                      <span className="fs-5 fw-bold text-success">{grade.marks_obtained} / {assignment.max_marks}</span>
                    </div>
                    {grade.feedback && (
                      <div className="small text-muted mt-2 border-top pt-2">
                        <strong>Instructor Feedback:</strong>
                        <p className="mb-0 mt-1">{grade.feedback}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="alert alert-secondary small py-2 mt-3 mb-0">
                    <i className="bi bi-hourglass-split me-1"></i> Under evaluation by faculty.
                  </div>
                )}

                {!grade && (!isPastDue || assignment.allow_late_submission) && (
                  <div className="mt-3">
                    <Link to={`/student/assignments/${assignment.id}/submit`} className="btn btn-sm btn-outline-primary w-100">
                      Update / Resubmit Work
                    </Link>
                  </div>
                )}
              </div>
            ) : (
              <div>
                <div className="alert alert-warning py-2 small mb-3">
                  <i className="bi bi-exclamation-triangle-fill me-1"></i> You have not submitted work for this assignment yet.
                </div>

                <div className="small text-muted mb-3">
                  <strong>Late Policy:</strong> {assignment.allow_late_submission ? 'Late submissions accepted (marked as late).' : 'Submissions strictly close at due date.'}
                </div>

                {isPastDue && !assignment.allow_late_submission ? (
                  <button className="btn btn-secondary w-100 disabled" disabled>
                    Submissions Closed
                  </button>
                ) : (
                  <Link to={`/student/assignments/${assignment.id}/submit`} className="btn btn-unitask-primary w-100 py-2">
                    <i className="bi bi-cloud-arrow-up me-2"></i> Submit Assignment
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
