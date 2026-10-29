import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.js';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: ('student' | 'teacher' | 'admin' | 'super_admin')[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100 bg-light">
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading session...</span>
          </div>
          <div className="text-muted mt-2 small">Verifying UniTask credentials...</div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect to user's appropriate default dashboard
    const defaultPath = user.role === 'super_admin' ? '/admin/dashboard' : `/${user.role}/dashboard`;
    return <Navigate to={defaultPath} replace />;
  }

  return <>{children}</>;
};
