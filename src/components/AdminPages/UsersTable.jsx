import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './AdminDashboard.css';

const UsersTable = ({ onEdit }) => {
  const [users, setUsers] = useState([]);
  const [approvedVisitors, setApprovedVisitors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      // Fetch users
      const usersResponse = await axios.get('http://localhost:5000/api/users', { headers });
      setUsers(usersResponse.data);

      // Fetch approved visitors
      const visitorsResponse = await axios.get('http://localhost:5000/api/approved-visitors', { headers });
      setApprovedVisitors(visitorsResponse.data);

      setError(null);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load users data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Combine and filter data
  const filteredData = [...users, ...approvedVisitors].filter(item => {
    if (!searchTerm) return true;
    
    const searchTermLower = searchTerm.toLowerCase();
    return (
      (item.username && item.username.toLowerCase().includes(searchTermLower)) ||
      (item.full_name && item.full_name.toLowerCase().includes(searchTermLower)) ||
      (item.email && item.email.toLowerCase().includes(searchTermLower)) ||
      (item.role_name && item.role_name.toLowerCase().includes(searchTermLower))
    );
  });

  const handleDelete = async (user) => {
    if (!window.confirm(`Are you sure you want to delete ${user.username}?`)) {
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      
      await axios.delete(`http://localhost:5000/api/users/${user.user_id}`, { headers });
      
      alert('User deleted successfully');
      
      // Refresh data
      fetchData();
    } catch (err) {
      console.error('Error deleting user:', err);
      alert(err.response?.data?.error || 'Failed to delete user');
    }
  };

  const handleBlacklist = async (user) => {
    if (!user.visitor_id) {
      alert('Cannot blacklist this user - no visitor ID found');
      return;
    }
    
    const reason = prompt('Enter reason for blacklisting this visitor:');
    if (reason === null) return; // User cancelled
    
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      
      await axios.post('http://localhost:5000/api/blacklist', {
        visitor_id: user.visitor_id,
        reason: reason || 'No reason provided'
      }, { headers });
      
      alert('Visitor has been blacklisted');
      
      // Refresh data
      fetchData();
    } catch (err) {
      console.error('Error blacklisting visitor:', err);
      alert(err.response?.data?.error || 'Failed to blacklist visitor');
    }
  };

  if (loading) {
    return <div className="loading-indicator">Loading users data...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  return (
    <div>
      <div className="data-table-controls">
        <div className="search-container">
          <input
            type="text"
            placeholder="Search users..."
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
            <tr>
              <th>ID</th>
              <th>Username</th>
              <th>Full Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.map(user => (
              <tr key={user.user_id || user.approval_id}>
                <td>{user.user_id || user.approval_id}</td>
                <td>{user.username}</td>
                <td>{user.full_name || '-'}</td>
                <td>{user.email || '-'}</td>
                <td>{user.role_name || 'Visitor'}</td>
                <td>{user.created_at ? new Date(user.created_at).toLocaleDateString() : '-'}</td>
                <td>
                  <button 
                    className="action-btn edit-btn"
                    onClick={() => onEdit && onEdit(user)}
                    title="Edit User"
                  >
                    <i className='bx bx-edit'></i>
                  </button>
                  <button 
                    className="action-btn delete-btn"
                    onClick={() => handleDelete(user)}
                    title="Delete User"
                  >
                    <i className='bx bx-trash'></i>
                  </button>
                  {(user.role_id === 3 || user.role_name === 'Visitor' || !user.role_name) && user.visitor_id && (
                    <button 
                      className="action-btn blacklist-btn"
                      onClick={() => handleBlacklist(user)}
                      title="Blacklist Visitor"
                    >
                      <i className='bx bx-block'></i>
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UsersTable;
  useEffect(() => {
    console.log('Users:', users);
    console.log('Approved Visitors:', approvedVisitors);
  }, [users, approvedVisitors]);