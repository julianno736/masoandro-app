// src/data/mockData.js

export const userProfile = {
  initials: "ML",
  name: "Marion Lefèvre",
  role: "Chargée de projet — Marketing",
  number: "4471",
  since: "mars 2022",
  status: "online" // 'online', 'away', 'offline'
};

export const currentStats = [
  { id: 'total_staff', label: 'EFFECTIF TOTAL', value: '42', unit: ' pers.', key: 'Equipe' },
  { id: 'pending_leave', label: 'CONGÉS EN ATTENTE', value: '5', status: 'warning', key: 'Congés' }, 
  { id: 'renew_contracts', label: 'CONTRATS À RENOUVELER', value: '3', status: 'primary', key: 'Contrats & documents' },
  { id: 'upcoming_evals', label: 'ÉVALUATIONS À VENIR', value: '7', key: 'Évaluations & objectifs' }
];

export const allActivities = [
  {
    id: 1,
    status: 'EN ATTENTE',
    statusKey: 'warning',
    category: 'Congés',
    title: 'Demande de RTT — Julien Roque',
    subtitle: 'Du 18 au 22 Juil 2026',
    date: '14 juil. 2026',
    timestamp: new Date('2026-07-14T10:30:00')
  },
  {
    id: 2,
    status: 'À RENOUVELER',
    statusKey: 'primary',
    category: 'Contrats & documents',
    title: 'Contrat CDD — Sofia Nardone',
    subtitle: 'Échéance — 31 juil. 2026',
    date: 'Échéance 31 juil. 2026',
    timestamp: new Date('2026-07-31T23:59:00')
  },
  {
    id: 3,
    status: 'APPROUVÉ',
    statusKey: 'success',
    category: 'Congés',
    title: 'Congés payés — Marion Lefèvre',
    subtitle: 'Du 01 au 15 Août 2026',
    date: '12 juin 2026',
    timestamp: new Date('2026-06-12T16:15:00')
  },
    {
    id: 4,
    status: 'ÉVALUATION DUE',
    statusKey: 'info',
    category: 'Évaluations & objectifs',
    title: 'Bilan Annuel — Pierre Dubois',
    subtitle: 'Rédigé par son manager',
    date: 'Hier',
    timestamp: new Date()
  },
];