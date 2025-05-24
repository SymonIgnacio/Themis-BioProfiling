import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './SystemConfig.css';

const SystemConfig = () => {
  const [config, setConfig] = useState({
    systemName: 'Themis BioProfiling',
    dataRetentionDays: 365,
    maxLoginAttempts: 5,
    sessionTimeoutMinutes: 30,
    enableAuditLog: true,
    enableTwoFactorAuth: false
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    
    if (!token) {
      navigate('/login');
      return;
    }

    // Check if user is admin
    if (userData.role !== 'admin') {
      navigate('/dashboard');
      return;
    }

    const fetchConfig = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/admin/config', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        setConfig(response.data);
      } catch (error) {
        console.error('Error fetching system configuration:', error);
        setError('Failed to load system configuration. Using defaults.');
      } finally {
        setLoading(false);
      }
    };

    fetchConfig();
  }, [navigate]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setConfig({
      ...config,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    
    const token = localStorage.getItem('token');
    
    try {
      await axios.put('http://localhost:5000/api/admin/config', 
        config,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      setSuccess('System configuration updated successfully');
    } catch (error) {
      console.error('Error updating system configuration:', error);
      setError('Failed to update system configuration. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading configuration...</div>;
  }

  return (
    <div className="system-config-container">
      <h2>System Configuration</h2>
      
      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}
      
      <form onSubmit={handleSubmit} className="config-form">
        <div className="form-group">
          <label htmlFor="systemName">System Name</label>
          <input
            type="text"
            id="systemName"
            name="systemName"
            value={config.systemName}
            onChange={handleChange}
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="dataRetentionDays">Data Retention (days)</label>
          <input
            type="number"
            id="dataRetentionDays"
            name="dataRetentionDays"
            value={config.dataRetentionDays}
            onChange={handleChange}
            min="30"
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="maxLoginAttempts">Max Login Attempts</label>
          <input
            type="number"
            id="maxLoginAttempts"
            name="maxLoginAttempts"
            value={config.maxLoginAttempts}
            onChange={handleChange}
            min="1"
            max="10"
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="sessionTimeoutMinutes">Session Timeout (minutes)</label>
          <input
            type="number"
            id="sessionTimeoutMinutes"
            name="sessionTimeoutMinutes"
            value={config.sessionTimeoutMinutes}
            onChange={handleChange}
            min="5"
            required
          />
        </div>
        
        <div className="form-group checkbox">
          <input
            type="checkbox"
            id="enableAuditLog"
            name="enableAuditLog"
            checked={config.enableAuditLog}
            onChange={handleChange}
          />
          <label htmlFor="enableAuditLog">Enable Audit Logging</label>
        </div>
        
        <div className="form-group checkbox">
          <input
            type="checkbox"
            id="enableTwoFactorAuth"
            name="enableTwoFactorAuth"
            checked={config.enableTwoFactorAuth}
            onChange={handleChange}
          />
          <label htmlFor="enableTwoFactorAuth">Enable Two-Factor Authentication</label>
        </div>
        
        <div className="form-actions">
          <button type="submit" className="save-button" disabled={saving}>
            {saving ? 'Saving...' : 'Save Configuration'}
          </button>
          <button type="button" className="cancel-button" onClick={() => navigate('/admin')}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default SystemConfig;