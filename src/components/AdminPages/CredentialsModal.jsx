import React, { useState } from 'react';
import './AdminDashboard.css';

const CredentialsModal = ({ isOpen, onClose, visitors }) => {
  const [showPasswords, setShowPasswords] = useState({});

  if (!isOpen) return null;

  const togglePassword = (id) => {
    setShowPasswords(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  return (
    <div className="modal-overlay">
      <div className="modal-container" style={{ width: '600px', maxWidth: '95%' }}>
        <div className="modal-header">
          <h2>Generated Visitor Credentials</h2>
          <button className="modal-close-btn" onClick={onClose}>
            <i className='bx bx-x'></i>
          </button>
        </div>
        
        <div className="modal-body">
          <p className="help-text">
            The following credentials have been generated for the approved visitors. 
            Please share these with the respective visitors.
          </p>
          
          <table className="credentials-table">
            <thead>
              <tr>
                <th>Visitor Name</th>
                <th>Username</th>
                <th>Password</th>
              </tr>
            </thead>
            <tbody>
              {visitors.map((visitor) => (
                <tr key={visitor.approval_id || visitor.visitor_id}>
                  <td>{`${visitor.first_name} ${visitor.last_name}`}</td>
                  <td>{visitor.username}</td>
                  <td>
                    <div className="password-field">
                      {showPasswords[visitor.approval_id || visitor.visitor_id] 
                        ? visitor.password 
                        : '••••••••'}
                      <button 
                        type="button" 
                        className="password-toggle-btn"
                        onClick={() => togglePassword(visitor.approval_id || visitor.visitor_id)}
                      >
                        {showPasswords[visitor.approval_id || visitor.visitor_id] ? 'Hide' : 'Show'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          <div className="form-actions" style={{ marginTop: '20px' }}>
            <button type="button" className="save-button" onClick={onClose}>
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CredentialsModal;