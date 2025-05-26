import React, { useState } from 'react';

const VisitRequestModal = ({ isOpen, onClose, onSubmit, visitorId }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const [formData, setFormData] = useState({
    pupc_name: '',
    pupc_id: '1', // Default to a valid PUC ID
    visit_date: '',
    visit_time: '',
    purpose: '',
    visitor_id: visitorId || ''
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-container">
        <div className="modal-header">
          <h2>Request Visit</h2>
          <button className="modal-close-btn" onClick={onClose}>
            <i className='bx bx-x'></i>
          </button>
        </div>
        
        <div className="modal-body">
          {error && <div className="error-message">{error}</div>}
          
          <form onSubmit={handleSubmit} className="visit-form">
            <div className="form-group">
              <label htmlFor="pupc_name">Name of Person to Visit:</label>
              <input 
                type="text" 
                id="pupc_name" 
                name="pupc_name" 
                value={formData.pupc_name} 
                onChange={handleInputChange}
                required
                placeholder="Enter the name of the person you wish to visit"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="visit_date">Visit Date:</label>
              <input 
                type="date" 
                id="visit_date" 
                name="visit_date" 
                value={formData.visit_date} 
                onChange={handleInputChange}
                required
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="visit_time">Visit Time:</label>
              <input 
                type="time" 
                id="visit_time" 
                name="visit_time" 
                value={formData.visit_time} 
                onChange={handleInputChange}
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="purpose">Purpose of Visit:</label>
              <textarea 
                id="purpose" 
                name="purpose" 
                value={formData.purpose} 
                onChange={handleInputChange}
                required
                rows="3"
                placeholder="Briefly describe the purpose of your visit"
              />
            </div>
            
            <div className="form-actions">
              <button type="submit" className="submit-btn" disabled={loading}>
                {loading ? 'Loading...' : 'Submit Request'}
              </button>
              <button type="button" className="cancel-btn" onClick={onClose}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default VisitRequestModal;