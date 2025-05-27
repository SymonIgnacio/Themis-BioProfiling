import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../AdminPages/ReportsPage.css';

const OfficerReports = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [visitorStats, setVisitorStats] = useState(null);

  useEffect(() => {
    const fetchVisitorStats = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get('http://localhost:5000/api/visitor-logs/stats', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setVisitorStats(response.data);
        setError(null);
      } catch (err) {
        console.error('Error fetching visitor stats:', err);
        setError('Failed to load visitor statistics');
      } finally {
        setLoading(false);
      }
    };

    fetchVisitorStats();
  }, []);

  if (loading) return <div className="loading-indicator">Loading report data...</div>;
  if (error) return <div className="error-message">{error}</div>;
  if (!visitorStats) return <div className="placeholder-content">No report data available</div>;

  // Sample data for officer reports
  const statusData = [
    { label: 'Approved', value: visitorStats.approved || 0, color: '#2ecc71' },
    { label: 'Pending', value: visitorStats.pending || 0, color: '#f39c12' },
    { label: 'Rejected', value: visitorStats.rejected || 0, color: '#e74c3c' }
  ];

  const recentVisits = visitorStats.recent_visits || [];

  return (
    <div className="reports-container">
      <div className="reports-header">
        <h2>Officer Reports</h2>
        <p>Summary of visitor activity and approvals</p>
      </div>

      <div className="reports-grid">
        {/* Visit Status Chart */}
        <div className="report-card">
          <h3>Visit Request Status</h3>
          <div className="chart-container">
            <div className="bar-chart">
              {statusData.map((item, index) => (
                <div key={index} className="chart-item">
                  <div className="chart-label">{item.label}</div>
                  <div className="chart-bar-container">
                    <div 
                      className="chart-bar" 
                      style={{ 
                        width: `${calculatePercentage(item.value, getTotalCount(statusData))}%`,
                        backgroundColor: item.color 
                      }}
                    ></div>
                    <span className="chart-value">{item.value}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Visits */}
        <div className="report-card">
          <h3>Recent Visit Requests</h3>
          <div className="report-table-container">
            <table className="report-table">
              <thead>
                <tr>
                  <th>Visitor</th>
                  <th>PUC</th>
                  <th>Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentVisits.map((visit, index) => (
                  <tr key={index}>
                    <td>{visit.visitor_name || 'N/A'}</td>
                    <td>{visit.pupc_name || 'N/A'}</td>
                    <td>{formatDate(visit.visit_date)}</td>
                    <td>
                      <span className={`status-badge status-${visit.approval_status?.toLowerCase()}`}>
                        {visit.approval_status || 'Unknown'}
                      </span>
                    </td>
                  </tr>
                ))}
                {recentVisits.length === 0 && (
                  <tr>
                    <td colSpan="4" className="no-data">No recent visits</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper functions
function calculatePercentage(value, total) {
  if (total === 0) return 0;
  return (value / total) * 100;
}

function getTotalCount(data) {
  return data.reduce((sum, item) => sum + item.value, 0);
}

function formatDate(dateString) {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleDateString();
}

export default OfficerReports;