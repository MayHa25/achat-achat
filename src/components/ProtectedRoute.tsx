import React from 'react';
import { Navigate } from 'react-router-dom';
import useStore from '../store/useStore';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated } = useStore();

  // For demo purposes, we'll allow access
  // In a real application, we would check if the user is authenticated
  // and redirect to the login page if not
  // return isAuthenticated ? children : <Navigate to="/login" />;
  
  return <>{children}</>;
};

export default ProtectedRoute;