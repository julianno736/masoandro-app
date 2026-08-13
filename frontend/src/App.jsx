// src/App.jsx
import React, { useState, useEffect } from 'react';
import './App.css';
import logo from './assets/LogoM.jpg';

// URL de votre serveur Node/Express
const API_URL = 'http://127.0.0.1:5001';

// En-têtes avec le token JWT, à utiliser pour tous les appels aux routes protégées
const authHeaders = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${localStorage.getItem('masoandro_token')}`
});

function App() {
  // --- ÉTATS D'AUTHENTIFICATION & SESSION ---
  const [currentUser, setCurrentUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // --- ÉTATS FORMULAIRE D'INSCRIPTION / CRÉATION DE COMPTE ---
  const [isRegistering, setIsRegistering] = useState(false);
  const [registerName, setRegisterName] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [registerError, setRegisterError] = useState('');
  const [registerSuccess, setRegisterSuccess] = useState('');

  // --- ÉTATS PARAMÈTRES GLOBAUX & MODE SOMBRE ---
  const [companyName, setCompanyName] = useState('MASOANDRO');
  const [cnapsRate, setCnapsRate] = useState(0.01);
  const [ostieRate, setOstieRate] = useState(0.01);
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('masoandro_dark_mode') === 'true';
  });

  useEffect(() => {
    localStorage.setItem('masoandro_dark_mode', darkMode);
  }, [darkMode]);

  // --- ÉTATS DU PORTAIL RH MASOANDRO ---
  const [currentMenu, setCurrentMenu] = useState('dashboard');
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({});

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('');
  const [department, setDepartment] = useState('Marketing');
  const [contractType, setContractType] = useState('CDI');
  const [baseSalary, setBaseSalary] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [manager, setManager] = useState('');
  const [accountType, setAccountType] = useState('employee');

  // --- ÉTATS PHOTO & PIÈCE D'IDENTITÉ (ajout à la création) ---
  const [newAvatarFile, setNewAvatarFile] = useState(null);
  const [newIdDocFile, setNewIdDocFile] = useState(null);
  const [isSubmittingNewEmployee, setIsSubmittingNewEmployee] = useState(false);

  const [irsa, setIrsa] = useState('');
  const [cnaps, setCnaps] = useState('');
  const [ostie, setOstie] = useState('');

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [leaveRequests, setLeaveRequests] = useState([]);
  const [leaveEmployeeEmail, setLeaveEmployeeEmail] = useState('');
  const [leaveType, setLeaveType] = useState('Congé Payé');
  const [leaveStartDate, setLeaveStartDate] = useState('');
  const [leaveEndDate, setLeaveEndDate] = useState('');
  const [leaveReason, setLeaveReason] = useState('');
  const [leaveBalance, setLeaveBalance] = useState(null);

  const [sanctions, setSanctions] = useState([]);
  const [sanctionEmployeeEmail, setSanctionEmployeeEmail] = useState('');
  const [sanctionType, setSanctionType] = useState('Avertissement écrit');
  const [sanctionDate, setSanctionDate] = useState('');
  const [sanctionReason, setSanctionReason] = useState('');

  const [employeeAttachments, setEmployeeAttachments] = useState([]);
  const [uploadingAttachment, setUploadingAttachment] = useState(false);

  // --- ÉTATS COMPTES D'AUTO-INSCRIPTION EN ATTENTE (accounts.json, admin uniquement) ---
  const [pendingAccounts, setPendingAccounts] = useState([]);
  const [linkingAccountId, setLinkingAccountId] = useState(null);
  const [linkTargetEmail, setLinkTargetEmail] = useState('');

  const isAdmin = currentUser?.accountType === 'admin';

  useEffect(() => {
    const salary = parseFloat(String(baseSalary).replace(/\s/g, '')) || 0;
    if (salary > 0) {
      setCnaps(Math.round(salary * cnapsRate));
      setOstie(Math.round(salary * ostieRate));
      const irsaEst = salary > 350000 ? Math.round((salary - 350000) * 0.20) : 0;
      setIrsa(irsaEst);
    } else {
      setCnaps('');
      setOstie('');
      setIrsa('');
    }
  }, [baseSalary, cnapsRate, ostieRate]);

  // --- RESTAURER LA SESSION AU CHARGEMENT DE L'APP ---
  // Si un token existe déjà (rafraîchissement de page), on vérifie qu'il est toujours valide
  // en tentant un appel protégé ; sinon on force une nouvelle connexion.
  useEffect(() => {
    const restoreSession = async () => {
      const token = localStorage.getItem('masoandro_token');
      const savedUser = localStorage.getItem('masoandro_user');
      if (!token || !savedUser) {
        setAuthChecked(true);
        return;
      }
      try {
        const response = await fetch(`${API_URL}/api/users`, { headers: authHeaders() });
        if (response.ok) {
          setCurrentUser(JSON.parse(savedUser));
        } else {
          localStorage.removeItem('masoandro_token');
          localStorage.removeItem('masoandro_user');
        }
      } catch (err) {
        console.error("Impossible de vérifier la session :", err);
      } finally {
        setAuthChecked(true);
      }
    };
    restoreSession();
  }, []);

  // 1. CHARGER LES EMPLOYÉS DEPUIS LE SERVEUR
  const fetchUsers = async () => {
    try {
      const response = await fetch(`${API_URL}/api/users`, { headers: authHeaders() });
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data)) {
          setUsers(data);
          if (data.length > 0) {
            if (!leaveEmployeeEmail) setLeaveEmployeeEmail(data[0].email);
            if (!sanctionEmployeeEmail) setSanctionEmployeeEmail(data[0].email);
          }
          return;
        }
      }
    } catch (err) {
      console.error("Impossible de joindre le serveur. Données non synchronisées.", err);
    }
  };

  // 1B. CHARGER LES CONGÉS
  const fetchLeaveRequests = async () => {
    try {
      const response = await fetch(`${API_URL}/api/leaves`, { headers: authHeaders() });
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data)) setLeaveRequests(data);
      }
    } catch (err) {
      console.error("Erreur lors de la récupération des congés :", err);
    }
  };

  // 1B-bis. SOLDE DE CONGÉS
  const fetchLeaveBalance = async (email) => {
    if (!email) {
      setLeaveBalance(null);
      return;
    }
    const url = `${API_URL}/api/leaves/balance/${encodeURIComponent(email)}`;
    try {
      const response = await fetch(url, { headers: authHeaders() });
      if (response.ok) {
        const data = await response.json();
        setLeaveBalance(data);
      } else {
        console.error(`Solde de congés : le serveur a répondu ${response.status} pour ${url}.`);
        setLeaveBalance(null);
      }
    } catch (err) {
      console.error(`Solde de congés : impossible de joindre ${url}.`, err);
      setLeaveBalance(null);
    }
  };

  // 1C. CHARGER LES SANCTIONS
  const fetchSanctions = async () => {
    try {
      const response = await fetch(`${API_URL}/api/sanctions`, { headers: authHeaders() });
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data)) setSanctions(data);
      }
    } catch (err) {
      console.error("Erreur lors de la récupération des sanctions :", err);
    }
  };

  // 1D. CHARGER LES PIÈCES JOINTES
  const fetchAttachments = async (email) => {
    if (!email) return;
    try {
      const response = await fetch(`${API_URL}/api/attachments/${encodeURIComponent(email)}`, { headers: authHeaders() });
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data)) setEmployeeAttachments(data);
      } else {
        setEmployeeAttachments([]);
      }
    } catch (err) {
      console.error("Erreur récupération pièces jointes :", err);
      setEmployeeAttachments([]);
    }
  };

  // 1E. CHARGER LES COMPTES EN ATTENTE (auto-inscription, admin uniquement)
  const fetchAccounts = async () => {
    try {
      const response = await fetch(`${API_URL}/api/accounts`, { headers: authHeaders() });
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data)) setPendingAccounts(data.filter(a => a.status === 'pending'));
      }
    } catch (err) {
      console.error("Erreur lors de la récupération des comptes en attente :", err);
    }
  };

  // On ne charge les données protégées qu'une fois la session restaurée ET l'utilisateur connecté
  useEffect(() => {
    if (authChecked && currentUser) {
      fetchUsers();
      fetchLeaveRequests();
      fetchSanctions();
      if (currentUser.accountType === 'admin') fetchAccounts();
    }
  }, [authChecked, currentUser]);

  useEffect(() => {
    if (users.length > 0) {
      if (!leaveEmployeeEmail) setLeaveEmployeeEmail(users[0].email);
      if (!sanctionEmployeeEmail) setSanctionEmployeeEmail(users[0].email);
    }
  }, [users]);

  useEffect(() => {
    fetchLeaveBalance(leaveEmployeeEmail);
  }, [leaveEmployeeEmail, leaveRequests]);

  useEffect(() => {
    if (selectedUser && selectedUser.email) {
      fetchAttachments(selectedUser.email);
    } else {
      setEmployeeAttachments([]);
    }
  }, [selectedUser]);

  // --- GESTION DE LA CONNEXION (via le serveur, vérification réelle du mot de passe) ---
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (isLoggingIn) return; // empêche les doubles soumissions (double-clic, Entrée + clic, etc.)
    setLoginError('');
    setIsLoggingIn(true);

    try {
      const response = await fetch(`${API_URL}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPassword })
      });
      const data = await response.json();

      if (response.ok && data.token && data.user) {
        localStorage.setItem('masoandro_token', data.token);
        localStorage.setItem('masoandro_user', JSON.stringify(data.user));
        setCurrentUser(data.user);
      } else {
        setLoginError(data.message || "E-mail ou mot de passe incorrect.");
      }
    } catch (err) {
      console.error("Erreur de connexion :", err);
      setLoginError("Impossible de contacter le serveur. Vérifiez qu'il est bien démarré.");
    } finally {
      setIsLoggingIn(false);
    }
  };

  // --- GESTION DE LA CRÉATION DE COMPTE ---
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setRegisterError('');
    setRegisterSuccess('');

    if (!registerName || !registerEmail || !registerPassword) {
      setRegisterError("Veuillez remplir tous les champs obligatoires.");
      return;
    }
    if (registerPassword.length < 8) {
      setRegisterError("Le mot de passe doit contenir au moins 8 caractères.");
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: registerName, email: registerEmail, password: registerPassword })
      });

      const data = await response.json();

      if (response.ok) {
        setRegisterSuccess("✨ Compte créé avec succès ! Un administrateur doit valider votre compte avant votre première connexion.");
        setTimeout(() => {
          setIsRegistering(false);
          setRegisterSuccess('');
          setLoginEmail(registerEmail);
          setRegisterName('');
          setRegisterEmail('');
          setRegisterPassword('');
        }, 1500);
      } else {
        setRegisterError(data.message || "Erreur lors de la création du compte.");
      }
    } catch (err) {
      setRegisterError("Erreur de connexion : Vérifiez que votre serveur Node est bien allumé !");
      console.error("Erreur d'inscription :", err);
    }
  };

  const handleLogout = () => {
    fetch(`${API_URL}/api/logout`, { method: 'POST', headers: authHeaders() }).catch(() => {});
    localStorage.removeItem('masoandro_token');
    localStorage.removeItem('masoandro_user');
    setCurrentUser(null);
    setLoginEmail('');
    setLoginPassword('');
  };

  const handleCloseModal = () => {
    const modal = document.getElementById('add-employee-modal');
    if (modal) modal.style.display = 'none';
    setName('');
    setEmail('');
    setRole('');
    setBaseSalary('');
    setPhone('');
    setAddress('');
    setManager('');
    setIrsa('');
    setCnaps('');
    setOstie('');
    setAccountType('employee');
    setNewAvatarFile(null);
    setNewIdDocFile(null);
    setError('');
    setSuccess('');
  };

  // 2. ENREGISTRER UN NOUVEL EMPLOYÉ (admin uniquement)
  const handleAddEmployeeSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsSubmittingNewEmployee(true);

    const newCollaborator = {
      name,
      email,
      role,
      department,
      contractType,
      accountType,
      avatarUrl: "",
      phone: phone || "Non renseigné",
      address: address || "Non renseignée",
      manager: manager || "Directeur Général",
      remuneration: {
        baseSalary: baseSalary ? `${baseSalary} Ar` : "0 Ar",
        retentions: {
          irsa: irsa ? `${irsa} Ar` : "0 Ar",
          cnaps: cnaps ? `${cnaps} Ar` : "0 Ar",
          ostie: ostie ? `${ostie} Ar` : "0 Ar"
        }
      },
      // Si une pièce d'identité est fournie tout de suite, on la coche directement
      onboardingDocs: { idCard: !!newIdDocFile, signedContract: false, rib: false }
    };

    try {
      const response = await fetch(`${API_URL}/api/users/add`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(newCollaborator)
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Erreur lors de l'enregistrement.");
        setIsSubmittingNewEmployee(false);
        return;
      }

      const createdEmail = data.user?.email || email;
      let finalAvatarUrl = "";

      // --- Upload de la photo de profil, si fournie ---
      if (newAvatarFile) {
        try {
          const avatarForm = new FormData();
          avatarForm.append('avatar', newAvatarFile);
          const avatarRes = await fetch(`${API_URL}/api/upload-avatar`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${localStorage.getItem('masoandro_token')}` },
            body: avatarForm
          });
          if (avatarRes.ok) {
            const avatarData = await avatarRes.json();
            finalAvatarUrl = `${API_URL}${avatarData.avatarUrl}`;
          }
        } catch (err) {
          console.error("Erreur upload photo à la création :", err);
        }
      }

      // Si on a une photo, on met à jour la fiche fraîchement créée avec l'URL
      if (finalAvatarUrl) {
        try {
          await fetch(`${API_URL}/api/users/${encodeURIComponent(createdEmail)}`, {
            method: 'PUT',
            headers: authHeaders(),
            body: JSON.stringify({ ...data.user, avatarUrl: finalAvatarUrl })
          });
        } catch (err) {
          console.error("Erreur mise à jour avatar :", err);
        }
      }

      // --- Upload de la pièce d'identité (CIN / Passeport), si fournie ---
      if (newIdDocFile) {
        try {
          const docForm = new FormData();
          docForm.append('document', newIdDocFile);
          docForm.append('email', createdEmail);
          await fetch(`${API_URL}/api/upload-attachment`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${localStorage.getItem('masoandro_token')}` },
            body: docForm
          });
        } catch (err) {
          console.error("Erreur upload pièce d'identité à la création :", err);
        }
      }

      const tempPasswordNote = data.tempPassword
        ? ` Mot de passe temporaire à transmettre à l'employé : ${data.tempPassword}`
        : '';
      setSuccess(`✨ Profil créé et synchronisé avec succès !${tempPasswordNote}`);
      fetchUsers();
      setTimeout(() => { handleCloseModal(); }, 2500);
    } catch (err) {
      setError("Erreur de connexion : Vérifiez que votre serveur Node est bien allumé !");
      console.error("Erreur d'ajout :", err);
    } finally {
      setIsSubmittingNewEmployee(false);
    }
  };

  // 3. TÉLÉVERSEMENT DE LA PHOTO
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('avatar', file);

    try {
      const response = await fetch(`${API_URL}/api/upload-avatar`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('masoandro_token')}` },
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        setEditForm(prev => ({ ...prev, avatarUrl: `${API_URL}${data.avatarUrl}` }));
        alert("📸 Photo chargée avec succès ! Cliquez sur 'Enregistrer la modification' pour valider.");
      } else {
        alert("Erreur lors du chargement de la photo.");
      }
    } catch (err) {
      console.error("Erreur upload :", err);
      alert("Impossible de contacter le serveur pour envoyer la photo.");
    }
  };

  // 3B. TÉLÉVERSEMENT D'UNE PIÈCE JOINTE
  const handleAttachmentUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !selectedUser) return;

    const formData = new FormData();
    formData.append('document', file);
    formData.append('email', selectedUser.email);

    setUploadingAttachment(true);
    try {
      const response = await fetch(`${API_URL}/api/upload-attachment`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('masoandro_token')}` },
        body: formData
      });

      if (response.ok) {
        await fetchAttachments(selectedUser.email);
        alert("📎 Pièce jointe ajoutée avec succès à la fiche !");
      } else {
        alert("Erreur lors du téléversement de la pièce jointe.");
      }
    } catch (err) {
      console.error("Erreur upload pièce jointe :", err);
      alert("Impossible de contacter le serveur pour envoyer le document.");
    } finally {
      setUploadingAttachment(false);
      e.target.value = null;
    }
  };

  // 3C. SUPPRESSION D'UNE PIÈCE JOINTE
  const handleDeleteAttachment = async (attachmentId) => {
    if (!window.confirm("Voulez-vous vraiment supprimer cette pièce jointe ?")) return;

    try {
      const response = await fetch(`${API_URL}/api/attachments/${attachmentId}`, {
        method: 'DELETE',
        headers: authHeaders()
      });

      if (response.ok) {
        if (selectedUser) fetchAttachments(selectedUser.email);
        alert("🗑️ Pièce jointe supprimée.");
      } else {
        alert("Erreur lors de la suppression de la pièce jointe.");
      }
    } catch (err) {
      console.error("Erreur suppression pièce jointe :", err);
      alert("Impossible de contacter le serveur.");
    }
  };

  // 4. METTRE À JOUR UN EMPLOYÉ
  const startEditing = (user) => {
    const targetUser = user || selectedUser;
    setEditForm({
      name: targetUser.name,
      role: targetUser.role,
      department: targetUser.department,
      avatarUrl: targetUser.avatarUrl || '',
      phone: targetUser.phone || '',
      address: targetUser.address || '',
      contractType: targetUser.contractType || 'CDI',
      manager: targetUser.manager || '',
      accountType: targetUser.accountType || 'employee',
      baseSalary: (targetUser.remuneration?.baseSalary || '').replace(/\s?Ar/gi, ''),
      irsa: (targetUser.remuneration?.retentions?.irsa || '').replace(/\s?Ar/gi, ''),
      cnaps: (targetUser.remuneration?.retentions?.cnaps || '').replace(/\s?Ar/gi, ''),
      ostie: (targetUser.remuneration?.retentions?.ostie || '').replace(/\s?Ar/gi, '')
    });
    setIsEditing(true);
  };

  const handleSaveProfile = async () => {
    if (!selectedUser) return;

    const updatedUser = {
      ...selectedUser,
      name: editForm.name,
      role: editForm.role,
      department: editForm.department,
      avatarUrl: editForm.avatarUrl,
      phone: editForm.phone,
      address: editForm.address,
      contractType: editForm.contractType,
      manager: editForm.manager,
      accountType: isAdmin ? (editForm.accountType || 'employee') : selectedUser.accountType,
      remuneration: {
        ...selectedUser.remuneration,
        baseSalary: String(editForm.baseSalary).includes('Ar') ? editForm.baseSalary : `${editForm.baseSalary} Ar`,
        retentions: {
          irsa: String(editForm.irsa).includes('Ar') ? editForm.irsa : `${editForm.irsa} Ar`,
          cnaps: String(editForm.cnaps).includes('Ar') ? editForm.cnaps : `${editForm.cnaps} Ar`,
          ostie: String(editForm.ostie).includes('Ar') ? editForm.ostie : `${editForm.ostie} Ar`
        }
      }
    };

    try {
      const response = await fetch(`${API_URL}/api/users/${encodeURIComponent(selectedUser.email)}`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify(updatedUser)
      });

      if (response.ok) {
        setSelectedUser(updatedUser);
        setUsers(prevUsers => prevUsers.map(u => u.email === selectedUser.email ? updatedUser : u));
        setIsEditing(false);
        fetchUsers();
        alert("✨ Modifications enregistrées avec succès !");
      } else {
        alert("Erreur lors de la modification sur le serveur.");
      }
    } catch (e) {
      console.error("Erreur de modification :", e);
      alert("Impossible de contacter le serveur.");
    }
  };

  // 5. SUPPRIMER UN EMPLOYÉ
  const handleDeleteEmployee = async (email, name) => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer définitivement la fiche de ${name} ?`)) {
      try {
        const response = await fetch(`${API_URL}/api/users/${encodeURIComponent(email)}`, {
          method: 'DELETE',
          headers: authHeaders()
        });

        if (response.ok) {
          alert(`🗑️ La fiche de ${name} a été supprimée avec succès.`);
          if (selectedUser && selectedUser.email === email) {
            setSelectedUser(null);
            setIsEditing(false);
          }
          fetchUsers();
        } else {
          alert("Impossible de supprimer sur le serveur.");
        }
      } catch (err) {
        console.error("Erreur de suppression :", err);
        alert("Erreur réseau : Impossible de contacter le serveur.");
      }
    }
  };

  // 5B. LIER UN COMPTE EN ATTENTE À UNE FICHE EMPLOYÉ EXISTANTE
  // (cas où un employé possède déjà une fiche et s'auto-inscrit avec un 2e compte)
  const handleLinkAccount = async (accountId) => {
    if (!linkTargetEmail) {
      alert("Veuillez choisir la fiche employé à lier.");
      return;
    }
    try {
      const response = await fetch(`${API_URL}/api/accounts/${accountId}/link`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({ employeeEmail: linkTargetEmail })
      });
      if (response.ok) {
        alert("🔗 Compte lié à la fiche employé et activé.");
        setLinkingAccountId(null);
        setLinkTargetEmail('');
        fetchAccounts();
      } else {
        const errorData = await response.json().catch(() => ({}));
        alert(`Erreur : ${errorData.message || "impossible de lier le compte."}`);
      }
    } catch (err) {
      console.error("Erreur liaison compte :", err);
      alert("Impossible de contacter le serveur.");
    }
  };

  // 5C. CRÉER UNE NOUVELLE FICHE EMPLOYÉ À PARTIR D'UN COMPTE EN ATTENTE
  const handleCreateEmployeeFromAccount = async (accountId, accountName) => {
    if (!window.confirm(`Créer une nouvelle fiche employé pour ${accountName} ?`)) return;
    try {
      const response = await fetch(`${API_URL}/api/accounts/${accountId}/create-employee`, {
        method: 'PUT',
        headers: authHeaders()
      });
      if (response.ok) {
        alert("✅ Fiche employé créée et compte activé.");
        fetchAccounts();
        fetchUsers();
      } else {
        const errorData = await response.json().catch(() => ({}));
        alert(`Erreur : ${errorData.message || "impossible de créer la fiche."}`);
      }
    } catch (err) {
      console.error("Erreur création fiche depuis compte :", err);
      alert("Impossible de contacter le serveur.");
    }
  };

  // 5D. REJETER (SUPPRIMER) UN COMPTE EN ATTENTE
  const handleRejectAccount = async (accountId, accountName) => {
    if (!window.confirm(`Rejeter et supprimer le compte de ${accountName} ?`)) return;
    try {
      const response = await fetch(`${API_URL}/api/accounts/${accountId}`, {
        method: 'DELETE',
        headers: authHeaders()
      });
      if (response.ok) {
        fetchAccounts();
      } else {
        alert("Erreur lors du rejet du compte.");
      }
    } catch (err) {
      console.error("Erreur rejet compte :", err);
      alert("Impossible de contacter le serveur.");
    }
  };

  // 6. METTRE À JOUR LES DOCUMENTS D'ONBOARDING
  const handleDocChange = async (docKey) => {
    if (!selectedUser) return;

    const updatedUser = {
      ...selectedUser,
      onboardingDocs: {
        ...selectedUser.onboardingDocs,
        [docKey]: !selectedUser.onboardingDocs[docKey]
      }
    };

    try {
      const response = await fetch(`${API_URL}/api/users/${encodeURIComponent(selectedUser.email)}`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify(updatedUser)
      });

      if (response.ok) {
        setSelectedUser(updatedUser);
        setUsers(prevUsers => prevUsers.map(u => u.email === selectedUser.email ? updatedUser : u));
      }
    } catch (e) {
      console.error("Erreur lors de la mise à jour de l'onboarding :", e);
    }
  };

  // --- ACTIONS POUR LES CONGÉS ---
  const handleAddLeaveSubmit = async (e) => {
    e.preventDefault();
    if (!leaveStartDate || !leaveEndDate || !leaveEmployeeEmail) {
      alert("Veuillez remplir tous les champs obligatoires.");
      return;
    }

    const targetUser = users.find(u => u.email === leaveEmployeeEmail) || currentUser;

    const newRequest = {
      employeeEmail: leaveEmployeeEmail,
      employeeName: targetUser.name,
      type: leaveType,
      startDate: leaveStartDate,
      endDate: leaveEndDate,
      reason: leaveReason || 'Non renseignée'
    };

    try {
      const response = await fetch(`${API_URL}/api/leaves`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(newRequest)
      });

      if (response.ok) {
        fetchLeaveRequests();
        fetchLeaveBalance(leaveEmployeeEmail);
        setLeaveStartDate('');
        setLeaveEndDate('');
        setLeaveReason('');
        alert("📅 Demande de congé enregistrée avec succès !");
      } else {
        const errorData = await response.json().catch(() => ({}));
        alert(`Erreur serveur : ${errorData.message || response.statusText}`);
      }
    } catch (err) {
      console.error("Erreur réseau congés :", err);
      alert("Impossible de contacter le serveur.");
    }
  };

  const handleUpdateLeaveStatus = async (id, newStatus) => {
    try {
      const response = await fetch(`${API_URL}/api/leaves/${id}`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        fetchLeaveRequests();
      } else {
        alert("Erreur lors de la mise à jour du statut.");
      }
    } catch (err) {
      console.error("Erreur réseau mise à jour congé :", err);
    }
  };

  const handleDeleteLeave = async (id) => {
    if (!window.confirm("Voulez-vous vraiment supprimer cette demande de congé ?")) return;
    try {
      const response = await fetch(`${API_URL}/api/leaves/${id}`, {
        method: 'DELETE',
        headers: authHeaders()
      });

      if (response.ok) {
        fetchLeaveRequests();
        alert("🗑️ Demande de congé supprimée.");
      } else {
        alert("Erreur lors de la suppression de la demande de congé.");
      }
    } catch (err) {
      console.error("Erreur réseau suppression congé :", err);
      alert("Impossible de contacter le serveur.");
    }
  };

  // --- ACTIONS POUR LES SANCTIONS ---
  const handleAddSanctionSubmit = async (e) => {
    e.preventDefault();
    if (!sanctionDate || !sanctionEmployeeEmail || !sanctionReason) {
      alert("Veuillez remplir tous les champs obligatoires de la sanction.");
      return;
    }

    const targetUser = users.find(u => u.email === sanctionEmployeeEmail) || currentUser;

    const newSanction = {
      employeeEmail: sanctionEmployeeEmail,
      employeeName: targetUser.name,
      type: sanctionType,
      date: sanctionDate,
      reason: sanctionReason
    };

    try {
      const response = await fetch(`${API_URL}/api/sanctions`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(newSanction)
      });

      if (response.ok) {
        fetchSanctions();
        setSanctionDate('');
        setSanctionReason('');
        alert("⚠️ Sanction enregistrée avec succès dans le dossier disciplinaire !");
      } else {
        const errorData = await response.json().catch(() => ({}));
        alert(`Erreur serveur : ${errorData.message || response.statusText}`);
      }
    } catch (err) {
      console.error("Erreur réseau sanctions :", err);
      alert("Impossible de contacter le serveur pour enregistrer la sanction.");
    }
  };

  const handleDeleteSanction = async (id) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer cette sanction du dossier disciplinaire ?")) {
      try {
        const response = await fetch(`${API_URL}/api/sanctions/${id}`, {
          method: 'DELETE',
          headers: authHeaders()
        });

        if (response.ok) {
          fetchSanctions();
          alert("🗑️ Sanction supprimée avec succès.");
        } else {
          alert("Erreur lors de la suppression de la sanction.");
        }
      } catch (err) {
        console.error("Erreur suppression sanction :", err);
        alert("Impossible de contacter le serveur.");
      }
    }
  };

  const calculateNetSalary = () => {
    const brut = parseFloat(String(baseSalary).replace(/\s/g, '')) || 0;
    const totalRetenues = (parseFloat(irsa) || 0) + (parseFloat(cnaps) || 0) + (parseFloat(ostie) || 0);
    return Math.max(0, brut - totalRetenues);
  };

  // ⭐ MODIFICATION : on exclut les comptes admin de la liste "employés"
  // (annuaire, statistiques du tableau de bord, recherche) — un admin
  // n'est pas un employé et ne doit pas apparaître dans ces listes,
  // qu'il vienne du compte automatique (.env) ou d'un admin créé manuellement
  // via le formulaire "Ajouter nouveau employé".
  // ⭐ data.json ne contient désormais que de vraies fiches employés : les comptes
  // d'auto-inscription (accounts.json) n'y sont jamais ajoutés automatiquement.
  const employeesOnly = users.filter(u => u.accountType !== 'admin');

  const filteredUsers = employeesOnly.filter(user =>
    user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.role?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // ⭐ MODIFICATION : statistiques calculées sur employeesOnly (sans les admins)
  const totalEmployees = employeesOnly.length;
  const totalCDI = employeesOnly.filter(u => u.contractType === 'CDI').length;
  const pendingDocsCount = employeesOnly.filter(u => {
    const docs = u.onboardingDocs || {};
    return !docs.idCard || !docs.signedContract || !docs.rib;
  }).length;

  const activeLeavesCount = leaveRequests.filter(req => req.status === 'Approuvé').length;
  const totalSanctions = sanctions.length;

  // Attendre la vérification de session avant d'afficher quoi que ce soit
  if (!authChecked) {
    return (
      <div style={{ display: 'flex', height: '100vh', width: '100vw', alignItems: 'center', justifyContent: 'center', background: '#0f172a', color: '#fff', fontFamily: 'Inter, sans-serif' }}>
        Chargement...
      </div>
    );
  }

  // ==========================================
  // SI L'UTILISATEUR N'EST PAS CONNECTÉ
  // ==========================================
  if (!currentUser) {
    return (
      <div style={{ display: 'flex', height: '100vh', width: '100vw', alignItems: 'center', justifyContent: 'center', background: darkMode ? '#0f172a' : 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%)', fontFamily: 'Inter, sans-serif' }}>
        <div style={{ background: darkMode ? '#1e293b' : '#ffffff', color: darkMode ? '#f8fafc' : '#1e293b', padding: '40px', borderRadius: '24px', width: '100%', maxWidth: '420px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)', border: darkMode ? '1px solid #334155' : '1px solid #e2e8f0' }}>

          <div style={{ textAlign: 'center', marginBottom: '30px' }}>
            <img src={logo} alt={companyName} style={{ height: '180px', width: 'auto', filter: 'drop-shadow(0 0 8px rgba(251, 191, 36, 0.3))' }} />
            <p style={{ margin: 0, color: darkMode ? '#94a3b8' : '#64748b', fontSize: '14px' }}>{isRegistering ? 'Création de Compte RH' : 'Portail de Connexion RH'}</p>
          </div>

          {!isRegistering ? (
            <>
              {loginError && <div style={{ background: darkMode ? '#7f1d1d' : '#fff5f5', color: darkMode ? '#fca5a5' : '#c53030', padding: '12px', borderRadius: '10px', fontSize: '13.5px', marginBottom: '20px', border: darkMode ? '1px solid #991b1b' : '1px solid #feb2b2' }}>{loginError}</div>}

              <form onSubmit={handleLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '13px', fontWeight: '600', color: darkMode ? '#cbd5e1' : '#334155' }}>Adresse E-mail</label>
                  <input
                    type="email"
                    placeholder="ex: admin@masoandro.com"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    style={{ padding: '12px 16px', borderRadius: '10px', border: darkMode ? '1px solid #475569' : '1px solid #cbd5e1', background: darkMode ? '#0f172a' : '#fff', color: darkMode ? '#fff' : '#000', fontSize: '14px', outline: 'none' }}
                    required
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '13px', fontWeight: '600', color: darkMode ? '#cbd5e1' : '#334155' }}>Mot de passe</label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    style={{ padding: '12px 16px', borderRadius: '10px', border: darkMode ? '1px solid #475569' : '1px solid #cbd5e1', background: darkMode ? '#0f172a' : '#fff', color: darkMode ? '#fff' : '#000', fontSize: '14px', outline: 'none' }}
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoggingIn}
                  style={{ marginTop: '10px', padding: '13px', background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)', color: '#ffffff', border: 'none', borderRadius: '10px', fontWeight: '700', fontSize: '15px', cursor: isLoggingIn ? 'not-allowed' : 'pointer', opacity: isLoggingIn ? 0.7 : 1, boxShadow: '0 4px 6px -1px rgba(37, 99, 235, 0.3)' }}
                >
                  {isLoggingIn ? 'Connexion en cours...' : 'Se connecter'}
                </button>
              </form>

              <div style={{ marginTop: '16px', textAlign: 'center' }}>
                <button
                  type="button"
                  onClick={() => { setIsRegistering(true); setRegisterError(''); setRegisterSuccess(''); }}
                  style={{ background: 'none', border: 'none', color: darkMode ? '#60a5fa' : '#2563eb', fontSize: '13.5px', fontWeight: '600', cursor: 'pointer', textDecoration: 'underline' }}
                >
                  Créer un nouveau compte
                </button>
              </div>
            </>
          ) : (
            <>
              {registerError && <div style={{ background: darkMode ? '#7f1d1d' : '#fff5f5', color: darkMode ? '#fca5a5' : '#c53030', padding: '12px', borderRadius: '10px', fontSize: '13.5px', marginBottom: '20px', border: darkMode ? '1px solid #991b1b' : '1px solid #feb2b2' }}>{registerError}</div>}
              {registerSuccess && <div style={{ background: darkMode ? '#064e3b' : '#ecfdf5', color: darkMode ? '#6ee7b7' : '#047857', padding: '12px', borderRadius: '10px', fontSize: '13.5px', marginBottom: '20px', border: darkMode ? '1px solid #065f46' : '1px solid #a7f3d0' }}>{registerSuccess}</div>}

              <form onSubmit={handleRegisterSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '13px', fontWeight: '600', color: darkMode ? '#cbd5e1' : '#334155' }}>Nom complet</label>
                  <input
                    type="text"
                    placeholder="ex: Rova Andriamahefa"
                    value={registerName}
                    onChange={(e) => setRegisterName(e.target.value)}
                    style={{ padding: '12px 16px', borderRadius: '10px', border: darkMode ? '1px solid #475569' : '1px solid #cbd5e1', background: darkMode ? '#0f172a' : '#fff', color: darkMode ? '#fff' : '#000', fontSize: '14px', outline: 'none' }}
                    required
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '13px', fontWeight: '600', color: darkMode ? '#cbd5e1' : '#334155' }}>Adresse E-mail</label>
                  <input
                    type="email"
                    placeholder="ex: rova@masoandro.com"
                    value={registerEmail}
                    onChange={(e) => setRegisterEmail(e.target.value)}
                    style={{ padding: '12px 16px', borderRadius: '10px', border: darkMode ? '1px solid #475569' : '1px solid #cbd5e1', background: darkMode ? '#0f172a' : '#fff', color: darkMode ? '#fff' : '#000', fontSize: '14px', outline: 'none' }}
                    required
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '13px', fontWeight: '600', color: darkMode ? '#cbd5e1' : '#334155' }}>Mot de passe (8 caractères min.)</label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={registerPassword}
                    onChange={(e) => setRegisterPassword(e.target.value)}
                    style={{ padding: '12px 16px', borderRadius: '10px', border: darkMode ? '1px solid #475569' : '1px solid #cbd5e1', background: darkMode ? '#0f172a' : '#fff', color: darkMode ? '#fff' : '#000', fontSize: '14px', outline: 'none' }}
                    required
                  />
                </div>

                <button
                  type="submit"
                  style={{ marginTop: '10px', padding: '13px', background: 'linear-gradient(135deg, #059669 0%, #047857 100%)', color: '#ffffff', border: 'none', borderRadius: '10px', fontWeight: '700', fontSize: '15px', cursor: 'pointer', boxShadow: '0 4px 6px -1px rgba(5, 150, 105, 0.3)' }}
                >
                  S'inscrire
                </button>
              </form>

              <div style={{ marginTop: '16px', textAlign: 'center' }}>
                <button
                  type="button"
                  onClick={() => { setIsRegistering(false); setRegisterError(''); setRegisterSuccess(''); }}
                  style={{ background: 'none', border: 'none', color: darkMode ? '#60a5fa' : '#2563eb', fontSize: '13.5px', fontWeight: '600', cursor: 'pointer', textDecoration: 'underline' }}
                >
                  Retour à la connexion
                </button>
              </div>
            </>
          )}

        </div>
      </div>
    );
  }

  // ==========================================
  // APPLICATION PRINCIPALE
  // ==========================================
  return (
    <div className={`classic-app-layout ${darkMode ? 'dark-mode' : ''}`} style={{ background: darkMode ? '#0f172a' : undefined, color: darkMode ? '#f8fafc' : undefined }}>
      {/* SIDEBAR DE GAUCHE */}
      <aside className="classic-sidebar" style={{ background: darkMode ? '#1e293b' : undefined, borderRight: darkMode ? '1px solid #334155' : undefined }}>
        <div className="sidebar-brand">
          <span className="brand-logo" style={{ display: 'flex', alignItems: 'center' }}>
            <img src={logo} alt={companyName} style={{ height: '64px', width: 'auto', borderRadius: '6px' }} />
          </span>
        </div>
        <nav className="sidebar-nav">
          <button className={`nav-item ${currentMenu === 'dashboard' ? 'active' : ''}`} onClick={() => setCurrentMenu('dashboard')}>📊 Tableau de Bord</button>
          <button className={`nav-item ${currentMenu === 'annuaire' ? 'active' : ''}`} onClick={() => setCurrentMenu('annuaire')}>👥 Annuaire & Listes</button>
          <button className={`nav-item ${currentMenu === 'organigramme' ? 'active' : ''}`} onClick={() => setCurrentMenu('organigramme')}>🌳 Organigramme</button>
          <button className={`nav-item ${currentMenu === 'conges' ? 'active' : ''}`} onClick={() => setCurrentMenu('conges')}>📅 Congés & Absences</button>
          <button className={`nav-item ${currentMenu === 'Sanction' ? 'active' : ''}`} onClick={() => setCurrentMenu('Sanction')}>⚖️ Sanctions</button>
          {isAdmin && (
            <button className={`nav-item ${currentMenu === 'parametres' ? 'active' : ''}`} onClick={() => setCurrentMenu('parametres')}>⚙️ Paramètres</button>
          )}
        </nav>
        <div className="sidebar-footer" style={{ borderTop: darkMode ? '1px solid #334155' : '1px solid #374151', paddingTop: '15px', marginTop: 'auto' }}>
          <button onClick={handleLogout} className="nav-item logout-btn" style={{ width: '100%', background: '#ef4444', border: 'none', color: '#fff', textAlign: 'center', padding: '10px 15px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '14px', cursor: 'pointer', fontWeight: '600' }}>🚪 Déconnexion</button>
        </div>
      </aside>

      {/* ZONE DE CONTENU PRINCIPAL */}
      <main className="classic-main-content" style={{ background: darkMode ? '#0f172a' : undefined }}>
        <header className="classic-navbar-top" style={{ background: darkMode ? '#1e293b' : undefined, borderBottom: darkMode ? '1px solid #334155' : undefined }}>
          <div><h3 style={{ color: darkMode ? '#f8fafc' : undefined }}>Portail de Gestion RH {companyName}</h3></div>
          <div>
            <span className="user-profile-tag" style={{ color: '#fff', background: isAdmin ? '#dc2626' : '#059669', padding: '6px 12px', borderRadius: '20px', fontSize: '13px' }}>
              {isAdmin ? '🛡️ Admin' : '👤 Employé'} : <strong>{currentUser.name}</strong>
            </span>
          </div>
        </header>

        <div className="content-viewport">
          {/* VIEW: DASHBOARD */}
          {currentMenu === 'dashboard' && (
            <div className="dashboard-container" style={{ padding: '10px', display: 'flex', flexDirection: 'column', gap: '28px' }}>
              <div className="annuaire-header" style={{ marginBottom: '0px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div className="header-titles">
                  <h2 className="annuaire-title" style={{ color: darkMode ? '#f8fafc' : '#0f172a', fontSize: '26px', fontWeight: '800', letterSpacing: '-0.5px' }}>Tableau de bord</h2>
                  <span className="annuaire-subtitle" style={{ color: darkMode ? '#94a3b8' : '#64748b', fontSize: '13px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>VUE GLOBALE DE L'ENTREPRISE</span>
                </div>
                <div style={{ background: darkMode ? '#1e293b' : '#f1f5f9', padding: '8px 16px', borderRadius: '12px', fontSize: '13px', fontWeight: '600', color: darkMode ? '#60a5fa' : '#2563eb', border: darkMode ? '1px solid #334155' : '1px solid #e2e8f0' }}>
                  🟢 Système Synchronisé
                </div>
              </div>

              <div className="dashboard-stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>

                <div className="stat-card" style={{ background: darkMode ? '#1e293b' : '#ffffff', border: darkMode ? '1px solid #334155' : '1px solid #e2e8f0', color: darkMode ? '#f8fafc' : '#1e293b', padding: '24px', borderRadius: '20px', boxShadow: darkMode ? '0 10px 15px -3px rgba(0, 0, 0, 0.2)' : '0 10px 25px -5px rgba(0, 0, 0, 0.05)', display: 'flex', flexDirection: 'column', gap: '12px', position: 'relative', overflow: 'hidden' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: darkMode ? '#94a3b8' : '#64748b', fontSize: '13.5px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Effectif Total</span>
                    <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: darkMode ? 'rgba(59, 130, 246, 0.15)' : '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>👥</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
                    <h2 style={{ color: darkMode ? '#f8fafc' : '#0f172a', fontSize: '36px', fontWeight: '800', margin: 0, lineHeight: 1 }}>{totalEmployees}</h2>
                    <span style={{ fontSize: '13px', color: '#10b981', fontWeight: '700' }}>Actifs</span>
                  </div>
                  <p style={{ color: darkMode ? '#94a3b8' : '#64748b', fontSize: '13px', margin: 0 }}>Salariés enregistrés dans le registre</p>
                  <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '4px', background: 'linear-gradient(90deg, #3b82f6, #1d4ed8)' }}></div>
                </div>

                <div className="stat-card" style={{ background: darkMode ? '#1e293b' : '#ffffff', border: darkMode ? '1px solid #334155' : '1px solid #e2e8f0', color: darkMode ? '#f8fafc' : '#1e293b', padding: '24px', borderRadius: '20px', boxShadow: darkMode ? '0 10px 15px -3px rgba(0, 0, 0, 0.2)' : '0 10px 25px -5px rgba(0, 0, 0, 0.05)', display: 'flex', flexDirection: 'column', gap: '12px', position: 'relative', overflow: 'hidden' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: darkMode ? '#94a3b8' : '#64748b', fontSize: '13.5px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Contrats CDI</span>
                    <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: darkMode ? 'rgba(16, 185, 129, 0.15)' : '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>📄</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
                    <h2 style={{ color: darkMode ? '#f8fafc' : '#0f172a', fontSize: '36px', fontWeight: '800', margin: 0, lineHeight: 1 }}>{totalCDI}</h2>
                    <span style={{ fontSize: '13px', color: '#10b981', fontWeight: '700' }}>Stables</span>
                  </div>
                  <p style={{ color: darkMode ? '#94a3b8' : '#64748b', fontSize: '13px', margin: 0 }}>Collaborateurs sous contrat permanent</p>
                  <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '4px', background: 'linear-gradient(90deg, #10b981, #059669)' }}></div>
                </div>

                <div className="stat-card" style={{ background: darkMode ? '#1e293b' : '#ffffff', border: darkMode ? '1px solid #334155' : '1px solid #e2e8f0', color: darkMode ? '#f8fafc' : '#1e293b', padding: '24px', borderRadius: '20px', boxShadow: darkMode ? '0 10px 15px -3px rgba(0, 0, 0, 0.2)' : '0 10px 25px -5px rgba(0, 0, 0, 0.05)', display: 'flex', flexDirection: 'column', gap: '12px', position: 'relative', overflow: 'hidden' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: darkMode ? '#94a3b8' : '#64748b', fontSize: '13.5px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>En Congé</span>
                    <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: darkMode ? 'rgba(245, 158, 11, 0.15)' : '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>🌴</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
                    <h2 style={{ color: darkMode ? '#f8fafc' : '#0f172a', fontSize: '36px', fontWeight: '800', margin: 0, lineHeight: 1 }}>{activeLeavesCount}</h2>
                    <span style={{ fontSize: '13px', color: '#f59e0b', fontWeight: '700' }}>Absents</span>
                  </div>
                  <p style={{ color: darkMode ? '#94a3b8' : '#64748b', fontSize: '13px', margin: 0 }}>Collaborateurs en congé validé</p>
                  <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '4px', background: 'linear-gradient(90deg, #f59e0b, #d97706)' }}></div>
                </div>

                <div className="stat-card" style={{ background: darkMode ? '#1e293b' : '#ffffff', border: darkMode ? '1px solid #334155' : '1px solid #e2e8f0', color: darkMode ? '#f8fafc' : '#1e293b', padding: '24px', borderRadius: '20px', boxShadow: darkMode ? '0 10px 15px -3px rgba(0, 0, 0, 0.2)' : '0 10px 25px -5px rgba(0, 0, 0, 0.05)', display: 'flex', flexDirection: 'column', gap: '12px', position: 'relative', overflow: 'hidden' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: darkMode ? '#94a3b8' : '#64748b', fontSize: '13.5px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Dossiers Incomplets</span>
                    <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: darkMode ? 'rgba(239, 68, 68, 0.15)' : '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>⚠️</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
                    <h2 style={{ color: '#ef4444', fontSize: '36px', fontWeight: '800', margin: 0, lineHeight: 1 }}>{pendingDocsCount}</h2>
                    <span style={{ fontSize: '13px', color: '#ef4444', fontWeight: '700' }}>Attention</span>
                  </div>
                  <p style={{ color: darkMode ? '#94a3b8' : '#64748b', fontSize: '13px', margin: 0 }}>Checklists administratives à compléter</p>
                  <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '4px', background: 'linear-gradient(90deg, #ef4444, #dc2626)' }}></div>
                </div>

                <div
                  className="stat-card"
                  onClick={() => setCurrentMenu('Sanction')}
                  style={{ background: darkMode ? '#1e293b' : '#ffffff', border: darkMode ? '1px solid #334155' : '1px solid #e2e8f0', color: darkMode ? '#f8fafc' : '#1e293b', padding: '24px', borderRadius: '20px', boxShadow: darkMode ? '0 10px 15px -3px rgba(0, 0, 0, 0.2)' : '0 10px 25px -5px rgba(0, 0, 0, 0.05)', display: 'flex', flexDirection: 'column', gap: '12px', position: 'relative', overflow: 'hidden', cursor: 'pointer', transition: 'transform 0.2s' }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: darkMode ? '#94a3b8' : '#64748b', fontSize: '13.5px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Sanctions Actives</span>
                    <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: darkMode ? 'rgba(220, 38, 38, 0.15)' : '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>⚖️</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
                    <h2 style={{ color: '#dc2626', fontSize: '36px', fontWeight: '800', margin: 0, lineHeight: 1 }}>{totalSanctions}</h2>
                    <span style={{ fontSize: '13px', color: '#dc2626', fontWeight: '700' }}>Discipline</span>
                  </div>
                  <p style={{ color: darkMode ? '#94a3b8' : '#64748b', fontSize: '13px', margin: 0 }}>Mesures disciplinaires enregistrées</p>
                  <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '4px', background: 'linear-gradient(90deg, #dc2626, #991b1b)' }}></div>
                </div>

              </div>
            </div>
          )}

          {/* VIEW: ANNUAIRE */}
          {currentMenu === 'annuaire' && (
            <div className="annuaire-container">
              <div className="annuaire-header">
                <div className="header-titles"><h2 className="annuaire-title" style={{ color: darkMode ? '#f8fafc' : undefined }}>Registre des Employés</h2></div>
                <div className="header-search-and-action">
                  <input type="text" placeholder="Rechercher par nom ou rôle..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="search-input" style={{ background: darkMode ? '#1e293b' : undefined, color: darkMode ? '#fff' : undefined, border: darkMode ? '1px solid #334155' : undefined }} />
                  {isAdmin && (
                    <button className="btn-classic-add" onClick={() => { const m = document.getElementById('add-employee-modal'); if(m) m.style.display = 'flex'; }}>+ Ajouter nouveau employé</button>
                  )}
                </div>
              </div>
              <div className="employee-cards-list">
                {filteredUsers.length === 0 ? (
                  <div style={{ padding: '20px', textAlign: 'center', color: '#9ca3af', width: '100%' }}>Aucun employé enregistré. Cliquez sur "Ajouter nouveau employé" pour commencer.</div>
                ) : (
                  filteredUsers.map((user, index) => (
                    <div className="employee-row-card" key={index} onClick={() => { setSelectedUser(user); setIsEditing(false); }} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px', transition: 'background 0.2s', background: darkMode ? '#1e293b' : '#fff', border: darkMode ? '1px solid #334155' : '1px solid #e2e8f0', color: darkMode ? '#f8fafc' : '#1e293b', marginBottom: '8px', borderRadius: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '15px', flex: 2 }}>
                        <div className="row-avatar">
                          <img
                            src={user.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=1e40af&color=fff&size=128`}
                            alt={user.name}
                            style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
                          />
                        </div>
                        <div className="row-user-details">
                          <span className="user-name" style={{ color: darkMode ? '#f8fafc' : undefined }}>{user.name}</span>
                          <span className="user-role" style={{ color: darkMode ? '#94a3b8' : undefined }}>{user.role}</span>
                        </div>
                      </div>
                      <div className="row-department" style={{ flex: 1, color: darkMode ? '#cbd5e1' : undefined }}>{user.department}</div>
                      <div className="row-entry-date" style={{ flex: 1.5, color: darkMode ? '#cbd5e1' : undefined }}>📞 <strong>{user.phone || 'Non renseigné'}</strong></div>
                      <div className="row-status" style={{ flex: 1 }}><span className="status-badge-active" style={{ background: darkMode ? '#064e3b' : undefined, color: darkMode ? '#6ee7b7' : undefined }}>Base : {user.remuneration?.baseSalary || '0 Ar'}</span></div>

                      {isAdmin && (
                        <div className="row-actions" onClick={(e) => e.stopPropagation()} style={{ display: 'flex', gap: '8px' }}>
                          <button onClick={() => { setSelectedUser(user); startEditing(user); }} style={{ background: darkMode ? '#334155' : '#f1f5f9', color: darkMode ? '#60a5fa' : '#1e40af', border: darkMode ? '1px solid #475569' : '1px solid #cbd5e1', padding: '6px 12px', borderRadius: '6px', fontSize: '13px', cursor: 'pointer', fontWeight: '500' }}>✏️</button>
                          <button onClick={() => handleDeleteEmployee(user.email, user.name)} style={{ background: darkMode ? '#7f1d1d' : '#fff5f5', color: darkMode ? '#fca5a5' : '#c53030', border: darkMode ? '1px solid #991b1b' : '1px solid #feb2b2', padding: '6px 12px', borderRadius: '6px', fontSize: '13px', cursor: 'pointer', fontWeight: '500' }}>🗑️</button>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>

              {/* Comptes d'auto-inscription en attente (accounts.json) — visibles uniquement par l'admin.
                  Ce ne sont PAS des fiches employés : l'admin choisit de les lier à une fiche
                  existante (un employé peut avoir plusieurs comptes) ou d'en créer une nouvelle. */}
              {isAdmin && pendingAccounts.length > 0 && (
                <div style={{ marginTop: '28px', background: darkMode ? '#1e293b' : '#fffbeb', border: darkMode ? '1px solid #78350f' : '1px solid #fde68a', borderRadius: '14px', padding: '18px 20px' }}>
                  <h3 style={{ margin: '0 0 12px 0', fontSize: '15px', color: darkMode ? '#fcd34d' : '#92400e', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    ⏳ Comptes en attente de validation ({pendingAccounts.length})
                  </h3>
                  <p style={{ margin: '0 0 14px 0', fontSize: '12.5px', color: darkMode ? '#94a3b8' : '#78716c' }}>
                    Ce sont des comptes de connexion, pas des fiches employés. Liez-les à une fiche existante ou créez-en une nouvelle.
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {pendingAccounts.map((account) => (
                      <div key={account.id} style={{ padding: '10px 14px', borderRadius: '10px', background: darkMode ? '#0f172a' : '#ffffff', border: darkMode ? '1px solid #334155' : '1px solid #fde68a' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
                          <div>
                            <div style={{ fontWeight: '600', color: darkMode ? '#f8fafc' : '#1e293b', fontSize: '14px' }}>{account.name}</div>
                            <div style={{ fontSize: '12.5px', color: darkMode ? '#94a3b8' : '#64748b' }}>{account.email}</div>
                          </div>
                          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                            <button
                              onClick={() => setLinkingAccountId(linkingAccountId === account.id ? null : account.id)}
                              style={{ background: darkMode ? '#1e3a8a' : '#eff6ff', color: darkMode ? '#93c5fd' : '#1e40af', border: darkMode ? '1px solid #1e3a8a' : '1px solid #bfdbfe', padding: '7px 14px', borderRadius: '6px', fontSize: '12.5px', fontWeight: '600', cursor: 'pointer' }}
                            >
                              🔗 Lier à un employé
                            </button>
                            <button onClick={() => handleCreateEmployeeFromAccount(account.id, account.name)} style={{ background: '#059669', color: '#fff', border: 'none', padding: '7px 14px', borderRadius: '6px', fontSize: '12.5px', fontWeight: '600', cursor: 'pointer' }}>➕ Créer une fiche</button>
                            <button onClick={() => handleRejectAccount(account.id, account.name)} style={{ background: darkMode ? '#7f1d1d' : '#fff5f5', color: darkMode ? '#fca5a5' : '#c53030', border: darkMode ? '1px solid #991b1b' : '1px solid #feb2b2', padding: '7px 14px', borderRadius: '6px', fontSize: '12.5px', fontWeight: '600', cursor: 'pointer' }}>🗑️ Rejeter</button>
                          </div>
                        </div>

                        {linkingAccountId === account.id && (
                          <div style={{ marginTop: '10px', display: 'flex', gap: '8px', alignItems: 'center', paddingTop: '10px', borderTop: darkMode ? '1px dashed #334155' : '1px dashed #e2e8f0' }}>
                            <select
                              value={linkTargetEmail}
                              onChange={(e) => setLinkTargetEmail(e.target.value)}
                              style={{ flex: 1, padding: '8px', borderRadius: '8px', border: darkMode ? '1px solid #475569' : '1px solid #cbd5e1', background: darkMode ? '#1e293b' : '#fff', color: darkMode ? '#fff' : '#000', fontSize: '13px' }}
                            >
                              <option value="">— Choisir une fiche employé —</option>
                              {employeesOnly.map((emp, i) => (
                                <option key={i} value={emp.email}>{emp.name} ({emp.email})</option>
                              ))}
                            </select>
                            <button onClick={() => handleLinkAccount(account.id)} style={{ background: '#2563eb', color: '#fff', border: 'none', padding: '8px 14px', borderRadius: '6px', fontSize: '12.5px', fontWeight: '600', cursor: 'pointer' }}>Confirmer</button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* VIEW: ORGANIGRAMME */}
          {currentMenu === 'organigramme' && <div className="placeholder-section" style={{ color: darkMode ? '#f8fafc' : undefined }}><h2>🌳 Structure & Organigramme</h2><p style={{ color: darkMode ? '#94a3b8' : undefined }}>Visualisation de l'arbre hiérarchique en cours de développement.</p></div>}

          {/* VIEW: CONGÉS */}
          {currentMenu === 'conges' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', padding: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: darkMode ? '2px solid #334155' : '2px solid #e2e8f0', paddingBottom: '12px' }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: '24px', color: darkMode ? '#f8fafc' : '#1e293b' }}>📅 Gestion des Absences & Congés</h2>
                  <p style={{ margin: '4px 0 0 0', color: darkMode ? '#94a3b8' : '#64748b', fontSize: '14px' }}>Planifiez les absences et suivez les validations des collaborateurs {companyName}.</p>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px', alignItems: 'start' }}>
                <div style={{ background: darkMode ? '#1e293b' : '#ffffff', color: darkMode ? '#f8fafc' : '#1e293b', padding: '20px', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03)', border: darkMode ? '1px solid #334155' : '1px solid #e2e8f0' }}>
                  <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', color: darkMode ? '#60a5fa' : '#1e3a8a', borderBottom: darkMode ? '1px solid #334155' : '1px solid #f1f5f9', paddingBottom: '8px' }}>Nouvelle Demande</h3>
                  <form onSubmit={handleAddLeaveSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <label style={{ fontSize: '12px', fontWeight: '600', color: darkMode ? '#cbd5e1' : '#475569' }}>Collaborateur *</label>
                      <select value={leaveEmployeeEmail} onChange={(e) => setLeaveEmployeeEmail(e.target.value)} style={{ padding: '10px', borderRadius: '8px', border: darkMode ? '1px solid #475569' : '1px solid #cbd5e1', background: darkMode ? '#0f172a' : '#fff', color: darkMode ? '#fff' : '#000', fontSize: '14px' }}>
                        {employeesOnly.map((u, i) => (
                          <option key={i} value={u.email}>{u.name} ({u.role})</option>
                        ))}
                        {employeesOnly.length === 0 && <option value={currentUser.email}>{currentUser.name}</option>}
                      </select>
                    </div>

                    {leaveBalance ? (
                      <div style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        padding: '10px 14px', borderRadius: '10px',
                        background: darkMode ? '#0f172a' : '#eff6ff',
                        border: darkMode ? '1px solid #334155' : '1px solid #bfdbfe'
                      }}>
                        <span style={{ fontSize: '13px', fontWeight: '600', color: darkMode ? '#94a3b8' : '#475569' }}>🌴 Solde restant</span>
                        <span style={{ fontSize: '15px', fontWeight: '800', color: leaveBalance.remainingDays <= 3 ? '#ef4444' : (darkMode ? '#60a5fa' : '#1e40af') }}>
                          {leaveBalance.remainingDays} / {leaveBalance.totalQuota} jours
                        </span>
                      </div>
                    ) : (
                      leaveEmployeeEmail && (
                        <div style={{
                          padding: '8px 14px', borderRadius: '10px', fontSize: '12px',
                          background: darkMode ? '#7f1d1d' : '#fff5f5',
                          border: darkMode ? '1px solid #991b1b' : '1px solid #feb2b2',
                          color: darkMode ? '#fca5a5' : '#c53030'
                        }}>
                          ⚠️ Solde indisponible — vérifiez que le serveur Node est démarré (voir la console du navigateur, F12).
                        </div>
                      )
                    )}

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <label style={{ fontSize: '12px', fontWeight: '600', color: darkMode ? '#cbd5e1' : '#475569' }}>Type d'absence</label>
                      <select value={leaveType} onChange={(e) => setLeaveType(e.target.value)} style={{ padding: '10px', borderRadius: '8px', border: darkMode ? '1px solid #475569' : '1px solid #cbd5e1', background: darkMode ? '#0f172a' : '#fff', color: darkMode ? '#fff' : '#000', fontSize: '14px' }}>
                        <option value="Congé Payé">🌴 Congé Payé</option>
                        <option value="Absence Maladie">🤒 Absence Maladie</option>
                        <option value="Permission Exceptionnelle">🚗 Permission Exceptionnelle</option>
                        <option value="Maternité / Paternité">🍼 Maternité / Paternité</option>
                      </select>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <label style={{ fontSize: '12px', fontWeight: '600', color: darkMode ? '#cbd5e1' : '#475569' }}>Date de début *</label>
                        <input type="date" value={leaveStartDate} onChange={(e) => setLeaveStartDate(e.target.value)} style={{ padding: '9px', borderRadius: '8px', border: darkMode ? '1px solid #475569' : '1px solid #cbd5e1', background: darkMode ? '#0f172a' : '#fff', color: darkMode ? '#fff' : '#000', fontSize: '14px' }} required />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <label style={{ fontSize: '12px', fontWeight: '600', color: darkMode ? '#cbd5e1' : '#475569' }}>Date de fin *</label>
                        <input type="date" value={leaveEndDate} onChange={(e) => setLeaveEndDate(e.target.value)} style={{ padding: '9px', borderRadius: '8px', border: darkMode ? '1px solid #475569' : '1px solid #cbd5e1', background: darkMode ? '#0f172a' : '#fff', color: darkMode ? '#fff' : '#000', fontSize: '14px' }} required />
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <label style={{ fontSize: '12px', fontWeight: '600', color: darkMode ? '#cbd5e1' : '#475569' }}>Motif / Commentaire</label>
                      <textarea placeholder="Ex: Voyage familial..." value={leaveReason} onChange={(e) => setLeaveReason(e.target.value)} style={{ padding: '10px', borderRadius: '8px', border: darkMode ? '1px solid #475569' : '1px solid #cbd5e1', background: darkMode ? '#0f172a' : '#fff', color: darkMode ? '#fff' : '#000', minHeight: '60px', resize: 'vertical', fontSize: '14px', fontFamily: 'inherit' }} />
                    </div>

                    <button type="submit" style={{ marginTop: '6px', padding: '11px', background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', fontSize: '14px' }}>Enregistrer le congé</button>
                  </form>
                </div>

                <div style={{ background: darkMode ? '#1e293b' : '#ffffff', color: darkMode ? '#f8fafc' : '#1e293b', padding: '20px', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03)', border: darkMode ? '1px solid #334155' : '1px solid #e2e8f0' }}>
                  <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', color: darkMode ? '#60a5fa' : '#1e3a8a', borderBottom: darkMode ? '1px solid #334155' : '1px solid #f1f5f9', paddingBottom: '8px' }}>Historique & Demandes en cours</h3>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {leaveRequests.length === 0 ? (
                      <div style={{ color: '#9ca3af', padding: '20px', textAlign: 'center' }}>Aucune demande enregistrée pour le moment.</div>
                    ) : (
                      leaveRequests.map((req) => (
                        <div key={req.id} style={{ border: darkMode ? '1px solid #334155' : '1px solid #e2e8f0', borderRadius: '12px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px', background: darkMode ? (req.status === 'Approuvé' ? '#064e3b' : req.status === 'Refusé' ? '#7f1d1d' : '#0f172a') : (req.status === 'Approuvé' ? '#f0fdf4' : req.status === 'Refusé' ? '#fff5f5' : '#fafafa') }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                              <strong style={{ color: darkMode ? '#f8fafc' : '#1e293b', fontSize: '15px' }}>{req.employeeName}</strong>
                              <div style={{ fontSize: '12.5px', color: darkMode ? '#94a3b8' : '#64748b', marginTop: '2px' }}>{req.employeeEmail}</div>
                            </div>
                            <span style={{ fontSize: '12px', fontWeight: '700', padding: '4px 10px', borderRadius: '20px', background: req.status === 'Approuvé' ? '#bbf7d0' : req.status === 'Refusé' ? '#fed7d7' : '#e2e8f0', color: req.status === 'Approuvé' ? '#166534' : req.status === 'Refusé' ? '#9b1c1c' : '#475569' }}>
                              {req.status}
                            </span>
                          </div>

                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', background: darkMode ? '#1e293b' : '#ffffff', padding: '10px', borderRadius: '8px', border: darkMode ? '1px solid #334155' : '1px solid #f1f5f9', fontSize: '13px' }}>
                            <div style={{ color: darkMode ? '#cbd5e1' : undefined }}>📁 <strong>Type :</strong> {req.type}</div>
                            <div style={{ color: darkMode ? '#cbd5e1' : undefined }}>📝 <strong>Motif :</strong> {req.reason}</div>
                            <div style={{ gridColumn: '1 / -1', borderTop: darkMode ? '1px dashed #334155' : '1px dashed #e2e8f0', marginTop: '4px', paddingTop: '4px', color: darkMode ? '#60a5fa' : '#1e40af', fontWeight: '500' }}>
                              📅 Du {req.startDate} au {req.endDate}
                            </div>
                          </div>

                          {isAdmin && (
                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                              {req.status === 'En attente' && (
                                <>
                                  <button onClick={() => handleUpdateLeaveStatus(req.id, 'Refusé')} style={{ padding: '6px 12px', background: darkMode ? '#1e293b' : '#fff', color: '#c53030', border: '1px solid #feb2b2', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>❌ Refuser</button>
                                  <button onClick={() => handleUpdateLeaveStatus(req.id, 'Approuvé')} style={{ padding: '6px 12px', background: '#10b981', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>✅ Approuver</button>
                                </>
                              )}
                              <button onClick={() => handleDeleteLeave(req.id)} style={{ padding: '6px 12px', background: darkMode ? '#1e293b' : '#fff', color: '#c53030', border: '1px solid #feb2b2', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>🗑️ Supprimer</button>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* VIEW: SANCTION */}
          {currentMenu === 'Sanction' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', padding: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: darkMode ? '2px solid #334155' : '2px solid #e2e8f0', paddingBottom: '12px' }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: '24px', color: darkMode ? '#f8fafc' : '#1e293b' }}>⚖️ Gestion des Sanctions & Discipline</h2>
                  <p style={{ margin: '4px 0 0 0', color: darkMode ? '#94a3b8' : '#64748b', fontSize: '14px' }}>Enregistrez et suivez les mesures disciplinaires prises au sein de {companyName}.</p>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: isAdmin ? '1fr 2fr' : '1fr', gap: '24px', alignItems: 'start' }}>
                {isAdmin && (
                <div style={{ background: darkMode ? '#1e293b' : '#ffffff', color: darkMode ? '#f8fafc' : '#1e293b', padding: '20px', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03)', border: darkMode ? '1px solid #334155' : '1px solid #e2e8f0' }}>
                  <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', color: darkMode ? '#f87171' : '#dc2626', borderBottom: darkMode ? '1px solid #334155' : '1px solid #f1f5f9', paddingBottom: '8px' }}>Émettre une Sanction</h3>
                  <form onSubmit={handleAddSanctionSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <label style={{ fontSize: '12px', fontWeight: '600', color: darkMode ? '#cbd5e1' : '#475569' }}>Collaborateur *</label>
                      <select value={sanctionEmployeeEmail} onChange={(e) => setSanctionEmployeeEmail(e.target.value)} style={{ padding: '10px', borderRadius: '8px', border: darkMode ? '1px solid #475569' : '1px solid #cbd5e1', background: darkMode ? '#0f172a' : '#fff', color: darkMode ? '#fff' : '#000', fontSize: '14px' }}>
                        {employeesOnly.map((u, i) => (
                          <option key={i} value={u.email}>{u.name} ({u.role})</option>
                        ))}
                        {employeesOnly.length === 0 && <option value={currentUser.email}>{currentUser.name}</option>}
                      </select>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <label style={{ fontSize: '12px', fontWeight: '600', color: darkMode ? '#cbd5e1' : '#475569' }}>Type de sanction *</label>
                      <select value={sanctionType} onChange={(e) => setSanctionType(e.target.value)} style={{ padding: '10px', borderRadius: '8px', border: darkMode ? '1px solid #475569' : '1px solid #cbd5e1', background: darkMode ? '#0f172a' : '#fff', color: darkMode ? '#fff' : '#000', fontSize: '14px' }}>
                        <option value="Avertissement écrit"> Avertissement écrit</option>
                        <option value="Blâme">Blâme</option>
                        <option value="Mise à pied"> Mise à pied</option>
                        <option value="Licenciement pour faute"> Licenciement pour faute</option>
                      </select>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <label style={{ fontSize: '12px', fontWeight: '600', color: darkMode ? '#cbd5e1' : '#475569' }}>Date de notification *</label>
                      <input type="date" value={sanctionDate} onChange={(e) => setSanctionDate(e.target.value)} style={{ padding: '9px', borderRadius: '8px', border: darkMode ? '1px solid #475569' : '1px solid #cbd5e1', background: darkMode ? '#0f172a' : '#fff', color: darkMode ? '#fff' : '#000', fontSize: '14px' }} required />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <label style={{ fontSize: '12px', fontWeight: '600', color: darkMode ? '#cbd5e1' : '#475569' }}>Motif / Faits reprochés *</label>
                      <textarea placeholder="Ex: Retards répétés, insubordination..." value={sanctionReason} onChange={(e) => setSanctionReason(e.target.value)} style={{ padding: '10px', borderRadius: '8px', border: darkMode ? '1px solid #475569' : '1px solid #cbd5e1', background: darkMode ? '#0f172a' : '#fff', color: darkMode ? '#fff' : '#000', minHeight: '80px', resize: 'vertical', fontSize: '14px', fontFamily: 'inherit' }} required />
                    </div>

                    <button type="submit" style={{ marginTop: '6px', padding: '11px', background: 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', fontSize: '14px' }}>Enregistrer la sanction</button>
                  </form>
                </div>
                )}

                <div style={{ background: darkMode ? '#1e293b' : '#ffffff', color: darkMode ? '#f8fafc' : '#1e293b', padding: '20px', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03)', border: darkMode ? '1px solid #334155' : '1px solid #e2e8f0' }}>
                  <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', color: darkMode ? '#f87171' : '#dc2626', borderBottom: darkMode ? '1px solid #334155' : '1px solid #f1f5f9', paddingBottom: '8px' }}>Dossier Disciplinaire (Historique)</h3>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {sanctions.length === 0 ? (
                      <div style={{ color: '#9ca3af', padding: '20px', textAlign: 'center' }}>Aucune sanction enregistrée. Le registre disciplinaire est vierge.</div>
                    ) : (
                      sanctions.map((sanc) => (
                        <div key={sanc.id} style={{ border: darkMode ? '1px solid #991b1b' : '1px solid #feb2b2', borderRadius: '12px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px', background: darkMode ? '#7f1d1d' : '#fff5f5' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                              <strong style={{ color: darkMode ? '#f8fafc' : '#1e293b', fontSize: '15px' }}>{sanc.employeeName}</strong>
                              <div style={{ fontSize: '12.5px', color: darkMode ? '#cbd5e1' : '#64748b', marginTop: '2px' }}>{sanc.employeeEmail}</div>
                            </div>
                            <span style={{ fontSize: '12px', fontWeight: '700', padding: '4px 10px', borderRadius: '20px', background: '#fee2e2', color: '#991b1b' }}>
                              {sanc.type}
                            </span>
                          </div>

                          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '8px', background: darkMode ? '#1e293b' : '#ffffff', color: darkMode ? '#f8fafc' : '#1e293b', padding: '10px', borderRadius: '8px', border: darkMode ? '1px solid #334155' : '1px solid #f1f5f9', fontSize: '13px' }}>
                            <div style={{ color: darkMode ? '#fca5a5' : '#b91c1c' }}>📅 <strong>Date :</strong> {sanc.date}</div>
                            <div>📝 <strong>Motif :</strong> {sanc.reason}</div>
                          </div>

                          {isAdmin && (
                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                              <button onClick={() => handleDeleteSanction(sanc.id)} style={{ padding: '6px 12px', background: darkMode ? '#1e293b' : '#fff', color: '#c53030', border: '1px solid #feb2b2', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>🗑️ Supprimer du dossier</button>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* VIEW: PARAMÈTRES (réservé aux admins) */}
          {currentMenu === 'parametres' && isAdmin && (
            <div style={{ padding: '20px', maxWidth: '800px', color: darkMode ? '#f8fafc' : undefined }}>
              <h2>⚙️ Paramètres Généraux</h2>
              <div style={{ background: darkMode ? '#1e293b' : '#fff', color: darkMode ? '#f8fafc' : '#1e293b', padding: '24px', borderRadius: '16px', border: darkMode ? '1px solid #334155' : '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ fontSize: '13px', fontWeight: '600', color: darkMode ? '#cbd5e1' : '#334155' }}>Nom de l'entreprise :</label>
                  <input type="text" value={companyName} onChange={(e) => setCompanyName(e.target.value)} style={{ display: 'block', width: '100%', padding: '10px', marginTop: '6px', borderRadius: '8px', border: darkMode ? '1px solid #475569' : '1px solid #cbd5e1', background: darkMode ? '#0f172a' : '#fff', color: darkMode ? '#fff' : '#000', fontSize: '14px' }} />
                </div>

                <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', background: darkMode ? '#0f172a' : '#f8fafc', borderRadius: '10px', border: darkMode ? '1px solid #334155' : '1px solid #e2e8f0' }}>
                  <div>
                    <label style={{ fontSize: '14px', fontWeight: '700', color: darkMode ? '#f8fafc' : '#1e293b', display: 'block' }}>🌙 Mode Sombre</label>
                    <span style={{ fontSize: '12px', color: darkMode ? '#94a3b8' : '#64748b' }}>Basculer l'interface entre le mode clair et le mode sombre.</span>
                  </div>
                  <button
                    onClick={() => setDarkMode(!darkMode)}
                    style={{
                      padding: '8px 16px',
                      background: darkMode ? '#3b82f6' : '#334155',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontWeight: '600',
                      fontSize: '13px'
                    }}
                  >
                    {darkMode ? 'Désactiver (Clair)' : 'Activer (Sombre)'}
                  </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  <div>
                    <label style={{ fontSize: '13px', fontWeight: '600', color: darkMode ? '#cbd5e1' : '#334155' }}>Taux CNaPS (ex: 0.01 pour 1%) :</label>
                    <input type="number" step="0.001" value={cnapsRate} onChange={(e) => setCnapsRate(parseFloat(e.target.value) || 0)} style={{ display: 'block', width: '100%', padding: '10px', marginTop: '6px', borderRadius: '8px', border: darkMode ? '1px solid #475569' : '1px solid #cbd5e1', background: darkMode ? '#0f172a' : '#fff', color: darkMode ? '#fff' : '#000', fontSize: '14px' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '13px', fontWeight: '600', color: darkMode ? '#cbd5e1' : '#334155' }}>Taux OSTIE (ex: 0.01 pour 1%) :</label>
                    <input type="number" step="0.001" value={ostieRate} onChange={(e) => setOstieRate(parseFloat(e.target.value) || 0)} style={{ display: 'block', width: '100%', padding: '10px', marginTop: '6px', borderRadius: '8px', border: darkMode ? '1px solid #475569' : '1px solid #cbd5e1', background: darkMode ? '#0f172a' : '#fff', color: darkMode ? '#fff' : '#000', fontSize: '14px' }} />
                  </div>
                </div>
                <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: darkMode ? '1px solid #334155' : '1px solid #f1f5f9' }}>
                  <button onClick={() => alert("✅ Paramètres appliqués avec succès !")} style={{ padding: '10px 20px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}>
                    Enregistrer les configurations
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* PANNEAU LATÉRAL (DRAWER) */}
      {selectedUser && (
        <div className="side-drawer-overlay" onClick={() => { setSelectedUser(null); setIsEditing(false); }}>
          <div className="side-drawer" onClick={(e) => e.stopPropagation()} style={{ background: darkMode ? '#1e293b' : undefined, color: darkMode ? '#f8fafc' : undefined }}>
            <div className="drawer-header" style={{ borderBottom: darkMode ? '1px solid #334155' : undefined }}>
              <div className="drawer-avatar">
                <img
                  src={isEditing ? (editForm.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(editForm.name)}&background=1e40af&color=fff&size=128`) : (selectedUser.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedUser.name)}&background=1e40af&color=fff&size=128`)}
                  alt={selectedUser.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
                />
              </div>
              <div className="drawer-titles">
                {isEditing ? <input type="text" value={editForm.name} onChange={(e) => setEditForm({...editForm, name: e.target.value})} className="drawer-edit-input" style={{ background: darkMode ? '#0f172a' : undefined, color: darkMode ? '#fff' : undefined }} /> : <h2 style={{ color: darkMode ? '#f8fafc' : undefined }}>{selectedUser.name}</h2>}
                <p style={{ color: darkMode ? '#94a3b8' : undefined }}>
                  {selectedUser.role} — <strong>{selectedUser.department}</strong>
                  {selectedUser.accountType === 'admin' && <span style={{ marginLeft: '6px', fontSize: '11px', background: '#dc2626', color: '#fff', padding: '2px 8px', borderRadius: '10px', fontWeight: '700' }}>ADMIN</span>}
                </p>
              </div>
              <button className="drawer-close" onClick={() => { setSelectedUser(null); setIsEditing(false); }} style={{ color: darkMode ? '#fff' : undefined }}>&times;</button>
            </div>

            {isAdmin && (
            <div className="drawer-action-bar">
              {isEditing ? (
                <>
                  <button className="btn-drawer-save" onClick={handleSaveProfile}>Enregistrer la modification</button>
                  <button className="btn-drawer-cancel" onClick={() => setIsEditing(false)}>Annuler</button>
                </>
              ) : (
                <div style={{ display: 'flex', gap: '10px', width: '100%' }}>
                  <button className="btn-drawer-edit" onClick={() => startEditing(selectedUser)} style={{ flex: 1, background: darkMode ? '#334155' : undefined, color: darkMode ? '#60a5fa' : undefined, border: darkMode ? '1px solid #475569' : undefined }}>✏️ Modifier la fiche</button>
                  <button onClick={() => handleDeleteEmployee(selectedUser.email, selectedUser.name)} style={{ background: '#dc2626', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}>🗑️ Supprimer</button>
                </div>
              )}
            </div>
            )}

            <div className="drawer-body">
              <div className="drawer-section">
                <h3 style={{ color: darkMode ? '#60a5fa' : undefined }}>📁 Contacts </h3>
                <div className="classic-grid" style={{ color: darkMode ? '#cbd5e1' : undefined }}>
                  {isEditing && (
                    <div style={{ gridColumn: '1 / -1', display: 'flex', flexDirection: 'column', gap: '6px', background: darkMode ? '#0f172a' : '#f1f5f9', padding: '12px', borderRadius: '10px', border: darkMode ? '1px dashed #475569' : '1px dashed #cbd5e1', marginBottom: '10px' }}>
                      <label style={{ fontSize: '12.5px', fontWeight: '700', color: darkMode ? '#f8fafc' : '#1e293b' }}>📸 Importer une photo (Format photo)</label>
                      <input type="file" accept="image/*" onChange={handleFileChange} style={{ fontSize: '13px', marginTop: '4px', color: darkMode ? '#fff' : undefined }} />
                    </div>
                  )}

                  {isEditing && isAdmin && (
                    <div style={{ gridColumn: '1 / -1', display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '4px' }}>
                      <label style={{ fontSize: '12.5px', fontWeight: '700', color: darkMode ? '#f8fafc' : '#1e293b' }}>🛡️ Niveau d'accès</label>
                      <select value={editForm.accountType} onChange={(e) => setEditForm({...editForm, accountType: e.target.value})} className="drawer-edit-input" style={{ background: darkMode ? '#0f172a' : undefined, color: darkMode ? '#fff' : undefined }}>
                        <option value="employee">Employé</option>
                        <option value="admin">Administrateur</option>
                      </select>
                    </div>
                  )}

                  <div><span>Email:</span> {selectedUser.email}</div>
                  <div><span>Téléphone:</span> {isEditing ? <input type="text" value={editForm.phone} onChange={(e) => setEditForm({...editForm, phone: e.target.value})} className="drawer-edit-input" style={{ background: darkMode ? '#0f172a' : undefined, color: darkMode ? '#fff' : undefined }} /> : selectedUser.phone}</div>
                  <div><span>Adresse:</span> {isEditing ? <input type="text" value={editForm.address} onChange={(e) => setEditForm({...editForm, address: e.target.value})} className="drawer-edit-input" style={{ background: darkMode ? '#0f172a' : undefined, color: darkMode ? '#fff' : undefined }} /> : selectedUser.address}</div>
                  <div><span>Manager:</span> {isEditing ? <input type="text" value={editForm.manager} onChange={(e) => setEditForm({...editForm, manager: e.target.value})} className="drawer-edit-input" style={{ background: darkMode ? '#0f172a' : undefined, color: darkMode ? '#fff' : undefined }} /> : selectedUser.manager}</div>
                  <div><span>Type de contrat:</span> {selectedUser.contractType}</div>
                </div>
              </div>

              <div className="drawer-section" style={{ background: darkMode ? '#0f172a' : '#f8fafc', padding: '12px', borderRadius: '8px', border: darkMode ? '1px solid #334155' : '1px solid #e2e8f0' }}>
                <h3 style={{ color: darkMode ? '#60a5fa' : undefined }}>💰 Rémunération & Retenues (Madagascar)</h3>
                <div className="classic-grid" style={{ marginTop: '5px', color: darkMode ? '#cbd5e1' : undefined }}>
                  <div><span>Salaire de Base Brut:</span> {isEditing ? <input type="text" value={editForm.baseSalary} onChange={(e) => setEditForm({...editForm, baseSalary: e.target.value})} className="drawer-edit-input" style={{ background: darkMode ? '#1e293b' : undefined, color: darkMode ? '#fff' : undefined }} /> : selectedUser.remuneration?.baseSalary}</div>
                  <div style={{ gridColumn: '1 / -1', borderBottom: darkMode ? '1px dashed #334155' : '1px dashed #cbd5e1', margin: '8px 0' }}></div>
                  <div style={{ color: '#f87171' }}><span>Retenu IRSA:</span> {isEditing ? <input type="text" value={editForm.irsa} onChange={(e) => setEditForm({...editForm, irsa: e.target.value})} className="drawer-edit-input" style={{ background: darkMode ? '#1e293b' : undefined, color: darkMode ? '#fff' : undefined }} /> : selectedUser.remuneration?.retentions?.irsa || '0 Ar'}</div>
                  <div style={{ color: '#f87171' }}><span>Retenu CNaPS:</span> {isEditing ? <input type="text" value={editForm.cnaps} onChange={(e) => setEditForm({...editForm, cnaps: e.target.value})} className="drawer-edit-input" style={{ background: darkMode ? '#1e293b' : undefined, color: darkMode ? '#fff' : undefined }} /> : selectedUser.remuneration?.retentions?.cnaps || '0 Ar'}</div>
                  <div style={{ color: '#f87171' }}><span>Retenu OSTIE:</span> {isEditing ? <input type="text" value={editForm.ostie} onChange={(e) => setEditForm({...editForm, ostie: e.target.value})} className="drawer-edit-input" style={{ background: darkMode ? '#1e293b' : undefined, color: darkMode ? '#fff' : undefined }} /> : selectedUser.remuneration?.retentions?.ostie || '0 Ar'}</div>
                </div>
              </div>

              <div className="drawer-section">
                <h3 style={{ color: darkMode ? '#60a5fa' : undefined }}>👁️ Checklist administrative</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8.5px', marginTop: '10px' }}>
                  <div onClick={() => isAdmin && handleDocChange('idCard')} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderRadius: '10px', background: darkMode ? (selectedUser.onboardingDocs?.idCard ? '#064e3b' : '#7f1d1d') : (selectedUser.onboardingDocs?.idCard ? '#f0fdf4' : '#fff5f5'), border: darkMode ? (selectedUser.onboardingDocs?.idCard ? '1px solid #065f46' : '1px solid #991b1b') : (selectedUser.onboardingDocs?.idCard ? '1px solid #bbf7d0' : '1px solid #fed7d7'), cursor: isAdmin ? 'pointer' : 'default', transition: 'all 0.2s' }}>
                    <span style={{ fontSize: '13.5px', fontWeight: '600', color: darkMode ? (selectedUser.onboardingDocs?.idCard ? '#6ee7b7' : '#fca5a5') : (selectedUser.onboardingDocs?.idCard ? '#166534' : '#9b1c1c') }}>🪪 Pièce d'identité (CIN/Passeport)</span>
                    <span style={{ fontSize: '15px' }}>{selectedUser.onboardingDocs?.idCard ? '🟢 Reçu' : '🔴 Manquant'}</span>
                  </div>

                  <div onClick={() => isAdmin && handleDocChange('signedContract')} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderRadius: '10px', background: darkMode ? (selectedUser.onboardingDocs?.signedContract ? '#064e3b' : '#7f1d1d') : (selectedUser.onboardingDocs?.signedContract ? '#f0fdf4' : '#fff5f5'), border: darkMode ? (selectedUser.onboardingDocs?.signedContract ? '1px solid #065f46' : '1px solid #991b1b') : (selectedUser.onboardingDocs?.signedContract ? '1px solid #bbf7d0' : '1px solid #fed7d7'), cursor: isAdmin ? 'pointer' : 'default', transition: 'all 0.2s' }}>
                    <span style={{ fontSize: '13.5px', fontWeight: '600', color: darkMode ? (selectedUser.onboardingDocs?.signedContract ? '#6ee7b7' : '#fca5a5') : (selectedUser.onboardingDocs?.signedContract ? '#166534' : '#9b1c1c') }}>📄 Contrat d'embauche paraphé</span>
                    <span style={{ fontSize: '15px' }}>{selectedUser.onboardingDocs?.signedContract ? '🟢 Reçu' : '🔴 Manquant'}</span>
                  </div>

                  <div onClick={() => isAdmin && handleDocChange('rib')} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderRadius: '10px', background: darkMode ? (selectedUser.onboardingDocs?.rib ? '#064e3b' : '#7f1d1d') : (selectedUser.onboardingDocs?.rib ? '#f0fdf4' : '#fff5f5'), border: darkMode ? (selectedUser.onboardingDocs?.rib ? '1px solid #065f46' : '1px solid #991b1b') : (selectedUser.onboardingDocs?.rib ? '1px solid #bbf7d0' : '1px solid #fed7d7'), cursor: isAdmin ? 'pointer' : 'default', transition: 'all 0.2s' }}>
                    <span style={{ fontSize: '13.5px', fontWeight: '600', color: darkMode ? (selectedUser.onboardingDocs?.rib ? '#6ee7b7' : '#fca5a5') : (selectedUser.onboardingDocs?.rib ? '#166534' : '#9b1c1c') }}>🏦 Relevé d'Identité Bancaire (RIB)</span>
                    <span style={{ fontSize: '15px' }}>{selectedUser.onboardingDocs?.rib ? '🟢 Reçu' : '🔴 Manquant'}</span>
                  </div>
                </div>
              </div>

              <div className="drawer-section" style={{ marginTop: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <h3 style={{ color: darkMode ? '#60a5fa' : undefined, margin: 0 }}>📎 Pièces jointes & Documents</h3>
                  <label style={{ background: '#2563eb', color: '#fff', padding: '6px 12px', borderRadius: '8px', fontSize: '12.5px', fontWeight: '600', cursor: 'pointer' }}>
                    {uploadingAttachment ? 'Envoi...' : '+ Ajouter un fichier'}
                    <input type="file" onChange={handleAttachmentUpload} style={{ display: 'none' }} />
                  </label>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {employeeAttachments.length === 0 ? (
                    <div style={{ fontSize: '13px', color: darkMode ? '#94a3b8' : '#64748b', fontStyle: 'italic', padding: '8px 0' }}>Aucune pièce jointe enregistrée pour ce collaborateur.</div>
                  ) : (
                    employeeAttachments.map((att, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: darkMode ? '#0f172a' : '#f8fafc', borderRadius: '8px', border: darkMode ? '1px solid #334155' : '1px solid #e2e8f0', fontSize: '13px' }}>
                        <a href={`${API_URL}${att.url}`} target="_blank" rel="noopener noreferrer" style={{ color: darkMode ? '#60a5fa' : '#2563eb', textDecoration: 'none', fontWeight: '500', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '70%' }}>
                          📄 {att.name || 'Document'}
                        </a>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <a href={`${API_URL}${att.url}`} download style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', textDecoration: 'none' }} title="Télécharger">⬇️</a>
                          {isAdmin && (
                            <button onClick={() => handleDeleteAttachment(att.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px' }} title="Supprimer">🗑️</button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* FENÊTRE MODALE : AJOUTER NOUVEAU EMPLOYÉ */}
      {isAdmin && (
      <div id="add-employee-modal" className="modal-overlay" style={{ display: 'none', backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(8px)', zIndex: 1000, position: 'fixed', inset: 0, alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ background: darkMode ? '#1e293b' : '#ffffff', color: darkMode ? '#f8fafc' : '#1e293b', width: '100%', maxWidth: '720px', borderRadius: '24px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.3)', overflow: 'hidden', border: darkMode ? '1px solid #334155' : '1px solid #e2e8f0', display: 'flex', flexDirection: 'column' }}>

          <div style={{ background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)', padding: '28px 32px', color: '#ffffff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <span style={{ fontSize: '20px' }}>👤</span>
                <h3 style={{ margin: 0, fontSize: '22px', fontWeight: '700' }}>Ajouter nouveau employé</h3>
              </div>
              <p style={{ margin: 0, color: '#93c5fd', fontSize: '13.5px', opacity: 0.9 }}>Remplissez les informations essentielles pour créer la fiche administrative.</p>
            </div>
            <button onClick={handleCloseModal} style={{ background: 'rgba(255, 255, 255, 0.15)', border: 'none', color: '#ffffff', fontSize: '22px', width: '36px', height: '36px', borderRadius: '50%', cursor: 'pointer' }}>&times;</button>
          </div>

          <form onSubmit={handleAddEmployeeSubmit} style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px', maxHeight: '75vh', overflowY: 'auto' }}>
            {success && <div style={{ background: '#ecfdf5', color: '#047857', padding: '14px 18px', borderRadius: '12px', fontSize: '14px', border: '1px solid #a7f3d0' }}>{success}</div>}
            {error && <div style={{ background: '#fff5f5', color: '#c53030', padding: '14px 18px', borderRadius: '12px', fontSize: '14px', border: '1px solid #feb2b2' }}>{error}</div>}

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px', borderBottom: darkMode ? '2px solid #334155' : '2px solid #f1f5f9', paddingBottom: '6px' }}>
                <h4 style={{ margin: 0, fontSize: '13px', color: darkMode ? '#94a3b8' : '#64748b', textTransform: 'uppercase' }}>Informations Personnelles</h4>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '18px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '12.5px', fontWeight: '600', color: darkMode ? '#cbd5e1' : '#334155' }}>Nom complet *</label>
                  <input type="text" placeholder="Ex: Rova Andriamahefa" value={name} onChange={(e) => setName(e.target.value)} style={{ padding: '11px 16px', borderRadius: '10px', border: darkMode ? '1px solid #475569' : '1px solid #cbd5e1', background: darkMode ? '#0f172a' : '#fff', color: darkMode ? '#fff' : '#000' }} required />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '12.5px', fontWeight: '600', color: darkMode ? '#cbd5e1' : '#334155' }}>E-mail Professionnel *</label>
                  <input type="email" placeholder="Ex: rova@masoandro.com" value={email} onChange={(e) => setEmail(e.target.value)} style={{ padding: '11px 16px', borderRadius: '10px', border: darkMode ? '1px solid #475569' : '1px solid #cbd5e1', background: darkMode ? '#0f172a' : '#fff', color: darkMode ? '#fff' : '#000' }} required />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '12.5px', fontWeight: '600', color: darkMode ? '#cbd5e1' : '#334155' }}>Numéro de téléphone *</label>
                  <input type="text" placeholder="Ex: +261 32 88 456 12" value={phone} onChange={(e) => setPhone(e.target.value)} style={{ padding: '11px 16px', borderRadius: '10px', border: darkMode ? '1px solid #475569' : '1px solid #cbd5e1', background: darkMode ? '#0f172a' : '#fff', color: darkMode ? '#fff' : '#000' }} required />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '12.5px', fontWeight: '600', color: darkMode ? '#cbd5e1' : '#334155' }}>Adresse résidentielle *</label>
                  <input type="text" placeholder="Ex: Lot II M 45 Antanimena" value={address} onChange={(e) => setAddress(e.target.value)} style={{ padding: '11px 16px', borderRadius: '10px', border: darkMode ? '1px solid #475569' : '1px solid #cbd5e1', background: darkMode ? '#0f172a' : '#fff', color: darkMode ? '#fff' : '#000' }} required />
                </div>
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px', borderBottom: darkMode ? '2px solid #334155' : '2px solid #f1f5f9', paddingBottom: '6px' }}>
                <h4 style={{ margin: 0, fontSize: '13px', color: darkMode ? '#94a3b8' : '#64748b', textTransform: 'uppercase' }}>Contrat & Intégration</h4>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '18px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '12.5px', fontWeight: '600', color: darkMode ? '#cbd5e1' : '#334155' }}>Intitulé du Poste *</label>
                  <input type="text" placeholder="Ex: Développeur" value={role} onChange={(e) => setRole(e.target.value)} style={{ padding: '11px 16px', borderRadius: '10px', border: darkMode ? '1px solid #475569' : '1px solid #cbd5e1', background: darkMode ? '#0f172a' : '#fff', color: darkMode ? '#fff' : '#000' }} required />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '12.5px', fontWeight: '600', color: darkMode ? '#cbd5e1' : '#334155' }}>Département</label>
                  <select value={department} onChange={(e) => setDepartment(e.target.value)} style={{ padding: '11px 16px', borderRadius: '10px', border: darkMode ? '1px solid #475569' : '1px solid #cbd5e1', background: darkMode ? '#0f172a' : '#fff', color: darkMode ? '#fff' : '#000' }}>
                    <option value="Marketing">Marketing</option>
                    <option value="Technique">Technique</option>
                    <option value="Finance">Finance</option>
                    <option value="Direction">Direction</option>
                  </select>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '12.5px', fontWeight: '600', color: darkMode ? '#cbd5e1' : '#334155' }}>Type de contrat</label>
                  <select value={contractType} onChange={(e) => setContractType(e.target.value)} style={{ padding: '11px 16px', borderRadius: '10px', border: darkMode ? '1px solid #475569' : '1px solid #cbd5e1', background: darkMode ? '#0f172a' : '#fff', color: darkMode ? '#fff' : '#000' }}>
                    <option value="CDI">CDI</option>
                    <option value="CDD">CDD</option>
                    <option value="Stage">Stage</option>
                    <option value="Freelence">Freelence</option>
                  </select>
                </div>
              </div>

              <div style={{ marginTop: '18px', display: 'flex', flexDirection: 'column', gap: '6px', maxWidth: '260px' }}>
                <label style={{ fontSize: '12.5px', fontWeight: '600', color: darkMode ? '#cbd5e1' : '#334155' }}>🛡️ Niveau d'accès à l'application</label>
                <select value={accountType} onChange={(e) => setAccountType(e.target.value)} style={{ padding: '11px 16px', borderRadius: '10px', border: darkMode ? '1px solid #475569' : '1px solid #cbd5e1', background: darkMode ? '#0f172a' : '#fff', color: darkMode ? '#fff' : '#000' }}>
                  <option value="employee">Employé (accès limité)</option>
                  <option value="admin">Administrateur (accès complet)</option>
                </select>
              </div>
            </div>

            <div style={{ background: darkMode ? '#0f172a' : '#f8fafc', padding: '20px', borderRadius: '18px', border: darkMode ? '1px solid #334155' : '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <h4 style={{ margin: 0, fontSize: '13.5px', color: darkMode ? '#60a5fa' : '#1e3a8a', fontWeight: '700' }}>Photo & Pièce d'identité</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '18px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '12.5px', fontWeight: '600', color: darkMode ? '#cbd5e1' : '#334155' }}>📸 Photo de profil</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setNewAvatarFile(e.target.files[0] || null)}
                    style={{ fontSize: '13px', color: darkMode ? '#fff' : undefined }}
                  />
                  {newAvatarFile && <span style={{ fontSize: '12px', color: '#10b981' }}>✓ {newAvatarFile.name}</span>}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '12.5px', fontWeight: '600', color: darkMode ? '#cbd5e1' : '#334155' }}>🪪 Pièce d'identité (CIN / Passeport)</label>
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => setNewIdDocFile(e.target.files[0] || null)}
                    style={{ fontSize: '13px', color: darkMode ? '#fff' : undefined }}
                  />
                  {newIdDocFile && <span style={{ fontSize: '12px', color: '#10b981' }}>✓ {newIdDocFile.name}</span>}
                </div>
              </div>
            </div>

            <div style={{ background: darkMode ? '#0f172a' : '#f8fafc', padding: '24px', borderRadius: '18px', border: darkMode ? '1px solid #334155' : '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <h4 style={{ margin: 0, fontSize: '13.5px', color: darkMode ? '#60a5fa' : '#1e3a8a', fontWeight: '700' }}>Rémunération & Retenues Locales (Madagascar)</h4>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr 1fr', gap: '14px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '12px', fontWeight: '700', color: darkMode ? '#cbd5e1' : '#1e293b' }}>Salaire Brut de Base</label>
                  <input type="number" placeholder="Ex: 1400000" value={baseSalary} onChange={(e) => setBaseSalary(e.target.value)} style={{ padding: '12px', borderRadius: '10px', border: darkMode ? '2px solid #3b82f6' : '2px solid #bfdbfe', background: darkMode ? '#1e293b' : '#fff', fontSize: '15px', fontWeight: '700', color: darkMode ? '#60a5fa' : '#1e3a8a' }} required />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '12.5px', fontWeight: '600', color: darkMode ? '#94a3b8' : '#475569' }}>IRSA (Impôt)</label>
                  <input type="number" value={irsa} onChange={(e) => setIrsa(e.target.value)} style={{ padding: '12px', borderRadius: '10px', border: darkMode ? '1px solid #475569' : '1px solid #cbd5e1', background: darkMode ? '#1e293b' : '#fff', color: '#f87171', fontWeight: '600' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '12.5px', fontWeight: '600', color: darkMode ? '#94a3b8' : '#475569' }}>CNaPS</label>
                  <input type="number" value={cnaps} onChange={(e) => setCnaps(e.target.value)} style={{ padding: '12px', borderRadius: '10px', border: darkMode ? '1px solid #475569' : '1px solid #cbd5e1', background: darkMode ? '#1e293b' : '#fff', color: '#f87171', fontWeight: '600' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '12.5px', fontWeight: '600', color: darkMode ? '#94a3b8' : '#475569' }}>OSTIE</label>
                  <input type="number" value={ostie} onChange={(e) => setOstie(e.target.value)} style={{ padding: '12px', borderRadius: '10px', border: darkMode ? '1px solid #475569' : '1px solid #cbd5e1', background: darkMode ? '#1e293b' : '#fff', color: '#f87171', fontWeight: '600' }} />
                </div>
              </div>

              {parseFloat(baseSalary) > 0 && (
                <div style={{ marginTop: '4px', background: darkMode ? '#064e3b' : '#f0fdf4', border: darkMode ? '1px solid #065f46' : '1px solid #bbf7d0', padding: '14px 20px', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '13.5px', color: darkMode ? '#6ee7b7' : '#14532d', fontWeight: '600' }}>Estimation nette à verser :</span>
                  <span style={{ fontSize: '18px', color: darkMode ? '#6ee7b7' : '#166534', fontWeight: '800' }}>{calculateNetSalary().toLocaleString()} Ar</span>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '14px', marginTop: '8px', justifyContent: 'flex-end', borderTop: darkMode ? '1px solid #334155' : '1px solid #f1f5f9', paddingTop: '20px' }}>
              <button type="button" onClick={handleCloseModal} style={{ padding: '12px 26px', background: darkMode ? '#334155' : '#f8fafc', color: darkMode ? '#cbd5e1' : '#64748b', border: darkMode ? '1px solid #475569' : '1px solid #e2e8f0', borderRadius: '12px', cursor: 'pointer' }}>Annuler</button>
              <button type="submit" disabled={isSubmittingNewEmployee} style={{ padding: '12px 36px', background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)', color: '#ffffff', border: 'none', borderRadius: '12px', cursor: isSubmittingNewEmployee ? 'not-allowed' : 'pointer', fontWeight: '600', opacity: isSubmittingNewEmployee ? 0.7 : 1 }}>
                {isSubmittingNewEmployee ? 'Création en cours...' : 'Créer le profil'}
              </button>
            </div>
          </form>
        </div>
      </div>
      )}
    </div>
  );
}
export default App;
