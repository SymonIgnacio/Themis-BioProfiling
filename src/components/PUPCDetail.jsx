import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './PUPCDetail.css';

const PUPCDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [pupc, setPUPC] = useState(null);
  const [statusHistory, setStatusHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [categories, setCategories] = useState([]);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    gender: '',
    age: '',
    arrest_date: '',
    status: '',
    category_id: '',
    mugshot_path: ''
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        
        // Fetch PUPC details
        const pupcResponse = await axios.get(`http://localhost:5000/api/pupcs/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        // Fetch status history
        const historyResponse = await axios.get(`http://localhost:5000/api/pupcs/${id}/history`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        // Fetch categories for dropdown
        const categoriesResponse = await axios.get('http://localhost:5000/api/categories', {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        setPUPC(pupcResponse.data);
        setStatusHistory(historyResponse.data);
        setCategories(categoriesResponse.data);
        
        // Initialize form data with PUPC details
        setFormData({
          first_name: pupcResponse.data.first_name || '',
          last_name: pupcResponse.data.last_name || '',
          gender: pupcResponse.data.gender || '',
          age: pupcResponse.data.age || '',
          arrest_date: pupcResponse.data.arrest_date || '',
          status: pupcResponse.data.status || '',
          category_id: pupcResponse.data.category_id || '',
          mugshot_path: pupcResponse.data.mugshot_path || ''
        });
      } catch (err) {
        setError('Failed to fetch PUPC details');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const token = localStorage.getItem('token');
      await axios.put(`http://localhost:5000/api/pupcs/${id}`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Update local state
      setPUPC(prev => ({ ...prev, ...formData }));
      setEditMode(false);
    } catch (err) {
      console.error('Failed to update PUPC:', err);
      alert('Failed to update PUPC. Please try again.');
    }
  };

  const handleStatusChange = async (newStatus) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`http://localhost:5000/api/pupcs/${id}/status`, { status: newStatus }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Update local state
      setPUPC(prev => ({ ...prev, status: newStatus }));
      setFormData(prev => ({ ...prev, status: newStatus }));
      
      // Fetch updated status history
      const historyResponse = await axios.get(`http://localhost:5000/api/pupcs/${id}/history`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStatusHistory(historyResponse.data);
    } catch (err) {
      console.error('Failed to update status:', err);
      alert('Failed to update status. Please try again.');
    }
  };

  if (loading) return <div className="loading">Loading...</div>;
  if (error) return <div className="error">{error}</div>;
  if (!pupc) return <div className="error">PUPC not found</div>;

  return (
    <div className="pupc-detail-container">
      <div className="pupc-detail-header">
        <h2>{pupc.first_name} {pupc.last_name}</h2>
        <div className="header-actions">
          <button onClick={() => navigate('/pupcs')} className="back-button">
            Back to List
          </button>
          {!editMode ? (
            <button onClick={() => setEditMode(true)} className="edit-button">
              Edit Details
            </button>
          ) : (
            <button onClick={() => setEditMode(false)} className="cancel-button">
              Cancel
            </button>
          )}
        </div>
      </div>
      
      <div className="pupc-detail-content">
        <div className="pupc-info-card">
          {editMode ? (
            <form onSubmit={handleSubmit} className="edit-form">
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="first_name">First Name:</label>
                  <input 
                    type="text" 
                    id="first_name" 
                    name="first_name" 
                    value={formData.first_name} 
                    onChange={handleInputChange}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="last_name">Last Name:</label>
                  <input 
                    type="text" 
                    id="last_name" 
                    name="last_name" 
                    value={formData.last_name} 
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="gender">Gender:</label>
                  <select 
                    id="gender" 
                    name="gender" 
                    value={formData.gender} 
                    onChange={handleInputChange}
                  >
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                
                <div className="form-group">
                  <label htmlFor="age">Age:</label>
                  <input 
                    type="number" 
                    id="age" 
                    name="age" 
                    value={formData.age} 
                    onChange={handleInputChange}
                    min="0"
                  />
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="arrest_date">Arrest Date:</label>
                  <input 
                    type="date" 
                    id="arrest_date" 
                    name="arrest_date" 
                    value={formData.arrest_date} 
                    onChange={handleInputChange}
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="category_id">Crime Category:</label>
                  <select 
                    id="category_id" 
                    name="category_id" 
                    value={formData.category_id} 
                    onChange={handleInputChange}
                  >
                    <option value="">Select Category</option>
                    {categories.map(category => (
                      <option key={category.category_id} value={category.category_id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="mugshot_path">Mugshot URL:</label>
                  <input 
                    type="text" 
                    id="mugshot_path" 
                    name="mugshot_path" 
                    value={formData.mugshot_path} 
                    onChange={handleInputChange}
                  />
                </div>
              </div>
              
              <div className="form-actions">
                <button type="submit" className="save-button">Save Changes</button>
              </div>
            </form>
          ) : (
            <div className="pupc-details">
              <div className="pupc-image-container">
                {pupc.mugshot_path ? (
                  <img src={pupc.mugshot_path} alt={`${pupc.first_name} ${pupc.last_name}`} className="pupc-image" />
                ) : (
                  <div className="no-image">No Image Available</div>
                )}
              </div>
              
              <div className="pupc-info">
                <div className="info-row">
                  <div className="info-item">
                    <span className="label">ID:</span>
                    <span className="value">{pupc.pupc_id}</span>
                  </div>
                  <div className="info-item">
                    <span className="label">Status:</span>
                    <span className={`value status-${pupc.status?.toLowerCase()}`}>{pupc.status || 'N/A'}</span>
                  </div>
                </div>
                
                <div className="info-row">
                  <div className="info-item">
                    <span className="label">Gender:</span>
                    <span className="value">{pupc.gender || 'N/A'}</span>
                  </div>
                  <div className="info-item">
                    <span className="label">Age:</span>
                    <span className="value">{pupc.age || 'N/A'}</span>
                  </div>
                </div>
                
                <div className="info-row">
                  <div className="info-item">
                    <span className="label">Arrest Date:</span>
                    <span className="value">{pupc.arrest_date || 'N/A'}</span>
                  </div>
                  <div className="info-item">
                    <span className="label">Crime Category:</span>
                    <span className="value">{pupc.category_name || 'N/A'}</span>
                  </div>
                </div>
                
                <div className="info-row">
                  <div className="info-item">
                    <span className="label">Created At:</span>
                    <span className="value">{new Date(pupc.created_at).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
        
        <div className="status-section">
          <h3>Status Management</h3>
          <div className="status-buttons">
            <button 
              onClick={() => handleStatusChange('In Custody')}
              className={`status-button ${pupc.status === 'In Custody' ? 'active' : ''}`}
              disabled={pupc.status === 'In Custody'}
            >
              In Custody
            </button>
            <button 
              onClick={() => handleStatusChange('Released')}
              className={`status-button ${pupc.status === 'Released' ? 'active' : ''}`}
              disabled={pupc.status === 'Released'}
            >
              Released
            </button>
            <button 
              onClick={() => handleStatusChange('Transferred')}
              className={`status-button ${pupc.status === 'Transferred' ? 'active' : ''}`}
              disabled={pupc.status === 'Transferred'}
            >
              Transferred
            </button>
          </div>
        </div>
        
        <div className="history-section">
          <h3>Status History</h3>
          <div className="history-table-container">
            <table className="history-table">
              <thead>
                <tr>
                  <th>Date & Time</th>
                  <th>Old Status</th>
                  <th>New Status</th>
                </tr>
              </thead>
              <tbody>
                {statusHistory.length > 0 ? (
                  statusHistory.map((history, index) => (
                    <tr key={index}>
                      <td>{new Date(history.changed_at).toLocaleString()}</td>
                      <td>{history.old_status || 'N/A'}</td>
                      <td>{history.new_status || 'N/A'}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="3" className="no-results">No status history available</td>
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

export default PUPCDetail;