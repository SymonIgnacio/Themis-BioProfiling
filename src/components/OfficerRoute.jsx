import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const OfficerRoute = ({ children }) => {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  if (!currentUser) {
    return <Navigate to="/login" />;
  }

  // Debug output
  console.log("OfficerRoute - Current User:", currentUser);
  console.log("OfficerRoute - Role:", currentUser.role);
  console.log("OfficerRoute - Role ID:", currentUser.role_id);
  
  // Check if user is an officer (role_id = 2)
  if (currentUser.role_id !== 2 && currentUser.role !== 'officer') {
    return <Navigate to="/" />;
  }

  return children;
};

export default OfficerRoute;