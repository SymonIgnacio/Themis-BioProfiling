import React, { useState } from 'react';
import './AdminDashboard.css';

const UserModal = ({ isOpen, onClose, onSave, mode = 'add', user = null }) => {
  const [formData, setFormData] = useState({
    username: user?.username || '',
    password: '',
    role_id: user?.role_id || '2', // Default to officer role
    email: user?.email || ''
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      await onSave(formData);
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save user');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-container">
        <div className="modal-header">
          <h2>{mode === 'add' ? 'Add New User' : 'Edit User'}</h2>
          <button className="modal-close-btn" onClick={onClose}>
            <i className='bx bx-x'></i>
          </button>
        </div>
        
        <div className="modal-body">
          {error && <div className="error-message">{error}</div>}
          
          <form onSubmit={handleSubmit} className="user-form">
            <div className="form-group">
              <label htmlFor="username">Username:</label>
              <input 
                type="text" 
                id="username" 
                name="username" 
                value={formData.username} 
                onChange={handleChange}
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="password">
                Password: {mode === 'edit' && <span className="optional-text">(Leave blank to keep current)</span>}
              </label>
              <input 
                type="password" 
                id="password" 
                name="password" 
                value={formData.password} 
                onChange={handleChange}
                required={mode === 'add'}
              />
            </div>
            
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
            
            <div className="form-group">
              <label htmlFor="role_id">Role:</label>
              <select 
                id="role_id" 
                name="role_id" 
                value={formData.role_id} 
                onChange={handleChange}
                required
              >
                <option value="1">Admin</option>
                <option value="2">Officer</option>
                <option value="3">Visitor</option>
              </select>
            </div>
            
            <div className="form-actions">
              <button 
                type="submit" 
                className="save-button" 
                disabled={loading}
              >
                {loading ? 'Saving...' : 'Save User'}
              </button>
              <button 
                type="button" 
                className="cancel-button" 
                onClick={onClose}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default UserModal;