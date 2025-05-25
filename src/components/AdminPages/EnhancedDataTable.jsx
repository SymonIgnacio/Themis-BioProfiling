import React, { useState, useEffect } from 'react';
import './AdminDashboard.css';

const EnhancedDataTable = ({ 
  loading, 
  error, 
  data, 
  type, 
  loadingMessage, 
  errorMessage, 
  emptyMessage, 
  icon,
  onView,
  onEdit,
  onAdd
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredData, setFilteredData] = useState([]);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' });

  useEffect(() => {
    if (!data) return;
    
    let filtered = [...data];
    
    if (searchTerm) {
      filtered = data.filter(item => {
        if (type === 'pucs') {
          return (
            `${item.first_name} ${item.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (item.crime_category && item.crime_category.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (item.status && item.status.toLowerCase().includes(searchTerm.toLowerCase()))
          );
        }
        // Add other type filters as needed
        return true;
      });
    }
    
    if (sortConfig.key) {
      filtered.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    
    setFilteredData(filtered);
  }, [data, searchTerm, sortConfig, type]);

  const requestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const renderTableHeader = () => {
    switch (type) {
      case 'pucs':
        return (
          <tr>
            <th onClick={() => requestSort('pupc_id')}>ID</th>
            <th onClick={() => requestSort('last_name')}>Name</th>
            <th onClick={() => requestSort('gender')}>Gender</th>
            <th onClick={() => requestSort('age')}>Age</th>
            <th onClick={() => requestSort('status')}>Status</th>
            <th onClick={() => requestSort('crime_category')}>Category</th>
            <th onClick={() => requestSort('arrest_date')}>Arrest Date</th>
            <th>Actions</th>
          </tr>
        );
      // Other cases remain the same as in DataTable
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
              <button 
                className="action-btn view-btn"
                onClick={() => onView && onView(puc)}
              >
                <i className='bx bx-show'></i>
              </button>
              <button 
                className="action-btn edit-btn"
                onClick={() => onEdit && onEdit(puc)}
              >
                <i className='bx bx-edit'></i>
              </button>
            </td>
          </tr>
        ));
      // Other cases remain the same as in DataTable
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
    <>
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
        
        {type === 'pucs' && (
          <button 
            onClick={() => onAdd && onAdd()}
            style={{
              padding: '10px 16px',
              backgroundColor: '#2ecc71',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              gap: '5px'
            }}
          >
            <i className='bx bx-plus'></i> Add New PUC
          </button>
        )}
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
    </>
  );
};

export default EnhancedDataTable;