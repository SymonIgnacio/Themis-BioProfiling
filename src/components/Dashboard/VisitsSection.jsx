import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import VisitRequestModal from './VisitRequestModal';

const VisitsSection = () => {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState('visits');
  const [approvedVisits, setApprovedVisits] = useState([]);
  const [pendingVisits, setPendingVisits] = useState([]);
  const [rejectedVisits, setRejectedVisits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    const fetchVisits = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        
        // Fetch all visits for the current user
        const response = await axios.get('http://localhost:5000/api/visitor-logs', {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        // Process the data to ensure pupc_name is properly set
        const processedData = response.data.map(visit => {
          // If pupc_name is missing but we have first and last name, combine them
          if (!visit.pupc_name && visit.pupc_first_name && visit.pupc_last_name) {
            return {
              ...visit,
              pupc_name: `${visit.pupc_first_name} ${visit.pupc_last_name}`
            };
          }
          return visit;
        });
        
        // Filter visits by status
        const approved = processedData.filter(visit => visit.approval_status === 'Approved');
        const pending = processedData.filter(visit => visit.approval_status === 'Pending');
        const rejected = processedData.filter(visit => visit.approval_status === 'Rejected');
        
        setApprovedVisits(approved);
        setPendingVisits(pending);
        setRejectedVisits(rejected);
        setError(null);
      } catch (err) {
        console.error('Error fetching visits:', err);
        setError('Failed to load visit data');
      } finally {
        setLoading(false);
      }
    };

    fetchVisits();
  }, []);

  const handleRequestVisit = () => {
    setModalOpen(true);
  };

  const handleModalClose = () => {
    setModalOpen(false);
  };

  const handleVisitSubmit = async (visitData) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      // Get the PUC name from the form data
      const pucName = visitData.pupc_name;
      
      // Send visit request data
      await axios.post('http://localhost:5000/api/create-visit', visitData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Refresh visits list
      const response = await axios.get('http://localhost:5000/api/visitor-logs', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Process the data to ensure pupc_name is properly set
      const processedData = response.data.map(visit => ({
        ...visit,
        pupc_name: visit.pupc_name || pucName
      }));
      
      // Filter visits by status
      const approved = processedData.filter(visit => visit.approval_status === 'Approved');
      const pending = processedData.filter(visit => visit.approval_status === 'Pending');
      const rejected = processedData.filter(visit => visit.approval_status === 'Rejected');
      
      setApprovedVisits(approved);
      setPendingVisits(pending);
      setRejectedVisits(rejected);
      setModalOpen(false);
      setError(null);
    } catch (err) {
      console.error('Error submitting visit request:', err);
      setError('Failed to submit visit request');
    } finally {
      setLoading(false);
    }
  };

  const renderVisitsTable = (visitsData) => {
    if (!Array.isArray(visitsData) || visitsData.length === 0) {
      return (
        <div className="no-visits-message">
          <i className='bx bx-calendar-x'></i>
          <p>No visit requests found. Click "Request Visit" to schedule a visit.</p>
        </div>
      );
    }

    return (
      <div className="visits-table-container">
        <table className="visits-table">
          <thead>
            <tr>
              <th>PUC Name</th>
              <th>Visit Date</th>
              <th>Visit Time</th>
              <th>Purpose</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {visitsData.map((visit) => (
              <tr key={visit.visitor_log_id}>
                <td>{visit.pupc_name}</td>
                <td>{new Date(visit.visit_date).toLocaleDateString()}</td>
                <td>{visit.visit_time}</td>
                <td>{visit.purpose}</td>
                <td>
                  <span className={`status-badge status-${visit.approval_status.toLowerCase()}`}>
                    {visit.approval_status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="visits-section">
      <div className="section-header">
        <h2>Visit Requests</h2>
        <button className="request-visit-btn" onClick={handleRequestVisit}>
          <i className='bx bx-plus'></i> Request Visit
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}
      
      <div className="visits-tabs">
        <button 
          className={`tab-button ${activeTab === 'visits' ? 'active' : ''}`}
          onClick={() => setActiveTab('visits')}
        >
          Visits
          {approvedVisits.length > 0 && <span className="badge">{approvedVisits.length}</span>}
        </button>
        <button 
          className={`tab-button ${activeTab === 'pending' ? 'active' : ''}`}
          onClick={() => setActiveTab('pending')}
        >
          Pending
          {pendingVisits.length > 0 && <span className="badge">{pendingVisits.length}</span>}
        </button>
        <button 
          className={`tab-button ${activeTab === 'rejected' ? 'active' : ''}`}
          onClick={() => setActiveTab('rejected')}
        >
          Rejected
          {rejectedVisits.length > 0 && <span className="badge">{rejectedVisits.length}</span>}
        </button>
      </div>
      
      <div className="tab-content">
        {loading ? (
          <div className="loading-indicator">Loading visits...</div>
        ) : (
          activeTab === 'visits' ? renderVisitsTable(approvedVisits) : 
          activeTab === 'pending' ? renderVisitsTable(pendingVisits) : 
          renderVisitsTable(rejectedVisits)
        )}
      </div>

      {modalOpen && (
        <VisitRequestModal 
          isOpen={modalOpen}
          onClose={handleModalClose}
          onSubmit={handleVisitSubmit}
        />
      )}
    </div>
  );
};

export default VisitsSection;