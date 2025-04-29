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

  // Check if admin OR has *any* specific booking permission
  const hasAnyBookingPermission = user?.role === 'admin' || 
                                  user?.permissions?.canBookFlights ||
                                  user?.permissions?.canBookHotels ||
                                  user?.permissions?.canBookActivities ||
                                  user?.permissions?.canBookTransfers ||
                                  user?.permissions?.canBookItineraries;

  if (!hasAnyBookingPermission) {
    toast.error('Access denied. Booking privileges required.');
    // Redirect to dashboard or another appropriate page
    return <Navigate to="/dashboard" />;
  }

  // Render child routes if authorized
  return <Outlet />;
};

export default BookingRoute; 