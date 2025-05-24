import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './PUPCList.css';

const PUPCList = () => {
  const [pupcs, setPUPCs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [categories, setCategories] = useState([]);
  const [filter, setFilter] = useState({ category: '', status: '', search: '' });
  
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        
        // Fetch PUPCs
        const pupcsResponse = await axios.get('http://localhost:5000/api/pupcs', {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        // Fetch categories
        const categoriesResponse = await axios.get('http://localhost:5000/api/categories', {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        setPUPCs(pupcsResponse.data);
        setCategories(categoriesResponse.data);
      } catch (err) {
        setError('Failed to fetch data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilter(prev => ({ ...prev, [name]: value }));
  };

  const filteredPUPCs = pupcs.filter(pupc => {
    const matchesCategory = filter.category ? pupc.category_id === parseInt(filter.category) : true;
    const matchesStatus = filter.status ? pupc.status === filter.status : true;
    const matchesSearch = filter.search ? 
      pupc.first_name.toLowerCase().includes(filter.search.toLowerCase()) || 
      pupc.last_name.toLowerCase().includes(filter.search.toLowerCase()) : 
      true;
    
    return matchesCategory && matchesStatus && matchesSearch;
  });

  const handleViewDetails = (pupcId) => {
    navigate(`/pupcs/${pupcId}`);
  };

  if (loading) return <div className="loading">Loading...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="pupc-list-container">
      <h2>Persons Under Police Custody</h2>
      
      <div className="filters">
        <div className="filter-group">
          <label>Category:</label>
          <select 
            name="category" 
            value={filter.category} 
            onChange={handleFilterChange}
          >
            <option value="">All Categories</option>
            {categories.map(category => (
              <option key={category.category_id} value={category.category_id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>
        
        <div className="filter-group">
          <label>Status:</label>
          <select 
            name="status" 
            value={filter.status} 
            onChange={handleFilterChange}
          >
            <option value="">All Statuses</option>
            <option value="In Custody">In Custody</option>
            <option value="Released">Released</option>
            <option value="Transferred">Transferred</option>
          </select>
        </div>
        
        <div className="filter-group">
          <label>Search:</label>
          <input 
            type="text" 
            name="search" 
            value={filter.search} 
            onChange={handleFilterChange}
            placeholder="Search by name"
          />
        </div>
      </div>
      
      <div className="pupc-grid">
        {filteredPUPCs.length > 0 ? (
          filteredPUPCs.map(pupc => (
            <div key={pupc.pupc_id} className="pupc-card">
              <div className="pupc-image">
                {pupc.mugshot_path ? (
                  <img src={pupc.mugshot_path} alt={`${pupc.first_name} ${pupc.last_name}`} />
                ) : (
                  <div className="no-image">No Image</div>
                )}
              </div>
              <div className="pupc-info">
                <h3>{pupc.first_name} {pupc.last_name}</h3>
                <p><strong>Status:</strong> <span className={`status-${pupc.status?.toLowerCase()}`}>{pupc.status}</span></p>
                <p><strong>Age:</strong> {pupc.age || 'N/A'}</p>
                <p><strong>Arrest Date:</strong> {pupc.arrest_date || 'N/A'}</p>
                <button onClick={() => handleViewDetails(pupc.pupc_id)}>View Details</button>
              </div>
            </div>
          ))
        ) : (
          <div className="no-results">No records found</div>
        )}
      </div>
      
      <div className="action-buttons">
        <button onClick={() => navigate('/pupcs/new')} className="add-button">
          Add New PUPC
        </button>
      </div>
    </div>
  );
};

export default PUPCList;