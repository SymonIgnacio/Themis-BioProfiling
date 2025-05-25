import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Dashboard.css';

// Import modular components
import Sidebar from './Sidebar';
import VisitsSection from './VisitsSection';
import AccountSection from './AccountSection';

const Dashboard = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('visits');

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  if (!isAuthenticated) {
    return <div className="loading">Redirecting...</div>;
  }

  return (
    <div className="dashboard-container">
      <Sidebar 
        activeSection={activeSection} 
        setActiveSection={setActiveSection} 
      />
      
      <div className="main-content">
        <header className="content-header">
          <h1>
            {activeSection === 'visits' && 'Visit Requests'}
            {activeSection === 'account' && 'Account Settings'}
          </h1>
        </header>
        
        <div className="content-body">
          {activeSection === 'visits' && <VisitsSection />}
          {activeSection === 'account' && <AccountSection />}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;