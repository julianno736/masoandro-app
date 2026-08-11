// src/components/Sidebar.jsx
import React from 'react';
import './Sidebar.css';

const navGroups = [
  { title: "VUE GÉNÉRALE", items: ["Tableau de bord"] },
  { title: "ÉQUIPE", items: ["Annuaire employés", "Organigramme"] },
  { title: "SUIVI INDIVIDUEL", items: ["Congés", "Contrats & documents", "Évaluations & objectifs"] }
];

function Sidebar({ activeMenu, onMenuChange, currentUser }) {
  return (
    <aside className="sidebar">
      {/* Zone Logo avec uniquement le Soleil SVG centré */}
      <div className="logo-section">
        <div className="logo-container-brand">
          <svg className="sun-logo" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="5" fill="currentColor" />
            <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </div>
        <span className="logo-sub">PLATEFORME EMPLOYÉS</span>
      </div>

      {/* Profil de l'utilisateur connecté */}
      <div className="profile-card">
        <div className="profile-avatar">
          {currentUser.initials}
          <div className="status-indicator" style={{ '--status-color': 'var(--success)' }} />
        </div>
        <h3 className="profile-name">{currentUser.name}</h3>
        <p className="profile-role">{currentUser.role}</p>
        <div className="profile-divider"></div>
        <p className="profile-meta">Dossier N° {currentUser.number} · Depuis {currentUser.since}</p>
      </div>

      <nav className="navigation">
        {navGroups.map((group) => (
          <div key={group.title} className="nav-group">
            <span className="nav-group-title">{group.title}</span>
            {group.items.map((item) => (
              <button 
                key={item}
                className={`nav-item ${activeMenu === item ? 'active' : ''}`}
                onClick={() => onMenuChange(item)}
              >
                {item}
              </button>
            ))}
          </div>
        ))}
      </nav>
    </aside>
  );
}

export default Sidebar;