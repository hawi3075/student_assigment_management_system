import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { assignmentApi, submissionApi } from '../../services/api.js';

export const StudentSubmitAssignmentPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [assignment, setAssignment] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submissionText, setSubmissionText] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      if (!id) return;
      try {
        const res = await assignmentApi.getById(id);
        setAssignment(res.data.assignment);
        if (res.data.submission) {
          setSubmissionText(res.data.submission.submission_text || '');
        }
      } catch (err: any) {
        setError(err.response?.data?.error || 'Failed to load assignment details.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;

    if (!selectedFile && !submissionText.trim()) {
      setError('Please either attach a file or write submission comments/notes.');
      return;
    }

    setSubmitting(true);
    setError(null);

    const formData = new FormData();
    if (submissionText) {
      formData.append('submission_text', submissionText);
    }
    if (selectedFile) {
      formData.append('file', selectedFile);
    }

    try {
      const res = await submissionApi.submit(id, formData);
      setSuccessMsg(res.data.message || 'Work submitted successfully!');
      setTimeout(() => {
        navigate(`/student/assignments/${id}`);
      }, 1500);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to submit assignment. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status"></div>
      </div>
    );
  }

  if (!assignment) {
    return (
      <div className="alert alert-danger">
        Assignment not found. <Link to="/student/assignments">Return to assignment list</Link>
      </div>
    );
  }

  const dueDate = new Date(assignment.due_at);
  const isPastDue = dueDate.getTime() < Date.now();

  return (
    <div className="row justify-content-center">
      <div className="col-12 col-md-10 col-lg-8">
        <div className="mb-3">
          <Link to={`/student/assignments/${id}`} className="text-decoration-none small text-muted">
            <i className="bi bi-arrow-left me-1"></i> Back to Assignment Details
          </Link>
        </div>

        <div className="card card-unitask p-4 p-md-5">
          <div className="d-flex align-items-center gap-2 mb-2">
            <span className="badge bg-primary text-white fw-bold">{assignment.course_code}</span>
            <span className="text-muted small fw-semibold">{assignment.course_name}</span>
          </div>

          <h3 className="fw-bold text-dark mb-1">Submit Assignment</h3>
          <p className="text-muted small mb-3">{assignment.title}</p>

          <div className="p-3 bg-light rounded border mb-4 small d-flex flex-wrap justify-content-between gap-3">
            <div>
              <span className="text-muted d-block">Deadline:</span>
              <strong>{dueDate.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })} at {dueDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</strong>
            </div>
            <div>
              <span className="text-muted d-block">Late Policy:</span>
              {assignment.allow_late_submission ? (
                <span className="badge bg-warning-subtle text-warning border">Late Allowed (marked as late)</span>
              ) : (
                <span className="badge bg-danger-subtle text-danger border">Strict Deadline (No Late)</span>
              )}
            </div>
            <div>
              <span className="text-muted d-block">Max Points:</span>
              <strong>{assignment.max_marks} Pts</strong>
            </div>
          </div>

          {isPastDue && !assignment.allow_late_submission && (
            <div className="alert alert-danger">
              <i className="bi bi-x-circle-fill me-2"></i>
              The deadline for this assignment has passed, and late submissions are not allowed by the instructor.
            </div>
          )}

          {isPastDue && assignment.allow_late_submission && (
            <div className="alert alert-warning">
              <i className="bi bi-exclamation-triangle-fill me-2"></i>
              The deadline has passed. Your submission will be recorded and marked as <strong>Late</strong>.
            </div>
          )}

          {error && (
            <div className="alert alert-danger py-2 small">
              <i className="bi bi-exclamation-circle-fill me-2"></i>{error}
            </div>
          )}

          {successMsg && (
            <div className="alert alert-success py-2 small">
              <i className="bi bi-check-circle-fill me-2"></i>{successMsg}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* File Upload Field */}
            <div className="mb-4">
              <label className="form-label fw-bold">Assignment File Upload</label>
              <div className="border border-2 border-dashed rounded p-4 text-center bg-light">
                <i className="bi bi-cloud-arrow-up text-primary fs-1 mb-2 d-block"></i>
                <div className="small text-muted mb-2">
                  Allowed file types: <strong>PDF, DOCX, ZIP, SQL, C/C++, Java, Python, TXT</strong> (Max 20MB)
                </div>
                <input
                  type="file"
                  id="fileUpload"
                  className="form-control"
                  onChange={e => setSelectedFile(e.target.files ? e.target.files[0] : null)}
                  disabled={isPastDue && !assignment.allow_late_submission}
                />
                {selectedFile && (
                  <div className="mt-2 text-success small fw-semibold">
                    <i className="bi bi-check-circle me-1"></i>Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
                  </div>
                )}
              </div>
            </div>

            {/* Optional Comments Field */}
            <div className="mb-4">
              <label className="form-label fw-bold">Submission Notes / Code Comments (Optional)</label>
              <textarea
                rows={4}
                className="form-control"
                placeholder="Include any remarks, instructions for the instructor, or links to git repositories if applicable..."
                value={submissionText}
                onChange={e => setSubmissionText(e.target.value)}
                disabled={isPastDue && !assignment.allow_late_submission}
              ></textarea>
            </div>

            <div className="d-flex justify-content-end gap-2">
              <Link to={`/student/assignments/${id}`} className="btn btn-unitask-outline">
                Cancel
              </Link>
              <button
                type="submit"
                disabled={submitting || (isPastDue && !assignment.allow_late_submission)}
                className="btn btn-unitask-primary px-4 d-inline-flex align-items-center gap-2"
              >
                {submitting && <span className="spinner-border spinner-border-sm" role="status"></span>}
                <i className="bi bi-send-check"></i> Submit Assignment
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
