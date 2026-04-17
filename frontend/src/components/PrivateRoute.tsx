// Защита маршрутов, требующих авторизации.

import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface PrivateRouteProps {
  children: React.ReactNode;
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="loader">Проверка авторизации...</div>;
  }

  return user ? <>{children}</> : <Navigate to="/login" replace />;
};

export default PrivateRoute;
