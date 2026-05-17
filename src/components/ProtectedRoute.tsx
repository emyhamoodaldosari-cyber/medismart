import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../types';

interface ProtectedRouteProps {
  allowedRoles: UserRole[];
}

/**
 * ProtectedRoute component
 * 
 * Enforces strict role-based access control:
 * - Unauthenticated users are redirected to /login
 * - Users without the required role are redirected to their role-specific dashboard
 * - Only users with allowed roles can access the route
 */
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles }) => {
  const { user, profile, loading } = useAuth();
  const location = useLocation();

  // Show loading state while auth is being checked
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-12 h-12 border-4 border-[#099aa7] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Not authenticated - redirect to login
  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // Profile not loaded - shouldn't happen but handle gracefully
  if (!profile) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // User role not in allowed roles - redirect to appropriate dashboard
  if (!allowedRoles.includes(profile.role)) {
    // Redirect based on user's actual role
    if (profile.role === 'admin') {
      return <Navigate to="/admin/dashboard" replace />;
    } else if (profile.role === 'pharmacist') {
      return <Navigate to="/pharmacist/dashboard" replace />;
    } else {
      // customer
      return <Navigate to="/" replace />;
    }
  }

  // User has required role - allow access
  return <Outlet />;
};

export default ProtectedRoute;
