import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './AdminDashboard.css';
import ReportsPage from './ReportsPage';

const DashboardHome = ({ loading, error, dashboardStats }) => {
  return (
    <div className="welcome-section">
      <h2>System Overview</h2>
      
      {loading.stats ? (
        <div className="loading-indicator">Loading statistics...</div>
      ) : error.stats ? (
        <div className="error-message">{error.stats}</div>
      ) : dashboardStats ? (
        <div className="stats-grid">
          <div className="stat-card">
            <i className='bx bx-user-circle stat-icon'></i>
            <div className="stat-info">
              <h3>Users</h3>
              <p className="stat-value">{dashboardStats.user_count}</p>
            </div>
          </div>
          
          <div className="stat-card">
            <i className='bx bx-user-pin stat-icon'></i>
            <div className="stat-info">
              <h3>PUCs</h3>
              <p className="stat-value">{dashboardStats.pupc_count}</p>
            </div>
          </div>
          
          <div className="stat-card">
            <i className='bx bx-list-check stat-icon'></i>
            <div className="stat-info">
              <h3>Visits</h3>
              <p className="stat-value">{dashboardStats.visitor_log_count}</p>
            </div>
          </div>
          
          <div className="stat-card">
            <i className='bx bx-check-shield stat-icon'></i>
            <div className="stat-info">
              <h3>Pending</h3>
              <p className="stat-value">{dashboardStats.pending_approval_count}</p>
            </div>
          </div>
          
          <div className="stat-card">
            <i className='bx bx-block stat-icon'></i>
            <div className="stat-info">
              <h3>Blacklisted</h3>
              <p className="stat-value">{dashboardStats.blacklisted_count}</p>
            </div>
          </div>
        </div>
      ) : (
        <p>No statistics available</p>
      )}
      
      {/* Reports section moved to dashboard */}
      <div className="dashboard-reports-section">
        <h2>Reports</h2>
        <ReportsPage />
      </div>
    </div>
  );
};

export default DashboardHome;