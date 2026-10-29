import React, { useState, useEffect } from 'react';
import { courseApi, adminApi } from '../../services/api.js';

export const AdminCourseManagementPage: React.FC = () => {
  const [courses, setCourses] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const [formData, setFormData] = useState({
    course_code: '',
    course_name: '',
    description: '',
    semester: 'Fall 2026'
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [coursesRes, usersRes] = await Promise.all([
        courseApi.getAll(),
        adminApi.getUsers({ role: 'teacher' })
      ]);
      setCourses(coursesRes.data.courses || []);
      setTeachers(usersRes.data.users || []);
    } catch (err) {
      console.error('Failed to load courses or teachers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      await courseApi.create(formData);
      setShowCreateModal(false);
      setFormData({ course_code: '', course_name: '', description: '', semester: 'Fall 2026' });
      await loadData();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create course.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (courseId: number, code: string) => {
    if (!window.confirm(`Are you sure you want to delete course ${code}? This will remove all associated assignments.`)) return;

    try {
      await courseApi.delete(courseId);
      await loadData();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to delete course.');
    }
  };

  return (
    <div>
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
        <div>
          <h2 className="fw-bold text-dark mb-1">University Course Catalog</h2>
          <p className="text-muted mb-0">Oversee curriculum offerings, faculty assignments, and department course loads.</p>
        </div>
        <button
          onClick={() => { setError(null); setShowCreateModal(true); }}
          className="btn btn-unitask-primary d-inline-flex align-items-center gap-2"
        >
          <i className="bi bi-plus-circle"></i> Add Course Offering
        </button>
      </div>

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status"></div>
        </div>
      ) : courses.length === 0 ? (
        <div className="card card-unitask">
          <div className="empty-state">
            <i className="bi bi-collection"></i>
            <h5>No Courses Registered</h5>
            <p className="text-muted small">No courses found in the university registry.</p>
          </div>
        </div>
      ) : (
        <div className="card card-unitask border-0 shadow-sm overflow-hidden">
          <div className="table-responsive">
            <table className="table table-unitask align-middle">
              <thead>
                <tr>
                  <th>Course Code & Title</th>
                  <th>Faculty Instructor</th>
                  <th>Semester</th>
                  <th>Enrollment</th>
                  <th>Assignments</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {courses.map(c => (
                  <tr key={c.id}>
                    <td>
                      <div className="d-flex align-items-center gap-2 mb-1">
                        <span className="badge bg-primary text-white fw-bold">{c.course_code}</span>
                        <span className="fw-bold text-dark">{c.course_name}</span>
                      </div>
                      <div className="text-muted small text-truncate" style={{ maxWidth: '350px' }}>
                        {c.description || 'No description'}
                      </div>
                    </td>
                    <td>
                      <div className="fw-semibold text-dark">{c.teacher_name}</div>
                      <div className="text-muted small">{c.teacher_email || 'Faculty'}</div>
                    </td>
                    <td>
                      <span className="badge bg-light text-dark border">{c.semester}</span>
                    </td>
                    <td>
                      <span className="badge bg-info-subtle text-info border">
                        {c.student_count || 0} Students
                      </span>
                    </td>
                    <td>
                      <span className="badge bg-secondary-subtle text-secondary border">
                        {c.assignment_count || 0} Items
                      </span>
                    </td>
                    <td className="text-end">
                      <button
                        onClick={() => handleDelete(c.id, c.course_code)}
                        className="btn btn-sm btn-outline-danger"
                        title="Delete Course"
                      >
                        <i className="bi bi-trash"></i>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create Course Modal */}
      {showCreateModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow">
              <div className="modal-header bg-primary text-white" style={{ backgroundColor: '#0f2744' }}>
                <h5 className="modal-title fs-6 fw-bold">Add University Course</h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowCreateModal(false)}></button>
              </div>
              <form onSubmit={handleCreateCourse}>
                <div className="modal-body p-4">
                  {error && <div className="alert alert-danger py-2 small">{error}</div>}

                  <div className="mb-3">
                    <label className="form-label">Course Code</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. CS450"
                      value={formData.course_code}
                      onChange={e => setFormData({ ...formData, course_code: e.target.value })}
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Course Name</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. Distributed Cloud Architectures"
                      value={formData.course_name}
                      onChange={e => setFormData({ ...formData, course_name: e.target.value })}
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Semester</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.semester}
                      onChange={e => setFormData({ ...formData, semester: e.target.value })}
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Description</label>
                    <textarea
                      rows={3}
                      className="form-control"
                      placeholder="Syllabus summary and prerequisite competencies..."
                      value={formData.description}
                      onChange={e => setFormData({ ...formData, description: e.target.value })}
                    ></textarea>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowCreateModal(false)}>Cancel</button>
                  <button type="submit" disabled={saving} className="btn btn-unitask-primary btn-sm">
                    {saving && <span className="spinner-border spinner-border-sm me-1" role="status"></span>}
                    Register Course
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
