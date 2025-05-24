import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const { currentUser, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('home');
  const [dashboardStats, setDashboardStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [pucs, setPucs] = useState([]);
  const [visitorLogs, setVisitorLogs] = useState([]);
  const [approvals, setApprovals] = useState([]);
  const [blacklisted, setBlacklisted] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [connectionStatus, setConnectionStatus] = useState(null);
  const [loading, setLoading] = useState({
    stats: false,
    users: false,
    pucs: false,
    visitorLogs: false,
    approvals: false,
    blacklisted: false,
    auditLogs: false
  });
  const [error, setError] = useState({
    stats: null,
    users: null,
    pucs: null,
    visitorLogs: null,
    approvals: null,
    blacklisted: null,
    auditLogs: null
  });

  // Test database connection
  useEffect(() => {
    axios.get('http://localhost:5000/api/test-connection')
      .then(response => {
        setConnectionStatus({ status: 'success', message: response.data.message });
      })
      .catch(err => {
        console.error('Connection test failed:', err);
        setConnectionStatus({ status: 'error', message: err.message });
      });
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, currentUser, navigate]);

  // Fetch dashboard stats
  useEffect(() => {
    if (activeSection === 'home') {
      setLoading(prev => ({ ...prev, stats: true }));
      axios.get('http://localhost:5000/api/dashboard/stats')
        .then(response => {
          setDashboardStats(response.data);
          setError(prev => ({ ...prev, stats: null }));
        })
        .catch(err => {
          console.error('Error fetching dashboard stats:', err);
          setError(prev => ({ ...prev, stats: 'Failed to load dashboard statistics' }));
        })
        .finally(() => {
          setLoading(prev => ({ ...prev, stats: false }));
        });
    }
  }, [activeSection]);

  // Fetch PUCs
  useEffect(() => {
    if (activeSection === 'puc') {
      setLoading(prev => ({ ...prev, pucs: true }));
      axios.get('http://localhost:5000/api/pucs')
        .then(response => {
          setPucs(response.data);
          setError(prev => ({ ...prev, pucs: null }));
        })
        .catch(err => {
          console.error('Error fetching PUCs:', err);
          setError(prev => ({ ...prev, pucs: 'Failed to load PUC records' }));
        })
        .finally(() => {
          setLoading(prev => ({ ...prev, pucs: false }));
        });
    }
  }, [activeSection]);

  // Fetch visitor logs
  useEffect(() => {
    if (activeSection === 'visitor-logs') {
      setLoading(prev => ({ ...prev, visitorLogs: true }));
      axios.get('http://localhost:5000/api/visitor-logs')
        .then(response => {
          setVisitorLogs(response.data);
          setError(prev => ({ ...prev, visitorLogs: null }));
        })
        .catch(err => {
          console.error('Error fetching visitor logs:', err);
          setError(prev => ({ ...prev, visitorLogs: 'Failed to load visitor logs' }));
        })
        .finally(() => {
          setLoading(prev => ({ ...prev, visitorLogs: false }));
        });
    }
  }, [activeSection]);

  // Fetch approvals
  useEffect(() => {
    if (activeSection === 'approvals') {
      setLoading(prev => ({ ...prev, approvals: true }));
      axios.get('http://localhost:5000/api/approvals')
        .then(response => {
          setApprovals(response.data);
          setError(prev => ({ ...prev, approvals: null }));
        })
        .catch(err => {
          console.error('Error fetching approvals:', err);
          setError(prev => ({ ...prev, approvals: 'Failed to load approval requests' }));
        })
        .finally(() => {
          setLoading(prev => ({ ...prev, approvals: false }));
        });
    }
  }, [activeSection]);

  // Fetch blacklisted
  useEffect(() => {
    if (activeSection === 'blacklisted') {
      setLoading(prev => ({ ...prev, blacklisted: true }));
      axios.get('http://localhost:5000/api/blacklisted')
        .then(response => {
          setBlacklisted(response.data);
          setError(prev => ({ ...prev, blacklisted: null }));
        })
        .catch(err => {
          console.error('Error fetching blacklisted:', err);
          setError(prev => ({ ...prev, blacklisted: 'Failed to load blacklisted visitors' }));
        })
        .finally(() => {
          setLoading(prev => ({ ...prev, blacklisted: false }));
        });
    }
  }, [activeSection]);

  // Fetch audit logs
  useEffect(() => {
    if (activeSection === 'logs') {
      setLoading(prev => ({ ...prev, auditLogs: true }));
      axios.get('http://localhost:5000/api/audit-logs')
        .then(response => {
          setAuditLogs(response.data);
          setError(prev => ({ ...prev, auditLogs: null }));
        })
        .catch(err => {
          console.error('Error fetching audit logs:', err);
          setError(prev => ({ ...prev, auditLogs: 'Failed to load audit logs' }));
        })
        .finally(() => {
          setLoading(prev => ({ ...prev, auditLogs: false }));
        });
    }
  }, [activeSection]);

  // Fetch users
  useEffect(() => {
    if (activeSection === 'users') {
      setLoading(prev => ({ ...prev, users: true }));
      axios.get('http://localhost:5000/api/users')
        .then(response => {
          setUsers(response.data);
          setError(prev => ({ ...prev, users: null }));
        })
        .catch(err => {
          console.error('Error fetching users:', err);
          setError(prev => ({ ...prev, users: 'Failed to load users' }));
        })
        .finally(() => {
          setLoading(prev => ({ ...prev, users: false }));
        });
    }
  }, [activeSection]);

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
      
      <div className="admin-main-content">
        <header className="admin-content-header">
          <h1>
            {activeSection === 'home' && 'Dashboard'}
            {activeSection === 'puc' && 'PUC Records'}
            {activeSection === 'visitor-logs' && 'Visitor Logs'}
            {activeSection === 'approvals' && 'Approvals'}
            {activeSection === 'blacklisted' && 'Blacklisted'}
            {activeSection === 'logs' && 'Audit Logs'}
            {activeSection === 'reports' && 'Reports'}
            {activeSection === 'users' && 'User Management'}
            {activeSection === 'settings' && 'System Settings'}
          </h1>
          
          {connectionStatus && (
            <div className={`connection-status ${connectionStatus.status}`}>
              {connectionStatus.status === 'success' ? (
                <i className='bx bx-check-circle'></i>
              ) : (
                <i className='bx bx-error-circle'></i>
              )}
              <span>{connectionStatus.message}</span>
            </div>
          )}
        </header>
        
        <div className="admin-content-body">
          {activeSection === 'home' && (
            <div className="welcome-section">
              <h2>System Overview</h2>
              
              {loading.stats ? (
                <div className="loading-indicator">Loading statistics...</div>
              ) : error.stats ? (
                <div className="error-message">{error.stats}</div>
              ) : dashboardStats ? (
                <div className="stats-grid">
                  <div className="stat-card">
                    <i className='bx bx-user-circle stat-icon'></i>
                    <div className="stat-info">
                      <h3>Users</h3>
                      <p className="stat-value">{dashboardStats.user_count}</p>
                    </div>
                  </div>
                  
                  <div className="stat-card">
                    <i className='bx bx-user-pin stat-icon'></i>
                    <div className="stat-info">
                      <h3>PUC Records</h3>
                      <p className="stat-value">{dashboardStats.pupc_count}</p>
                    </div>
                  </div>
                  
                  <div className="stat-card">
                    <i className='bx bx-list-check stat-icon'></i>
                    <div className="stat-info">
                      <h3>Visitor Logs</h3>
                      <p className="stat-value">{dashboardStats.visitor_log_count}</p>
                    </div>
                  </div>
                  
                  <div className="stat-card">
                    <i className='bx bx-check-shield stat-icon'></i>
                    <div className="stat-info">
                      <h3>Pending Approvals</h3>
                      <p className="stat-value">{dashboardStats.pending_approval_count}</p>
                    </div>
                  </div>
                  
                  <div className="stat-card">
                    <i className='bx bx-block stat-icon'></i>
                    <div className="stat-info">
                      <h3>Blacklisted</h3>
                      <p className="stat-value">{dashboardStats.blacklisted_count}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <p>No statistics available</p>
              )}
            </div>
          )}
          
          {activeSection === 'puc' && (
            <div className="puc-section">
              <h2>PUC Records</h2>
              
              {loading.pucs ? (
                <div className="loading-indicator">Loading PUC records...</div>
              ) : error.pucs ? (
                <div className="error-message">{error.pucs}</div>
              ) : pucs.length > 0 ? (
                <div className="data-table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Name</th>
                        <th>Gender</th>
                        <th>Age</th>
                        <th>Status</th>
                        <th>Category</th>
                        <th>Arrest Date</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pucs.map(puc => (
                        <tr key={puc.pupc_id}>
                          <td>{puc.pupc_id}</td>
                          <td>{`${puc.first_name} ${puc.last_name}`}</td>
                          <td>{puc.gender}</td>
                          <td>{puc.age}</td>
                          <td>{puc.status}</td>
                          <td>{puc.crime_category}</td>
                          <td>{new Date(puc.arrest_date).toLocaleDateString()}</td>
                          <td>
                            <button className="action-btn view-btn">
                              <i className='bx bx-show'></i>
                            </button>
                            <button className="action-btn edit-btn">
                              <i className='bx bx-edit'></i>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="placeholder-content">
                  <i className='bx bx-user-pin placeholder-icon'></i>
                  <p>No PUC records found</p>
                </div>
              )}
            </div>
          )}
          
          {activeSection === 'visitor-logs' && (
            <div className="visitor-logs-section">
              <h2>Visitor Logs</h2>
              
              {loading.visitorLogs ? (
                <div className="loading-indicator">Loading visitor logs...</div>
              ) : error.visitorLogs ? (
                <div className="error-message">{error.visitorLogs}</div>
              ) : visitorLogs.length > 0 ? (
                <div className="data-table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Visitor</th>
                        <th>PUC</th>
                        <th>Date</th>
                        <th>Time</th>
                        <th>Purpose</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {visitorLogs.map(log => (
                        <tr key={log.visitor_log_id}>
                          <td>{log.visitor_log_id}</td>
                          <td>{`${log.visitor_first_name} ${log.visitor_last_name}`}</td>
                          <td>{`${log.pupc_first_name} ${log.pupc_last_name}`}</td>
                          <td>{new Date(log.visit_date).toLocaleDateString()}</td>
                          <td>{log.visit_time}</td>
                          <td>{log.purpose}</td>
                          <td>{log.approval_status}</td>
                          <td>
                            <button className="action-btn view-btn">
                              <i className='bx bx-show'></i>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="placeholder-content">
                  <i className='bx bx-list-check placeholder-icon'></i>
                  <p>No visitor logs found</p>
                </div>
              )}
            </div>
          )}
          
          {activeSection === 'approvals' && (
            <div className="approvals-section">
              <h2>Visitor Request Approvals</h2>
              
              {loading.approvals ? (
                <div className="loading-indicator">Loading approval requests...</div>
              ) : error.approvals ? (
                <div className="error-message">{error.approvals}</div>
              ) : approvals.length > 0 ? (
                <div className="data-table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Visitor</th>
                        <th>PUC</th>
                        <th>Date</th>
                        <th>Time</th>
                        <th>Purpose</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {approvals.map(approval => (
                        <tr key={approval.visitor_log_id}>
                          <td>{approval.visitor_log_id}</td>
                          <td>{`${approval.visitor_first_name} ${approval.visitor_last_name}`}</td>
                          <td>{`${approval.pupc_first_name} ${approval.pupc_last_name}`}</td>
                          <td>{new Date(approval.visit_date).toLocaleDateString()}</td>
                          <td>{approval.visit_time}</td>
                          <td>{approval.purpose}</td>
                          <td>
                            <button className="action-btn approve-btn">
                              <i className='bx bx-check'></i>
                            </button>
                            <button className="action-btn reject-btn">
                              <i className='bx bx-x'></i>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="placeholder-content">
                  <i className='bx bx-check-shield placeholder-icon'></i>
                  <p>No pending approvals</p>
                </div>
              )}
            </div>
          )}
          
          {activeSection === 'blacklisted' && (
            <div className="blacklisted-section">
              <h2>Blacklisted Visitors</h2>
              
              {loading.blacklisted ? (
                <div className="loading-indicator">Loading blacklisted visitors...</div>
              ) : error.blacklisted ? (
                <div className="error-message">{error.blacklisted}</div>
              ) : blacklisted.length > 0 ? (
                <div className="data-table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Visitor</th>
                        <th>PUC</th>
                        <th>Reason</th>
                        <th>Added Date</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {blacklisted.map(item => (
                        <tr key={item.black_id}>
                          <td>{item.black_id}</td>
                          <td>{`${item.visitor_first_name} ${item.visitor_last_name}`}</td>
                          <td>{`${item.pupc_first_name} ${item.pupc_last_name}`}</td>
                          <td>{item.reason}</td>
                          <td>{new Date(item.added_at).toLocaleDateString()}</td>
                          <td>
                            <button className="action-btn view-btn">
                              <i className='bx bx-show'></i>
                            </button>
                            <button className="action-btn remove-btn">
                              <i className='bx bx-trash'></i>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="placeholder-content">
                  <i className='bx bx-block placeholder-icon'></i>
                  <p>No blacklisted visitors</p>
                </div>
              )}
            </div>
          )}
          
          {activeSection === 'logs' && (
            <div className="logs-section">
              <h2>Audit Logs</h2>
              
              {loading.auditLogs ? (
                <div className="loading-indicator">Loading audit logs...</div>
              ) : error.auditLogs ? (
                <div className="error-message">{error.auditLogs}</div>
              ) : auditLogs.length > 0 ? (
                <div className="data-table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>User</th>
                        <th>Event Type</th>
                        <th>Time</th>
                        <th>IP Address</th>
                        <th>Notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {auditLogs.map(log => (
                        <tr key={log.audit_id}>
                          <td>{log.audit_id}</td>
                          <td>{log.username}</td>
                          <td>{log.event_type}</td>
                          <td>{new Date(log.event_time).toLocaleString()}</td>
                          <td>{log.ip_address}</td>
                          <td>{log.notes}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="placeholder-content">
                  <i className='bx bx-history placeholder-icon'></i>
                  <p>No audit logs found</p>
                </div>
              )}
            </div>
          )}
          
          {activeSection === 'reports' && (
            <div className="reports-section">
              <h2>Reports</h2>
              <div className="placeholder-content">
                <i className='bx bx-bar-chart-alt-2 placeholder-icon'></i>
                <p>Reports will be displayed here</p>
              </div>
            </div>
          )}
          
          {activeSection === 'users' && (
            <div className="users-section">
              <h2>User Management</h2>
              
              {loading.users ? (
                <div className="loading-indicator">Loading users...</div>
              ) : error.users ? (
                <div className="error-message">{error.users}</div>
              ) : users.length > 0 ? (
                <div className="data-table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Username</th>
                        <th>Role</th>
                        <th>Created</th>
                        <th>Last Login</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map(user => (
                        <tr key={user.user_id}>
                          <td>{user.user_id}</td>
                          <td>{user.username}</td>
                          <td>{user.role_name}</td>
                          <td>{new Date(user.created_at).toLocaleDateString()}</td>
                          <td>{user.last_login ? new Date(user.last_login).toLocaleString() : 'Never'}</td>
                          <td>
                            <button className="action-btn edit-btn">
                              <i className='bx bx-edit'></i>
                            </button>
                            <button className="action-btn delete-btn">
                              <i className='bx bx-trash'></i>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="placeholder-content">
                  <i className='bx bx-group placeholder-icon'></i>
                  <p>No users found</p>
                </div>
              )}
            </div>
          )}
          
          {activeSection === 'settings' && (
            <div className="settings-section">
              <h2>System Settings</h2>
              <div className="placeholder-content">
                <i className='bx bx-cog placeholder-icon'></i>
                <p>System settings will be displayed here</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;