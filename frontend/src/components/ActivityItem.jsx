// src/components/ActivityItem.jsx
import React from 'react';
import './ActivityItem.css';

// Aide pour les badges
const getStatusClass = (key) => {
  switch (key) {
    case 'warning': return 'badge-warning';
    case 'primary': return 'badge-primary';
    case 'success': return 'badge-success';
    case 'info': return 'badge-info';
    default: return '';
  }
};

function ActivityItem({ activity }) {
  return (
    <div className="activity-row">
      <div className="activity-main">
        <div className="activity-status">
          <span className={`badge ${getStatusClass(activity.statusKey)}`}>
            {activity.status}
          </span>
        </div>
        <div className="activity-details">
          <h4 className="activity-title">{activity.title}</h4>
          <span className="activity-subtitle">{activity.subtitle}</span>
        </div>
      </div>
      <div className="activity-date">
        {activity.date}
      </div>
    </div>
  );
}

export default ActivityItem;