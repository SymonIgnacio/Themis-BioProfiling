import React from 'react';
import './AdminDashboard.css';

const PlaceholderContent = ({ icon, message }) => {
  return (
    <div className="placeholder-content">
      <i className={`bx ${icon} placeholder-icon`}></i>
      <p>{message}</p>
    </div>
  );
};

export default PlaceholderContent;