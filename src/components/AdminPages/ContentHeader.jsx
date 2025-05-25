import React from 'react';
import './AdminDashboard.css';

const ContentHeader = ({ activeSection, connectionStatus }) => {
  const getSectionTitle = () => {
    switch (activeSection) {
      case 'home': return 'Dashboard';
      case 'puc': return 'PUC Records';
      case 'visitor-logs': return 'Visitor Logs';
      case 'approvals': return 'Approvals';
      case 'blacklisted': return 'Blacklisted';
      case 'logs': return 'Audit Logs';
      case 'reports': return 'Reports';
      case 'users': return 'User Management';
      case 'settings': return 'System Settings';
      default: return 'Dashboard';
    }
  };

  return (
    <header className="admin-content-header">
      <h1>{getSectionTitle()}</h1>
      
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
  );
};

export default ContentHeader;