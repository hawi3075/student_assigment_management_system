import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { assignmentApi } from '../../services/api.js';

export const StudentAssignmentListPage: React.FC = () => {
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'pending' | 'submitted' | 'graded' | 'overdue'>('all');

  const fetchAssignments = async () => {
    setLoading(true);
    try {
      const res = await assignmentApi.getAll({
        search: search || undefined,
        filter: filter === 'all' ? undefined : filter
      });
      setAssignments(res.data.assignments || []);
    } catch (err) {
      console.error('Failed to load assignments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, [filter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchAssignments();
  };

  return (
    <div>
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
        <div>
          <h2 className="fw-bold text-dark mb-1">Coursework & Assignments</h2>
          <p className="text-muted mb-0">Browse and submit assignments across your enrolled university courses.</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="card card-unitask mb-4 p-3">
        <div className="row g-3 align-items-center">
          <div className="col-12 col-md-6">
            <form onSubmit={handleSearchSubmit} className="input-group">
              <span className="input-group-text bg-white border-end-0 text-muted">
                <i className="bi bi-search"></i>
              </span>
              <input
                type="text"
                className="form-control border-start-0 ps-0"
                placeholder="Search by title, course code (e.g. CS202), or course..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              <button className="btn btn-unitask-primary" type="submit">Search</button>
            </form>
          </div>

          <div className="col-12 col-md-6">
            <div className="d-flex flex-wrap gap-2 justify-content-md-end">
              {(['all', 'pending', 'submitted', 'graded', 'overdue'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setFilter(tab)}
                  className={`btn btn-sm text-capitalize ${filter === tab ? 'btn-dark' : 'btn-outline-secondary'}`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Assignment List */}
      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status"></div>
        </div>
      ) : assignments.length === 0 ? (
        <div className="card card-unitask">
          <div className="empty-state">
            <i className="bi bi-folder2-open"></i>
            <h5>No assignments found</h5>
            <p className="text-muted small">No assignments match your current search query or active filter.</p>
            {filter !== 'all' && (
              <button onClick={() => setFilter('all')} className="btn btn-sm btn-outline-primary">
                Reset Filter
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="d-flex flex-column gap-3">
          {assignments.map(a => {
            const dueDate = new Date(a.due_at);
            const isPast = dueDate.getTime() < Date.now();

            let statusBadge = <span className="badge bg-warning-subtle text-warning border badge-status"><i className="bi bi-clock"></i> Pending</span>;
            if (a.my_submission_status === 'graded') {
              statusBadge = <span className="badge bg-success-subtle text-success border badge-status"><i className="bi bi-check2-all"></i> Graded ({a.my_marks ?? 0}/{a.max_marks})</span>;
            } else if (a.my_submission_status === 'submitted' || a.my_submission_status === 'resubmitted') {
              statusBadge = <span className="badge bg-info-subtle text-info border badge-status"><i className="bi bi-file-earmark-check"></i> Submitted</span>;
            } else if (isPast) {
              statusBadge = <span className="badge bg-danger-subtle text-danger border badge-status"><i className="bi bi-exclamation-triangle"></i> Overdue</span>;
            }

            // Choose image asset based on course
            const courseCover = a.course_code?.includes('202')
              ? '/src/assets/images/course_algorithms.jpg'
              : a.course_code?.includes('301')
              ? '/src/assets/images/course_database.jpg'
              : '/src/assets/images/campus_hero.jpg';

            return (
              <div key={a.id} className="card card-unitask p-0 overflow-hidden shadow-sm">
                <div className="row g-0">
                  <div className="col-12 col-md-3 col-lg-2 d-none d-md-block position-relative">
                    <img
                      src={courseCover}
                      alt={a.course_name}
                      className="w-100 h-100 object-fit-cover"
                      style={{ minHeight: '140px', objectFit: 'cover' }}
                    />
                    <div className="position-absolute top-0 start-0 m-2">
                      <span className="badge bg-dark bg-opacity-75 text-white border border-light border-opacity-25 small">
                        {a.course_code}
                      </span>
                    </div>
                  </div>

                  <div className="col-12 col-md-9 col-lg-10 p-4">
                    <div className="d-flex flex-column flex-lg-row justify-content-between align-items-start gap-3">
                      <div className="flex-grow-1">
                        <div className="d-flex flex-wrap align-items-center gap-2 mb-2">
                          <span className="badge bg-primary text-white fw-bold d-md-none">{a.course_code}</span>
                          <span className="text-muted small fw-medium">{a.course_name}</span>
                          <span className="text-muted small">&bull;</span>
                          <span className="text-muted small">Instructor: {a.teacher_name}</span>
                        </div>

                        <h5 className="fw-bold text-dark mb-2">
                          <Link to={`/student/assignments/${a.id}`} className="text-decoration-none text-dark">
                            {a.title}
                          </Link>
                        </h5>

                        <p className="text-muted small mb-3 text-truncate" style={{ maxWidth: '750px' }}>
                          {a.description}
                        </p>

                        <div className="d-flex flex-wrap align-items-center gap-3 text-muted small">
                          <span><i className="bi bi-award me-1"></i>Max Marks: <strong>{a.max_marks}</strong></span>
                          <span>
                            <i className="bi bi-calendar3 me-1"></i>Due: <strong>{dueDate.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })} at {dueDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</strong>
                          </span>
                          {a.allow_late_submission ? (
                            <span className="text-success"><i className="bi bi-check-circle me-1"></i>Late Allowed</span>
                          ) : (
                            <span className="text-secondary"><i className="bi bi-x-circle me-1"></i>Strict Deadline</span>
                          )}
                          {a.attachment_count > 0 && (
                            <span><i className="bi bi-paperclip me-1"></i>{a.attachment_count} attachment(s)</span>
                          )}
                        </div>
                      </div>

                      <div className="text-lg-end d-flex flex-row flex-lg-column justify-content-between align-items-end gap-2 w-100 w-lg-auto mt-2 mt-lg-0">
                        <div>{statusBadge}</div>
                        <div className="d-flex gap-2">
                          <Link to={`/student/assignments/${a.id}`} className="btn btn-sm btn-unitask-outline">
                            Details
                          </Link>
                          <Link to={`/student/assignments/${a.id}/submit`} className="btn btn-sm btn-unitask-primary">
                            {a.my_submission_status ? 'Update' : 'Submit'}
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
