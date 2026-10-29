import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.js';
import { assignmentApi, courseApi } from '../../services/api.js';

export const TeacherDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);

  useEffect(() => {
    async function loadData() {
      try {
        const [assignRes, courseRes] = await Promise.all([
          assignmentApi.getAll(),
          courseApi.getAll()
        ]);
        setAssignments(assignRes.data.assignments || []);
        setCourses(courseRes.data.courses || []);
      } catch (err) {
        console.error('Failed to load teacher dashboard:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status"></div>
      </div>
    );
  }

  const totalAssignments = assignments.length;
  const publishedCount = assignments.filter(a => a.status === 'published').length;
  const draftCount = assignments.filter(a => a.status === 'draft').length;
  const totalSubmissions = assignments.reduce((acc, a) => acc + (parseInt(a.submission_count) || 0), 0);

  const upcomingDeadlines = assignments
    .filter(a => a.status === 'published' && new Date(a.due_at).getTime() > Date.now())
    .slice(0, 4);

  return (
    <div>
      {/* Faculty Hero Banner */}
      <div
        className="card card-unitask mb-4 border-0 shadow-sm overflow-hidden text-white"
        style={{
          backgroundImage: `linear-gradient(90deg, rgba(15, 39, 68, 0.95) 0%, rgba(15, 39, 68, 0.85) 60%, rgba(15, 39, 68, 0.6) 100%), url('/src/assets/images/campus_hero.jpg')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          minHeight: '190px'
        }}
      >
        <div className="card-body p-4 p-md-5 d-flex flex-column justify-content-between">
          <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
            <span className="badge bg-light text-dark fw-bold px-3 py-1">
              <i className="bi bi-mortarboard-fill me-1 text-primary"></i> Faculty Academic Portal &bull; Fall Semester 2026
            </span>
            <span className="badge bg-info bg-opacity-75 text-white px-3 py-1 border border-light border-opacity-25">
              <i className="bi bi-building me-1"></i> {user?.department || 'Department of Computer Science'}
            </span>
          </div>
          <div>
            <h2 className="fw-bold text-white mb-2">Welcome back, Professor {user?.full_name}</h2>
            <p className="text-white-50 mb-3 small" style={{ maxWidth: '650px', lineHeight: '1.6' }}>
              Design coursework specifications, set strict deadline policies, inspect student attachments, and record evaluations.
            </p>
            <div className="d-flex flex-wrap gap-2">
              <Link to="/teacher/assignments/create" className="btn btn-sm btn-light fw-bold text-dark d-inline-flex align-items-center gap-2">
                <i className="bi bi-plus-circle text-primary"></i> Create Assignment
              </Link>
              <Link to="/teacher/courses" className="btn btn-sm btn-outline-light d-inline-flex align-items-center gap-2">
                <i className="bi bi-journal-bookmark"></i> Curricula & Rosters
              </Link>
              <Link to="/teacher/profile" className="btn btn-sm btn-outline-light d-inline-flex align-items-center gap-2">
                <i className="bi bi-person-circle"></i> Faculty Profile
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-sm-6 col-lg-3">
          <div className="stat-card">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <div className="stat-label">Active Courses</div>
                <div className="stat-number">{courses.length}</div>
              </div>
              <div className="stat-icon bg-primary-subtle text-primary">
                <i className="bi bi-mortarboard-fill"></i>
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-lg-3">
          <div className="stat-card">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <div className="stat-label">Total Assignments</div>
                <div className="stat-number">{totalAssignments}</div>
              </div>
              <div className="stat-icon bg-info-subtle text-info">
                <i className="bi bi-folder-check"></i>
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-lg-3">
          <div className="stat-card">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <div className="stat-label">Published / Live</div>
                <div className="stat-number text-success">{publishedCount}</div>
              </div>
              <div className="stat-icon bg-success-subtle text-success">
                <i className="bi bi-broadcast"></i>
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-lg-3">
          <div className="stat-card">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <div className="stat-label">Student Submissions</div>
                <div className="stat-number text-warning">{totalSubmissions}</div>
              </div>
              <div className="stat-icon bg-warning-subtle text-warning">
                <i className="bi bi-inbox-fill"></i>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="row g-4">
        {/* Active Assignments Overview */}
        <div className="col-12 col-lg-7">
          <div className="card card-unitask h-100">
            <div className="card-header card-header-unitask d-flex justify-content-between align-items-center">
              <span className="d-flex align-items-center gap-2">
                <i className="bi bi-list-check text-primary"></i>
                <span>Your Assignments</span>
              </span>
              <Link to="/teacher/assignments" className="small text-decoration-none fw-semibold">
                Manage All
              </Link>
            </div>
            <div className="card-body p-0">
              {assignments.length === 0 ? (
                <div className="empty-state py-4">
                  <i className="bi bi-journal-plus"></i>
                  <h5>No assignments created</h5>
                  <p className="text-muted small">Create your first assignment to begin receiving submissions.</p>
                  <Link to="/teacher/assignments/create" className="btn btn-sm btn-unitask-primary">
                    Create Assignment
                  </Link>
                </div>
              ) : (
                <div className="list-group list-group-flush">
                  {assignments.slice(0, 5).map(a => (
                    <div key={a.id} className="list-group-item p-3 d-flex justify-content-between align-items-center">
                      <div>
                        <div className="d-flex align-items-center gap-2 mb-1">
                          <span className="badge bg-primary text-white">{a.course_code}</span>
                          <span className={`badge ${a.status === 'published' ? 'bg-success-subtle text-success border' : 'bg-secondary-subtle text-secondary border'}`}>
                            {a.status}
                          </span>
                        </div>
                        <div className="fw-bold text-dark">{a.title}</div>
                        <div className="text-muted small">
                          Due: {new Date(a.due_at).toLocaleDateString([], { month: 'short', day: 'numeric' })} &bull; Max: {a.max_marks} pts
                        </div>
                      </div>
                      <div className="text-end">
                        <div className="small fw-bold text-primary mb-1">
                          {a.submission_count} Submitted
                        </div>
                        <Link to={`/teacher/assignments/${a.id}/submissions`} className="btn btn-sm btn-unitask-outline">
                          Grade & Review
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* My Courses Summary */}
        <div className="col-12 col-lg-5">
          <div className="card card-unitask h-100">
            <div className="card-header card-header-unitask d-flex justify-content-between align-items-center">
              <span className="d-flex align-items-center gap-2">
                <i className="bi bi-book text-primary"></i>
                <span>Assigned Courses</span>
              </span>
              <Link to="/teacher/courses" className="small text-decoration-none fw-semibold">
                View All
              </Link>
            </div>
            <div className="card-body p-3">
              {courses.length === 0 ? (
                <div className="empty-state py-4">
                  <i className="bi bi-journal-x"></i>
                  <p className="mb-0">No courses assigned to your profile yet.</p>
                </div>
              ) : (
                <div className="d-flex flex-column gap-3">
                  {courses.map(c => (
                    <div key={c.id} className="p-3 border rounded bg-light">
                      <div className="d-flex justify-content-between align-items-center mb-1">
                        <span className="badge bg-primary text-white fw-bold">{c.course_code}</span>
                        <span className="badge bg-info-subtle text-info border">
                          {c.student_count || 0} Students
                        </span>
                      </div>
                      <div className="fw-bold text-dark mb-1">{c.course_name}</div>
                      <div className="text-muted small mb-2 text-truncate">{c.description}</div>
                      <div className="d-flex justify-content-between align-items-center small text-muted">
                        <span>{c.semester}</span>
                        <span>{c.assignment_count || 0} assignments</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
