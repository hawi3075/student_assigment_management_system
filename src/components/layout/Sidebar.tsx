import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.js';

interface SidebarProps {
  isOpen: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  if (!user) return null;

  return (
    <aside
      className={`unitask-sidebar ${isOpen ? 'd-block' : 'd-none d-lg-block'}`}
      style={{
        zIndex: 1040,
        position: isOpen ? 'fixed' : 'relative',
        top: isOpen ? '57px' : '0',
        left: 0,
        height: isOpen ? 'calc(100vh - 57px)' : 'auto',
        overflowY: 'auto'
      }}
    >
      <div className="d-flex justify-content-between align-items-center mb-3 px-2 d-lg-none">
        <span className="fw-bold text-muted small text-uppercase">Navigation Menu</span>
        <button className="btn btn-sm btn-outline-secondary" onClick={onClose}>
          <i className="bi bi-x-lg"></i>
        </button>
      </div>

      {/* STUDENT NAVIGATION */}
      {user.role === 'student' && (
        <>
          <div className="text-uppercase small text-muted fw-bold px-3 mb-2" style={{ fontSize: '0.72rem' }}>
            Academic Portal
          </div>
          <NavLink
            to="/student/dashboard"
            onClick={onClose}
            className={({ isActive }) => `unitask-nav-link ${isActive ? 'active' : ''}`}
          >
            <i className="bi bi-grid-1x2"></i> Dashboard
          </NavLink>
          <NavLink
            to="/student/assignments"
            onClick={onClose}
            className={({ isActive }) => `unitask-nav-link ${isActive ? 'active' : ''}`}
          >
            <i className="bi bi-journal-text"></i> Assignment List
          </NavLink>
          <NavLink
            to="/student/submissions"
            onClick={onClose}
            className={({ isActive }) => `unitask-nav-link ${isActive ? 'active' : ''}`}
          >
            <i className="bi bi-file-earmark-check"></i> My Submissions
          </NavLink>
          <NavLink
            to="/student/grades"
            onClick={onClose}
            className={({ isActive }) => `unitask-nav-link ${isActive ? 'active' : ''}`}
          >
            <i className="bi bi-award"></i> Grades & Feedback
          </NavLink>
          <NavLink
            to="/student/profile"
            onClick={onClose}
            className={({ isActive }) => `unitask-nav-link ${isActive ? 'active' : ''}`}
          >
            <i className="bi bi-person-badge"></i> Student Profile
          </NavLink>
        </>
      )}

      {/* TEACHER NAVIGATION */}
      {user.role === 'teacher' && (
        <>
          <div className="text-uppercase small text-muted fw-bold px-3 mb-2" style={{ fontSize: '0.72rem' }}>
            Faculty Portal
          </div>
          <NavLink
            to="/teacher/dashboard"
            onClick={onClose}
            className={({ isActive }) => `unitask-nav-link ${isActive ? 'active' : ''}`}
          >
            <i className="bi bi-speedometer2"></i> Dashboard
          </NavLink>
          <NavLink
            to="/teacher/courses"
            onClick={onClose}
            className={({ isActive }) => `unitask-nav-link ${isActive ? 'active' : ''}`}
          >
            <i className="bi bi-book"></i> My Courses
          </NavLink>
          <NavLink
            to="/teacher/assignments"
            end
            onClick={onClose}
            className={({ isActive }) => `unitask-nav-link ${isActive ? 'active' : ''}`}
          >
            <i className="bi bi-folder2-open"></i> Assignments
          </NavLink>
          <NavLink
            to="/teacher/assignments/create"
            onClick={onClose}
            className={({ isActive }) => `unitask-nav-link ${isActive ? 'active' : ''}`}
          >
            <i className="bi bi-plus-circle"></i> Create Assignment
          </NavLink>
          <NavLink
            to="/teacher/profile"
            onClick={onClose}
            className={({ isActive }) => `unitask-nav-link ${isActive ? 'active' : ''}`}
          >
            <i className="bi bi-person-lines-fill"></i> Faculty Profile
          </NavLink>
        </>
      )}

      {/* ADMIN & SUPER ADMIN NAVIGATION */}
      {(user.role === 'admin' || user.role === 'super_admin') && (
        <>
          <div className="text-uppercase small text-muted fw-bold px-3 mb-2" style={{ fontSize: '0.72rem' }}>
            {user.role === 'super_admin' ? 'Super Administration' : 'System Administration'}
          </div>
          <NavLink
            to="/admin/dashboard"
            onClick={onClose}
            className={({ isActive }) => `unitask-nav-link ${isActive ? 'active' : ''}`}
          >
            <i className="bi bi-speedometer"></i> Overview Dashboard
          </NavLink>
          <NavLink
            to="/admin/users"
            onClick={onClose}
            className={({ isActive }) => `unitask-nav-link ${isActive ? 'active' : ''}`}
          >
            <i className="bi bi-people"></i> User Management
          </NavLink>
          <NavLink
            to="/admin/courses"
            onClick={onClose}
            className={({ isActive }) => `unitask-nav-link ${isActive ? 'active' : ''}`}
          >
            <i className="bi bi-collection"></i> Course Management
          </NavLink>
          <NavLink
            to="/admin/activity"
            onClick={onClose}
            className={({ isActive }) => `unitask-nav-link ${isActive ? 'active' : ''}`}
          >
            <i className="bi bi-shield-check"></i> Security & Audit Logs
          </NavLink>
        </>
      )}
    </aside>
  );
};
