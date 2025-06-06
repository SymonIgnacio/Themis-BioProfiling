import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Login from './components/Login/Login'
import Signup from './components/Signup/Signup'
import Dashboard from './components/Dashboard/Dashboard'
import AdminDashboard from './components/AdminPages/AdminDashboard'
import OfficerDashboard from './components/OfficerPages/OfficerDashboard'
import PUPCList from './components/PUPCList'
import AddPUCForm from './components/AddPUCForm'
import VisitorList from './components/VisitorList'
import VisitorLogList from './components/VisitorLogList'
import BlacklistManagement from './components/BlacklistManagement'
import ProtectedRoute from './components/ProtectedRoute'
import AdminRoute from './components/AdminRoute'
import OfficerRoute from './components/OfficerRoute'
import { useAuth } from './context/AuthContext'
import './App.css'

function App() {
  const { isAuthenticated, currentUser } = useAuth();

  // Redirect based on user role
  const getHomePage = () => {
    if (!isAuthenticated) return '/login';
    
    // Check for role string first (from our mapping in AuthContext)
    if (currentUser?.role === 'admin') return '/admin/dashboard';
    if (currentUser?.role === 'officer') return '/officer/dashboard';
    if (currentUser?.role === 'visitor') return '/dashboard';
    
    // Fallback to role_id if role string is not available
    if (currentUser?.role_id === 1) return '/admin/dashboard';
    if (currentUser?.role_id === 2) return '/officer/dashboard';
    if (currentUser?.role_id === 3) return '/dashboard';
    
    return '/login';
  };

  return (
    <Router>
      <Routes>
        <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to={getHomePage()} />} />
        <Route path="/signup" element={!isAuthenticated ? <Signup /> : <Navigate to={getHomePage()} />} />
        
        {/* Regular user routes */}
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } 
        />
        
        {/* PUPC Management */}
        <Route 
          path="/pupcs" 
          element={
            <ProtectedRoute>
              <PUPCList />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/pupcs/new" 
          element={
            <ProtectedRoute>
              <AddPUCForm />
            </ProtectedRoute>
          } 
        />
        
        {/* Visitor Management */}
        <Route 
          path="/visitors" 
          element={
            <ProtectedRoute>
              <VisitorList />
            </ProtectedRoute>
          } 
        />
        
        {/* Visitor Logs */}
        <Route 
          path="/visitor-logs" 
          element={
            <ProtectedRoute>
              <VisitorLogList />
            </ProtectedRoute>
          } 
        />
        
        {/* Blacklist Management */}
        <Route 
          path="/blacklist" 
          element={
            <ProtectedRoute>
              <BlacklistManagement />
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
        
        {/* Officer routes */}
        <Route 
          path="/officer/dashboard" 
          element={
            <OfficerRoute>
              <OfficerDashboard />
            </OfficerRoute>
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