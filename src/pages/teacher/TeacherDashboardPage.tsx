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
    return <div className="page-loading"><div className="spinner-ut"></div></div>;
  }

  const totalAssignments = assignments.length;
  const publishedCount = assignments.filter(a => a.status === 'published').length;
  const draftCount = assignments.filter(a => a.status === 'draft').length;
  const totalSubmissions = assignments.reduce((acc, a) => acc + (parseInt(a.submission_count) || 0), 0);

  const stats = [
    { label: 'Active Courses',       value: courses.length,    icon: 'bi-mortarboard-fill', cls: 'si-blue',  change: 'Fall 2026' },
    { label: 'Total Assignments',     value: totalAssignments,  icon: 'bi-folder-check',    cls: 'si-sky',   change: `${draftCount} draft` },
    { label: 'Published / Live',      value: publishedCount,    icon: 'bi-broadcast',       cls: 'si-green', change: 'Active now' },
    { label: 'Student Submissions',   value: totalSubmissions,  icon: 'bi-inbox-fill',      cls: 'si-amber', change: 'Pending review' },
  ];

  return (
    <div>
      {/* ── Hero Banner ── */}
      <div className="hero-banner fade-up" style={{ backgroundImage: "url('/src/assets/images/campus_hero.jpg')" }}>
        <div className="hero-banner-img" style={{ backgroundImage: "url('/src/assets/images/campus_hero.jpg')" }}></div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1.1rem' }}>
          <span className="hero-chip">
            <i className="bi bi-mortarboard-fill"></i> Faculty Academic Portal · Fall Semester 2026
          </span>
          <span className="hero-chip hero-chip-info">
            <i className="bi bi-building"></i> {user?.department || 'Department of Computer Science'}
          </span>
        </div>

        <h1 className="hero-title">Welcome back, Prof. {user?.full_name?.split(' ').slice(-1)[0]}!</h1>
        <p className="hero-subtitle">
          Design coursework, set deadlines, inspect student submissions, and record evaluations from your faculty portal.
        </p>
        <div className="hero-actions">
          <Link to="/teacher/assignments/create" className="btn-hero-primary">
            <i className="bi bi-plus-circle"></i> Create Assignment
          </Link>
          <Link to="/teacher/courses" className="btn-hero-outline">
            <i className="bi bi-journal-bookmark"></i> Curricula & Rosters
          </Link>
          <Link to="/teacher/profile" className="btn-hero-outline">
            <i className="bi bi-person-circle"></i> Faculty Profile
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

        {/* Assignments list */}
        <div className="col-12 col-lg-7 fade-up fade-up-3">
          <div className="card-ut h-100">
            <div className="card-ut-header">
              <div className="card-ut-title">
                <i className="bi bi-list-check"></i>
                Your Assignments
              </div>
              <Link to="/teacher/assignments" className="card-ut-link">
                Manage All <i className="bi bi-arrow-right"></i>
              </Link>
            </div>

            {assignments.length === 0 ? (
              <div className="empty-state">
                <i className="bi bi-journal-plus"></i>
                <h5>No assignments yet</h5>
                <p>Create your first assignment to start receiving submissions.</p>
                <Link to="/teacher/assignments/create" className="btn-ut-primary">
                  <i className="bi bi-plus-circle"></i> Create Assignment
                </Link>
              </div>
            ) : (
              assignments.slice(0, 5).map(a => (
                <div key={a.id} className="list-item-ut">
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                      <span className="badge-course">{a.course_code}</span>
                      <span className={a.status === 'published' ? 'badge-published' : 'badge-draft'}>
                        {a.status}
                      </span>
                    </div>
                    <div style={{ fontWeight: 700, color: 'var(--primary)', fontSize: '0.9rem' }}>{a.title}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                      <i className="bi bi-calendar me-1"></i>
                      Due {new Date(a.due_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                      <span style={{ margin: '0 6px', opacity: 0.4 }}>·</span>
                      {a.max_marks} pts
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--accent)', marginBottom: '6px' }}>
                      <i className="bi bi-people me-1"></i>{a.submission_count} submitted
                    </div>
                    <Link to={`/teacher/assignments/${a.id}/submissions`} className="btn-ut-outline" style={{ padding: '0.3rem 0.75rem', fontSize: '0.78rem' }}>
                      Grade & Review
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Courses */}
        <div className="col-12 col-lg-5 fade-up fade-up-4">
          <div className="card-ut h-100">
            <div className="card-ut-header">
              <div className="card-ut-title">
                <i className="bi bi-book-fill"></i>
                Assigned Courses
              </div>
              <Link to="/teacher/courses" className="card-ut-link">
                View All <i className="bi bi-arrow-right"></i>
              </Link>
            </div>

            {courses.length === 0 ? (
              <div className="empty-state">
                <i className="bi bi-journal-x"></i>
                <h5>No courses assigned</h5>
                <p>Contact your administrator to get courses assigned.</p>
              </div>
            ) : (
              <div style={{ padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                {courses.map(c => (
                  <div key={c.id} className="course-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                      <span className="badge-course">{c.course_code}</span>
                      <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--info)', background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '20px', padding: '2px 8px' }}>
                        {c.student_count || 0} students
                      </span>
                    </div>
                    <div style={{ fontWeight: 700, color: 'var(--primary)', fontSize: '0.9rem', marginBottom: '3px' }}>{c.course_name}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: '6px' }}>
                      {c.description}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-light)' }}>
                      <span><i className="bi bi-calendar3 me-1"></i>{c.semester}</span>
                      <span><i className="bi bi-folder2 me-1"></i>{c.assignment_count || 0} assignments</span>
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
