import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { userApi, courseApi } from '../../services/api.js';

function initials(name: string) {
  return name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();
}

export const StudentProfilePage: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const [fullName,   setFullName]   = useState(user?.full_name  || '');
  const [department, setDepartment] = useState(user?.department || '');
  const [bio,        setBio]        = useState(user?.bio        || '');
  const [courses,    setCourses]    = useState<any[]>([]);
  const [saving,     setSaving]     = useState(false);
  const [message,    setMessage]    = useState<{ type: 'success' | 'danger'; text: string } | null>(null);

  useEffect(() => {
    if (user) {
      setFullName(user.full_name  || '');
      setDepartment(user.department || '');
      setBio(user.bio  || '');
    }
    loadCourses();
  }, [user]);

  const loadCourses = async () => {
    try {
      const res = await courseApi.getAll();
      setCourses(res.data.courses || []);
    } catch { /* silent */ }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      await userApi.updateProfile({ full_name: fullName, department, bio });
      await refreshUser();
      setMessage({ type: 'success', text: 'Profile saved successfully.' });
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
      setMessage({ type: 'success', text: 'Enrolled successfully!' });
    } catch (err: any) {
      setMessage({ type: 'danger', text: err.response?.data?.error || 'Failed to enroll.' });
    }
  };

  const handleUnenroll = async (courseId: number) => {
    if (!window.confirm('Drop this course?')) return;
    try {
      await courseApi.unenroll(courseId, user!.id);
      await loadCourses();
      setMessage({ type: 'success', text: 'Course dropped.' });
    } catch (err: any) {
      setMessage({ type: 'danger', text: err.response?.data?.error || 'Failed to drop course.' });
    }
  };

  const enrolledCount = courses.filter(c => c.is_enrolled).length;

  return (
    <div>
      <style>{`
        .profile-avatar {
          width: 88px; height: 88px; border-radius: 20px;
          background: linear-gradient(135deg,#1e3a8a,#2563eb);
          color: #fff; font-size: 2rem; font-weight: 800;
          display: flex; align-items: center; justify-content: center;
          border: 3px solid rgba(37,99,235,0.25);
          box-shadow: 0 0 0 4px rgba(37,99,235,0.08), 0 8px 24px rgba(37,99,235,0.2);
          flex-shrink: 0; position: relative;
        }
        .profile-online {
          position: absolute; bottom: -3px; right: -3px;
          width: 14px; height: 14px; border-radius: 50%;
          background: #10b981; border: 2.5px solid #fff;
        }
        .profile-cover {
          height: 110px;
          background: linear-gradient(135deg,#0a1628 0%,#0d213a 50%,#1e3a8a 100%);
          border-radius: 14px 14px 0 0;
          position: relative; overflow: hidden;
        }
        .profile-cover::before {
          content:'';
          position:absolute; inset:0;
          background: radial-gradient(circle at 80% 50%, rgba(37,99,235,0.3), transparent 60%);
        }
        .profile-cover::after {
          content:'';
          position:absolute; inset:0;
          background: radial-gradient(circle at 20% 80%, rgba(16,185,129,0.12), transparent 55%);
        }
        .profile-card {
          background: #fff;
          border: 1px solid #e2e8f0;
          border-radius: 14px;
          overflow: hidden;
          box-shadow: 0 4px 20px rgba(0,0,0,0.07);
        }
        .profile-body { padding: 0 1.5rem 1.5rem; }
        .profile-info-field {
          display: flex; align-items: center; gap: 10px;
          padding: 0.65rem 0;
          border-bottom: 1px solid #f1f5f9;
          font-size: 0.875rem;
        }
        .profile-info-field:last-child { border-bottom: none; }
        .profile-info-icon {
          width: 32px; height: 32px; border-radius: 8px;
          display: flex; align-items: center; justify-content: center;
          font-size: 0.9rem; flex-shrink: 0;
        }
        .form-field-ut {
          display: flex; flex-direction: column; gap: 6px; margin-bottom: 1rem;
        }
        .form-field-ut label {
          font-size: 0.82rem; font-weight: 700; color: #334155;
          display: flex; align-items: center; gap: 5px;
        }
        .input-ut {
          width: 100%; padding: 0.6rem 0.9rem;
          border: 1.5px solid #e2e8f0; border-radius: 9px;
          font-size: 0.9rem; color: #1e293b;
          background: #fff; outline: none;
          transition: border-color 0.15s, box-shadow 0.15s;
          font-family: inherit;
        }
        .input-ut:focus { border-color: #2563eb; box-shadow: 0 0 0 3px rgba(37,99,235,0.1); }
        .input-ut:disabled { background: #f8fafc; color: #94a3b8; cursor: not-allowed; }
        .save-btn {
          width: 100%; padding: 0.72rem;
          background: linear-gradient(135deg,#1e3a8a,#2563eb);
          border: none; border-radius: 10px;
          color: #fff; font-weight: 700; font-size: 0.9rem;
          cursor: pointer; display: flex; align-items: center;
          justify-content: center; gap: 8px;
          box-shadow: 0 3px 12px rgba(37,99,235,0.35);
          transition: all 0.15s;
        }
        .save-btn:hover:not(:disabled) { box-shadow: 0 5px 18px rgba(37,99,235,0.45); transform: translateY(-1px); }
        .save-btn:disabled { opacity: 0.7; cursor: not-allowed; }
        .course-row {
          padding: 0.9rem 1.25rem;
          border-bottom: 1px solid #f8fafc;
          display: flex; justify-content: space-between;
          align-items: flex-start; gap: 1rem;
          transition: background 0.13s;
        }
        .course-row:last-child { border-bottom: none; }
        .course-row:hover { background: #fafbfc; }
        .enroll-btn {
          padding: 0.35rem 0.85rem; border-radius: 7px;
          background: #eff6ff; border: 1.5px solid rgba(37,99,235,0.3);
          color: #2563eb; font-size: 0.78rem; font-weight: 700;
          cursor: pointer; transition: all 0.13s; white-space: nowrap;
        }
        .enroll-btn:hover { background: #dbeafe; }
        .drop-btn {
          background: none; border: none; color: #dc2626;
          font-size: 0.75rem; font-weight: 600; cursor: pointer;
          padding: 0; transition: opacity 0.13s;
        }
        .drop-btn:hover { opacity: 0.75; }
        .toast-msg {
          display: flex; align-items: center; gap: 8px;
          padding: 0.7rem 1rem; border-radius: 10px;
          font-size: 0.875rem; font-weight: 500;
          margin-bottom: 1.25rem; position: relative;
        }
        .toast-success { background: #f0fdf4; border: 1px solid #bbf7d0; color: #059669; }
        .toast-danger  { background: #fef2f2; border: 1px solid #fecaca; color: #dc2626; }
        .toast-close {
          position: absolute; right: 10px; top: 50%; transform: translateY(-50%);
          background: none; border: none; cursor: pointer; font-size: 1rem;
          color: inherit; opacity: 0.6; padding: 0;
        }
        .stat-pill {
          display: inline-flex; align-items: center; gap: 5px;
          padding: 4px 12px; border-radius: 20px;
          font-size: 0.72rem; font-weight: 700; letter-spacing: 0.05em;
          text-transform: uppercase;
        }
      `}</style>

      {/* ── Page header ── */}
      <div className="page-header fade-up">
        <div>
          <h1 className="page-title">My Profile</h1>
          <p className="page-subtitle">Manage your personal details and course enrollments.</p>
        </div>
      </div>

      {/* ── Toast ── */}
      {message && (
        <div className={`toast-msg ${message.type === 'success' ? 'toast-success' : 'toast-danger'} fade-up`}>
          <i className={`bi ${message.type === 'success' ? 'bi-check-circle-fill' : 'bi-exclamation-triangle-fill'}`}></i>
          {message.text}
          <button className="toast-close" onClick={() => setMessage(null)}>×</button>
        </div>
      )}

      <div className="row g-4">

        {/* ── LEFT: Profile card + edit form ── */}
        <div className="col-12 col-lg-5 fade-up fade-up-1">
          <div className="profile-card mb-4">
            {/* Cover */}
            <div className="profile-cover"></div>

            {/* Avatar + name row */}
            <div className="profile-body">
              <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: '-44px', marginBottom: '1rem' }}>
                <div className="profile-avatar">
                  {initials(user?.full_name || 'U')}
                  <span className="profile-online"></span>
                </div>
                <div style={{ display: 'flex', gap: '6px', paddingBottom: '4px' }}>
                  <span className="stat-pill" style={{ background: '#f0fdf4', color: '#059669', border: '1px solid #bbf7d0' }}>
                    <i className="bi bi-mortarboard-fill"></i> Student
                  </span>
                </div>
              </div>

              <h4 style={{ fontWeight: 800, color: '#0f2744', marginBottom: '2px', fontSize: '1.15rem' }}>{user?.full_name}</h4>
              <div style={{ fontSize: '0.83rem', color: '#64748b', marginBottom: '1rem' }}>{user?.email}</div>

              {/* Quick info */}
              <div style={{ background: '#f8fafc', borderRadius: '10px', padding: '0.25rem 0', marginBottom: '1.25rem', border: '1px solid #f1f5f9' }}>
                {[
                  { icon: 'bi-building', bg: '#eff6ff', color: '#2563eb', label: 'Department', value: user?.department || '—' },
                  { icon: 'bi-calendar3', bg: '#f0fdf4', color: '#059669', label: 'Member since', value: user?.created_at ? new Date(user.created_at).toLocaleDateString([], { month: 'long', year: 'numeric' }) : '—' },
                  { icon: 'bi-book-fill', bg: '#fffbeb', color: '#d97706', label: 'Enrolled courses', value: `${enrolledCount} active` },
                ].map(f => (
                  <div key={f.label} className="profile-info-field" style={{ paddingLeft: '0.85rem', paddingRight: '0.85rem' }}>
                    <div className="profile-info-icon" style={{ background: f.bg, color: f.color }}>
                      <i className={`bi ${f.icon}`}></i>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{f.label}</div>
                      <div style={{ fontWeight: 600, color: '#1e293b' }}>{f.value}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Edit form */}
              <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '1.25rem' }}>
                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '1rem' }}>
                  Edit Information
                </div>
                <form onSubmit={handleUpdate}>
                  <div className="form-field-ut">
                    <label><i className="bi bi-person" style={{ color: '#2563eb' }}></i> Full Name</label>
                    <input className="input-ut" type="text" value={fullName} onChange={e => setFullName(e.target.value)} required />
                  </div>
                  <div className="form-field-ut">
                    <label><i className="bi bi-envelope" style={{ color: '#2563eb' }}></i> University Email</label>
                    <input className="input-ut" type="email" value={user?.email} disabled />
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Email is managed by the university directory.</span>
                  </div>
                  <div className="form-field-ut">
                    <label><i className="bi bi-building" style={{ color: '#2563eb' }}></i> Department</label>
                    <input className="input-ut" type="text" placeholder="e.g. Computer Science" value={department} onChange={e => setDepartment(e.target.value)} />
                  </div>
                  <div className="form-field-ut" style={{ marginBottom: '1.25rem' }}>
                    <label><i className="bi bi-chat-quote" style={{ color: '#2563eb' }}></i> Bio / Statement</label>
                    <textarea className="input-ut" rows={3} placeholder="Brief academic focus or interests..." value={bio} onChange={e => setBio(e.target.value)} style={{ resize: 'vertical' }}></textarea>
                  </div>
                  <button type="submit" className="save-btn" disabled={saving}>
                    {saving
                      ? <><span style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin-ut 0.6s linear infinite', display: 'inline-block' }}></span>Saving…</>
                      : <><i className="bi bi-check2-circle"></i>Save Profile Changes</>
                    }
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>

        {/* ── RIGHT: Course enrollments ── */}
        <div className="col-12 col-lg-7 fade-up fade-up-2">
          <div className="card-ut h-100">
            <div className="card-ut-header">
              <div className="card-ut-title">
                <i className="bi bi-book-half"></i>
                Course Enrollments
              </div>
              <span style={{ background: '#eff6ff', color: '#2563eb', border: '1px solid rgba(37,99,235,0.2)', borderRadius: '20px', padding: '3px 10px', fontSize: '0.72rem', fontWeight: 700 }}>
                {enrolledCount} Active
              </span>
            </div>

            {courses.length === 0 ? (
              <div className="empty-state">
                <i className="bi bi-journal-x"></i>
                <h5>No courses found</h5>
                <p>Check back later for available courses.</p>
              </div>
            ) : (
              courses.map(course => (
                <div key={course.id} className="course-row">
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '4px' }}>
                      <span className="badge-course">{course.course_code}</span>
                      {course.is_enrolled && (
                        <span style={{ background: '#f0fdf4', color: '#059669', border: '1px solid #bbf7d0', borderRadius: '20px', padding: '1px 8px', fontSize: '0.67rem', fontWeight: 700 }}>
                          <i className="bi bi-check2 me-1"></i>Enrolled
                        </span>
                      )}
                    </div>
                    <div style={{ fontWeight: 700, color: '#0f2744', fontSize: '0.9rem', marginBottom: '3px' }}>{course.course_name}</div>
                    <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                      <i className="bi bi-person me-1"></i>{course.teacher_name}
                      <span style={{ margin: '0 6px', opacity: 0.4 }}>·</span>
                      <i className="bi bi-calendar3 me-1"></i>{course.semester}
                    </div>
                    {course.description && (
                      <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '380px' }}>
                        {course.description}
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '5px', flexShrink: 0 }}>
                    {course.is_enrolled ? (
                      <button className="drop-btn" onClick={() => handleUnenroll(course.id)}>
                        <i className="bi bi-dash-circle me-1"></i>Drop Course
                      </button>
                    ) : (
                      <button className="enroll-btn" onClick={() => handleEnroll(course.id)}>
                        <i className="bi bi-plus-circle me-1"></i>Enroll
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
