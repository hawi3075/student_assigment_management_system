import React, { useState, useEffect } from 'react';
import { gradeApi } from '../../services/api.js';

export const StudentGradesPage: React.FC = () => {
  const [data, setData] = useState<{ stats: any; grades: any[] }>({ stats: null, grades: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await gradeApi.getMyGrades();
        setData(res.data);
      } catch (err) {
        console.error('Failed to load grades:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const stats = data.stats;
  const grades = data.grades;

  return (
    <div>
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
        <div>
          <h2 className="fw-bold text-dark mb-1">Academic Performance & Grades</h2>
          <p className="text-muted mb-0">Official published coursework marks and written faculty evaluations.</p>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status"></div>
        </div>
      ) : (
        <>
          {/* Performance Summary Cards */}
          <div className="row g-3 mb-4">
            <div className="col-12 col-sm-6 col-lg-3">
              <div className="stat-card">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <div className="stat-label">Graded Items</div>
                    <div className="stat-number">{stats ? stats.total_graded : 0}</div>
                  </div>
                  <div className="stat-icon bg-primary-subtle text-primary">
                    <i className="bi bi-file-earmark-check"></i>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-12 col-sm-6 col-lg-3">
              <div className="stat-card">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <div className="stat-label">Points Earned</div>
                    <div className="stat-number text-primary">{stats ? stats.total_earned : 0}</div>
                  </div>
                  <div className="stat-icon bg-info-subtle text-info">
                    <i className="bi bi-star-fill"></i>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-12 col-sm-6 col-lg-3">
              <div className="stat-card">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <div className="stat-label">Points Possible</div>
                    <div className="stat-number text-secondary">{stats ? stats.total_possible : 0}</div>
                  </div>
                  <div className="stat-icon bg-light text-secondary border">
                    <i className="bi bi-calculator"></i>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-12 col-sm-6 col-lg-3">
              <div className="stat-card">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <div className="stat-label">Cumulative Average</div>
                    <div className="stat-number text-success">
                      {stats ? `${stats.average_percentage}%` : '0%'}
                    </div>
                  </div>
                  <div className="stat-icon bg-success-subtle text-success">
                    <i className="bi bi-trophy"></i>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Grades Table */}
          {grades.length === 0 ? (
            <div className="card card-unitask">
              <div className="empty-state">
                <i className="bi bi-award"></i>
                <h5>No Published Grades Yet</h5>
                <p className="text-muted small">
                  Your instructors have not published grades for your submitted coursework yet. Check back soon.
                </p>
              </div>
            </div>
          ) : (
            <div className="card card-unitask border-0 shadow-sm overflow-hidden">
              <div className="table-responsive">
                <table className="table table-unitask align-middle">
                  <thead>
                    <tr>
                      <th>Course & Title</th>
                      <th>Instructor</th>
                      <th>Marks Earned</th>
                      <th>Percentage</th>
                      <th>Written Feedback</th>
                      <th>Published On</th>
                    </tr>
                  </thead>
                  <tbody>
                    {grades.map(g => {
                      const percentage = Math.round((parseFloat(g.marks_obtained) / parseFloat(g.max_marks)) * 100);
                      const isPassing = percentage >= 60;

                      return (
                        <tr key={g.grade_id}>
                          <td>
                            <div className="d-flex align-items-center gap-2 mb-1">
                              <span className="badge bg-primary text-white">{g.course_code}</span>
                              <span className="text-muted small">{g.course_name}</span>
                            </div>
                            <div className="fw-bold text-dark">{g.assignment_title}</div>
                          </td>
                          <td className="small text-muted">{g.teacher_name}</td>
                          <td>
                            <div className="fs-6 fw-bold text-dark">
                              {g.marks_obtained} <span className="text-muted small">/ {g.max_marks}</span>
                            </div>
                          </td>
                          <td>
                            <span className={`badge ${isPassing ? 'bg-success-subtle text-success border' : 'bg-danger-subtle text-danger border'} fw-bold`}>
                              {percentage}%
                            </span>
                          </td>
                          <td style={{ maxWidth: '300px' }}>
                            {g.feedback ? (
                              <div className="p-2 bg-light rounded border small fst-italic">
                                "{g.feedback}"
                              </div>
                            ) : (
                              <span className="text-muted small">No written feedback provided</span>
                            )}
                          </td>
                          <td className="small text-muted">
                            {new Date(g.published_at).toLocaleDateString()}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
