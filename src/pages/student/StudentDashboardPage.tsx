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
        setGradesData({ stats: gradeRes.data.stats || null, grades: gradeRes.data.grades || [] });
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
      <div className="page-loading">
        <div className="spinner-ut"></div>
      </div>
    );
  }

  const totalAssignments = assignments.length;
  const submittedCount = submissions.length;
  const pendingCount = assignments.filter(a => !a.my_submission_status && !a.is_overdue).length;
  const upcomingDeadlines = assignments
    .filter(a => !a.my_submission_status && new Date(a.due_at).getTime() > Date.now())
    .slice(0, 4);

  const stats = [
    { label: 'Total Coursework', value: totalAssignments, icon: 'bi-journal-bookmark-fill', cls: 'si-blue', change: 'This semester' },
    { label: 'Pending Action',   value: pendingCount,     icon: 'bi-clock-history',          cls: 'si-amber', change: 'Needs attention' },
    { label: 'Submitted Work',   value: submittedCount,   icon: 'bi-file-earmark-check-fill', cls: 'si-sky',  change: 'Total uploads' },
    {
      label: 'Average Score',
      value: gradesData.stats ? `${gradesData.stats.average_percentage}%` : '—',
      icon: 'bi-trophy-fill',
      cls: 'si-green',
      change: gradesData.stats ? 'Across all graded' : 'No grades yet'
    },
  ];

  return (
    <div>
      {/* ── Hero Banner ── */}
      <div className="hero-banner fade-up" style={{ backgroundImage: "url('/src/assets/images/campus_hero.jpg')" }}>
        <div className="hero-banner-img" style={{ backgroundImage: "url('/src/assets/images/campus_hero.jpg')" }}></div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1.1rem' }}>
          <span className="hero-chip">
            <i className="bi bi-mortarboard-fill"></i> Academic Year 2026–2027 · Fall Semester
          </span>
          <span className="hero-chip hero-chip-success">
            <i className="bi bi-check2-circle"></i> Good Academic Standing
          </span>
        </div>

        <h1 className="hero-title">Welcome back, {user?.full_name?.split(' ')[0]}!</h1>
        <p className="hero-subtitle">
          Track your coursework deadlines, upload assignments, and review instructor feedback — all in one place.
        </p>
        <div className="hero-actions">
          <Link to="/student/assignments" className="btn-hero-primary">
            <i className="bi bi-journal-check"></i> Browse Assignments
          </Link>
          <Link to="/student/grades" className="btn-hero-outline">
            <i className="bi bi-trophy"></i> View Grades
          </Link>
          <Link to="/student/profile" className="btn-hero-outline">
            <i className="bi bi-person-circle"></i> My Profile
          </Link>
        </div>
      </div>

      {/* ── Stat Cards ── */}
      <div className="row g-3 mb-4">
        {stats.map((s, i) => (
          <div key={s.label} className={`col-12 col-sm-6 col-lg-3 fade-up fade-up-${i + 1}`}>
            <div className="stat-card">
              <div className="d-flex justify-content-between align-items-start">
                <div>
                  <div className="stat-label">{s.label}</div>
                  <div className="stat-number">{s.value}</div>
                  <div className="stat-change text-muted">
                    <i className="bi bi-arrow-up-right" style={{ fontSize: '0.65rem' }}></i>
                    {s.change}
                  </div>
                </div>
                <div className={`stat-icon ${s.cls}`}>
                  <i className={`bi ${s.icon}`}></i>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Content Row ── */}
      <div className="row g-4">

        {/* Upcoming Deadlines */}
        <div className="col-12 col-lg-7 fade-up fade-up-3">
          <div className="card-ut h-100">
            <div className="card-ut-header">
              <div className="card-ut-title">
                <i className="bi bi-calendar-event"></i>
                Upcoming Deadlines
              </div>
              <Link to="/student/assignments" className="card-ut-link">
                View All <i className="bi bi-arrow-right"></i>
              </Link>
            </div>

            {upcomingDeadlines.length === 0 ? (
              <div className="empty-state">
                <i className="bi bi-calendar-check"></i>
                <h5>All caught up!</h5>
                <p>No pending assignments due soon.</p>
              </div>
            ) : (
              upcomingDeadlines.map(a => {
                const dueDate = new Date(a.due_at);
                const hoursLeft = Math.round((dueDate.getTime() - Date.now()) / 3600000);
                const isUrgent = hoursLeft < 48;
                return (
                  <div key={a.id} className="list-item-ut">
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                        <span className="badge-course">{a.course_code}</span>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>{a.max_marks} pts</span>
                      </div>
                      <Link to={`/student/assignments/${a.id}`} style={{ fontWeight: 700, color: 'var(--primary)', textDecoration: 'none', fontSize: '0.9rem', display: 'block' }}>
                        {a.title}
                      </Link>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                        <i className="bi bi-person me-1"></i>{a.teacher_name}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div className={isUrgent ? 'badge-urgent' : 'badge-due'} style={{ marginBottom: '8px', display: 'inline-block' }}>
                        <i className={`bi ${isUrgent ? 'bi-exclamation-circle' : 'bi-clock'} me-1`}></i>
                        {dueDate.toLocaleDateString([], { month: 'short', day: 'numeric' })}
                      </div>
                      <div>
                        <Link to={`/student/assignments/${a.id}/submit`} className="btn-ut-primary" style={{ padding: '0.35rem 0.85rem', fontSize: '0.8rem' }}>
                          <i className="bi bi-upload"></i> Submit
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Recent Grades */}
        <div className="col-12 col-lg-5 fade-up fade-up-4">
          <div className="card-ut h-100">
            <div className="card-ut-header">
              <div className="card-ut-title">
                <i className="bi bi-award-fill" style={{ color: '#d97706' }}></i>
                Recent Feedback
              </div>
              <Link to="/student/grades" className="card-ut-link">
                All Grades <i className="bi bi-arrow-right"></i>
              </Link>
            </div>

            {gradesData.grades.length === 0 ? (
              <div className="empty-state">
                <i className="bi bi-chat-left-quote"></i>
                <h5>No grades yet</h5>
                <p>Grades will appear here once published by your instructor.</p>
              </div>
            ) : (
              <div style={{ padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                {gradesData.grades.slice(0, 3).map(g => (
                  <div key={g.grade_id} className="grade-item">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <span className="badge-course">{g.course_code}</span>
                      <span className="grade-score">{g.marks_obtained} / {g.max_marks} pts</span>
                    </div>
                    <div style={{ fontWeight: 700, fontSize: '0.86rem', color: 'var(--primary)', marginBottom: '4px' }}>{g.assignment_title}</div>
                    {g.feedback && <div className="grade-feedback">"{g.feedback}"</div>}
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '6px' }}>
                      <span><i className="bi bi-person me-1"></i>{g.teacher_name}</span>
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
  );
};
