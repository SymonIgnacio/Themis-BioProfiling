import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './PUPCList.css';

const AddPUCForm = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [categories, setCategories] = useState([]);
  const [crimeTypes, setCrimeTypes] = useState([]);
  
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    gender: '',
    age: '',
    arrest_date: '',
    category_id: '',
    status: '',
    mugshot_path: '',
    crime_id: ''
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        
        // Fetch categories
        const categoriesResponse = await axios.get('http://localhost:5000/api/categories', {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        // Fetch crime types
        const crimeTypesResponse = await axios.get('http://localhost:5000/api/crimetypes', {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        setCategories(categoriesResponse.data);
        setCrimeTypes(crimeTypesResponse.data);
      } catch (err) {
        setError('Failed to fetch data');
        console.error(err);
      }
    };

    fetchData();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('token');
      
      // Convert string values to appropriate types
      const dataToSubmit = {
        ...formData,
        age: formData.age ? parseInt(formData.age) : null,
        category_id: formData.category_id ? parseInt(formData.category_id) : null,
        crime_id: formData.crime_id ? parseInt(formData.crime_id) : null
      };
      
      const response = await axios.post('http://localhost:5000/api/pucs', dataToSubmit, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.data.success) {
        navigate('/pupcs');
      }
    } catch (err) {
      console.error('Error creating PUC:', err);
      setError(err.response?.data?.error || 'Failed to create PUC record');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="add-puc-container">
      <h2>Add New PUC Record</h2>
      
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
            <label htmlFor="crime_id">Crime Type:</label>
            <select 
              id="crime_id" 
              name="crime_id" 
              value={formData.crime_id} 
              onChange={handleInputChange}
            >
              <option value="">Select Crime Type</option>
              {crimeTypes.map(type => (
                <option key={type.crime_id} value={type.crime_id}>
                  {type.name} - {type.law_reference}
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
            {loading ? 'Saving...' : 'Save Record'}
          </button>
          <button type="button" className="cancel-button" onClick={() => navigate('/pupcs')}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddPUCForm;