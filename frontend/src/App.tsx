import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.js';
import { MainLayout } from './components/layout/MainLayout.js';
import { ProtectedRoute } from './components/layout/ProtectedRoute.js';

// Public Pages
import { LoginPage } from './pages/auth/LoginPage.js';
import { RegisterPage } from './pages/auth/RegisterPage.js';
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage.js';

// Student Pages
import { StudentDashboardPage } from './pages/student/StudentDashboardPage.js';
import { StudentAssignmentListPage } from './pages/student/StudentAssignmentListPage.js';
import { StudentAssignmentDetailsPage } from './pages/student/StudentAssignmentDetailsPage.js';
import { StudentSubmitAssignmentPage } from './pages/student/StudentSubmitAssignmentPage.js';
import { StudentMySubmissionsPage } from './pages/student/StudentMySubmissionsPage.js';
import { StudentGradesPage } from './pages/student/StudentGradesPage.js';
import { StudentProfilePage } from './pages/student/StudentProfilePage.js';

// Teacher Pages
import { TeacherDashboardPage } from './pages/teacher/TeacherDashboardPage.js';
import { TeacherCoursesPage } from './pages/teacher/TeacherCoursesPage.js';
import { TeacherAssignmentManagementPage } from './pages/teacher/TeacherAssignmentManagementPage.js';
import { TeacherCreateAssignmentPage } from './pages/teacher/TeacherCreateAssignmentPage.js';
import { TeacherEditAssignmentPage } from './pages/teacher/TeacherEditAssignmentPage.js';
import { TeacherAssignmentSubmissionsPage } from './pages/teacher/TeacherAssignmentSubmissionsPage.js';
import { TeacherGradeSubmissionPage } from './pages/teacher/TeacherGradeSubmissionPage.js';
import { TeacherProfilePage } from './pages/teacher/TeacherProfilePage.js';

// Admin Pages
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage.js';
import { AdminUserManagementPage } from './pages/admin/AdminUserManagementPage.js';
import { AdminCourseManagementPage } from './pages/admin/AdminCourseManagementPage.js';
import { AdminActivityPage } from './pages/admin/AdminActivityPage.js';

// Root redirect handler based on authenticated user's role
const RootRedirect: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100 bg-light">
        <div className="spinner-border text-primary" role="status"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role === 'admin' || user.role === 'super_admin') return <Navigate to="/admin/dashboard" replace />;
  if (user.role === 'teacher') return <Navigate to="/teacher/dashboard" replace />;
  return <Navigate to="/student/dashboard" replace />;
};

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />

          {/* Root Redirect */}
          <Route path="/" element={<RootRedirect />} />

          {/* Authenticated Layout */}
          <Route element={<MainLayout />}>
            {/* Student Pages */}
            <Route
              path="/student/dashboard"
              element={
                <ProtectedRoute allowedRoles={['student']}>
                  <StudentDashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/assignments"
              element={
                <ProtectedRoute allowedRoles={['student']}>
                  <StudentAssignmentListPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/assignments/:id"
              element={
                <ProtectedRoute allowedRoles={['student']}>
                  <StudentAssignmentDetailsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/assignments/:id/submit"
              element={
                <ProtectedRoute allowedRoles={['student']}>
                  <StudentSubmitAssignmentPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/submissions"
              element={
                <ProtectedRoute allowedRoles={['student']}>
                  <StudentMySubmissionsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/grades"
              element={
                <ProtectedRoute allowedRoles={['student']}>
                  <StudentGradesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/profile"
              element={
                <ProtectedRoute allowedRoles={['student']}>
                  <StudentProfilePage />
                </ProtectedRoute>
              }
            />

            {/* Teacher Pages */}
            <Route
              path="/teacher/dashboard"
              element={
                <ProtectedRoute allowedRoles={['teacher', 'admin', 'super_admin']}>
                  <TeacherDashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/teacher/courses"
              element={
                <ProtectedRoute allowedRoles={['teacher', 'admin', 'super_admin']}>
                  <TeacherCoursesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/teacher/assignments"
              element={
                <ProtectedRoute allowedRoles={['teacher', 'admin', 'super_admin']}>
                  <TeacherAssignmentManagementPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/teacher/assignments/create"
              element={
                <ProtectedRoute allowedRoles={['teacher', 'admin', 'super_admin']}>
                  <TeacherCreateAssignmentPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/teacher/assignments/:id/edit"
              element={
                <ProtectedRoute allowedRoles={['teacher', 'admin', 'super_admin']}>
                  <TeacherEditAssignmentPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/teacher/assignments/:id/submissions"
              element={
                <ProtectedRoute allowedRoles={['teacher', 'admin', 'super_admin']}>
                  <TeacherAssignmentSubmissionsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/teacher/submissions/:id/grade"
              element={
                <ProtectedRoute allowedRoles={['teacher', 'admin', 'super_admin']}>
                  <TeacherGradeSubmissionPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/teacher/profile"
              element={
                <ProtectedRoute allowedRoles={['teacher', 'admin', 'super_admin']}>
                  <TeacherProfilePage />
                </ProtectedRoute>
              }
            />

            {/* Admin Pages */}
            <Route
              path="/admin/dashboard"
              element={
                <ProtectedRoute allowedRoles={['admin', 'super_admin']}>
                  <AdminDashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/users"
              element={
                <ProtectedRoute allowedRoles={['admin', 'super_admin']}>
                  <AdminUserManagementPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/courses"
              element={
                <ProtectedRoute allowedRoles={['admin', 'super_admin']}>
                  <AdminCourseManagementPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/activity"
              element={
                <ProtectedRoute allowedRoles={['admin', 'super_admin']}>
                  <AdminActivityPage />
                </ProtectedRoute>
              }
            />

            {/* Admin Pages */}
          </Route>

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
