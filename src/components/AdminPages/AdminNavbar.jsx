import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useState } from 'react';
import './AdminDashboard.css';

const AdminNavbar = ({ activeSection, setActiveSection }) => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const toggleSidebar = () => {
    setExpanded(!expanded);
  };
  
  const handleNavClick = (section) => {
    setActiveSection(section);
    setExpanded(false);
  };

  return (
    <div className={`admin-sidebar ${expanded ? 'expanded' : ''}`}>
      <div className="admin-sidebar-header" onClick={toggleSidebar}>
        <h2>Themis BioProfiling</h2>
        <i className='bx bx-menu toggle-menu'></i>
      </div>
      <div className="admin-sidebar-user">
        <div className="user-info">
          <p className="user-name">{currentUser?.username}</p>
          <p className="user-role">Officer (Admin)</p>
        </div>
      </div>
      <nav className="admin-sidebar-nav">
        <ul>
          <li className={activeSection === 'home' ? 'active' : ''}>
            <a href="#" onClick={(e) => { e.preventDefault(); handleNavClick('home'); }}>
              <i className='bx bx-grid-alt'></i>
              <span>Dashboard</span>
            </a>
          </li>
          <li className={activeSection === 'puc' ? 'active' : ''}>
            <a href="#" onClick={(e) => { e.preventDefault(); handleNavClick('puc'); }}>
              <i className='bx bx-user-pin'></i>
              <span>PUC Records</span>
            </a>
          </li>
          <li className={activeSection === 'visitor-logs' ? 'active' : ''}>
            <a href="#" onClick={(e) => { e.preventDefault(); handleNavClick('visitor-logs'); }}>
              <i className='bx bx-list-check'></i>
              <span>Visitor Logs</span>
            </a>
          </li>
          <li className={activeSection === 'approvals' ? 'active' : ''}>
            <a href="#" onClick={(e) => { e.preventDefault(); handleNavClick('approvals'); }}>
              <i className='bx bx-check-shield'></i>
              <span>Approvals</span>
            </a>
          </li>
          <li className={activeSection === 'blacklisted' ? 'active' : ''}>
            <a href="#" onClick={(e) => { e.preventDefault(); handleNavClick('blacklisted'); }}>
              <i className='bx bx-block'></i>
              <span>Blacklisted</span>
            </a>
          </li>
          <li className={activeSection === 'logs' ? 'active' : ''}>
            <a href="#" onClick={(e) => { e.preventDefault(); handleNavClick('logs'); }}>
              <i className='bx bx-history'></i>
              <span>Audit Logs</span>
            </a>
          </li>
          <li className={activeSection === 'reports' ? 'active' : ''}>
            <a href="#" onClick={(e) => { e.preventDefault(); handleNavClick('reports'); }}>
              <i className='bx bx-chart'></i>
              <span>Reports</span>
            </a>
          </li>
          <li className={activeSection === 'users' ? 'active' : ''}>
            <a href="#" onClick={(e) => { e.preventDefault(); handleNavClick('users'); }}>
              <i className='bx bx-group'></i>
              <span>User Management</span>
            </a>
          </li>
        </ul>
        
        {/* Logout button placed below tabs */}
        <button className="logout-button-tabs" onClick={handleLogout}>
          <i className='bx bx-log-out'></i>
          <span>Logout</span>
        </button>
      </nav>
      {/* Footer removed - logout button moved below tabs */}
    </div>
  );
};

export default AdminNavbar;