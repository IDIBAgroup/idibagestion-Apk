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

export type IdeaStatus = 'proposed' | 'under_review' | 'in_development' | 'implemented';

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
  comments: number;
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
  receipt?: string;
}

// ============================================
// NEW TYPES - HR, CLIENTS, PAYROLL
// ============================================

export interface Employee {
  id: string;
  userId: string;
  matricule: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  phone?: string;
  birthDate: string;
  hireDate: string;
  departmentId: string;
  departmentName: string;
  position: string;
  contractType: 'CDI' | 'CDD' | 'STAGE' | 'CONSULTANT';
  grossSalary: number;
  netSalary: number;
  cnpsNumber: string;
  status: 'active' | 'on_leave' | 'suspended' | 'terminated';
  address: string;
  emergencyContact: string;
  bankAccount?: string;
  bankName?: string;
  photo?: string;
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
  status: 'draft' | 'running' | 'paused' | 'completed';
  channel: 'email' | 'linkedin' | 'whatsapp' | 'sms';
  targetAudience: string;
  leadsCount: number;
  sentCount: number;
  openedCount: number;
  repliedCount: number;
  positiveCount: number;
  conversionRate: number;
  template: string;
  aiPrompt: string;
  personalizationFields: string[];
  scheduledAt?: string;
  createdAt: string;
  createdBy: string;
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
