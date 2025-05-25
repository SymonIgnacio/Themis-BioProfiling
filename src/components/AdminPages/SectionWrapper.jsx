import React from 'react';
import './AdminDashboard.css';

const SectionWrapper = ({ title, children }) => {
  return (
    <div className={`${title.toLowerCase().replace(/\s+/g, '-')}-section`}>
      <h2>{title}</h2>
      {children}
    </div>
  );
};

export default SectionWrapper;