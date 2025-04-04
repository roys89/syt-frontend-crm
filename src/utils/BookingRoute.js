import { useContext } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { toast } from 'react-toastify';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { AuthContext } from '../context/AuthContext';

const BookingRoute = () => {
  const { user, isAuthenticated, loading } = useContext(AuthContext);

  if (loading) {
    return <LoadingSpinner fullScreen />;
  }

  // Must be authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  // Check if admin OR has bookings permission
  const hasBookingPermission = user?.role === 'admin' || user?.permissions?.bookings === true;

  if (!hasBookingPermission) {
    toast.error('Access denied. Booking privileges required.');
    // Redirect to dashboard or another appropriate page
    return <Navigate to="/dashboard" />;
  }

  // Render child routes if authorized
  return <Outlet />;
};

export default BookingRoute; 