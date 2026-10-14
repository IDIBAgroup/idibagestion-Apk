import type {
  Company, User, Role, Department, Project, Task,
  Invoice, AccountingEntry, ChartAccount, Asset,
  Ticket, Idea, CalendarEvent, Expense, Notification, Supplier,
  Employee, Candidate, Leave, PayrollItem, Client,
  PerformanceReview, ClosingEntry,
  Lead, BuySignal, SocialTrend, OutreachCampaign, OutreachMessage,
  Opportunity, TimeEntry, EmployeeContract, EmailTemplate, PortalTicket, AuditLogEntry, Meeting,
} from '@/types';

// ============================================
// IDIBA GROUP SARL - Agence Créative & Marketing
// Services: Conception graphique, Développement web/mobile,
// Marketing digital, Production audiovisuelle, Couverture événementielle
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
  primaryColor: '#1F7A63',
  secondaryColor: '#3B82F6',
  createdAt: '2019-06-15T00:00:00Z',
};

export const seedRoles: any[] = [
  { id: 'role-admin', name: 'Administrateur', description: 'Accès complet', permissions: ['*'], companyId: 'comp-1' },
  { id: 'role-manager', name: 'Manager', description: 'Gestion projets et équipes', permissions: ['projects.read', 'projects.write', 'finance.read', 'admin.read'], companyId: 'comp-1' },
  { id: 'role-creative', name: 'Créatif', description: 'Conception et production', permissions: ['projects.read', 'projects.write', 'innovation.*'], companyId: 'comp-1' },
  { id: 'role-developer', name: 'Développeur', description: 'Développement web et mobile', permissions: ['projects.read', 'projects.write', 'innovation.*'], companyId: 'comp-1' },
  { id: 'role-marketer', name: 'Marketer', description: 'Marketing digital et communication', permissions: ['projects.read', 'projects.write', 'marketing.*'], companyId: 'comp-1' },
  { id: 'role-accountant', name: 'Comptable', description: 'Gestion financière', permissions: ['finance.*', 'accounting.*', 'assets.*'], companyId: 'comp-1' },
  { id: 'role-employee', name: 'Employé', description: 'Accès standard', permissions: ['projects.read', 'tasks.write', 'innovation.*', 'support.*'], companyId: 'comp-1' },
];

export const seedDepartments: any[] = [
  { id: 'dept-1', name: 'Direction Générale', description: 'Direction stratégique et administrative', headName: 'Martin Essomba', employeeCount: 1, budget: 30000000, companyId: 'comp-1' },
  { id: 'dept-2', name: 'Conception Graphique', description: 'Design, branding, identité visuelle', headName: 'Grace Abena', employeeCount: 2, budget: 18000000, companyId: 'comp-1' },
  { id: 'dept-3', name: 'Développement Web & Mobile', description: 'Sites web, applications, solutions digitales', headName: 'Sarah Nkolo', employeeCount: 3, budget: 24000000, companyId: 'comp-1' },
  { id: 'dept-4', name: 'Marketing Digital', description: 'Stratégie digitale, réseaux sociaux, SEO/SEA', headName: 'Jean-Pierre Moussa', employeeCount: 2, budget: 15000000, companyId: 'comp-1' },
  { id: 'dept-5', name: 'Production Audiovisuelle', description: 'Vidéo, photo, motion design, montage', headName: 'Koffi Mensah', employeeCount: 2, budget: 20000000, companyId: 'comp-1' },
  { id: 'dept-6', name: 'Finance & Administration', description: 'Comptabilité, RH, juridique', headName: 'Amélie Fouda', employeeCount: 2, budget: 12000000, companyId: 'comp-1' },
];

export const seedUsers: any[] = [
  { uid: 'user-1', email: 'pdg@idibagroup.cm', displayName: 'Martin Essomba', roleId: 'role-admin', roleName: 'Administrateur', companyId: 'comp-1', departmentId: 'dept-1', status: 'active', createdAt: '2019-06-15T00:00:00Z', permissions: ['*'], avatar: undefined },
  { uid: 'user-2', email: 'dev@idibagroup.cm', displayName: 'Sarah Nkolo', roleId: 'role-manager', roleName: 'Manager', companyId: 'comp-1', departmentId: 'dept-3', status: 'active', createdAt: '2019-07-01T00:00:00Z', permissions: ['projects.read', 'projects.write', 'finance.read'], avatar: undefined },
  { uid: 'user-3', email: 'marketing@idibagroup.cm', displayName: 'Jean-Pierre Moussa', roleId: 'role-manager', roleName: 'Manager', companyId: 'comp-1', departmentId: 'dept-4', status: 'active', createdAt: '2020-01-10T00:00:00Z', permissions: ['projects.read', 'projects.write', 'finance.read'], avatar: undefined },
  { uid: 'user-4', email: 'compta@idibagroup.cm', displayName: 'Amélie Fouda', roleId: 'role-accountant', roleName: 'Comptable', companyId: 'comp-1', departmentId: 'dept-6', status: 'active', createdAt: '2020-02-15T00:00:00Z', permissions: ['finance.*', 'accounting.*'], avatar: undefined },
  { uid: 'user-5', email: 'design@idibagroup.cm', displayName: 'Grace Abena', roleId: 'role-creative', roleName: 'Créatif', companyId: 'comp-1', departmentId: 'dept-2', status: 'active', createdAt: '2020-03-01T00:00:00Z', permissions: ['projects.read', 'tasks.write', 'innovation.*'], avatar: undefined },
  { uid: 'user-6', email: 'video@idibagroup.cm', displayName: 'Koffi Mensah', roleId: 'role-creative', roleName: 'Créatif', companyId: 'comp-1', departmentId: 'dept-5', status: 'active', createdAt: '2020-04-01T00:00:00Z', permissions: ['projects.read', 'tasks.write', 'innovation.*'], avatar: undefined },
  { uid: 'user-7', email: 'frontend@idibagroup.cm', displayName: 'Ingrid Biya', roleId: 'role-developer', roleName: 'Développeur', companyId: 'comp-1', departmentId: 'dept-3', status: 'active', createdAt: '2021-01-15T00:00:00Z', permissions: ['projects.read', 'tasks.write', 'innovation.*'], avatar: undefined },
  { uid: 'user-8', email: 'backend@idibagroup.cm', displayName: 'Paul Tchuente', roleId: 'role-developer', roleName: 'Développeur', companyId: 'comp-1', departmentId: 'dept-3', status: 'pending', createdAt: '2023-06-01T00:00:00Z', permissions: ['projects.read', 'tasks.write', 'innovation.*'], avatar: undefined },
];

// ============================================
// PROJECTS - Créatifs et Marketing
// ============================================

export const seedProjects: any[] = [
  { id: 'proj-1', name: 'Refonte Site E-commerce La Maison du Cacao', description: 'Conception et développement d\'un site e-commerce complet avec paiement mobile money', status: 'in_progress', companyId: 'comp-1', budget: 8500000, spent: 4200000, progress: 52, startDate: '2024-03-01', endDate: '2024-08-30', members: ['user-2', 'user-7', 'user-8'], createdAt: '2024-03-01T00:00:00Z' },
  { id: 'proj-2', name: 'Campagne Marketing Digitale SGBC', description: 'Stratégie digitale complète : réseaux sociaux, Google Ads, content marketing', status: 'in_progress', companyId: 'comp-1', budget: 15000000, spent: 7800000, progress: 68, startDate: '2024-02-15', endDate: '2024-09-15', members: ['user-3', 'user-5'], createdAt: '2024-02-15T00:00:00Z' },
  { id: 'proj-3', name: 'Branding Complet Société Générale Cameroun', description: 'Identité visuelle, logo, charte graphique, supports print et digitaux', status: 'in_progress', companyId: 'comp-1', budget: 12000000, spent: 3600000, progress: 30, startDate: '2024-05-01', endDate: '2024-10-31', members: ['user-5', 'user-3'], createdAt: '2024-05-01T00:00:00Z' },
  { id: 'proj-4', name: 'Application Mobile MTN MoMo Marchands', description: 'Développement d\'une app mobile pour les marchands MTN MoMo', status: 'todo', companyId: 'comp-1', budget: 18000000, spent: 0, progress: 0, startDate: '2024-07-15', endDate: '2024-12-31', members: ['user-2', 'user-7'], createdAt: '2024-07-01T00:00:00Z' },
  { id: 'proj-5', name: 'Couverture Événementielle Sommet CEMAC 2024', description: 'Production audiovisuelle complète : teaser, live streaming, reportage', status: 'in_progress', companyId: 'comp-1', budget: 25000000, spent: 5200000, progress: 22, startDate: '2024-06-01', endDate: '2024-11-15', members: ['user-6', 'user-1'], createdAt: '2024-06-01T00:00:00Z' },
  { id: 'proj-6', name: 'Série Documentaire Tech en Afrique', description: 'Production de 6 épisodes sur l\'écosystème tech en Afrique centrale', status: 'in_progress', companyId: 'comp-1', budget: 35000000, spent: 8750000, progress: 25, startDate: '2024-04-01', endDate: '2025-03-31', members: ['user-6', 'user-5'], createdAt: '2024-04-01T00:00:00Z' },
  { id: 'proj-7', name: 'Plateforme E-learning Université de Douala', description: 'Conception et développement d\'une plateforme de cours en ligne', status: 'todo', companyId: 'comp-1', budget: 22000000, spent: 0, progress: 0, startDate: '2024-08-01', endDate: '2025-02-28', members: ['user-2', 'user-7', 'user-8'], createdAt: '2024-07-15T00:00:00Z' },
  { id: 'proj-8', name: 'Lancement Produit Nestlé Chocolatier', description: 'Stratégie de lancement : packaging, campagne digitale, événement presse', status: 'done', companyId: 'comp-1', budget: 9500000, spent: 9200000, progress: 100, startDate: '2024-01-15', endDate: '2024-05-30', members: ['user-3', 'user-5', 'user-6'], createdAt: '2024-01-15T00:00:00Z' },
];

export const seedTasks: any[] = [
  // Projet 1: Refonte E-commerce
  { id: 'task-1', projectId: 'proj-1', title: 'Maquettes UI/UX', description: 'Conception des maquettes haute fidélité pour toutes les pages', assignedTo: 'user-5', assignedToName: 'Grace Abena', status: 'done', priority: 'high', dueDate: '2024-04-15', subtasks: [{ title: 'Page d\'accueil', completed: true }, { title: 'Page produit', completed: true }, { title: 'Panier & Checkout', completed: true }], createdAt: '2024-03-05T00:00:00Z' },
  { id: 'task-2', projectId: 'proj-1', title: 'Développement Frontend React', description: 'Intégration des maquettes en React + Tailwind', assignedTo: 'user-7', assignedToName: 'Ingrid Biya', status: 'in_progress', priority: 'high', dueDate: '2024-07-15', subtasks: [{ title: 'Composants communs', completed: true }, { title: 'Pages boutique', completed: false }, { title: 'Intégration API', completed: false }], createdAt: '2024-03-10T00:00:00Z' },
  { id: 'task-3', projectId: 'proj-1', title: 'Backend API & Paiement', description: 'API REST, intégration MTN MoMo et Orange Money', assignedTo: 'user-8', assignedToName: 'Paul Tchuente', status: 'in_progress', priority: 'high', dueDate: '2024-07-30', subtasks: [{ title: 'Modèles de données', completed: true }, { title: 'API auth & produits', completed: true }, { title: 'Intégration paiement', completed: false }], createdAt: '2024-03-15T00:00:00Z' },
  { id: 'task-4', projectId: 'proj-1', title: 'Tests & Déploiement', description: 'Tests utilisateurs, optimisation, mise en production', assignedTo: 'user-2', assignedToName: 'Sarah Nkolo', status: 'todo', priority: 'medium', dueDate: '2024-08-20', subtasks: [], createdAt: '2024-04-01T00:00:00Z' },

  // Projet 2: Campagne SGBC
  { id: 'task-5', projectId: 'proj-2', title: 'Stratégie digitale & Calendrier éditorial', description: 'Définition des personas, plan de contenu Q2-Q3', assignedTo: 'user-3', assignedToName: 'Jean-Pierre Moussa', status: 'done', priority: 'high', dueDate: '2024-03-15', subtasks: [{ title: 'Analyse concurrentielle', completed: true }, { title: 'Personas', completed: true }, { title: 'Calendrier éditorial', completed: true }], createdAt: '2024-02-20T00:00:00Z' },
  { id: 'task-6', projectId: 'proj-2', title: 'Visuels réseaux sociaux', description: 'Création de 30 visuels pour Facebook, Instagram, LinkedIn', assignedTo: 'user-5', assignedToName: 'Grace Abena', status: 'in_progress', priority: 'high', dueDate: '2024-07-10', subtasks: [{ title: 'Posts Facebook (10)', completed: true }, { title: 'Stories Instagram (10)', completed: false }, { title: 'Posts LinkedIn (10)', completed: false }], createdAt: '2024-03-01T00:00:00Z' },
  { id: 'task-7', projectId: 'proj-2', title: 'Campagne Google Ads', description: 'Création et gestion des campagnes Search & Display', assignedTo: 'user-3', assignedToName: 'Jean-Pierre Moussa', status: 'in_progress', priority: 'medium', dueDate: '2024-08-15', subtasks: [{ title: 'Mots-clés & landing pages', completed: true }, { title: 'Campagnes Search', completed: false }, { title: 'Remarketing Display', completed: false }], createdAt: '2024-03-15T00:00:00Z' },

  // Projet 3: Branding SG
  { id: 'task-8', projectId: 'proj-3', title: 'Création logo & identité visuelle', description: 'Propositions de logo, palette couleurs, typographies', assignedTo: 'user-5', assignedToName: 'Grace Abena', status: 'in_progress', priority: 'high', dueDate: '2024-06-30', subtasks: [{ title: 'Moodboard & recherche', completed: true }, { title: '3 propositions logo', completed: true }, { title: 'Validation client', completed: false }], createdAt: '2024-05-05T00:00:00Z' },
  { id: 'task-9', projectId: 'proj-3', title: 'Charte graphique', description: 'Document complet de charte graphique (50+ pages)', assignedTo: 'user-5', assignedToName: 'Grace Abena', status: 'todo', priority: 'medium', dueDate: '2024-08-30', subtasks: [], createdAt: '2024-05-10T00:00:00Z' },

  // Projet 5: Couverture Sommet CEMAC
  { id: 'task-10', projectId: 'proj-5', title: 'Teaser promotionnel', description: 'Vidéo teaser 60s pour les réseaux sociaux', assignedTo: 'user-6', assignedToName: 'Koffi Mensah', status: 'done', priority: 'high', dueDate: '2024-06-30', subtasks: [{ title: 'Script & storyboard', completed: true }, { title: 'Tournage', completed: true }, { title: 'Montage & motion', completed: true }], createdAt: '2024-06-05T00:00:00Z' },
  { id: 'task-11', projectId: 'proj-5', title: 'Setup live streaming', description: 'Installation multi-caméras, encodage, diffusion live', assignedTo: 'user-6', assignedToName: 'Koffi Mensah', status: 'todo', priority: 'critical', dueDate: '2024-11-01', subtasks: [{ title: 'Recce technique', completed: true }, { title: 'Matériel', completed: false }, { title: 'Tests stream', completed: false }], createdAt: '2024-06-10T00:00:00Z' },
];

// ============================================
// INVOICES - Services créatifs & marketing
// ============================================

export const seedInvoices: any[] = [
  { id: 'inv-1', number: 'FAC-2024-00156', clientName: 'Société Générale Cameroun', clientEmail: 'compta@sgc.cm', date: '2024-06-01', dueDate: '2024-07-01', amount: 8500000, tax: 1636250, total: 10136250, status: 'paid', companyId: 'comp-1', items: [{ description: 'Conception identité visuelle & charte graphique', quantity: 1, unitPrice: 5000000, tax: 962500, total: 5962500 }, { description: 'Supports print: flyers, affiches, roll-up (x50)', quantity: 1, unitPrice: 3500000, tax: 673750, total: 4173750 }], notes: 'Phase 1 branding', createdAt: '2024-06-01T00:00:00Z' },
  { id: 'inv-2', number: 'FAC-2024-00157', clientName: 'MTN Cameroun', clientEmail: 'marketing@mtn.cm', date: '2024-06-10', dueDate: '2024-07-10', amount: 15000000, tax: 2887500, total: 17887500, status: 'pending', companyId: 'comp-1', items: [{ description: 'Campagne marketing digitale Q2 2024', quantity: 1, unitPrice: 8000000, tax: 1540000, total: 9540000 }, { description: 'Production vidéo publicitaire (3 spots)', quantity: 1, unitPrice: 7000000, tax: 1347500, total: 8347500 }], notes: '', createdAt: '2024-06-10T00:00:00Z' },
  { id: 'inv-3', number: 'FAC-2024-00158', clientName: 'Nestlé Cameroun', clientEmail: 'marketing@nestle.cm', date: '2024-05-15', dueDate: '2024-06-15', amount: 9500000, tax: 1828750, total: 11328750, status: 'paid', companyId: 'comp-1', items: [{ description: 'Stratégie de lancement produit & packaging', quantity: 1, unitPrice: 4500000, tax: 866250, total: 5366250 }, { description: 'Couverture événementielle presse & aftermovie', quantity: 1, unitPrice: 5000000, tax: 962500, total: 5962500 }], notes: '', createdAt: '2024-05-15T00:00:00Z' },
  { id: 'inv-4', number: 'FAC-2024-00159', clientName: 'Université de Douala', clientEmail: 'admin@univ-douala.cm', date: '2024-06-18', dueDate: '2024-07-18', amount: 5200000, tax: 1001000, total: 6201000, status: 'pending', companyId: 'comp-1', items: [{ description: 'Conception UI/UX plateforme e-learning', quantity: 1, unitPrice: 3200000, tax: 616000, total: 3816000 }, { description: 'Motion design vidéos pédagogiques (x5)', quantity: 1, unitPrice: 2000000, tax: 385000, total: 2385000 }], notes: '', createdAt: '2024-06-18T00:00:00Z' },
  { id: 'inv-5', number: 'FAC-2024-00160', clientName: 'Chanas Assurances', clientEmail: 'com@chanas.cm', date: '2024-06-25', dueDate: '2024-07-25', amount: 3800000, tax: 731500, total: 4531500, status: 'draft', companyId: 'comp-1', items: [{ description: 'Refonte site web vitrine', quantity: 1, unitPrice: 2500000, tax: 481250, total: 2981250 }, { description: 'Photos corporate & portraits dirigeants', quantity: 1, unitPrice: 1300000, tax: 250250, total: 1550250 }], notes: 'En attente validation devis', createdAt: '2024-06-25T00:00:00Z' },
  { id: 'inv-6', number: 'FAC-2024-00161', clientName: 'BOLOLO', clientEmail: 'contact@bololo.cm', date: '2024-06-28', dueDate: '2024-07-28', amount: 6200000, tax: 1193500, total: 7393500, status: 'pending', companyId: 'comp-1', items: [{ description: 'Application mobile iOS & Android', quantity: 1, unitPrice: 6200000, tax: 1193500, total: 7393500 }], notes: 'Milestone 1: maquettes validées', createdAt: '2024-06-28T00:00:00Z' },
];

// ============================================
// ACCOUNTING ENTRIES
// ============================================

export const seedAccountingEntries: any[] = [
  { id: 'ae-1', date: '2024-06-01', journal: 'VEN', pieceNumber: 'VEN-240601-001', accountCode: '701', accountLabel: 'Prestations de services', label: 'Branding Société Générale - Phase 1', debit: 0, credit: 8500000, companyId: 'comp-1' },
  { id: 'ae-2', date: '2024-06-01', journal: 'VEN', pieceNumber: 'VEN-240601-001', accountCode: '4431', accountLabel: 'TVA collectée', label: 'TVA 19.25% branding SG', debit: 0, credit: 1636250, companyId: 'comp-1' },
  { id: 'ae-3', date: '2024-06-01', journal: 'VEN', pieceNumber: 'VEN-240601-001', accountCode: '411', accountLabel: 'Clients', label: 'Facture FAC-2024-00156 SGC', debit: 10136250, credit: 0, companyId: 'comp-1' },
  { id: 'ae-4', date: '2024-06-10', journal: 'VEN', pieceNumber: 'VEN-240610-001', accountCode: '701', accountLabel: 'Prestations de services', label: 'Campagne digitale MTN Q2', debit: 0, credit: 15000000, companyId: 'comp-1' },
  { id: 'ae-5', date: '2024-06-10', journal: 'VEN', pieceNumber: 'VEN-240610-001', accountCode: '4431', accountLabel: 'TVA collectée', label: 'TVA 19.25% campagne MTN', debit: 0, credit: 2887500, companyId: 'comp-1' },
  { id: 'ae-6', date: '2024-06-10', journal: 'VEN', pieceNumber: 'VEN-240610-001', accountCode: '411', accountLabel: 'Clients', label: 'Facture FAC-2024-00157 MTN', debit: 17887500, credit: 0, companyId: 'comp-1' },
  { id: 'ae-7', date: '2024-06-15', journal: 'ACH', pieceNumber: 'ACH-240615-001', accountCode: '604', accountLabel: 'Achats fournitures', label: 'Achat papier couché & encres impression', debit: 850000, credit: 0, companyId: 'comp-1' },
  { id: 'ae-8', date: '2024-06-15', journal: 'ACH', pieceNumber: 'ACH-240615-001', accountCode: '4452', accountLabel: 'TVA récupérable', label: 'TVA 19.25% achats fournitures', debit: 163625, credit: 0, companyId: 'comp-1' },
  { id: 'ae-9', date: '2024-06-15', journal: 'ACH', pieceNumber: 'ACH-240615-001', accountCode: '401', accountLabel: 'Fournisseurs', label: 'Fournisseur Imprimerie Centrale', debit: 0, credit: 1013625, companyId: 'comp-1' },
  { id: 'ae-10', date: '2024-06-20', journal: 'BNQ', pieceNumber: 'BNQ-240620-001', accountCode: '512', accountLabel: 'Banque', label: 'Encaissement SGC FAC-00156', debit: 10136250, credit: 0, companyId: 'comp-1' },
  { id: 'ae-11', date: '2024-06-20', journal: 'BNQ', pieceNumber: 'BNQ-240620-001', accountCode: '411', accountLabel: 'Clients', label: 'Règlement SGC', debit: 0, credit: 10136250, companyId: 'comp-1' },
  { id: 'ae-12', date: '2024-06-25', journal: 'OD', pieceNumber: 'OD-240625-001', accountCode: '681', accountLabel: 'Dotations aux amortissements', label: 'Amortissement matériel audiovisuel Juin', debit: 485000, credit: 0, companyId: 'comp-1' },
  { id: 'ae-13', date: '2024-06-25', journal: 'OD', pieceNumber: 'OD-240625-001', accountCode: '2815', accountLabel: 'Amortissement matériel', label: 'Amortissement mensuel', debit: 0, credit: 485000, companyId: 'comp-1' },
  { id: 'ae-14', date: '2024-06-28', journal: 'ACH', pieceNumber: 'ACH-240628-001', accountCode: '613', accountLabel: 'Locations et charges locatives', label: 'Loyer bureau Rue Joffre Juin', debit: 2500000, credit: 0, companyId: 'comp-1' },
  { id: 'ae-15', date: '2024-06-28', journal: 'BNQ', pieceNumber: 'BNQ-240628-001', accountCode: '421', accountLabel: 'Personnel - rémunérations', label: 'Salaires Juin 2024', debit: 10150000, credit: 0, companyId: 'comp-1' },
];

// ============================================
// CHART ACCOUNTS - SYSCOHADA
// ============================================

export const seedChartAccounts: any[] = [
  { id: 'ca-1', code: '101', label: 'Capital social', type: 'Capitaux', balance: 50000000, companyId: 'comp-1' },
  { id: 'ca-2', code: '121', label: 'Résultat reporté', type: 'Capitaux', balance: 18500000, companyId: 'comp-1' },
  { id: 'ca-3', code: '211', label: 'Terrains', type: 'Immobilisations', balance: 0, companyId: 'comp-1' },
  { id: 'ca-4', code: '215', label: 'Matériel audiovisuel', type: 'Immobilisations', balance: 28500000, companyId: 'comp-1' },
  { id: 'ca-5', code: '218', label: 'Matériel informatique', type: 'Immobilisations', balance: 12500000, companyId: 'comp-1' },
  { id: 'ca-6', code: '244', label: 'Logiciels & licences', type: 'Immobilisations', balance: 4800000, companyId: 'comp-1' },
  { id: 'ca-7', code: '2815', label: 'Amortissement matériel', type: 'Amortissements', balance: -4850000, companyId: 'comp-1' },
  { id: 'ca-8', code: '311', label: 'Fournitures & consommables', type: 'Stocks', balance: 1250000, companyId: 'comp-1' },
  { id: 'ca-9', code: '401', label: 'Fournisseurs', type: 'Dettes', balance: -3850000, companyId: 'comp-1' },
  { id: 'ca-10', code: '411', label: 'Clients', type: 'Créances', balance: 22177500, companyId: 'comp-1' },
  { id: 'ca-11', code: '421', label: 'Personnel - rémunérations', type: 'Dettes', balance: -10150000, companyId: 'comp-1' },
  { id: 'ca-12', code: '431', label: 'Sécurité sociale (CNPS)', type: 'Dettes', balance: -1421000, companyId: 'comp-1' },
  { id: 'ca-13', code: '442', label: 'État - impôts & taxes', type: 'Dettes', balance: -2887500, companyId: 'comp-1' },
  { id: 'ca-14', code: '4431', label: 'TVA collectée', type: 'Dettes', balance: -4523750, companyId: 'comp-1' },
  { id: 'ca-15', code: '4452', label: 'TVA récupérable', type: 'Créances', balance: 485000, companyId: 'comp-1' },
  { id: 'ca-16', code: '512', label: 'Banque', type: 'Trésorerie', balance: 28500000, companyId: 'comp-1' },
  { id: 'ca-17', code: '521', label: 'Caisse', type: 'Trésorerie', balance: 850000, companyId: 'comp-1' },
  { id: 'ca-18', code: '601', label: 'Achats marchandises', type: 'Charges', balance: 850000, companyId: 'comp-1' },
  { id: 'ca-19', code: '604', label: 'Achats fournitures', type: 'Charges', balance: 1250000, companyId: 'comp-1' },
  { id: 'ca-20', code: '611', label: 'Sous-traitance', type: 'Charges', balance: 3200000, companyId: 'comp-1' },
  { id: 'ca-21', code: '613', label: 'Locations & charges locatives', type: 'Charges', balance: 15000000, companyId: 'comp-1' },
  { id: 'ca-22', code: '622', label: 'Rémunérations d\'intermédiaires', type: 'Charges', balance: 2500000, companyId: 'comp-1' },
  { id: 'ca-23', code: '624', label: 'Transports de biens', type: 'Charges', balance: 850000, companyId: 'comp-1' },
  { id: 'ca-24', code: '626', label: 'Frais postaux & télécoms', type: 'Charges', balance: 485000, companyId: 'comp-1' },
  { id: 'ca-25', code: '631', label: 'Frais bancaires', type: 'Charges', balance: 125000, companyId: 'comp-1' },
  { id: 'ca-26', code: '641', label: 'Rémunérations du personnel', type: 'Charges', balance: 10150000, companyId: 'comp-1' },
  { id: 'ca-27', code: '645', label: 'Charges sociales (CNPS)', type: 'Charges', balance: 1421000, companyId: 'comp-1' },
  { id: 'ca-28', code: '661', label: 'Charges d\'intérêts', type: 'Charges', balance: 0, companyId: 'comp-1' },
  { id: 'ca-29', code: '681', label: 'Dotations aux amortissements', type: 'Charges', balance: 4850000, companyId: 'comp-1' },
  { id: 'ca-30', code: '701', label: 'Prestations de services', type: 'Produits', balance: -48500000, companyId: 'comp-1' },
];

// ============================================
// ASSETS - Équipements créatifs
// ============================================

export const seedAssets: any[] = [
  { id: 'asset-1', name: 'Sony FX6 Cinema Line', category: 'Vidéo', serialNumber: 'SN-SONY-FX6-001', description: 'Caméra cinéma full-frame 4K pour production audiovisuelle', acquisitionDate: '2023-01-15', value: 3850000, depreciation: 1155000, netValue: 2695000, location: 'Studio IDIBA - Salle de tournage', status: 'active', companyId: 'comp-1' },
  { id: 'asset-2', name: 'Mac Studio M2 Ultra', category: 'Informatique', serialNumber: 'SN-MAC-STU-002', description: 'Station montage vidéo & motion design', acquisitionDate: '2023-06-20', value: 2800000, depreciation: 420000, netValue: 2380000, location: 'Studio IDIBA - Post-production', status: 'active', companyId: 'comp-1' },
  { id: 'asset-3', name: 'Canon EOS R5 + RF 24-70mm', category: 'Photo', serialNumber: 'SN-CAN-R5-003', description: 'Appareil photo hybride professionnel pour shootings', acquisitionDate: '2023-03-10', value: 2200000, depreciation: 440000, netValue: 1760000, location: 'Studio IDIBA - Salle photo', status: 'active', companyId: 'comp-1' },
  { id: 'asset-4', name: 'Drone DJI Inspire 3', category: 'Vidéo', serialNumber: 'SN-DJI-INS3-004', description: 'Drone professionnel 8K pour prises de vue aériennes', acquisitionDate: '2024-01-10', value: 8500000, depreciation: 850000, netValue: 7650000, location: 'Studio IDIBA - Stock', status: 'active', companyId: 'comp-1' },
  { id: 'asset-5', name: 'iMac 27" Retina 5K (x4)', category: 'Informatique', serialNumber: 'SN-IMAC-27-005', description: 'Postes de travail design & développement', acquisitionDate: '2023-09-01', value: 4800000, depreciation: 720000, netValue: 4080000, location: 'Open Space - Équipe Créative', status: 'active', companyId: 'comp-1' },
  { id: 'asset-6', name: 'Eclairage Aputure 600D Pro (x3)', category: 'Vidéo', serialNumber: 'SN-APT-600D-006', description: 'Éclairage LED professionnel pour tournage studio', acquisitionDate: '2023-05-15', value: 1950000, depreciation: 390000, netValue: 1560000, location: 'Studio IDIBA - Salle de tournage', status: 'active', companyId: 'comp-1' },
  { id: 'asset-7', name: 'Adobe Creative Cloud (licences x10)', category: 'Logiciel', serialNumber: 'LIC-ADOBE-007', description: 'Suite créative complète (Photoshop, Illustrator, Premiere, After Effects)', acquisitionDate: '2023-01-01', value: 4800000, depreciation: 2400000, netValue: 2400000, location: 'Cloud', status: 'active', companyId: 'comp-1' },
  { id: 'asset-8', name: 'Tablette graphique Wacom Cintiq 24', category: 'Informatique', serialNumber: 'SN-WAC-C24-008', description: 'Tablette graphique professionnelle pour illustration', acquisitionDate: '2023-08-20', value: 1500000, depreciation: 225000, netValue: 1275000, location: 'Studio IDIBA - Design', status: 'active', companyId: 'comp-1' },
  { id: 'asset-9', name: 'Sonosite Micro-consoles (x2)', category: 'Audio', serialNumber: 'SN-SON-MIX-009', description: 'Console de mixage audio pour tournage', acquisitionDate: '2023-04-01', value: 1800000, depreciation: 360000, netValue: 1440000, location: 'Studio IDIBA - Audio', status: 'active', companyId: 'comp-1' },
  { id: 'asset-10', name: 'Server NAS Synology 48To', category: 'Informatique', serialNumber: 'SN-SYN-48T-010', description: 'Stockage réseau pour archives vidéo et projets', acquisitionDate: '2024-02-01', value: 3200000, depreciation: 320000, netValue: 2880000, location: 'Serveur - Local technique', status: 'active', companyId: 'comp-1' },
];

// ============================================
// TICKETS
// ============================================

export const seedTickets: any[] = [
  { id: 'ticket-1', subject: 'Ralentissements Mac Studio montage', description: 'Le Mac Studio de post-prod ralentit considérablement sur les exports 4K. Besoin d\'une optimisation urgente.', requesterId: 'user-6', requesterName: 'Koffi Mensah', category: 'Incident', priority: 'high', status: 'in_progress', assignedTo: 'user-2', assignedToName: 'Sarah Nkolo', createdAt: '2024-06-28T08:30:00Z', updatedAt: '2024-06-28T10:15:00Z', comments: [{ id: 'c1', authorId: 'user-2', authorName: 'Sarah Nkolo', content: 'Je regarde, probablement le cache de Premiere à vider.', createdAt: '2024-06-28T09:00:00Z', isInternal: false }, { id: 'c2', authorId: 'user-2', authorName: 'Sarah Nkolo', content: 'Cache vidé, ajout de RAM virtuelle. Monitoring en cours.', createdAt: '2024-06-28T10:15:00Z', isInternal: false }] },
  { id: 'ticket-2', subject: 'Demande de congés Juillet', description: 'Je souhaiterais prendre 2 semaines de congés du 15 au 28 juillet.', requesterId: 'user-7', requesterName: 'Ingrid Biya', category: 'Demande', priority: 'medium', status: 'open', assignedTo: 'user-3', assignedToName: 'Jean-Pierre Moussa', createdAt: '2024-06-27T14:00:00Z', updatedAt: '2024-06-27T14:00:00Z', comments: [] },
  { id: 'ticket-3', subject: 'Panne projecteur studio photo', description: 'Le projecteur principal du studio photo ne s\'allume plus. Shoot client prévu demain 9h.', requesterId: 'user-5', requesterName: 'Grace Abena', category: 'Incident', priority: 'critical', status: 'in_progress', assignedTo: 'user-6', assignedToName: 'Koffi Mensah', createdAt: '2024-06-28T06:00:00Z', updatedAt: '2024-06-28T11:00:00Z', comments: [{ id: 'c3', authorId: 'user-6', authorName: 'Koffi Mensah', content: 'Ampoule remplacée, tests de couleur en cours.', createdAt: '2024-06-28T08:00:00Z', isInternal: false }] },
  { id: 'ticket-4', subject: 'Accès client au portail de relecture', description: 'Le client SGC ne peut pas se connecter au portail Frame.io pour valider les maquettes.', requesterId: 'user-3', requesterName: 'Jean-Pierre Moussa', category: 'Demande', priority: 'high', status: 'open', assignedTo: 'user-2', assignedToName: 'Sarah Nkolo', createdAt: '2024-06-28T09:30:00Z', updatedAt: '2024-06-28T09:30:00Z', comments: [] },
  { id: 'ticket-5', subject: 'Commande papier couché A1', description: 'Besoin de 500 feuilles papier couché A1 pour l\'impression des supports SGC.', requesterId: 'user-5', requesterName: 'Grace Abena', category: 'Demande', priority: 'low', status: 'done', assignedTo: 'user-4', assignedToName: 'Amélie Fouda', createdAt: '2024-06-26T10:00:00Z', updatedAt: '2024-06-27T16:00:00Z', comments: [{ id: 'c4', authorId: 'user-4', authorName: 'Amélie Fouda', content: 'Commande passée chez Imprimerie Centrale, livraison prévue demain.', createdAt: '2024-06-26T11:00:00Z', isInternal: false }] },
];

// ============================================
// IDEAS
// ============================================

export const seedIdeas: any[] = [
  { id: 'idea-1', title: 'Packaging immersif AR pour Nestlé', description: 'Intégrer la réalité augmentée sur les emballages pour une expérience client interactive. Les clients scanneront le packaging avec leur smartphone pour découvrir des contenus 3D, des jeux et des recettes exclusives.', authorId: 'user-5', authorName: 'Grace Abena', status: 'in_review', upvotes: 12, hasUpvoted: false, likedBy: ['user-2', 'user-3', 'user-4', 'user-6', 'user-7', 'user-8'], comments: 3, commentsList: [
    { id: 'ic-1', userId: 'user-2', userName: 'Sarah Nkolo', content: 'Excellent concept ! Il faudrait tester avec un prototype sur un produit Nestlé existant.', createdAt: '2024-06-21T10:00:00Z' },
    { id: 'ic-2', userId: 'user-3', userName: 'Jean-Pierre Moussa', content: 'Le coût de développement AR pourrait être élevé. À chiffrer.', createdAt: '2024-06-22T14:30:00Z' },
    { id: 'ic-3', userId: 'user-1', userName: 'Martin Essomba', content: 'Je valide le concept. Préparez un business case.', createdAt: '2024-06-23T09:00:00Z' },
  ], category: 'Produit', tags: ['AR', 'packaging', 'Nestlé'], createdAt: '2024-06-20T00:00:00Z', companyId: 'comp-1' },
  { id: 'idea-2', title: 'Série de podcasts Tech en Pidgin', description: 'Lancer un podcast mensuel sur la tech en Afrique en langue locale pour toucher un public plus large et démocratiser l\'accès aux informations technologiques.', authorId: 'user-6', authorName: 'Koffi Mensah', status: 'approved', upvotes: 8, hasUpvoted: false, likedBy: ['user-1', 'user-2', 'user-5', 'user-7'], comments: 1, commentsList: [
    { id: 'ic-4', userId: 'user-5', userName: 'Grace Abena', content: 'Super idée ! On peut l\'intégrer dans la stratégie content de nos clients.', createdAt: '2024-06-23T11:00:00Z' },
  ], category: 'Content', tags: ['podcast', 'pidgin', 'tech'], createdAt: '2024-06-22T00:00:00Z', companyId: 'comp-1' },
  { id: 'idea-3', title: 'Marketplace de créatifs africains', description: 'Plateforme de mise en relation entre créatifs africains et entreprises à la recherche de talents. Un modèle type Upwork mais 100 % africain avec paiement mobile money.', authorId: 'user-2', authorName: 'Sarah Nkolo', status: 'submitted', upvotes: 5, hasUpvoted: false, likedBy: ['user-1', 'user-3', 'user-4', 'user-7', 'user-8'], comments: 0, commentsList: [], category: 'Produit', tags: ['marketplace', 'creative'], createdAt: '2024-06-25T00:00:00Z', companyId: 'comp-1' },
  { id: 'idea-4', title: 'Studio de streaming dédié', description: 'Créer un studio équipé pour les webinars et live shopping. Inclure écrans LED, caméras 4K, son professionnel et régie en direct.', authorId: 'user-3', authorName: 'Jean-Pierre Moussa', status: 'submitted', upvotes: 3, hasUpvoted: false, likedBy: ['user-1', 'user-6'], comments: 2, commentsList: [
    { id: 'ic-5', userId: 'user-6', userName: 'Koffi Mensah', content: 'Le studio actuel peut déjà accueillir ce type de setup avec quelques aménagements.', createdAt: '2024-06-27T16:00:00Z' },
    { id: 'ic-6', userId: 'user-4', userName: 'Amélie Fouda', content: 'Budget estimé ?', createdAt: '2024-06-28T08:00:00Z' },
  ], category: 'Infrastructure', tags: ['streaming', 'studio'], createdAt: '2024-06-26T00:00:00Z', companyId: 'comp-1' },
  { id: 'idea-5', title: 'Formation design thinking interne', description: 'Organiser des ateliers design thinking pour toute l\'équipe afin de stimuler l\'innovation et améliorer la collaboration inter-services.', authorId: 'user-1', authorName: 'Martin Essomba', status: 'in_review', upvotes: 7, hasUpvoted: false, likedBy: ['user-2', 'user-4', 'user-5', 'user-6', 'user-7', 'user-8'], comments: 4, commentsList: [
    { id: 'ic-7', userId: 'user-2', userName: 'Sarah Nkolo', content: 'Je peux animer les sessions si besoin.', createdAt: '2024-06-28T10:00:00Z' },
    { id: 'ic-8', userId: 'user-7', userName: 'Ingrid Biya', content: 'Excellent pour l\'alignement produit-tech.', createdAt: '2024-06-28T11:30:00Z' },
    { id: 'ic-9', userId: 'user-5', userName: 'Grace Abena', content: 'Proposons un format de 2h par semaine.', createdAt: '2024-06-29T09:00:00Z' },
    { id: 'ic-10', userId: 'user-8', userName: 'Paul Tchuente', content: 'Ça manquait !', createdAt: '2024-06-29T14:00:00Z' },
  ], category: 'RH', tags: ['formation', 'design-thinking'], createdAt: '2024-06-27T00:00:00Z', companyId: 'comp-1' },
];

// ============================================
// CALENDAR EVENTS
// ============================================

export const seedCalendarEvents: any[] = [
  { id: 'evt-1', title: 'Publication Instagram - Projet MTN', type: 'social', startDate: '2024-06-30T09:00:00Z', endDate: '2024-06-30T10:00:00Z', description: 'Post motion design lancement MoMo Marchands', assignees: ['user-5'], color: '#3B82F6' },
  { id: 'evt-2', title: 'Blog - Tendances design 2024', type: 'blog', startDate: '2024-07-02T00:00:00Z', endDate: '2024-07-02T23:59:59Z', description: 'Article sur les tendances graphiques en Afrique centrale', assignees: ['user-3', 'user-5'], color: '#2DD4A8' },
  { id: 'evt-3', title: 'Shooting photo SGC - Portraits', type: 'event', startDate: '2024-07-05T08:00:00Z', endDate: '2024-07-05T14:00:00Z', description: 'Séance photo corporate à la Direction Générale SGC', assignees: ['user-6', 'user-5'], color: '#8B5CF6' },
  { id: 'evt-4', title: 'Tournage teaser Sommet CEMAC', type: 'video', startDate: '2024-07-10T06:00:00Z', endDate: '2024-07-12T18:00:00Z', description: 'Tournage drone et interviews à Yaoundé', assignees: ['user-6', 'user-1'], color: '#F59E0B' },
  { id: 'evt-5', title: 'Réunion client La Maison du Cacao', type: 'meeting', startDate: '2024-07-08T10:00:00Z', endDate: '2024-07-08T11:30:00Z', description: 'Présentation maquettes validées - Go/no-go dev', assignees: ['user-2', 'user-7'], color: '#EF4444' },
  { id: 'evt-6', title: 'Formation Adobe After Effects', type: 'internal', startDate: '2024-07-15T09:00:00Z', endDate: '2024-07-15T17:00:00Z', description: 'Perfectionnement motion design équipe vidéo', assignees: ['user-6'], color: '#EC4899' },
  { id: 'evt-7', title: 'Lancement campagne SGBC - Phase 2', type: 'social', startDate: '2024-07-20T00:00:00Z', endDate: '2024-07-20T23:59:59Z', description: 'Déploiement campagne Google Ads & posts réseaux sociaux', assignees: ['user-3', 'user-5'], color: '#06B6D4' },
  { id: 'evt-8', title: 'Webinar SEO pour PME', type: 'event', startDate: '2024-07-25T14:00:00Z', endDate: '2024-07-25T15:30:00Z', description: 'Webinar gratuit : Comment améliorer son référencement', assignees: ['user-3'], color: '#10B981' },
];

// ============================================
// EXPENSES
// ============================================

export const seedExpenses: any[] = [
  { id: 'exp-1', description: 'Fournitures design & print', amount: 485000, category: 'Fournitures', date: '2024-06-15', status: 'approved', approvedBy: 'user-4', approvedByName: 'Amélie Fouda', receiptUrl: '', submittedBy: 'user-5', submittedByName: 'Grace Abena', companyId: 'comp-1' },
  { id: 'exp-2', description: 'Déjeuner client SGC', amount: 125000, category: 'Repas', date: '2024-06-18', status: 'approved', approvedBy: 'user-4', approvedByName: 'Amélie Fouda', receiptUrl: '', submittedBy: 'user-3', submittedByName: 'Jean-Pierre Moussa', companyId: 'comp-1' },
  { id: 'exp-3', description: 'Licence stock footage Artgrid', amount: 850000, category: 'Logiciel', date: '2024-06-20', status: 'approved', approvedBy: 'user-1', approvedByName: 'Martin Essomba', receiptUrl: '', submittedBy: 'user-6', submittedByName: 'Koffi Mensah', companyId: 'comp-1' },
  { id: 'exp-4', description: 'Transport équipement tournage Yaoundé', amount: 320000, category: 'Transport', date: '2024-06-22', status: 'pending', approvedBy: '', approvedByName: '', receiptUrl: '', submittedBy: 'user-6', submittedByName: 'Koffi Mensah', companyId: 'comp-1' },
  { id: 'exp-5', description: 'Hôtel Yaoundé - équipe tournage (3nuits)', amount: 450000, category: 'Hébergement', date: '2024-06-22', status: 'pending', approvedBy: '', approvedByName: '', receiptUrl: '', submittedBy: 'user-6', submittedByName: 'Koffi Mensah', companyId: 'comp-1' },
];

// ============================================
// NOTIFICATIONS
// ============================================

export const seedNotifications: any[] = [
  { id: 'notif-1', type: 'info', title: 'Nouveau projet', message: 'Refonte Site E-commerce La Maison du Cacao a été créé.', read: false, createdAt: '2024-06-28T08:00:00Z', link: '/projects' },
  { id: 'notif-2', type: 'warning', title: 'Facture en retard', message: 'FAC-2024-00157 MTN arrive à échéance dans 3 jours.', read: false, createdAt: '2024-06-28T09:00:00Z', link: '/finance/invoices' },
  { id: 'notif-3', type: 'success', title: 'Validation maquettes', message: 'SGC a validé les 3 propositions de logo.', read: true, createdAt: '2024-06-27T16:00:00Z', link: '/projects' },
  { id: 'notif-4', type: 'info', title: 'Nouveau candidat', message: 'Robert Fotso a postulé pour le poste de Monteur Vidéo.', read: false, createdAt: '2024-06-28T11:00:00Z', link: '/hr/recruitment' },
  { id: 'notif-5', type: 'error', title: 'Panne projecteur studio', message: 'Incident critique: projecteur studio photo hors service.', read: false, createdAt: '2024-06-28T06:00:00Z', link: '/support' },
];

// ============================================
// EMPLOYEES
// ============================================

export const seedEmployees: any[] = [
  { id: 'emp-1', userId: 'user-1', matricule: 'IG-2019-001', firstName: 'Martin', lastName: 'Essomba', fullName: 'Martin Essomba', email: 'pdg@idibagroup.cm', phone: '+237 699 01 02 03', birthDate: '1975-03-15', hireDate: '2019-06-15', departmentId: 'dept-1', departmentName: 'Direction Générale', position: 'PDG / Directeur Général', contractType: 'CDI', grossSalary: 2500000, netSalary: 1875000, cnpsNumber: 'CNPS-987654321', status: 'active', address: 'Bonapriso, Douala', emergencyContact: '+237 699 11 22 33', bankAccount: 'CMR-123456789', bankName: 'SGBC', companyId: 'comp-1' },
  { id: 'emp-2', userId: 'user-2', matricule: 'IG-2019-002', firstName: 'Sarah', lastName: 'Nkolo', fullName: 'Sarah Nkolo', email: 'dev@idibagroup.cm', phone: '+237 677 45 67 89', birthDate: '1982-07-22', hireDate: '2019-07-01', departmentId: 'dept-3', departmentName: 'Développement Web & Mobile', position: 'Lead Developer / Chef de projet technique', contractType: 'CDI', grossSalary: 1800000, netSalary: 1350000, cnpsNumber: 'CNPS-876543210', status: 'active', address: 'Makepe, Douala', emergencyContact: '+237 677 99 88 77', bankAccount: 'CMR-987654321', bankName: 'ECOBANK', companyId: 'comp-1' },
  { id: 'emp-3', userId: 'user-3', matricule: 'IG-2020-003', firstName: 'Jean-Pierre', lastName: 'Moussa', fullName: 'Jean-Pierre Moussa', email: 'marketing@idibagroup.cm', phone: '+237 696 12 34 56', birthDate: '1978-11-08', hireDate: '2020-01-10', departmentId: 'dept-4', departmentName: 'Marketing Digital', position: 'Responsable Marketing Digital', contractType: 'CDI', grossSalary: 1500000, netSalary: 1125000, cnpsNumber: 'CNPS-765432109', status: 'active', address: 'Deido, Douala', emergencyContact: '+237 696 55 44 33', bankAccount: 'CMR-456789123', bankName: 'AFC', companyId: 'comp-1' },
  { id: 'emp-4', userId: 'user-4', matricule: 'IG-2020-004', firstName: 'Amélie', lastName: 'Fouda', fullName: 'Amélie Fouda', email: 'compta@idibagroup.cm', phone: '+237 694 78 90 12', birthDate: '1985-05-20', hireDate: '2020-02-15', departmentId: 'dept-6', departmentName: 'Finance & Administration', position: 'Responsable Comptable & RH', contractType: 'CDI', grossSalary: 1400000, netSalary: 1050000, cnpsNumber: 'CNPS-654321098', status: 'active', address: 'Bali, Douala', emergencyContact: '+237 694 66 77 88', bankAccount: 'CMR-789123456', bankName: 'UBA', companyId: 'comp-1' },
  { id: 'emp-5', userId: 'user-5', matricule: 'IG-2020-005', firstName: 'Grace', lastName: 'Abena', fullName: 'Grace Abena', email: 'design@idibagroup.cm', phone: '+237 691 23 45 67', birthDate: '1990-09-12', hireDate: '2020-03-01', departmentId: 'dept-2', departmentName: 'Conception Graphique', position: 'Directrice Artistique / Lead Designer', contractType: 'CDI', grossSalary: 1200000, netSalary: 900000, cnpsNumber: 'CNPS-543210987', status: 'active', address: 'Logbessou, Douala', emergencyContact: '+237 691 33 22 11', bankAccount: 'CMR-321654987', bankName: 'SGBC', companyId: 'comp-1' },
  { id: 'emp-6', userId: 'user-6', matricule: 'IG-2020-006', firstName: 'Koffi', lastName: 'Mensah', fullName: 'Koffi Mensah', email: 'video@idibagroup.cm', phone: '+237 698 56 78 90', birthDate: '1980-01-30', hireDate: '2020-04-01', departmentId: 'dept-5', departmentName: 'Production Audiovisuelle', position: 'Directeur de Production Vidéo', contractType: 'CDI', grossSalary: 1100000, netSalary: 825000, cnpsNumber: 'CNPS-432109876', status: 'active', address: 'Ndogbong, Douala', emergencyContact: '+237 698 44 55 66', bankAccount: 'CMR-654987321', bankName: 'ECOBANK', companyId: 'comp-1' },
  { id: 'emp-7', userId: 'user-7', matricule: 'IG-2021-007', firstName: 'Ingrid', lastName: 'Biya', fullName: 'Ingrid Biya', email: 'frontend@idibagroup.cm', phone: '+237 695 34 56 78', birthDate: '1993-04-05', hireDate: '2021-01-15', departmentId: 'dept-3', departmentName: 'Développement Web & Mobile', position: 'Développeuse Frontend Senior (React/Vue)', contractType: 'CDI', grossSalary: 900000, netSalary: 675000, cnpsNumber: 'CNPS-321098765', status: 'active', address: 'Kotto, Douala', emergencyContact: '+237 695 77 88 99', bankAccount: 'CMR-147258369', bankName: 'CCA', companyId: 'comp-1' },
  { id: 'emp-8', userId: 'user-8', matricule: 'IG-2023-008', firstName: 'Paul', lastName: 'Tchuente', fullName: 'Paul Tchuente', email: 'backend@idibagroup.cm', phone: '+237 692 67 89 01', birthDate: '1995-08-18', hireDate: '2023-06-01', departmentId: 'dept-3', departmentName: 'Développement Web & Mobile', position: 'Développeur Backend (Node.js/Python)', contractType: 'CDD', grossSalary: 750000, netSalary: 562500, cnpsNumber: 'CNPS-210987654', status: 'active', address: 'PK14, Douala', emergencyContact: '+237 692 11 22 33', bankAccount: 'CMR-369258147', bankName: 'SGBC', companyId: 'comp-1' },
];

// ============================================
// CANDIDATES
// ============================================

export const seedCandidates: any[] = [
  { id: 'cand-1', firstName: 'Marie', lastName: 'Etoundi', email: 'marie.etoundi@email.cm', phone: '+237 699 88 77 66', position: 'Monteuse Vidéo Senior', departmentId: 'dept-5', status: 'interview', source: 'LinkedIn', rating: 4, salaryExpectation: 1200000, notes: 'Excellente maîtrise DaVinci Resolve & After Effects, 8 ans d\'expérience', interviewDate: '2024-07-05T09:00:00Z', createdAt: '2024-06-01T00:00:00Z', companyId: 'comp-1' },
  { id: 'cand-2', firstName: 'Eric', lastName: 'Manga', email: 'eric.manga@email.cm', phone: '+237 677 33 44 55', position: 'Développeur Full-Stack', departmentId: 'dept-3', status: 'technical', source: 'LinkedIn', rating: 3, salaryExpectation: 1000000, notes: 'Bonne expérience React & Node.js, à évaluer sur test technique', interviewDate: '2024-07-03T14:00:00Z', createdAt: '2024-06-10T00:00:00Z', companyId: 'comp-1' },
  { id: 'cand-3', firstName: 'Aïcha', lastName: 'Bako', email: 'aicha.bako@email.cm', phone: '+237 696 44 55 66', position: 'Community Manager', departmentId: 'dept-4', status: 'technical', source: 'Référence interne', rating: 5, salaryExpectation: 600000, notes: 'Stage validé, très bonne maîtrise des réseaux sociaux et création de contenu', createdAt: '2024-06-15T00:00:00Z', companyId: 'comp-1' },
  { id: 'cand-4', firstName: 'Robert', lastName: 'Fotso', email: 'robert.fotso@email.cm', phone: '+237 694 77 88 99', position: 'Cadreur / Opérateur Drone', departmentId: 'dept-5', status: 'new', source: 'BOLOLO', rating: 0, salaryExpectation: 500000, notes: 'Certification drone DJI, 5 ans d\'expérience tournage corporate', createdAt: '2024-06-28T00:00:00Z', companyId: 'comp-1' },
];

// ============================================
// LEAVES
// ============================================

export const seedLeaves: any[] = [
  { id: 'leave-1', employeeId: 'emp-1', employeeName: 'Martin Essomba', type: 'annual', startDate: '2024-08-01', endDate: '2024-08-15', days: 15, status: 'approved', reason: 'Congés annuels famille', approvedBy: 'user-1', approvedByName: 'Martin Essomba', createdAt: '2024-06-20T00:00:00Z', companyId: 'comp-1' },
  { id: 'leave-2', employeeId: 'emp-5', employeeName: 'Grace Abena', type: 'annual', startDate: '2024-07-15', endDate: '2024-07-28', days: 14, status: 'pending', reason: 'Voyage créatif inspiration', approvedBy: '', approvedByName: '', createdAt: '2024-06-25T00:00:00Z', companyId: 'comp-1' },
  { id: 'leave-3', employeeId: 'emp-6', employeeName: 'Koffi Mensah', type: 'sick', startDate: '2024-06-26', endDate: '2024-06-27', days: 2, status: 'approved', reason: 'Maladie', approvedBy: 'user-4', approvedByName: 'Amélie Fouda', createdAt: '2024-06-26T00:00:00Z', companyId: 'comp-1' },
  { id: 'leave-4', employeeId: 'emp-7', employeeName: 'Ingrid Biya', type: 'annual', startDate: '2024-07-20', endDate: '2024-07-25', days: 6, status: 'pending', reason: 'Congés annuels', approvedBy: '', approvedByName: '', createdAt: '2024-06-27T00:00:00Z', companyId: 'comp-1' },
  { id: 'leave-5', employeeId: 'emp-2', employeeName: 'Sarah Nkolo', type: 'special', startDate: '2024-07-01', endDate: '2024-07-05', days: 5, status: 'approved', reason: 'Formation React Advanced - Paris', approvedBy: 'user-1', approvedByName: 'Martin Essomba', createdAt: '2024-06-15T00:00:00Z', companyId: 'comp-1' },
];

// ============================================
// PAYROLL
// ============================================

export const seedPayroll: any[] = [
  { id: 'pay-1', employeeId: 'emp-1', employeeName: 'Martin Essomba', period: 'Juin 2024', grossSalary: 2500000, taxableIncome: 2375000, irpp: 512500, cnpsEmployee: 105000, cnpsEmployer: 580000, crtv: 37500, cfc: 12500, cac: 25000, otherDeductions: 125000, netSalary: 1875000, employerCost: 3080000, status: 'paid', paidAt: '2024-06-28T00:00:00Z', companyId: 'comp-1' },
  { id: 'pay-2', employeeId: 'emp-2', employeeName: 'Sarah Nkolo', period: 'Juin 2024', grossSalary: 1800000, taxableIncome: 1710000, irpp: 307500, cnpsEmployee: 75600, cnpsEmployer: 417600, crtv: 27000, cfc: 9000, cac: 18000, otherDeductions: 90000, netSalary: 1350000, employerCost: 2217600, status: 'paid', paidAt: '2024-06-28T00:00:00Z', companyId: 'comp-1' },
  { id: 'pay-3', employeeId: 'emp-3', employeeName: 'Jean-Pierre Moussa', period: 'Juin 2024', grossSalary: 1500000, taxableIncome: 1425000, irpp: 227500, cnpsEmployee: 63000, cnpsEmployer: 348000, crtv: 22500, cfc: 7500, cac: 15000, otherDeductions: 75000, netSalary: 1125000, employerCost: 1848000, status: 'paid', paidAt: '2024-06-28T00:00:00Z', companyId: 'comp-1' },
  { id: 'pay-4', employeeId: 'emp-4', employeeName: 'Amélie Fouda', period: 'Juin 2024', grossSalary: 1400000, taxableIncome: 1330000, irpp: 197500, cnpsEmployee: 58800, cnpsEmployer: 324800, crtv: 21000, cfc: 7000, cac: 14000, otherDeductions: 70000, netSalary: 1050000, employerCost: 1724800, status: 'paid', paidAt: '2024-06-28T00:00:00Z', companyId: 'comp-1' },
  { id: 'pay-5', employeeId: 'emp-5', employeeName: 'Grace Abena', period: 'Juin 2024', grossSalary: 1200000, taxableIncome: 1140000, irpp: 147500, cnpsEmployee: 50400, cnpsEmployer: 278400, crtv: 18000, cfc: 6000, cac: 12000, otherDeductions: 60000, netSalary: 900000, employerCost: 1478400, status: 'paid', paidAt: '2024-06-28T00:00:00Z', companyId: 'comp-1' },
  { id: 'pay-6', employeeId: 'emp-6', employeeName: 'Koffi Mensah', period: 'Juin 2024', grossSalary: 1100000, taxableIncome: 1045000, irpp: 122500, cnpsEmployee: 46200, cnpsEmployer: 255200, crtv: 16500, cfc: 5500, cac: 11000, otherDeductions: 55000, netSalary: 825000, employerCost: 1355200, status: 'paid', paidAt: '2024-06-28T00:00:00Z', companyId: 'comp-1' },
  { id: 'pay-7', employeeId: 'emp-7', employeeName: 'Ingrid Biya', period: 'Juin 2024', grossSalary: 900000, taxableIncome: 855000, irpp: 72500, cnpsEmployee: 37800, cnpsEmployer: 208800, crtv: 13500, cfc: 4500, cac: 9000, otherDeductions: 45000, netSalary: 675000, employerCost: 1108800, status: 'paid', paidAt: '2024-06-28T00:00:00Z', companyId: 'comp-1' },
  { id: 'pay-8', employeeId: 'emp-8', employeeName: 'Paul Tchuente', period: 'Juin 2024', grossSalary: 750000, taxableIncome: 712500, irpp: 46250, cnpsEmployee: 31500, cnpsEmployer: 174000, crtv: 11250, cfc: 3750, cac: 7500, otherDeductions: 37500, netSalary: 562500, employerCost: 924000, status: 'paid', paidAt: '2024-06-28T00:00:00Z', companyId: 'comp-1' },
];

// ============================================
// CLIENTS
// ============================================

export const seedClients: any[] = [
  { id: 'cl-1', name: 'Société Générale Cameroun', email: 'marketing@sgc.cm', phone: '+237 233 42 01 00', address: 'Avenue Joffre, Centre Ville, Douala', city: 'Douala', country: 'Cameroun', ifu: 'M0123456789P', rccm: 'RC/DLA/1998/A/001', contactName: 'Françoise Meka', contactEmail: 'f.meka@sgc.cm', type: 'entreprise', sector: 'Banque', totalInvoiced: 35000000, totalPaid: 24863750, outstandingBalance: 10136250, status: 'active', createdAt: '2020-01-15T00:00:00Z', companyId: 'comp-1' },
  { id: 'cl-2', name: 'MTN Cameroun', email: 'marketing@mtn.cm', phone: '+237 677 77 77 77', address: 'Boulevard de la Liberté, Douala', city: 'Douala', country: 'Cameroun', ifu: 'M0123456789M', rccm: 'RC/DLA/2000/B/002', contactName: 'Serge Bouli', contactEmail: 's.bouli@mtn.cm', type: 'entreprise', sector: 'Telecommunications', totalInvoiced: 68000000, totalPaid: 50112500, outstandingBalance: 17887500, status: 'active', createdAt: '2021-03-01T00:00:00Z', companyId: 'comp-1' },
  { id: 'cl-3', name: 'Nestlé Cameroun', email: 'marketing@nestle.cm', phone: '+237 233 40 20 00', address: 'Zone industrielle, Douala', city: 'Douala', country: 'Cameroun', ifu: 'M0123456789N', rccm: 'RC/DLA/2005/C/003', contactName: 'Patricia Nkolo', contactEmail: 'p.nkolo@nestle.cm', type: 'entreprise', sector: 'Agroalimentaire', totalInvoiced: 38000000, totalPaid: 38000000, outstandingBalance: 0, status: 'active', createdAt: '2022-01-10T00:00:00Z', companyId: 'comp-1' },
  { id: 'cl-4', name: 'Université de Douala', email: 'admin@univ-douala.cm', phone: '+237 233 40 21 00', address: 'Campus universitaire, Douala', city: 'Douala', country: 'Cameroun', contactName: 'Prof. Abena', contactEmail: 'admin@univ-douala.cm', type: 'administration', sector: 'Education', totalInvoiced: 15201000, totalPaid: 9000000, outstandingBalance: 6201000, status: 'active', createdAt: '2023-09-01T00:00:00Z', companyId: 'comp-1' },
  { id: 'cl-5', name: 'Chanas Assurances', email: 'com@chanas.cm', phone: '+237 233 42 30 00', address: 'Rue des Palmiers, Akwa, Douala', city: 'Douala', country: 'Cameroun', ifu: 'M0123456789H', rccm: 'RC/DLA/2010/A/005', contactName: 'Luc Fouda', contactEmail: 'com@chanas.cm', type: 'entreprise', sector: 'Assurances', totalInvoiced: 0, totalPaid: 0, outstandingBalance: 0, status: 'active', createdAt: '2023-11-15T00:00:00Z', companyId: 'comp-1' },
  { id: 'cl-6', name: 'BOLOLO', email: 'contact@bololo.cm', phone: '+237 677 88 99 00', address: 'Bonapriso, Douala', city: 'Douala', country: 'Cameroun', ifu: 'M0123456789B', rccm: 'RC/DLA/2022/S/006', contactName: 'Alain Kome', contactEmail: 'contact@bololo.cm', type: 'entreprise', sector: 'Technologie', totalInvoiced: 18583500, totalPaid: 11190000, outstandingBalance: 7393500, status: 'active', createdAt: '2024-01-20T00:00:00Z', companyId: 'comp-1' },
  { id: 'cl-7', name: 'La Maison du Cacao', email: 'contact@maisonducacao.cm', phone: '+237 699 55 66 77', address: 'Yassa, Douala', city: 'Douala', country: 'Cameroun', ifu: 'M0123456789L', rccm: 'RC/DLA/2018/E/007', contactName: 'Marie Kotto', contactEmail: 'contact@maisonducacao.cm', type: 'entreprise', sector: 'Agroalimentaire', totalInvoiced: 0, totalPaid: 0, outstandingBalance: 0, status: 'active', createdAt: '2024-02-01T00:00:00Z', companyId: 'comp-1' },
  { id: 'cl-8', name: 'Ministère de la Culture', email: 'communication@minculture.gov.cm', phone: '+237 222 23 45 67', address: 'Yaoundé', city: 'Yaoundé', country: 'Cameroun', contactName: 'Dr. Mbakop', contactEmail: 'communication@minculture.gov.cm', type: 'administration', sector: 'Administration Publique', totalInvoiced: 0, totalPaid: 0, outstandingBalance: 0, status: 'active', createdAt: '2024-03-01T00:00:00Z', companyId: 'comp-1' },
];

export const seedSuppliers: Supplier[] = [
  { id: 'supplier-1', name: 'Imprimerie Centrale Douala', email: 'devis@icd.cm', contactName: 'Paul Abena', contactEmail: 'devis@icd.cm', phone: '+237 233 45 67 89', sector: 'Imprimerie', address: 'Rue des Palmiers, Akwa', city: 'Douala', country: 'Cameroun', ifu: 'M0111111111', rccm: 'RCCM/DLA/2015/C/111', status: 'active', createdAt: '2024-01-20T00:00:00Z', companyId: 'comp-1', portalUserId: 'portal-vendor-1' },
  { id: 'supplier-2', name: 'ServerPro Afrique', email: 'contact@serverpro.cm', contactName: 'Grace Nkolo', contactEmail: 'contact@serverpro.cm', phone: '+237 699 88 77 66', sector: 'Informatique', address: 'Tech Hub, Bonapriso', city: 'Douala', country: 'Cameroun', ifu: 'M0222222222', rccm: 'RCCM/DLA/2018/D/222', status: 'active', createdAt: '2024-02-15T00:00:00Z', companyId: 'comp-1', portalUserId: 'portal-vendor-2' },
];

// ============================================
// PERFORMANCE REVIEWS
// ============================================

export const seedPerformanceReviews: any[] = [
  { id: 'perf-1', employeeId: 'emp-1', employeeName: 'Martin Essomba', reviewerId: 'user-1', reviewerName: 'Martin Essomba', period: 'S1', year: 2024, objectives: [{ description: 'Croissance CA +25%', weight: 30, score: 5 }, { description: 'Ouverture bureau Yaoundé', weight: 25, score: 4 }, { description: 'Nouveaux contrats 5+', weight: 25, score: 4 }, { description: 'Satisfaction client >90%', weight: 20, score: 5 }], competencies: [{ name: 'Leadership', score: 5 }, { name: 'Vision stratégique', score: 5 }, { name: 'Relation client', score: 5 }, { name: 'Innovation', score: 4 }], overallScore: 4.5, rating: 'exceeds', bonusAmount: 750000, bonusPercentage: 30, comments: 'Excellente croissance, CA en hausse de 28%. Ouverture Yaoundé prévue Q3.', employeeComments: 'Fier de l\'équipe et des résultats', status: 'approved', createdAt: '2024-06-28T00:00:00Z', companyId: 'comp-1' },
  { id: 'perf-2', employeeId: 'emp-2', employeeName: 'Sarah Nkolo', reviewerId: 'user-1', reviewerName: 'Martin Essomba', period: 'S1', year: 2024, objectives: [{ description: 'Livraison 4 projets web', weight: 35, score: 4 }, { description: 'Migration infra cloud', weight: 30, score: 5 }, { description: 'Équipe dev +2', weight: 20, score: 3 }, { description: 'Zero bug critique production', weight: 15, score: 5 }], competencies: [{ name: 'Technique', score: 5 }, { name: 'Gestion d\'équipe', score: 4 }, { name: 'Projet', score: 5 }, { name: 'Innovation', score: 4 }], overallScore: 4.1, rating: 'exceeds', bonusAmount: 360000, bonusPercentage: 20, comments: 'Migration cloud réussie, livraisons dans les délais', employeeComments: 'Fière de l\'équipe technique', status: 'approved', createdAt: '2024-06-28T00:00:00Z', companyId: 'comp-1' },
  { id: 'perf-3', employeeId: 'emp-5', employeeName: 'Grace Abena', reviewerId: 'user-1', reviewerName: 'Martin Essomba', period: 'S1', year: 2024, objectives: [{ description: 'Branding 3 clients majeurs', weight: 35, score: 4 }, { description: 'Création 150+ visuels', weight: 30, score: 5 }, { description: 'Award design international', weight: 20, score: 3 }, { description: 'Formation junior designer', weight: 15, score: 4 }], competencies: [{ name: 'Créativité', score: 5 }, { name: 'Technique', score: 5 }, { name: 'Gestion de projet', score: 4 }, { name: 'Communication', score: 4 }], overallScore: 4.1, rating: 'exceeds', bonusAmount: 240000, bonusPercentage: 20, comments: 'Excellente qualité créative, branding SGC en cours très prometteur', employeeComments: 'Merci pour la confiance', status: 'approved', createdAt: '2024-06-28T00:00:00Z', companyId: 'comp-1' },
  { id: 'perf-4', employeeId: 'emp-3', employeeName: 'Jean-Pierre Moussa', reviewerId: 'user-1', reviewerName: 'Martin Essomba', period: 'S1', year: 2024, objectives: [{ description: 'ROAS campagnes >400%', weight: 35, score: 4 }, { description: 'Acquisition 10K followers', weight: 25, score: 5 }, { description: 'Lancement podcast Tech', weight: 25, score: 4 }, { description: 'Partenariats influenceurs 5+', weight: 15, score: 4 }], competencies: [{ name: 'Stratégie', score: 5 }, { name: 'Analyse', score: 4 }, { name: 'Créativité', score: 4 }, { name: 'Leadership', score: 3 }], overallScore: 4.1, rating: 'exceeds', bonusAmount: 300000, bonusPercentage: 20, comments: 'Campagnes digitale SGBC excellentes, forte croissance réseaux sociaux', employeeComments: '', status: 'approved', createdAt: '2024-06-28T00:00:00Z', companyId: 'comp-1' },
  { id: 'perf-5', employeeId: 'emp-6', employeeName: 'Koffi Mensah', reviewerId: 'user-1', reviewerName: 'Martin Essomba', period: 'S1', year: 2024, objectives: [{ description: 'Production 20 vidéos', weight: 35, score: 4 }, { description: 'Série documentaire lancée', weight: 30, score: 4 }, { description: 'Setup studio streaming', weight: 20, score: 3 }, { description: 'Formation équipe motion', weight: 15, score: 5 }], competencies: [{ name: 'Technique', score: 5 }, { name: 'Créativité', score: 4 }, { name: 'Organisation', score: 4 }, { name: 'Pédagogie', score: 5 }], overallScore: 4.0, rating: 'meets', bonusAmount: 165000, bonusPercentage: 15, comments: 'Série documentaire en bonne voie, formation motion design très appréciée', employeeComments: '', status: 'approved', createdAt: '2024-06-28T00:00:00Z', companyId: 'comp-1' },
];

// ============================================
// CLOSING ENTRIES
// ============================================

export const seedClosingEntries: any[] = [
  { id: 'ce-1', fiscalYear: 2024, step: 'depreciation', description: 'Dotation aux amortissements matériel audiovisuel H1', status: 'completed' as any, automated: true, entries: [], startedAt: '2024-06-30T00:00:00Z', completedAt: '2024-06-30T02:00:00Z', companyId: 'comp-1' },
  { id: 'ce-2', fiscalYear: 2024, step: 'provisions', description: 'Provision dépréciation clients', status: 'completed' as any, automated: true, entries: [], startedAt: '2024-06-30T02:00:00Z', completedAt: '2024-06-30T03:00:00Z', companyId: 'comp-1' },
  { id: 'ce-3', fiscalYear: 2024, step: 'adjustments', description: 'Régularisation charges constatées d\'avance', status: 'completed' as any, automated: false, entries: [], startedAt: '2024-06-30T03:00:00Z', completedAt: '2024-06-30T04:00:00Z', companyId: 'comp-1' },
  { id: 'ce-4', fiscalYear: 2024, step: 'income_statement', description: 'Solde comptes de produits et charges', status: 'completed' as any, automated: true, entries: [], startedAt: '2024-06-30T04:00:00Z', completedAt: '2024-06-30T05:00:00Z', companyId: 'comp-1' },
  { id: 'ce-5', fiscalYear: 2024, step: 'balance_sheet', description: 'Bilan d\'ouverture S2 2024', status: 'completed' as any, automated: true, entries: [], startedAt: '2024-06-30T05:00:00Z', completedAt: '2024-06-30T06:00:00Z', companyId: 'comp-1' },
];

// ============================================
// VIBE PROSPECTING - LEADS (secteurs créatifs & marketing)
// ============================================

export const seedLeads: any[] = [
  { id: 'lead-1', fullName: 'Aïssatou Diallo', company: 'Canal+ Afrique', position: 'Directrice Marketing', email: 'a.diallo@canalplus-afrique.com', phone: '+237 677 88 12 34', linkedinUrl: 'https://linkedin.com/in/aissatou-diallo', industry: 'Media & Communication', country: 'Cameroun', city: 'Douala', source: 'social_media', status: 'qualified', score: 87, temperature: 'hot', signals: ['hiring_intent', 'tech_upgrade'], lastActivity: '2025-02-15T10:30:00Z', assignedTo: 'user-3', assignedToName: 'Jean-Pierre Moussa', notes: 'Cherche une agence pour produire du contenu digital original. Budget confirme pour Q2.', tags: ['production-video', 'content-marketing', 'prioritaire'], estimatedValue: 35000000, currency: 'XAF', createdAt: '2025-01-10T00:00:00Z', companyId: 'comp-1' },
  { id: 'lead-2', fullName: 'François Ngassa', company: 'Brasseries du Cameroun (SABC)', position: 'Responsable Communication', email: 'f.ngassa@sabc.cm', phone: '+237 699 45 67 89', linkedinUrl: 'https://linkedin.com/in/francois-ngassa', industry: 'Agroalimentaire', country: 'Cameroun', city: 'Douala', source: 'signal_detection', status: 'proposal', score: 92, temperature: 'hot', signals: ['funding', 'expansion', 'tech_upgrade'], lastActivity: '2025-02-20T14:15:00Z', assignedTo: 'user-1', assignedToName: 'Martin Essomba', notes: 'Campagne 33 Export en préparation. Cherche agence créative pour concept et production.', tags: ['campagne-publicitaire', 'branding', 'prioritaire'], estimatedValue: 85000000, currency: 'XAF', createdAt: '2025-01-05T00:00:00Z', companyId: 'comp-1' },
  { id: 'lead-3', fullName: 'Patricia Kotto', company: 'Promote', position: 'Chef de Projet Digital', email: 'p.kotto@promote.cm', phone: '+237 677 23 45 67', industry: 'Immobilier', country: 'Cameroun', city: 'Douala', source: 'website', status: 'contacted', score: 65, temperature: 'warm', signals: ['expansion'], lastActivity: '2025-02-18T09:00:00Z', assignedTo: 'user-3', assignedToName: 'Jean-Pierre Moussa', notes: 'Intéressée par un site vitrine immersif pour le nouveau projet immobilier.', tags: ['site-web', 'immobilier', 'visite-virtuelle'], estimatedValue: 18000000, currency: 'XAF', createdAt: '2025-01-20T00:00:00Z', companyId: 'comp-1' },
  { id: 'lead-4', fullName: 'Honorine Etoundi', company: 'Ministère du Tourisme', position: 'Secrétaire Générale', email: 'h.etoundi@mintourisme.gov.cm', phone: '+237 222 34 56 78', industry: 'Administration Publique', country: 'Cameroun', city: 'Yaoundé', source: 'event', status: 'new', score: 45, temperature: 'cold', signals: ['budget_announcement'], lastActivity: '2025-02-10T11:00:00Z', assignedTo: 'user-5', assignedToName: 'Grace Abena', notes: 'Budget 2025 alloué à la promotion touristique. Documentaire paysages Cameroun.', tags: ['audiovisuel', 'documentaire', 'tender'], estimatedValue: 65000000, currency: 'XAF', createdAt: '2025-02-01T00:00:00Z', companyId: 'comp-1' },
  { id: 'lead-5', fullName: 'Serge Bouli', company: 'MTN Cameroun', position: 'Directeur Marketing', email: 's.bouli@mtn.cm', phone: '+237 699 78 90 12', industry: 'Telecommunications', country: 'Cameroun', city: 'Douala', source: 'referral', status: 'negotiation', score: 78, temperature: 'hot', signals: ['tech_upgrade', 'hiring_intent'], lastActivity: '2025-02-22T16:45:00Z', assignedTo: 'user-3', assignedToName: 'Jean-Pierre Moussa', notes: 'Partenariat création contenu MoMo en négociation avancée. Besoin régulier de production vidéo.', tags: ['partenariat', 'content-creation', 'video'], estimatedValue: 120000000, currency: 'XAF', createdAt: '2024-12-15T00:00:00Z', companyId: 'comp-1' },
  { id: 'lead-6', fullName: 'Marie Claire Tchamba', company: 'TotalEnergies Cameroun', position: 'Responsable Communication RSE', email: 'mc.tchamba@totalenergies.cm', phone: '+237 677 56 78 90', industry: 'Energie', country: 'Cameroun', city: 'Douala', source: 'scraping', status: 'nurturing', score: 55, temperature: 'warm', signals: ['regulatory_change'], lastActivity: '2025-02-12T08:30:00Z', assignedTo: 'user-6', assignedToName: 'Koffi Mensah', notes: 'Nouvelles exigences RSE. Besoin de contenu vidéo sur les actions communautaires.', tags: ['video-rse', 'communication'], estimatedValue: 45000000, currency: 'XAF', createdAt: '2025-01-15T00:00:00Z', companyId: 'comp-1' },
  { id: 'lead-7', fullName: 'Kossi Mensah', company: 'Ecobank Cameroun', position: 'Responsable Marketing Digital', email: 'k.mensah@ecobank.cm', phone: '+237 699 34 56 78', industry: 'Banque', country: 'Cameroun', city: 'Douala', source: 'social_media', status: 'qualified', score: 81, temperature: 'hot', signals: ['tech_upgrade', 'pain_point'], lastActivity: '2025-02-21T13:20:00Z', assignedTo: 'user-1', assignedToName: 'Martin Essomba', notes: 'Insatisfait de son agence actuelle. Cherche nouveauté et créativité pour campagnes digitales.', tags: ['marketing-digital', 'switch'], estimatedValue: 55000000, currency: 'XAF', createdAt: '2025-01-08T00:00:00Z', companyId: 'comp-1' },
  { id: 'lead-8', fullName: 'Yvonne Eboa', company: 'Orange Cameroun', position: 'Manager Marque & Sponsoring', email: 'y.eboa@orange.cm', phone: '+237 677 90 12 34', industry: 'Telecommunications', country: 'Cameroun', city: 'Douala', source: 'signal_detection', status: 'contacted', score: 70, temperature: 'warm', signals: ['expansion', 'funding'], lastActivity: '2025-02-19T10:00:00Z', assignedTo: 'user-5', assignedToName: 'Grace Abena', notes: 'Projet repositionnement marque Orange Money. Besoin branding et campagne.', tags: ['rebranding', 'fintech', 'campagne'], estimatedValue: 95000000, currency: 'XAF', createdAt: '2025-01-25T00:00:00Z', companyId: 'comp-1' },
  { id: 'lead-9', fullName: 'Jean Baptiste Amougou', company: 'Chococam', position: 'Directeur Marketing', email: 'jb.amougou@chococam.cm', phone: '+237 699 12 34 56', industry: 'Agroalimentaire', country: 'Cameroun', city: 'Douala', source: 'scraping', status: 'new', score: 38, temperature: 'cold', signals: ['pain_point'], lastActivity: '2025-02-14T15:00:00Z', assignedTo: 'user-3', assignedToName: 'Jean-Pierre Moussa', notes: 'Problème de visibilité digital. Lead à qualifier.', tags: ['marketing-digital', 'agroalimentaire'], estimatedValue: 25000000, currency: 'XAF', createdAt: '2025-02-05T00:00:00Z', companyId: 'comp-1' },
  { id: 'lead-10', fullName: 'Chantal Kome', company: 'GICAM', position: 'Directrice Communication', email: 'c.kome@gicam.cm', phone: '+237 222 56 78 90', industry: 'Organisation professionnelle', country: 'Cameroun', city: 'Douala', source: 'event', status: 'proposal', score: 85, temperature: 'hot', signals: ['hiring_intent', 'tech_upgrade', 'regulatory_change'], lastActivity: '2025-02-23T09:30:00Z', assignedTo: 'user-1', assignedToName: 'Martin Essomba', notes: 'Couverture complète GICAM 2025 : site, app, vidéo, réseaux sociaux. Opportunité majeure.', tags: ['appel-offres', 'multiservice', 'prioritaire'], estimatedValue: 150000000, currency: 'XAF', createdAt: '2024-11-20T00:00:00Z', companyId: 'comp-1' },
];

// ============================================
// VIBE PROSPECTING - BUY SIGNALS
// ============================================

export const seedSignals: any[] = [
  { id: 'sig-1', leadId: 'lead-1', leadName: 'Aïssatou Diallo', company: 'Canal+ Afrique', type: 'hiring_intent', description: 'Canal+ Afrique publie 4 offres de postes en production de contenu digital et motion design sur LinkedIn, indiquant une expansion de leur capacité créative.', platform: 'linkedin', url: 'https://linkedin.com/jobs/canalplus-afrique', confidence: 88, relevance: 92, dateDetected: '2025-02-20T08:00:00Z', isRead: false, isActioned: false, suggestedApproach: 'Contacter Aïssatou avec une proposition de partenariat production. Mentionner notre expérience avec des clients media.', aiGeneratedMessage: 'Bonjour Aïssatou,\n\nJ\'ai remarque que Canal+ Afrique recrute activement dans la production de contenu digital. C\'est un signe fort d\'ambition créative.\n\nIDIBA Group a accompagné 3 acteurs majeurs des médias en Afrique centrale avec des productions vidéo primées et des stratégies content marketing innovantes.\n\nSeriez-vous ouverte à un échange de 15 minutes sur vos besoins de production ?\n\nCordialement,', tags: ['hiring', 'production-video', 'media'], companyId: 'comp-1' },
  { id: 'sig-2', leadId: 'lead-2', leadName: 'François Ngassa', company: 'SABC', type: 'funding', description: 'SABC annonce un budget record de 500M FCFA pour la campagne 33 Export 2025, incluant production vidéo et digital.', platform: 'news', url: 'https://sabc.cm/press/2025', confidence: 95, relevance: 98, dateDetected: '2025-02-18T10:00:00Z', isRead: true, isActioned: true, suggestedApproach: 'Préparer un moodboard créatif et une proposition de concept. Mobiliser l\'équipe design et vidéo.', aiGeneratedMessage: 'Cher François,\n\nFélicitations pour le budget alloué à la campagne 33 Export 2025. C\'est une opportunité exceptionnelle de créer un impact mémorable.\n\nIDIBA Group dispose d\'une expertise spécifique dans les campagnes CPG avec des concepts créatifs primés et une production audiovisuelle de classe internationale.\n\nPourrions-nous vous présenter notre vision créative lors d\'une réunion la semaine prochaine ?\n\nBien à vous,', tags: ['funding', 'campagne', 'branding'], companyId: 'comp-1' },
  { id: 'sig-3', leadId: 'lead-7', leadName: 'Kossi Mensah', company: 'Ecobank Cameroun', type: 'competitor_switch', description: 'Kossi Mensah a exprimé son insatisfaction concernant son agence digitale actuelle sur LinkedIn, mentionnant un manque de créativité.', platform: 'linkedin', url: 'https://linkedin.com/feed/kossi-mensah', confidence: 82, relevance: 90, dateDetected: '2025-02-21T14:30:00Z', isRead: false, isActioned: false, suggestedApproach: 'Approche discrète. Proposer un audit créatif gratuit de leurs campagnes actuelles.', aiGeneratedMessage: 'Bonjour Kossi,\n\nJ\'ai lu votre retour sur votre agence digitale actuelle. Le manque de créativité coûte cher en engagement.\n\nIDIBA Group propose un audit créatif gratuit de vos campagnes avec 3 recommandations concrètes pour augmenter votre ROAS.\n\nSouhaitez-vous que nous organisions cette analyse ?\n\nCordialement,', tags: ['switch', 'marketing-digital', 'insatisfaction'], companyId: 'comp-1' },
  { id: 'sig-4', leadId: 'lead-5', leadName: 'Serge Bouli', company: 'MTN Cameroun', type: 'tech_upgrade', description: 'MTN lance un RFP pour la création de contenu vidéo MoMo sur 12 mois, incluant production, motion design et community management.', platform: 'job_board', url: 'https://mtn.cm/rfp-2025', confidence: 91, relevance: 95, dateDetected: '2025-02-19T09:00:00Z', isRead: true, isActioned: false, suggestedApproach: 'Répondre au RFP. Préparer un showreel et des études de cas.', aiGeneratedMessage: '', tags: ['rfp', 'content-creation', 'video'], companyId: 'comp-1' },
  { id: 'sig-5', company: 'Ministère du Tourisme', type: 'budget_announcement', description: 'Le budget 2025 du Ministère du Tourisme alloue 650M FCFA à la promotion digitale et à la production de contenu touristique.', platform: 'news', url: 'https://mintourisme.gov.cm/budget-2025', confidence: 85, relevance: 80, dateDetected: '2025-02-10T12:00:00Z', isRead: false, isActioned: false, suggestedApproach: 'Préparation d\'une offre pour les appels d\'offres. Créer un showreel tourism.', aiGeneratedMessage: '', tags: ['budget', 'audiovisuel', 'tender'], companyId: 'comp-1' },
  { id: 'sig-6', leadId: 'lead-8', leadName: 'Yvonne Eboa', company: 'Orange Cameroun', type: 'expansion', description: 'Orange Cameroun annonce le repositionnement de la marque Orange Money avec un nouveau logo et une campagne 360°.', platform: 'twitter', url: 'https://twitter.com/OrangeCameroun', confidence: 78, relevance: 85, dateDetected: '2025-02-17T11:00:00Z', isRead: false, isActioned: false, suggestedApproach: 'Proposer un accompagnement complet : branding, production vidéo, campagne digitale.', aiGeneratedMessage: 'Chère Yvonne,\n\nFélicitations pour le repositionnement de la marque Orange Money. C\'est un projet ambitieux.\n\nIDIBA Group dispose d\'une expertise complète en branding, production vidéo et campagnes digitales qui pourrait accélérer votre lancement.\n\nPourrions-nous explorer un partenariat gagnant-gagnant ?\n\nCordialement,', tags: ['expansion', 'rebranding', 'partenariat'], companyId: 'comp-1' },
  { id: 'sig-7', leadId: 'lead-10', leadName: 'Chantal Kome', company: 'GICAM', type: 'regulatory_change', description: 'Nouvelles directives de communication pour les organisations patronales, exigeant une présence digitale professionnelle.', platform: 'news', url: 'https://gicam.cm/directives-2025', confidence: 93, relevance: 88, dateDetected: '2025-02-22T08:00:00Z', isRead: true, isActioned: false, suggestedApproach: 'Proposer un package complet : site web, app événementielle, couverture vidéo, réseaux sociaux.', aiGeneratedMessage: '', tags: ['reglementation', 'multiservice', 'digital'], companyId: 'comp-1' },
  { id: 'sig-8', leadId: 'lead-6', leadName: 'Marie Claire Tchamba', company: 'TotalEnergies Cameroun', type: 'pain_point', description: 'Marie Claire a posé une question sur un forum corporate concernant la création de contenu RSE engageant et authentique.', platform: 'forum', url: 'https://forum.rse.cm/content-creation', confidence: 75, relevance: 82, dateDetected: '2025-02-15T16:00:00Z', isRead: false, isActioned: false, suggestedApproach: 'Répondre sur le forum puis contacter en privé. Proposer une série documentaire RSE.', aiGeneratedMessage: 'Bonjour Marie Claire,\n\nJ\'ai vu votre question sur le contenu RSE. IDIBA Group produit des documentaires d\'impact qui mettent en lumière vos actions communautaires avec authenticité.\n\nNous avons déjà réalisé 5 séries RSE pour des acteurs énergétiques en Afrique. Je serais ravi de partager notre approche.\n\nBien cordialement,', tags: ['documentaire', 'rse', 'energie'], companyId: 'comp-1' },
];

// ============================================
// VIBE PROSPECTING - SOCIAL TRENDS
// ============================================

export const seedTrends: any[] = [
  { id: 'trend-1', topic: 'Content Marketing en Afrique', category: 'Marketing Digital', platform: 'linkedin', volumeScore: 92, growthRate: 34, sentiment: 'positive', relatedHashtags: ['#ContentMarketing', '#AfriqueDigitale', '#MarketingDigital', '#BrandStorytelling'], topInfluencers: ['IDIBA Group', 'Smart Africa', 'African Union'], audienceDemographics: [{ segment: 'Marketers', percentage: 45 }, { segment: 'Dirigeants', percentage: 30 }, { segment: 'Investisseurs', percentage: 25 }], geoHotspots: [{ city: 'Douala', country: 'Cameroun', intensity: 85 }, { city: 'Abidjan', country: "Cote d'Ivoire", intensity: 78 }, { city: 'Lagos', country: 'Nigeria', intensity: 92 }], dateDetected: '2025-02-01T00:00:00Z', isActive: true, suggestedContent: 'Publier une étude de cas sur la campagne SGBC avec des chiffres de performance et ROI.', companyId: 'comp-1' },
  { id: 'trend-2', topic: 'Production Vidéo Corporate', category: 'Audiovisuel', platform: 'youtube', volumeScore: 78, growthRate: 22, sentiment: 'positive', relatedHashtags: ['#VideoCorporate', '#ProductionVideo', '#MotionDesign', '#BrandFilm'], topInfluencers: ['IDIBA Group', 'Canal+ Afrique', 'Trace'], audienceDemographics: [{ segment: 'Professionnels com', percentage: 50 }, { segment: 'Jeunes 18-35', percentage: 35 }, { segment: 'Entrepreneurs', percentage: 15 }], geoHotspots: [{ city: 'Douala', country: 'Cameroun', intensity: 72 }, { city: 'Accra', country: 'Ghana', intensity: 80 }, { city: 'Nairobi', country: 'Kenya', intensity: 88 }], dateDetected: '2025-02-10T00:00:00Z', isActive: true, suggestedContent: 'Showreel 2024 : Les 5 productions vidéo les plus impactantes de la CEMAC.', companyId: 'comp-1' },
  { id: 'trend-3', topic: 'Design System & Branding', category: 'Design', platform: 'linkedin', volumeScore: 85, growthRate: 45, sentiment: 'positive', relatedHashtags: ['#DesignSystem', '#Branding', '#IdentiteVisuelle', '#UIUX'], topInfluencers: ['Dribbble Africa', 'Figma Community', 'Adobe'], audienceDemographics: [{ segment: 'Designers', percentage: 55 }, { segment: 'Directeurs artistiques', percentage: 30 }, { segment: 'Startups', percentage: 15 }], geoHotspots: [{ city: 'Yaounde', country: 'Cameroun', intensity: 65 }, { city: 'Johannesburg', country: 'Afrique du Sud', intensity: 95 }, { city: 'Casablanca', country: 'Maroc', intensity: 70 }], dateDetected: '2025-02-05T00:00:00Z', isActive: true, suggestedContent: 'Webinaire : Comment construire un design system efficace pour les marques africaines.', companyId: 'comp-1' },
  { id: 'trend-4', topic: 'E-commerce & Digital Transformation', category: 'Technologie', platform: 'twitter', volumeScore: 68, growthRate: 28, sentiment: 'positive', relatedHashtags: ['#EcommerceAfrica', '#DigitalTransformation', '#WebDev', '#MobileApp'], topInfluencers: ['Jumia', 'Flutterwave', 'IDIBA Group'], audienceDemographics: [{ segment: 'Commerçants', percentage: 40 }, { segment: 'Développeurs', percentage: 35 }, { segment: 'Investisseurs', percentage: 25 }], geoHotspots: [{ city: 'Douala', country: 'Cameroun', intensity: 60 }, { city: 'Port Harcourt', country: 'Nigeria', intensity: 75 }], dateDetected: '2025-01-28T00:00:00Z', isActive: true, suggestedContent: 'Article : Comment le e-commerce transforme le commerce de proximité au Cameroun.', companyId: 'comp-1' },
  { id: 'trend-5', topic: 'Influence Marketing en CEMAC', category: 'Marketing Digital', platform: 'instagram', volumeScore: 72, growthRate: 18, sentiment: 'positive', relatedHashtags: ['#InfluenceMarketing', '#InfluenceursAfrique', '#BrandPartnership', '#CreatorEconomy'], topInfluencers: ['IDIBA Group', 'Trace Africa', 'Canal+'], audienceDemographics: [{ segment: 'Community managers', percentage: 50 }, { segment: 'Influenceurs', percentage: 30 }, { segment: 'Marques', percentage: 20 }], geoHotspots: [{ city: 'Douala', country: 'Cameroun', intensity: 70 }, { city: 'Libreville', country: 'Gabon', intensity: 55 }, { city: 'Brazzaville', country: 'Congo', intensity: 50 }], dateDetected: '2025-02-12T00:00:00Z', isActive: true, suggestedContent: 'Guide : Comment choisir et collaborer avec des influenceurs en zone CEMAC.', companyId: 'comp-1' },
  { id: 'trend-6', topic: 'Réalité Augmentée & Marketing Immersif', category: 'Technologie', platform: 'youtube', volumeScore: 95, growthRate: 52, sentiment: 'positive', relatedHashtags: ['#RealiteAugmentee', '#ARMARKETING', '#ImmersiveExperience', '#Innovation'], topInfluencers: ['Meta Africa', 'Snap Inc', 'IDIBA Group'], audienceDemographics: [{ segment: 'Agences créatives', percentage: 40 }, { segment: 'Jeunes technophiles', percentage: 35 }, { segment: 'Marques FMCG', percentage: 25 }], geoHotspots: [{ city: 'Douala', country: 'Cameroun', intensity: 80 }, { city: 'Cape Town', country: 'Afrique du Sud', intensity: 98 }, { city: 'Casablanca', country: 'Maroc', intensity: 90 }], dateDetected: '2025-01-15T00:00:00Z', isActive: true, suggestedContent: 'Vidéo : IDIBA Group présente son concept AR pour packaging immersif.', companyId: 'comp-1' },
];

// ============================================
// VIBE PROSPECTING - CAMPAIGNS
// ============================================

export const seedCampaigns: any[] = [
  { id: 'camp-1', name: 'Campagne Acquisition Q1 2025', status: 'running', channel: 'email', targetAudience: 'Directeurs marketing et communication CEMAC', leadsCount: 45, sentCount: 45, openedCount: 38, repliedCount: 12, positiveCount: 8, conversionRate: 17.8, template: 'email-agence-creative-v2', aiPrompt: 'Rédiger un email professionnel de 150 mots pour proposer les services d\'IDIBA Group (création graphique, vidéo, web, marketing digital). Ton: créatif et professionnel. Mentionner le showreel et les études de cas.', personalizationFields: ['nom', 'entreprise', 'secteur', 'ville'], scheduledAt: '2025-02-01T08:00:00Z', createdAt: '2025-01-25T00:00:00Z', createdBy: 'user-3', companyId: 'comp-1' },
  { id: 'camp-2', name: 'Relance Leads Chauds - Février', status: 'completed', channel: 'linkedin', targetAudience: 'Leads qualifiés score > 80', leadsCount: 15, sentCount: 15, openedCount: 14, repliedCount: 10, positiveCount: 7, conversionRate: 46.7, template: 'linkedin-relance-chaude', aiPrompt: 'Rédiger un message LinkedIn concis (100 mots max) pour relancer un lead chaud. Ton: enthousiaste mais pas pressant. Proposer une démo créative de 20 minutes.', personalizationFields: ['nom', 'poste', 'entreprise', 'signal_detecte'], createdAt: '2025-02-10T00:00:00Z', createdBy: 'user-1', companyId: 'comp-1' },
  { id: 'camp-3', name: 'Nouveaux Signaux - Approche IA', status: 'running', channel: 'email', targetAudience: 'Leads avec signaux d\'achat détectés', leadsCount: 22, sentCount: 18, openedCount: 15, repliedCount: 6, positiveCount: 4, conversionRate: 22.2, template: 'email-signal-personnalise', aiPrompt: 'Rédiger un email hyper-personnalisé basé sur le signal d\'achat détecté. Mentionner le signal spécifique et proposer une solution adaptée. Ton: empathique et consultatif.', personalizationFields: ['nom', 'entreprise', 'signal', 'suggested_approach'], scheduledAt: '2025-02-20T09:00:00Z', createdAt: '2025-02-18T00:00:00Z', createdBy: 'user-3', companyId: 'comp-1' },
];

// ============================================
// VIBE PROSPECTING - MESSAGES
// ============================================

// ============================================
// QUOTES / DEVIS
// ============================================

export const seedQuotes: any[] = [
  { id: 'q-1', number: 'DEV-2024-0042', clientName: 'Chanas Assurances', clientEmail: 'com@chanas.cm', date: '2024-06-20', expiryDate: '2024-07-20', amount: 3800000, tax: 731500, total: 4531500, status: 'sent', companyId: 'comp-1', items: [{ description: 'Refonte site web vitrine responsive', quantity: 1, unitPrice: 2500000, tax: 481250, total: 2981250 }, { description: 'Photos corporate & portraits dirigeants (x15)', quantity: 1, unitPrice: 1300000, tax: 250250, total: 1550250 }], notes: 'Validité 30 jours. Hébergement 1 an inclus.', createdAt: '2024-06-20T00:00:00Z' },
  { id: 'q-2', number: 'DEV-2024-0043', clientName: 'La Maison du Cacao', clientEmail: 'contact@maisonducacao.cm', date: '2024-06-22', expiryDate: '2024-07-22', amount: 12500000, tax: 2406250, total: 14906250, status: 'accepted', companyId: 'comp-1', items: [{ description: 'Conception UI/UX e-commerce (30 ecrans)', quantity: 1, unitPrice: 4500000, tax: 866250, total: 5366250 }, { description: 'Developpement frontend React + backend API', quantity: 1, unitPrice: 5500000, tax: 1058750, total: 6558750 }, { description: 'Integration paiement MTN MoMo & Orange Money', quantity: 1, unitPrice: 2500000, tax: 481250, total: 2981250 }], notes: 'Paiement 30% a la commande, 40% a la livraison, 30% a la recette.', createdAt: '2024-06-22T00:00:00Z' },
  { id: 'q-3', number: 'DEV-2024-0044', clientName: 'Ministere de la Culture', clientEmail: 'communication@minculture.gov.cm', date: '2024-06-25', expiryDate: '2024-08-25', amount: 45000000, tax: 8662500, total: 53662500, status: 'sent', companyId: 'comp-1', items: [{ description: 'Documentaire "Patrimoines du Cameroun" - 6 episodes x 26min', quantity: 1, unitPrice: 28000000, tax: 5390000, total: 33390000 }, { description: 'Teaser promotionnel & kit de presse digital', quantity: 1, unitPrice: 8000000, tax: 1540000, total: 9540000 }, { description: 'Couverture evenementielle lancement (live + reportage)', quantity: 1, unitPrice: 9000000, tax: 1732500, total: 10732500 }], notes: 'Dossier AAO en cours. Ce devis est indicatif.', createdAt: '2024-06-25T00:00:00Z' },
  { id: 'q-4', number: 'DEV-2024-0045', clientName: 'BOLOLO', clientEmail: 'contact@bololo.cm', date: '2024-06-28', expiryDate: '2024-07-28', amount: 8500000, tax: 1636250, total: 10136250, status: 'converted', companyId: 'comp-1', items: [{ description: 'Application mobile iOS & Android - livraison V1', quantity: 1, unitPrice: 5000000, tax: 962500, total: 5962500 }, { description: 'Application mobile iOS & Android - livraison V2', quantity: 1, unitPrice: 3500000, tax: 673750, total: 4173750 }], notes: 'Converti en facture FAC-2024-00161', createdAt: '2024-06-28T00:00:00Z' },
  { id: 'q-5', number: 'DEV-2024-0046', clientName: 'Promote', clientEmail: 'p.kotto@promote.cm', date: '2024-06-30', expiryDate: '2024-07-30', amount: 18000000, tax: 3465000, total: 21465000, status: 'draft', companyId: 'comp-1', items: [{ description: 'Site vitrine immersif avec visite virtuelle 360', quantity: 1, unitPrice: 8500000, tax: 1636250, total: 10136250 }, { description: 'Video promotionnelle drone + motion design (3min)', quantity: 1, unitPrice: 6500000, tax: 1251250, total: 7751250 }, { description: 'Campagne digitale lancement (1 mois)', quantity: 1, unitPrice: 3000000, tax: 577500, total: 3577500 }], notes: 'En attente validation interne', createdAt: '2024-06-30T00:00:00Z' },
  { id: 'q-6', number: 'DEV-2024-0047', clientName: 'Societe Generale Cameroun', clientEmail: 'marketing@sgc.cm', date: '2024-06-18', expiryDate: '2024-07-18', amount: 8500000, tax: 1636250, total: 10136250, status: 'accepted', companyId: 'comp-1', items: [{ description: 'Conception identite visuelle & charte graphique (60p)', quantity: 1, unitPrice: 5000000, tax: 962500, total: 5962500 }, { description: 'Supports print: flyers, affiches, roll-up (x50)', quantity: 1, unitPrice: 3500000, tax: 673750, total: 4173750 }], notes: 'Phase 1 du contrat branding annuel', createdAt: '2024-06-18T00:00:00Z' },
];

// ============================================
// VIBE PROSPECTING - MESSAGES
// ============================================

export const seedMessages: any[] = [
  { id: 'msg-1', campaignId: 'camp-1', leadId: 'lead-1', leadName: 'Aïssatou Diallo', channel: 'email', subject: 'Production de contenu digital pour Canal+ Afrique', body: 'Bonjour Aïssatou,\n\nJ\'ai remarqué que Canal+ Afrique recrute activement dans la production de contenu digital. C\'est un signe fort d\'ambition créative.\n\nIDIBA Group a accompagné 3 acteurs majeurs des médias en Afrique centrale avec des productions vidéo primées et des stratégies content marketing innovantes.\n\nSeriez-vous ouverte à un échange de 15 minutes sur vos besoins de production ?\n\nCordialement,\nJean-Pierre Moussa - IDIBA Group SARL', aiGenerated: true, aiPrompt: 'Email personnalisé pour Canal+ - signal hiring', tone: 'professional', personalizationScore: 92, status: 'replied', sentAt: '2025-02-15T09:00:00Z', replyContent: 'Bonjour Jean-Pierre,\n\nMerci pour votre message. Je suis effectivement intéressée. Pouvez-vous m\'envoyer un showreel de vos productions ?\n\nAïssatou', createdAt: '2025-02-14T00:00:00Z', companyId: 'comp-1' },
  { id: 'msg-2', campaignId: 'camp-1', leadId: 'lead-7', leadName: 'Kossi Mensah', channel: 'email', subject: 'Audit créatif gratuit pour Ecobank', body: 'Bonjour Kossi,\n\nJ\'ai lu votre retour sur votre agence digitale actuelle. Le manque de créativité coûte cher en engagement.\n\nIDIBA Group propose un audit créatif gratuit de vos campagnes avec 3 recommandations concrètes pour augmenter votre ROAS.\n\nSouhaitez-vous que nous organisions cette analyse ?\n\nCordialement,\nMartin Essomba - IDIBA Group SARL', aiGenerated: true, aiPrompt: 'Email personnalisé pour Ecobank - signal competitor_switch', tone: 'empathetic', personalizationScore: 88, status: 'opened', sentAt: '2025-02-18T10:30:00Z', createdAt: '2025-02-17T00:00:00Z', companyId: 'comp-1' },
  { id: 'msg-3', campaignId: 'camp-2', leadId: 'lead-2', leadName: 'François Ngassa', channel: 'linkedin', subject: '', body: 'Cher François,\n\nFélicitations pour le budget alloué à la campagne 33 Export 2025. C\'est une opportunité exceptionnelle de créer un impact mémorable.\n\nIDIBA Group dispose d\'une expertise spécifique dans les campagnes CPG avec des concepts créatifs primés et une production audiovisuelle de classe internationale.\n\nPourrions-nous vous présenter notre vision créative lors d\'une réunion la semaine prochaine ?\n\nBien à vous,\nMartin Essomba', aiGenerated: true, aiPrompt: 'Message LinkedIn pour SABC - signal funding', tone: 'professional', personalizationScore: 95, status: 'replied', sentAt: '2025-02-12T14:00:00Z', replyContent: 'Bonjour Martin,\n\nMerci pour votre message. Je serais disponible mardi ou jeudi après-midi.\n\nFrançois', createdAt: '2025-02-11T00:00:00Z', companyId: 'comp-1' },
  { id: 'msg-4', leadId: 'lead-8', leadName: 'Yvonne Eboa', channel: 'email', subject: 'Partenariat créatif pour le repositionnement Orange Money', body: 'Chère Yvonne,\n\nFélicitations pour le repositionnement de la marque Orange Money. C\'est un projet ambitieux.\n\nIDIBA Group dispose d\'une expertise complète en branding, production vidéo et campagnes digitales qui pourrait accélérer votre lancement.\n\nPourrions-nous explorer un partenariat gagnant-gagnant ?\n\nCordialement,\nGrace Abena - DA IDIBA Group', aiGenerated: true, aiPrompt: 'Email partenariat pour Orange - signal expansion', tone: 'enthusiastic', personalizationScore: 85, status: 'delivered', sentAt: '2025-02-19T08:00:00Z', createdAt: '2025-02-18T00:00:00Z', companyId: 'comp-1' },
  { id: 'msg-5', leadId: 'lead-6', leadName: 'Marie Claire Tchamba', channel: 'linkedin', subject: '', body: 'Bonjour Marie Claire,\n\nJ\'ai vu votre question sur le contenu RSE. IDIBA Group produit des documentaires d\'impact qui mettent en lumière vos actions communautaires avec authenticité.\n\nNous avons déjà réalisé 5 séries RSE pour des acteurs énergétiques en Afrique. Je serais ravi de partager notre approche.\n\nBien cordialement,\nKoffi Mensah - IDIBA Group', aiGenerated: true, aiPrompt: 'Message LinkedIn pour TotalEnergies - signal pain_point', tone: 'empathetic', personalizationScore: 90, status: 'draft', createdAt: '2025-02-22T00:00:00Z', companyId: 'comp-1' },
];

// ============================================
// ACTIVITY REPORTS
// ============================================

export const seedActivityReports: any[] = [
  { id: 'rep-1', title: 'Rapport d\'activite - Direction Artistique', type: 'daily', periodLabel: '05/08/2026', employeeId: 'emp-1', employeeName: 'Grace Abena', departmentId: 'dept-1', departmentName: 'Direction Artistique', content: 'Aujourd\'hui j\'ai finalise la maquette de la charte graphique pour le client Chanas Assurances. J\'ai egalement participe a la reunion de brainstorming pour la campagne 33 Export de la SABC. En fin de journee, j\'ai revu les storyboards du documentaire patrimoine.', achievements: ['Charte graphique Chanas validee v2', '3 concepts creatifs presentes en reunion', 'Storyboards documentaire revus et approuves'], challenges: ['Delai serre pour la livraison SABC'], nextSteps: ['Finaliser les adaptations maquettes SABC', 'Preparer la presentation client de vendredi'], status: 'submitted', submittedTo: 'user-2', submittedToName: 'Responsable DA', submittedAt: '2026-08-05T17:30:00Z', companyId: 'comp-1', createdAt: '2026-08-05T09:00:00Z', updatedAt: '2026-08-05T17:30:00Z' },
  { id: 'rep-2', title: 'Rapport hebdomadaire - Production Video', type: 'weekly', periodLabel: 'S32-2026', employeeId: 'emp-4', employeeName: 'Jean-Pierre Moussa', departmentId: 'dept-2', departmentName: 'Production Audiovisuelle', content: 'Cette semaine l\'equipe a finalise le tournage du spot publicitaire pour Promote (2 jours de tournage sur le site de Kribi). Le montage du teaser documentaire Patrimoines du Cameroun est a 80%. Nous avons egalement recu et calibre le nouveau materiel drone.', achievements: ['Tournage Promote termine (48h de rush)', 'Montage teaser documentaire a 80%', 'Calibration drone Mavic 3 Pro effectuee'], challenges: ['Conditions meteo defavorables le deuxieme jour de tournage', 'Retard de livraison du materiel d\'eclairage'], nextSteps: ['Livrer le montage final Promote (vendredi)', 'Preparer le tournage drone pour Bocom'], status: 'reviewed_by_hod', submittedTo: 'user-2', submittedToName: 'Responsable Production', submittedAt: '2026-08-04T16:00:00Z', reviewedBy: 'user-2', reviewedByName: 'Responsable Production', reviewedAt: '2026-08-05T10:00:00Z', reviewComment: 'Bon travail. Merci de detailler le planning du tournage Bocom dans le prochain rapport.', companyId: 'comp-1', createdAt: '2026-08-04T16:00:00Z', updatedAt: '2026-08-05T10:00:00Z' },
  { id: 'rep-3', title: 'Rapport mensuel - Developpement Web', type: 'monthly', periodLabel: 'Juillet 2026', employeeId: 'emp-7', employeeName: 'Koffi Mensah', departmentId: 'dept-4', departmentName: 'Developpement Web & Mobile', content: 'En juillet, l\'equipe a livre la V2 de l\'application Bolofo (nouveau module de paiement integre). Nous avons egalement demarre le projet e-commerce La Maison du Cacao (sprint 1 et 2 termines). Le site vitrine de Chanas a ete mis en production.', achievements: ['App Bolofo V2 livree avec paiement MoMo/OM', 'Sprint 1 & 2 e-commerce Cacao termines', 'Site Chanas en production'], challenges: ['Bug de compatibilite iOS 18 detecte et corrige', 'Retard de contenu client pour le site Cacao'], nextSteps: ['Sprint 3 e-commerce Cacao', 'Maintenance et support post-livraison Bolofo', 'Audit performance site Chanas'], status: 'approved', submittedTo: 'user-2', submittedToName: 'Responsable Dev', submittedAt: '2026-07-31T17:00:00Z', reviewedBy: 'user-2', reviewedByName: 'Responsable Dev', reviewedAt: '2026-08-01T09:00:00Z', approvedBy: 'user-1', approvedByName: 'Manager General', approvedAt: '2026-08-02T14:00:00Z', companyId: 'comp-1', createdAt: '2026-07-31T17:00:00Z', updatedAt: '2026-08-02T14:00:00Z' },
  { id: 'rep-4', title: 'Rapport d\'activite - Marketing Digital', type: 'daily', periodLabel: '05/08/2026', employeeId: 'emp-2', employeeName: 'Martin Essomba', departmentId: 'dept-3', departmentName: 'Marketing Digital', content: 'Journee consacree a l\'analyse des campagnes Facebook Ads et Google Ads en cours pour le client Energie du Mali. J\'ai optimise les audiences et reduit le CPA de 15%. J\'ai egalement prepare le rapport mensuel de performance pour la reunion client de demain.', achievements: ['CPA reduit de 15% sur campagnes EDM', 'Rapport mensuel performance finalise', '2 nouvelles audiences lookalike creees'], challenges: ['Budget client insuffisant pour la phase 2'], nextSteps: ['Presenter le rapport mensuel au client', 'Lancer la campagne de retargeting'], status: 'draft', companyId: 'comp-1', createdAt: '2026-08-05T18:00:00Z', updatedAt: '2026-08-05T18:00:00Z' },
];

// ============================================
// INTERNAL LIBRARY DOCUMENTS
// ============================================

export const seedLibraryDocuments: any[] = [
  { id: 'lib-1', title: 'Reglement Interieur IDIBA Group SARL', description: 'Reglement interieur de l\'entreprise applicable a tous les employes. Contient les regles de discipline, horaires, conges, et politique interne.', category: 'reglement', fileName: 'reglement_interieur_idiba_2026.pdf', fileSize: '1.2 Mo', fileType: 'application/pdf', uploadedBy: 'user-1', uploadedByName: 'Manager General', downloadCount: 47, isRestricted: false, tags: ['RH', 'reglement', 'obligatoire'], companyId: 'comp-1', createdAt: '2026-01-15T10:00:00Z', updatedAt: '2026-01-15T10:00:00Z' },
  { id: 'lib-2', title: 'Manuel de Procedure - Processus Creatif', description: 'Description detaillee du processus creatif chez IDIBA Group : brief, recherche, conception, presentation, validation et production.', category: 'procedure', fileName: 'manuel_procedure_processus_creatif.pdf', fileSize: '3.4 Mo', fileType: 'application/pdf', uploadedBy: 'user-2', uploadedByName: 'Responsable DA', downloadCount: 32, isRestricted: false, tags: ['procedure', 'creatif', 'workflow'], companyId: 'comp-1', createdAt: '2026-02-10T14:00:00Z', updatedAt: '2026-02-10T14:00:00Z' },
  { id: 'lib-3', title: 'Charte Graphique IDIBA Group', description: 'Charte graphique officielle de la marque IDIBA Group : logo, couleurs, typographies, regles d\'utilisation et versions.', category: 'manuel', fileName: 'charte_graphique_idiba_v3.pdf', fileSize: '8.7 Mo', fileType: 'application/pdf', uploadedBy: 'user-2', uploadedByName: 'Responsable DA', downloadCount: 28, isRestricted: false, tags: ['branding', 'charte', 'identite'], companyId: 'comp-1', createdAt: '2026-01-20T09:00:00Z', updatedAt: '2026-03-15T11:00:00Z' },
  { id: 'lib-4', title: 'Template - Rapport d\'Activite', description: 'Template standard pour la redaction des rapports d\'activites journaliers, hebdomadaires et mensuels.', category: 'template', fileName: 'template_rapport_activite.docx', fileSize: '45 Ko', fileType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', uploadedBy: 'user-3', uploadedByName: 'Responsable RH', downloadCount: 19, isRestricted: false, tags: ['template', 'rapport', 'RH'], companyId: 'comp-1', createdAt: '2026-04-01T10:00:00Z', updatedAt: '2026-04-01T10:00:00Z' },
  { id: 'lib-5', title: 'Politique de Securite Informatique', description: 'Politique de securite informatique : gestion des mots de passe, acces aux donnees, utilisation des equipements, procedure en cas d\'incident.', category: 'politique', fileName: 'politique_securite_informatique.pdf', fileSize: '890 Ko', fileType: 'application/pdf', uploadedBy: 'user-1', uploadedByName: 'Manager General', downloadCount: 15, isRestricted: true, allowedDepartments: ['dept-4', 'dept-5'], tags: ['securite', 'IT', 'confidentiel'], companyId: 'comp-1', createdAt: '2026-02-01T08:00:00Z', updatedAt: '2026-02-01T08:00:00Z' },
  { id: 'lib-6', title: 'Guide de Formation - Adobe Creative Suite', description: 'Guide de formation interne sur l\'utilisation de la suite Adobe (Photoshop, Illustrator, Premiere Pro, After Effects).', category: 'formation', fileName: 'guide_formation_adobe_suite.pdf', fileSize: '12.5 Mo', fileType: 'application/pdf', uploadedBy: 'user-2', uploadedByName: 'Responsable DA', downloadCount: 22, isRestricted: false, tags: ['formation', 'adobe', 'design'], companyId: 'comp-1', createdAt: '2026-03-10T13:00:00Z', updatedAt: '2026-03-10T13:00:00Z' },
  { id: 'lib-7', title: 'Archives - Contrats Modeles 2024-2025', description: 'Collection de modeles de contrats types utilises par IDIBA Group (contrat de prestation, NDA, contrat de sous-traitance).', category: 'archives', fileName: 'archives_contrats_modeles.zip', fileSize: '2.1 Mo', fileType: 'application/zip', uploadedBy: 'user-5', uploadedByName: 'Responsable Juridique', downloadCount: 8, isRestricted: true, allowedDepartments: ['dept-5'], tags: ['juridique', 'contrats', 'archives'], companyId: 'comp-1', createdAt: '2025-12-20T16:00:00Z', updatedAt: '2025-12-20T16:00:00Z' },
];

// ============================================
// CHATS / MESSAGERIE
// ============================================

export const seedChats: any[] = [
  {
    id: 'chat-1',
    name: 'Direction Generale',
    description: 'Chat officiel de la direction generale',
    type: 'internal',
    scope: 'general',
    createdBy: 'user-1',
    createdByName: 'Martin Essomba',
    createdByRole: 'Administrateur',
    participantIds: ['user-1', 'user-2', 'user-3', 'user-4'],
    participants: [
      { userId: 'user-1', name: 'Martin Essomba', role: 'Administrateur', departmentId: 'dept-1', departmentName: 'Direction Generale', addedBy: 'user-1', addedAt: '2024-01-01T00:00:00Z' },
      { userId: 'user-2', name: 'Sarah Nkolo', role: 'Manager', departmentId: 'dept-3', departmentName: 'Developpement Web & Mobile', addedBy: 'user-1', addedAt: '2024-01-01T00:00:00Z' },
      { userId: 'user-3', name: 'Jean-Pierre Moussa', role: 'Manager', departmentId: 'dept-4', departmentName: 'Marketing Digital', addedBy: 'user-1', addedAt: '2024-01-01T00:00:00Z' },
      { userId: 'user-4', name: 'Amelie Fouda', role: 'Comptable', departmentId: 'dept-6', departmentName: 'Finance & Administration', addedBy: 'user-1', addedAt: '2024-01-01T00:00:00Z' },
    ],
    lastMessageAt: '2024-06-20T10:30:00Z',
    lastMessagePreview: 'Merci pour le retour, je finalise le rapport ce soir.',
    unreadCount: 0,
    isArchived: false,
    companyId: 'comp-1',
    createdAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'chat-2',
    name: 'Projet E-commerce Cacao',
    description: 'Chat dedie au projet de refonte e-commerce La Maison du Cacao',
    type: 'internal',
    scope: 'project',
    createdBy: 'user-2',
    createdByName: 'Sarah Nkolo',
    createdByRole: 'Manager',
    projectId: 'proj-1',
    projectName: 'Refonte Site E-commerce La Maison du Cacao',
    participantIds: ['user-2', 'user-7', 'user-8', 'user-5'],
    participants: [
      { userId: 'user-2', name: 'Sarah Nkolo', role: 'Manager', departmentId: 'dept-3', departmentName: 'Developpement Web & Mobile', addedBy: 'user-2', addedAt: '2024-03-01T00:00:00Z' },
      { userId: 'user-7', name: 'Ingrid Biya', role: 'Developpeur', departmentId: 'dept-3', departmentName: 'Developpement Web & Mobile', addedBy: 'user-2', addedAt: '2024-03-01T00:00:00Z' },
      { userId: 'user-8', name: 'Paul Tchuente', role: 'Developpeur', departmentId: 'dept-3', departmentName: 'Developpement Web & Mobile', addedBy: 'user-2', addedAt: '2024-03-01T00:00:00Z' },
      { userId: 'user-5', name: 'Grace Abena', role: 'Creatif', departmentId: 'dept-2', departmentName: 'Conception Graphique', addedBy: 'user-2', addedAt: '2024-03-05T00:00:00Z' },
    ],
    lastMessageAt: '2024-06-19T16:45:00Z',
    lastMessagePreview: 'Les maquettes sont pretes, on peut commencer l\'integration.',
    unreadCount: 2,
    isArchived: false,
    companyId: 'comp-1',
    createdAt: '2024-03-01T00:00:00Z',
  },
  {
    id: 'chat-3',
    name: 'Departement Conception Graphique',
    description: 'Chat interne du departement Conception Graphique',
    type: 'internal',
    scope: 'department',
    createdBy: 'user-5',
    createdByName: 'Grace Abena',
    createdByRole: 'Creatif',
    departmentId: 'dept-2',
    departmentName: 'Conception Graphique',
    participantIds: ['user-5', 'user-1'],
    participants: [
      { userId: 'user-5', name: 'Grace Abena', role: 'Creatif', departmentId: 'dept-2', departmentName: 'Conception Graphique', addedBy: 'user-5', addedAt: '2024-01-15T00:00:00Z' },
      { userId: 'user-1', name: 'Martin Essomba', role: 'Administrateur', departmentId: 'dept-1', departmentName: 'Direction Generale', addedBy: 'user-5', addedAt: '2024-01-15T00:00:00Z' },
    ],
    lastMessageAt: '2024-06-18T14:20:00Z',
    lastMessagePreview: 'Le client a valide le logo v3, on passe en production.',
    unreadCount: 0,
    isArchived: false,
    companyId: 'comp-1',
    createdAt: '2024-01-15T00:00:00Z',
  },
  {
    id: 'chat-4',
    name: 'Societe Generale Cameroun',
    description: 'Chat avec le client Societe Generale pour le projet branding',
    type: 'external',
    scope: 'client',
    createdBy: 'user-1',
    createdByName: 'Martin Essomba',
    createdByRole: 'Administrateur',
    externalEntityId: 'client-1',
    externalEntityName: 'Societe Generale Cameroun',
    externalEntityType: 'client',
    participantIds: ['user-1', 'user-5', 'user-3'],
    participants: [
      { userId: 'user-1', name: 'Martin Essomba', role: 'Administrateur', departmentId: 'dept-1', departmentName: 'Direction Generale', addedBy: 'user-1', addedAt: '2024-05-01T00:00:00Z' },
      { userId: 'user-5', name: 'Grace Abena', role: 'Creatif', departmentId: 'dept-2', departmentName: 'Conception Graphique', addedBy: 'user-1', addedAt: '2024-05-01T00:00:00Z' },
      { userId: 'user-3', name: 'Jean-Pierre Moussa', role: 'Manager', departmentId: 'dept-4', departmentName: 'Marketing Digital', addedBy: 'user-1', addedAt: '2024-05-01T00:00:00Z' },
    ],
    lastMessageAt: '2024-06-17T11:00:00Z',
    lastMessagePreview: 'Bonjour, nous avons bien recu la proposition. Pouvons-nous organiser une reunion ?',
    unreadCount: 1,
    isArchived: false,
    companyId: 'comp-1',
    createdAt: '2024-05-01T00:00:00Z',
  },
  {
    id: 'chat-5',
    name: 'Fournisseur Imprimerie Douala',
    description: 'Chat avec notre fournisseur d\'impression pour les supports print',
    type: 'external',
    scope: 'vendor',
    createdBy: 'user-1',
    createdByName: 'Martin Essomba',
    createdByRole: 'Administrateur',
    externalEntityId: 'vendor-1',
    externalEntityName: 'Imprimerie Centrale Douala',
    externalEntityType: 'vendor',
    participantIds: ['user-1', 'user-4'],
    participants: [
      { userId: 'user-1', name: 'Martin Essomba', role: 'Administrateur', departmentId: 'dept-1', departmentName: 'Direction Generale', addedBy: 'user-1', addedAt: '2024-02-01T00:00:00Z' },
      { userId: 'user-4', name: 'Amelie Fouda', role: 'Comptable', departmentId: 'dept-6', departmentName: 'Finance & Administration', addedBy: 'user-1', addedAt: '2024-02-01T00:00:00Z' },
    ],
    lastMessageAt: '2024-06-15T09:30:00Z',
    lastMessagePreview: 'Votre commande de flyers est prete, vous pouvez passer la recuperer.',
    unreadCount: 0,
    isArchived: false,
    companyId: 'comp-1',
    createdAt: '2024-02-01T00:00:00Z',
  },
];

export const seedChatMessages: any[] = [
  // Chat-1: Direction Generale
  { id: 'cmsg-1', chatId: 'chat-1', senderId: 'user-1', senderName: 'Martin Essomba', senderRole: 'Administrateur', content: 'Bonjour a tous, bienvenue dans le chat officiel de la direction. N\'hesitez pas a partager vos idees et remontees.', readBy: ['user-1', 'user-2', 'user-3', 'user-4'], reactions: [], isEdited: false, createdAt: '2024-01-01T08:00:00Z' },
  { id: 'cmsg-2', chatId: 'chat-1', senderId: 'user-2', senderName: 'Sarah Nkolo', senderRole: 'Manager', content: 'Merci Martin, c\'est une excellente initiative pour ameliorer la communication interne.', readBy: ['user-1', 'user-2', 'user-3', 'user-4'], reactions: [], isEdited: false, createdAt: '2024-01-01T08:15:00Z' },
  { id: 'cmsg-3', chatId: 'chat-1', senderId: 'user-3', senderName: 'Jean-Pierre Moussa', senderRole: 'Manager', content: 'Tout a fait d\'accord. Je vais partager les avancees de la campagne SGBC ici.', readBy: ['user-1', 'user-2', 'user-3', 'user-4'], reactions: [], isEdited: false, createdAt: '2024-01-01T08:30:00Z' },
  { id: 'cmsg-4', chatId: 'chat-1', senderId: 'user-1', senderName: 'Martin Essomba', senderRole: 'Administrateur', content: 'Parfait. N\'oubliez pas que nous avons la reunion strategique vendredi a 9h.', readBy: ['user-1', 'user-2', 'user-3', 'user-4'], reactions: [], isEdited: false, createdAt: '2024-06-20T10:00:00Z' },
  { id: 'cmsg-5', chatId: 'chat-1', senderId: 'user-4', senderName: 'Amelie Fouda', senderRole: 'Comptable', content: 'Merci pour le retour, je finalise le rapport ce soir.', readBy: ['user-1', 'user-2', 'user-3', 'user-4'], reactions: [], isEdited: false, createdAt: '2024-06-20T10:30:00Z' },

  // Chat-2: Projet E-commerce Cacao
  { id: 'cmsg-6', chatId: 'chat-2', senderId: 'user-2', senderName: 'Sarah Nkolo', senderRole: 'Manager', content: 'Bonjour equipe, ce chat est dedie au projet e-commerce Cacao. Objectif : livraison pour fin aout.', readBy: ['user-2', 'user-7', 'user-8', 'user-5'], reactions: [], isEdited: false, createdAt: '2024-03-01T09:00:00Z' },
  { id: 'cmsg-7', chatId: 'chat-2', senderId: 'user-7', senderName: 'Ingrid Biya', senderRole: 'Developpeur', content: 'Super ! Je commence l\'analyse des maquettes des demain.', readBy: ['user-2', 'user-7', 'user-8', 'user-5'], reactions: [], isEdited: false, createdAt: '2024-03-01T09:15:00Z' },
  { id: 'cmsg-8', chatId: 'chat-2', senderId: 'user-5', senderName: 'Grace Abena', senderRole: 'Creatif', content: 'Les maquettes sont pretes, on peut commencer l\'integration.', readBy: ['user-2', 'user-7'], reactions: [], isEdited: false, createdAt: '2024-06-19T16:45:00Z' },

  // Chat-3: Departement Conception Graphique
  { id: 'cmsg-9', chatId: 'chat-3', senderId: 'user-5', senderName: 'Grace Abena', senderRole: 'Creatif', content: 'Bonjour, ce chat est reserve a notre departement. On partage ici les avancees et les besoins.', readBy: ['user-5', 'user-1'], reactions: [], isEdited: false, createdAt: '2024-01-15T10:00:00Z' },
  { id: 'cmsg-10', chatId: 'chat-3', senderId: 'user-5', senderName: 'Grace Abena', senderRole: 'Creatif', content: 'Le client a valide le logo v3, on passe en production.', readBy: ['user-5', 'user-1'], reactions: [], isEdited: false, createdAt: '2024-06-18T14:20:00Z' },

  // Chat-4: Client Societe Generale
  { id: 'cmsg-11', chatId: 'chat-4', senderId: 'user-1', senderName: 'Martin Essomba', senderRole: 'Administrateur', content: 'Bonjour Madame/Monsieur, nous sommes ravis de collaborer avec Societe Generale sur ce projet de branding.', readBy: ['user-1', 'user-5', 'user-3'], reactions: [], isEdited: false, createdAt: '2024-05-01T10:00:00Z' },
  { id: 'cmsg-12', chatId: 'chat-4', senderId: 'user-5', senderName: 'Grace Abena', senderRole: 'Creatif', content: 'Nous avons prepare 3 propositions de logo. Pouvez-vous nous dire vos preferences ?', readBy: ['user-1', 'user-5', 'user-3'], reactions: [], isEdited: false, createdAt: '2024-05-05T14:00:00Z' },
  { id: 'cmsg-13', chatId: 'chat-4', senderId: 'user-1', senderName: 'Martin Essomba', senderRole: 'Administrateur', content: 'Bonjour, nous avons bien recu la proposition. Pouvons-nous organiser une reunion ?', readBy: ['user-1', 'user-5'], reactions: [], isEdited: false, createdAt: '2024-06-17T11:00:00Z' },

  // Chat-5: Fournisseur Imprimerie
  { id: 'cmsg-14', chatId: 'chat-5', senderId: 'user-1', senderName: 'Martin Essomba', senderRole: 'Administrateur', content: 'Bonjour, nous avons une commande urgente de flyers pour le salon Promote.', readBy: ['user-1', 'user-4'], reactions: [], isEdited: false, createdAt: '2024-02-01T09:00:00Z' },
  { id: 'cmsg-15', chatId: 'chat-5', senderId: 'user-4', senderName: 'Amelie Fouda', senderRole: 'Comptable', content: 'Je confirme le bon de commande envoye. Delai de livraison souhaite : 5 jours.', readBy: ['user-1', 'user-4'], reactions: [], isEdited: false, createdAt: '2024-02-01T09:30:00Z' },
  { id: 'cmsg-16', chatId: 'chat-5', senderId: 'user-1', senderName: 'Martin Essomba', senderRole: 'Administrateur', content: 'Votre commande de flyers est prete, vous pouvez passer la recuperer.', readBy: ['user-1', 'user-4'], reactions: [], isEdited: false, createdAt: '2024-06-15T09:30:00Z' },
];

// ============================================
// PORTAIL EXTERNE - CLIENT / FOURNISSEUR / PARTENAIRE
// ============================================

export const seedPortalUsers: any[] = [
  // Clients
  { id: 'portal-client-1', email: 'contact@sgbc.cm', displayName: 'M. Alain Moussa', portalType: 'client', companyName: 'Societe Generale Cameroun', companyId: 'comp-1', phone: '+237 233 42 51 00', address: 'Boulevard de la Liberte, Douala', city: 'Douala', country: 'Cameroun', ifu: 'M0123456789', rccm: 'RCCM/DLA/2010/B/1234', status: 'active', createdAt: '2024-01-15T00:00:00Z', lastLoginAt: '2024-06-20T08:00:00Z', linkedInternalId: 'client-1', linkedInternalName: 'Societe Generale Cameroun' },
  { id: 'portal-client-2', email: 'cm@nestle.com', displayName: 'Mme Sophie Biya', portalType: 'client', companyName: 'Nestle Cameroun', companyId: 'comp-1', phone: '+237 233 36 12 34', address: 'Rue Joseph Bell, Bonanjo', city: 'Douala', country: 'Cameroun', ifu: 'M0987654321', rccm: 'RCCM/DLA/2005/A/567', status: 'active', createdAt: '2024-02-10T00:00:00Z', lastLoginAt: '2024-06-18T14:30:00Z', linkedInternalId: 'client-2', linkedInternalName: 'Nestle Cameroun' },
  { id: 'portal-client-3', email: 'dg@orange.cm', displayName: 'M. Jean-Paul Eto\'o', portalType: 'client', companyName: 'Orange Cameroun', companyId: 'comp-1', phone: '+237 222 21 11 11', address: 'Avenue Kennedy, Yaounde', city: 'Yaounde', country: 'Cameroun', ifu: 'M0555555555', rccm: 'RCCM/YDE/2008/B/890', status: 'active', createdAt: '2024-03-05T00:00:00Z', lastLoginAt: '2024-06-15T09:00:00Z', linkedInternalId: 'client-3', linkedInternalName: 'Orange Cameroun' },
  // Fournisseurs
  { id: 'portal-vendor-1', email: 'devis@icd.cm', displayName: 'M. Paul Abena', portalType: 'vendor', companyName: 'Imprimerie Centrale Douala', companyId: 'comp-1', phone: '+237 233 45 67 89', address: 'Rue des Palmiers, Akwa', city: 'Douala', country: 'Cameroun', ifu: 'M0111111111', rccm: 'RCCM/DLA/2015/C/111', status: 'active', createdAt: '2024-01-20T00:00:00Z', lastLoginAt: '2024-06-19T10:00:00Z', linkedInternalId: 'vendor-1', linkedInternalName: 'Imprimerie Centrale Douala' },
  { id: 'portal-vendor-2', email: 'contact@serverpro.cm', displayName: 'Mme Grace Nkolo', portalType: 'vendor', companyName: 'ServerPro Afrique', companyId: 'comp-1', phone: '+237 699 88 77 66', address: 'Tech Hub, Bonapriso', city: 'Douala', country: 'Cameroun', ifu: 'M0222222222', rccm: 'RCCM/DLA/2018/D/222', status: 'active', createdAt: '2024-02-15T00:00:00Z', lastLoginAt: '2024-06-10T16:00:00Z', linkedInternalId: 'vendor-2', linkedInternalName: 'ServerPro Afrique' },
  // Partenaires
  { id: 'portal-partner-1', email: 'partners@africacreative.cm', displayName: 'M. Koffi Mensah', portalType: 'partner', companyName: 'Africa Creative Network', companyId: 'comp-1', phone: '+237 677 55 44 33', address: 'Innovation Village, Bonanjo', city: 'Douala', country: 'Cameroun', ifu: 'M0333333333', rccm: 'RCCM/DLA/2019/E/333', status: 'active', createdAt: '2024-03-01T00:00:00Z', lastLoginAt: '2024-06-21T11:00:00Z', linkedInternalId: 'partner-1', linkedInternalName: 'Africa Creative Network' },
  { id: 'portal-partner-2', email: 'team@digitalrise.cm', displayName: 'Mme Ingrid Biya', portalType: 'partner', companyName: 'Digital Rise Consulting', companyId: 'comp-1', phone: '+237 699 11 22 33', address: 'Plateau Business Center', city: 'Yaounde', country: 'Cameroun', ifu: 'M0444444444', rccm: 'RCCM/YDE/2020/F/444', status: 'pending', createdAt: '2024-05-10T00:00:00Z', lastLoginAt: undefined, linkedInternalId: 'partner-2', linkedInternalName: 'Digital Rise Consulting' },
];

export const seedPortalProjects: any[] = [
  { id: 'pproj-1', portalUserId: 'portal-client-1', portalType: 'client', internalProjectId: 'proj-1', title: 'Refonte branding SGBC', description: 'Nouvelle identite visuelle pour la campagne 2024', status: 'in_progress', progress: 65, budget: 15000000, startDate: '2024-03-01', endDate: '2024-08-31', deliverables: [
    { id: 'pdel-1', title: 'Logo principal', description: 'Logo avec declinaisons', status: 'approved', fileUrl: '#', fileName: 'logo_sgbc_v3.zip', submittedAt: '2024-04-15T00:00:00Z', reviewedAt: '2024-04-20T00:00:00Z', reviewComment: 'Excellent travail, valide' },
    { id: 'pdel-2', title: 'Charte graphique', description: 'Document complet de la charte', status: 'submitted', fileUrl: '#', fileName: 'charte_sgbc.pdf', submittedAt: '2024-06-15T00:00:00Z' },
    { id: 'pdel-3', title: 'Mockups affichage', description: 'Mockups pour points de vente', status: 'pending' },
  ], comments: [
    { id: 'pcom-1', authorId: 'user-5', authorName: 'Grace Abena', authorType: 'internal', content: 'Le logo est pret pour validation', createdAt: '2024-04-10T00:00:00Z' },
    { id: 'pcom-2', authorId: 'portal-client-1', authorName: 'M. Alain Moussa', authorType: 'external', content: 'Nous avons valide le logo v3', createdAt: '2024-04-18T00:00:00Z' },
  ], companyId: 'comp-1', createdAt: '2024-03-01T00:00:00Z', updatedAt: '2024-06-15T00:00:00Z' },
  { id: 'pproj-2', portalUserId: 'portal-client-2', portalType: 'client', internalProjectId: 'proj-3', title: 'Campagne Nescafe 2024', description: 'Campagne marketing digitale Nescafe', status: 'in_progress', progress: 40, budget: 8000000, startDate: '2024-05-01', endDate: '2024-09-30', deliverables: [
    { id: 'pdel-4', title: 'Storyboard video', description: 'Storyboard pour spot TV', status: 'submitted', fileUrl: '#', fileName: 'storyboard_nescafe.pdf', submittedAt: '2024-06-10T00:00:00Z' },
  ], comments: [], companyId: 'comp-1', createdAt: '2024-05-01T00:00:00Z', updatedAt: '2024-06-10T00:00:00Z' },
  { id: 'pproj-3', portalUserId: 'portal-vendor-1', portalType: 'vendor', title: 'Fourniture supports print Q2', description: 'Flyers, brochures et rollups pour salons', status: 'delivered', progress: 100, budget: 2500000, startDate: '2024-04-01', endDate: '2024-06-15', deliverables: [
    { id: 'pdel-5', title: 'Flyers Promote', description: '5000 flyers A5', status: 'approved', fileUrl: '#', fileName: 'flyers_promote.pdf', submittedAt: '2024-05-20T00:00:00Z', reviewedAt: '2024-05-22T00:00:00Z', reviewComment: 'Qualite conforme' },
    { id: 'pdel-6', title: 'Rollups SGBC', description: '3 rollups 85x200cm', status: 'approved', fileUrl: '#', fileName: 'rollups_sgbc.pdf', submittedAt: '2024-06-10T00:00:00Z', reviewedAt: '2024-06-12T00:00:00Z' },
  ], comments: [
    { id: 'pcom-3', authorId: 'user-1', authorName: 'Martin Essomba', authorType: 'internal', content: 'Delai respecte, merci', createdAt: '2024-06-15T00:00:00Z' },
  ], companyId: 'comp-1', createdAt: '2024-04-01T00:00:00Z', updatedAt: '2024-06-15T00:00:00Z' },
  { id: 'pproj-4', portalUserId: 'portal-partner-1', portalType: 'partner', title: 'Co-creation Event Tech 2024', description: 'Organisation evenement tech commun', status: 'in_progress', progress: 30, budget: 5000000, startDate: '2024-06-01', endDate: '2024-11-30', deliverables: [
    { id: 'pdel-7', title: 'Plan event', description: 'Planification complete', status: 'submitted', fileUrl: '#', fileName: 'plan_event.pdf', submittedAt: '2024-06-20T00:00:00Z' },
  ], comments: [], companyId: 'comp-1', createdAt: '2024-06-01T00:00:00Z', updatedAt: '2024-06-20T00:00:00Z' },
];

export const seedPortalInvoices: any[] = [
  { id: 'pinv-1', portalUserId: 'portal-client-1', portalType: 'client', internalInvoiceId: 'inv-1', number: 'FAC-2024-001', amount: 7500000, tax: 1443750, total: 8943750, status: 'paid', dueDate: '2024-04-30', paidAt: '2024-04-25T00:00:00Z', items: [
    { description: 'Conception logo + charte graphique', quantity: 1, unitPrice: 5000000, total: 5000000 },
    { description: 'Mockups et declinaisons', quantity: 1, unitPrice: 2500000, total: 2500000 },
  ], companyId: 'comp-1', createdAt: '2024-04-01T00:00:00Z' },
  { id: 'pinv-2', portalUserId: 'portal-client-1', portalType: 'client', internalInvoiceId: 'inv-2', number: 'FAC-2024-005', amount: 5000000, tax: 962500, total: 5962500, status: 'sent', dueDate: '2024-07-31', items: [
    { description: 'Support print campagne SGBC', quantity: 1, unitPrice: 5000000, total: 5000000 },
  ], companyId: 'comp-1', createdAt: '2024-07-01T00:00:00Z' },
  { id: 'pinv-3', portalUserId: 'portal-client-2', portalType: 'client', internalInvoiceId: 'inv-3', number: 'FAC-2024-003', amount: 4000000, tax: 770000, total: 4770000, status: 'paid', dueDate: '2024-06-15', paidAt: '2024-06-10T00:00:00Z', items: [
    { description: 'Strategie digitale Nescafe', quantity: 1, unitPrice: 4000000, total: 4000000 },
  ], companyId: 'comp-1', createdAt: '2024-05-15T00:00:00Z' },
  { id: 'pinv-4', portalUserId: 'portal-vendor-1', portalType: 'vendor', number: 'FAC-F-2024-001', amount: 1500000, tax: 288750, total: 1788750, status: 'paid', dueDate: '2024-05-30', paidAt: '2024-05-28T00:00:00Z', items: [
    { description: 'Flyers + Rollups', quantity: 1, unitPrice: 1500000, total: 1500000 },
  ], companyId: 'comp-1', createdAt: '2024-05-01T00:00:00Z' },
];

export const seedPortalPayments: any[] = [
  { id: 'ppay-1', portalUserId: 'portal-client-1', invoiceId: 'pinv-1', amount: 8943750, method: 'bank_transfer', reference: 'VIR-SGBC-001', status: 'confirmed', paidAt: '2024-04-25T00:00:00Z', companyId: 'comp-1' },
  { id: 'ppay-2', portalUserId: 'portal-client-2', invoiceId: 'pinv-3', amount: 4770000, method: 'bank_transfer', reference: 'VIR-NESTLE-003', status: 'confirmed', paidAt: '2024-06-10T00:00:00Z', companyId: 'comp-1' },
  { id: 'ppay-3', portalUserId: 'portal-vendor-1', invoiceId: 'pinv-4', amount: 1788750, method: 'mobile_money', reference: 'MM-ICD-001', status: 'confirmed', paidAt: '2024-05-28T00:00:00Z', companyId: 'comp-1' },
];

export const seedPortalContracts: any[] = [
  { id: 'pcon-1', portalUserId: 'portal-client-1', portalType: 'client', title: 'Contrat cadre SGBC 2024', description: 'Prestations graphiques et digitales', startDate: '2024-01-01', endDate: '2024-12-31', value: 50000000, status: 'active', fileUrl: '#', companyId: 'comp-1', createdAt: '2024-01-01T00:00:00Z' },
  { id: 'pcon-2', portalUserId: 'portal-client-2', portalType: 'client', title: 'Contrat Nestle 2024', description: 'Campagnes marketing digitales', startDate: '2024-02-01', endDate: '2024-12-31', value: 30000000, status: 'active', fileUrl: '#', companyId: 'comp-1', createdAt: '2024-02-01T00:00:00Z' },
  { id: 'pcon-3', portalUserId: 'portal-vendor-1', portalType: 'vendor', title: 'Contrat fourniture print', description: 'Fourniture supports print recurents', startDate: '2024-01-01', endDate: '2024-12-31', value: 8000000, status: 'active', fileUrl: '#', companyId: 'comp-1', createdAt: '2024-01-01T00:00:00Z' },
  { id: 'pcon-4', portalUserId: 'portal-partner-1', portalType: 'partner', title: 'Accord de partenariat ACN', description: 'Co-creation et partage reseau', startDate: '2024-03-01', endDate: '2025-02-28', value: 15000000, status: 'active', fileUrl: '#', companyId: 'comp-1', createdAt: '2024-03-01T00:00:00Z' },
];

export const seedPortalActivities: any[] = [
  { id: 'pact-1', portalUserId: 'portal-client-1', portalType: 'client', type: 'login', description: 'Connexion au portail', createdAt: '2024-06-20T08:00:00Z', companyId: 'comp-1' },
  { id: 'pact-2', portalUserId: 'portal-client-1', portalType: 'client', type: 'document_view', description: 'Visualisation charte graphique', metadata: { documentId: 'pdel-2' }, createdAt: '2024-06-20T08:15:00Z', companyId: 'comp-1' },
  { id: 'pact-3', portalUserId: 'portal-client-1', portalType: 'client', type: 'comment', description: 'Commentaire sur projet branding', createdAt: '2024-06-18T14:00:00Z', companyId: 'comp-1' },
  { id: 'pact-4', portalUserId: 'portal-vendor-1', portalType: 'vendor', type: 'login', description: 'Connexion au portail', createdAt: '2024-06-19T10:00:00Z', companyId: 'comp-1' },
  { id: 'pact-5', portalUserId: 'portal-vendor-1', portalType: 'vendor', type: 'download', description: 'Telechargement bon de commande', createdAt: '2024-06-19T10:30:00Z', companyId: 'comp-1' },
  { id: 'pact-6', portalUserId: 'portal-partner-1', portalType: 'partner', type: 'login', description: 'Connexion au portail', createdAt: '2024-06-21T11:00:00Z', companyId: 'comp-1' },
];

export const seedPortalNotifications: any[] = [
  { id: 'pnot-1', portalUserId: 'portal-client-1', title: 'Nouveau livrable disponible', message: 'La charte graphique SGBC est disponible pour validation.', type: 'info', read: false, link: '/portal/client/projects', createdAt: '2024-06-15T00:00:00Z' },
  { id: 'pnot-2', portalUserId: 'portal-client-1', title: 'Facture en attente', message: 'La facture FAC-2024-005 est en attente de paiement.', type: 'warning', read: false, link: '/portal/client/invoices', createdAt: '2024-07-01T00:00:00Z' },
  { id: 'pnot-3', portalUserId: 'portal-client-2', title: 'Projet mis a jour', message: 'Le storyboard Nescafe a ete soumis.', type: 'info', read: true, link: '/portal/client/projects', createdAt: '2024-06-10T00:00:00Z' },
  { id: 'pnot-4', portalUserId: 'portal-vendor-1', title: 'Paiement recu', message: 'Votre paiement de 1 788 750 FCFA a ete confirme.', type: 'success', read: false, link: '/portal/vendor/invoices', createdAt: '2024-05-28T00:00:00Z' },
  { id: 'pnot-5', portalUserId: 'portal-partner-1', title: 'Nouveau projet conjoint', message: 'Le projet Event Tech 2024 est lance.', type: 'info', read: true, link: '/portal/partner/projects', createdAt: '2024-06-01T00:00:00Z' },
];

// ============================================
// PORTAIL ACTUALITÉS
// ============================================

export const seedPortalNews: any[] = [
  {
    id: 'pnews-1',
    title: 'IDIBA Group lance son nouveau studio de création digitale à Douala',
    content: 'Nous sommes fiers d\'annoncer l\'ouverture de notre nouveau studio de création digitale au cœur de Bonapriso, Douala. Cet espace de 500m² accueille désormais nos équipes Design, UX/UI et Motion Design dans un environnement propice à l\'innovation. Les clients sont invités à venir découvrir nos capacités de réalité augmentée et nos studios de tournage intégrés.',
    excerpt: 'Ouverture du studio de création digitale à Douala avec espaces AR et studios de tournage.',
    imageUrl: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80',
    category: 'Entreprise',
    targetType: 'all',
    isPublished: true,
    publishedAt: '2024-06-01T10:00:00Z',
    authorId: 'user-1',
    authorName: 'Martin Essomba',
    priority: 'high',
    likes: 12,
    likedBy: ['portal-client-1', 'portal-client-2', 'portal-vendor-1'],
    shares: 5,
    comments: [
      { id: 'nc-1', userId: 'portal-client-1', userName: 'Jean-Pierre A.', content: 'Félicitations ! Très hâte de visiter le studio.', createdAt: '2024-06-01T12:30:00Z' },
      { id: 'nc-2', userId: 'portal-partner-1', userName: 'Sarah K.', content: 'Excellente initiative pour l\'écosystème créatif du Cameroun.', createdAt: '2024-06-02T08:15:00Z' },
    ],
    createdAt: '2024-06-01T10:00:00Z',
    companyId: 'comp-1',
  },
  {
    id: 'pnews-2',
    title: 'Nouvelle offre Print & Packaging pour les entreprises agroalimentaires',
    content: 'IDIBA Group déploie une gamme complète de solutions d\'emballage et de packaging premium destinée aux producteurs agroalimentaires du Cameroun et de la CEMAC. Nos solutions allient durabilité (emballages biodégradables), design premium et conformité aux normes d\'exportation. Demandez votre devis personnalisé dès maintenant.',
    excerpt: 'Gamme complète de packaging durable pour le secteur agroalimentaire avec conformité export.',
    imageUrl: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&q=80',
    category: 'Offres',
    targetType: 'client',
    isPublished: true,
    publishedAt: '2024-06-10T14:30:00Z',
    authorId: 'user-1',
    authorName: 'Martin Essomba',
    priority: 'normal',
    likes: 8,
    likedBy: ['portal-client-1'],
    shares: 3,
    comments: [
      { id: 'nc-3', userId: 'portal-client-2', userName: 'Marie D.', content: 'C\'est exactement ce dont nous avons besoin pour notre nouvelle gamme.', createdAt: '2024-06-11T09:00:00Z' },
    ],
    createdAt: '2024-06-10T14:30:00Z',
    companyId: 'comp-1',
  },
  {
    id: 'pnews-3',
    title: 'Appel à partenaires : Programme de co-création événementielle 2024',
    content: 'Nous lançons notre programme annuel de co-création événementielle pour 2024. Partenaires techniques, agences événementielles et fournisseurs audiovisuels sont invités à soumettre leur dossier de partenariat avant le 30 juillet. Avantages : accès privilégié aux briefs clients, tarifs préférentiels et visibilité sur tous nos supports de communication.',
    excerpt: 'Programme de co-création événementielle 2024 : appel à partenaires et fournisseurs.',
    imageUrl: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&q=80',
    category: 'Partenariat',
    targetType: 'partner',
    isPublished: true,
    publishedAt: '2024-06-15T09:00:00Z',
    authorId: 'user-1',
    authorName: 'Martin Essomba',
    priority: 'high',
    likes: 6,
    likedBy: ['portal-partner-1', 'portal-partner-2'],
    shares: 4,
    comments: [
      { id: 'nc-4', userId: 'portal-partner-2', userName: 'Tech Event Pro', content: 'Nous soumettons notre dossier cette semaine !', createdAt: '2024-06-15T16:45:00Z' },
    ],
    createdAt: '2024-06-15T09:00:00Z',
    companyId: 'comp-1',
  },
  {
    id: 'pnews-4',
    title: 'Nouveaux standards qualité pour les fournisseurs print',
    content: 'À compter du 1er juillet 2024, IDIBA Group met en place de nouveaux standards qualité pour tous ses fournisseurs print. Ces normes couvrent la certification FSC, les encres végétales et les délais de livraison. Un guide complet est disponible dans votre portail. Contactez notre service achats pour toute question.',
    excerpt: 'Nouveaux standards qualité print applicables dès le 1er juillet 2024.',
    imageUrl: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=800&q=80',
    category: 'Qualité',
    targetType: 'vendor',
    isPublished: true,
    publishedAt: '2024-06-18T11:00:00Z',
    authorId: 'user-5',
    authorName: 'Grace Abena',
    priority: 'normal',
    likes: 4,
    likedBy: ['portal-vendor-1'],
    shares: 2,
    comments: [],
    createdAt: '2024-06-18T11:00:00Z',
    companyId: 'comp-1',
  },
  {
    id: 'pnews-5',
    title: 'Témoignage : Société Générale Cameroun renouvelle sa confiance',
    content: 'Après 3 ans de collaboration fructueuse, la Société Générale Cameroun a renouvelé son contrat cadre avec IDIBA Group pour 2 années supplémentaires. Ce renouvellement porte sur l\'ensemble de la communication visuelle, le digital et les événements corporate. Un grand merci à toute l\'équipe SGBC pour cette confiance renouvelée.',
    excerpt: 'Renouvellement du contrat cadre avec la Société Générale Cameroun pour 2 ans.',
    imageUrl: 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=800&q=80',
    category: 'Témoignage',
    targetType: 'all',
    isPublished: true,
    publishedAt: '2024-06-20T16:00:00Z',
    authorId: 'user-1',
    authorName: 'Martin Essomba',
    priority: 'normal',
    likes: 15,
    likedBy: ['portal-client-1', 'portal-client-2', 'portal-vendor-1', 'portal-partner-1'],
    shares: 7,
    comments: [
      { id: 'nc-5', userId: 'portal-client-1', userName: 'Jean-Pierre A.', content: 'Bravo ! La qualité de vos livrables mérite cette fidélité.', createdAt: '2024-06-20T17:00:00Z' },
      { id: 'nc-6', userId: 'portal-vendor-1', userName: 'PrintPro CM', content: 'Un honneur de travailler avec vous sur ce contrat.', createdAt: '2024-06-21T10:30:00Z' },
    ],
    createdAt: '2024-06-20T16:00:00Z',
    companyId: 'comp-1',
  },
  {
    id: 'pnews-6',
    title: 'Mise à jour des conditions générales de vente',
    content: 'Nos conditions générales de vente ont été mises à jour pour refléter les nouvelles réglementations fiscales de la CEMAC. Les principaux changements concernent la TVA (passage à 19,25%), les délais de paiement et les clauses de propriété intellectuelle. Veuillez consulter la nouvelle version dans la section Contrats de votre portail.',
    excerpt: 'Mise à jour des CGV avec les nouvelles réglementations CEMAC et TVA à 19,25%.',
    imageUrl: '',
    category: 'Juridique',
    targetType: 'all',
    isPublished: true,
    publishedAt: '2024-06-25T08:00:00Z',
    authorId: 'user-1',
    authorName: 'Martin Essomba',
    priority: 'high',
    likes: 2,
    likedBy: [],
    shares: 1,
    comments: [],
    createdAt: '2024-06-25T08:00:00Z',
    companyId: 'comp-1',
  },
];

// ============================================
// LOT 1: OPPORTUNITIES (Pipeline Commercial)
// ============================================
export const seedOpportunities: any[] = [
  { id: 'opp-1', title: 'Campagne Digitale Nestlé 2024', clientId: 'client-1', clientName: 'Nestlé Cameroun', contactName: 'Jean Mbarga', contactEmail: 'j.mbarga@nestle.cm', contactPhone: '+237 699 11 22 33', value: 45000000, probability: 75, stage: 'negotiation', expectedCloseDate: '2024-08-15', source: 'Prospection', assignedTo: 'user-3', assignedToName: 'Jean-Pierre Moussa', notes: 'Proposition envoyée, en attente de validation du budget.', products: [{ id: 'op-1', name: 'Stratégie Social Media', quantity: 1, unitPrice: 15000000, total: 15000000 }, { id: 'op-2', name: 'Production Vidéo', quantity: 3, unitPrice: 8000000, total: 24000000 }, { id: 'op-3', name: 'Influence Marketing', quantity: 1, unitPrice: 6000000, total: 6000000 }], activities: [{ id: 'oa-1', type: 'meeting', description: 'Présentation stratégique au siège de Nestlé Douala', createdBy: 'user-3', createdByName: 'Jean-Pierre Moussa', createdAt: '2024-06-15T10:00:00Z' }, { id: 'oa-2', type: 'email', description: 'Envoi de la proposition commerciale détaillée', createdBy: 'user-3', createdByName: 'Jean-Pierre Moussa', createdAt: '2024-06-18T14:30:00Z' }], createdAt: '2024-06-10T00:00:00Z', updatedAt: '2024-06-20T00:00:00Z', companyId: 'comp-1' },
  { id: 'opp-2', title: 'Refonte Site E-commerce SGBC', clientId: 'client-2', clientName: 'Société Générale Cameroun', contactName: 'Marie Tchana', contactEmail: 'm.tchana@sgbc.cm', value: 28000000, probability: 60, stage: 'proposal', expectedCloseDate: '2024-09-01', source: "Appel d'offres", assignedTo: 'user-2', assignedToName: 'Sarah Nkolo', notes: "En phase de réponse à l'appel d'offres. Délai technique validé.", products: [{ id: 'op-4', name: 'Développement Frontend', quantity: 1, unitPrice: 12000000, total: 12000000 }, { id: 'op-5', name: 'Intégration API Bancaire', quantity: 1, unitPrice: 10000000, total: 10000000 }, { id: 'op-6', name: 'UX/UI Design', quantity: 1, unitPrice: 6000000, total: 6000000 }], activities: [{ id: 'oa-3', type: 'call', description: 'Appel de qualification avec le Directeur IT', createdBy: 'user-2', createdByName: 'Sarah Nkolo', createdAt: '2024-06-22T09:00:00Z' }], createdAt: '2024-06-20T00:00:00Z', updatedAt: '2024-06-25T00:00:00Z', companyId: 'comp-1' },
  { id: 'opp-3', title: 'Série de Podcasts Tech CEMAC', clientId: 'client-3', clientName: 'MTN Cameroun', contactName: 'Paul Ndongo', contactEmail: 'p.ndongo@mtn.cm', value: 12000000, probability: 40, stage: 'qualification', expectedCloseDate: '2024-10-01', source: 'Inbound', assignedTo: 'user-6', assignedToName: 'Koffi Mensah', notes: 'Le client souhaite 12 épisodes sur la tech en Afrique centrale.', products: [{ id: 'op-7', name: 'Production Podcast', quantity: 12, unitPrice: 800000, total: 9600000 }, { id: 'op-8', name: 'Distribution & Promotion', quantity: 1, unitPrice: 2400000, total: 2400000 }], activities: [{ id: 'oa-4', type: 'meeting', description: 'Découverte des besoins avec le service marketing', createdBy: 'user-6', createdByName: 'Koffi Mensah', createdAt: '2024-06-28T11:00:00Z' }], createdAt: '2024-06-25T00:00:00Z', updatedAt: '2024-06-28T00:00:00Z', companyId: 'comp-1' },
  { id: 'opp-4', title: 'Campagne Publicitaire TotalEnergies', clientId: 'client-4', clientName: 'TotalEnergies Marketing', contactName: 'François Eyenga', contactEmail: 'f.eyenga@totalenergies.cm', value: 65000000, probability: 90, stage: 'closed_won', expectedCloseDate: '2024-07-01', actualCloseDate: '2024-07-01', source: 'Partenariat existant', assignedTo: 'user-1', assignedToName: 'Martin Essomba', notes: 'Contrat signé. Lancement prévu le 15 juillet.', products: [{ id: 'op-9', name: 'Spot TV 30s', quantity: 10, unitPrice: 3500000, total: 35000000 }, { id: 'op-10', name: 'Campagne Digital', quantity: 1, unitPrice: 20000000, total: 20000000 }, { id: 'op-11', name: 'Activation Terrain', quantity: 5, unitPrice: 2000000, total: 10000000 }], activities: [{ id: 'oa-5', type: 'meeting', description: 'Signature du contrat au siège', createdBy: 'user-1', createdByName: 'Martin Essomba', createdAt: '2024-06-30T16:00:00Z' }], createdAt: '2024-06-01T00:00:00Z', updatedAt: '2024-07-01T00:00:00Z', companyId: 'comp-1' },
  { id: 'opp-5', title: 'Application Mobile Université de Douala', clientId: 'client-5', clientName: 'Université de Douala', contactName: 'Prof. Nkeng', contactEmail: 'n.keng@univ-douala.cm', value: 18000000, probability: 30, stage: 'prospecting', expectedCloseDate: '2024-11-01', source: 'Prospection', assignedTo: 'user-7', assignedToName: 'Ingrid Biya', notes: 'Premier contact établi. En attente du cahier des charges.', products: [{ id: 'op-12', name: 'Développement App Mobile', quantity: 1, unitPrice: 15000000, total: 15000000 }, { id: 'op-13', name: 'Maintenance 1 an', quantity: 1, unitPrice: 3000000, total: 3000000 }], activities: [{ id: 'oa-6', type: 'call', description: 'Prise de contact avec le service informatique', createdBy: 'user-7', createdByName: 'Ingrid Biya', createdAt: '2024-07-05T10:00:00Z' }], createdAt: '2024-07-01T00:00:00Z', updatedAt: '2024-07-05T00:00:00Z', companyId: 'comp-1' },
  { id: 'opp-6', title: 'Branding Chanas Assurances', clientId: 'client-6', clientName: 'Chanas Assurances', contactName: 'Alice Fotso', contactEmail: 'a.fotso@chanas.cm', value: 8500000, probability: 55, stage: 'proposal', expectedCloseDate: '2024-08-30', source: 'Référence', assignedTo: 'user-5', assignedToName: 'Grace Abena', notes: 'Nouvelle identité visuelle + charte graphique.', products: [{ id: 'op-14', name: 'Logo & Identité', quantity: 1, unitPrice: 3500000, total: 3500000 }, { id: 'op-15', name: 'Charte Graphique', quantity: 1, unitPrice: 2500000, total: 2500000 }, { id: 'op-16', name: 'Supports Print', quantity: 1, unitPrice: 2500000, total: 2500000 }], activities: [{ id: 'oa-7', type: 'meeting', description: 'Brief créatif avec la direction', createdBy: 'user-5', createdByName: 'Grace Abena', createdAt: '2024-07-08T14:00:00Z' }], createdAt: '2024-07-05T00:00:00Z', updatedAt: '2024-07-08T00:00:00Z', companyId: 'comp-1' },
];

// ============================================
// LOT 2: TIME TRACKING SEED
// ============================================
export const seedTimeEntries: any[] = [
  { id: 'te-1', projectId: 'proj-1', projectName: 'Campagne Nestlé Q3', taskId: 'task-1', taskName: 'Storyboard vidéo', userId: 'user-5', userName: 'Grace Abena', description: 'Conception storyboard principal', startTime: '2024-07-01T08:00:00Z', endTime: '2024-07-01T12:00:00Z', duration: 240, billable: true, hourlyRate: 5000, cost: 20000, date: '2024-07-01', createdAt: '2024-07-01T12:00:00Z' },
  { id: 'te-2', projectId: 'proj-1', projectName: 'Campagne Nestlé Q3', taskId: 'task-2', taskName: 'Montage vidéo', userId: 'user-6', userName: 'Koffi Mensah', description: 'Montage première version', startTime: '2024-07-01T13:00:00Z', endTime: '2024-07-01T18:00:00Z', duration: 300, billable: true, hourlyRate: 4500, cost: 22500, date: '2024-07-01', createdAt: '2024-07-01T18:00:00Z' },
  { id: 'te-3', projectId: 'proj-2', projectName: 'Site E-commerce SGBC', taskId: 'task-3', taskName: 'Développement API', userId: 'user-2', userName: 'Sarah Nkolo', description: 'Endpoints authentification', startTime: '2024-07-02T08:00:00Z', endTime: '2024-07-02T16:00:00Z', duration: 480, billable: true, hourlyRate: 6000, cost: 48000, date: '2024-07-02', createdAt: '2024-07-02T16:00:00Z' },
  { id: 'te-4', projectId: 'proj-2', projectName: 'Site E-commerce SGBC', taskId: 'task-4', taskName: 'Composants React', userId: 'user-7', userName: 'Ingrid Biya', description: 'Composants panier et checkout', startTime: '2024-07-02T09:00:00Z', endTime: '2024-07-02T17:00:00Z', duration: 480, billable: true, hourlyRate: 5000, cost: 40000, date: '2024-07-02', createdAt: '2024-07-02T17:00:00Z' },
  { id: 'te-5', projectId: 'proj-3', projectName: 'Application Mobile Université', taskId: 'task-5', taskName: 'Maquettes UI', userId: 'user-5', userName: 'Grace Abena', description: 'Maquettes écrans principaux', startTime: '2024-07-03T08:00:00Z', endTime: '2024-07-03T14:00:00Z', duration: 360, billable: true, hourlyRate: 5000, cost: 30000, date: '2024-07-03', createdAt: '2024-07-03T14:00:00Z' },
];

// ============================================
// LOT 4: HR CONTRACTS SEED
// ============================================
export const seedContracts: any[] = [
  { id: 'contract-1', employeeId: 'emp-1', employeeName: 'Martin Essomba', type: 'cdi', startDate: '2019-06-15', salary: 2500000, position: 'PDG / Directeur Général', department: 'Direction Générale', benefits: ['Véhicule de fonction', 'Téléphone', 'Assurance santé premium'], status: 'active', createdAt: '2019-06-15T00:00:00Z' },
  { id: 'contract-2', employeeId: 'emp-2', employeeName: 'Sarah Nkolo', type: 'cdi', startDate: '2019-07-01', salary: 1800000, position: 'Lead Developer', department: 'Développement Web & Mobile', benefits: ['Téléphone', 'Formation continue'], status: 'active', createdAt: '2019-07-01T00:00:00Z' },
  { id: 'contract-3', employeeId: 'emp-8', employeeName: 'Paul Tchuente', type: 'cdd', startDate: '2023-06-01', endDate: '2024-12-31', salary: 750000, position: 'Développeur Backend', department: 'Développement Web & Mobile', benefits: ['Téléphone'], status: 'active', createdAt: '2023-06-01T00:00:00Z' },
];

// ============================================
// LOT 5: EMAIL TEMPLATES SEED
// ============================================
export const seedEmailTemplates: any[] = [
  { id: 'tmpl-1', name: 'Premier contact - Digital', subject: 'Propulser {{entreprise}} vers le digital', body: 'Bonjour {{prenom}},\n\nJe suis {{expediteur}} de IDIBA Group. Nous accompagnons les entreprises comme {{entreprise}} dans leur transformation digitale.\n\nSeriez-vous disponible pour un échange de 15 minutes cette semaine ?\n\nCordialement,', category: 'Prospection', abTestVariant: 'A', openRate: 42, clickRate: 12, replyRate: 8, usageCount: 156, createdAt: '2024-06-01T00:00:00Z' },
  { id: 'tmpl-2', name: 'Relance proposition', subject: 'Re: Proposition pour {{entreprise}}', body: 'Bonjour {{prenom}},\n\nJe me permets de relancer notre proposition du {{date_proposition}}.\n\nAvez-vous eu le temps de la consulter ? Je reste disponible pour répondre à vos questions.\n\nCordialement,', category: 'Relance', abTestVariant: 'A', openRate: 65, clickRate: 18, replyRate: 15, usageCount: 89, createdAt: '2024-06-10T00:00:00Z' },
  { id: 'tmpl-3', name: 'Suivi après rendez-vous', subject: 'Merci pour notre échange - Prochaines étapes', body: 'Bonjour {{prenom}},\n\nMerci pour le temps accordé lors de notre rendez-vous du {{date_rdv}}.\n\nComme convenu, je vous envoie les éléments suivants :\n\nCordialement,', category: 'Suivi', abTestVariant: 'B', openRate: 78, clickRate: 25, replyRate: 22, usageCount: 67, createdAt: '2024-06-15T00:00:00Z' },
];

// ============================================
// LOT 6: PORTAL TICKETS SEED
// ============================================
export const seedPortalTickets: any[] = [
  { id: 'pticket-1', portalUserId: 'portal-client-1', portalUserName: 'Jean Moussa (Nestlé)', portalType: 'client', subject: 'Demande de modification sur la campagne Q3', description: 'Nous souhaiterions ajuster les visuels de la campagne pour inclure le nouveau produit.', status: 'in_progress', priority: 'high', assignedTo: 'user-3', assignedToName: 'Jean-Pierre Moussa', responses: [{ id: 'ptr-1', userId: 'user-3', userName: 'Jean-Pierre Moussa', isStaff: true, content: 'Bonjour Jean, nous prenons en compte votre demande. Un créatif vous contactera sous 24h.', createdAt: '2024-07-02T10:00:00Z' }], createdAt: '2024-07-01T09:00:00Z', updatedAt: '2024-07-02T10:00:00Z' },
  { id: 'pticket-2', portalUserId: 'portal-client-2', portalUserName: 'Marie Tchana (SGBC)', portalType: 'client', subject: "Problème d'accès au portail", description: 'Je ne parviens plus à me connecter depuis ce matin.', status: 'resolved', priority: 'medium', assignedTo: 'user-2', assignedToName: 'Sarah Nkolo', responses: [{ id: 'ptr-2', userId: 'user-2', userName: 'Sarah Nkolo', isStaff: true, content: 'Problème résolu. Votre mot de passe a été réinitialisé.', createdAt: '2024-07-03T11:00:00Z' }], createdAt: '2024-07-03T08:00:00Z', updatedAt: '2024-07-03T11:00:00Z' },
];

// ============================================
// LOT 7: AUDIT LOG SEED
// ============================================
export const seedAuditLogs: any[] = [
  { id: 'audit-1', userId: 'user-1', userName: 'Martin Essomba', action: 'CREATE', entityType: 'invoice', entityId: 'FAC-2024-00161', details: 'Création facture BOLOLO 7 393 500 FCFA', createdAt: '2024-07-01T10:00:00Z' },
  { id: 'audit-2', userId: 'user-4', userName: 'Amélie Fouda', action: 'UPDATE', entityType: 'invoice', entityId: 'FAC-2024-00156', details: 'Changement statut: En attente -> Payée', createdAt: '2024-07-01T14:00:00Z' },
  { id: 'audit-3', userId: 'user-2', userName: 'Sarah Nkolo', action: 'DELETE', entityType: 'task', entityId: 'task-12', details: 'Suppression tâche obsolète projet SGBC', createdAt: '2024-07-02T09:00:00Z' },
  { id: 'audit-4', userId: 'user-1', userName: 'Martin Essomba', action: 'LOGIN', entityType: 'session', entityId: 'sess-001', details: 'Connexion depuis Douala', createdAt: '2024-07-03T08:00:00Z' },
];



// ============================================
// LOT 8A: FEEDBACK 360 SEED
// ============================================
export const seedFeedback360: any[] = [
  {
    id: 'fb-1',
    reviewId: 'perf-1',
    fromName: 'Sarah Nkolo',
    relationship: 'peer',
    score: 4,
    comment: 'Excellent travail sur les projets SGBC. Tres reactif et professionnel.',
    createdAt: '2024-07-05T10:00:00Z',
    companyId: 'comp-1',
  },
  {
    id: 'fb-2',
    reviewId: 'perf-1',
    fromName: 'Jean-Pierre Moussa',
    relationship: 'peer',
    score: 5,
    comment: 'Un pilier de l equipe technique. A depasse tous les objectifs cette annee.',
    createdAt: '2024-07-05T11:00:00Z',
    companyId: 'comp-1',
  },
  {
    id: 'fb-3',
    reviewId: 'perf-2',
    fromName: 'Martin Essomba',
    relationship: 'manager',
    score: 4,
    comment: 'Bonne gestion de projet. A ameliorer sur la documentation technique.',
    createdAt: '2024-07-06T09:00:00Z',
    companyId: 'comp-1',
  },
];

export const seedPersonalDevelopmentPlans: any[] = [
  {
    id: 'pdp-1',
    employeeId: 'emp-1',
    employeeName: 'Martin Essomba',
    goal: 'Certification AWS Solutions Architect',
    deadline: '2024-12-31',
    resources: 'Budget formation 500 000 FCFA, mentor externe',
    status: 'active',
    progress: 35,
    createdAt: '2024-07-01T00:00:00Z',
    companyId: 'comp-1',
  },
  {
    id: 'pdp-2',
    employeeId: 'emp-2',
    employeeName: 'Sarah Nkolo',
    goal: 'Formation Management Agile (PSM I)',
    deadline: '2024-10-15',
    resources: 'Cours en ligne Scrum.org, ateliers internes',
    status: 'active',
    progress: 60,
    createdAt: '2024-06-15T00:00:00Z',
    companyId: 'comp-1',
  },
  {
    id: 'pdp-3',
    employeeId: 'emp-3',
    employeeName: 'Jean-Pierre Moussa',
    goal: 'Perfectionnement React Avance + TypeScript',
    deadline: '2024-09-30',
    resources: 'Documentation, projets internes, mentoring',
    status: 'completed',
    progress: 100,
    createdAt: '2024-05-01T00:00:00Z',
    companyId: 'comp-1',
  },
];



// ============================================
// LOT 8: MEETINGS SEED
// ============================================
export const seedMeetings: any[] = [
  {
    id: 'meet-1',
    title: 'Réunion hebdomadaire - Direction',
    type: 'video',
    participants: [
      { userId: 'user-1', userName: 'Martin Essomba', isAudioOn: true, isVideoOn: true, isScreenSharing: false },
      { userId: 'user-2', userName: 'Sarah Nkolo', isAudioOn: true, isVideoOn: true, isScreenSharing: false },
      { userId: 'user-3', userName: 'Jean-Pierre Moussa', isAudioOn: true, isVideoOn: false, isScreenSharing: false },
    ],
    startTime: '2024-07-05T09:00:00Z',
    status: 'scheduled',
    roomId: 'room-dir-001',
    chatId: 'chat-dir-001',
    createdBy: 'user-1',
    createdByName: 'Martin Essomba',
    createdAt: '2024-07-01T10:00:00Z',
    companyId: 'comp-1',
  },
  {
    id: 'meet-2',
    title: 'Point projet SGBC',
    type: 'screen_share',
    participants: [
      { userId: 'user-3', userName: 'Jean-Pierre Moussa', isAudioOn: true, isVideoOn: true, isScreenSharing: true },
      { userId: 'user-5', userName: 'Gilles Kenfack', isAudioOn: true, isVideoOn: true, isScreenSharing: false },
      { userId: 'user-6', userName: 'Inès Biya', isAudioOn: true, isVideoOn: false, isScreenSharing: false },
    ],
    startTime: '2024-07-03T14:00:00Z',
    status: 'ended',
    roomId: 'room-sgbc-001',
    chatId: 'chat-sgbc-001',
    recordingUrl: '/recordings/point_sgbc_030724.mp4',
    createdBy: 'user-3',
    createdByName: 'Jean-Pierre Moussa',
    createdAt: '2024-07-02T16:00:00Z',
  },
];

export const seedLoans: any[] = [
  {
    id: 'loan-1',
    employeeId: 'emp-2',
    employeeName: 'Sarah Nkolo',
    loanType: 'pret_equipement',
    totalAmount: 600000,
    monthlyDeduction: 50000,
    remainingAmount: 350000,
    startDate: '2024-01-01',
    endDate: '2024-12-31',
    status: 'active',
    companyId: 'comp-1',
    createdAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'loan-2',
    employeeId: 'emp-3',
    employeeName: 'Jean-Pierre Moussa',
    loanType: 'avance_salaire',
    totalAmount: 150000,
    monthlyDeduction: 75000,
    remainingAmount: 75000,
    startDate: '2024-06-01',
    endDate: '2024-07-31',
    status: 'active',
    companyId: 'comp-1',
    createdAt: '2024-06-01T00:00:00Z',
  },
];
