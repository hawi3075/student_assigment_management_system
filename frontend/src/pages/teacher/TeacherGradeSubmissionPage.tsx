import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { submissionApi, gradeApi } from '../../services/api.js';

export const TeacherGradeSubmissionPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [submission, setSubmission] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [marks, setMarks] = useState<string>('');
  const [feedback, setFeedback] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      if (!id) return;
      try {
        const res = await submissionApi.getById(id);
        const sub = res.data.submission;
        setSubmission(sub);
        if (sub.marks_obtained !== null && sub.marks_obtained !== undefined) {
          setMarks(String(sub.marks_obtained));
        }
        if (sub.feedback) {
          setFeedback(sub.feedback);
        }
      } catch (err: any) {
        setError(err.response?.data?.error || 'Failed to load submission.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  const handleSave = async (publish: boolean) => {
    if (!id || !submission) return;

    const numMarks = parseFloat(marks);
    if (isNaN(numMarks) || numMarks < 0) {
      setError('Marks must be a valid non-negative number.');
      return;
    }

    if (numMarks > parseFloat(submission.max_marks)) {
      setError(`Marks cannot exceed the maximum allowed score of ${submission.max_marks}.`);
      return;
    }

    setSaving(true);
    setError(null);

    try {
      await gradeApi.saveGrade(id, {
        marks_obtained: numMarks,
        feedback,
        publish
      });
      setSuccessMsg(publish ? 'Grade published to student successfully.' : 'Grade saved as draft.');
      setTimeout(() => {
        navigate(`/teacher/assignments/${submission.assignment_id}/submissions`);
      }, 1200);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to record grade.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status"></div>
      </div>
    );
  }

  if (!submission) {
    return (
      <div className="alert alert-danger">
        Submission record not found. <Link to="/teacher/assignments">Return to Assignments</Link>
      </div>
    );
  }

  const subDate = new Date(submission.submitted_at);

  return (
    <div className="row justify-content-center">
      <div className="col-12 col-lg-9">
        <div className="mb-3">
          <Link
            to={`/teacher/assignments/${submission.assignment_id}/submissions`}
            className="text-decoration-none small text-muted"
          >
            <i className="bi bi-arrow-left me-1"></i> Back to Submissions
          </Link>
        </div>

        <div className="card card-unitask p-4 p-md-5">
          <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
            <div>
              <div className="d-flex align-items-center gap-2 mb-1">
                <span className="badge bg-primary text-white">{submission.course_code}</span>
                <span className="text-muted small fw-semibold">{submission.course_name}</span>
              </div>
              <h3 className="fw-bold text-dark mb-0">{submission.assignment_title}</h3>
            </div>
            <div className="text-end">
              <span className="badge bg-light text-dark border fs-6">
                Max Score: {submission.max_marks} Points
              </span>
            </div>
          </div>

          <hr className="my-3 text-muted opacity-25" />

          {/* Student Submission Card */}
          <div className="card bg-light border-0 p-3 mb-4">
            <h6 className="fw-bold text-dark mb-2">Student Submission Details</h6>
            <div className="row g-2 small">
              <div className="col-sm-6 col-md-3">
                <span className="text-muted d-block">Student Name:</span>
                <strong>{submission.student_name}</strong>
              </div>
              <div className="col-sm-6 col-md-3">
                <span className="text-muted d-block">Student Email:</span>
                <strong>{submission.student_email}</strong>
              </div>
              <div className="col-sm-6 col-md-3">
                <span className="text-muted d-block">Submitted Date:</span>
                <strong>{subDate.toLocaleDateString()} at {subDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</strong>
              </div>
              <div className="col-sm-6 col-md-3">
                <span className="text-muted d-block">Late Status:</span>
                {submission.is_late ? (
                  <span className="badge bg-warning text-dark">Late Submission</span>
                ) : (
                  <span className="badge bg-success text-white">On Time</span>
                )}
              </div>
            </div>

            {submission.submission_text && (
              <div className="mt-3 bg-white p-3 rounded border">
                <span className="text-muted small fw-semibold d-block mb-1">Student Notes & Comments:</span>
                <p className="mb-0 small fst-italic">{submission.submission_text}</p>
              </div>
            )}

            {submission.files && submission.files.length > 0 && (
              <div className="mt-3">
                <span className="text-muted small fw-semibold d-block mb-1">Submitted Files:</span>
                <div className="d-flex flex-wrap gap-2">
                  {submission.files.map((f: any) => (
                    <a
                      key={f.id}
                      href={submissionApi.downloadUrl(submission.id, f.id)}
                      download
                      className="btn btn-sm btn-white bg-white border text-primary d-inline-flex align-items-center gap-2"
                    >
                      <i className="bi bi-file-earmark-arrow-down fs-5"></i>
                      <div className="text-start">
                        <div className="fw-semibold small">{f.original_filename}</div>
                        <div className="text-muted" style={{ fontSize: '0.7rem' }}>
                          {(f.file_size / 1024).toFixed(1)} KB &bull; Click to Download
                        </div>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>

          {error && <div className="alert alert-danger py-2 small">{error}</div>}
          {successMsg && <div className="alert alert-success py-2 small">{successMsg}</div>}

          {/* Grading Form */}
          <h5 className="fw-bold text-dark mb-3">Evaluation & Marks</h5>

          <div className="row g-3 mb-3">
            <div className="col-md-4">
              <label className="form-label">Marks Awarded</label>
              <div className="input-group">
                <input
                  type="number"
                  min="0"
                  max={submission.max_marks}
                  step="0.5"
                  className="form-control"
                  placeholder={`0 - ${submission.max_marks}`}
                  value={marks}
                  onChange={e => setMarks(e.target.value)}
                  required
                />
                <span className="input-group-text bg-light text-muted">/ {submission.max_marks}</span>
              </div>
            </div>

            <div className="col-md-8">
              <div className="small text-muted p-3 bg-light rounded border h-100 d-flex align-items-center">
                <span>
                  <i className="bi bi-info-circle me-1 text-primary"></i>
                  Grades saved as <strong>Draft</strong> remain private to faculty until explicitly <strong>Published</strong>.
                </span>
              </div>
            </div>
          </div>

          <div className="mb-4">
            <label className="form-label">Written Feedback & Guidance</label>
            <textarea
              rows={5}
              className="form-control"
              placeholder="Provide constructive assessment and commentary on the student's work..."
              value={feedback}
              onChange={e => setFeedback(e.target.value)}
            ></textarea>
          </div>

          <div className="d-flex justify-content-between align-items-center">
            <Link
              to={`/teacher/assignments/${submission.assignment_id}/submissions`}
              className="btn btn-unitask-outline"
            >
              Cancel
            </Link>
            <div className="d-flex gap-2">
              <button
                type="button"
                disabled={saving}
                onClick={() => handleSave(false)}
                className="btn btn-outline-secondary"
              >
                Save as Draft
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={() => handleSave(true)}
                className="btn btn-unitask-primary px-4 d-inline-flex align-items-center gap-2"
              >
                {saving && <span className="spinner-border spinner-border-sm" role="status"></span>}
                <i className="bi bi-check2-circle"></i> Save & Publish Grade
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
