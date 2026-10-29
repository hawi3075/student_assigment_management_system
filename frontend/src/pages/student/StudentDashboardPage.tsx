import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.js';
import { assignmentApi, submissionApi, gradeApi } from '../../services/api.js';

export const StudentDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [gradesData, setGradesData] = useState<{ stats: any; grades: any[] }>({ stats: null, grades: [] });

  useEffect(() => {
    async function loadData() {
      try {
        const [assignRes, subRes, gradeRes] = await Promise.all([
          assignmentApi.getAll(),
          submissionApi.getMySubmissions(),
          gradeApi.getMyGrades()
        ]);
        setAssignments(assignRes.data.assignments || []);
        setSubmissions(subRes.data.submissions || []);
        setGradesData({
          stats: gradeRes.data.stats || null,
          grades: gradeRes.data.grades || []
        });
      } catch (err) {
        console.error('Error loading student dashboard:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center py-5">
        <div className="spinner-border text-primary" role="status"></div>
      </div>
    );
  }

  const totalAssignments = assignments.length;
  const submittedCount = submissions.length;
  const gradedCount = gradesData.grades.length;
  const pendingCount = assignments.filter(a => !a.my_submission_status && !a.is_overdue).length;

  const upcomingDeadlines = assignments
    .filter(a => !a.my_submission_status && new Date(a.due_at).getTime() > Date.now())
    .slice(0, 4);

  return (
    <div>
      {/* Visual Campus Hero Banner */}
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
              <i className="bi bi-mortarboard-fill me-1 text-primary"></i> Academic Year 2026&ndash;2027 &bull; Fall Semester
            </span>
            <span className="badge bg-success bg-opacity-75 text-white px-3 py-1 border border-light border-opacity-25">
              <i className="bi bi-check2-circle me-1"></i> Academic Standing: Good
            </span>
          </div>
          <div>
            <h2 className="fw-bold text-white mb-2">Welcome back, {user?.full_name}!</h2>
            <p className="text-white-50 mb-3 small" style={{ maxWidth: '650px', lineHeight: '1.6' }}>
              Track your coursework deadlines, upload validated submission attachments, and review detailed instructor evaluations.
            </p>
            <div className="d-flex flex-wrap gap-2">
              <Link to="/student/assignments" className="btn btn-sm btn-light fw-bold text-dark d-inline-flex align-items-center gap-2">
                <i className="bi bi-journal-check text-primary"></i> Browse Assignments
              </Link>
              <Link to="/student/grades" className="btn btn-sm btn-outline-light d-inline-flex align-items-center gap-2">
                <i className="bi bi-trophy text-warning"></i> View My Grades
              </Link>
              <Link to="/student/profile" className="btn btn-sm btn-outline-light d-inline-flex align-items-center gap-2">
                <i className="bi bi-person-circle"></i> Student Profile
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-sm-6 col-lg-3">
          <div className="stat-card">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <div className="stat-label">Total Coursework</div>
                <div className="stat-number">{totalAssignments}</div>
              </div>
              <div className="stat-icon bg-primary-subtle text-primary">
                <i className="bi bi-journal-bookmark-fill"></i>
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-lg-3">
          <div className="stat-card">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <div className="stat-label">Pending Action</div>
                <div className="stat-number text-warning">{pendingCount}</div>
              </div>
              <div className="stat-icon bg-warning-subtle text-warning">
                <i className="bi bi-clock-history"></i>
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-lg-3">
          <div className="stat-card">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <div className="stat-label">Submitted Work</div>
                <div className="stat-number text-info">{submittedCount}</div>
              </div>
              <div className="stat-icon bg-info-subtle text-info">
                <i className="bi bi-file-earmark-check-fill"></i>
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-lg-3">
          <div className="stat-card">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <div className="stat-label">Average Score</div>
                <div className="stat-number text-success">
                  {gradesData.stats ? `${gradesData.stats.average_percentage}%` : 'N/A'}
                </div>
              </div>
              <div className="stat-icon bg-success-subtle text-success">
                <i className="bi bi-trophy-fill"></i>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="row g-4">
        {/* Upcoming Deadlines */}
        <div className="col-12 col-lg-7">
          <div className="card card-unitask h-100">
            <div className="card-header card-header-unitask d-flex justify-content-between align-items-center">
              <span className="d-flex align-items-center gap-2">
                <i className="bi bi-calendar-event text-primary"></i>
                <span>Upcoming Assignment Deadlines</span>
              </span>
              <Link to="/student/assignments" className="small text-decoration-none fw-semibold">
                View All
              </Link>
            </div>
            <div className="card-body p-0">
              {upcomingDeadlines.length === 0 ? (
                <div className="empty-state py-4">
                  <i className="bi bi-calendar-check"></i>
                  <p className="mb-0">No urgent pending assignments due soon. Great work!</p>
                </div>
              ) : (
                <div className="list-group list-group-flush">
                  {upcomingDeadlines.map(a => {
                    const dueDate = new Date(a.due_at);
                    const hoursLeft = Math.round((dueDate.getTime() - Date.now()) / (1000 * 3600));
                    const isUrgent = hoursLeft < 48;

                    return (
                      <div key={a.id} className="list-group-item p-3 d-flex justify-content-between align-items-center">
                        <div>
                          <div className="d-flex align-items-center gap-2 mb-1">
                            <span className="badge bg-light text-dark border fw-bold">{a.course_code}</span>
                            <span className="badge bg-secondary-subtle text-secondary small">{a.max_marks} pts</span>
                          </div>
                          <Link to={`/student/assignments/${a.id}`} className="text-dark fw-bold text-decoration-none">
                            {a.title}
                          </Link>
                          <div className="text-muted small mt-1">
                            Instructor: {a.teacher_name}
                          </div>
                        </div>
                        <div className="text-end">
                          <span className={`badge ${isUrgent ? 'bg-danger text-white' : 'bg-warning-subtle text-warning border'} mb-2 d-inline-block`}>
                            Due {dueDate.toLocaleDateString([], { month: 'short', day: 'numeric' })} at {dueDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          <div>
                            <Link to={`/student/assignments/${a.id}/submit`} className="btn btn-sm btn-unitask-primary">
                              Submit
                            </Link>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Recent Grades and Teacher Feedback */}
        <div className="col-12 col-lg-5">
          <div className="card card-unitask h-100">
            <div className="card-header card-header-unitask d-flex justify-content-between align-items-center">
              <span className="d-flex align-items-center gap-2">
                <i className="bi bi-award-fill text-warning"></i>
                <span>Recent Academic Feedback</span>
              </span>
              <Link to="/student/grades" className="small text-decoration-none fw-semibold">
                All Grades
              </Link>
            </div>
            <div className="card-body p-3">
              {gradesData.grades.length === 0 ? (
                <div className="empty-state py-4">
                  <i className="bi bi-chat-left-quote"></i>
                  <p className="mb-0">No graded assignments published yet.</p>
                </div>
              ) : (
                <div className="d-flex flex-column gap-3">
                  {gradesData.grades.slice(0, 3).map(g => (
                    <div key={g.grade_id} className="p-3 rounded border bg-light">
                      <div className="d-flex justify-content-between align-items-center mb-1">
                        <span className="badge bg-primary text-white">{g.course_code}</span>
                        <span className="fw-bold text-success fs-6">
                          {g.marks_obtained} / {g.max_marks} pts
                        </span>
                      </div>
                      <div className="fw-semibold text-dark small mb-2">{g.assignment_title}</div>
                      {g.feedback && (
                        <div className="text-muted small fst-italic bg-white p-2 rounded border">
                          "{g.feedback}"
                        </div>
                      )}
                      <div className="text-muted small mt-2 d-flex justify-content-between">
                        <span>Teacher: {g.teacher_name}</span>
                        <span>{new Date(g.published_at).toLocaleDateString()}</span>
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
