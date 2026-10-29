import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { assignmentApi } from '../../services/api.js';

export const TeacherEditAssignmentPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    instructions: '',
    max_marks: '100',
    due_at: '',
    allow_late_submission: false,
    status: 'published'
  });

  useEffect(() => {
    async function load() {
      if (!id) return;
      try {
        const res = await assignmentApi.getById(id);
        const a = res.data.assignment;

        let formattedDue = '';
        if (a.due_at) {
          const d = new Date(a.due_at);
          d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
          formattedDue = d.toISOString().slice(0, 16);
        }

        setFormData({
          title: a.title,
          description: a.description,
          instructions: a.instructions || '',
          max_marks: String(a.max_marks),
          due_at: formattedDue,
          allow_late_submission: !!a.allow_late_submission,
          status: a.status
        });
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

    setSaving(true);
    setError(null);

    try {
      await assignmentApi.update(id, {
        ...formData,
        max_marks: parseFloat(formData.max_marks)
      });
      navigate('/teacher/assignments');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update assignment.');
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

  return (
    <div className="row justify-content-center">
      <div className="col-12 col-lg-9">
        <div className="mb-3">
          <Link to="/teacher/assignments" className="text-decoration-none small text-muted">
            <i className="bi bi-arrow-left me-1"></i> Back to Assignments
          </Link>
        </div>

        <div className="card card-unitask p-4 p-md-5">
          <h3 className="fw-bold text-dark mb-1">Edit Assignment</h3>
          <p className="text-muted small mb-4">Modify assignment details, adjust deadline, or toggle publishing status.</p>

          {error && <div className="alert alert-danger py-2 small">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label">Assignment Title</label>
              <input
                type="text"
                className="form-control"
                value={formData.title}
                onChange={e => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>

            <div className="row g-3 mb-3">
              <div className="col-md-4">
                <label className="form-label">Publication Status</label>
                <select
                  className="form-select"
                  value={formData.status}
                  onChange={e => setFormData({ ...formData, status: e.target.value })}
                >
                  <option value="published">Published</option>
                  <option value="draft">Draft</option>
                  <option value="completed">Completed / Archived</option>
                </select>
              </div>

              <div className="col-md-4">
                <label className="form-label">Maximum Points</label>
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
              </div>

              <div className="col-md-4">
                <label className="form-label">Submission Due Date</label>
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
                  Allow Late Submissions
                </label>
              </div>
            </div>

            <div className="mb-3">
              <label className="form-label">Description</label>
              <textarea
                rows={3}
                className="form-control"
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                required
              ></textarea>
            </div>

            <div className="mb-4">
              <label className="form-label">Detailed Instructions</label>
              <textarea
                rows={5}
                className="form-control font-monospace small"
                value={formData.instructions}
                onChange={e => setFormData({ ...formData, instructions: e.target.value })}
              ></textarea>
            </div>

            <div className="d-flex justify-content-between align-items-center">
              <Link to="/teacher/assignments" className="btn btn-unitask-outline">
                Cancel
              </Link>
              <button
                type="submit"
                disabled={saving}
                className="btn btn-unitask-primary px-4 d-inline-flex align-items-center gap-2"
              >
                {saving && <span className="spinner-border spinner-border-sm" role="status"></span>}
                Save Assignment Changes
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
