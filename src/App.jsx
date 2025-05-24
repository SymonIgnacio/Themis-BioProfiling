import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Login from './components/Login/Login'
import Signup from './components/Signup/Signup'
import Dashboard from './components/Dashboard/Dashboard'
import AdminDashboard from './components/AdminPages/AdminDashboard'
import ProtectedRoute from './components/ProtectedRoute'
import AdminRoute from './components/AdminRoute'
import { useAuth } from './context/AuthContext'
import './App.css'

function App() {
  const { isAuthenticated, currentUser } = useAuth();

  // Redirect based on user role
  const getHomePage = () => {
    if (!isAuthenticated) return '/login';
    return currentUser?.role === 'admin' ? '/admin/dashboard' : '/dashboard';
  };

  return (
    <Router>
      <Routes>
        <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to={getHomePage()} />} />
        <Route path="/signup" element={!isAuthenticated ? <Signup /> : <Navigate to={getHomePage()} />} />
        
        {/* Regular user route */}
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } 
        />
        
        {/* Admin routes */}
        <Route 
          path="/admin/dashboard" 
          element={
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          } 
        />
        
        {/* Default redirect */}
        <Route path="/" element={<Navigate to={getHomePage()} />} />
        
        {/* Catch-all redirect */}
        <Route path="*" element={<Navigate to={getHomePage()} />} />
      </Routes>
    </Router>
  )
}

export default App