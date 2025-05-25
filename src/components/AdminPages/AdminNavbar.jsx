import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './AdminDashboard.css';

const AdminNavbar = ({ activeSection, setActiveSection }) => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="admin-sidebar">
      <div className="admin-sidebar-header">
        <h2>Themis BioProfiling</h2>
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
            <a href="#" onClick={(e) => { e.preventDefault(); setActiveSection('home'); }}>
              <i className='bx bx-grid-alt'></i>
              <span>Dashboard</span>
            </a>
          </li>
          <li className={activeSection === 'puc' ? 'active' : ''}>
            <a href="#" onClick={(e) => { e.preventDefault(); setActiveSection('puc'); }}>
              <i className='bx bx-user-pin'></i>
              <span>PUC Records</span>
            </a>
          </li>
          <li className={activeSection === 'visitor-logs' ? 'active' : ''}>
            <a href="#" onClick={(e) => { e.preventDefault(); setActiveSection('visitor-logs'); }}>
              <i className='bx bx-list-check'></i>
              <span>Visitor Logs</span>
            </a>
          </li>
          <li className={activeSection === 'approvals' ? 'active' : ''}>
            <a href="#" onClick={(e) => { e.preventDefault(); setActiveSection('approvals'); }}>
              <i className='bx bx-check-shield'></i>
              <span>Approvals</span>
            </a>
          </li>
          <li className={activeSection === 'blacklisted' ? 'active' : ''}>
            <a href="#" onClick={(e) => { e.preventDefault(); setActiveSection('blacklisted'); }}>
              <i className='bx bx-block'></i>
              <span>Blacklisted</span>
            </a>
          </li>
          <li className={activeSection === 'logs' ? 'active' : ''}>
            <a href="#" onClick={(e) => { e.preventDefault(); setActiveSection('logs'); }}>
              <i className='bx bx-history'></i>
              <span>Audit Logs</span>
            </a>
          </li>
          <li className={activeSection === 'reports' ? 'active' : ''}>
            <a href="#" onClick={(e) => { e.preventDefault(); setActiveSection('reports'); }}>
              <i className='bx bx-bar-chart-alt-2'></i>
              <span>Reports</span>
            </a>
          </li>
          <li className={activeSection === 'users' ? 'active' : ''}>
            <a href="#" onClick={(e) => { e.preventDefault(); setActiveSection('users'); }}>
              <i className='bx bx-group'></i>
              <span>User Management</span>
            </a>
          </li>
          <li className={activeSection === 'settings' ? 'active' : ''}>
            <a href="#" onClick={(e) => { e.preventDefault(); setActiveSection('settings'); }}>
              <i className='bx bx-cog'></i>
              <span>System Settings</span>
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
  );
};

export default AdminNavbar;