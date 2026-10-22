// ============================================
// IDIBAGES - TypeScript Global Types
// ============================================

export type UserRole = 'admin' | 'manager' | 'accountant' | 'employee' | 'viewer';

export type UserStatus = 'active' | 'inactive' | 'pending';

export interface User {
  uid: string;
  email: string;
  displayName: string;
  roleId: string;
  roleName: string;
  companyId: string;
  departmentId?: string;
  avatar?: string;
  status: UserStatus;
  createdAt: string;
  permissions: string[];
}

export interface Company {
  id: string;
  name: string;
  logo?: string;
  address: string;
  city: string;
  country: string;
  rccm?: string;
  idu?: string;
  ifu?: string;
  currency: string;
  primaryColor: string;
  secondaryColor: string;
  createdAt: string;
}

export interface Role {
  id: string;
  name: string;
  permissions: string[];
  isSystem: boolean;
  description: string;
}

export interface Department {
  id: string;
  name: string;
  managerId: string;
  companyId: string;
  employeeCount: number;
  managerName?: string;
}

export type ProjectStatus = 'todo' | 'in_progress' | 'review' | 'completed' | 'archived';

export interface Project {
  id: string;
  name: string;
  description: string;
  status: ProjectStatus;
  companyId: string;
  budget: number;
  spent: number;
  progress: number;
  startDate: string;
  endDate: string;
  members: string[];
  createdAt: string;
}

export type TaskStatus = 'todo' | 'in_progress' | 'review' | 'done';
export type TaskPriority = 'high' | 'medium' | 'low';

export interface Task {
  id: string;
  projectId: string;
  title: string;
  description: string;
  assignedTo: string;
  assignedToName: string;
  assignedToAvatar?: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string;
  subtasks: { title: string; completed: boolean }[];
  createdAt: string;
}

export type InvoiceStatus = 'paid' | 'pending' | 'overdue' | 'cancelled' | 'draft';

export interface Invoice {
  id: string;
  number: string;
  clientName: string;
  clientEmail: string;
  clientNiu?: string;
  clientRccm?: string;
  date: string;
  dueDate: string;
  amount: number;
  tax: number;
  total: number;
  status: InvoiceStatus;
  companyId: string;
  items: InvoiceItem[];
  notes?: string;
  createdAt: string;
}

export interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  tax: number;
  total: number;
}

export type QuoteStatus = 'draft' | 'sent' | 'counter_proposal' | 'accepted' | 'rejected' | 'expired' | 'converted';

export interface Quote {
  id: string;
  number: string;
  clientName: string;
  clientEmail: string;
  date: string;
  expiryDate: string;
  amount: number;
  tax: number;
  total: number;
  status: QuoteStatus;
  companyId: string;
  items: InvoiceItem[];
  notes?: string;
  createdAt: string;
}

export type SalesOrderStatus = 'draft' | 'confirmed' | 'in_progress' | 'partially_delivered' | 'delivered' | 'cancelled';

export interface SalesOrderItem {
  productId?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  tax: number;
  total: number;
}

export interface SalesOrder {
  id: string;
  number: string;
  clientId?: string;
  clientName: string;
  clientEmail?: string;
  date: string;
  expectedDeliveryDate?: string;
  deliveryAddress?: string;
  amount: number;
  tax: number;
  total: number;
  status: SalesOrderStatus;
  companyId: string;
  items: SalesOrderItem[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type DeliveryNoteStatus = 'draft' | 'prepared' | 'shipped' | 'delivered' | 'cancelled';

export interface DeliveryNote {
  id: string;
  number: string;
  orderId?: string;
  orderNumber?: string;
  clientId?: string;
  clientName: string;
  clientEmail?: string;
  date: string;
  deliveryDate?: string;
  deliveryAddress?: string;
  carrier?: string;
  trackingNumber?: string;
  status: DeliveryNoteStatus;
  companyId: string;
  items: SalesOrderItem[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AccountingEntry {
  id: string;
  date: string;
  journal: string;
  pieceNumber: string;
  accountCode: string;
  accountLabel: string;
  label: string;
  debit: number;
  credit: number;
  companyId: string;
  analyticCode?: string;
  transactionAmount?: number;
  transactionCurrency?: string;
  exchangeRate?: number;
  baseCurrency?: string;
}

export type BankTransactionStatus = 'unmatched' | 'matched' | 'ignored';

export interface BankTransaction {
  id: string;
  accountName: string;
  bookingDate: string;
  label: string;
  reference?: string;
  amount: number;
  direction: 'credit' | 'debit';
  status: BankTransactionStatus;
  accountingEntryId?: string;
  companyId: string;
}

export interface FinanceBudget {
  id: string;
  name: string;
  analyticCode: string;
  period: string;
  amount: number;
  companyId: string;
}

export interface ChartAccount {
  id: string;
  code: string;
  label: string;
  category: string;
  parentId?: string;
  children?: ChartAccount[];
}

export type AssetStatus = 'active' | 'maintenance' | 'disposed' | 'out_of_service';

export interface Asset {
  id: string;
  name: string;
  category: string;
  serialNumber: string;
  description: string;
  acquisitionDate: string;
  value: number;
  depreciation: number;
  netValue: number;
  location: string;
  status: AssetStatus;
  companyId: string;
  currencyCode?: string;
  usefulLifeYears?: number;
  depreciationMethod?: 'linear' | 'degressive';
  depreciationStartDate?: string;
  depreciationPostedYears?: number[];
  image?: string;
  qrCode?: string;
}

export type TicketStatus = 'new' | 'open' | 'in_progress' | 'waiting' | 'resolved' | 'closed';
export type TicketPriority = 'critical' | 'high' | 'medium' | 'low';

export interface Ticket {
  id: string;
  subject: string;
  description: string;
  requesterId: string;
  requesterName: string;
  category: string;
  priority: TicketPriority;
  status: TicketStatus;
  assignedTo?: string;
  assignedToName?: string;
  createdAt: string;
  updatedAt: string;
  comments: TicketComment[];
}

export interface TicketComment {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  content: string;
  createdAt: string;
  isInternal: boolean;
}

export type IdeaStatus = 'proposed' | 'submitted' | 'in_review' | 'approved' | 'rejected' | 'under_review' | 'in_development' | 'implemented';

export interface IdeaComment {
  id: string;
  userId: string;
  userName: string;
  content: string;
  createdAt: string;
}

export interface Idea {
  id: string;
  title: string;
  description: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  category: string;
  tags: string[];
  upvotes: number;
  hasUpvoted: boolean;
  likedBy: string[];
  comments: number;
  commentsList: IdeaComment[];
  status: IdeaStatus;
  createdAt: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  type: 'social' | 'blog' | 'newsletter' | 'event' | 'meeting';
  startDate: string;
  endDate: string;
  description: string;
  assignees: string[];
  projectId?: string;
  color: string;
}

export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  link?: string;
}

export interface Workflow {
  id: string;
  name: string;
  description: string;
  triggerType: string;
  steps: WorkflowStep[];
  isActive: boolean;
  companyId: string;
}

export interface WorkflowStep {
  id: string;
  type: 'condition' | 'action';
  name: string;
  config: Record<string, unknown>;
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  entityType: string;
  entityId: string;
  details: string;
  timestamp: string;
}

export interface Expense {
  id: string;
  description: string;
  amount: number;
  category: string;
  date: string;
  employeeId: string;
  employeeName: string;
  status: 'pending' | 'approved' | 'rejected';
  companyId: string;
  currencyCode?: string;
  receipt?: string;
}

// ============================================
// NEW TYPES - HR, CLIENTS, PAYROLL
// ============================================

export interface Employee {
  id: string;
  userId?: string;
  matricule: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  phone?: string;
  birthDate?: string;
  hireDate: string;
  departmentId: string;
  departmentName: string;
  position: string;
  contractType: 'CDI' | 'CDD' | 'STAGE' | 'CONSULTANT';
  grossSalary: number;
  netSalary: number;
  cnpsNumber: string;
  status: 'active' | 'on_leave' | 'suspended' | 'terminated';
  address?: string;
  emergencyContact?: string;
  bankAccount?: string;
  bankName?: string;
  bankCode?: string;
  photo?: string;
  photoUrl?: string;
  gender?: 'male' | 'female';
  city?: string;
  country?: string;
  createdAt?: string;
  companyId: string;
}

export type LeaveType = 'annual' | 'sick' | 'maternity' | 'paternity' | 'unpaid' | 'training';
export type LeaveStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';

export interface Leave {
  id: string;
  employeeId: string;
  employeeName: string;
  type: LeaveType;
  startDate: string;
  endDate: string;
  days: number;
  reason: string;
  status: LeaveStatus;
  approvedBy?: string;
  createdAt: string;
}

export type CandidateStatus = 'new' | 'screening' | 'interview' | 'technical' | 'offer' | 'hired' | 'rejected';

export interface Candidate {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  position: string;
  departmentId: string;
  status: CandidateStatus;
  source: string;
  resumeUrl?: string;
  notes: string;
  rating: number;
  interviewDate?: string;
  salaryExpectation: number;
  createdAt: string;
  companyId: string;
}

export interface PayrollItem {
  id: string;
  employeeId: string;
  employeeName: string;
  month: string;
  year: number;
  grossSalary: number;
  cnpsEmployee: number;
  cnpsEmployer: number;
  crtv: number;
  cac: number;
  cfc: number;
  commissions: number;
  overtime: number;
  taxableIncome: number;
  irpp: number;
  taxCredit: number;
  advancePayment: number;
  otherDeductions: number;
  netSalary: number;
  employerCost: number;
  payslipGenerated: boolean;
  status: 'draft' | 'confirmed' | 'paid';
  companyId: string;
}

export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  country: string;
  ifu?: string;
  rccm?: string;
  contactName: string;
  contactEmail: string;
  type: 'entreprise' | 'particulier' | 'administration';
  sector: string;
  totalInvoiced: number;
  totalPaid: number;
  outstandingBalance: number;
  status: 'active' | 'inactive';
  createdAt: string;
  companyId: string;
}

export interface Supplier {
  id: string;
  name: string;
  email: string;
  contactName: string;
  contactEmail: string;
  phone: string;
  sector: string;
  address: string;
  city: string;
  country: string;
  ifu?: string;
  rccm?: string;
  status: 'active' | 'inactive';
  createdAt: string;
  companyId: string;
  portalUserId?: string;
}

export interface PerformanceReview {
  id: string;
  employeeId: string;
  employeeName: string;
  reviewerId: string;
  reviewerName: string;
  period: string;
  year: number;
  objectives: { description: string; weight: number; score: number }[];
  competencies: { name: string; score: number }[];
  overallScore: number;
  rating: 'exceptional' | 'exceeds' | 'meets' | 'needs_improvement' | 'unsatisfactory';
  bonusAmount: number;
  bonusPercentage: number;
  comments: string;
  employeeComments: string;
  status: 'draft' | 'submitted' | 'reviewed' | 'approved';
  createdAt: string;
  companyId: string;
}

export interface Feedback360 {
  id: string;
  reviewId: string;
  fromName: string;
  relationship: 'peer' | 'manager' | 'subordinate' | 'other';
  score: number;
  comment: string;
  createdAt: string;
  companyId: string;
}

export interface PersonalDevelopmentPlan {
  id: string;
  employeeId: string;
  employeeName?: string;
  goal: string;
  deadline?: string;
  resources?: string;
  status: 'active' | 'completed' | 'cancelled';
  progress?: number;
  createdAt: string;
  companyId: string;
}

export type ClosingStepStatus = 'pending' | 'in_progress' | 'completed' | 'error';

export interface ClosingEntry {
  id: string;
  fiscalYear: number;
  step: string;
  description: string;
  status: ClosingStepStatus;
  automated: boolean;
  entries?: AccountingEntry[];
  startedAt?: string;
  completedAt?: string;
  errorMessage?: string;
  companyId: string;
}

export interface NavItem {
  label: string;
  icon: string;
  path: string;
  children?: NavItem[];
  permission?: string;
}

// ============================================
// DSF - DECLARATION STATISTIQUE ET FISCALE (OHADA)
// ============================================

export type OhadaCountry =
  | 'CM' // Cameroun
  | 'CI' // Cote d'Ivoire
  | 'SN' // Senegal
  | 'BF' // Burkina Faso
  | 'GA' // Gabon
  | 'BJ' // Benin
  | 'TG' // Togo
  | 'ML' // Mali
  | 'NE' // Niger
  | 'CD' // RDC
  | 'TD' // Tchad
  | 'GN' // Guinee
  | 'CG' // Congo
  | 'CF' // RCA
  | 'KM' // Comores
  | 'GW' // Guinée-Bissau
  | 'GQ'; // Guinée équatoriale

export interface CountryTaxConfig {
  code: OhadaCountry;
  name: string;
  vatRate: number;
  vatReducedRate?: number;
  isRate: number; // Impot sur les societes
  isPMERate?: number; // IS pour PME
  irppEnabled: boolean;
  irppBrackets: { limit: number; rate: number }[];
  cnpsEnabled: boolean;
  cnpsRates?: {
    pensionEmployee: number;
    pensionEmployer: number;
    atmp: number;
    familyAllowances: number;
  };
  otherTaxes: { name: string; rate: number; base: string }[];
  socialOrgName: string; // CNPS, CNSS, CSS, AMO...
  fiscalYearEnd: string; // MM-DD
  dsfDeadlineDays: number; // jours apres fin d'exercice
  dsfFormCode: string; // Code formulaire DSF local
  configurationStatus?: 'needs_setup' | 'needs_validation' | 'validated';
}

export interface DSFForm {
  id: string;
  companyId: string;
  countryCode: OhadaCountry;
  fiscalYear: number;
  periodStart: string;
  periodEnd: string;
  generatedAt: string;
  submittedAt?: string;
  status: 'draft' | 'generated' | 'submitted' | 'validated';
  // Tableaux SYSCOHADA
  tableauA?: { // Etat du bilan
    immobilisations: number;
    stocks: number;
    creances: number;
    tresorerie: number;
    capitauxPropres: number;
    dettesFinancieres: number;
    dettesExploitation: number;
    autresDettes: number;
  };
  tableauB?: { // Compte de resultat
    chiffreAffaires: number;
    productionVendue: number;
    productionImmobilisee: number;
    achatsConsommes: number;
    chargesPersonnel: number;
    dotationsAmortissements: number;
    autresCharges: number;
    produitsFinanciers: number;
    chargesFinancieres: number;
    resultatNet: number;
  };
  tableauC?: { // Etat des soldes de gestion (ESG)
    valeurAjoutee: number;
    excedentBrutExploitation: number;
    resultatExploitation: number;
    resultatFinancier: number;
    resultatOrdinaire: number;
    resultatExtraordinaire: number;
    resultatNetComptable: number;
  };
  tableauD?: { // Fiscalite specifique pays
    tvaCollectee: number;
    tvaDeductible: number;
    tvaNette: number;
    irppRetenue: number;
    isDu: number;
    isPaye: number;
    isReportable: number;
    cotisationsSociales: number;
    taxesDiverses: number;
  };
  // Informations annexes
  effectifMoyen?: number;
  masseSalariale?: number;
  investissements?: number;
  exportations?: number;
  importations?: number;
  // Metadonnees
  generatedBy: string;
  fileUrl?: string;
  notes?: string;
}

// ============================================
// ACTIVITY REPORT TYPES
// ============================================

export type ActivityReportType = 'daily' | 'weekly' | 'monthly';
export type ActivityReportStatus = 'draft' | 'submitted' | 'reviewed_by_hod' | 'reviewed_by_gm' | 'approved' | 'rejected';

export interface ActivityReport {
  id: string;
  title: string;
  type: ActivityReportType;
  periodLabel: string; // ex: "05/08/2026", "S32-2026", "Aout 2026"
  employeeId: string;
  employeeName: string;
  departmentId: string;
  departmentName: string;
  content: string;
  achievements: string[];
  challenges: string[];
  nextSteps: string[];
  status: ActivityReportStatus;
  submittedTo?: string; // userId du supérieur
  submittedToName?: string;
  submittedAt?: string;
  reviewedBy?: string;
  reviewedByName?: string;
  reviewedAt?: string;
  reviewComment?: string;
  approvedBy?: string;
  approvedByName?: string;
  approvedAt?: string;
  companyId: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================
// INTERNAL LIBRARY TYPES
// ============================================

export interface LibraryDocument {
  id: string;
  title: string;
  description: string;
  category: 'reglement' | 'procedure' | 'manuel' | 'formation' | 'template' | 'politique' | 'archives' | 'autre';
  fileName: string;
  fileSize: string;
  fileType: string;
  uploadedBy: string;
  uploadedByName: string;
  downloadCount: number;
  isRestricted: boolean;
  allowedDepartments?: string[];
  tags: string[];
  companyId: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================
// VIBE PROSPECTING TYPES
// ============================================

export interface Lead {
  id: string;
  fullName: string;
  company: string;
  position: string;
  email: string;
  phone?: string;
  linkedinUrl?: string;
  industry: string;
  country: string;
  city: string;
  source: 'social_media' | 'signal_detection' | 'referral' | 'event' | 'website' | 'scraping';
  status: 'new' | 'contacted' | 'qualified' | 'proposal' | 'negotiation' | 'won' | 'lost' | 'nurturing';
  score: number; // 0-100
  temperature: 'hot' | 'warm' | 'cold';
  signals: string[]; // buying signals detected
  lastActivity: string;
  assignedTo: string;
  assignedToName: string;
  notes: string;
  tags: string[];
  estimatedValue: number;
  currency: string;
  createdAt: string;
  companyId: string;
}

export type SignalType = 'hiring_intent' | 'tech_upgrade' | 'funding' | 'expansion' | 'pain_point' | 'competitor_switch' | 'budget_announcement' | 'regulatory_change';

export interface BuySignal {
  id: string;
  leadId?: string;
  leadName?: string;
  company: string;
  type: SignalType;
  description: string;
  platform: 'linkedin' | 'twitter' | 'facebook' | 'instagram' | 'reddit' | 'news' | 'job_board' | 'forum';
  url?: string;
  confidence: number; // 0-100
  relevance: number; // 0-100
  dateDetected: string;
  isRead: boolean;
  isActioned: boolean;
  suggestedApproach: string;
  aiGeneratedMessage?: string;
  tags: string[];
  companyId: string;
}

export interface SocialTrend {
  id: string;
  topic: string;
  category: string;
  platform: 'linkedin' | 'twitter' | 'facebook' | 'instagram' | 'tiktok' | 'youtube';
  volumeScore: number; // 0-100
  growthRate: number; // percentage
  sentiment: 'positive' | 'negative' | 'neutral' | 'mixed';
  relatedHashtags: string[];
  topInfluencers: string[];
  audienceDemographics: { segment: string; percentage: number }[];
  geoHotspots: { city: string; country: string; intensity: number }[];
  dateDetected: string;
  isActive: boolean;
  suggestedContent: string;
  companyId: string;
}

export interface OutreachCampaign {
  id: string;
  name: string;
  description: string;
  channel: 'email' | 'sms' | 'whatsapp' | 'linkedin' | 'twitter' | 'ads';
  status: 'draft' | 'scheduled' | 'running' | 'paused' | 'completed';
  targetAudience: string;
  messageTemplate: string;
  scheduledDate?: string;
  sentCount: number;
  openRate: number;
  clickRate: number;
  replyRate: number;
  conversionRate: number;
  createdAt: string;
  companyId: string;
}

// ============================================
// LOT 1: OPPORTUNITIES & INVOICE REMINDERS
// ============================================

export type OpportunityStage = 'prospecting' | 'qualification' | 'proposal' | 'negotiation' | 'closed_won' | 'closed_lost';

export interface OpportunityProduct {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface OpportunityActivity {
  id: string;
  type: 'call' | 'email' | 'meeting' | 'note' | 'task';
  description: string;
  createdBy: string;
  createdByName: string;
  createdAt: string;
}

export interface Opportunity {
  id: string;
  title: string;
  clientId: string;
  clientName: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  value: number;
  probability: number;
  stage: OpportunityStage;
  expectedCloseDate: string;
  actualCloseDate?: string;
  source: string;
  assignedTo: string;
  assignedToName: string;
  notes: string;
  products: OpportunityProduct[];
  activities: OpportunityActivity[];
  createdAt: string;
  updatedAt: string;
  companyId: string;
}

export interface InvoiceReminder {
  id: string;
  invoiceId: string;
  invoiceNumber: string;
  clientName: string;
  reminderType: 'before_due' | 'on_due' | 'after_due_7' | 'after_due_15' | 'after_due_30' | 'final';
  reminderDate: string;
  sentDate?: string;
  status: 'scheduled' | 'sent' | 'failed' | 'cancelled';
  templateUsed: string;
  sentBy?: string;
  notes?: string;
  createdAt: string;
}

// ============================================
// LOT 2: TIME TRACKING
// ============================================

export interface TimeEntry {
  id: string;
  projectId: string;
  projectName: string;
  taskId?: string;
  taskName?: string;
  userId: string;
  userName: string;
  description: string;
  startTime: string;
  endTime?: string;
  duration: number; // minutes
  billable: boolean;
  hourlyRate: number;
  cost: number;
  date: string;
  createdAt: string;
}

// ============================================
// LOT 3: FINANCIAL REPORTS
// ============================================

export interface FinancialReport {
  id: string;
  type: 'income_statement' | 'balance_sheet' | 'cash_flow';
  period: string;
  startDate: string;
  endDate: string;
  data: Record<string, number>;
  generatedAt: string;
  generatedBy: string;
  companyId: string;
}

export interface EmployeeLoan {
  id: string;
  employeeId: string;
  employeeName: string;
  loanType: 'pret_equipement' | 'avance_salaire' | 'pret_immobilier' | 'pret_secours';
  totalAmount: number;
  monthlyDeduction: number;
  remainingAmount: number;
  startDate: string;
  endDate: string;
  status: 'active' | 'completed' | 'suspended';
  companyId: string;
  createdAt: string;
}

// ============================================
// LOT 4: HR CONTRACTS
// ============================================

export interface EmployeeContract {
  id: string;
  employeeId: string;
  employeeName: string;
  type: 'cdi' | 'cdd' | 'stage' | 'freelance' | 'consultant';
  startDate: string;
  endDate?: string;
  salary: number;
  position: string;
  department: string;
  benefits: string[];
  status: 'active' | 'expired' | 'terminated' | 'renewed';
  documentUrl?: string;
  createdAt: string;
  companyId: string;
}

// ============================================
// LOT 5: VIBE EMAIL TEMPLATES
// ============================================

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  category: 'outreach' | 'follow_up' | 'reminder' | 'newsletter' | 'welcome' | 'cold';
  abTestVariant?: 'A' | 'B';
  openRate?: number;
  clickRate?: number;
  replyRate?: number;
  usageCount: number;
  createdAt: string;
  companyId: string;
}

// ============================================
// LOT 6: PORTAL TICKETS
// ============================================

export interface PortalTicketResponse {
  id: string;
  userId: string;
  userName: string;
  isStaff: boolean;
  content: string;
  createdAt: string;
}

export interface PortalTicket {
  id: string;
  portalUserId: string;
  portalUserName: string;
  portalType: 'client' | 'vendor' | 'partner';
  subject: string;
  description: string;
  status: 'open' | 'in_progress' | 'waiting' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assignedTo?: string;
  assignedToName?: string;
  relatedDocumentId?: string;
  responses: PortalTicketResponse[];
  createdAt: string;
  updatedAt: string;
  companyId: string;
}

// ============================================
// LOT 7: AUDIT LOG
// ============================================

export interface AuditLogEntry {
  id: string;
  userId: string;
  userName: string;
  action: string;
  entityType: string;
  entityId: string;
  details: string;
  ipAddress?: string;
  createdAt: string;
  companyId: string;
}

// ============================================
// LOT 8: MEETINGS
// ============================================

export interface MeetingParticipant {
  userId: string;
  userName: string;
  joinedAt?: string;
  leftAt?: string;
  isAudioOn: boolean;
  isVideoOn: boolean;
  isScreenSharing: boolean;
}

export interface Meeting {
  id: string;
  title: string;
  type: 'video' | 'audio' | 'screen_share';
  participants: MeetingParticipant[];
  startTime: string;
  endTime?: string;
  status: 'scheduled' | 'ongoing' | 'ended' | 'cancelled';
  roomId: string;
  chatId?: string;
  recordingUrl?: string;
  createdBy: string;
  createdByName: string;
  createdAt: string;
  companyId: string;
}


export interface OutreachMessage {
  id: string;
  campaignId?: string;
  leadId: string;
  leadName: string;
  channel: 'email' | 'linkedin' | 'whatsapp' | 'sms';
  subject?: string;
  body: string;
  aiGenerated: boolean;
  aiPrompt: string;
  status: 'draft' | 'sent' | 'delivered' | 'opened' | 'replied' | 'bounced';
  tone: 'professional' | 'casual' | 'enthusiastic' | 'empathetic' | 'urgent';
  personalizationScore: number;
  sentAt?: string;
  replyContent?: string;
  createdAt: string;
  companyId: string;
}

export interface FunnelStage {
  stage: string;
  count: number;
  value: number;
  conversionRate: number;
  avgDays: number;
  color: string;
}

// ============================================
// PORTAIL EXTERNE - CLIENT / FOURNISSEUR / PARTENAIRE
// ============================================

export type PortalType = 'client' | 'vendor' | 'partner';
export type PortalUserStatus = 'active' | 'inactive' | 'pending';

export interface PortalUser {
  id: string;
  email: string;
  displayName: string;
  portalType: PortalType;
  companyName: string;
  companyId: string;
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
  ifu?: string;
  rccm?: string;
  logo?: string;
  status: PortalUserStatus;
  createdAt: string;
  lastLoginAt?: string;
  linkedInternalId?: string;
  linkedInternalName?: string;
}

export interface PortalProject {
  id: string;
  portalUserId: string;
  portalType: PortalType;
  internalProjectId?: string;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'review' | 'delivered' | 'cancelled';
  progress: number;
  budget?: number;
  startDate?: string;
  endDate?: string;
  deliverables: PortalDeliverable[];
  comments: PortalComment[];
  companyId: string;
  createdAt: string;
  updatedAt: string;
}

export interface PortalDeliverable {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'submitted' | 'approved' | 'rejected';
  fileUrl?: string;
  fileName?: string;
  submittedAt?: string;
  reviewedAt?: string;
  reviewComment?: string;
}

export interface PortalComment {
  id: string;
  authorId: string;
  authorName: string;
  authorType: 'internal' | 'external';
  content: string;
  createdAt: string;
}

export interface PortalInvoice {
  id: string;
  portalUserId: string;
  portalType: PortalType;
  internalInvoiceId?: string;
  number: string;
  amount: number;
  tax: number;
  total: number;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  dueDate: string;
  paidAt?: string;
  items: { description: string; quantity: number; unitPrice: number; total: number }[];
  companyId: string;
  createdAt: string;
}

export interface PortalPayment {
  id: string;
  portalUserId: string;
  invoiceId: string;
  amount: number;
  method: 'bank_transfer' | 'mobile_money' | 'cash' | 'check';
  reference: string;
  status: 'pending' | 'confirmed' | 'rejected';
  paidAt: string;
  companyId: string;
}

export interface PortalContract {
  id: string;
  portalUserId: string;
  portalType: PortalType;
  title: string;
  description: string;
  startDate: string;
  endDate?: string;
  value: number;
  status: 'draft' | 'active' | 'expired' | 'terminated';
  fileUrl?: string;
  companyId: string;
  createdAt: string;
}

export interface PortalActivity {
  id: string;
  portalUserId: string;
  portalType: PortalType;
  type: 'login' | 'document_view' | 'invoice_view' | 'payment' | 'comment' | 'download';
  description: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  companyId: string;
}

export interface PortalNotification {
  id: string;
  portalUserId: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  link?: string;
  createdAt: string;
}

// ============================================
// PORTAIL ACTUALITÉS
// ============================================

export interface PortalNewsComment {
  id: string;
  userId: string;
  userName: string;
  content: string;
  createdAt: string;
}

export interface PortalNews {
  id: string;
  title: string;
  content: string;
  excerpt: string;
  imageUrl?: string;
  category: string;
  targetType: 'all' | 'client' | 'vendor' | 'partner';
  isPublished: boolean;
  publishedAt?: string;
  authorId: string;
  authorName: string;
  priority: 'normal' | 'high';
  likes: number;
  likedBy: string[];
  shares: number;
  comments: PortalNewsComment[];
  createdAt: string;
  updatedAt?: string;
  companyId: string;
}

// ============================================
// CHAT / MESSAGERIE TYPES
// ============================================

export type ChatType = 'internal' | 'external';
export type ChatScope = 'department' | 'project' | 'general' | 'client' | 'vendor' | 'partner';

export interface Chat {
  id: string;
  name: string;
  description?: string;
  type: ChatType;
  scope: ChatScope;
  createdBy: string;
  createdByName: string;
  createdByRole: string;
  participantIds: string[];
  participants: ChatParticipant[];
  projectId?: string;
  projectName?: string;
  departmentId?: string;
  departmentName?: string;
  externalEntityId?: string;
  externalEntityName?: string;
  externalEntityType?: 'client' | 'vendor' | 'partner' | 'other';
  lastMessageAt?: string;
  lastMessagePreview?: string;
  unreadCount: number;
  isArchived: boolean;
  companyId: string;
  createdAt: string;
}

export interface ChatParticipant {
  userId: string;
  name: string;
  avatar?: string;
  role: string;
  departmentId?: string;
  departmentName?: string;
  addedBy: string;
  addedAt: string;
}

export interface ChatMessage {
  id: string;
  chatId: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  senderRole: string;
  content: string;
  attachments?: ChatAttachment[];
  replyToId?: string;
  replyToPreview?: string;
  isEdited: boolean;
  editedAt?: string;
  readBy: string[];
  reactions: ChatReaction[];
  createdAt: string;
}

export interface ChatAttachment {
  id: string;
  name: string;
  type: string;
  size: string;
  url: string;
}

export interface ChatReaction {
  emoji: string;
  userIds: string[];
}

// ============================================
// LOT 1: OPPORTUNITIES (Pipeline Commercial)
// ============================================



// ============================================
// LOT 2: TIME TRACKING
// ============================================

// ============================================
// LOT 3: FINANCIAL REPORTS
// ============================================

// ============================================
// LOT 4: HR CONTRACTS
// ============================================

// ============================================
// LOT 5: VIBE EMAIL TEMPLATES & A/B TEST
// ============================================

// ============================================
// LOT 6: PORTAL TICKETS
// ============================================


// ============================================
// LOT 7: AUDIT LOG
// ============================================

// ============================================
// LOT 8: MEETING / CALL
// ============================================
