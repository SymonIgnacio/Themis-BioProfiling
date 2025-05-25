import React, { useState, useEffect } from 'react';
import axios from 'axios';
import VisitRequestModal from './VisitRequestModal';

const VisitsSection = () => {
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    const fetchVisits = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get('http://localhost:5000/api/my-visits', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setVisits(response.data);
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
      await axios.post('http://localhost:5000/api/visit-requests', visitData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Refresh visits list
      const response = await axios.get('http://localhost:5000/api/my-visits', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setVisits(response.data);
      setModalOpen(false);
      setError(null);
    } catch (err) {
      console.error('Error submitting visit request:', err);
      setError('Failed to submit visit request');
    } finally {
      setLoading(false);
    }
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
      
      {loading ? (
        <div className="loading-indicator">Loading visits...</div>
      ) : visits.length > 0 ? (
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
              {visits.map((visit) => (
                <tr key={visit.visitor_log_id}>
                  <td>{visit.pupc_first_name} {visit.pupc_last_name}</td>
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
      ) : (
        <div className="no-visits-message">
          <i className='bx bx-calendar-x'></i>
          <p>No visit requests found. Click "Request Visit" to schedule a visit.</p>
        </div>
      )}

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