import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './VisitorList.css';

const VisitorList = () => {
  const [visitors, setVisitors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  
  const navigate = useNavigate();

  useEffect(() => {
    const fetchVisitors = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get('http://localhost:5000/api/visitors', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setVisitors(response.data);
      } catch (err) {
        setError('Failed to fetch visitors');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchVisitors();
  }, []);

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
  };

  const filteredVisitors = visitors.filter(visitor => {
    return visitor.first_name.toLowerCase().includes(search.toLowerCase()) || 
           visitor.last_name.toLowerCase().includes(search.toLowerCase());
  });

  const handleViewDetails = (visitorId) => {
    navigate(`/visitors/${visitorId}`);
  };

  if (loading) return <div className="loading">Loading...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="visitor-list-container">
      <h2>Registered Visitors</h2>
      
      <div className="search-bar">
        <input 
          type="text" 
          placeholder="Search visitors..." 
          value={search}
          onChange={handleSearchChange}
        />
      </div>
      
      <div className="visitor-table-container">
        <table className="visitor-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Photo</th>
              <th>Name</th>
              <th>Relationship</th>
              <th>Registration Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredVisitors.length > 0 ? (
              filteredVisitors.map(visitor => (
                <tr key={visitor.visitor_id}>
                  <td>{visitor.visitor_id}</td>
                  <td>
                    {visitor.photo_path ? (
                      <img 
                        src={visitor.photo_path} 
                        alt={`${visitor.first_name} ${visitor.last_name}`} 
                        className="visitor-thumbnail"
                      />
                    ) : (
                      <div className="no-photo">No Photo</div>
                    )}
                  </td>
                  <td>{visitor.first_name} {visitor.last_name}</td>
                  <td>{visitor.relationship_to_puc || 'N/A'}</td>
                  <td>{new Date(visitor.registered_at).toLocaleDateString()}</td>
                  <td>
                    <button 
                      onClick={() => handleViewDetails(visitor.visitor_id)}
                      className="view-button"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="no-results">No visitors found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      <div className="action-buttons">
        <button onClick={() => navigate('/visitors/new')} className="add-button">
          Register New Visitor
        </button>
      </div>
    </div>
  );
};

export default VisitorList;