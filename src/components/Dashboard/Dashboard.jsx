import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Dashboard.css';

const Dashboard = () => {
  const { currentUser, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('home');

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!isAuthenticated) {
    return <div className="loading">Redirecting...</div>;
  }

  return (
    <div className="dashboard-container">
      <div className="sidebar">
        <div className="sidebar-header">
          <h2>Themis BioProfiling</h2>
        </div>
        <div className="sidebar-user">
          <div className="user-info">
            <p className="user-name">{currentUser?.full_name || currentUser?.username}</p>
            <p className="user-role">{currentUser?.role}</p>
          </div>
        </div>
        <nav className="sidebar-nav">
          <ul>
            <li className={activeSection === 'home' ? 'active' : ''}>
              <a href="#" onClick={(e) => { e.preventDefault(); setActiveSection('home'); }}>
                <i className='bx bx-home-alt'></i>
                <span>Dashboard</span>
              </a>
            </li>
            <li className={activeSection === 'reports' ? 'active' : ''}>
              <a href="#" onClick={(e) => { e.preventDefault(); setActiveSection('reports'); }}>
                <i className='bx bx-bar-chart-alt-2'></i>
                <span>Reports</span>
              </a>
            </li>
            <li className={activeSection === 'settings' ? 'active' : ''}>
              <a href="#" onClick={(e) => { e.preventDefault(); setActiveSection('settings'); }}>
                <i className='bx bx-cog'></i>
                <span>Settings</span>
              </a>
            </li>
            {currentUser?.role === 'admin' && (
              <li>
                <a href="#" onClick={(e) => { e.preventDefault(); navigate('/admin/dashboard'); }}>
                  <i className='bx bx-shield-quarter'></i>
                  <span>Admin Panel</span>
                </a>
              </li>
            )}
          </ul>
        </nav>
        <div className="sidebar-footer">
          <button className="logout-button" onClick={handleLogout}>
            <i className='bx bx-log-out'></i>
            <span>Logout</span>
          </button>
        </div>
      </div>
      
      <div className="main-content">
        <header className="content-header">
          <h1>
            {activeSection === 'home' && 'Dashboard'}
            {activeSection === 'reports' && 'Reports'}
            {activeSection === 'settings' && 'Settings'}
          </h1>
        </header>
        
        <div className="content-body">
          {activeSection === 'home' && (
            <div className="welcome-section">
              <h2>Welcome to Themis BioProfiling System</h2>
              <p>Select an option from the sidebar to get started.</p>
            </div>
          )}
          
          {activeSection === 'reports' && (
            <div className="reports-section">
              <h2>Reports</h2>
              <p>Generate and view reports here.</p>
              {/* Reports content will go here */}
            </div>
          )}
          
          {activeSection === 'settings' && (
            <div className="settings-section">
              <h2>Settings</h2>
              <p>Configure system settings here.</p>
              {/* Settings content will go here */}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;