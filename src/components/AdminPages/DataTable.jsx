import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './AdminDashboard.css';

const DataTable = ({ loading, error, data, type, loadingMessage, errorMessage, emptyMessage, icon, onEdit }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredData, setFilteredData] = useState([]);
  const [processingIds, setProcessingIds] = useState([]);
  
  // Function to handle approval of visitor requests
  const handleApprove = async (visitorLogId) => {
    try {
      setProcessingIds(prev => [...prev, visitorLogId]);
      const token = localStorage.getItem('token');
      
      await axios.put(`http://localhost:5000/api/visitor-logs/${visitorLogId}/approve`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Update the local state to reflect the change
      setFilteredData(prevData => 
        prevData.filter(item => item.visitor_log_id !== visitorLogId)
      );
      
      // Show success notification
      alert('Visit request approved successfully');
    } catch (error) {
      console.error('Error approving visit request:', error);
      alert('Failed to approve visit request. Please try again.');
    } finally {
      setProcessingIds(prev => prev.filter(id => id !== visitorLogId));
    }
  };
  
  // Function to handle rejection of visitor requests
  const handleReject = async (visitorLogId) => {
    try {
      setProcessingIds(prev => [...prev, visitorLogId]);
      const token = localStorage.getItem('token');
      
      await axios.put(`http://localhost:5000/api/visitor-logs/${visitorLogId}/reject`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Update the local state to reflect the change
      setFilteredData(prevData => 
        prevData.filter(item => item.visitor_log_id !== visitorLogId)
      );
      
      // Show success notification
      alert('Visit request rejected successfully');
    } catch (error) {
      console.error('Error rejecting visit request:', error);
      alert('Failed to reject visit request. Please try again.');
    } finally {
      setProcessingIds(prev => prev.filter(id => id !== visitorLogId));
    }
  };

  useEffect(() => {
    if (!data) {
      setFilteredData([]);
      return;
    }

    if (!searchTerm) {
      setFilteredData(data);
      return;
    }

    const searchTermLower = searchTerm.toLowerCase();
    
    // Filter data based on type
    switch (type) {
      case 'visitorLogs':
        setFilteredData(data.filter(log => 
          `${log.visitor_first_name} ${log.visitor_last_name}`.toLowerCase().includes(searchTermLower) ||
          `${log.pupc_first_name} ${log.pupc_last_name}`.toLowerCase().includes(searchTermLower) ||
          log.purpose.toLowerCase().includes(searchTermLower) ||
          log.approval_status.toLowerCase().includes(searchTermLower)
        ));
        break;
      case 'approvals':
        setFilteredData(data.filter(approval => 
          `${approval.visitor_first_name} ${approval.visitor_last_name}`.toLowerCase().includes(searchTermLower) ||
          `${approval.pupc_first_name} ${approval.pupc_last_name}`.toLowerCase().includes(searchTermLower) ||
          approval.purpose.toLowerCase().includes(searchTermLower)
        ));
        break;
      case 'blacklisted':
        setFilteredData(data.filter(item => 
          `${item.visitor_first_name} ${item.visitor_last_name}`.toLowerCase().includes(searchTermLower) ||
          `${item.pupc_first_name} ${item.pupc_last_name}`.toLowerCase().includes(searchTermLower) ||
          (item.reason && item.reason.toLowerCase().includes(searchTermLower))
        ));
        break;
      case 'auditLogs':
        setFilteredData(data.filter(log => 
          (log.username && log.username.toLowerCase().includes(searchTermLower)) ||
          (log.event_type && log.event_type.toLowerCase().includes(searchTermLower)) ||
          (log.notes && log.notes.toLowerCase().includes(searchTermLower))
        ));
        break;
      case 'users':
        setFilteredData(data.filter(user => 
          user.username.toLowerCase().includes(searchTermLower) ||
          (user.role_name && user.role_name.toLowerCase().includes(searchTermLower))
        ));
        break;
      default:
        setFilteredData(data);
    }
  }, [data, searchTerm, type]);

  const renderTableHeader = () => {
    switch (type) {
      case 'pucs':
        return (
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
        );
      case 'visitorLogs':
        return (
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
        );
      case 'approvals':
        return (
          <tr>
            <th>ID</th>
            <th>Visitor</th>
            <th>PUC</th>
            <th>Date</th>
            <th>Time</th>
            <th>Purpose</th>
            <th>Actions</th>
          </tr>
        );
      case 'blacklisted':
        return (
          <tr>
            <th>ID</th>
            <th>Visitor</th>
            <th>PUC</th>
            <th>Reason</th>
            <th>Added Date</th>
          </tr>
        );
      case 'auditLogs':
        return (
          <tr>
            <th>ID</th>
            <th>User</th>
            <th>Event Type</th>
            <th>Time</th>
            <th>IP Address</th>
            <th>Notes</th>
          </tr>
        );
      case 'users':
        return (
          <tr>
            <th>ID</th>
            <th>Username</th>
            <th>Role</th>
            <th>Created</th>
            <th>Last Login</th>
            <th>Actions</th>
          </tr>
        );
      default:
        return null;
    }
  };

  const renderTableRows = () => {
    switch (type) {
      case 'pucs':
        return filteredData.map(puc => (
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
        ));
      case 'visitorLogs':
        return filteredData.map(log => (
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
        ));
      case 'approvals':
        return filteredData.map(approval => (
          <tr key={approval.visitor_log_id}>
            <td>{approval.visitor_log_id}</td>
            <td>{`${approval.visitor_first_name} ${approval.visitor_last_name}`}</td>
            <td>{`${approval.pupc_first_name} ${approval.pupc_last_name}`}</td>
            <td>{new Date(approval.visit_date).toLocaleDateString()}</td>
            <td>{approval.visit_time}</td>
            <td>{approval.purpose}</td>
            <td>
              <button 
                className="action-btn approve-btn" 
                onClick={() => handleApprove(approval.visitor_log_id)}
                disabled={processingIds.includes(approval.visitor_log_id)}
              >
                {processingIds.includes(approval.visitor_log_id) ? 
                  <i className='bx bx-loader-alt bx-spin'></i> : 
                  <i className='bx bx-check'></i>
                }
              </button>
              <button 
                className="action-btn reject-btn"
                onClick={() => handleReject(approval.visitor_log_id)}
                disabled={processingIds.includes(approval.visitor_log_id)}
              >
                {processingIds.includes(approval.visitor_log_id) ? 
                  <i className='bx bx-loader-alt bx-spin'></i> : 
                  <i className='bx bx-x'></i>
                }
              </button>
            </td>
          </tr>
        ));
      case 'blacklisted':
        return filteredData.map(item => (
          <tr key={item.black_id}>
            <td>{item.black_id}</td>
            <td>{`${item.visitor_first_name} ${item.visitor_last_name}`}</td>
            <td>{`${item.pupc_first_name} ${item.pupc_last_name}`}</td>
            <td>{item.reason}</td>
            <td>{new Date(item.added_at).toLocaleDateString()}</td>
          </tr>
        ));
      case 'auditLogs':
        return filteredData.map(log => (
          <tr key={log.audit_id}>
            <td>{log.audit_id}</td>
            <td>{log.username}</td>
            <td>{log.event_type}</td>
            <td>{new Date(log.event_time).toLocaleString()}</td>
            <td>{log.ip_address}</td>
            <td>{log.notes}</td>
          </tr>
        ));
      case 'users':
        return filteredData.map(user => (
          <tr key={user.user_id}>
            <td>{user.user_id}</td>
            <td>{user.username}</td>
            <td>{user.role_name}</td>
            <td>{new Date(user.created_at).toLocaleDateString()}</td>
            <td>{user.last_login ? new Date(user.last_login).toLocaleString() : 'Never'}</td>
            <td>
              <button 
                className="action-btn edit-btn"
                onClick={() => onEdit && onEdit(user)}
              >
                <i className='bx bx-edit'></i>
              </button>
              <button className="action-btn delete-btn">
                <i className='bx bx-trash'></i>
              </button>
            </td>
          </tr>
        ));
      default:
        return null;
    }
  };

  if (loading) {
    return <div className="loading-indicator">{loadingMessage || 'Loading...'}</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  if (!data || data.length === 0) {
    return (
      <div className="placeholder-content">
        <i className={`bx ${icon || 'bx-data'} placeholder-icon`}></i>
        <p>{emptyMessage || 'No data available'}</p>
      </div>
    );
  }

  return (
    <div>
      <div className="data-table-controls">
        <div className="search-container">
          <input
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          <i className='bx bx-search search-icon'></i>
        </div>
      </div>
      
      <div className="data-table-container">
        <table className="data-table">
          <thead>
            {renderTableHeader()}
          </thead>
          <tbody>
            {renderTableRows()}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DataTable;