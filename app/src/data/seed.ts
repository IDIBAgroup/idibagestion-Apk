import type {
  Company, User, Role, Department, Project, Task,
  Invoice, AccountingEntry, ChartAccount, Asset,
  Ticket, Idea, CalendarEvent, Expense, Notification,
  Employee, Candidate, Leave, PayrollItem, Client,
  PerformanceReview, ClosingEntry,
  Lead, BuySignal, SocialTrend, OutreachCampaign, OutreachMessage,
} from '@/types';

// ============================================
// SEED DATA - IDIBAGES ERP Demo Data
// ============================================

export const seedCompany: Company = {
  id: 'comp-1',
  name: 'IDIBA Group SARL',
  logo: undefined,
  address: 'Rue Joffre, Immeuble IDIBA, 3e étage',
  city: 'Douala',
  country: 'Cameroun',
  rccm: 'RC/DLA/2019/M/0847',
  idu: 'IDU9876543210',
  ifu: 'M0123456789C',
  currency: 'XAF',
  primaryColor: '#2DD4A8',
  secondaryColor: '#3B82F6',
  createdAt: '2019-06-15T00:00:00Z',
};

export const seedRoles: Role[] = [
  { id: 'role-admin', name: 'Administrateur', permissions: ['*'], isSystem: true, description: 'Accès complet à tous les modules' },
  { id: 'role-manager', name: 'Manager', permissions: ['projects.read', 'projects.write', 'finance.read', 'admin.read'], isSystem: true, description: 'Gestion des projets et lecture finance' },
  { id: 'role-accountant', name: 'Comptable', permissions: ['finance.*', 'accounting.*', 'assets.*'], isSystem: true, description: 'Accès complet aux modules financiers' },
  { id: 'role-employee', name: 'Employé', permissions: ['projects.read', 'tasks.write', 'innovation.*', 'support.*'], isSystem: true, description: 'Accès projets, innovation et support' },
  { id: 'role-viewer', name: 'Lecteur', permissions: ['projects.read', 'finance.read'], isSystem: true, description: 'Lecture seule' },
];

export const seedDepartments: Department[] = [
  { id: 'dept-1', name: 'Direction Générale', managerId: 'user-1', companyId: 'comp-1', employeeCount: 3 },
  { id: 'dept-2', name: 'Ressources Humaines', managerId: 'user-3', companyId: 'comp-1', employeeCount: 4 },
  { id: 'dept-3', name: 'Finance & Comptabilité', managerId: 'user-4', companyId: 'comp-1', employeeCount: 5 },
  { id: 'dept-4', name: 'Technique & IT', managerId: 'user-2', companyId: 'comp-1', employeeCount: 12 },
  { id: 'dept-5', name: 'Marketing & Com', managerId: 'user-5', companyId: 'comp-1', employeeCount: 6 },
  { id: 'dept-6', name: 'Logistique', managerId: 'user-6', companyId: 'comp-1', employeeCount: 8 },
];

export const seedUsers: User[] = [
  { uid: 'user-1', email: 'pdg@idibagroup.cm', displayName: 'Martin Essomba', roleId: 'role-admin', roleName: 'Administrateur', companyId: 'comp-1', departmentId: 'dept-1', status: 'active', createdAt: '2024-01-15T00:00:00Z', permissions: ['*'], avatar: undefined },
  { uid: 'user-2', email: 'cto@idibagroup.cm', displayName: 'Sarah Nkolo', roleId: 'role-manager', roleName: 'Manager', companyId: 'comp-1', departmentId: 'dept-4', status: 'active', createdAt: '2024-01-20T00:00:00Z', permissions: ['projects.read', 'projects.write', 'finance.read', 'admin.read'], avatar: undefined },
  { uid: 'user-3', email: 'rh@idibagroup.cm', displayName: 'Jean-Pierre Moussa', roleId: 'role-manager', roleName: 'Manager', companyId: 'comp-1', departmentId: 'dept-2', status: 'active', createdAt: '2024-02-01T00:00:00Z', permissions: ['projects.read', 'projects.write', 'finance.read', 'admin.read'], avatar: undefined },
  { uid: 'user-4', email: 'compta@idibagroup.cm', displayName: 'Amélie Fouda', roleId: 'role-accountant', roleName: 'Comptable', companyId: 'comp-1', departmentId: 'dept-3', status: 'active', createdAt: '2024-02-10T00:00:00Z', permissions: ['finance.*', 'accounting.*', 'assets.*'], avatar: undefined },
  { uid: 'user-5', email: 'marketing@idibagroup.cm', displayName: 'Grace Abena', roleId: 'role-employee', roleName: 'Employé', companyId: 'comp-1', departmentId: 'dept-5', status: 'active', createdAt: '2024-03-01T00:00:00Z', permissions: ['projects.read', 'tasks.write', 'innovation.*', 'support.*'], avatar: undefined },
  { uid: 'user-6', email: 'logistics@idibagroup.cm', displayName: 'Koffi Mensah', roleId: 'role-employee', roleName: 'Employé', companyId: 'comp-1', departmentId: 'dept-6', status: 'active', createdAt: '2024-03-15T00:00:00Z', permissions: ['projects.read', 'tasks.write', 'innovation.*', 'support.*'], avatar: undefined },
  { uid: 'user-7', email: 'dev1@idibagroup.cm', displayName: 'Ingrid Biya', roleId: 'role-employee', roleName: 'Employé', companyId: 'comp-1', departmentId: 'dept-4', status: 'active', createdAt: '2024-04-01T00:00:00Z', permissions: ['projects.read', 'tasks.write', 'innovation.*', 'support.*'], avatar: undefined },
  { uid: 'user-8', email: 'dev2@idibagroup.cm', displayName: 'Paul Tchuente', roleId: 'role-employee', roleName: 'Employé', companyId: 'comp-1', departmentId: 'dept-4', status: 'pending', createdAt: '2024-06-20T00:00:00Z', permissions: ['projects.read', 'tasks.write', 'innovation.*', 'support.*'], avatar: undefined },
];

export const seedProjects: Project[] = [
  { id: 'proj-1', name: 'Déploiment Fibre Optique Douala', description: 'Extension du réseau fibre sur 50km dans la zone métropolitaine de Douala', status: 'in_progress', companyId: 'comp-1', budget: 450000000, spent: 189000000, progress: 42, startDate: '2024-01-15', endDate: '2024-12-31', members: ['user-1', 'user-2', 'user-7'], createdAt: '2024-01-15T00:00:00Z' },
  { id: 'proj-2', name: 'Migration ERP IDIBAGES', description: 'Migration complète des systèmes legacy vers IDIBAGES', status: 'in_progress', companyId: 'comp-1', budget: 75000000, spent: 45000000, progress: 60, startDate: '2024-03-01', endDate: '2024-09-30', members: ['user-2', 'user-7'], createdAt: '2024-03-01T00:00:00Z' },
  { id: 'proj-3', name: 'Campagne Marketing Q3 2024', description: 'Campagne de promotion des nouveaux forfaits entreprise', status: 'todo', companyId: 'comp-1', budget: 35000000, spent: 0, progress: 0, startDate: '2024-07-01', endDate: '2024-09-30', members: ['user-5'], createdAt: '2024-06-01T00:00:00Z' },
  { id: 'proj-4', name: 'Audit Conformité SYSCOHADA', description: 'Audit annuel de conformité comptable et fiscale', status: 'review', companyId: 'comp-1', budget: 15000000, spent: 12000000, progress: 85, startDate: '2024-05-01', endDate: '2024-06-30', members: ['user-4', 'user-1'], createdAt: '2024-05-01T00:00:00Z' },
  { id: 'proj-5', name: 'Construction Datacenter Yaoundé', description: 'Nouveau datacenter Tier III à Yaoundé', status: 'todo', companyId: 'comp-1', budget: 890000000, spent: 0, progress: 0, startDate: '2024-10-01', endDate: '2025-12-31', members: ['user-1', 'user-2', 'user-6'], createdAt: '2024-06-15T00:00:00Z' },
  { id: 'proj-6', name: 'Refonte Site Web Corporate', description: 'Modernisation du site web et portail client', status: 'completed', companyId: 'comp-1', budget: 22000000, spent: 21000000, progress: 100, startDate: '2024-01-01', endDate: '2024-05-30', members: ['user-5', 'user-7'], createdAt: '2024-01-01T00:00:00Z' },
];

export const seedTasks: Task[] = [
  { id: 'task-1', projectId: 'proj-1', title: 'Étude de terrain PK12-PK25', description: 'Réaliser l\'étude topographique du tronçon', assignedTo: 'user-7', assignedToName: 'Ingrid Biya', status: 'done', priority: 'high', dueDate: '2024-02-28', subtasks: [{ title: 'Lever topographique', completed: true }, { title: 'Rapport technique', completed: true }], createdAt: '2024-01-20T00:00:00Z' },
  { id: 'task-2', projectId: 'proj-1', title: 'Autorisation municipalité', description: 'Obtenir les autorisations de travaux', assignedTo: 'user-1', assignedToName: 'Martin Essomba', status: 'in_progress', priority: 'high', dueDate: '2024-07-15', subtasks: [{ title: 'Dossier déposé', completed: true }, { title: 'Suivi approvals', completed: false }], createdAt: '2024-01-25T00:00:00Z' },
  { id: 'task-3', projectId: 'proj-1', title: 'Pose câbles PK1-PK12', description: 'Installation physique des câbles fibre', assignedTo: 'user-6', assignedToName: 'Koffi Mensah', status: 'in_progress', priority: 'medium', dueDate: '2024-08-30', subtasks: [{ title: 'Tranchées', completed: true }, { title: 'Pose', completed: false }, { title: 'Raccordements', completed: false }], createdAt: '2024-02-10T00:00:00Z' },
  { id: 'task-4', projectId: 'proj-1', title: 'Tests de signal', description: 'Vérifier la qualité du signal sur toute la ligne', assignedTo: 'user-7', assignedToName: 'Ingrid Biya', status: 'todo', priority: 'medium', dueDate: '2024-10-15', subtasks: [], createdAt: '2024-02-15T00:00:00Z' },
  { id: 'task-5', projectId: 'proj-2', title: 'Configuration modules Finance', description: 'Paramétrer les modules comptables et facturation', assignedTo: 'user-4', assignedToName: 'Amélie Fouda', status: 'in_progress', priority: 'high', dueDate: '2024-07-01', subtasks: [{ title: 'Plan comptable', completed: true }, { title: 'Journaux', completed: true }, { title: 'Règles TVA', completed: false }], createdAt: '2024-03-05T00:00:00Z' },
  { id: 'task-6', projectId: 'proj-2', title: 'Import données collaborateurs', description: 'Migrer la base RH vers IDIBAGES', assignedTo: 'user-3', assignedToName: 'Jean-Pierre Moussa', status: 'done', priority: 'medium', dueDate: '2024-04-30', subtasks: [{ title: 'Export ancien système', completed: true }, { title: 'Nettoyage données', completed: true }, { title: 'Import IDIBAGES', completed: true }], createdAt: '2024-03-10T00:00:00Z' },
  { id: 'task-7', projectId: 'proj-2', title: 'Formation équipe Finance', description: 'Session de formation pour l\'équipe comptable', assignedTo: 'user-4', assignedToName: 'Amélie Fouda', status: 'todo', priority: 'low', dueDate: '2024-08-15', subtasks: [], createdAt: '2024-03-15T00:00:00Z' },
  { id: 'task-8', projectId: 'proj-3', title: 'Création visuels campagne', description: 'Design des visuels pour réseaux sociaux et print', assignedTo: 'user-5', assignedToName: 'Grace Abena', status: 'todo', priority: 'medium', dueDate: '2024-07-10', subtasks: [], createdAt: '2024-06-05T00:00:00Z' },
  { id: 'task-9', projectId: 'proj-4', title: 'Vérification immobilisations', description: 'Contrôle physique et comptable des immobilisations', assignedTo: 'user-4', assignedToName: 'Amélie Fouda', status: 'review', priority: 'high', dueDate: '2024-06-15', subtasks: [{ title: 'Inventaire physique', completed: true }, { title: 'Rapprochement comptable', completed: true }, { title: 'Rapport d\'écart', completed: false }], createdAt: '2024-05-05T00:00:00Z' },
  { id: 'task-10', projectId: 'proj-5', title: 'Étude géotechnique', description: 'Analyse du sol pour le datacenter', assignedTo: 'user-2', assignedToName: 'Sarah Nkolo', status: 'todo', priority: 'high', dueDate: '2024-11-30', subtasks: [], createdAt: '2024-06-20T00:00:00Z' },
];

export const seedInvoices: Invoice[] = [
  { id: 'inv-1', number: 'FAC-2024-00156', clientName: 'Société Générale Cameroun', clientEmail: 'compta@sgc.cm', date: '2024-06-01', dueDate: '2024-07-01', amount: 12500000, tax: 2500000, total: 15000000, status: 'paid', companyId: 'comp-1', items: [{ description: 'Services connectivité Q2 2024', quantity: 1, unitPrice: 12500000, tax: 2500000, total: 15000000 }], notes: '', createdAt: '2024-06-01T00:00:00Z' },
  { id: 'inv-2', number: 'FAC-2024-00157', clientName: 'MTN Cameroun', clientEmail: 'fournisseurs@mtn.cm', date: '2024-06-10', dueDate: '2024-07-10', amount: 28750000, tax: 5750000, total: 34500000, status: 'pending', companyId: 'comp-1', items: [{ description: 'Maintenance infrastructure fibre', quantity: 1, unitPrice: 28750000, tax: 5750000, total: 34500000 }], notes: '', createdAt: '2024-06-10T00:00:00Z' },
  { id: 'inv-3', number: 'FAC-2024-00158', clientName: 'Ecobank Cameroun', clientEmail: 'achats@ecobank.cm', date: '2024-06-15', dueDate: '2024-06-30', amount: 8400000, tax: 1680000, total: 10080000, status: 'overdue', companyId: 'comp-1', items: [{ description: 'Migration lien dédié 10Gbps', quantity: 1, unitPrice: 8400000, tax: 1680000, total: 10080000 }], notes: 'Urgent - client stratégique', createdAt: '2024-06-15T00:00:00Z' },
  { id: 'inv-4', number: 'FAC-2024-00159', clientName: 'Orange Cameroun', clientEmail: 'procurement@orange.cm', date: '2024-06-20', dueDate: '2024-07-20', amount: 15600000, tax: 3120000, total: 18720000, status: 'pending', companyId: 'comp-1', items: [{ description: 'Location baies datacenter', quantity: 4, unitPrice: 3900000, tax: 780000, total: 4680000 }], notes: '', createdAt: '2024-06-20T00:00:00Z' },
  { id: 'inv-5', number: 'FAC-2024-00160', clientName: 'BGRIM Cameroun', clientEmail: 'finance@bgrim.cm', date: '2024-06-25', dueDate: '2024-07-25', amount: 4250000, tax: 850000, total: 5100000, status: 'draft', companyId: 'comp-1', items: [{ description: 'Audit sécurité réseau', quantity: 1, unitPrice: 4250000, tax: 850000, total: 5100000 }], notes: 'En attente validation', createdAt: '2024-06-25T00:00:00Z' },
  { id: 'inv-6', number: 'FAC-2024-00161', clientName: 'Ministère des Finances', clientEmail: 'dg@minfi.gov.cm', date: '2024-06-28', dueDate: '2024-08-28', amount: 55000000, tax: 11000000, total: 66000000, status: 'pending', companyId: 'comp-1', items: [{ description: 'Déploiement RIE Phase 2', quantity: 1, unitPrice: 55000000, tax: 11000000, total: 66000000 }], notes: 'Marché public', createdAt: '2024-06-28T00:00:00Z' },
];

export const seedAccountingEntries: AccountingEntry[] = [
  { id: 'ae-1', date: '2024-06-01', journal: 'ACH', pieceNumber: 'ACH-240601-001', accountCode: '601', accountLabel: 'Achats marchandises', label: 'Achat équipements réseau', debit: 12500000, credit: 0, companyId: 'comp-1' },
  { id: 'ae-2', date: '2024-06-01', journal: 'ACH', pieceNumber: 'ACH-240601-001', accountCode: '4452', accountLabel: 'TVA deductible', label: 'TVA sur achat équipements', debit: 2500000, credit: 0, companyId: 'comp-1' },
  { id: 'ae-3', date: '2024-06-01', journal: 'ACH', pieceNumber: 'ACH-240601-001', accountCode: '401', accountLabel: 'Fournisseurs', label: 'Dette fournisseur', debit: 0, credit: 15000000, companyId: 'comp-1' },
  { id: 'ae-4', date: '2024-06-05', journal: 'VEN', pieceNumber: 'VEN-240605-001', accountCode: '411', accountLabel: 'Clients', label: 'Créance client SGC', debit: 15000000, credit: 0, companyId: 'comp-1' },
  { id: 'ae-5', date: '2024-06-05', journal: 'VEN', pieceNumber: 'VEN-240605-001', accountCode: '701', accountLabel: 'Ventes marchandises', label: 'Vente service connectivité', debit: 0, credit: 12500000, companyId: 'comp-1' },
  { id: 'ae-6', date: '2024-06-05', journal: 'VEN', pieceNumber: 'VEN-240605-001', accountCode: '4451', accountLabel: 'TVA collectée', label: 'TVA sur vente', debit: 0, credit: 2500000, companyId: 'comp-1' },
  { id: 'ae-7', date: '2024-06-10', journal: 'BNQ', pieceNumber: 'BNQ-240610-001', accountCode: '521', accountLabel: 'Banques', label: 'Encaissement client SGC', debit: 15000000, credit: 0, companyId: 'comp-1' },
  { id: 'ae-8', date: '2024-06-10', journal: 'BNQ', pieceNumber: 'BNQ-240610-001', accountCode: '411', accountLabel: 'Clients', label: 'Solde créance SGC', debit: 0, credit: 15000000, companyId: 'comp-1' },
  { id: 'ae-9', date: '2024-06-15', journal: 'OD', pieceNumber: 'OD-240615-001', accountCode: '681', accountLabel: 'Dotations aux amortissements', label: 'Amortissement mensuel', debit: 4500000, credit: 0, companyId: 'comp-1' },
  { id: 'ae-10', date: '2024-06-15', journal: 'OD', pieceNumber: 'OD-240615-001', accountCode: '2815', accountLabel: 'Amort. matériel info', label: 'Amortissement cumulé', debit: 0, credit: 4500000, companyId: 'comp-1' },
];

export const seedChartAccounts: ChartAccount[] = [
  { id: 'ca-1', code: '1', label: 'COMPTES DE RESSOURCES DURABLES', category: 'Bilan', children: [
    { id: 'ca-10', code: '10', label: 'Capital', category: 'Bilan', children: [
      { id: 'ca-101', code: '101', label: 'Capital social', category: 'Bilan' },
      { id: 'ca-105', code: '105', label: 'Primes liées au capital social', category: 'Bilan' },
    ]},
    { id: 'ca-12', code: '12', label: 'Résultats', category: 'Bilan', children: [
      { id: 'ca-121', code: '121', label: 'Résultat d\'exercice', category: 'Bilan' },
    ]},
    { id: 'ca-16', code: '16', label: 'Emprunts et dettes assimilées', category: 'Bilan', children: [
      { id: 'ca-161', code: '161', label: 'Emprunts obligataires', category: 'Bilan' },
      { id: 'ca-162', code: '162', label: 'Emprunts auprès des établissements de crédit', category: 'Bilan' },
    ]},
  ]},
  { id: 'ca-2', code: '2', label: 'COMPTES D\'ACTIF IMMOBILISE', category: 'Bilan', children: [
    { id: 'ca-21', code: '21', label: 'Immobilisations incorporelles', category: 'Bilan', children: [
      { id: 'ca-211', code: '211', label: 'Frais de développement', category: 'Bilan' },
      { id: 'ca-212', code: '212', label: 'Brevets, licences, logiciels', category: 'Bilan' },
    ]},
    { id: 'ca-22', code: '22', label: 'Terrains', category: 'Bilan' },
    { id: 'ca-23', code: '23', label: 'Bâtiments, installations techniques', category: 'Bilan' },
    { id: 'ca-24', code: '24', label: 'Matériel', category: 'Bilan', children: [
      { id: 'ca-244', code: '244', label: 'Matériel de transport', category: 'Bilan' },
      { id: 'ca-245', code: '245', label: 'Matériel de bureau et informatique', category: 'Bilan' },
      { id: 'ca-248', code: '248', label: 'Autres immobilisations corporelles', category: 'Bilan' },
    ]},
    { id: 'ca-28', code: '28', label: 'Amortissements', category: 'Bilan', children: [
      { id: 'ca-281', code: '281', label: 'Amort. immobilisations incorporelles', category: 'Bilan' },
      { id: 'ca-2815', code: '2815', label: 'Amort. matériel de bureau et info', category: 'Bilan' },
    ]},
  ]},
  { id: 'ca-3', code: '3', label: 'COMPTES DE STOCKS', category: 'Bilan', children: [
    { id: 'ca-31', code: '31', label: 'Marchandises', category: 'Bilan' },
    { id: 'ca-35', code: '35', label: 'Stocks de produits finis', category: 'Bilan' },
  ]},
  { id: 'ca-4', code: '4', label: 'COMPTES DE TIERS', category: 'Bilan', children: [
    { id: 'ca-40', code: '40', label: 'Fournisseurs et comptes rattachés', category: 'Bilan', children: [
      { id: 'ca-401', code: '401', label: 'Fournisseurs', category: 'Bilan' },
      { id: 'ca-408', code: '408', label: 'Fournisseurs - factures non parvenues', category: 'Bilan' },
    ]},
    { id: 'ca-41', code: '41', label: 'Clients et comptes rattachés', category: 'Bilan', children: [
      { id: 'ca-411', code: '411', label: 'Clients', category: 'Bilan' },
      { id: 'ca-416', code: '416', label: 'Clients douteux', category: 'Bilan' },
    ]},
    { id: 'ca-42', code: '42', label: 'Personnel', category: 'Bilan' },
    { id: 'ca-43', code: '43', label: 'Organismes sociaux (CNPS)', category: 'Bilan' },
    { id: 'ca-44', code: '44', label: 'État et collectivités publiques', category: 'Bilan', children: [
      { id: 'ca-441', code: '441', label: 'État - subventions à recevoir', category: 'Bilan' },
      { id: 'ca-443', code: '443', label: 'Opérations particulières avec l\'État', category: 'Bilan' },
      { id: 'ca-445', code: '445', label: 'État - TVA facturée', category: 'Bilan', children: [
        { id: 'ca-4451', code: '4451', label: 'TVA collectée', category: 'Bilan' },
        { id: 'ca-4452', code: '4452', label: 'TVA deductible', category: 'Bilan' },
      ]},
    ]},
    { id: 'ca-46', code: '46', label: 'Débiteurs et créditeurs divers', category: 'Bilan' },
  ]},
  { id: 'ca-5', code: '5', label: 'COMPTES DE TRÉSORERIE', category: 'Bilan', children: [
    { id: 'ca-52', code: '52', label: 'Banques', category: 'Bilan', children: [
      { id: 'ca-521', code: '521', label: 'Banques locales', category: 'Bilan' },
      { id: 'ca-522', code: '522', label: 'Banques étrangères', category: 'Bilan' },
    ]},
    { id: 'ca-53', code: '53', label: 'Établissements financiers', category: 'Bilan' },
    { id: 'ca-57', code: '57', label: 'Caisse', category: 'Bilan' },
  ]},
  { id: 'ca-6', code: '6', label: 'COMPTES DE CHARGES', category: 'Gestion', children: [
    { id: 'ca-60', code: '60', label: 'Achats et variations de stocks', category: 'Gestion', children: [
      { id: 'ca-601', code: '601', label: 'Achats stockés - Matières premières', category: 'Gestion' },
      { id: 'ca-602', code: '602', label: 'Achats stockés - Autres approvisionnements', category: 'Gestion' },
      { id: 'ca-607', code: '607', label: 'Achats de marchandises', category: 'Gestion' },
    ]},
    { id: 'ca-61', code: '61', label: 'Transports', category: 'Gestion' },
    { id: 'ca-62', code: '62', label: 'Services extérieurs A', category: 'Gestion', children: [
      { id: 'ca-621', code: '621', label: 'Sous-traitance générale', category: 'Gestion' },
      { id: 'ca-624', code: '624', label: 'Transports du personnel', category: 'Gestion' },
      { id: 'ca-628', code: '628', label: 'Fournitures de bureau', category: 'Gestion' },
    ]},
    { id: 'ca-63', code: '63', label: 'Services extérieurs B', category: 'Gestion', children: [
      { id: 'ca-631', code: '631', label: 'Frais bancaires', category: 'Gestion' },
      { id: 'ca-633', code: '633', label: 'Frais de formation du personnel', category: 'Gestion' },
    ]},
    { id: 'ca-64', code: '64', label: 'Impôts et taxes', category: 'Gestion' },
    { id: 'ca-66', code: '66', label: 'Charges de personnel', category: 'Gestion', children: [
      { id: 'ca-661', code: '661', label: 'Salaires et appointements', category: 'Gestion' },
      { id: 'ca-663', code: '663', label: 'Indemnités et avantages divers', category: 'Gestion' },
      { id: 'ca-664', code: '664', label: 'Charges sociales (CNPS)', category: 'Gestion' },
    ]},
    { id: 'ca-68', code: '68', label: 'Dotations aux amortissements', category: 'Gestion', children: [
      { id: 'ca-681', code: '681', label: 'Dotations aux amortissements', category: 'Gestion' },
    ]},
  ]},
  { id: 'ca-7', code: '7', label: 'COMPTES DE PRODUITS', category: 'Gestion', children: [
    { id: 'ca-70', code: '70', label: 'Ventes', category: 'Gestion', children: [
      { id: 'ca-701', code: '701', label: 'Ventes de marchandises', category: 'Gestion' },
      { id: 'ca-702', code: '702', label: 'Ventes de produits finis', category: 'Gestion' },
      { id: 'ca-706', code: '706', label: 'Services vendus', category: 'Gestion' },
    ]},
    { id: 'ca-71', code: '71', label: 'Subventions d\'exploitation', category: 'Gestion' },
    { id: 'ca-72', code: '72', label: 'Production immobilisée', category: 'Gestion' },
    { id: 'ca-77', code: '77', label: 'Revenus financiers', category: 'Gestion' },
  ]},
  { id: 'ca-8', code: '8', label: 'COMPTES DE RÉSULTAT', category: 'Gestion', children: [
    { id: 'ca-80', code: '80', label: 'Résultat d\'exercice', category: 'Gestion' },
    { id: 'ca-83', code: '83', label: 'Charges hors activités ordinaires', category: 'Gestion' },
    { id: 'ca-84', code: '84', label: 'Produits hors activités ordinaires', category: 'Gestion' },
  ]},
];

export const seedAssets: Asset[] = [
  { id: 'asset-1', name: 'Serveur Dell PowerEdge R750', category: 'Serveurs', serialNumber: 'SN-DEL-2024-001', description: 'Serveur principal datacenter Douala', acquisitionDate: '2023-01-15', value: 12500000, depreciation: 3750000, netValue: 8750000, location: 'Datacenter Douala - Salle A', status: 'active', companyId: 'comp-1' },
  { id: 'asset-2', name: 'Switch Cisco Nexus 9300', category: 'Réseau', serialNumber: 'SN-CIS-2024-015', description: 'Switch core réseau 48 ports 10GbE', acquisitionDate: '2023-03-20', value: 6800000, depreciation: 2040000, netValue: 4760000, location: 'Datacenter Douala - Salle A', status: 'active', companyId: 'comp-1' },
  { id: 'asset-3', name: 'UPS APC Symmetra 20kVA', category: 'Électrique', serialNumber: 'SN-APC-2023-008', description: 'Onduleur triphasé avec batterie', acquisitionDate: '2023-06-01', value: 15200000, depreciation: 3800000, netValue: 11400000, location: 'Datacenter Douala - Salle B', status: 'active', companyId: 'comp-1' },
  { id: 'asset-4', name: 'Routeur Huawei NE40E', category: 'Réseau', serialNumber: 'SN-HUA-2024-042', description: 'Routeur backbone MPLS', acquisitionDate: '2024-01-10', value: 18500000, depreciation: 1850000, netValue: 16650000, location: 'Nœud PK12 Douala', status: 'active', companyId: 'comp-1' },
  { id: 'asset-5', name: 'Générateur Caterpillar 500kVA', category: 'Électrique', serialNumber: 'SN-CAT-2023-112', description: 'Groupe électrogène de secours', acquisitionDate: '2023-08-15', value: 45000000, depreciation: 9000000, netValue: 36000000, location: 'Datacenter Douala - Extérieur', status: 'maintenance', companyId: 'comp-1' },
  { id: 'asset-6', name: 'Station de travail HP Z8', category: 'Informatique', serialNumber: 'SN-HP-2024-203', description: 'Workstation ingénierie réseau', acquisitionDate: '2024-02-01', value: 2800000, depreciation: 280000, netValue: 2520000, location: 'Bureau Technique - Étage 2', status: 'active', companyId: 'comp-1' },
];

export const seedTickets: Ticket[] = [
  { id: 'ticket-1', subject: 'Lenteur réseau filaire étage 3', description: 'Les utilisateurs de l\'étage 3 signalent des débits très faibles depuis ce matin.', requesterId: 'user-5', requesterName: 'Grace Abena', category: 'Incident', priority: 'high', status: 'in_progress', assignedTo: 'user-2', assignedToName: 'Sarah Nkolo', createdAt: '2024-06-28T08:30:00Z', updatedAt: '2024-06-28T10:15:00Z', comments: [{ id: 'c1', authorId: 'user-2', authorName: 'Sarah Nkolo', content: 'Je regarde, probablement un port saturé sur le switch.', createdAt: '2024-06-28T09:00:00Z', isInternal: false }, { id: 'c2', authorId: 'user-2', authorName: 'Sarah Nkolo', content: 'Port réinitialisé, monitoring en cours.', createdAt: '2024-06-28T10:15:00Z', isInternal: false }] },
  { id: 'ticket-2', subject: 'Demande accès CRM Salesforce', description: 'Besoin d\'un accès CRM pour suivre les leads de la campagne Q3.', requesterId: 'user-5', requesterName: 'Grace Abena', category: 'Demande', priority: 'medium', status: 'open', assignedTo: 'user-2', assignedToName: 'Sarah Nkolo', createdAt: '2024-06-27T14:00:00Z', updatedAt: '2024-06-27T14:30:00Z', comments: [] },
  { id: 'ticket-3', subject: 'Panne totale fibre PK25', description: 'Coupure fibre optique au point kilométrique 25, clients impactés.', requesterId: 'user-6', requesterName: 'Koffi Mensah', category: 'Incident', priority: 'critical', status: 'in_progress', assignedTo: 'user-6', assignedToName: 'Koffi Mensah', createdAt: '2024-06-28T06:00:00Z', updatedAt: '2024-06-28T11:00:00Z', comments: [{ id: 'c3', authorId: 'user-6', authorName: 'Koffi Mensah', content: 'Équipe sur place, travaux de soudure en cours.', createdAt: '2024-06-28T08:00:00Z', isInternal: false }] },
  { id: 'ticket-4', subject: 'Formation nouveaux employés IDIBAGES', description: 'Organiser une session de formation pour les 3 nouveaux arrivants.', requesterId: 'user-3', requesterName: 'Jean-Pierre Moussa', category: 'Demande', priority: 'low', status: 'waiting', assignedTo: 'user-4', assignedToName: 'Amélie Fouda', createdAt: '2024-06-26T10:00:00Z', updatedAt: '2024-06-27T09:00:00Z', comments: [] },
  { id: 'ticket-5', subject: 'Mise à jour antivirus postes Windows', description: 'Déploiement urgent patch sécurité CVE-2024-XXXX.', requesterId: 'user-2', requesterName: 'Sarah Nkolo', category: 'Bug', priority: 'high', status: 'resolved', assignedTo: 'user-7', assignedToName: 'Ingrid Biya', createdAt: '2024-06-25T08:00:00Z', updatedAt: '2024-06-26T16:00:00Z', comments: [{ id: 'c4', authorId: 'user-7', authorName: 'Ingrid Biya', content: 'Déploiement effectué sur les 45 postes.', createdAt: '2024-06-26T16:00:00Z', isInternal: false }] },
];

export const seedIdeas: Idea[] = [
  { id: 'idea-1', title: 'Application mobile pour techniciens terrain', description: 'Développer une app mobile permettant aux techniciens d\'accéder aux plans de câblage, de reporter des incidents et de valider des interventions en temps réel.', authorId: 'user-7', authorName: 'Ingrid Biya', category: 'Tech', tags: ['mobile', 'field-service', 'productivité'], upvotes: 24, hasUpvoted: false, comments: 8, status: 'under_review', createdAt: '2024-06-15T00:00:00Z' },
  { id: 'idea-2', title: 'Chatbot support client IA', description: 'Intégrer un chatbot basé sur l\'IA pour répondre aux demandes fréquentes des clients et réduire la charge du support niveau 1.', authorId: 'user-2', authorName: 'Sarah Nkolo', category: 'Tech', tags: ['ia', 'support', 'automatisation'], upvotes: 31, hasUpvoted: false, comments: 12, status: 'in_development', createdAt: '2024-06-10T00:00:00Z' },
  { id: 'idea-3', title: 'Forfait Internet illimité week-end', description: 'Proposer un forfait spécial week-end avec données illimitées pour les particuliers.', authorId: 'user-5', authorName: 'Grace Abena', category: 'Produit', tags: ['marketing', 'forfait', 'revenus'], upvotes: 18, hasUpvoted: false, comments: 5, status: 'proposed', createdAt: '2024-06-25T00:00:00Z' },
  { id: 'idea-4', title: 'Partenariats universités pour stages', description: 'Créer un programme de partenariat avec les universités locales pour accueillir des stagiaires et constituer un vivier de recrutement.', authorId: 'user-3', authorName: 'Jean-Pierre Moussa', category: 'Process', tags: ['rh', 'recrutement', 'partenariat'], upvotes: 15, hasUpvoted: false, comments: 3, status: 'implemented', createdAt: '2024-05-20T00:00:00Z' },
  { id: 'idea-5', title: 'Monitoring prédictif équipements', description: 'Mettre en place des capteurs IoT et des algorithmes de ML pour anticiper les pannes d\'équipements critiques.', authorId: 'user-2', authorName: 'Sarah Nkolo', category: 'Tech', tags: ['iot', 'ml', 'maintenance'], upvotes: 42, hasUpvoted: false, comments: 15, status: 'in_development', createdAt: '2024-06-01T00:00:00Z' },
  { id: 'idea-6', title: 'Espace coworking pour clients premium', description: 'Aménager un espace de coworking dans nos locaux pour les clients premium, renforçant la relation et la fidélisation.', authorId: 'user-1', authorName: 'Martin Essomba', category: 'Service', tags: ['premium', 'fidélisation', 'expérience-client'], upvotes: 12, hasUpvoted: false, comments: 6, status: 'proposed', createdAt: '2024-06-28T00:00:00Z' },
];

export const seedCalendarEvents: CalendarEvent[] = [
  { id: 'evt-1', title: 'Publication LinkedIn - Fibre', type: 'social', startDate: '2024-06-30T09:00:00Z', endDate: '2024-06-30T10:00:00Z', description: 'Post sur l\'extension fibre Douala', assignees: ['user-5'], color: '#3B82F6' },
  { id: 'evt-2', title: 'Article Blog - Sécurité réseau', type: 'blog', startDate: '2024-07-02T00:00:00Z', endDate: '2024-07-02T23:59:59Z', description: 'Article sur les bonnes pratiques sécurité', assignees: ['user-5', 'user-2'], color: '#2DD4A8' },
  { id: 'evt-3', title: 'Newsletter Juillet', type: 'newsletter', startDate: '2024-07-05T08:00:00Z', endDate: '2024-07-05T12:00:00Z', description: 'Newsletter mensuelle clients', assignees: ['user-5'], color: '#8B5CF6' },
  { id: 'evt-4', title: 'Salon Télécoms CEMAC', type: 'event', startDate: '2024-07-10T00:00:00Z', endDate: '2024-07-12T23:59:59Z', description: 'Stand et conférence au salon', assignees: ['user-1', 'user-5'], color: '#F59E0B' },
  { id: 'evt-5', title: 'Réunion comité de direction', type: 'meeting', startDate: '2024-06-28T14:00:00Z', endDate: '2024-06-28T16:00:00Z', description: 'Revue mensuelle KPIs', assignees: ['user-1', 'user-2', 'user-3', 'user-4'], color: '#EF4444' },
  { id: 'evt-6', title: 'Webinaire cybersécurité', type: 'event', startDate: '2024-07-15T13:00:00Z', endDate: '2024-07-15T15:00:00Z', description: 'Webinaire pour clients entreprise', assignees: ['user-2', 'user-5'], color: '#F59E0B' },
];

export const seedExpenses: Expense[] = [
  { id: 'exp-1', description: 'Déjeuner client Société Générale', amount: 85000, category: 'Repas', date: '2024-06-20', employeeId: 'user-1', employeeName: 'Martin Essomba', status: 'approved', companyId: 'comp-1' },
  { id: 'exp-2', description: 'Taxi aéroport mission Yaoundé', amount: 25000, category: 'Transport', date: '2024-06-22', employeeId: 'user-4', employeeName: 'Amélie Fouda', status: 'pending', companyId: 'comp-1' },
  { id: 'exp-3', description: 'Fournitures bureau (ramettes, stylos)', amount: 45000, category: 'Fournitures', date: '2024-06-25', employeeId: 'user-3', employeeName: 'Jean-Pierre Moussa', status: 'approved', companyId: 'comp-1' },
  { id: 'exp-4', description: 'Hôtel séminaire formation', amount: 125000, category: 'Hébergement', date: '2024-06-26', employeeId: 'user-7', employeeName: 'Ingrid Biya', status: 'pending', companyId: 'comp-1' },
  { id: 'exp-5', description: 'Essence véhicule service', amount: 78000, category: 'Carburant', date: '2024-06-27', employeeId: 'user-6', employeeName: 'Koffi Mensah', status: 'approved', companyId: 'comp-1' },
];

export const seedNotifications: Notification[] = [
  { id: 'notif-1', type: 'warning', title: 'Facture en retard', message: 'FAC-2024-00158 (Ecobank) est en retard de 3 jours.', read: false, createdAt: '2024-06-28T08:00:00Z', link: '/finance/invoices' },
  { id: 'notif-2', type: 'info', title: 'Nouvelle tâche assignée', message: 'Vous avez été assignée à "Tests de signal".', read: false, createdAt: '2024-06-27T16:00:00Z', link: '/projects/proj-1' },
  { id: 'notif-3', type: 'success', title: 'Synchronisation terminée', message: 'Vos données hors-ligne ont été synchronisées.', read: true, createdAt: '2024-06-27T12:00:00Z' },
  { id: 'notif-4', type: 'info', title: 'Réunion demain', message: 'Réunion comité de direction à 14h00.', read: true, createdAt: '2024-06-27T10:00:00Z', link: '/marketing' },
  { id: 'notif-5', type: 'error', title: 'Panne fibre PK25', message: 'Incident critique signalé sur la fibre.', read: false, createdAt: '2024-06-28T06:00:00Z', link: '/support' },
];

// ============================================
// EMPLOYEES (HR)
// ============================================

export const seedEmployees: Employee[] = [
  { id: 'emp-1', userId: 'user-1', matricule: 'IG-2020-001', firstName: 'Martin', lastName: 'Essomba', fullName: 'Martin Essomba', email: 'pdg@idibagroup.cm', phone: '+237 699 01 02 03', birthDate: '1975-03-15', hireDate: '2020-01-15', departmentId: 'dept-1', departmentName: 'Direction Générale', position: 'PDG', contractType: 'CDI', grossSalary: 2500000, netSalary: 1875000, cnpsNumber: 'CNPS-987654321', status: 'active', address: 'Bonapriso, Douala', emergencyContact: '+237 699 11 22 33', bankAccount: 'CMR-123456789', bankName: 'SGBC', companyId: 'comp-1' },
  { id: 'emp-2', userId: 'user-2', matricule: 'IG-2020-002', firstName: 'Sarah', lastName: 'Nkolo', fullName: 'Sarah Nkolo', email: 'cto@idibagroup.cm', phone: '+237 677 45 67 89', birthDate: '1982-07-22', hireDate: '2020-02-01', departmentId: 'dept-4', departmentName: 'Technique & IT', position: 'CTO', contractType: 'CDI', grossSalary: 1800000, netSalary: 1350000, cnpsNumber: 'CNPS-876543210', status: 'active', address: 'Makepe, Douala', emergencyContact: '+237 677 99 88 77', bankAccount: 'CMR-987654321', bankName: 'ECOBANK', companyId: 'comp-1' },
  { id: 'emp-3', userId: 'user-3', matricule: 'IG-2020-003', firstName: 'Jean-Pierre', lastName: 'Moussa', fullName: 'Jean-Pierre Moussa', email: 'rh@idibagroup.cm', phone: '+237 696 12 34 56', birthDate: '1978-11-08', hireDate: '2020-03-01', departmentId: 'dept-2', departmentName: 'Ressources Humaines', position: 'DRH', contractType: 'CDI', grossSalary: 1500000, netSalary: 1125000, cnpsNumber: 'CNPS-765432109', status: 'active', address: 'Deido, Douala', emergencyContact: '+237 696 55 44 33', bankAccount: 'CMR-456789123', bankName: 'AFC', companyId: 'comp-1' },
  { id: 'emp-4', userId: 'user-4', matricule: 'IG-2020-004', firstName: 'Amélie', lastName: 'Fouda', fullName: 'Amélie Fouda', email: 'compta@idibagroup.cm', phone: '+237 694 78 90 12', birthDate: '1985-05-20', hireDate: '2020-04-15', departmentId: 'dept-3', departmentName: 'Finance & Comptabilité', position: 'Responsable Comptable', contractType: 'CDI', grossSalary: 1400000, netSalary: 1050000, cnpsNumber: 'CNPS-654321098', status: 'active', address: 'Bali, Douala', emergencyContact: '+237 694 66 77 88', bankAccount: 'CMR-789123456', bankName: 'UBA', companyId: 'comp-1' },
  { id: 'emp-5', userId: 'user-5', matricule: 'IG-2021-005', firstName: 'Grace', lastName: 'Abena', fullName: 'Grace Abena', email: 'marketing@idibagroup.cm', phone: '+237 691 23 45 67', birthDate: '1990-09-12', hireDate: '2021-01-10', departmentId: 'dept-5', departmentName: 'Marketing & Com', position: 'Responsable Marketing', contractType: 'CDI', grossSalary: 1200000, netSalary: 900000, cnpsNumber: 'CNPS-543210987', status: 'active', address: 'Logbessou, Douala', emergencyContact: '+237 691 33 22 11', bankAccount: 'CMR-321654987', bankName: 'SGBC', companyId: 'comp-1' },
  { id: 'emp-6', userId: 'user-6', matricule: 'IG-2021-006', firstName: 'Koffi', lastName: 'Mensah', fullName: 'Koffi Mensah', email: 'logistics@idibagroup.cm', phone: '+237 698 56 78 90', birthDate: '1980-01-30', hireDate: '2021-02-20', departmentId: 'dept-6', departmentName: 'Logistique', position: 'Responsable Logistique', contractType: 'CDI', grossSalary: 1100000, netSalary: 825000, cnpsNumber: 'CNPS-432109876', status: 'active', address: 'Ndogbong, Douala', emergencyContact: '+237 698 44 55 66', bankAccount: 'CMR-654987321', bankName: 'ECOBANK', companyId: 'comp-1' },
  { id: 'emp-7', userId: 'user-7', matricule: 'IG-2022-007', firstName: 'Ingrid', lastName: 'Biya', fullName: 'Ingrid Biya', email: 'dev1@idibagroup.cm', phone: '+237 695 34 56 78', birthDate: '1993-04-05', hireDate: '2022-03-15', departmentId: 'dept-4', departmentName: 'Technique & IT', position: 'Développeuse Senior', contractType: 'CDI', grossSalary: 900000, netSalary: 675000, cnpsNumber: 'CNPS-321098765', status: 'active', address: 'Kotto, Douala', emergencyContact: '+237 695 77 88 99', bankAccount: 'CMR-147258369', bankName: 'CCA', companyId: 'comp-1' },
  { id: 'emp-8', userId: 'user-8', matricule: 'IG-2024-008', firstName: 'Paul', lastName: 'Tchuente', fullName: 'Paul Tchuente', email: 'dev2@idibagroup.cm', phone: '+237 692 67 89 01', birthDate: '1995-08-18', hireDate: '2024-06-01', departmentId: 'dept-4', departmentName: 'Technique & IT', position: 'Développeur Full-Stack', contractType: 'CDD', grossSalary: 750000, netSalary: 562500, cnpsNumber: 'CNPS-210987654', status: 'active', address: 'PK14, Douala', emergencyContact: '+237 692 11 22 33', bankAccount: 'CMR-369258147', bankName: 'SGBC', companyId: 'comp-1' },
];

// ============================================
// LEAVES
// ============================================

export const seedLeaves: Leave[] = [
  { id: 'leave-1', employeeId: 'emp-5', employeeName: 'Grace Abena', type: 'annual', startDate: '2024-07-15', endDate: '2024-08-02', days: 15, reason: 'Congé annuel famille', status: 'approved', approvedBy: 'Martin Essomba', createdAt: '2024-06-20T00:00:00Z' },
  { id: 'leave-2', employeeId: 'emp-4', employeeName: 'Amélie Fouda', type: 'sick', startDate: '2024-06-10', endDate: '2024-06-12', days: 3, reason: 'Consultation médicale', status: 'approved', approvedBy: 'Jean-Pierre Moussa', createdAt: '2024-06-09T00:00:00Z' },
  { id: 'leave-3', employeeId: 'emp-7', employeeName: 'Ingrid Biya', type: 'training', startDate: '2024-08-05', endDate: '2024-08-09', days: 5, reason: 'Formation React Avancé', status: 'pending', createdAt: '2024-06-25T00:00:00Z' },
  { id: 'leave-4', employeeId: 'emp-2', employeeName: 'Sarah Nkolo', type: 'annual', startDate: '2024-08-19', endDate: '2024-09-02', days: 11, reason: 'Voyage famille', status: 'pending', createdAt: '2024-06-28T00:00:00Z' },
  { id: 'leave-5', employeeId: 'emp-6', employeeName: 'Koffi Mensah', type: 'annual', startDate: '2024-12-23', endDate: '2025-01-03', days: 10, reason: 'Fêtes de fin d\'année', status: 'pending', createdAt: '2024-06-28T00:00:00Z' },
];

// ============================================
// CANDIDATES (RECRUITMENT PIPELINE)
// ============================================

export const seedCandidates: Candidate[] = [
  { id: 'cand-1', firstName: 'Marie', lastName: 'Etoundi', email: 'marie.etoundi@email.cm', phone: '+237 699 88 77 66', position: 'Ingénieur Réseau Senior', departmentId: 'dept-4', status: 'interview', source: 'LinkedIn', rating: 4, salaryExpectation: 1200000, notes: 'Excellente expérience MPLS/BGP, 8 ans chez Orange', interviewDate: '2024-07-05T09:00:00Z', createdAt: '2024-06-01T00:00:00Z', companyId: 'comp-1' },
  { id: 'cand-2', firstName: 'François', lastName: 'Nguema', email: 'f.nguema@email.cm', phone: '+237 677 11 22 33', position: 'Comptable', departmentId: 'dept-3', status: 'screening', source: 'Site web', rating: 3, salaryExpectation: 800000, notes: 'Diplôme DCG, 3 ans d\'expérience', createdAt: '2024-06-10T00:00:00Z', companyId: 'comp-1' },
  { id: 'cand-3', firstName: 'Aïcha', lastName: 'Bako', email: 'aicha.bako@email.cm', phone: '+237 696 44 55 66', position: 'Assistante Marketing', departmentId: 'dept-5', status: 'technical', source: 'Référence interne', rating: 5, salaryExpectation: 600000, notes: 'Stage validé, très bonne maîtrise des réseaux sociaux', createdAt: '2024-06-15T00:00:00Z', companyId: 'comp-1' },
  { id: 'cand-4', firstName: 'Robert', lastName: 'Fotso', email: 'robert.fotso@email.cm', phone: '+237 694 77 88 99', position: 'Technicien Fibre Optique', departmentId: 'dept-4', status: 'new', source: 'BOLOLO', rating: 0, salaryExpectation: 500000, notes: 'Certification soudure fibre, 5 ans d\'expérience terrain', createdAt: '2024-06-28T00:00:00Z', companyId: 'comp-1' },
  { id: 'cand-5', firstName: 'Claire', lastName: 'Mba', email: 'claire.mba@email.cm', phone: '+237 691 00 11 22', position: 'Chargée RH', departmentId: 'dept-2', status: 'offer', source: 'LinkedIn', rating: 4, salaryExpectation: 900000, notes: 'Master RH, expérience CNPS et paie Cameroun', interviewDate: '2024-06-25T14:00:00Z', createdAt: '2024-06-05T00:00:00Z', companyId: 'comp-1' },
  { id: 'cand-6', firstName: 'Eric', lastName: 'Ngono', email: 'eric.ngono@email.cm', phone: '+237 698 33 44 55', position: 'Développeur Backend', departmentId: 'dept-4', status: 'rejected', source: 'LinkedIn', rating: 2, salaryExpectation: 1000000, notes: 'Compétences techniques insuffisantes pour le poste', createdAt: '2024-05-20T00:00:00Z', companyId: 'comp-1' },
];

// ============================================
// PAYROLL (CNPS compliant - Cameroon)
// CNPS rates: Employee 4.2%, Employer 4.2% (pension) + 1.75% (AT/MP) + 1.5% (family)
// Total employer CNPS: 7.45%
// CRTV: 1.5% employer
// CAC: 1% employer
// CFC: 0.5% employer
// IRPP: Progressive tax brackets
// ============================================

export const seedPayroll: PayrollItem[] = [
  { id: 'pay-1', employeeId: 'emp-1', employeeName: 'Martin Essomba', month: 'Juin', year: 2024, grossSalary: 2500000, cnpsEmployee: 105000, cnpsEmployer: 186250, crtv: 37500, cac: 25000, cfc: 12500, commissions: 0, overtime: 0, taxableIncome: 2267500, irpp: 340125, taxCredit: 0, advancePayment: 0, otherDeductions: 50000, netSalary: 1874875, employerCost: 2740250, payslipGenerated: true, status: 'paid', companyId: 'comp-1' },
  { id: 'pay-2', employeeId: 'emp-2', employeeName: 'Sarah Nkolo', month: 'Juin', year: 2024, grossSalary: 1800000, cnpsEmployee: 75600, cnpsEmployer: 134100, crtv: 27000, cac: 18000, cfc: 9000, commissions: 150000, overtime: 0, taxableIncome: 1805400, irpp: 216648, taxCredit: 0, advancePayment: 0, otherDeductions: 20000, netSalary: 1350000, employerCost: 1982100, payslipGenerated: true, status: 'paid', companyId: 'comp-1' },
  { id: 'pay-3', employeeId: 'emp-3', employeeName: 'Jean-Pierre Moussa', month: 'Juin', year: 2024, grossSalary: 1500000, cnpsEmployee: 63000, cnpsEmployer: 111750, crtv: 22500, cac: 15000, cfc: 7500, commissions: 0, overtime: 0, taxableIncome: 1387500, irpp: 138750, taxCredit: 0, advancePayment: 50000, otherDeductions: 15000, netSalary: 1125000, employerCost: 1656750, payslipGenerated: true, status: 'paid', companyId: 'comp-1' },
  { id: 'pay-4', employeeId: 'emp-4', employeeName: 'Amélie Fouda', month: 'Juin', year: 2024, grossSalary: 1400000, cnpsEmployee: 58800, cnpsEmployer: 104300, crtv: 21000, cac: 14000, cfc: 7000, commissions: 0, overtime: 0, taxableIncome: 1288200, irpp: 128820, taxCredit: 0, advancePayment: 0, otherDeductions: 10000, netSalary: 1050000, employerCost: 1546300, payslipGenerated: true, status: 'paid', companyId: 'comp-1' },
  { id: 'pay-5', employeeId: 'emp-5', employeeName: 'Grace Abena', month: 'Juin', year: 2024, grossSalary: 1200000, cnpsEmployee: 50400, cnpsEmployer: 89400, crtv: 18000, cac: 12000, cfc: 6000, commissions: 50000, overtime: 0, taxableIncome: 1198600, irpp: 107874, taxCredit: 0, advancePayment: 0, otherDeductions: 8000, netSalary: 900000, employerCost: 1333800, payslipGenerated: true, status: 'paid', companyId: 'comp-1' },
  { id: 'pay-6', employeeId: 'emp-6', employeeName: 'Koffi Mensah', month: 'Juin', year: 2024, grossSalary: 1100000, cnpsEmployee: 46200, cnpsEmployer: 81950, crtv: 16500, cac: 11000, cfc: 5500, commissions: 0, overtime: 75000, taxableIncome: 1158300, irpp: 104247, taxCredit: 0, advancePayment: 0, otherDeductions: 5000, netSalary: 825000, employerCost: 1274950, payslipGenerated: true, status: 'paid', companyId: 'comp-1' },
  { id: 'pay-7', employeeId: 'emp-7', employeeName: 'Ingrid Biya', month: 'Juin', year: 2024, grossSalary: 900000, cnpsEmployee: 37800, cnpsEmployer: 67050, crtv: 13500, cac: 9000, cfc: 4500, commissions: 0, overtime: 0, taxableIncome: 851700, irpp: 59519, taxCredit: 0, advancePayment: 20000, otherDeductions: 3000, netSalary: 675000, employerCost: 994050, payslipGenerated: true, status: 'paid', companyId: 'comp-1' },
  { id: 'pay-8', employeeId: 'emp-8', employeeName: 'Paul Tchuente', month: 'Juin', year: 2024, grossSalary: 750000, cnpsEmployee: 31500, cnpsEmployer: 55875, crtv: 11250, cac: 7500, cfc: 3750, commissions: 0, overtime: 0, taxableIncome: 709500, irpp: 35475, taxCredit: 0, advancePayment: 0, otherDeductions: 2000, netSalary: 562500, employerCost: 828375, payslipGenerated: true, status: 'confirmed', companyId: 'comp-1' },
];

// ============================================
// CLIENTS
// ============================================

export const seedClients: Client[] = [
  { id: 'client-1', name: 'Société Générale Cameroun', email: 'compta@sgc.cm', phone: '+237 233 42 01 00', address: 'Avenue Joffre, Centre Ville', city: 'Douala', country: 'Cameroun', ifu: 'IFU-SGC-001', rccm: 'RC-DLA-1998-A-001', contactName: 'M. Nkodo Antoine', contactEmail: 'a.nkodo@sgc.cm', type: 'entreprise', sector: 'Banque', totalInvoiced: 156000000, totalPaid: 141000000, outstandingBalance: 15000000, status: 'active', createdAt: '2020-01-15T00:00:00Z', companyId: 'comp-1' },
  { id: 'client-2', name: 'MTN Cameroun', email: 'fournisseurs@mtn.cm', phone: '+237 679 00 00 00', address: 'Immeuble MTN, Bonanjo', city: 'Douala', country: 'Cameroun', ifu: 'IFU-MTN-002', contactName: 'Mme Biya Rose', contactEmail: 'r.biya@mtn.cm', type: 'entreprise', sector: 'Télécoms', totalInvoiced: 425000000, totalPaid: 390000000, outstandingBalance: 35000000, status: 'active', createdAt: '2020-03-01T00:00:00Z', companyId: 'comp-1' },
  { id: 'client-3', name: 'Ecobank Cameroun', email: 'achats@ecobank.cm', phone: '+237 233 50 90 00', address: 'Boulevard de la Liberté', city: 'Douala', country: 'Cameroun', ifu: 'IFU-ECO-003', contactName: 'M. Talla Emmanuel', contactEmail: 'e.talla@ecobank.cm', type: 'entreprise', sector: 'Banque', totalInvoiced: 78000000, totalPaid: 72000000, outstandingBalance: 6000000, status: 'active', createdAt: '2021-01-20T00:00:00Z', companyId: 'comp-1' },
  { id: 'client-4', name: 'Orange Cameroun', email: 'procurement@orange.cm', phone: '+237 693 00 00 00', address: 'Zone industrielle, Douala-Bassa', city: 'Douala', country: 'Cameroun', ifu: 'IFU-ORA-004', contactName: 'M. Essomba Jacques', contactEmail: 'j.essomba@orange.cm', type: 'entreprise', sector: 'Télécoms', totalInvoiced: 215000000, totalPaid: 196250000, outstandingBalance: 18750000, status: 'active', createdAt: '2020-06-01T00:00:00Z', companyId: 'comp-1' },
  { id: 'client-5', name: 'Ministère des Finances', email: 'dg@minfi.gov.cm', phone: '+237 222 23 40 11', address: 'Avenue Ahmadu Ahidjo', city: 'Yaoundé', country: 'Cameroun', ifu: 'IFU-MINFI-005', contactName: 'M. Moussa Ibrahim', contactEmail: 'i.moussa@minfi.gov.cm', type: 'administration', sector: 'Administration publique', totalInvoiced: 550000000, totalPaid: 484000000, outstandingBalance: 66000000, status: 'active', createdAt: '2021-09-01T00:00:00Z', companyId: 'comp-1' },
  { id: 'client-6', name: 'BGRIM Cameroun', email: 'finance@bgrim.cm', phone: '+237 233 40 50 60', address: 'Bonapriso', city: 'Douala', country: 'Cameroun', ifu: 'IFU-BGR-006', contactName: 'Mme Ngono Claire', contactEmail: 'c.ngono@bgrim.cm', type: 'entreprise', sector: 'Énergie', totalInvoiced: 45000000, totalPaid: 39900000, outstandingBalance: 5100000, status: 'active', createdAt: '2022-02-15T00:00:00Z', companyId: 'comp-1' },
  { id: 'client-7', name: 'Entreprise Privée Kotto', email: 'contact@epkotto.cm', phone: '+237 677 99 00 11', address: 'Kotto, derrière église', city: 'Douala', country: 'Cameroun', contactName: 'M. Kotto Pierre', contactEmail: 'p.kotto@epkotto.cm', type: 'particulier', sector: 'Commerce', totalInvoiced: 2500000, totalPaid: 2500000, outstandingBalance: 0, status: 'active', createdAt: '2023-05-01T00:00:00Z', companyId: 'comp-1' },
  { id: 'client-8', name: 'Hôtel Akwa Palace', email: 'compta@akwapalace.cm', phone: '+237 233 42 09 00', address: 'Rue Pau, Akwa', city: 'Douala', country: 'Cameroun', ifu: 'IFU-AKW-007', contactName: 'M. Fouda Robert', contactEmail: 'r.fouda@akwapalace.cm', type: 'entreprise', sector: 'Hôtellerie', totalInvoiced: 15000000, totalPaid: 12000000, outstandingBalance: 3000000, status: 'inactive', createdAt: '2021-11-01T00:00:00Z', companyId: 'comp-1' },
];

// ============================================
// PERFORMANCE REVIEWS
// ============================================

export const seedPerformanceReviews: PerformanceReview[] = [
  { id: 'perf-1', employeeId: 'emp-1', employeeName: 'Martin Essomba', reviewerId: 'user-1', reviewerName: 'Conseil d\'Administration', period: 'S1', year: 2024, objectives: [{ description: 'Croissance CA 15%', weight: 30, score: 4 }, { description: 'Nouveaux contrats stratégiques', weight: 25, score: 5 }, { description: 'Conformité réglementaire', weight: 20, score: 4 }, { description: 'Développement équipes', weight: 25, score: 4 }], competencies: [{ name: 'Leadership', score: 5 }, { name: 'Stratégie', score: 4 }, { name: 'Communication', score: 4 }, { name: 'Innovation', score: 4 }], overallScore: 4.2, rating: 'exceeds', bonusAmount: 500000, bonusPercentage: 20, comments: 'Excellente performance. Croissance supérieure aux objectifs.', employeeComments: 'Satisfait des résultats obtenus', status: 'approved', createdAt: '2024-06-30T00:00:00Z', companyId: 'comp-1' },
  { id: 'perf-2', employeeId: 'emp-2', employeeName: 'Sarah Nkolo', reviewerId: 'user-1', reviewerName: 'Martin Essomba', period: 'S1', year: 2024, objectives: [{ description: 'Déploiement fibre 50km', weight: 35, score: 4 }, { description: 'Migration ERP', weight: 30, score: 5 }, { description: 'Équipe technique +3', weight: 20, score: 3 }, { description: 'Zero incident majeur', weight: 15, score: 4 }], competencies: [{ name: 'Technique', score: 5 }, { name: 'Gestion d\'équipe', score: 4 }, { name: 'Projet', score: 5 }, { name: 'Innovation', score: 4 }], overallScore: 4.1, rating: 'exceeds', bonusAmount: 360000, bonusPercentage: 20, comments: 'Migration ERP réussie, excellent pilotage technique', employeeComments: 'Fière de l\'équipe', status: 'approved', createdAt: '2024-06-28T00:00:00Z', companyId: 'comp-1' },
  { id: 'perf-3', employeeId: 'emp-4', employeeName: 'Amélie Fouda', reviewerId: 'user-1', reviewerName: 'Martin Essomba', period: 'S1', year: 2024, objectives: [{ description: 'Conformité SYSCOHADA', weight: 40, score: 5 }, { description: 'Automatisation paie', weight: 30, score: 4 }, { description: 'Audit sans réserve', weight: 30, score: 5 }], competencies: [{ name: 'Rigueur', score: 5 }, { name: 'Analyse', score: 4 }, { name: 'Proactivité', score: 4 }], overallScore: 4.5, rating: 'exceptional', bonusAmount: 280000, bonusPercentage: 20, comments: 'Conformité irréprochable, audit sans réserve', employeeComments: 'Merci pour la reconnaissance', status: 'approved', createdAt: '2024-06-25T00:00:00Z', companyId: 'comp-1' },
  { id: 'perf-4', employeeId: 'emp-5', employeeName: 'Grace Abena', reviewerId: 'user-2', reviewerName: 'Sarah Nkolo', period: 'S1', year: 2024, objectives: [{ description: 'Campagne Q3', weight: 40, score: 3 }, { description: 'Nouveaux leads 200', weight: 30, score: 3 }, { description: 'Site web corporate', weight: 30, score: 5 }], competencies: [{ name: 'Créativité', score: 4 }, { name: 'Organisation', score: 3 }, { name: 'Résultats', score: 3 }], overallScore: 3.5, rating: 'meets', bonusAmount: 120000, bonusPercentage: 10, comments: 'Site web excellent, retard sur campagne Q3', employeeComments: 'Je vais améliorer la planification', status: 'reviewed', createdAt: '2024-06-20T00:00:00Z', companyId: 'comp-1' },
  { id: 'perf-5', employeeId: 'emp-7', employeeName: 'Ingrid Biya', reviewerId: 'user-2', reviewerName: 'Sarah Nkolo', period: 'S1', year: 2024, objectives: [{ description: 'Modules Finance ERP', weight: 40, score: 5 }, { description: 'Code review qualité', weight: 20, score: 4 }, { description: 'Mentorat junior', weight: 20, score: 4 }, { description: 'Innovation technique', weight: 20, score: 5 }], competencies: [{ name: 'Technique', score: 5 }, { name: 'Collaboration', score: 4 }, { name: 'Autonomie', score: 5 }], overallScore: 4.5, rating: 'exceptional', bonusAmount: 180000, bonusPercentage: 20, comments: 'Développeuse exceptionnelle, pilier technique', employeeComments: 'Super motivée pour S2', status: 'approved', createdAt: '2024-06-22T00:00:00Z', companyId: 'comp-1' },
];

// ============================================
// CLOSING ENTRIES (Year-end accounting)
// ============================================

export const seedClosingEntries: ClosingEntry[] = [
  { id: 'close-1', fiscalYear: 2024, step: 'inventaire', description: 'Inventaire physique des stocks et immobilisations', status: 'completed', automated: false, startedAt: '2024-12-15T00:00:00Z', completedAt: '2024-12-20T00:00:00Z', companyId: 'comp-1' },
  { id: 'close-2', fiscalYear: 2024, step: 'depreciation', description: 'Calcul et enregistrement des dotations aux amortissements', status: 'completed', automated: true, startedAt: '2024-12-21T00:00:00Z', completedAt: '2024-12-21T00:00:00Z', companyId: 'comp-1' },
  { id: 'close-3', fiscalYear: 2024, step: 'provisions', description: 'Constitution des provisions pour dépréciation et risques', status: 'completed', automated: true, startedAt: '2024-12-22T00:00:00Z', completedAt: '2024-12-22T00:00:00Z', companyId: 'comp-1' },
  { id: 'close-4', fiscalYear: 2024, step: 'regularisation', description: 'Écritures de régularisation (charges et produits constatés d\'avance)', status: 'completed', automated: true, startedAt: '2024-12-23T00:00:00Z', completedAt: '2024-12-23T00:00:00Z', companyId: 'comp-1' },
  { id: 'close-5', fiscalYear: 2024, step: 'balance', description: 'Vérification de l\'équilibre du bilan et du compte de résultat', status: 'completed', automated: true, startedAt: '2024-12-24T00:00:00Z', completedAt: '2024-12-24T00:00:00Z', companyId: 'comp-1' },
  { id: 'close-6', fiscalYear: 2024, step: 'resultat', description: 'Détermination du résultat et écriture de clôture', status: 'completed', automated: true, startedAt: '2024-12-25T00:00:00Z', completedAt: '2024-12-25T00:00:00Z', companyId: 'comp-1' },
  { id: 'close-7', fiscalYear: 2024, step: 'reouverture', description: 'Écriture de réouverture et report à nouveau', status: 'pending', automated: true, companyId: 'comp-1' },
  { id: 'close-8', fiscalYear: 2024, step: 'liasse', description: 'Édition de la liasse fiscale et déclarations', status: 'pending', automated: false, companyId: 'comp-1' },
];

// ============================================
// VIBE PROSPECTING SEED DATA
// ============================================

export const seedLeads: Lead[] = [
  { id: 'lead-1', fullName: 'Alain Mbekou', company: 'Bollore Logistics Cameroun', position: 'Directeur IT', email: 'a.mbekou@bollore.cm', phone: '+237 677 88 12 34', linkedinUrl: 'https://linkedin.com/in/alain-mbekou', industry: 'Logistique', country: 'Cameroun', city: 'Douala', source: 'social_media', status: 'qualified', score: 87, temperature: 'hot', signals: ['hiring_intent', 'tech_upgrade'], lastActivity: '2025-02-15T10:30:00Z', assignedTo: 'user-5', assignedToName: 'Grace Abena', notes: 'Cherche a moderniser son infrastructure reseau. Budget confirme pour Q2.', tags: ['fibre-optique', 'infrastructure', 'prioritaire'], estimatedValue: 45000000, currency: 'XAF', createdAt: '2025-01-10T00:00:00Z', companyId: 'comp-1' },
  { id: 'lead-2', fullName: 'Fatou Ndiaye', company: 'Ecobank Cameroun', position: 'Responsable Innovation Digitale', email: 'f.ndiaye@ecobank.cm', phone: '+237 699 45 67 89', linkedinUrl: 'https://linkedin.com/in/fatou-ndiaye', industry: 'Banque', country: 'Cameroun', city: 'Yaounde', source: 'signal_detection', status: 'proposal', score: 92, temperature: 'hot', signals: ['funding', 'competitor_switch', 'tech_upgrade'], lastActivity: '2025-02-20T14:15:00Z', assignedTo: 'user-1', assignedToName: 'Martin Essomba', notes: 'Projet de transformation digitale. A recu un financement de 2M EUR.', tags: ['transformation-digitale', 'core-banking', 'prioritaire'], estimatedValue: 120000000, currency: 'XAF', createdAt: '2025-01-05T00:00:00Z', companyId: 'comp-1' },
  { id: 'lead-3', fullName: 'Pierre Kuate', company: 'SABC (Brasseries)', position: 'Chef de Projet Digital', email: 'p.kuate@sabc.cm', phone: '+237 677 23 45 67', industry: 'Agroalimentaire', country: 'Cameroun', city: 'Douala', source: 'website', status: 'contacted', score: 65, temperature: 'warm', signals: ['expansion'], lastActivity: '2025-02-18T09:00:00Z', assignedTo: 'user-5', assignedToName: 'Grace Abena', notes: 'Interesse par une solution de surveillance reseau pour ses usines.', tags: ['iot', 'surveillance'], estimatedValue: 25000000, currency: 'XAF', createdAt: '2025-01-20T00:00:00Z', companyId: 'comp-1' },
  { id: 'lead-4', fullName: 'Aissatou Diallo', company: 'Ministere des Transports', position: 'Secretaire General', email: 'a.diallo@transports.gov.cm', phone: '+237 222 34 56 78', industry: 'Administration Publique', country: 'Cameroun', city: 'Yaounde', source: 'event', status: 'new', score: 45, temperature: 'cold', signals: ['budget_announcement'], lastActivity: '2025-02-10T11:00:00Z', assignedTo: 'user-3', assignedToName: 'Jean-Pierre Moussa', notes: 'Budget 2025 alloue pour la digitalisation. Long cycle de decision.', tags: ['administration', 'tender'], estimatedValue: 85000000, currency: 'XAF', createdAt: '2025-02-01T00:00:00Z', companyId: 'comp-1' },
  { id: 'lead-5', fullName: 'Serge Bouli', company: 'MTN Cameroun', position: 'Directeur Infrastructure', email: 's.bouli@mtn.cm', phone: '+237 699 78 90 12', industry: 'Telecommunications', country: 'Cameroun', city: 'Douala', source: 'referral', status: 'negotiation', score: 78, temperature: 'hot', signals: ['tech_upgrade', 'hiring_intent'], lastActivity: '2025-02-22T16:45:00Z', assignedTo: 'user-2', assignedToName: 'Sarah Nkolo', notes: 'Partenariat potentiel pour le partage d\'infrastructure. En negociation avancee.', tags: ['partenariat', 'infrastructure'], estimatedValue: 180000000, currency: 'XAF', createdAt: '2024-12-15T00:00:00Z', companyId: 'comp-1' },
  { id: 'lead-6', fullName: 'Marie Claire Tchamba', company: 'TotalEnergies Cameroun', position: 'Responsable IT Regional', email: 'mc.tchamba@totalenergies.cm', phone: '+237 677 56 78 90', industry: 'Energie', country: 'Cameroun', city: 'Douala', source: 'scraping', status: 'nurturing', score: 55, temperature: 'warm', signals: ['regulatory_change'], lastActivity: '2025-02-12T08:30:00Z', assignedTo: 'user-5', assignedToName: 'Grace Abena', notes: 'Nouvelles reglementations sur la securite des donnees. A sensibiliser.', tags: ['securite', 'conformite'], estimatedValue: 60000000, currency: 'XAF', createdAt: '2025-01-15T00:00:00Z', companyId: 'comp-1' },
  { id: 'lead-7', fullName: 'Kossi Mensah', company: 'Societe Generale Cameroun', position: 'DSI', email: 'k.mensah@sgc.cm', phone: '+237 699 34 56 78', industry: 'Banque', country: 'Cameroun', city: 'Douala', source: 'social_media', status: 'qualified', score: 81, temperature: 'hot', signals: ['tech_upgrade', 'pain_point'], lastActivity: '2025-02-21T13:20:00Z', assignedTo: 'user-1', assignedToName: 'Martin Essomba', notes: 'Insatisfait de son fournisseur actuel de connectivite. Cherche alternative.', tags: ['connectivite', 'switch'], estimatedValue: 95000000, currency: 'XAF', createdAt: '2025-01-08T00:00:00Z', companyId: 'comp-1' },
  { id: 'lead-8', fullName: 'Yvonne Eboa', company: 'Orange Cameroun', position: 'Manager Innovation', email: 'y.eboa@orange.cm', phone: '+237 677 90 12 34', industry: 'Telecommunications', country: 'Cameroun', city: 'Douala', source: 'signal_detection', status: 'contacted', score: 70, temperature: 'warm', signals: ['expansion', 'funding'], lastActivity: '2025-02-19T10:00:00Z', assignedTo: 'user-2', assignedToName: 'Sarah Nkolo', notes: 'Projet d\'expansion en zone rurale. Besoin de partenariat pour la fibre.', tags: ['expansion', 'zone-rurale', 'fibre'], estimatedValue: 200000000, currency: 'XAF', createdAt: '2025-01-25T00:00:00Z', companyId: 'comp-1' },
  { id: 'lead-9', fullName: 'Jean Baptiste Amougou', company: 'CIMENCAM', position: 'Directeur des Operations', email: 'jb.amougou@cimencam.cm', phone: '+237 699 12 34 56', industry: 'Industrie', country: 'Cameroun', city: 'Douala', source: 'scraping', status: 'new', score: 38, temperature: 'cold', signals: ['pain_point'], lastActivity: '2025-02-14T15:00:00Z', assignedTo: 'user-5', assignedToName: 'Grace Abena', notes: 'Problemes de connectivite sur ses sites de production. Lead a qualifier.', tags: ['connectivite', 'industrie'], estimatedValue: 35000000, currency: 'XAF', createdAt: '2025-02-05T00:00:00Z', companyId: 'comp-1' },
  { id: 'lead-10', fullName: 'Chantal Kome', company: 'CAMTEL', position: 'Directrice Technique', email: 'c.kome@camtel.cm', phone: '+237 222 56 78 90', industry: 'Telecommunications', country: 'Cameroun', city: 'Yaounde', source: 'event', status: 'proposal', score: 85, temperature: 'hot', signals: ['hiring_intent', 'tech_upgrade', 'regulatory_change'], lastActivity: '2025-02-23T09:30:00Z', assignedTo: 'user-1', assignedToName: 'Martin Essomba', notes: 'Appel d\'offres pour la modernisation du backbone national. Opportunite majeure.', tags: ['appel-offres', 'backbone', 'prioritaire'], estimatedValue: 350000000, currency: 'XAF', createdAt: '2024-11-20T00:00:00Z', companyId: 'comp-1' },
];

export const seedSignals: BuySignal[] = [
  { id: 'sig-1', leadId: 'lead-1', leadName: 'Alain Mbekou', company: 'Bollore Logistics Cameroun', type: 'hiring_intent', description: 'Bollore Logistics publie 5 offres d\'emploi en infrastructure reseau et cloud sur LinkedIn, indiquant une expansion IT imminente.', platform: 'linkedin', url: 'https://linkedin.com/jobs/bollore-logistics', confidence: 88, relevance: 92, dateDetected: '2025-02-20T08:00:00Z', isRead: false, isActioned: false, suggestedApproach: 'Contacter Alain Mbekou avec une proposition d\'audit reseau gratuit. Mentionner notre experience avec des clients logistiques similaires.', aiGeneratedMessage: 'Bonjour Alain,\n\nJ\'ai remarque que Bollore Logistics recrute activement dans l\'infrastructure reseau. C\'est un signe fort de transformation digitale. IDIBA Group a accompagne 3 leaders logistiques de la CEMAC dans des projets similaires.\n\nSeriez-vous ouvert a un echange de 15 minutes sur les defis de connectivite de vos entrepots ?\n\nCordialement,', tags: ['hiring', 'infrastructure', 'logistique'], companyId: 'comp-1' },
  { id: 'sig-2', leadId: 'lead-2', leadName: 'Fatou Ndiaye', company: 'Ecobank Cameroun', type: 'funding', description: 'Ecobank annonce un financement de 2M EUR pour la transformation digitale dans un communique de presse.', platform: 'news', url: 'https://ecobank.cm/press/2025', confidence: 95, relevance: 98, dateDetected: '2025-02-18T10:00:00Z', isRead: true, isActioned: true, suggestedApproach: 'Proposer une reunion avec le comite de direction.Preparer une etude de cas sur la digitalisation bancaire.', aiGeneratedMessage: 'Chere Fatou,\n\nFelicitations pour le financement de 2M EUR alloue a la transformation digitale. C\'est une opportunite exceptionnelle.\n\nIDIBA Group dispose d\'une expertise specifique dans le secteur bancaire avec des solutions core banking et connectivite securisee.\n\nPourrions-nous vous presenter notre approche lors d\'une reunion la semaine prochaine ?\n\nBien a vous,', tags: ['funding', 'banque', 'transformation-digitale'], companyId: 'comp-1' },
  { id: 'sig-3', leadId: 'lead-7', leadName: 'Kossi Mensah', company: 'Societe Generale Cameroun', type: 'competitor_switch', description: 'Kossi Mensah a commente negativement sur LinkedIn concernant son fournisseur actuel de connectivite, mentionnant des coupures frequentes.', platform: 'linkedin', url: 'https://linkedin.com/feed/kossi-mensah', confidence: 82, relevance: 90, dateDetected: '2025-02-21T14:30:00Z', isRead: false, isActioned: false, suggestedApproach: 'Approche discrete. Proposer un test de connectivite gratuit pendant 30 jours.', aiGeneratedMessage: 'Bonjour Kossi,\n\nJ\'ai lu votre retour d\'experience sur la connectivite entreprise. Ces coupures frequentes coutent cher en productivite.\n\nIDIBA Group propose un test gratuit de 30 jours de notre fibre dediee avec SLA garanti a 99.9%.\n\nSouhaitez-vous que nous organisions une demonstration sur votre site ?\n\nCordialement,', tags: ['switch', 'connectivite', 'insatisfaction'], companyId: 'comp-1' },
  { id: 'sig-4', leadId: 'lead-5', leadName: 'Serge Bouli', company: 'MTN Cameroun', type: 'tech_upgrade', description: 'MTN publie un RFP pour la modernisation de son backbone fibre optique inter-villes.', platform: 'job_board', url: 'https://mtn.cm/rfp-2025', confidence: 91, relevance: 95, dateDetected: '2025-02-19T09:00:00Z', isRead: true, isActioned: false, suggestedApproach: 'Repondre au RFP. Mobiliser l\'equipe technique pour une etude de faisabilite.', aiGeneratedMessage: '', tags: ['rfp', 'backbone', 'fibre'], companyId: 'comp-1' },
  { id: 'sig-5', company: 'Ministere des Finances', type: 'budget_announcement', description: 'Le budget 2025 du Ministere des Finances alloue 850M FCFA a la digitalisation des services fiscaux.', platform: 'news', url: 'https://minfi.gov.cm/budget-2025', confidence: 85, relevance: 80, dateDetected: '2025-02-10T12:00:00Z', isRead: false, isActioned: false, suggestedApproach: 'Preparation d\'une offre pour les appels d\'offres a venir. Suivre les portails de march publics.', aiGeneratedMessage: '', tags: ['budget', 'administration', 'tender'], companyId: 'comp-1' },
  { id: 'sig-6', leadId: 'lead-8', leadName: 'Yvonne Eboa', company: 'Orange Cameroun', type: 'expansion', description: 'Orange Cameroun annonce l\'expansion de sa couverture 4G dans 50 nouvelles localites rurales.', platform: 'twitter', url: 'https://twitter.com/OrangeCameroun', confidence: 78, relevance: 85, dateDetected: '2025-02-17T11:00:00Z', isRead: false, isActioned: false, suggestedApproach: 'Proposer un partenariat pour le partage d\'infrastructure fibre en zone rurale.', aiGeneratedMessage: 'Chere Yvonne,\n\nFelicitations pour l\'expansion de la couverture 4G en zones rurales. C\'est un projet ambitieux et noble.\n\nIDIBA Group dispose d\'une infrastructure fibre passive qui pourrait accelerer votre deploiement dans 12 localites.\n\nPourrions-nous explorer un partenariat gagnant-gagnant ?\n\nCordialement,', tags: ['expansion', 'zone-rurale', 'partenariat'], companyId: 'comp-1' },
  { id: 'sig-7', leadId: 'lead-10', leadName: 'Chantal Kome', company: 'CAMTEL', type: 'regulatory_change', description: 'L\'ART annonce de nouvelles normes de qualite de service pour les operateurs telecoms, entree en vigueur juillet 2025.', platform: 'news', url: 'https://art.cm/normes-2025', confidence: 93, relevance: 88, dateDetected: '2025-02-22T08:00:00Z', isRead: true, isActioned: false, suggestedApproach: 'Proposer une solution de monitoring et conformite aux nouvelles normes ART.', aiGeneratedMessage: '', tags: ['reglementation', 'conformite', 'ART'], companyId: 'comp-1' },
  { id: 'sig-8', leadId: 'lead-6', leadName: 'Marie Claire Tchamba', company: 'TotalEnergies Cameroun', type: 'pain_point', description: 'Marie Claire a pose une question sur un forum tech concernant les solutions de connectivite pour sites isoles petroliers.', platform: 'forum', url: 'https://forum.tech.cm/connectivite-sites-isoles', confidence: 75, relevance: 82, dateDetected: '2025-02-15T16:00:00Z', isRead: false, isActioned: false, suggestedApproach: 'Repondre sur le forum puis contacter en prive. Proposer une solution VSAT.', aiGeneratedMessage: 'Bonjour Marie Claire,\n\nJ\'ai vu votre question sur la connectivite pour sites isoles. IDIBA Group propose des solutions VSAT et 4G industrielle specialement conçues pour les environnements offshore et petroliers.\n\nNous equiperons deja 3 sites de TotalEnergie en Angola. Je serais ravie de partager notre retour d\'experience.\n\nBien cordialement,', tags: ['vsat', 'offshore', 'energie'], companyId: 'comp-1' },
];

export const seedTrends: SocialTrend[] = [
  { id: 'trend-1', topic: 'Fibre Optique en Afrique', category: 'Telecommunications', platform: 'linkedin', volumeScore: 92, growthRate: 34, sentiment: 'positive', relatedHashtags: ['#FibreOptique', '#AfriqueConnectee', '#DigitalAfrica', '#Telecoms'], topInfluencers: ['ITU Africa', 'Smart Africa', 'African Union'], audienceDemographics: [{ segment: 'Professionnels IT', percentage: 45 }, { segment: 'Decisionnaires', percentage: 30 }, { segment: 'Investisseurs', percentage: 25 }], geoHotspots: [{ city: 'Douala', country: 'Cameroun', intensity: 85 }, { city: 'Abidjan', country: 'Cote d\'Ivoire', intensity: 78 }, { city: 'Lagos', country: 'Nigeria', intensity: 92 }], dateDetected: '2025-02-01T00:00:00Z', isActive: true, suggestedContent: 'Publier une etude de cas sur le deploiement fibre de IDIBA Group a Douala avec des chiffres de performance.', companyId: 'comp-1' },
  { id: 'trend-2', topic: 'Transformation Digitale Banques', category: 'Fintech', platform: 'twitter', volumeScore: 78, growthRate: 22, sentiment: 'positive', relatedHashtags: ['#DigitalBanking', '#FintechAfrica', '#MobileMoney', '#CoreBanking'], topInfluencers: ['Ecobank Group', 'Orange Money', 'MTN MoMo'], audienceDemographics: [{ segment: 'Professionnels finance', percentage: 50 }, { segment: 'Jeunes 18-35', percentage: 35 }, { segment: 'Commerçants', percentage: 15 }], geoHotspots: [{ city: 'Douala', country: 'Cameroun', intensity: 72 }, { city: 'Accra', country: 'Ghana', intensity: 80 }, { city: 'Nairobi', country: 'Kenya', intensity: 88 }], dateDetected: '2025-02-10T00:00:00Z', isActive: true, suggestedContent: 'Infographie: Les 5 etapes cles d\'une transformation digitale reussie pour les banques de la CEMAC.', companyId: 'comp-1' },
  { id: 'trend-3', topic: 'Cybersecurite Entreprise', category: 'Securite', platform: 'linkedin', volumeScore: 85, growthRate: 45, sentiment: 'mixed', relatedHashtags: ['#Cybersecurity', '#DataProtection', '#CyberAfrica', '#GDPR'], topInfluencers: ['Cisco Africa', 'Palo Alto Networks', 'Check Point'], audienceDemographics: [{ segment: 'DSI/CISO', percentage: 55 }, { segment: 'Consultants', percentage: 30 }, { segment: 'Juristes', percentage: 15 }], geoHotspots: [{ city: 'Yaounde', country: 'Cameroun', intensity: 65 }, { city: 'Johannesburg', country: 'Afrique du Sud', intensity: 95 }, { city: 'Casablanca', country: 'Maroc', intensity: 70 }], dateDetected: '2025-02-05T00:00:00Z', isActive: true, suggestedContent: 'Webinaire: Cybersecurite en zone CEMAC - Nouvelles menaces et solutions adaptees.', companyId: 'comp-1' },
  { id: 'trend-4', topic: 'IoT Industriel', category: 'Technologie', platform: 'twitter', volumeScore: 68, growthRate: 28, sentiment: 'positive', relatedHashtags: ['#IIoT', '#SmartFactory', '#Industry40', '#IoTAfrica'], topInfluencers: ['Siemens Africa', 'Schneider Electric', 'Huawei'], audienceDemographics: [{ segment: 'Industriels', percentage: 40 }, { segment: 'Ingenieurs', percentage: 35 }, { segment: 'Investisseurs', percentage: 25 }], geoHotspots: [{ city: 'Douala', country: 'Cameroun', intensity: 60 }, { city: 'Port Harcourt', country: 'Nigeria', intensity: 75 }], dateDetected: '2025-01-28T00:00:00Z', isActive: true, suggestedContent: 'Article de blog: Comment l\'IoT revolutionne la surveillance des infrastructures critiques au Cameroun.', companyId: 'comp-1' },
  { id: 'trend-5', topic: 'Cloud Computing CEMAC', category: 'Cloud', platform: 'linkedin', volumeScore: 72, growthRate: 18, sentiment: 'positive', relatedHashtags: ['#CloudCEMAC', '#AWSAfrica', '#Azure', '#DataSovereignty'], topInfluencers: ['AWS Africa', 'Microsoft Africa', 'OVHcloud'], audienceDemographics: [{ segment: 'DSI', percentage: 50 }, { segment: 'Startups', percentage: 30 }, { segment: 'PME', percentage: 20 }], geoHotspots: [{ city: 'Douala', country: 'Cameroun', intensity: 70 }, { city: 'Libreville', country: 'Gabon', intensity: 55 }, { city: 'Brazzaville', country: 'Congo', intensity: 50 }], dateDetected: '2025-02-12T00:00:00Z', isActive: true, suggestedContent: 'Guide: Comment choisir entre cloud public, prive et hybride en zone CEMAC.', companyId: 'comp-1' },
  { id: 'trend-6', topic: '5G Deploiement', category: 'Telecommunications', platform: 'youtube', volumeScore: 95, growthRate: 52, sentiment: 'positive', relatedHashtags: ['#5GAfrica', '#5GCameroun', '#NextGenNetwork', '#SmartCity'], topInfluencers: ['Huawei Africa', 'Ericsson', 'Nokia'], audienceDemographics: [{ segment: 'Operateurs telecom', percentage: 40 }, { segment: 'Jeunes technophiles', percentage: 35 }, { segment: 'Gouvernements', percentage: 25 }], geoHotspots: [{ city: 'Douala', country: 'Cameroun', intensity: 80 }, { city: 'Cape Town', country: 'Afrique du Sud', intensity: 98 }, { city: 'Casablanca', country: 'Maroc', intensity: 90 }], dateDetected: '2025-01-15T00:00:00Z', isActive: true, suggestedContent: 'Video: IDIBA Group presente sa vision du deploiement 5G au Cameroun.', companyId: 'comp-1' },
];

export const seedCampaigns: OutreachCampaign[] = [
  { id: 'camp-1', name: 'Campagne Fibre Optique Q1 2025', status: 'running', channel: 'email', targetAudience: 'DSI secteur logistique et banque', leadsCount: 45, sentCount: 45, openedCount: 38, repliedCount: 12, positiveCount: 8, conversionRate: 17.8, template: 'email-fibre-optique-v2', aiPrompt: 'Rediger un email professionnel de 150 mots pour proposer une solution fibre optique dediee. Ton: professionnel et rassurant. Mentionner le SLA 99.9% et le support 24/7.', personalizationFields: ['nom', 'entreprise', 'secteur', 'ville'], scheduledAt: '2025-02-01T08:00:00Z', createdAt: '2025-01-25T00:00:00Z', createdBy: 'user-5', companyId: 'comp-1' },
  { id: 'camp-2', name: 'Relance Leads Chauds - Fevrier', status: 'completed', channel: 'linkedin', targetAudience: 'Leads qualifies score > 80', leadsCount: 15, sentCount: 15, openedCount: 14, repliedCount: 10, positiveCount: 7, conversionRate: 46.7, template: 'linkedin-relance-chaude', aiPrompt: 'Rediger un message LinkedIn concis (100 mots max) pour relancer un lead chaud. Ton: enthousiaste mais pas pressant. Proposer une demo de 20 minutes.', personalizationFields: ['nom', 'poste', 'entreprise', 'signal_detecte'], createdAt: '2025-02-10T00:00:00Z', createdBy: 'user-1', companyId: 'comp-1' },
  { id: 'camp-3', name: 'Nouveaux Signaux - Approche IA', status: 'running', channel: 'email', targetAudience: 'Leads avec signaux d\'achat detectes', leadsCount: 22, sentCount: 18, openedCount: 15, repliedCount: 6, positiveCount: 4, conversionRate: 22.2, template: 'email-signal-personnalise', aiPrompt: 'Rediger un email hyper-personnalise base sur le signal d\'achat detecte. Mentionner le signal specifique et proposer une solution adaptee. Ton: empathique et consultatif.', personalizationFields: ['nom', 'entreprise', 'signal', 'suggested_approach'], scheduledAt: '2025-02-20T09:00:00Z', createdAt: '2025-02-18T00:00:00Z', createdBy: 'user-5', companyId: 'comp-1' },
];

export const seedMessages: OutreachMessage[] = [
  { id: 'msg-1', campaignId: 'camp-1', leadId: 'lead-1', leadName: 'Alain Mbekou', channel: 'email', subject: 'Votre infrastructure reseau merite la meilleure connectivite', body: 'Bonjour Alain,\n\nJ\'ai remarque que Bollore Logistics recrute activement dans l\'infrastructure reseau. C\'est un signe fort de transformation digitale. IDIBA Group a accompagne 3 leaders logistiques de la CEMAC dans des projets similaires avec des resultats mesurables : reduction de 40% des coupures et augmentation de 60% de la bande passante.\n\nSeriez-vous ouvert a un echange de 15 minutes sur les defis de connectivite de vos entrepots ?\n\nCordialement,\nGrace Abena - IDIBA Group SARL', aiGenerated: true, aiPrompt: 'Email personnalise pour Bollore Logistics - signal hiring', tone: 'professional', personalizationScore: 92, status: 'replied', sentAt: '2025-02-15T09:00:00Z', replyContent: 'Bonjour Grace,\n\nMerci pour votre message. Je suis effectivement interesse. Pouvez-vous m\'envoyer une proposition technique detaillee ?\n\nAlain', createdAt: '2025-02-14T00:00:00Z', companyId: 'comp-1' },
  { id: 'msg-2', campaignId: 'camp-1', leadId: 'lead-7', leadName: 'Kossi Mensah', channel: 'email', subject: 'Solution alternative a vos problemes de connectivite', body: 'Bonjour Kossi,\n\nJ\'ai lu votre retour d\'experience sur la connectivite entreprise. Ces coupures frequentes coutent cher en productivite. IDIBA Group propose un test gratuit de 30 jours de notre fibre dediee avec SLA garanti a 99.9%.\n\nSouhaitez-vous que nous organisions une demonstration sur votre site ?\n\nCordialement,\nMartin Essomba - IDIBA Group SARL', aiGenerated: true, aiPrompt: 'Email personnalise pour SGC - signal competitor_switch', tone: 'empathetic', personalizationScore: 88, status: 'opened', sentAt: '2025-02-18T10:30:00Z', createdAt: '2025-02-17T00:00:00Z', companyId: 'comp-1' },
  { id: 'msg-3', campaignId: 'camp-2', leadId: 'lead-2', leadName: 'Fatou Ndiaye', channel: 'linkedin', subject: '', body: 'Chere Fatou,\n\nFelicitations pour le financement de 2M EUR alloue a la transformation digitale. C\'est une opportunite exceptionnelle pour Ecobank.\n\nIDIBA Group dispose d\'une expertise specifique dans le secteur bancaire avec des solutions core banking et connectivite securisee. Nous avons accompagne la BEAC dans sa migration numerique.\n\nPourrions-nous vous presenter notre approche lors d\'une reunion la semaine prochaine ?\n\nBien a vous,\nMartin Essomba', aiGenerated: true, aiPrompt: 'Message LinkedIn pour Ecobank - signal funding', tone: 'professional', personalizationScore: 95, status: 'replied', sentAt: '2025-02-12T14:00:00Z', replyContent: 'Bonjour Martin,\n\nMerci pour votre message. Je serais disponible mardi ou jeudi apres-midi.\n\nFatou', createdAt: '2025-02-11T00:00:00Z', companyId: 'comp-1' },
  { id: 'msg-4', leadId: 'lead-8', leadName: 'Yvonne Eboa', channel: 'email', subject: 'Partenariat pour votre expansion en zones rurales', body: 'Chere Yvonne,\n\nFelicitations pour l\'expansion de la couverture 4G en zones rurales. C\'est un projet ambitieux.\n\nIDIBA Group dispose d\'une infrastructure fibre passive qui pourrait accelerer votre deploiement dans 12 localites.\n\nPourrions-nous explorer un partenariat gagnant-gagnant ?\n\nCordialement,\nSarah Nkolo - CTO IDIBA Group', aiGenerated: true, aiPrompt: 'Email partenariat pour Orange - signal expansion', tone: 'enthusiastic', personalizationScore: 85, status: 'delivered', sentAt: '2025-02-19T08:00:00Z', createdAt: '2025-02-18T00:00:00Z', companyId: 'comp-1' },
  { id: 'msg-5', leadId: 'lead-6', leadName: 'Marie Claire Tchamba', channel: 'linkedin', subject: '', body: 'Bonjour Marie Claire,\n\nJ\'ai vu votre question sur la connectivite pour sites isoles. IDIBA Group propose des solutions VSAT et 4G industrielle specialement conçues pour les environnements offshore et petroliers.\n\nNous equiperons deja 3 sites de TotalEnergie en Angola. Je serais ravie de partager notre retour d\'experience.\n\nBien cordialement,\nGrace Abena', aiGenerated: true, aiPrompt: 'Message LinkedIn pour TotalEnergies - signal pain_point', tone: 'empathetic', personalizationScore: 90, status: 'draft', createdAt: '2025-02-22T00:00:00Z', companyId: 'comp-1' },
];
