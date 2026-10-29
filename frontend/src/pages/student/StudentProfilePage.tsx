import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { userApi, courseApi } from '../../services/api.js';

export const StudentProfilePage: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [department, setDepartment] = useState(user?.department || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [courses, setCourses] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'danger'; text: string } | null>(null);

  useEffect(() => {
    if (user) {
      setFullName(user.full_name || '');
      setDepartment(user.department || '');
      setBio(user.bio || '');
    }
    loadCourses();
  }, [user]);

  const loadCourses = async () => {
    try {
      const res = await courseApi.getAll();
      setCourses(res.data.courses || []);
    } catch (err) {
      console.error('Failed to load courses:', err);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      await userApi.updateProfile({
        full_name: fullName,
        department,
        bio
      });
      await refreshUser();
      setMessage({ type: 'success', text: 'Profile details saved successfully.' });
    } catch (err: any) {
      setMessage({ type: 'danger', text: err.response?.data?.error || 'Failed to update profile.' });
    } finally {
      setSaving(false);
    }
  };

  const handleEnroll = async (courseId: number) => {
    try {
      await courseApi.enroll(courseId);
      await loadCourses();
      setMessage({ type: 'success', text: 'Enrolled in course successfully!' });
    } catch (err: any) {
      setMessage({ type: 'danger', text: err.response?.data?.error || 'Failed to enroll in course.' });
    }
  };

  const handleUnenroll = async (courseId: number) => {
    if (!window.confirm('Are you sure you want to drop this course?')) return;
    try {
      await courseApi.unenroll(courseId, user!.id);
      await loadCourses();
      setMessage({ type: 'success', text: 'Dropped course successfully.' });
    } catch (err: any) {
      setMessage({ type: 'danger', text: err.response?.data?.error || 'Failed to drop course.' });
    }
  };

  return (
    <div>
      <div className="mb-4">
        <h2 className="fw-bold text-dark mb-1">Student Profile & Settings</h2>
        <p className="text-muted mb-0">Manage your university student profile and active academic course enrollments.</p>
      </div>

      {message && (
        <div className={`alert alert-${message.type} alert-dismissible fade show small py-2`} role="alert">
          {message.text}
          <button type="button" className="btn-close py-2" onClick={() => setMessage(null)}></button>
        </div>
      )}

      <div className="row g-4">
        {/* Profile Card & Form */}
        <div className="col-12 col-lg-5">
          <div className="card card-unitask p-4">
            <div className="d-flex align-items-center gap-3 mb-4">
              <div
                className="rounded-circle bg-primary text-white fs-3 fw-bold d-flex align-items-center justify-content-center"
                style={{ width: '64px', height: '64px', backgroundColor: '#0f2744' }}
              >
                {user?.full_name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h5 className="fw-bold text-dark mb-0">{user?.full_name}</h5>
                <div className="text-muted small">{user?.email}</div>
                <span className="badge bg-success text-uppercase mt-1" style={{ fontSize: '0.65rem' }}>
                  {user?.role}
                </span>
              </div>
            </div>

            <form onSubmit={handleUpdate}>
              <div className="mb-3">
                <label className="form-label">Full Name</label>
                <input
                  type="text"
                  className="form-control"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  required
                />
              </div>

              <div className="mb-3">
                <label className="form-label">University Email</label>
                <input
                  type="email"
                  className="form-control bg-light text-muted"
                  value={user?.email}
                  disabled
                />
                <div className="form-text small">University emails cannot be changed directly.</div>
              </div>

              <div className="mb-3">
                <label className="form-label">Academic Department</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Computer Science"
                  value={department}
                  onChange={e => setDepartment(e.target.value)}
                />
              </div>

              <div className="mb-4">
                <label className="form-label">Student Bio / Statement</label>
                <textarea
                  rows={3}
                  className="form-control"
                  placeholder="Brief academic focus or interests..."
                  value={bio}
                  onChange={e => setBio(e.target.value)}
                ></textarea>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="btn btn-unitask-primary w-100 d-flex align-items-center justify-content-center gap-2"
              >
                {saving && <span className="spinner-border spinner-border-sm" role="status"></span>}
                Save Profile Changes
              </button>
            </form>
          </div>
        </div>

        {/* Course Enrollments Management */}
        <div className="col-12 col-lg-7">
          <div className="card card-unitask h-100">
            <div className="card-header card-header-unitask d-flex justify-content-between align-items-center">
              <span className="d-flex align-items-center gap-2">
                <i className="bi bi-book-half text-primary"></i>
                <span>Enrolled Courses</span>
              </span>
              <span className="badge bg-primary-subtle text-primary border">
                {courses.filter(c => c.is_enrolled).length} Active Courses
              </span>
            </div>
            <div className="card-body p-0">
              <div className="list-group list-group-flush">
                {courses.map(course => (
                  <div key={course.id} className="list-group-item p-3 d-flex justify-content-between align-items-center">
                    <div>
                      <div className="d-flex align-items-center gap-2 mb-1">
                        <span className="badge bg-primary text-white fw-bold">{course.course_code}</span>
                        <span className="fw-bold text-dark">{course.course_name}</span>
                      </div>
                      <div className="text-muted small">
                        Instructor: {course.teacher_name} &bull; {course.semester}
                      </div>
                      <p className="text-muted small mb-0 mt-1" style={{ maxWidth: '450px' }}>
                        {course.description}
                      </p>
                    </div>

                    <div>
                      {course.is_enrolled ? (
                        <div className="d-flex flex-column align-items-end gap-1">
                          <span className="badge bg-success-subtle text-success border">
                            <i className="bi bi-check2 me-1"></i>Enrolled
                          </span>
                          <button
                            onClick={() => handleUnenroll(course.id)}
                            className="btn btn-link text-danger text-decoration-none p-0 small"
                            style={{ fontSize: '0.75rem' }}
                          >
                            Drop Course
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleEnroll(course.id)}
                          className="btn btn-sm btn-outline-primary"
                        >
                          Enroll Now
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
