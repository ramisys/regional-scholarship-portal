import React from 'react';
import { Navigate } from 'react-router';
import { useAuth } from '../contexts/AuthContext';

export const Home: React.FC = () => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role === 'coordinator') {
    return <Navigate to="/coordinator/dashboard" replace />;
  }

  return <Navigate to="/student/dashboard" replace />;
};
