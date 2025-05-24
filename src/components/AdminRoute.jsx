import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const AdminRoute = ({ children }) => {
  const { isAuthenticated, currentUser, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  if (currentUser?.role_id !== 1) {
    return <Navigate to="/dashboard" />;
  }
  
  return children;
};

export default AdminRoute;