import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const { currentUser, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('home');

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    } else if (currentUser?.role !== 'admin') {
      navigate('/dashboard');
    }
  }, [isAuthenticated, currentUser, navigate]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!isAuthenticated || !currentUser) {
    return <div className="loading">Redirecting...</div>;
  }

  return (
    <div className="admin-dashboard-container">
      <div className="admin-sidebar">
        <div className="admin-sidebar-header">
          <h2>Admin Panel</h2>
        </div>
        <div className="admin-sidebar-user">
          <div className="user-info">
            <p className="user-name">{currentUser?.full_name || currentUser?.username}</p>
            <p className="user-role">{currentUser?.role}</p>
          </div>
        </div>
        <nav className="admin-sidebar-nav">
          <ul>
            <li className={activeSection === 'home' ? 'active' : ''}>
              <a href="#" onClick={(e) => { e.preventDefault(); setActiveSection('home'); }}>
                <i className='bx bx-grid-alt'></i>
                <span>Dashboard</span>
              </a>
            </li>
            <li className={activeSection === 'biometrics' ? 'active' : ''}>
              <a href="#" onClick={(e) => { e.preventDefault(); setActiveSection('biometrics'); }}>
                <i className='bx bx-fingerprint'></i>
                <span>Biometric Profiles</span>
              </a>
            </li>
            <li className={activeSection === 'users' ? 'active' : ''}>
              <a href="#" onClick={(e) => { e.preventDefault(); setActiveSection('users'); }}>
                <i className='bx bx-group'></i>
                <span>User Management</span>
              </a>
            </li>
            <li className={activeSection === 'config' ? 'active' : ''}>
              <a href="#" onClick={(e) => { e.preventDefault(); setActiveSection('config'); }}>
                <i className='bx bx-cog'></i>
                <span>System Configuration</span>
              </a>
            </li>
            <li className={activeSection === 'logs' ? 'active' : ''}>
              <a href="#" onClick={(e) => { e.preventDefault(); setActiveSection('logs'); }}>
                <i className='bx bx-list-ul'></i>
                <span>Audit Logs</span>
              </a>
            </li>
            <li className={activeSection === 'data' ? 'active' : ''}>
              <a href="#" onClick={(e) => { e.preventDefault(); setActiveSection('data'); }}>
                <i className='bx bx-data'></i>
                <span>Data Management</span>
              </a>
            </li>
            <li>
              <a href="#" onClick={(e) => { e.preventDefault(); navigate('/dashboard'); }}>
                <i className='bx bx-user'></i>
                <span>Switch to User View</span>
              </a>
            </li>
          </ul>
        </nav>
        <div className="admin-sidebar-footer">
          <button className="logout-button" onClick={handleLogout}>
            <i className='bx bx-log-out'></i>
            <span>Logout</span>
          </button>
        </div>
      </div>
      
      <div className="admin-main-content">
        <header className="admin-content-header">
          <h1>
            {activeSection === 'home' && 'Admin Dashboard'}
            {activeSection === 'biometrics' && 'Biometric Profiles'}
            {activeSection === 'users' && 'User Management'}
            {activeSection === 'config' && 'System Configuration'}
            {activeSection === 'logs' && 'Audit Logs'}
            {activeSection === 'data' && 'Data Management'}
          </h1>
        </header>
        
        <div className="admin-content-body">
          {activeSection === 'home' && (
            <div className="welcome-section">
              <h2>Welcome to Admin Panel</h2>
              <p>Select an option from the sidebar to manage the system.</p>
            </div>
          )}
          
          {activeSection === 'biometrics' && (
            <div className="biometrics-section">
              <h2>Biometric Profiles</h2>
              <p>Manage inmate biometric data here.</p>
              {/* Biometrics content will go here */}
            </div>
          )}
          
          {activeSection === 'users' && (
            <div className="users-section">
              <h2>User Management</h2>
              <p>Manage system users and permissions here.</p>
              {/* User management content will go here */}
            </div>
          )}
          
          {activeSection === 'config' && (
            <div className="config-section">
              <h2>System Configuration</h2>
              <p>Configure system settings and parameters here.</p>
              {/* Configuration content will go here */}
            </div>
          )}
          
          {activeSection === 'logs' && (
            <div className="logs-section">
              <h2>Audit Logs</h2>
              <p>View system activity and audit trails here.</p>
              {/* Logs content will go here */}
            </div>
          )}
          
          {activeSection === 'data' && (
            <div className="data-section">
              <h2>Data Management</h2>
              <p>Manage biometric data and records here.</p>
              {/* Data management content will go here */}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;