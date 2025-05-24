import { useState, useEffect } from 'react';
import axios from 'axios';
import './BlacklistManagement.css';

const BlacklistManagement = () => {
  const [blacklist, setBlacklist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [formData, setFormData] = useState({
    pupc_id: '',
    visitor_id: '',
    reason: ''
  });
  const [pupcs, setPUPCs] = useState([]);
  const [visitors, setVisitors] = useState([]);
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        
        // Fetch blacklist
        const blacklistResponse = await axios.get('http://localhost:5000/api/blacklist', {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        // Fetch PUPCs for dropdown
        const pupcsResponse = await axios.get('http://localhost:5000/api/pupcs', {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        // Fetch visitors for dropdown
        const visitorsResponse = await axios.get('http://localhost:5000/api/visitors', {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        setBlacklist(blacklistResponse.data);
        setPUPCs(pupcsResponse.data);
        setVisitors(visitorsResponse.data);
      } catch (err) {
        setError('Failed to fetch data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddToBlacklist = async (e) => {
    e.preventDefault();
    
    if (!formData.pupc_id || !formData.visitor_id || !formData.reason) {
      alert('Please fill all required fields');
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post('http://localhost:5000/api/blacklist', formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Add the new entry to the list
      setBlacklist(prev => [...prev, response.data]);
      
      // Reset form
      setFormData({
        pupc_id: '',
        visitor_id: '',
        reason: ''
      });
    } catch (err) {
      console.error('Failed to add to blacklist:', err);
      alert('Failed to add to blacklist. Please try again.');
    }
  };

  const handleRemoveFromBlacklist = async (blackId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5000/api/blacklist/${blackId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Remove the entry from the list
      setBlacklist(prev => prev.filter(item => item.black_id !== blackId));
    } catch (err) {
      console.error('Failed to remove from blacklist:', err);
      alert('Failed to remove from blacklist. Please try again.');
    }
  };

  const filteredBlacklist = blacklist.filter(item => {
    const pupcName = item.pupc_name || '';
    const visitorName = item.visitor_name || '';
    const reason = item.reason || '';
    
    return pupcName.toLowerCase().includes(search.toLowerCase()) || 
           visitorName.toLowerCase().includes(search.toLowerCase()) ||
           reason.toLowerCase().includes(search.toLowerCase());
  });

  if (loading) return <div className="loading">Loading...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="blacklist-container">
      <h2>Blacklist Management</h2>
      
      <div className="blacklist-form-container">
        <h3>Add to Blacklist</h3>
        <form onSubmit={handleAddToBlacklist} className="blacklist-form">
          <div className="form-group">
            <label htmlFor="pupc_id">PUPC:</label>
            <select 
              id="pupc_id"
              name="pupc_id"
              value={formData.pupc_id}
              onChange={handleInputChange}
              required
            >
              <option value="">Select PUPC</option>
              {pupcs.map(pupc => (
                <option key={pupc.pupc_id} value={pupc.pupc_id}>
                  {pupc.first_name} {pupc.last_name}
                </option>
              ))}
            </select>
          </div>
          
          <div className="form-group">
            <label htmlFor="visitor_id">Visitor:</label>
            <select 
              id="visitor_id"
              name="visitor_id"
              value={formData.visitor_id}
              onChange={handleInputChange}
              required
            >
              <option value="">Select Visitor</option>
              {visitors.map(visitor => (
                <option key={visitor.visitor_id} value={visitor.visitor_id}>
                  {visitor.first_name} {visitor.last_name}
                </option>
              ))}
            </select>
          </div>
          
          <div className="form-group">
            <label htmlFor="reason">Reason:</label>
            <textarea 
              id="reason"
              name="reason"
              value={formData.reason}
              onChange={handleInputChange}
              required
              rows="3"
            ></textarea>
          </div>
          
          <button type="submit" className="add-button">Add to Blacklist</button>
        </form>
      </div>
      
      <div className="blacklist-list-container">
        <h3>Current Blacklist</h3>
        
        <div className="search-bar">
          <input 
            type="text" 
            placeholder="Search blacklist..." 
            value={search}
            onChange={handleSearchChange}
          />
        </div>
        
        <div className="blacklist-table-container">
          <table className="blacklist-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>PUPC</th>
                <th>Visitor</th>
                <th>Reason</th>
                <th>Added Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredBlacklist.length > 0 ? (
                filteredBlacklist.map(item => (
                  <tr key={item.black_id}>
                    <td>{item.black_id}</td>
                    <td>{item.pupc_name || `ID: ${item.pupc_id}`}</td>
                    <td>{item.visitor_name || `ID: ${item.visitor_id}`}</td>
                    <td>{item.reason}</td>
                    <td>{new Date(item.added_at).toLocaleDateString()}</td>
                    <td>
                      <button 
                        onClick={() => handleRemoveFromBlacklist(item.black_id)}
                        className="remove-button"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="no-results">No blacklist entries found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default BlacklistManagement;