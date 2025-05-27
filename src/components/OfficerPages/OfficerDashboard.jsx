import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import '../AdminPages/AdminDashboard.css'; // Reusing admin styles

// Import modular components
import OfficerNavbar from './OfficerNavbar';
import ContentHeader from '../AdminPages/ContentHeader';
import OfficerDashboardHome from './OfficerDashboardHome';
import DataTable from '../AdminPages/DataTable';
import EnhancedDataTable from '../AdminPages/EnhancedDataTable';
import SectionWrapper from '../AdminPages/SectionWrapper';
import PUCModal from '../AdminPages/PUCModal';

const OfficerDashboard = () => {
  const { currentUser, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('home');
  const [dashboardStats, setDashboardStats] = useState(null);
  const [pucs, setPucs] = useState([]);
  const [visitorLogs, setVisitorLogs] = useState([]);
  const [approvals, setApprovals] = useState([]);
  const [blacklisted, setBlacklisted] = useState([]);
  const [connectionStatus, setConnectionStatus] = useState(null);
  const [loading, setLoading] = useState({
    stats: false,
    pucs: false,
    visitorLogs: false,
    approvals: false,
    blacklisted: false
  });
  const [error, setError] = useState({
    stats: null,
    pucs: null,
    visitorLogs: null,
    approvals: null,
    blacklisted: null
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

  // Configuration for each section
  const sectionConfig = {
    home: {
      title: 'Dashboard',
      content: <OfficerDashboardHome loading={loading} error={error} dashboardStats={dashboardStats} />
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
      <OfficerNavbar 
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

export default OfficerDashboard;