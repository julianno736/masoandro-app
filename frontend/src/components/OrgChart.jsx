// src/components/OrgChart.jsx
import React from 'react';

function OrgChart({ users }) {
  // Marion est le manager par défaut
  const leader = users.find(u => u.initials === "ML") || users[0];
  // Les autres membres sont sous son lead
  const teamMembers = users.filter(u => u.email !== leader?.email);

  if (!leader) return <p>Aucun employé trouvé.</p>;

  return (
    <div className="section-card org-chart-card">
      <h3 className="section-title text-center">Organigramme de l'entreprise</h3>
      <p className="section-subtitle text-center">Structure hiérarchique dynamique</p>

      <div className="org-tree">
        {/* Niveau 1 : Le Leader */}
        <div className="org-node leader-node">
          <div className="node-avatar">{leader.initials}</div>
          <div className="node-info">
            <h4 className="node-name">{leader.name}</h4>
            <p className="node-role">{leader.role}</p>
            <span className="badge-leader">Directrice / Référente</span>
          </div>
        </div>

        {/* Ligne de connexion verticale */}
        {teamMembers.length > 0 && <div className="tree-connector-vertical"></div>}

        {/* Niveau 2 : L'Équipe */}
        {teamMembers.length > 0 && (
          <div className="org-team-row">
            {teamMembers.map((member, index) => (
              <div key={index} className="org-node team-node">
                <div className="node-avatar">{member.initials}</div>
                <div className="node-info">
                  <h4 className="node-name">{member.name}</h4>
                  <p className="node-role">{member.role}</p>
                  <span className="badge-team">Équipe</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default OrgChart;