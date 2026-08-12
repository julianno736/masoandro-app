require('dotenv').config();

const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const crypto = require('crypto');

const app = express();
const PORT = 5001;
const DATA_FILE = path.join(__dirname, 'data.json');
const LEAVES_FILE = path.join(__dirname, 'leaves.json');
const SANCTIONS_FILE = path.join(__dirname, 'sanctions.json');
const ATTACHMENTS_FILE = path.join(__dirname, 'attachments.json');

// Sessions actives : token -> email. Stockage en mémoire (réinitialisé au redémarrage du serveur).
const sessions = new Map();

// Middleware d'authentification : vérifie le header Authorization: Bearer <token>
const authenticate = (req, res, next) => {
  const authHeader = req.headers['authorization'] || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  const email = token && sessions.get(token);
  if (!email) {
    return res.status(401).json({ message: "Session invalide ou expirée. Veuillez vous reconnecter." });
  }
  req.userEmail = email;
  next();
};

// Middleware d'autorisation : vérifie que l'utilisateur connecté est admin.
// À utiliser APRÈS authenticate sur les routes réservées aux administrateurs.
const requireAdmin = (req, res, next) => {
  const users = readData();
  const user = users.find(u => u.email?.toLowerCase() === req.userEmail?.toLowerCase());
  if (!user || user.accountType !== 'admin') {
    return res.status(403).json({ message: "Action réservée aux administrateurs." });
  }
  next();
};

// Middlewares
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Configuration Multer pour les avatars
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

// Fonctions utilitaires de lecture / écriture (Utilisateurs)
const readData = () => {
  try {
    if (!fs.existsSync(DATA_FILE)) {
      fs.writeFileSync(DATA_FILE, JSON.stringify([], null, 2));
      return [];
    }
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8') || '[]');
  } catch (error) {
    console.error("Erreur lecture data.json:", error);
    return [];
  }
};

const writeData = (data) => {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
};

// Fonctions utilitaires de lecture / écriture (Congés)
const readLeaves = () => {
  try {
    if (!fs.existsSync(LEAVES_FILE)) {
      fs.writeFileSync(LEAVES_FILE, JSON.stringify([], null, 2));
      return [];
    }
    return JSON.parse(fs.readFileSync(LEAVES_FILE, 'utf-8') || '[]');
  } catch (error) {
    console.error("Erreur lecture leaves.json:", error);
    return [];
  }
};

const writeLeaves = (data) => {
  fs.writeFileSync(LEAVES_FILE, JSON.stringify(data, null, 2));
};

// Fonctions utilitaires de lecture / écriture (Sanctions)
const readSanctions = () => {
  try {
    if (!fs.existsSync(SANCTIONS_FILE)) {
      fs.writeFileSync(SANCTIONS_FILE, JSON.stringify([], null, 2));
      return [];
    }
    return JSON.parse(fs.readFileSync(SANCTIONS_FILE, 'utf-8') || '[]');
  } catch (error) {
    console.error("Erreur lecture sanctions.json:", error);
    return [];
  }
};

const writeSanctions = (data) => {
  fs.writeFileSync(SANCTIONS_FILE, JSON.stringify(data, null, 2));
};

// Fonctions utilitaires de lecture / écriture (Pièces jointes)
const readAttachments = () => {
  try {
    if (!fs.existsSync(ATTACHMENTS_FILE)) {
      fs.writeFileSync(ATTACHMENTS_FILE, JSON.stringify([], null, 2));
      return [];
    }
    return JSON.parse(fs.readFileSync(ATTACHMENTS_FILE, 'utf-8') || '[]');
  } catch (error) {
    console.error("Erreur lecture attachments.json:", error);
    return [];
  }
};

const writeAttachments = (data) => {
  fs.writeFileSync(ATTACHMENTS_FILE, JSON.stringify(data, null, 2));
};

// Quota annuel de congés payés (en jours)
const TOTAL_LEAVE_QUOTA = 30;

// ==========================================
// CRÉATION AUTOMATIQUE D'UN COMPTE ADMIN (au démarrage, une seule fois)
// ==========================================
const seedAdminAccount = () => {
  const users = readData();
  const hasAdmin = users.some(u => u.accountType === 'admin');

  if (!hasAdmin) {
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@masoandro.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'ChangeMoi123!';

    const adminUser = {
      id: Date.now(),
      name: 'Administrateur',
      email: adminEmail,
      password: adminPassword,
      role: 'Administrateur Système',
      department: 'Direction',
      accountType: 'admin',
      contractType: 'CDI',
      phone: 'Non renseigné',
      address: 'Non renseignée',
      manager: '—',
      remuneration: {
        baseSalary: '0 Ar',
        retentions: { irsa: '0 Ar', cnaps: '0 Ar', ostie: '0 Ar' }
      },
      onboardingDocs: { idCard: true, signedContract: true, rib: true }
    };

    users.push(adminUser);
    writeData(users);
    console.log(`🛡️ Compte admin créé : ${adminEmail} / mot de passe : ${adminPassword}`);
  } else {
    console.log('🛡️ Compte admin déjà présent — aucune action nécessaire.');
  }
};

// ==========================================
// ROUTES API - AUTHENTIFICATION & INSCRIPTION
// ==========================================

app.post('/api/signup', (req, res) => {
  try {
    const users = readData();
    const { name, email, password, role, department } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "L'e-mail et le mot de passe sont obligatoires." });
    }

    const exists = users.find(u => u.email?.toLowerCase() === email.toLowerCase());
    if (exists) {
      return res.status(400).json({ message: "Cet e-mail est déjà utilisé." });
    }

    const newUser = {
      id: Date.now(),
      name: name || 'Utilisateur',
      email,
      password,
      role: role || 'Collaborateur',
      department: department || 'Général',
      accountType: 'employee',
      contractType: 'CDI',
      phone: 'Non renseigné',
      address: 'Non renseignée',
      manager: 'Directeur Général',
      remuneration: {
        baseSalary: '0 Ar',
        retentions: { irsa: '0 Ar', cnaps: '0 Ar', ostie: '0 Ar' }
      },
      onboardingDocs: { idCard: false, signedContract: false, rib: false }
    };

    users.push(newUser);
    writeData(users);

    const { password: _, ...userWithoutPassword } = newUser;
    res.status(201).json({ message: "Compte créé avec succès !", user: userWithoutPassword });
  } catch (err) {
    console.error("Erreur /api/signup :", err);
    res.status(500).json({ message: "Erreur lors de la création du compte." });
  }
});

app.post('/api/login', (req, res) => {
  try {
    const users = readData();
    const { email, password } = req.body;

    const user = users.find(u => u.email?.toLowerCase() === email?.toLowerCase() && u.password === password);
    if (!user) {
      return res.status(401).json({ message: "E-mail ou mot de passe incorrect." });
    }

    const token = crypto.randomBytes(24).toString('hex');
    sessions.set(token, user.email);

    const { password: _, ...userWithoutPassword } = user;
    res.json({ message: "Connexion réussie.", token, user: userWithoutPassword });
  } catch (err) {
    console.error("Erreur /api/login :", err);
    res.status(500).json({ message: "Erreur lors de la connexion." });
  }
});

app.post('/api/logout', authenticate, (req, res) => {
  const authHeader = req.headers['authorization'] || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (token) sessions.delete(token);
  res.json({ message: "Déconnecté avec succès." });
});

// ==========================================
// ROUTES API - GESTION DES EMPLOYÉS
// ==========================================

app.get('/api/users', authenticate, (req, res) => {
  res.json(readData());
});

app.get('/api/users/:email', authenticate, (req, res) => {
  const users = readData();
  const user = users.find(u => u.email?.toLowerCase() === req.params.email.toLowerCase());
  if (!user) return res.status(404).json({ message: "Employé introuvable." });

  const { password: _, ...userWithoutPassword } = user;
  res.json(userWithoutPassword);
});

app.post('/api/users/add', authenticate, (req, res) => {
  try {
    const users = readData();
    const newCollaborator = req.body;
    if (users.some(u => u.email?.toLowerCase() === newCollaborator.email?.toLowerCase())) {
      return res.status(400).json({ message: "Cet e-mail est déjà utilisé." });
    }
    // Sécurité : par défaut, un nouveau profil est "employee" sauf indication explicite
    if (!newCollaborator.accountType) {
      newCollaborator.accountType = 'employee';
    }
    // Génère un mot de passe temporaire : sans ça, le compte créé via ce formulaire
    // n'a aucun mot de passe et ne peut jamais se connecter.
    const tempPassword = crypto.randomBytes(4).toString('hex');
    newCollaborator.password = tempPassword;

    users.push(newCollaborator);
    writeData(users);

    const { password: _, ...userWithoutPassword } = newCollaborator;
    res.status(201).json({ message: "Employé enregistré.", user: userWithoutPassword, tempPassword });
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur." });
  }
});

app.put('/api/users/:email', authenticate, (req, res) => {
  try {
    const { email } = req.params;
    let users = readData();
    const index = users.findIndex(u => u.email?.toLowerCase() === email.toLowerCase());
    if (index === -1) return res.status(404).json({ message: "Employé introuvable." });

    let updatedUser = { ...users[index], ...req.body };
    users[index] = updatedUser;
    writeData(users);
    res.json({ message: "Mis à jour avec succès.", user: users[index] });
  } catch (err) {
    res.status(500).json({ message: "Erreur mise à jour." });
  }
});

app.delete('/api/users/:email', authenticate, (req, res) => {
  try {
    let users = readData();
    const filtered = users.filter(u => u.email?.toLowerCase() !== req.params.email.toLowerCase());
    if (filtered.length === users.length) return res.status(404).json({ message: "Employé introuvable." });
    writeData(filtered);
    res.json({ message: "Supprimé avec succès." });
  } catch (err) {
    res.status(500).json({ message: "Erreur suppression." });
  }
});

app.post('/api/upload-avatar', authenticate, upload.single('avatar'), (req, res) => {
  if (!req.file) return res.status(400).json({ message: "Aucun fichier." });
  // URL relative : le front-end préfixe déjà avec API_URL, une URL absolue ici cassait l'image.
  const avatarUrl = `/uploads/${req.file.filename}`;
  res.json({ message: "Succès", avatarUrl });
});

// ==========================================
// ROUTES API - PIÈCES JOINTES
// ==========================================

app.get('/api/attachments/:email', authenticate, (req, res) => {
  try {
    const attachments = readAttachments();
    const filtered = attachments.filter(
      a => a.email?.toLowerCase() === req.params.email.toLowerCase()
    );
    res.json(filtered);
  } catch (err) {
    res.status(500).json({ message: "Erreur lors de la récupération des pièces jointes." });
  }
});

app.post('/api/upload-attachment', authenticate, upload.single('document'), (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "Aucun fichier." });
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "E-mail de l'employé manquant." });

    const attachments = readAttachments();
    const newAttachment = {
      id: Date.now(),
      email,
      name: req.file.originalname,
      url: `/uploads/${req.file.filename}`
    };
    attachments.push(newAttachment);
    writeAttachments(attachments);
    res.status(201).json({ message: "Pièce jointe ajoutée avec succès.", attachment: newAttachment });
  } catch (err) {
    console.error("Erreur /api/upload-attachment :", err);
    res.status(500).json({ message: "Erreur lors du téléversement." });
  }
});

app.delete('/api/attachments/:id', authenticate, (req, res) => {
  try {
    const attachments = readAttachments();
    const filtered = attachments.filter(a => String(a.id) !== req.params.id);
    if (filtered.length === attachments.length) {
      return res.status(404).json({ message: "Pièce jointe introuvable." });
    }
    writeAttachments(filtered);
    res.json({ message: "Pièce jointe supprimée avec succès." });
  } catch (err) {
    res.status(500).json({ message: "Erreur lors de la suppression." });
  }
});

app.get('/api/export/data', authenticate, (req, res) => {
  res.json(readData());
});

// ==========================================
// ROUTES API - GESTION DES CONGÉS & ABSENCES
// ==========================================

app.get('/api/leaves', authenticate, (req, res) => {
  try {
    const leaves = readLeaves();
    res.json(leaves);
  } catch (err) {
    res.status(500).json({ message: "Erreur lors de la récupération des congés." });
  }
});

// Solde de congés restants pour un employé donné
app.get('/api/leaves/balance/:email', authenticate, (req, res) => {
  try {
    const leaves = readLeaves();
    const email = req.params.email;
    const approvedLeaves = leaves.filter(l =>
      l.employeeEmail?.toLowerCase() === email.toLowerCase() && l.status === 'Approuvé'
    );
    const daysTaken = approvedLeaves.reduce((acc, curr) => acc + (Number(curr.numberOfDays) || 0), 0);
    const remainingDays = Math.max(0, TOTAL_LEAVE_QUOTA - daysTaken);
    res.json({ totalQuota: TOTAL_LEAVE_QUOTA, daysTaken, remainingDays });
  } catch (err) {
    console.error("Erreur /api/leaves/balance :", err);
    res.status(500).json({ message: "Erreur lors du calcul du solde de congés." });
  }
});

app.post('/api/leaves', authenticate, (req, res) => {
  try {
    const leaves = readLeaves();
    const { startDate, endDate, employeeEmail } = req.body;

    let numberOfDays = 1;
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const diffTime = end - start;
      numberOfDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1);
    }

    const approvedLeaves = leaves.filter(l =>
      l.employeeEmail?.toLowerCase() === employeeEmail?.toLowerCase() && l.status === 'Approuvé'
    );
    const daysTaken = approvedLeaves.reduce((acc, curr) => acc + (Number(curr.numberOfDays) || 0), 0);
    const remainingDays = TOTAL_LEAVE_QUOTA - (daysTaken + numberOfDays);

    if (remainingDays < 0) {
      return res.status(400).json({
        message: `Solde insuffisant. Il vous reste ${TOTAL_LEAVE_QUOTA - daysTaken} jours de congé.`
      });
    }

    const newLeave = {
      id: Date.now(),
      ...req.body,
      numberOfDays: numberOfDays,
      remainingDaysAfter: remainingDays,
      status: req.body.status || 'En attente'
    };

    leaves.push(newLeave);
    writeLeaves(leaves);

    res.status(201).json({
      message: "Demande de congé enregistrée avec succès.",
      leave: newLeave
    });
  } catch (err) {
    console.error("Erreur /api/leaves POST :", err);
    res.status(500).json({ message: "Erreur lors de l'enregistrement du congé." });
  }
});

// Modification du statut d'un congé (approuver / refuser) : réservé aux admins
app.put('/api/leaves/:id', authenticate, requireAdmin, (req, res) => {
  try {
    const { id } = req.params;
    let leaves = readLeaves();
    const index = leaves.findIndex(l => String(l.id) === String(id));

    if (index === -1) {
      return res.status(404).json({ message: "Demande de congé introuvable." });
    }

    leaves[index] = { ...leaves[index], ...req.body };
    writeLeaves(leaves);
    res.json({ message: "Statut du congé mis à jour avec succès.", leave: leaves[index] });
  } catch (err) {
    res.status(500).json({ message: "Erreur lors de la mise à jour du congé." });
  }
});

// Suppression d'une demande de congé : réservée aux admins
app.delete('/api/leaves/:id', authenticate, requireAdmin, (req, res) => {
  try {
    const { id } = req.params;
    let leaves = readLeaves();
    const initialLength = leaves.length;
    const filtered = leaves.filter(l => String(l.id) !== String(id));

    if (filtered.length === initialLength) {
      return res.status(404).json({ message: "Demande de congé introuvable." });
    }

    writeLeaves(filtered);
    res.json({ message: "Demande de congé supprimée avec succès." });
  } catch (err) {
    res.status(500).json({ message: "Erreur lors de la suppression du congé." });
  }
});

// ==========================================
// ROUTES API - GESTION DES SANCTIONS
// ==========================================

app.get('/api/sanctions', authenticate, (req, res) => {
  try {
    const sanctions = readSanctions();
    res.json(sanctions);
  } catch (err) {
    res.status(500).json({ message: "Erreur lors de la récupération des sanctions." });
  }
});

app.post('/api/sanctions', authenticate, (req, res) => {
  try {
    const sanctions = readSanctions();
    const newSanction = {
      id: Date.now().toString(),
      employeeEmail: req.body.employeeEmail,
      employeeName: req.body.employeeName,
      type: req.body.type,
      date: req.body.date,
      reason: req.body.reason
    };

    sanctions.push(newSanction);
    writeSanctions(sanctions);
    res.status(201).json({ message: "Sanction ajoutée avec succès.", sanction: newSanction });
  } catch (err) {
    res.status(500).json({ message: "Erreur lors de l'ajout de la sanction." });
  }
});

app.delete('/api/sanctions/:id', authenticate, (req, res) => {
  try {
    const { id } = req.params;
    let sanctions = readSanctions();
    const initialLength = sanctions.length;
    const filteredSanctions = sanctions.filter(s => String(s.id) !== String(id));

    if (filteredSanctions.length < initialLength) {
      writeSanctions(filteredSanctions);
      res.json({ message: "Sanction supprimée avec succès" });
    } else {
      res.status(404).json({ message: "Sanction non trouvée" });
    }
  } catch (err) {
    res.status(500).json({ message: "Erreur lors de la suppression de la sanction." });
  }
});

// Lancement du serveur
seedAdminAccount();

app.listen(PORT, () => {
  console.log(`☀️ Serveur MASOANDRO démarré sur http://localhost:${PORT}`);
});