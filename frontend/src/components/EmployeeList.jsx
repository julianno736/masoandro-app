// src/components/EmployeeList.jsx
import React, { useState } from 'react';

function EmployeeList({ users, onAddEmployee, onUpdateEmployee }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);

  // Formulaire d'ajout (Champs épurés et uniques)
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('');
  const [department, setDepartment] = useState('Marketing');
  const [contractType, setContractType] = useState('CDI');
  const [baseSalary, setBaseSalary] = useState('');
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleCloseModal = () => {
    document.getElementById('add-employee-modal').style.display = 'none';
    setName('');
    setEmail('');
    setRole('');
    setBaseSalary('');
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      await onAddEmployee({ 
        name, 
        email, 
        role, 
        department,
        contractType,
        baseSalary: baseSalary ? `${baseSalary} Ar` : "0 Ar"
      });
      setSuccess("Collaborateur ajouté avec succès !");
      setTimeout(() => {
        handleCloseModal();
      }, 1200);
    } catch (err) {
      setError(err.message || "Erreur de connexion avec le backend.");
    }
  };

  // Cocher/Décocher un document d'intégration (Sauvegarde automatique)
  const handleDocChange = async (docKey) => {
    if (!selectedUser) return;
    
    const updatedDocs = {
      ...selectedUser.onboardingDocs,
      [docKey]: !selectedUser.onboardingDocs[docKey]
    };

    const updatedUser = {
      ...selectedUser,
      onboardingDocs: updatedDocs
    };

    setSelectedUser(updatedUser);
    if (onUpdateEmployee) {
      await onUpdateEmployee(updatedUser);
    }
  };

  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    user.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="annuaire-container">
      {/* En-tête de l'annuaire */}
      <div className="annuaire-header">
        <div className="header-titles">
          <h2 className="annuaire-title">Annuaire employés</h2>
          <span className="annuaire-subtitle">{users.length} COLLABORATEURS ACTIFS</span>
        </div>
        
        <div className="header-search-and-action">
          <div className="search-box-wrapper">
            <input 
              type="text" 
              placeholder="Rechercher un nom, un poste..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
          <button 
            className="btn-classic-add"
            onClick={() => document.getElementById('add-employee-modal').style.display = 'flex'}
          >
            + Ajouter
          </button>
        </div>
      </div>

      {/* Liste des employés */}
      <div className="employee-cards-list">
        {filteredUsers.length > 0 ? (
          filteredUsers.map((user, index) => (
            <div 
              className="employee-row-card" 
              key={index}
              onClick={() => setSelectedUser(user)}
              style={{ cursor: 'pointer' }}
            >
              <div className="row-avatar">{user.initials}</div>
              <div className="row-user-details">
                <span className="user-name">{user.name}</span>
                <span className="user-role">{user.role}</span>
              </div>
              <div className="row-department">
                {user.department || "Marketing"}
              </div>
              <div className="row-entry-date">
                Type : <strong style={{color: '#1e293b'}}>{user.contractType || 'CDI'}</strong>
              </div>
              <div className="row-status">
                <span className="status-badge-active">ACTIF</span>
              </div>
            </div>
          ))
        ) : (
          <div className="no-results">Aucun collaborateur trouvé.</div>
        )}
      </div>

      {/* GRAND TIROIR LATÉRAL (Fiche Complète) */}
      {selectedUser && (
        <div className="side-drawer-overlay" onClick={() => setSelectedUser(null)}>
          <div className="side-drawer" onClick={(e) => e.stopPropagation()}>
            <div className="drawer-header">
              <div className="drawer-avatar">{selectedUser.initials}</div>
              <div className="drawer-titles">
                <h2>{selectedUser.name}</h2>
                <p>{selectedUser.role} — <strong>{selectedUser.department}</strong></p>
              </div>
              <button className="drawer-close" onClick={() => setSelectedUser(null)}>&times;</button>
            </div>

            <div className="drawer-body">
              {/* Informations de base */}
              <div className="drawer-section">
                <h3>📁 Informations Générales</h3>
                <div className="classic-grid">
                  <div><span>Email:</span> {selectedUser.email}</div>
                  <div><span>Téléphone:</span> {selectedUser.phone || "+261 34 00 000 00"}</div>
                  <div><span>Adresse:</span> {selectedUser.address || "Non renseignée"}</div>
                  <div><span>N° Dossier:</span> #{selectedUser.number}</div>
                  <div><span>N+1 Direct:</span> {selectedUser.manager || "Directeur Général"}</div>
                  <div><span>Type Contrat:</span> <strong>{selectedUser.contractType || "CDI"}</strong></div>
                </div>
              </div>

              {/* Rémunération */}
              <div className="drawer-section">
                <h3>💰 Rémunération</h3>
                <div className="classic-grid">
                  <div><span>Salaire de base:</span> {selectedUser.remuneration?.baseSalary || "Non défini"}</div>
                  <div><span>Primes actuelles:</span> {selectedUser.remuneration?.bonus || "0 Ar"}</div>
                  <div><span>Avantages:</span> {selectedUser.remuneration?.benefits || "Aucun"}</div>
                </div>
                {selectedUser.remuneration?.history?.length > 0 && (
                  <div className="mini-table-wrapper">
                    <h4>Historique des augmentations</h4>
                    <table className="mini-table">
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Action</th>
                          <th>Montant</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedUser.remuneration.history.map((h, i) => (
                          <tr key={i}>
                            <td>{h.date}</td>
                            <td>{h.action}</td>
                            <td>{h.amount}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Gestion des Absences */}
              <div className="drawer-section">
                <h3>📅 Absences & Congés</h3>
                <div className="classic-grid">
                  <div><span>Congés restants:</span> <strong>{selectedUser.absences?.daysLeft ?? 30} jours</strong></div>
                  <div><span>Congés pris:</span> {selectedUser.absences?.taken ?? 0} jours</div>
                </div>
                {selectedUser.absences?.history?.length > 0 && (
                  <div className="mini-table-wrapper">
                    <h4>Historique récent</h4>
                    <table className="mini-table">
                      <thead>
                        <tr>
                          <th>Type</th>
                          <th>Du</th>
                          <th>Au</th>
                          <th>Statut</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedUser.absences.history.map((a, i) => (
                          <tr key={i}>
                            <td>{a.type}</td>
                            <td>{a.from}</td>
                            <td>{a.to}</td>
                            <td><span className="mini-badge">{a.status}</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Dossier d'intégration (Checklist interactive) */}
              <div className="drawer-section">
                <h3>📑 Dossier d'Intégration (Pièces jointes)</h3>
                <p className="section-instruction">Cochez les documents collectés et enregistrés :</p>
                <div className="checklist-container">
                  <label className="checkbox-item">
                    <input 
                      type="checkbox" 
                      checked={selectedUser.onboardingDocs?.idCard || false} 
                      onChange={() => handleDocChange('idCard')} 
                    />
                    <span>Pièce d'identité (CNI / Passeport)</span>
                  </label>
                  <label className="checkbox-item">
                    <input 
                      type="checkbox" 
                      checked={selectedUser.onboardingDocs?.residenceProof || false} 
                      onChange={() => handleDocChange('residenceProof')} 
                    />
                    <span>Preuve de résidence (Facture)</span>
                  </label>
                  <label className="checkbox-item">
                    <input 
                      type="checkbox" 
                      checked={selectedUser.onboardingDocs?.signedContract || false} 
                      onChange={() => handleDocChange('signedContract')} 
                    />
                    <span>Contrat de travail signé</span>
                  </label>
                  <label className="checkbox-item">
                    <input 
                      type="checkbox" 
                      checked={selectedUser.onboardingDocs?.socialSecurity || false} 
                      onChange={() => handleDocChange('socialSecurity')} 
                    />
                    <span>Affiliation Sécu / Mutuelle</span>
                  </label>
                  <label className="checkbox-item">
                    <input 
                      type="checkbox" 
                      checked={selectedUser.onboardingDocs?.rib || false} 
                      onChange={() => handleDocChange('rib')} 
                    />
                    <span>Relevé d'Identité Bancaire (RIB)</span>
                  </label>
                  <label className="checkbox-item">
                    <input 
                      type="checkbox" 
                      checked={selectedUser.onboardingDocs?.cvDiplomas || false} 
                      onChange={() => handleDocChange('cvDiplomas')} 
                    />
                    <span>CV et Diplômes originaux</span>
                  </label>
                  <label className="checkbox-item">
                    <input 
                      type="checkbox" 
                      checked={selectedUser.onboardingDocs?.criminalRecord || false} 
                      onChange={() => handleDocChange('criminalRecord')} 
                    />
                    <span>Extrait de casier judiciaire</span>
                  </label>
                </div>
              </div>

              {/* Dossier Disciplinaire */}
              <div className="drawer-section">
                <h3>⚖️ Suivi Disciplinaire</h3>
                {selectedUser.disciplinary?.length > 0 ? (
                  <table className="mini-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Sanction</th>
                        <th>Motif</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedUser.disciplinary.map((d, i) => (
                        <tr key={i}>
                          <td>{d.date}</td>
                          <td><strong>{d.type}</strong></td>
                          <td>{d.reason}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p className="no-disciplinary-records">Aucun incident ou avertissement dans le dossier.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL POP-UP DE CRÉATION CLASSIQUE (1 SEUL BOUTON D'ACTIONS) */}
      <div id="add-employee-modal" className="modal-overlay" style={{ display: 'none' }}>
        <div className="classic-modal-box">
          <div className="classic-modal-header">
            <h3>Ajouter un collaborateur</h3>
            <button className="classic-close-btn" onClick={handleCloseModal}>&times;</button>
          </div>
          
          <form onSubmit={handleSubmit} className="classic-form">
            {error && <div className="classic-alert-error">{error}</div>}
            {success && <div className="classic-alert-success">{success}</div>}

            <div className="classic-form-group">
              <label>Nom Complet</label>
              <input 
                type="text" 
                placeholder="Ex: Clara Martin" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                required 
              />
            </div>

            <div className="classic-form-group">
              <label>Adresse e-mail</label>
              <input 
                type="email" 
                placeholder="clara.martin@entreprise.com" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                required 
              />
            </div>

            <div className="classic-form-group">
              <label>Rôle / Poste</label>
              <input 
                type="text" 
                placeholder="Ex: Designer UX/UI" 
                value={role} 
                onChange={(e) => setRole(e.target.value)} 
                required 
              />
            </div>

            <div className="classic-grid-2col">
              <div className="classic-form-group">
                <label>Département</label>
                <select value={department} onChange={(e) => setDepartment(e.target.value)}>
                  <option value="Marketing">Marketing</option>
                  <option value="Technique">Technique</option>
                  <option value="Finance">Finance</option>
                  <option value="Direction">Direction</option>
                </select>
              </div>

              <div className="classic-form-group">
                <label>Type de Contrat</label>
                <select value={contractType} onChange={(e) => setContractType(e.target.value)}>
                  <option value="CDI">CDI</option>
                  <option value="CDD">CDD</option>
                  <option value="Stage">Stage</option>
                  <option value="Freelance">Freelance</option>
                </select>
              </div>
            </div>

            <div className="classic-form-group">
              <label>Salaire de base (Ar)</label>
              <input 
                type="text" 
                placeholder="Ex: 1 200 000" 
                value={baseSalary} 
                onChange={(e) => setBaseSalary(e.target.value)} 
              />
            </div>

            <div className="classic-actions">
              <button type="submit" className="btn-submit-classic">Ajouter</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default EmployeeList;