import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './AdminDashboard.css';
import AddVisitorModal from './AddVisitorModal';

const PUCModal = ({ puc, isOpen, onClose, onSave, mode }) => {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    gender: '',
    age: '',
    arrest_date: '',
    release_date: '',
    status: 'In Custody',
    category_id: '',
    crime_id: '',
    approved_visitors: []
  });
  
  const [categories, setCategories] = useState([]);
  const [crimes, setCrimes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [visitorModalOpen, setVisitorModalOpen] = useState(false);

  useEffect(() => {
    // If editing or viewing, populate form with PUC data
    if (puc && (mode === 'edit' || mode === 'view')) {
      setFormData({
        first_name: puc.first_name || '',
        last_name: puc.last_name || '',
        gender: puc.gender || '',
        age: puc.age || '',
        arrest_date: puc.arrest_date ? puc.arrest_date.split('T')[0] : '',
        release_date: puc.release_date ? puc.release_date.split('T')[0] : '',
        status: puc.status || 'In Custody',
        category_id: puc.category_id || '',
        crime_id: puc.crime_id || '',
        approved_visitors: puc.approved_visitors || []
      });
      
      // Fetch approved visitors for this PUC
      if (puc.pupc_id) {
        fetchApprovedVisitors(puc.pupc_id);
      }
    }
  }, [puc, mode]);
  
  // Function to fetch approved visitors for a specific PUC
  const fetchApprovedVisitors = async (pupcId) => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      
      const response = await axios.get(`http://localhost:5000/api/pucs/${pupcId}`, { headers });
      
      if (response.data && response.data.approved_visitors) {
        console.log('Fetched approved visitors:', response.data.approved_visitors);
        setFormData(prev => ({
          ...prev,
          approved_visitors: response.data.approved_visitors
        }));
      }
    } catch (err) {
      console.error('Error fetching approved visitors:', err);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  // Fix for CORS issue - use axios instead of fetch
  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        const headers = { Authorization: `Bearer ${token}` };
        
        const categoriesResponse = await axios.get('http://localhost:5000/api/categories', { 
          headers 
        });
        setCategories(categoriesResponse.data);
        
        const crimesResponse = await axios.get('http://localhost:5000/api/crimes', { 
          headers 
        });
        setCrimes(crimesResponse.data);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load form data');
      }
    };
    
    fetchData();
  }, []);

  // Removed visitor-related functions

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (mode === 'view') {
      onClose();
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      await onSave(formData);
      onClose();
    } catch (err) {
      console.error('Error saving PUC:', err);
      setError(err.response?.data?.error || 'Failed to save PUC');
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  // Removed credentials modal close handler

  return (
    <>
      <div className="modal-overlay">
        <div className="modal-container" style={{ width: '700px', maxWidth: '95%' }}>
          <div className="modal-header">
            <h2>{mode === 'add' ? 'Add New PUC' : mode === 'edit' ? 'Edit PUC' : 'View PUC'}</h2>
            <button className="modal-close-btn" onClick={onClose}>
              <i className='bx bx-x'></i>
            </button>
          </div>
        
        <div className="modal-body">
          {error && <div className="error-message">{error}</div>}
          
          <form onSubmit={handleSubmit} className="puc-form">
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="first_name">First Name:</label>
                <input 
                  type="text" 
                  id="first_name" 
                  name="first_name" 
                  value={formData.first_name} 
                  onChange={handleChange}
                  disabled={mode === 'view'}
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
                  onChange={handleChange}
                  disabled={mode === 'view'}
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
                  onChange={handleChange}
                  disabled={mode === 'view'}
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
                  onChange={handleChange}
                  disabled={mode === 'view'}
                  min="1"
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
                  onChange={handleChange}
                  disabled={mode === 'view'}
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="release_date">Release Date:</label>
                <input 
                  type="date" 
                  id="release_date" 
                  name="release_date" 
                  value={formData.release_date} 
                  onChange={handleChange}
                  disabled={mode === 'view'}
                />
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="status">Status:</label>
                <select 
                  id="status" 
                  name="status" 
                  value={formData.status} 
                  onChange={handleChange}
                  disabled={mode === 'view'}
                >
                  <option value="In Custody">In Custody</option>
                  <option value="Released">Released</option>
                  <option value="Transferred">Transferred</option>
                </select>
              </div>
              
              <div className="form-group">
                <label htmlFor="category_id">Crime Category:</label>
                <select 
                  id="category_id" 
                  name="category_id" 
                  value={formData.category_id} 
                  onChange={handleChange}
                  disabled={mode === 'view'}
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
                <label htmlFor="crime_id">Crime Type:</label>
                <select 
                  id="crime_id" 
                  name="crime_id" 
                  value={formData.crime_id} 
                  onChange={handleChange}
                  disabled={mode === 'view'}
                >
                  <option value="">Select Crime</option>
                  {crimes
                    .filter(crime => !formData.category_id || crime.category_id === parseInt(formData.category_id))
                    .map(crime => (
                      <option key={crime.crime_id} value={crime.crime_id}>
                        {crime.name}
                      </option>
                    ))}
                </select>
              </div>
            </div>
            
            {/* Show visitors section when editing or viewing, not when adding */}
            {mode !== 'add' && (
              <div className="form-section">
                <h3>Approved Visitors</h3>
                <p className="help-text">Visitors who are allowed to visit this PUC.</p>
                
                {formData.approved_visitors && formData.approved_visitors.length > 0 ? (
                  <table className="visitors-table">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Relationship</th>
                        <th>Email</th>
                        <th>Phone</th>
                      </tr>
                    </thead>
                    <tbody>
                      {formData.approved_visitors.map((visitor, index) => (
                        <tr key={index}>
                          <td>{`${visitor.first_name} ${visitor.last_name}`}</td>
                          <td>{visitor.relationship || '-'}</td>
                          <td>{visitor.email || '-'}</td>
                          <td>{visitor.phone || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p className="no-visitors">No approved visitors for this PUC.</p>
                )}
                
                {mode === 'edit' && (
                  <button 
                    type="button" 
                    className="add-visitor-btn"
                    onClick={() => setVisitorModalOpen(true)}
                  >
                    <i className='bx bx-plus'></i> Add Visitor
                  </button>
                )}
              </div>
            )}
            
            <div className="form-actions">
              <button 
                type="submit" 
                className="save-button" 
                disabled={loading || mode === 'view'}
              >
                {loading ? 'Saving...' : mode === 'view' ? 'Close' : 'Save PUC'}
              </button>
              <button 
                type="button" 
                className="cancel-button" 
                onClick={onClose}
              >
                {mode === 'view' ? 'Close' : 'Cancel'}
              </button>
            </div>
          </form>
        </div>
      </div>
      </div>
      
      {/* Add Visitor Modal */}
      {mode === 'edit' && puc && (
        <AddVisitorModal 
          isOpen={visitorModalOpen}
          onClose={(refreshNeeded) => {
            setVisitorModalOpen(false);
            if (refreshNeeded && puc.pupc_id) {
              fetchApprovedVisitors(puc.pupc_id);
            }
          }}
          pupcId={puc.pupc_id}
        />
      )}
    </>
  );
};

export default PUCModal;