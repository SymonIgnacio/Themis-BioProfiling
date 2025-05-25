import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './ReportsPage.css';

const ReportsPage = () => {
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchReportData = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/reports/status-changes');
        setReportData(response.data);
        setError(null);
      } catch (err) {
        console.error('Error fetching report data:', err);
        setError('Failed to load report data');
      } finally {
        setLoading(false);
      }
    };

    fetchReportData();
  }, []);

  if (loading) return <div className="loading-indicator">Loading report data...</div>;
  if (error) return <div className="error-message">{error}</div>;
  if (!reportData) return <div className="placeholder-content">No report data available</div>;

  // Prepare data for status chart
  const statusChartData = reportData.status_counts.map(item => ({
    label: item.status,
    value: item.count,
    color: getStatusColor(item.status)
  }));

  // Prepare data for category chart
  const categoryChartData = reportData.category_counts.map(item => ({
    label: item.name,
    value: item.count,
    color: getCategoryColor(item.name)
  }));

  return (
    <div className="reports-container">
      <div className="reports-header">
        <h2>System Reports</h2>
        <p>Overview of recent changes and statistics</p>
      </div>

      <div className="reports-grid">
        {/* Status Distribution Chart */}
        <div className="report-card">
          <h3>PUC Status Distribution</h3>
          <div className="chart-container">
            <div className="bar-chart">
              {statusChartData.map((item, index) => (
                <div key={index} className="chart-item">
                  <div className="chart-label">{item.label}</div>
                  <div className="chart-bar-container">
                    <div 
                      className="chart-bar" 
                      style={{ 
                        width: `${calculatePercentage(item.value, getTotalCount(statusChartData))}%`,
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

        {/* Category Distribution Chart */}
        <div className="report-card">
          <h3>Crime Category Distribution</h3>
          <div className="chart-container">
            <div className="pie-chart-container">
              <div className="pie-chart">
                {renderPieChart(categoryChartData)}
              </div>
              <div className="pie-legend">
                {categoryChartData.map((item, index) => (
                  <div key={index} className="legend-item">
                    <span className="legend-color" style={{ backgroundColor: item.color }}></span>
                    <span className="legend-label">{item.label}: {item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Recently Released PUCs */}
        <div className="report-card">
          <h3>Recently Released PUCs</h3>
          <div className="report-table-container">
            <table className="report-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Crime</th>
                  <th>Release Date</th>
                  <th>Days in Custody</th>
                </tr>
              </thead>
              <tbody>
                {reportData.released_pucs.map((puc, index) => (
                  <tr key={index}>
                    <td>{puc.name}</td>
                    <td>{puc.crime || 'N/A'}</td>
                    <td>{formatDate(puc.release_date)}</td>
                    <td>{calculateDaysInCustody(puc.arrest_date, puc.release_date)}</td>
                  </tr>
                ))}
                {reportData.released_pucs.length === 0 && (
                  <tr>
                    <td colSpan="4" className="no-data">No recently released PUCs</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recently Added PUCs */}
        <div className="report-card">
          <h3>Recently Added PUCs</h3>
          <div className="report-table-container">
            <table className="report-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Crime</th>
                  <th>Status</th>
                  <th>Added Date</th>
                </tr>
              </thead>
              <tbody>
                {reportData.recent_pucs.map((puc, index) => (
                  <tr key={index}>
                    <td>{puc.name}</td>
                    <td>{puc.crime || 'N/A'}</td>
                    <td>
                      <span className={`status-badge status-${puc.status?.toLowerCase()}`}>
                        {puc.status || 'Unknown'}
                      </span>
                    </td>
                    <td>{formatDate(puc.created_at)}</td>
                  </tr>
                ))}
                {reportData.recent_pucs.length === 0 && (
                  <tr>
                    <td colSpan="4" className="no-data">No recently added PUCs</td>
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
function getStatusColor(status) {
  switch (status?.toLowerCase()) {
    case 'in custody': return '#e74c3c';
    case 'released': return '#2ecc71';
    case 'transferred': return '#f39c12';
    case 'pending': return '#3498db';
    default: return '#95a5a6';
  }
}

function getCategoryColor(category) {
  const colors = ['#3498db', '#9b59b6', '#e67e22', '#16a085', '#2c3e50', '#c0392b'];
  const hash = category.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return colors[hash % colors.length];
}

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

function calculateDaysInCustody(arrestDate, releaseDate) {
  if (!arrestDate || !releaseDate) return 'N/A';
  
  const arrest = new Date(arrestDate);
  const release = new Date(releaseDate);
  const diffTime = Math.abs(release - arrest);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays;
}

function renderPieChart(data) {
  const total = getTotalCount(data);
  let cumulativePercentage = 0;
  
  return (
    <svg viewBox="0 0 100 100" className="pie-chart-svg">
      {data.map((item, index) => {
        const percentage = calculatePercentage(item.value, total);
        const startAngle = cumulativePercentage * 3.6; // 3.6 degrees per percentage point
        cumulativePercentage += percentage;
        const endAngle = cumulativePercentage * 3.6;
        
        return (
          <PieSlice 
            key={index}
            startAngle={startAngle} 
            endAngle={endAngle} 
            color={item.color} 
          />
        );
      })}
    </svg>
  );
}

function PieSlice({ startAngle, endAngle, color }) {
  const x1 = 50 + 50 * Math.cos(Math.PI * startAngle / 180);
  const y1 = 50 + 50 * Math.sin(Math.PI * startAngle / 180);
  const x2 = 50 + 50 * Math.cos(Math.PI * endAngle / 180);
  const y2 = 50 + 50 * Math.sin(Math.PI * endAngle / 180);
  
  const largeArcFlag = endAngle - startAngle <= 180 ? 0 : 1;
  
  const pathData = [
    `M 50 50`,
    `L ${x1} ${y1}`,
    `A 50 50 0 ${largeArcFlag} 1 ${x2} ${y2}`,
    `Z`
  ].join(' ');
  
  return <path d={pathData} fill={color} />;
}

export default ReportsPage;