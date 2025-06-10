import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './ReportsPage.css';

const ReportsPage = () => {
  const [reportData, setReportData] = useState(null);
  const [pucData, setPucData] = useState([]);
  const [visitorData, setVisitorData] = useState([]);
  const [activeTab, setActiveTab] = useState('puc');
  const [loading, setLoading] = useState(true);
  const [exportLoading, setExportLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    puc: {
      status: '',
      dateRange: 'all',
      category: ''
    },
    visitor: {
      status: '',
      dateRange: 'all'
    }
  });

  useEffect(() => {
    const fetchReportData = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get('http://localhost:5000/api/reports/status-changes', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setReportData(response.data);
        
        // Also fetch PUC and Visitation data for tables
        const pucResponse = await axios.get('http://localhost:5000/api/pucs', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setPucData(pucResponse.data);
        
        // Fetch visitor logs data
        const visitorResponse = await axios.get('http://localhost:5000/api/visitor-logs', {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        // Process visitor data to ensure it has all required fields
        const processedVisitorData = visitorResponse.data.map(visitor => ({
          ...visitor,
          visitor_name: visitor.visitor_name || 
                      (visitor.visitor_first_name && visitor.visitor_last_name ? 
                       `${visitor.visitor_first_name} ${visitor.visitor_last_name}` : 'N/A'),
          puc_name: visitor.puc_name || 
                   (visitor.pupc_first_name && visitor.pupc_last_name ? 
                    `${visitor.pupc_first_name} ${visitor.pupc_last_name}` : 'N/A'),
          status: visitor.approval_status || visitor.status || 'Unknown',
          relationship: visitor.relationship || 'N/A'
        }));
        
        setVisitorData(processedVisitorData);
        console.log('Visitor data processed:', processedVisitorData);
        
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

  // Handle filter changes
  const handleFilterChange = (type, field, value) => {
    setFilters(prev => ({
      ...prev,
      [type]: {
        ...prev[type],
        [field]: value
      }
    }));
  };
  
  // Handle export
  const handleExport = async (type, format) => {
    try {
      setExportLoading(true);
      
      // Build query parameters based on current filters
      const params = new URLSearchParams();
      
      if (type === 'puc') {
        if (filters.puc.status) params.append('status', filters.puc.status);
        if (filters.puc.category) params.append('category', filters.puc.category);
        params.append('dateRange', filters.puc.dateRange);
      } else if (type === 'visitor') {
        if (filters.visitor.status) params.append('status', filters.visitor.status);
        params.append('dateRange', filters.visitor.dateRange);
      }
      
      // Get token for authentication
      const token = localStorage.getItem('token');
      
      // Create URL for export endpoint
      const url = `http://localhost:5000/api/export/${type}/${format}?${params.toString()}`;
      
      // Create a hidden iframe to handle the download without redirecting
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      document.body.appendChild(iframe);
      
      // Set up a timeout to handle potential errors
      const timeoutId = setTimeout(() => {
        document.body.removeChild(iframe);
        setExportLoading(false);
        console.error('Export request timed out');
      }, 30000); // 30 second timeout
      
      // Set up the iframe to load the export URL
      iframe.onload = () => {
        clearTimeout(timeoutId);
        document.body.removeChild(iframe);
        setExportLoading(false);
      };
      
      // Add token to URL as a query parameter for authentication
      iframe.src = `${url}&token=${token}`;
      
    } catch (error) {
      console.error(`Error exporting ${type} as ${format}:`, error);
      setExportLoading(false);
    }
  };

  // Filter data based on current filters
  const filteredPucData = pucData.filter(puc => {
    // Skip null/undefined PUCs
    if (!puc) return false;
    
    // Case-insensitive status comparison with flexible matching
    if (filters.puc.status && puc.status) {
      const filterStatus = filters.puc.status.toLowerCase().trim();
      const pucStatus = puc.status.toLowerCase().trim();
      
      // Handle common status variations
      if (filterStatus === "in custody") {
        if (!(pucStatus === "in custody" || pucStatus === "incustody" || 
              pucStatus === "in_custody" || pucStatus === "in-custody")) {
          return false;
        }
      } 
      else if (filterStatus === "released") {
        if (pucStatus !== "released") {
          return false;
        }
      }
      else if (filterStatus === "transferred") {
        if (!(pucStatus === "transferred" || pucStatus === "transfered")) {
          return false;
        }
      }
      else if (filterStatus === "pending") {
        if (pucStatus !== "pending") {
          return false;
        }
      }
      else if (pucStatus !== filterStatus) {
        return false;
      }
    }
    
    // Category comparison - make case insensitive
    if (filters.puc.category && puc.category_name) {
      if (puc.category_name.toLowerCase() !== filters.puc.category.toLowerCase()) {
        return false;
      }
    }
    
    // Date range filtering
    if (filters.puc.dateRange !== 'all' && puc.created_at) {
      const date = new Date(puc.created_at);
      const now = new Date();
      
      if (filters.puc.dateRange === 'today') {
        return date.toDateString() === now.toDateString();
      } else if (filters.puc.dateRange === 'week') {
        const weekAgo = new Date();
        weekAgo.setDate(now.getDate() - 7);
        return date >= weekAgo;
      } else if (filters.puc.dateRange === 'month') {
        const monthAgo = new Date();
        monthAgo.setMonth(now.getMonth() - 1);
        return date >= monthAgo;
      }
    }
    
    return true;
  });

  const filteredVisitorData = visitorData.filter(visitor => {
    // Skip null/undefined visitors
    if (!visitor) return false;
    
    // Case-insensitive status comparison with flexible matching
    if (filters.visitor.status && visitor.status) {
      const filterStatus = filters.visitor.status.toLowerCase().trim();
      const visitorStatus = visitor.status.toLowerCase().trim();
      
      // Handle common status variations
      if (filterStatus === "approved") {
        if (visitorStatus !== "approved") {
          return false;
        }
      } 
      else if (filterStatus === "pending") {
        if (visitorStatus !== "pending") {
          return false;
        }
      }
      else if (filterStatus === "rejected") {
        if (!(visitorStatus === "rejected" || visitorStatus === "denied")) {
          return false;
        }
      }
      else if (filterStatus === "completed") {
        if (visitorStatus !== "completed") {
          return false;
        }
      }
      else if (visitorStatus !== filterStatus) {
        return false;
      }
    }
    
    if (filters.visitor.dateRange !== 'all') {
      const date = new Date(visitor.visit_date);
      const now = new Date();
      
      if (filters.visitor.dateRange === 'today') {
        return date.toDateString() === now.toDateString();
      } else if (filters.visitor.dateRange === 'week') {
        const weekAgo = new Date();
        weekAgo.setDate(now.getDate() - 7);
        return date >= weekAgo;
      } else if (filters.visitor.dateRange === 'month') {
        const monthAgo = new Date();
        monthAgo.setMonth(now.getMonth() - 1);
        return date >= monthAgo;
      }
    }
    
    return true;
  });

  return (
    <div className="reports-container">
      <div className="reports-header">
        <h2>System Reports</h2>
        <p>Overview of statistics and data analysis</p>
        
        <div className="reports-tabs">
          <button 
            className={`tab-button ${activeTab === 'puc' ? 'active' : ''}`}
            onClick={() => setActiveTab('puc')}
          >
            PUC Reports
          </button>
          <button 
            className={`tab-button ${activeTab === 'visitor' ? 'active' : ''}`}
            onClick={() => setActiveTab('visitor')}
          >
            Visitation Reports
          </button>
          <button 
            className={`tab-button ${activeTab === 'charts' ? 'active' : ''}`}
            onClick={() => setActiveTab('charts')}
          >
            Charts & Analytics
          </button>
        </div>
      </div>

      {activeTab === 'charts' && reportData && (
        <div className="reports-grid">
          <div className="export-buttons charts-export">
            <button 
              className="export-button"
              onClick={() => handleExport('analytics', 'pdf')}
              disabled={exportLoading}
            >
              <i className='bx bxs-file-pdf'></i> Export PDF
            </button>
          </div>
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
      )}

      {activeTab === 'puc' && (
        <div className="report-section">
          <div className="filter-container">
            <div className="filter-group">
              <label>Status:</label>
              <select 
                value={filters.puc.status} 
                onChange={(e) => handleFilterChange('puc', 'status', e.target.value)}
              >
                <option value="">All Statuses</option>
                <option value="In Custody">In Custody</option>
                <option value="Released">Released</option>
                <option value="Transferred">Transferred</option>
                <option value="Pending">Pending</option>
              </select>
            </div>
            
            <div className="filter-group">
              <label>Date Range:</label>
              <select 
                value={filters.puc.dateRange} 
                onChange={(e) => handleFilterChange('puc', 'dateRange', e.target.value)}
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="week">Last 7 Days</option>
                <option value="month">Last 30 Days</option>
              </select>
            </div>
            
            <div className="filter-group">
              <label>Category:</label>
              <select 
                value={filters.puc.category} 
                onChange={(e) => handleFilterChange('puc', 'category', e.target.value)}
              >
                <option value="">All Categories</option>
                <option value="Crimes Against Persons">Crimes Against Persons</option>
                <option value="Crimes Against Property">Crimes Against Property</option>
                <option value="Drug-Related">Drug Related</option>
              </select>
            </div>
            
            <div className="export-buttons">
              <button 
                className="export-button"
                onClick={() => handleExport('puc', 'pdf')}
              >
                <i className='bx bxs-file-pdf'></i> Export PDF
              </button>
            </div>
          </div>
          
          <div className="report-table-container full-width">
            <h3>PUC Records</h3>
            <table className="report-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Crime</th>
                  <th>Status</th>
                  <th>Arrest Date</th>
                  <th>Release Date</th>
                  <th>Days in Custody</th>
                </tr>
              </thead>
              <tbody>
                {filteredPucData.map((puc, index) => (
                  <tr key={index}>
                    <td>{puc.name || puc.full_name || `${puc.first_name} ${puc.last_name}` || 'N/A'}</td>
                    <td>{puc.crime_name || puc.crime_type_name || 'N/A'}</td>
                    <td>
                      <span className={`status-badge status-${puc.status?.toLowerCase()}`}>
                        {puc.status || 'Unknown'}
                      </span>
                    </td>
                    <td>{formatDate(puc.arrest_date)}</td>
                    <td>{puc.release_date ? formatDate(puc.release_date) : 'N/A'}</td>
                    <td>{puc.release_date ? calculateDaysInCustody(puc.arrest_date, puc.release_date) : 'Current'}</td>
                  </tr>
                ))}
                {filteredPucData.length === 0 && (
                  <tr>
                    <td colSpan="6" className="no-data">No PUC records match the selected filters</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'visitor' && (
        <div className="report-section">
          <div className="filter-container">
            <div className="filter-group">
              <label>Status:</label>
              <select 
                value={filters.visitor.status} 
                onChange={(e) => handleFilterChange('visitor', 'status', e.target.value)}
              >
                <option value="">All Statuses</option>
                <option value="Approved">Approved</option>
                <option value="Pending">Pending</option>
                <option value="Rejected">Rejected</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
            
            <div className="filter-group">
              <label>Date Range:</label>
              <select 
                value={filters.visitor.dateRange} 
                onChange={(e) => handleFilterChange('visitor', 'dateRange', e.target.value)}
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="week">Last 7 Days</option>
                <option value="month">Last 30 Days</option>
              </select>
            </div>
            
            <div className="export-buttons">
              <button 
                className="export-button"
                onClick={() => handleExport('visitor', 'pdf')}
              >
                <i className='bx bxs-file-pdf'></i> Export PDF
              </button>
            </div>
          </div>
          
          <div className="report-table-container full-width">
            <h3>Visitation Records</h3>
            <table className="report-table">
              <thead>
                <tr>
                  <th>Visitor Name</th>
                  <th>PUC Name</th>
                  <th>Visit Date</th>
                  <th>Status</th>
                  <th>Visit Time</th>
                  <th>Purpose</th>
                </tr>
              </thead>
              <tbody>
                {filteredVisitorData.map((visit, index) => (
                  <tr key={index}>
                    <td>{visit.visitor_name || `${visit.visitor_first_name || ''} ${visit.visitor_last_name || ''}`.trim() || 'N/A'}</td>
                    <td>{visit.puc_name || `${visit.pupc_first_name || ''} ${visit.pupc_last_name || ''}`.trim() || 'N/A'}</td>
                    <td>{formatDate(visit.visit_date)}</td>
                    <td>
                      <span className={`status-badge status-${(visit.status || visit.approval_status || '').toLowerCase()}`}>
                        {visit.status || visit.approval_status || 'Unknown'}
                      </span>
                    </td>
                    <td>{visit.visit_time || 'N/A'}</td>
                    <td>{visit.purpose || 'N/A'}</td>
                  </tr>
                ))}
                {filteredVisitorData.length === 0 && (
                  <tr>
                    <td colSpan="6" className="no-data">No visitation records match the selected filters</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

// Helper functions
function getStatusColor(status) {
  if (!status) return '#95a5a6';
  
  const statusLower = status.toLowerCase();
  switch (statusLower) {
    case 'in custody': return '#e74c3c';
    case 'released': return '#2ecc71';
    case 'transferred': return '#f39c12';
    case 'transfered': return '#f39c12'; // Handle misspelling in database
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