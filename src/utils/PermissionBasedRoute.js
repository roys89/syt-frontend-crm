import { useContext } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { toast } from 'react-toastify';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { AuthContext } from '../context/AuthContext';

/**
 * A route guard that checks if the authenticated user has a specific permission.
 * @param {{ permissionKey: string }} props - The props object.
 * @param {string} props.permissionKey - The specific permission key to check (e.g., 'canBookItineraries').
 */
const PermissionBasedRoute = ({ permissionKey }) => {
  const { user, isAuthenticated, loading } = useContext(AuthContext);

  if (loading) {
    return <LoadingSpinner fullScreen />;
  }

  // Must be authenticated
  if (!isAuthenticated) {
    // Optionally preserve the intended location: state={{ from: location }}
    return <Navigate to="/login" />;
  }

  // Check if admin OR has the specific permission required by the route
  const hasSpecificPermission = user?.role === 'admin' || (user?.permissions && user.permissions[permissionKey] === true);

  if (!hasSpecificPermission) {
    console.warn(`PermissionBasedRoute: Access denied. User lacks required permission: '${permissionKey}'. User permissions:`, user?.permissions);
    toast.error(`Access denied. Required permission missing: ${permissionKey}`);
    // Redirect to dashboard or another appropriate page
    return <Navigate to="/dashboard" />;
  }

  // Render child routes if authorized
  return <Outlet />;
};

export default PermissionBasedRoute; 