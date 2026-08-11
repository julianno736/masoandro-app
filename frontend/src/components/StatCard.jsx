// src/components/StatCard.jsx
import React from 'react';
import './StatCard.css';

// Petite aide pour les couleurs des cartes
const getStatusVar = (statusKey) => {
  switch (statusKey) {
    case 'warning': return '--warning';
    case 'primary': return '--primary';
    case 'success': return '--success';
    default: return '--text-main';
  }
};

function StatCard({ stat, isActive, onCardClick }) {
  return (
    <div 
      className={`stat-card ${stat.key ? 'clickable' : ''} ${isActive ? 'active' : ''}`}
      style={{ '--stat-color': `var(${getStatusVar(stat.status)})` }}
      onClick={() => stat.key && onCardClick(stat.key)}
    >
      <div className="stat-header">
        <span className="stat-label">{stat.label}</span>
      </div>
      <div className="stat-body">
        <span className="stat-value">{stat.value}</span>
        {stat.unit && <span className="stat-unit">{stat.unit}</span>}
      </div>
      <div className="stat-footer-line" />
    </div>
  );
}

export default StatCard;