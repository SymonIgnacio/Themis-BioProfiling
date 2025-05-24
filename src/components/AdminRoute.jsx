import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const AdminRoute = ({ children }) => {
  const { isAuthenticated, currentUser, loading } = useAuth();

  // Debug output
  console.log("AdminRoute - Current User:", currentUser);
  console.log("AdminRoute - Is Authenticated:", isAuthenticated);
  console.log("AdminRoute - Role ID:", currentUser?.role_id);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  // Re-enable role check to properly protect admin routes
  if (currentUser?.role_id !== 1) {
    return <Navigate to="/dashboard" />;
  }
  
  return children;
};

export default AdminRoute;