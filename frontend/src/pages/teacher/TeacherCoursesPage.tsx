import React, { useState, useEffect } from 'react';
import { courseApi } from '../../services/api.js';

export const TeacherCoursesPage: React.FC = () => {
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<any>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [courseDetails, setCourseDetails] = useState<any>(null);

  const [formData, setFormData] = useState({
    course_code: '',
    course_name: '',
    description: '',
    semester: 'Fall 2026'
  });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const loadCourses = async () => {
    try {
      const res = await courseApi.getAll();
      setCourses(res.data.courses || []);
    } catch (err) {
      console.error('Failed to load courses:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCourses();
  }, []);

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);

    try {
      await courseApi.create(formData);
      setShowModal(false);
      setFormData({ course_code: '', course_name: '', description: '', semester: 'Fall 2026' });
      await loadCourses();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create course.');
    } finally {
      setSaving(false);
    }
  };

  const handleViewDetails = async (courseId: number) => {
    try {
      const res = await courseApi.getById(courseId);
      setCourseDetails(res.data);
      setShowDetailsModal(true);
    } catch (err) {
      console.error('Failed to load course details:', err);
    }
  };

  const handleDelete = async (courseId: number) => {
    if (!window.confirm('Are you sure you want to delete this course? All associated assignments and enrollments will be removed.')) return;

    try {
      await courseApi.delete(courseId);
      await loadCourses();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to delete course.');
    }
  };

  return (
    <div>
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
        <div>
          <h2 className="fw-bold text-dark mb-1">Faculty Courses & Curricula</h2>
          <p className="text-muted mb-0">Manage university course sections, student rosters, and curriculum modules.</p>
        </div>
        <button
          onClick={() => { setError(null); setShowModal(true); }}
          className="btn btn-unitask-primary d-inline-flex align-items-center gap-2"
        >
          <i className="bi bi-plus-circle"></i> Create New Course
        </button>
      </div>

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status"></div>
        </div>
      ) : courses.length === 0 ? (
        <div className="card card-unitask">
          <div className="empty-state">
            <i className="bi bi-book"></i>
            <h5>No Courses Assigned</h5>
            <p className="text-muted small">You haven't created any course offerings yet.</p>
            <button onClick={() => setShowModal(true)} className="btn btn-sm btn-unitask-primary">
              Create First Course
            </button>
          </div>
        </div>
      ) : (
        <div className="row g-4">
          {courses.map(course => {
            const courseCover = course.course_code?.includes('202')
              ? '/src/assets/images/course_algorithms.jpg'
              : course.course_code?.includes('301')
              ? '/src/assets/images/course_database.jpg'
              : '/src/assets/images/campus_hero.jpg';

            return (
              <div key={course.id} className="col-12 col-md-6 col-lg-4">
                <div className="card card-unitask h-100 p-0 overflow-hidden shadow-sm d-flex flex-column justify-content-between">
                  <div>
                    <div className="position-relative" style={{ height: '120px' }}>
                      <img
                        src={courseCover}
                        alt={course.course_name}
                        className="w-100 h-100 object-fit-cover"
                        style={{ objectFit: 'cover' }}
                      />
                      <div className="position-absolute top-0 start-0 m-2">
                        <span className="badge bg-primary text-white fw-bold fs-6">{course.course_code}</span>
                      </div>
                      <div className="position-absolute top-0 end-0 m-2">
                        <span className="badge bg-dark bg-opacity-75 text-white border border-light border-opacity-25 small">{course.semester}</span>
                      </div>
                    </div>

                    <div className="p-4 pb-2">
                      <h5 className="fw-bold text-dark mb-2">{course.course_name}</h5>
                      <p className="text-muted small mb-3 text-truncate" style={{ maxHeight: '60px' }}>
                        {course.description || 'Curriculum description and syllabus outline.'}
                      </p>
                    </div>
                  </div>

                  <div className="p-4 pt-0">
                    <div className="d-flex justify-content-between align-items-center p-2 bg-light rounded border mb-3 small">
                      <span><i className="bi bi-people me-1 text-primary"></i><strong>{course.student_count || 0}</strong> Enrolled</span>
                      <span><i className="bi bi-journal-text me-1 text-success"></i><strong>{course.assignment_count || 0}</strong> Tasks</span>
                    </div>

                    <div className="d-flex justify-content-between align-items-center">
                      <button
                        onClick={() => handleViewDetails(course.id)}
                        className="btn btn-sm btn-unitask-primary"
                      >
                        <i className="bi bi-eye me-1"></i> Course Roster
                      </button>
                      <button
                        onClick={() => handleDelete(course.id)}
                        className="btn btn-sm btn-outline-danger"
                        title="Delete Course"
                      >
                        <i className="bi bi-trash"></i>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Course Modal */}
      {showModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow">
              <div className="modal-header bg-primary text-white" style={{ backgroundColor: '#0f2744' }}>
                <h5 className="modal-title fs-6 fw-bold">Create New University Course</h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowModal(false)}></button>
              </div>
              <form onSubmit={handleCreateCourse}>
                <div className="modal-body p-4">
                  {error && <div className="alert alert-danger py-2 small">{error}</div>}

                  <div className="mb-3">
                    <label className="form-label">Course Code (e.g. CS202)</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. CS401"
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
                      placeholder="e.g. Advanced Operating Systems"
                      value={formData.course_name}
                      onChange={e => setFormData({ ...formData, course_name: e.target.value })}
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Semester / Term</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.semester}
                      onChange={e => setFormData({ ...formData, semester: e.target.value })}
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Course Description</label>
                    <textarea
                      rows={3}
                      className="form-control"
                      placeholder="Overview of syllabus, prerequisites, and learning objectives..."
                      value={formData.description}
                      onChange={e => setFormData({ ...formData, description: e.target.value })}
                    ></textarea>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowModal(false)}>Cancel</button>
                  <button type="submit" disabled={saving} className="btn btn-unitask-primary btn-sm">
                    {saving && <span className="spinner-border spinner-border-sm me-1" role="status"></span>}
                    Create Course
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Course Details & Roster Modal */}
      {showDetailsModal && courseDetails && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content border-0 shadow">
              <div className="modal-header bg-primary text-white" style={{ backgroundColor: '#0f2744' }}>
                <h5 className="modal-title fs-6 fw-bold">
                  {courseDetails.course.course_code}: {courseDetails.course.course_name} Roster
                </h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowDetailsModal(false)}></button>
              </div>
              <div className="modal-body p-4">
                <h6 className="fw-bold mb-3 d-flex align-items-center gap-2">
                  <i className="bi bi-people text-primary"></i>
                  Enrolled Students ({courseDetails.students?.length || 0})
                </h6>

                {courseDetails.students?.length === 0 ? (
                  <p className="text-muted small">No students enrolled in this course section yet.</p>
                ) : (
                  <div className="table-responsive border rounded mb-4">
                    <table className="table table-sm table-unitask align-middle mb-0">
                      <thead>
                        <tr>
                          <th>Student Name</th>
                          <th>Email</th>
                          <th>Department</th>
                          <th>Enrolled Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {courseDetails.students.map((s: any) => (
                          <tr key={s.id}>
                            <td className="fw-semibold">{s.full_name}</td>
                            <td className="text-muted small">{s.email}</td>
                            <td className="small">{s.department || 'Undergraduate'}</td>
                            <td className="small text-muted">{new Date(s.enrolled_at).toLocaleDateString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                <h6 className="fw-bold mb-3 d-flex align-items-center gap-2">
                  <i className="bi bi-journal-check text-primary"></i>
                  Associated Assignments ({courseDetails.assignments?.length || 0})
                </h6>

                {courseDetails.assignments?.length === 0 ? (
                  <p className="text-muted small">No assignments published for this course yet.</p>
                ) : (
                  <div className="list-group list-group-flush border rounded">
                    {courseDetails.assignments.map((a: any) => (
                      <div key={a.id} className="list-group-item p-2 d-flex justify-content-between align-items-center small">
                        <div>
                          <strong>{a.title}</strong>
                          <span className="text-muted ms-2">(Due: {new Date(a.due_at).toLocaleDateString()})</span>
                        </div>
                        <span className="badge bg-light text-dark border">{a.submission_count || 0} Submissions</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowDetailsModal(false)}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
