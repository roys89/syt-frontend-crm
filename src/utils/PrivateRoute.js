// src/utils/PrivateRoute.js
import { useContext } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { AuthContext } from '../context/AuthContext';

const PrivateRoute = () => {
  const { isAuthenticated, loading } = useContext(AuthContext);

  if (loading) {
    return <LoadingSpinner fullScreen />;
  }

  return isAuthenticated ? <Outlet /> : <Navigate to="/login" />;
};

export default PrivateRoute;
