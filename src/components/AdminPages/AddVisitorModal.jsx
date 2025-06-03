import React, { useState } from 'react';
import axios from 'axios';
import './AdminDashboard.css';

const AddVisitorModal = ({ isOpen, onClose, pupcId }) => {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    relationship: '',
    email: '',
    phone: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [credentials, setCredentials] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);
    
    try {
      const token = localStorage.getItem('token');
      
      // Log the form data being sent
      console.log('Sending visitor data:', formData);
      
      const response = await axios.post(
        `http://localhost:5000/api/pucs/${pupcId}/visitors`, 
        formData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      console.log('Response from server:', response.data);
      
      setSuccess(true);
      setCredentials(response.data);
      
      // Reset form
      setFormData({
        first_name: '',
        last_name: '',
        relationship: '',
        email: '',
        phone: ''
      });
    } catch (err) {
      console.error('Error adding visitor:', err);
      setError(err.response?.data?.error || 'Failed to add visitor');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-container" style={{ width: '500px', maxWidth: '95%' }}>
        <div className="modal-header">
          <h2>Add Visitor</h2>
          <button className="modal-close-btn" onClick={() => onClose(false)}>
            <i className='bx bx-x'></i>
          </button>
        </div>
        
        <div className="modal-body">
          {error && <div className="error-message">{error}</div>}
          
          {success && credentials ? (
            <div className="success-message">
              <h3>Visitor Added Successfully!</h3>
              <p>An account has been created for this visitor with the following credentials:</p>
              
              <div className="credentials-box">
                <div className="credential-item">
                  <span className="credential-label">Username:</span>
                  <span className="credential-value">{credentials.username}</span>
                </div>
                <div className="credential-item">
                  <span className="credential-label">Password:</span>
                  <span className="credential-value">{credentials.password}</span>
                </div>
              </div>
              
              <p className="note">Please share these credentials with the visitor.</p>
              
              <button 
                type="button" 
                className="save-button" 
                onClick={() => onClose(true)}
              >
                Close
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="visitor-form">
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="first_name">First Name:</label>
                  <input 
                    type="text" 
                    id="first_name" 
                    name="first_name" 
                    value={formData.first_name} 
                    onChange={handleChange}
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
                    required
                  />
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="relationship">Relationship:</label>
                  <input 
                    type="text" 
                    id="relationship" 
                    name="relationship" 
                    value={formData.relationship} 
                    onChange={handleChange}
                    placeholder="e.g. Family, Friend"
                  />
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="email">Email:</label>
                  <input 
                    type="email" 
                    id="email" 
                    name="email" 
                    value={formData.email} 
                    onChange={handleChange}
                  />
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="phone">Phone:</label>
                  <input 
                    type="tel" 
                    id="phone" 
                    name="phone" 
                    value={formData.phone} 
                    onChange={handleChange}
                  />
                </div>
              </div>
              
              <div className="form-actions">
                <button 
                  type="submit" 
                  className="save-button" 
                  disabled={loading}
                >
                  {loading ? 'Adding...' : 'Add Visitor'}
                </button>
                <button 
                  type="button" 
                  className="cancel-button" 
                  onClick={() => onClose(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default AddVisitorModal;