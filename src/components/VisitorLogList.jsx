import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './VisitorLogList.css';

const VisitorLogList = () => {
  const [visitorLogs, setVisitorLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState({ status: '', date: '', search: '' });
  
  const navigate = useNavigate();

  useEffect(() => {
    const fetchVisitorLogs = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get('http://localhost:5000/api/visitor-logs', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setVisitorLogs(response.data);
      } catch (err) {
        setError('Failed to fetch visitor logs');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchVisitorLogs();
  }, []);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilter(prev => ({ ...prev, [name]: value }));
  };

  const filteredLogs = visitorLogs.filter(log => {
    const matchesStatus = filter.status ? log.approval_status === filter.status : true;
    const matchesDate = filter.date ? log.visit_date === filter.date : true;
    const matchesSearch = filter.search ? 
      (log.visitor_name && log.visitor_name.toLowerCase().includes(filter.search.toLowerCase())) || 
      (log.pupc_name && log.pupc_name.toLowerCase().includes(filter.search.toLowerCase())) : 
      true;
    
    return matchesStatus && matchesDate && matchesSearch;
  });

  const handleViewDetails = (logId) => {
    navigate(`/visitor-logs/${logId}`);
  };

  const handleApprove = async (logId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`http://localhost:5000/api/visitor-logs/${logId}/approve`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Update the local state
      setVisitorLogs(prevLogs => 
        prevLogs.map(log => 
          log.visitor_log_id === logId ? { ...log, approval_status: 'Approved' } : log
        )
      );
    } catch (err) {
      console.error('Failed to approve visit:', err);
      alert('Failed to approve visit. Please try again.');
    }
  };

  const handleReject = async (logId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`http://localhost:5000/api/visitor-logs/${logId}/reject`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Update the local state
      setVisitorLogs(prevLogs => 
        prevLogs.map(log => 
          log.visitor_log_id === logId ? { ...log, approval_status: 'Rejected' } : log
        )
      );
    } catch (err) {
      console.error('Failed to reject visit:', err);
      alert('Failed to reject visit. Please try again.');
    }
  };

  if (loading) return <div className="loading">Loading...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="visitor-log-container">
      <h2>Visitor Logs</h2>
      
      <div className="filters">
        <div className="filter-group">
          <label>Status:</label>
          <select 
            name="status" 
            value={filter.status} 
            onChange={handleFilterChange}
          >
            <option value="">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
          </select>
        </div>
        
        <div className="filter-group">
          <label>Visit Date:</label>
          <input 
            type="date" 
            name="date" 
            value={filter.date} 
            onChange={handleFilterChange}
          />
        </div>
        
        <div className="filter-group">
          <label>Search:</label>
          <input 
            type="text" 
            name="search" 
            value={filter.search} 
            onChange={handleFilterChange}
            placeholder="Search visitor or PUPC name"
          />
        </div>
      </div>
      
      <div className="visitor-log-table-container">
        <table className="visitor-log-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Visitor</th>
              <th>PUPC</th>
              <th>Visit Date</th>
              <th>Visit Time</th>
              <th>Purpose</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredLogs.length > 0 ? (
              filteredLogs.map(log => (
                <tr key={log.visitor_log_id}>
                  <td>{log.visitor_log_id}</td>
                  <td>{log.visitor_name || `ID: ${log.visitor_id}`}</td>
                  <td>{log.pupc_name || `ID: ${log.pupc_id}`}</td>
                  <td>{log.visit_date}</td>
                  <td>{log.visit_time}</td>
                  <td>{log.purpose || 'N/A'}</td>
                  <td>
                    <span className={`status-${log.approval_status.toLowerCase()}`}>
                      {log.approval_status}
                    </span>
                  </td>
                  <td className="action-cell">
                    <button 
                      onClick={() => handleViewDetails(log.visitor_log_id)}
                      className="view-button"
                    >
                      View
                    </button>
                    
                    {log.approval_status === 'Pending' && (
                      <>
                        <button 
                          onClick={() => handleApprove(log.visitor_log_id)}
                          className="approve-button"
                        >
                          Approve
                        </button>
                        <button 
                          onClick={() => handleReject(log.visitor_log_id)}
                          className="reject-button"
                        >
                          Reject
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="8" className="no-results">No visitor logs found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      <div className="action-buttons">
        <button onClick={() => navigate('/visitor-logs/new')} className="add-button">
          Schedule New Visit
        </button>
      </div>
    </div>
  );
};

export default VisitorLogList;