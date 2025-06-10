import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import './AdminDashboard.css';

// Import modular components
import AdminNavbar from './AdminNavbar';
import ContentHeader from './ContentHeader';
import DashboardHome from './DashboardHome';
import DataTable from './DataTable';
import EnhancedDataTable from './EnhancedDataTable';
import PlaceholderContent from './PlaceholderContent';
import SectionWrapper from './SectionWrapper';
import PUCModal from './PUCModal';
import UserModal from './UserModal';
import ReportsPage from './ReportsPage';

const AdminDashboard = () => {
  const { currentUser, isAuthenticated } = useAuth();
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
    const token = localStorage.getItem('token');
    
    axios.get('http://localhost:5000/api/test-connection', {
      headers: { Authorization: `Bearer ${token}` }
    })
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

  // Unified data fetching function
  const fetchData = (section, endpoint, dataKey, loadingKey, errorMessage, setter) => {
    setLoading(prev => ({ ...prev, [loadingKey]: true }));
    const token = localStorage.getItem('token');
    
    axios.get(`http://localhost:5000/api/${endpoint}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(response => {
        setter(response.data);
        setError(prev => ({ ...prev, [loadingKey]: null }));
      })
      .catch(err => {
        console.error(`Error fetching ${dataKey}:`, err);
        setError(prev => ({ ...prev, [loadingKey]: errorMessage }));
      })
      .finally(() => {
        setLoading(prev => ({ ...prev, [loadingKey]: false }));
      });
  };

  // Fetch data based on active section
  useEffect(() => {
    switch (activeSection) {
      case 'home':
        fetchData('home', 'dashboard/stats', 'dashboard stats', 'stats', 'Failed to load dashboard statistics', setDashboardStats);
        break;
      case 'puc':
        fetchData('puc', 'pucs', 'PUCs', 'pucs', 'Failed to load PUC records', setPucs);
        break;
      case 'visitor-logs':
        fetchData('visitor-logs', 'visitor-logs', 'visitor logs', 'visitorLogs', 'Failed to load visitor logs', setVisitorLogs);
        break;
      case 'approvals':
        fetchData('approvals', 'approvals', 'approvals', 'approvals', 'Failed to load approval requests', setApprovals);
        break;
      case 'blacklisted':
        fetchData('blacklisted', 'blacklisted', 'blacklisted', 'blacklisted', 'Failed to load blacklisted visitors', setBlacklisted);
        break;
      case 'logs':
        fetchData('logs', 'audit-logs', 'audit logs', 'auditLogs', 'Failed to load audit logs', setAuditLogs);
        break;
      case 'users':
        fetchData('users', 'users', 'users', 'users', 'Failed to load users', setUsers);
        break;
      default:
        break;
    }
  }, [activeSection]);

  if (!isAuthenticated || !currentUser) {
    return <div className="loading">Redirecting...</div>;
  }

  // State for PUC modal
  const [selectedPUC, setSelectedPUC] = useState(null);
  const [modalMode, setModalMode] = useState(null); // 'view', 'edit', or 'add'
  const [modalOpen, setModalOpen] = useState(false);
  
  // State for User modal
  const [selectedUser, setSelectedUser] = useState(null);
  const [userModalMode, setUserModalMode] = useState('add');
  const [userModalOpen, setUserModalOpen] = useState(false);

  const handleViewPUC = (puc) => {
    setSelectedPUC(puc);
    setModalMode('view');
    setModalOpen(true);
  };

  const handleEditPUC = (puc) => {
    setSelectedPUC(puc);
    setModalMode('edit');
    setModalOpen(true);
  };

  const handleAddPUC = () => {
    setSelectedPUC(null);
    setModalMode('add');
    setModalOpen(true);
  };

  const handleSavePUC = async (formData) => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      
      // For adding a new PUC
      if (modalMode === 'add') {
        const response = await axios.post('http://localhost:5000/api/pucs', formData, { headers });
        
        // Add the new PUC to the state
        setPucs([...pucs, response.data]);
        
        return response.data;
      } 
      // For editing an existing PUC
      else if (modalMode === 'edit' && selectedPUC) {
        const response = await axios.put(`http://localhost:5000/api/pucs/${selectedPUC.pupc_id}`, formData, { headers });
        
        // Update the PUCs state with the updated record
        setPucs(pucs.map(puc => 
          puc.pupc_id === selectedPUC.pupc_id ? { ...puc, ...response.data } : puc
        ));
        
        return response.data;
      }
    } catch (error) {
      console.error('Error saving PUC:', error);
      throw error;
    }
  };
  
  // User management functions
  const handleAddUser = () => {
    setSelectedUser(null);
    setUserModalMode('add');
    setUserModalOpen(true);
  };
  
  const handleEditUser = (user) => {
    setSelectedUser(user);
    setUserModalMode('edit');
    setUserModalOpen(true);
  };
  
  const handleSaveUser = async (formData) => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      
      // For adding a new user
      if (userModalMode === 'add') {
        const response = await axios.post('http://localhost:5000/api/users', formData, { headers });
        
        // Add the new user to the state
        setUsers([...users, response.data]);
        
        return response.data;
      } 
      // For editing an existing user
      else if (userModalMode === 'edit' && selectedUser) {
        // If password is empty, remove it from the request
        const dataToSend = {...formData};
        if (!dataToSend.password) {
          delete dataToSend.password;
        }
        
        const response = await axios.put(`http://localhost:5000/api/users/${selectedUser.user_id}`, dataToSend, { headers });
        
        // Update the users state with the updated record
        setUsers(users.map(user => 
          user.user_id === selectedUser.user_id ? { ...user, ...response.data } : user
        ));
        
        return response.data;
      }
    } catch (error) {
      console.error('Error saving user:', error);
      throw error;
    }
  };

  // Configuration for each section
  const sectionConfig = {
    home: {
      title: 'Dashboard',
      content: <DashboardHome loading={loading} error={error} dashboardStats={dashboardStats} />
    },
    reports: {
      title: 'Reports',
      content: <ReportsPage />
    },
    puc: {
      title: 'PUC Records',
      content: <>
        <EnhancedDataTable 
          loading={loading.pucs}
          error={error.pucs}
          data={pucs}
          type="pucs"
          loadingMessage="Loading PUC records..."
          emptyMessage="No PUC records found"
          icon="bx-user-pin"
          onView={handleViewPUC}
          onEdit={handleEditPUC}
          onAdd={handleAddPUC}
        />
        {modalOpen && (
          <PUCModal
            puc={selectedPUC}
            isOpen={modalOpen}
            onClose={() => setModalOpen(false)}
            onSave={handleSavePUC}
            mode={modalMode}
          />
        )}
      </>
    },
    'visitor-logs': {
      title: 'Visitor Logs',
      content: <DataTable 
        loading={loading.visitorLogs}
        error={error.visitorLogs}
        data={visitorLogs}
        type="visitorLogs"
        loadingMessage="Loading visitor logs..."
        emptyMessage="No visitor logs found"
        icon="bx-list-check"
      />
    },
    approvals: {
      title: 'Visitor Request Approvals',
      content: <DataTable 
        loading={loading.approvals}
        error={error.approvals}
        data={approvals}
        type="approvals"
        loadingMessage="Loading approval requests..."
        emptyMessage="No pending approvals"
        icon="bx-check-shield"
      />
    },
    blacklisted: {
      title: 'Blacklisted Visitors',
      content: <DataTable 
        loading={loading.blacklisted}
        error={error.blacklisted}
        data={blacklisted}
        type="blacklisted"
        loadingMessage="Loading blacklisted visitors..."
        emptyMessage="No blacklisted visitors"
        icon="bx-block"
      />
    },
    logs: {
      title: 'Audit Logs',
      content: <DataTable 
        loading={loading.auditLogs}
        error={error.auditLogs}
        data={auditLogs}
        type="auditLogs"
        loadingMessage="Loading audit logs..."
        emptyMessage="No audit logs found"
        icon="bx-history"
      />
    },
    users: {
      title: 'User Management',
      content: (
        <>
          <div className="table-actions">
            <button onClick={handleAddUser} className="add-button">
              <i className='bx bx-plus'></i> Add New User
            </button>
          </div>
          <DataTable 
            loading={loading.users}
            error={error.users}
            data={users}
            type="users"
            loadingMessage="Loading users..."
            emptyMessage="No users found"
            icon="bx-group"
            onEdit={handleEditUser}
          />
          {userModalOpen && (
            <UserModal
              isOpen={userModalOpen}
              onClose={() => setUserModalOpen(false)}
              onSave={handleSaveUser}
              mode={userModalMode}
              user={selectedUser}
            />
          )}
        </>
      )
    },
    settings: {
      title: 'System Settings',
      content: <PlaceholderContent 
        icon="bx-cog" 
        message="System settings will be displayed here" 
      />
    }
  };

  const renderContent = () => {
    const config = sectionConfig[activeSection] || { title: '', content: null };
    
    if (activeSection === 'home') {
      return config.content;
    }
    
    return (
      <SectionWrapper title={config.title}>
        {config.content}
      </SectionWrapper>
    );
  };

  const handleFixedLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="admin-dashboard-container">
      <AdminNavbar 
        activeSection={activeSection} 
        setActiveSection={setActiveSection} 
      />
      
      <div className="admin-main-content">
        <ContentHeader 
          activeSection={activeSection} 
          connectionStatus={connectionStatus} 
        />
        
        <div className="admin-content-body">
          {renderContent()}
        </div>
      </div>
      
      <button className="fixed-logout" onClick={handleFixedLogout}>
        <i className='bx bx-log-out'></i>
        <span>Logout</span>
      </button>
    </div>
  );
};

export default AdminDashboard;