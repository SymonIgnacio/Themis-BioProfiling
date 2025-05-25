import React, { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';

const AccountSection = () => {
  const { currentUser, logout } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  const [formData, setFormData] = useState({
    username: currentUser?.username || '',
    email: currentUser?.email || '',
    current_password: '',
    new_password: '',
    confirm_password: ''
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    // Validate passwords match
    if (formData.new_password && formData.new_password !== formData.confirm_password) {
      setError('New passwords do not match');
      setLoading(false);
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      
      // Only include fields that have values
      const dataToSubmit = {};
      if (formData.username !== currentUser?.username) dataToSubmit.username = formData.username;
      if (formData.email !== currentUser?.email) dataToSubmit.email = formData.email;
      if (formData.new_password) {
        dataToSubmit.current_password = formData.current_password;
        dataToSubmit.new_password = formData.new_password;
      }
      
      // Only submit if there are changes
      if (Object.keys(dataToSubmit).length > 0) {
        await axios.put('http://localhost:5000/api/update-account', dataToSubmit, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        setSuccess('Account updated successfully');
        
        // Clear password fields
        setFormData(prev => ({
          ...prev,
          current_password: '',
          new_password: '',
          confirm_password: ''
        }));
        
        // If username was changed, logout after 2 seconds
        if (dataToSubmit.username) {
          setTimeout(() => {
            logout();
          }, 2000);
        }
      } else {
        setError('No changes detected');
      }
    } catch (err) {
      console.error('Error updating account:', err);
      setError(err.response?.data?.message || 'Failed to update account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="account-section">
      <h2>Account Settings</h2>
      
      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}
      
      <form onSubmit={handleSubmit} className="account-form">
        <div className="form-group">
          <label htmlFor="username">Username:</label>
          <input 
            type="text" 
            id="username" 
            name="username" 
            value={formData.username} 
            onChange={handleInputChange}
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="email">Email:</label>
          <input 
            type="email" 
            id="email" 
            name="email" 
            value={formData.email} 
            onChange={handleInputChange}
          />
        </div>
        
        <div className="password-section">
          <h3>Change Password</h3>
          
          <div className="form-group">
            <label htmlFor="current_password">Current Password:</label>
            <input 
              type="password" 
              id="current_password" 
              name="current_password" 
              value={formData.current_password} 
              onChange={handleInputChange}
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="new_password">New Password:</label>
            <input 
              type="password" 
              id="new_password" 
              name="new_password" 
              value={formData.new_password} 
              onChange={handleInputChange}
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="confirm_password">Confirm New Password:</label>
            <input 
              type="password" 
              id="confirm_password" 
              name="confirm_password" 
              value={formData.confirm_password} 
              onChange={handleInputChange}
            />
          </div>
        </div>
        
        <div className="form-actions">
          <button type="submit" className="save-button" disabled={loading}>
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AccountSection;