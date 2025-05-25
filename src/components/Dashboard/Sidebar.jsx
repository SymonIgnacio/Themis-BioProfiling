import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Sidebar = ({ activeSection, setActiveSection }) => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h2>Themis BioProfiling</h2>
      </div>
      <div className="sidebar-user">
        <div className="user-info">
          <p className="user-name">{currentUser?.username}</p>
          <p className="user-role">{currentUser?.role_id === 1 ? 'Admin' : 'User'}</p>
        </div>
      </div>
      <nav className="sidebar-nav">
        <ul>
          <li className={activeSection === 'visits' ? 'active' : ''}>
            <a href="#" onClick={(e) => { e.preventDefault(); setActiveSection('visits'); }}>
              <i className='bx bx-calendar-check'></i>
              <span>Visits</span>
            </a>
          </li>
          <li className={activeSection === 'account' ? 'active' : ''}>
            <a href="#" onClick={(e) => { e.preventDefault(); setActiveSection('account'); }}>
              <i className='bx bx-user-circle'></i>
              <span>Account Settings</span>
            </a>
          </li>
          {currentUser?.role_id === 1 && (
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
  );
};

export default Sidebar;