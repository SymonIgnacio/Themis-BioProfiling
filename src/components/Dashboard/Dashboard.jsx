import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Dashboard.css';

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    const fetchUserData = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/profile', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        setUser(response.data);
      } catch (error) {
        console.error('Error fetching user data:', error);
        localStorage.removeItem('token');
        navigate('/login');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1>Themis BioProfiling System</h1>
        <button className="logout-button" onClick={handleLogout}>Logout</button>
      </header>
      
      <div className="dashboard-content">
        <div className="welcome-section">
          <h2>Welcome, {user?.username}</h2>
          <p>Role: {user?.role}</p>
        </div>
        
        <div className="dashboard-cards">
          <div className="dashboard-card">
            <h3>Biometric Profiles</h3>
            <p>Manage inmate biometric data</p>
            <button>Access</button>
          </div>
          
          <div className="dashboard-card">
            <h3>Reports</h3>
            <p>Generate and view reports</p>
            <button>Access</button>
          </div>
          
          <div className="dashboard-card">
            <h3>Settings</h3>
            <p>Configure system settings</p>
            <button>Access</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;