import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { assignmentApi, courseApi } from '../../services/api.js';

export const TeacherCreateAssignmentPage: React.FC = () => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState<any[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(true);

  const [formData, setFormData] = useState({
    course_id: '',
    title: '',
    description: '',
    instructions: '',
    max_marks: '100',
    due_at: '',
    allow_late_submission: false,
    status: 'published'
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await courseApi.getAll();
        const list = res.data.courses || [];
        setCourses(list);
        if (list.length > 0) {
          setFormData(prev => ({ ...prev, course_id: String(list[0].id) }));
        }

        // Default due date: 7 days from now formatted for datetime-local
        const d = new Date(Date.now() + 7 * 24 * 3600 * 1000);
        d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
        setFormData(prev => ({ ...prev, due_at: d.toISOString().slice(0, 16) }));
      } catch (err) {
        console.error('Failed to load courses:', err);
      } finally {
        setLoadingCourses(false);
      }
    }
    load();
  }, []);

  const handleSubmit = async (e: React.FormEvent, targetStatus?: 'draft' | 'published') => {
    e.preventDefault();
    if (!formData.title || !formData.course_id || !formData.due_at) {
      setError('Please provide title, course, and due date.');
      return;
    }

    setSaving(true);
    setError(null);

    const statusToUse = targetStatus || formData.status;

    try {
      const res = await assignmentApi.create({
        ...formData,
        course_id: parseInt(formData.course_id),
        max_marks: parseFloat(formData.max_marks),
        status: statusToUse
      });

      const newAssignmentId = res.data.assignment.id;

      // Upload attachment file if provided
      if (selectedFile) {
        const uploadData = new FormData();
        uploadData.append('file', selectedFile);
        await assignmentApi.uploadAttachment(newAssignmentId, uploadData);
      }

      navigate('/teacher/assignments');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create assignment.');
    } finally {
      setSaving(false);
    }
  };

  if (loadingCourses) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status"></div>
      </div>
    );
  }

  return (
    <div className="row justify-content-center">
      <div className="col-12 col-lg-9">
        <div className="mb-3">
          <Link to="/teacher/assignments" className="text-decoration-none small text-muted">
            <i className="bi bi-arrow-left me-1"></i> Back to Assignments
          </Link>
        </div>

        <div className="card card-unitask p-4 p-md-5">
          <div className="d-flex align-items-center gap-2 mb-2">
            <div className="p-2 bg-primary text-white rounded">
              <i className="bi bi-file-earmark-plus"></i>
            </div>
            <div>
              <h3 className="fw-bold text-dark mb-0">Create Assignment</h3>
              <p className="text-muted small mb-0">Define assignment instructions, scoring criteria, and deadlines.</p>
            </div>
          </div>

          <hr className="my-3 text-muted opacity-25" />

          {error && (
            <div className="alert alert-danger py-2 small">
              <i className="bi bi-exclamation-triangle-fill me-2"></i>{error}
            </div>
          )}

          <form onSubmit={e => handleSubmit(e)}>
            <div className="row g-3 mb-3">
              <div className="col-md-6">
                <label className="form-label">Course Section</label>
                <select
                  className="form-select"
                  value={formData.course_id}
                  onChange={e => setFormData({ ...formData, course_id: e.target.value })}
                  required
                >
                  {courses.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.course_code}: {c.course_name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-md-6">
                <label className="form-label">Publication Status</label>
                <select
                  className="form-select"
                  value={formData.status}
                  onChange={e => setFormData({ ...formData, status: e.target.value })}
                >
                  <option value="published">Publish Immediately (Visible to Students)</option>
                  <option value="draft">Save as Draft (Private)</option>
                </select>
              </div>
            </div>

            <div className="mb-3">
              <label className="form-label">Assignment Title</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. Lab 3: Binary Search Tree Balancing & Red-Black Invariants"
                value={formData.title}
                onChange={e => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>

            <div className="row g-3 mb-3">
              <div className="col-md-6">
                <label className="form-label">Maximum Points / Marks</label>
                <div className="input-group">
                  <input
                    type="number"
                    min="1"
                    max="1000"
                    step="0.5"
                    className="form-control"
                    value={formData.max_marks}
                    onChange={e => setFormData({ ...formData, max_marks: e.target.value })}
                    required
                  />
                  <span className="input-group-text bg-light text-muted">Points</span>
                </div>
              </div>

              <div className="col-md-6">
                <label className="form-label">Submission Due Date & Time</label>
                <input
                  type="datetime-local"
                  className="form-control"
                  value={formData.due_at}
                  onChange={e => setFormData({ ...formData, due_at: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="mb-3">
              <div className="form-check form-switch">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="lateToggle"
                  checked={formData.allow_late_submission}
                  onChange={e => setFormData({ ...formData, allow_late_submission: e.target.checked })}
                />
                <label className="form-check-label fw-semibold small" htmlFor="lateToggle">
                  Allow Late Submissions (Late submissions will be flagged for grading adjustments)
                </label>
              </div>
            </div>

            <div className="mb-3">
              <label className="form-label">Overview & Summary Description</label>
              <textarea
                rows={3}
                className="form-control"
                placeholder="Provide a high-level summary of the assignment goals..."
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                required
              ></textarea>
            </div>

            <div className="mb-4">
              <label className="form-label">Detailed Instructions & Grading Rubric</label>
              <textarea
                rows={5}
                className="form-control font-monospace small"
                placeholder="Step 1: Clone the repository...&#10;Step 2: Implement the required functions...&#10;Step 3: Run test suite..."
                value={formData.instructions}
                onChange={e => setFormData({ ...formData, instructions: e.target.value })}
              ></textarea>
            </div>

            {/* Reference Attachment Upload */}
            <div className="mb-4 p-3 bg-light rounded border">
              <label className="form-label fw-bold mb-1">Attach Reference Materials (Optional)</label>
              <p className="text-muted small mb-2">Upload starter code zip, problem PDF, or test datasets for students.</p>
              <input
                type="file"
                className="form-control"
                onChange={e => setSelectedFile(e.target.files ? e.target.files[0] : null)}
              />
              {selectedFile && (
                <div className="text-success small mt-1">
                  <i className="bi bi-paperclip me-1"></i>Ready to upload: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
                </div>
              )}
            </div>

            <div className="d-flex justify-content-between align-items-center">
              <Link to="/teacher/assignments" className="btn btn-unitask-outline">
                Cancel
              </Link>
              <div className="d-flex gap-2">
                <button
                  type="button"
                  disabled={saving}
                  onClick={e => handleSubmit(e, 'draft')}
                  className="btn btn-outline-secondary"
                >
                  Save as Draft
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="btn btn-unitask-primary px-4 d-inline-flex align-items-center gap-2"
                >
                  {saving && <span className="spinner-border spinner-border-sm" role="status"></span>}
                  <i className="bi bi-check-lg"></i> Publish Assignment
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
