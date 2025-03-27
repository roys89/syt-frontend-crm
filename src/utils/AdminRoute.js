// src/utils/AdminRoute.js
import { useContext } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { toast } from 'react-toastify';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { AuthContext } from '../context/AuthContext';

const AdminRoute = () => {
  const { user, isAuthenticated, loading } = useContext(AuthContext);

  if (loading) {
    return <LoadingSpinner fullScreen />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  if (user?.role !== 'admin') {
    toast.error('Access denied. Admin privileges required.');
    return <Navigate to="/dashboard" />;
  }

  return <Outlet />;
};

export default AdminRoute;