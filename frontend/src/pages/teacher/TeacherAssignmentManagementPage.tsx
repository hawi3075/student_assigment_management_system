import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { assignmentApi } from '../../services/api.js';

export const TeacherAssignmentManagementPage: React.FC = () => {
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [search, setSearch] = useState('');

  const loadAssignments = async () => {
    setLoading(true);
    try {
      const res = await assignmentApi.getAll({
        status: statusFilter === 'all' ? undefined : statusFilter,
        search: search || undefined
      });
      setAssignments(res.data.assignments || []);
    } catch (err) {
      console.error('Failed to load assignments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAssignments();
  }, [statusFilter]);

  const handleDelete = async (id: number, title: string) => {
    if (!window.confirm(`Are you sure you want to permanently delete assignment "${title}"?`)) return;

    try {
      await assignmentApi.delete(id);
      await loadAssignments();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to delete assignment.');
    }
  };

  return (
    <div>
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
        <div>
          <h2 className="fw-bold text-dark mb-1">Assignment Management</h2>
          <p className="text-muted mb-0">Create, publish, edit deadlines, and manage submissions across all courses.</p>
        </div>
        <Link to="/teacher/assignments/create" className="btn btn-unitask-primary d-inline-flex align-items-center gap-2">
          <i className="bi bi-plus-circle"></i> Create New Assignment
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div className="card card-unitask mb-4 p-3">
        <div className="row g-3 align-items-center">
          <div className="col-12 col-md-6">
            <form onSubmit={(e) => { e.preventDefault(); loadAssignments(); }} className="input-group">
              <span className="input-group-text bg-white border-end-0 text-muted">
                <i className="bi bi-search"></i>
              </span>
              <input
                type="text"
                className="form-control border-start-0 ps-0"
                placeholder="Search assignments by title or course..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              <button className="btn btn-unitask-primary" type="submit">Search</button>
            </form>
          </div>

          <div className="col-12 col-md-6">
            <div className="d-flex flex-wrap gap-2 justify-content-md-end">
              {(['all', 'published', 'draft', 'completed'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setStatusFilter(tab)}
                  className={`btn btn-sm text-capitalize ${statusFilter === tab ? 'btn-dark' : 'btn-outline-secondary'}`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Table of Assignments */}
      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status"></div>
        </div>
      ) : assignments.length === 0 ? (
        <div className="card card-unitask">
          <div className="empty-state">
            <i className="bi bi-journal-x"></i>
            <h5>No assignments found</h5>
            <p className="text-muted small">No assignments match your active filters.</p>
            <Link to="/teacher/assignments/create" className="btn btn-sm btn-unitask-primary">
              Create Assignment
            </Link>
          </div>
        </div>
      ) : (
        <div className="card card-unitask border-0 shadow-sm overflow-hidden">
          <div className="table-responsive">
            <table className="table table-unitask align-middle">
              <thead>
                <tr>
                  <th>Course & Title</th>
                  <th>Status</th>
                  <th>Maximum Marks</th>
                  <th>Deadline</th>
                  <th>Submissions</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {assignments.map(a => {
                  const dueDate = new Date(a.due_at);
                  const isPast = dueDate.getTime() < Date.now();

                  return (
                    <tr key={a.id}>
                      <td>
                        <div className="d-flex align-items-center gap-2 mb-1">
                          <span className="badge bg-primary text-white">{a.course_code}</span>
                          <span className="text-muted small">{a.course_name}</span>
                        </div>
                        <div className="fw-bold text-dark">{a.title}</div>
                      </td>
                      <td>
                        {a.status === 'published' ? (
                          <span className="badge bg-success-subtle text-success border">Published</span>
                        ) : (
                          <span className="badge bg-secondary-subtle text-secondary border">Draft</span>
                        )}
                        {a.allow_late_submission && (
                          <span className="badge bg-light text-muted border ms-1 small">Late OK</span>
                        )}
                      </td>
                      <td className="fw-semibold text-dark">
                        {a.max_marks} pts
                      </td>
                      <td>
                        <div className={`small fw-semibold ${isPast ? 'text-danger' : 'text-dark'}`}>
                          {dueDate.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                        </div>
                        <div className="text-muted small">{dueDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                        {isPast && <span className="badge bg-danger-subtle text-danger border small">Passed</span>}
                      </td>
                      <td>
                        <Link
                          to={`/teacher/assignments/${a.id}/submissions`}
                          className="btn btn-sm btn-light border d-inline-flex align-items-center gap-1 text-primary fw-semibold"
                        >
                          <i className="bi bi-inbox"></i>
                          <span>{a.submission_count || 0} Submissions</span>
                        </Link>
                      </td>
                      <td className="text-end">
                        <div className="btn-group btn-group-sm">
                          <Link
                            to={`/teacher/assignments/${a.id}/submissions`}
                            className="btn btn-unitask-primary"
                            title="Review Submissions"
                          >
                            Grade
                          </Link>
                          <Link
                            to={`/teacher/assignments/${a.id}/edit`}
                            className="btn btn-outline-secondary"
                            title="Edit Assignment"
                          >
                            <i className="bi bi-pencil"></i>
                          </Link>
                          <button
                            onClick={() => handleDelete(a.id, a.title)}
                            className="btn btn-outline-danger"
                            title="Delete Assignment"
                          >
                            <i className="bi bi-trash"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
