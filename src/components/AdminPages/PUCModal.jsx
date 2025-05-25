import React, { useState, useEffect } from 'react';
import './AdminDashboard.css';

const PUCModal = ({ puc, isOpen, onClose, onSave, mode }) => {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    gender: '',
    age: '',
    arrest_date: '',
    category_id: '',
    status: '',
    mugshot_path: '',
    crime_type_id: ''
  });
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [crimeTypes, setCrimeTypes] = useState([]);

  // Fetch crime types from API
  useEffect(() => {
    const fetchCrimeTypes = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/crimetypes');
        const data = await response.json();
        setCrimeTypes(data);
      } catch (err) {
        console.error('Error fetching crime types:', err);
        // Fallback to hardcoded crime types if API fails
        setCrimeTypes([
          { crime_type_id: 1, name: 'Theft' },
          { crime_type_id: 2, name: 'Assault' },
          { crime_type_id: 3, name: 'Drug Possession' },
          { crime_type_id: 4, name: 'Robbery' },
          { crime_type_id: 5, name: 'Fraud' }
        ]);
      }
    };
    
    fetchCrimeTypes();
  }, []);

  useEffect(() => {
    if (puc && mode === 'edit') {
      setFormData({
        first_name: puc.first_name || '',
        last_name: puc.last_name || '',
        gender: puc.gender || '',
        age: puc.age || '',
        arrest_date: puc.arrest_date ? new Date(puc.arrest_date).toISOString().split('T')[0] : '',
        category_id: puc.category_id || '',
        status: puc.status || '',
        mugshot_path: puc.mugshot_path || '',
        crime_type_id: puc.crime_type_id || ''
      });
    }
    
    // Use hardcoded categories since the API endpoint doesn't exist
    const mockCategories = [
      { category_id: 1, name: 'Crime Against Persons' },
      { category_id: 2, name: 'Crime Against Property' },
      { category_id: 3, name: 'Drug Related' }
    ];
    
    setCategories(mockCategories);
  }, [puc, mode]);

  const handleInputChange = (e) => {
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
      console.error('Error saving PUC:', err);
      setError('Failed to save PUC data');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-container">
        <div className="modal-header">
          <h2>{mode === 'edit' ? 'Edit PUC Record' : 'View PUC Record'}</h2>
          <button className="modal-close-btn" onClick={onClose}>
            <i className='bx bx-x'></i>
          </button>
        </div>
        
        <div className="modal-body">
          {error && <div className="error-message">{error}</div>}
          
          {mode === 'view' ? (
            <div className="puc-details">
              <div className="puc-image-container">
                {puc.mugshot_path ? (
                  <img src={puc.mugshot_path} alt={`${puc.first_name} ${puc.last_name}`} className="puc-image" />
                ) : (
                  <div className="no-image">No Image Available</div>
                )}
              </div>
              
              <div className="puc-info">
                <div className="info-row">
                  <div className="info-item">
                    <span className="label">ID:</span>
                    <span className="value">{puc.pupc_id}</span>
                  </div>
                  <div className="info-item">
                    <span className="label">Name:</span>
                    <span className="value">{`${puc.first_name} ${puc.last_name}`}</span>
                  </div>
                </div>
                
                <div className="info-row">
                  <div className="info-item">
                    <span className="label">Gender:</span>
                    <span className="value">{puc.gender || 'N/A'}</span>
                  </div>
                  <div className="info-item">
                    <span className="label">Age:</span>
                    <span className="value">{puc.age || 'N/A'}</span>
                  </div>
                </div>
                
                <div className="info-row">
                  <div className="info-item">
                    <span className="label">Status:</span>
                    <span className="value status-badge">{puc.status || 'N/A'}</span>
                  </div>
                  <div className="info-item">
                    <span className="label">Category:</span>
                    <span className="value">{puc.crime_category || 'N/A'}</span>
                  </div>
                </div>
                
                <div className="info-row">
                  <div className="info-item">
                    <span className="label">Crime Type:</span>
                    <span className="value">{puc.crime_type_name || 'N/A'}</span>
                  </div>
                </div>
                
                <div className="info-row">
                  <div className="info-item">
                    <span className="label">Arrest Date:</span>
                    <span className="value">{puc.arrest_date ? new Date(puc.arrest_date).toLocaleDateString() : 'N/A'}</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
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
                  <label htmlFor="status">Status:</label>
                  <select 
                    id="status" 
                    name="status" 
                    value={formData.status} 
                    onChange={handleInputChange}
                  >
                    <option value="">Select Status</option>
                    <option value="In Custody">In Custody</option>
                    <option value="Released">Released</option>
                    <option value="Transferred">Transferred</option>
                  </select>
                </div>
                
                <div className="form-group">
                  <label htmlFor="crime_type_id">Crime Type:</label>
                  <select 
                    id="crime_type_id" 
                    name="crime_type_id" 
                    value={formData.crime_type_id} 
                    onChange={handleInputChange}
                  >
                    <option value="">Select Crime Type</option>
                    {crimeTypes.map(type => (
                      <option key={type.crime_type_id} value={type.crime_type_id}>
                        {type.name}
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
                <button type="submit" className="save-button" disabled={loading}>
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
                <button type="button" className="cancel-button" onClick={onClose}>
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

export default PUCModal;