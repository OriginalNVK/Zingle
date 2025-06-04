import React, { Suspense } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { ROUTE_PATHS } from '../../constants';

interface ProtectedRouteProps {
  allowedRoles?: string[]; // e.g. ['ADMIN', 'USER']
  fallbackPath?: string; // Custom redirect path for unauthorized access
}

const LoadingSpinner = () => (
  <div className="flex justify-center items-center h-screen">
    <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary-500"></div>
  </div>
);

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  allowedRoles, 
  fallbackPath = ROUTE_PATHS.LOGIN 
}) => {
  const { isAuthenticated, currentUser, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!isAuthenticated) {
    return <Navigate to={fallbackPath} replace state={{ from: window.location.pathname }} />;
  }
  
  if (allowedRoles && currentUser && !allowedRoles.includes(currentUser.role)) {
    return <Navigate to={ROUTE_PATHS.CHAT} replace />;
  }

  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Outlet />
    </Suspense>
  );
};

export default ProtectedRoute;
