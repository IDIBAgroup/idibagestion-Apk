import type {
  Company, User, Role, Department, Project, Task,
  Invoice, AccountingEntry, ChartAccount, Asset,
  Ticket, Idea, CalendarEvent, Expense, Notification, Supplier,
  Employee, Candidate, Leave, PayrollItem, Client, EmployeeLoan,
  PerformanceReview, ClosingEntry,
  Lead, BuySignal, SocialTrend, OutreachCampaign, OutreachMessage,
  Chat, ChatMessage,
  PortalUser, PortalProject, PortalInvoice, PortalPayment, PortalContract, PortalActivity, PortalNotification, PortalNews,
  Opportunity, TimeEntry, EmployeeContract, EmailTemplate, PortalTicket, AuditLogEntry, Meeting, InvoiceReminder, FinancialReport,
  Feedback360, PersonalDevelopmentPlan, DSFForm,
  SalesOrder, DeliveryNote,
} from '@/types';
import {
  seedCompany, seedUsers, seedRoles, seedDepartments,
  seedProjects, seedTasks, seedInvoices, seedAccountingEntries,
  seedChartAccounts, seedAssets, seedTickets, seedIdeas,
  seedCalendarEvents, seedExpenses, seedNotifications,
  seedEmployees, seedCandidates, seedLeaves, seedPayroll,
  seedClients, seedSuppliers, seedPerformanceReviews, seedClosingEntries,
  seedLeads, seedSignals, seedTrends, seedCampaigns, seedMessages,
  seedQuotes, seedActivityReports, seedLibraryDocuments,
  seedChats, seedChatMessages,
  seedPortalUsers, seedPortalProjects, seedPortalInvoices, seedPortalPayments,
  seedPortalContracts, seedPortalActivities, seedPortalNotifications, seedPortalNews,
  seedOpportunities, seedTimeEntries, seedContracts, seedEmailTemplates,
  seedPortalTickets, seedAuditLogs, seedMeetings,
  seedFeedback360, seedPersonalDevelopmentPlans, seedLoans,
} from '@/data/seed';

// ============================================
// LOCAL DATABASE - Simulates Firestore
// ============================================

const STORAGE_KEY = 'idibages_db_v7';

export interface Database {
  companies: Company[];
  users: User[];
  roles: Role[];
  departments: Department[];
  projects: Project[];
  tasks: Task[];
  invoices: Invoice[];
  accountingEntries: AccountingEntry[];
  chartAccounts: ChartAccount[];
  assets: Asset[];
  tickets: Ticket[];
  ideas: Idea[];
  calendarEvents: CalendarEvent[];
  expenses: Expense[];
  notifications: Notification[];
  employees: Employee[];
  candidates: Candidate[];
  leaves: Leave[];
  payroll: PayrollItem[];
  clients: Client[];
  suppliers: Supplier[];
  performanceReviews: PerformanceReview[];
  closingEntries: ClosingEntry[];
  leads: Lead[];
  signals: BuySignal[];
  trends: SocialTrend[];
  campaigns: OutreachCampaign[];
  messages: OutreachMessage[];
  quotes: any[];
  salesOrders: SalesOrder[];
  deliveryNotes: DeliveryNote[];
  products: any[];
  activityReports: any[];
  libraryDocuments: any[];
  chats: Chat[];
  chatMessages: ChatMessage[];
  portalUsers: PortalUser[];
  portalProjects: PortalProject[];
  portalInvoices: PortalInvoice[];
  portalPayments: PortalPayment[];
  portalContracts: PortalContract[];
  portalActivities: PortalActivity[];
  portalNotifications: PortalNotification[];
  portalNews: PortalNews[];
  prospects: any[];
  sequences: any[];
  savedLists: any[];
  opportunities: Opportunity[];
  timeEntries: TimeEntry[];
  contracts: EmployeeContract[];
  emailTemplates: EmailTemplate[];
  portalTickets: PortalTicket[];
  auditLogs: AuditLogEntry[];
  meetings: Meeting[];
  invoiceReminders: InvoiceReminder[];
  financialReports: FinancialReport[];
  dsfs: DSFForm[];
  feedback360: Feedback360[];
  personalDevelopmentPlans: PersonalDevelopmentPlan[];
  loans: EmployeeLoan[];
  initialized: boolean;
}

function getDefaultDb(): Database {
  return {
    companies: [seedCompany],
    users: [...seedUsers],
    roles: [...seedRoles],
    departments: [...seedDepartments],
    projects: [...seedProjects],
    tasks: [...seedTasks],
    invoices: [...seedInvoices],
    accountingEntries: [...seedAccountingEntries],
    chartAccounts: [...seedChartAccounts],
    assets: [...seedAssets],
    tickets: [...seedTickets],
    ideas: [...seedIdeas],
    calendarEvents: [...seedCalendarEvents],
    expenses: [...seedExpenses],
    notifications: [...seedNotifications],
    employees: [...seedEmployees],
    candidates: [...seedCandidates],
    leaves: [...seedLeaves],
    payroll: [...seedPayroll],
    loans: [...seedLoans],
    clients: [...seedClients],
    suppliers: [...seedSuppliers],
    performanceReviews: [...seedPerformanceReviews],
    closingEntries: [...seedClosingEntries],
    leads: [...seedLeads],
    signals: [...seedSignals],
    trends: [...seedTrends],
    campaigns: [...seedCampaigns],
    messages: [...seedMessages],
    quotes: [...seedQuotes],
    salesOrders: [],
    deliveryNotes: [],
    products: [
      { id: 1, name: "Développement d'Application Web ERP", category: 'Informatique', description: 'Conception sur-mesure d\'un ERP complet', unitPriceHT: 4500000, taxRate: 19.25, unit: 'Forfait', stock: 10 },
      { id: 2, name: 'Audit Comptable & DSF SYSCOHADA', category: 'Conseil', description: 'Audit financier et préparation DSF OHADA', unitPriceHT: 2500000, taxRate: 19.25, unit: 'Forfait', stock: 5 },
      { id: 3, name: 'Module Prospection VIBE AI Intégré', category: 'Logiciel', description: 'Module IA de prospection automatique et signaux d\'achat', unitPriceHT: 1200000, taxRate: 19.25, unit: 'Forfait', stock: 20 },
      { id: 4, name: 'Maintenance & Support Mensuel', category: 'Service', description: 'Assistance technique 7j/7 et mises à jour cloud', unitPriceHT: 350000, taxRate: 19.25, unit: 'Mois', stock: 50 },
    ],
    activityReports: [...seedActivityReports],
    libraryDocuments: [...seedLibraryDocuments],
    chats: [...seedChats],
    chatMessages: [...seedChatMessages],
    portalUsers: [...seedPortalUsers],
    portalProjects: [...seedPortalProjects],
    portalInvoices: [...seedPortalInvoices],
    portalPayments: [...seedPortalPayments],
    portalContracts: [...seedPortalContracts],
    portalActivities: [...seedPortalActivities],
    portalNotifications: [...seedPortalNotifications],
    portalNews: [...seedPortalNews],
    prospects: [],
    sequences: [],
    savedLists: [],
    opportunities: [...seedOpportunities],
    timeEntries: [...seedTimeEntries],
    contracts: [...seedContracts],
    emailTemplates: [...seedEmailTemplates],
    portalTickets: [...seedPortalTickets],
    auditLogs: [...seedAuditLogs],
    meetings: [...seedMeetings],
    feedback360: [...seedFeedback360],
    personalDevelopmentPlans: [...seedPersonalDevelopmentPlans],
    invoiceReminders: [],
    financialReports: [],
    dsfs: [],
    initialized: true,
  };
}

function loadDb(): Database {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as Partial<Database>;
      if (parsed.initialized) {
        // Schema migration: ensure all collections exist by merging with defaults
        const defaults = getDefaultDb();
        const merged: Database = {
          companies: parsed.companies ?? defaults.companies,
          users: parsed.users ?? defaults.users,
          roles: parsed.roles ?? defaults.roles,
          departments: parsed.departments ?? defaults.departments,
          projects: parsed.projects ?? defaults.projects,
          tasks: parsed.tasks ?? defaults.tasks,
          invoices: parsed.invoices ?? defaults.invoices,
          accountingEntries: parsed.accountingEntries ?? defaults.accountingEntries,
          chartAccounts: parsed.chartAccounts ?? defaults.chartAccounts,
          assets: parsed.assets ?? defaults.assets,
          tickets: parsed.tickets ?? defaults.tickets,
          ideas: parsed.ideas ?? defaults.ideas,
          calendarEvents: parsed.calendarEvents ?? defaults.calendarEvents,
          expenses: parsed.expenses ?? defaults.expenses,
          notifications: parsed.notifications ?? defaults.notifications,
          employees: parsed.employees ?? defaults.employees,
          candidates: parsed.candidates ?? defaults.candidates,
          leaves: parsed.leaves ?? defaults.leaves,
          payroll: parsed.payroll ?? defaults.payroll,
          clients: parsed.clients ?? defaults.clients,
          suppliers: parsed.suppliers ?? defaults.suppliers,
          performanceReviews: parsed.performanceReviews ?? defaults.performanceReviews,
          closingEntries: parsed.closingEntries ?? defaults.closingEntries,
          leads: parsed.leads ?? defaults.leads,
          signals: parsed.signals ?? defaults.signals,
          trends: parsed.trends ?? defaults.trends,
          campaigns: parsed.campaigns ?? defaults.campaigns,
          messages: parsed.messages ?? defaults.messages,
          quotes: parsed.quotes ?? defaults.quotes,
          salesOrders: parsed.salesOrders ?? defaults.salesOrders,
          deliveryNotes: parsed.deliveryNotes ?? defaults.deliveryNotes,
          products: parsed.products ?? defaults.products,
          activityReports: parsed.activityReports ?? defaults.activityReports,
          libraryDocuments: parsed.libraryDocuments ?? defaults.libraryDocuments,
          chats: parsed.chats ?? defaults.chats,
          chatMessages: parsed.chatMessages ?? defaults.chatMessages,
          portalUsers: (parsed.portalUsers && parsed.portalUsers.length > 0) ? parsed.portalUsers : defaults.portalUsers,
          portalProjects: (parsed.portalProjects && parsed.portalProjects.length > 0) ? parsed.portalProjects : defaults.portalProjects,
          portalInvoices: (parsed.portalInvoices && parsed.portalInvoices.length > 0) ? parsed.portalInvoices : defaults.portalInvoices,
          portalPayments: (parsed.portalPayments && parsed.portalPayments.length > 0) ? parsed.portalPayments : defaults.portalPayments,
          portalContracts: (parsed.portalContracts && parsed.portalContracts.length > 0) ? parsed.portalContracts : defaults.portalContracts,
          portalActivities: (parsed.portalActivities && parsed.portalActivities.length > 0) ? parsed.portalActivities : defaults.portalActivities,
          portalNotifications: (parsed.portalNotifications && parsed.portalNotifications.length > 0) ? parsed.portalNotifications : defaults.portalNotifications,
          portalNews: (parsed.portalNews && parsed.portalNews.length > 0) ? parsed.portalNews : defaults.portalNews,
          prospects: parsed.prospects ?? defaults.prospects,
          sequences: parsed.sequences ?? defaults.sequences,
          savedLists: parsed.savedLists ?? defaults.savedLists,
          opportunities: parsed.opportunities ?? defaults.opportunities,
          timeEntries: parsed.timeEntries ?? defaults.timeEntries,
          contracts: parsed.contracts ?? defaults.contracts,
          emailTemplates: parsed.emailTemplates ?? defaults.emailTemplates,
          portalTickets: parsed.portalTickets ?? defaults.portalTickets,
          auditLogs: parsed.auditLogs ?? defaults.auditLogs,
          meetings: parsed.meetings ?? defaults.meetings,
          invoiceReminders: parsed.invoiceReminders ?? defaults.invoiceReminders,
          financialReports: parsed.financialReports ?? defaults.financialReports,
          feedback360: parsed.feedback360 ?? defaults.feedback360,
          personalDevelopmentPlans: parsed.personalDevelopmentPlans ?? defaults.personalDevelopmentPlans,
          loans: parsed.loans ?? defaults.loans,
          dsfs: parsed.dsfs ?? defaults.dsfs,
          initialized: true,
        };
        saveDb(merged);
        // Migrate old ideas structure
        if (merged.ideas && Array.isArray(merged.ideas)) {
          let needsSave = false;
          merged.ideas = merged.ideas.map((idea: any) => {
            if (idea.votes !== undefined && idea.upvotes === undefined) {
              needsSave = true;
              return { ...idea, upvotes: idea.votes, hasUpvoted: false, comments: 0, tags: idea.tags || [] };
            }
            if (!idea.tags) { needsSave = true; return { ...idea, tags: [] }; }
            if (idea.upvotes === undefined) { needsSave = true; return { ...idea, upvotes: 0 }; }
            if (idea.hasUpvoted === undefined) { needsSave = true; return { ...idea, hasUpvoted: false }; }
            if (idea.comments === undefined) { needsSave = true; return { ...idea, comments: 0 }; }
            if (!idea.likedBy) { needsSave = true; return { ...idea, likedBy: [] }; }
            if (!idea.commentsList) { needsSave = true; return { ...idea, commentsList: [] }; }
            return idea;
          });
          if (needsSave) saveDb(merged);
        }
        return merged;
      }
    }
  } catch {
    // ignore
  }
  const db = getDefaultDb();
  saveDb(db);
  return db;
}

function saveDb(db: Database): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
}

let dbCache: Database | null = null;

function getDb(): Database {
  if (!dbCache) {
    dbCache = loadDb();
  }
  return dbCache;
}

function persist(): void {
  if (dbCache) saveDb(dbCache);
}

// Generic CRUD operations
export function getAll<T extends keyof Database>(collection: T): Database[T] {
  return getDb()[collection];
}

export function getById<T extends keyof Database>(
  collection: T,
  id: string,
  key: string = 'id'
): Database[T] extends Array<infer U> ? U | undefined : never {
  const items = getDb()[collection] as unknown as Array<Record<string, unknown>>;
  return items.find((item) => item[key] === id) as never;
}

export function query<T extends keyof Database>(
  collection: T,
  filters: Record<string, unknown>
): Database[T] extends Array<infer U> ? U[] : never {
  const items = getDb()[collection] as unknown as Array<Record<string, unknown>>;
  const result = items.filter((item) =>
    Object.entries(filters).every(([key, value]) => item[key] === value)
  );
  return result as never;
}

export function add<T extends keyof Database>(
  collection: T,
  item: Database[T] extends Array<infer U> ? U : never
): void {
  const db = getDb();
  (db[collection] as Array<unknown>).push(item);
  persist();
}

export function update<T extends keyof Database>(
  collection: T,
  id: string,
  data: Partial<Database[T] extends Array<infer U> ? U : never>,
  key: string = 'id'
): void {
  const db = getDb();
  const items = db[collection] as unknown as Array<Record<string, unknown>>;
  const index = items.findIndex((item) => item[key] === id);
  if (index !== -1) {
    items[index] = { ...items[index], ...data };
    persist();
  }
}

export function remove<T extends keyof Database>(
  collection: T,
  id: string,
  key: string = 'id'
): void {
  const db = getDb();
  const items = db[collection] as unknown as Array<Record<string, unknown>>;
  const index = items.findIndex((item) => item[key] === id);
  if (index !== -1) {
    items.splice(index, 1);
    persist();
  }
}

export function resetDatabase(): void {
  dbCache = getDefaultDb();
  persist();
}

// Subscriptions (simulated real-time)
type Listener = () => void;
const listeners: Map<string, Set<Listener>> = new Map();

export function subscribe(collection: string, listener: Listener): () => void {
  if (!listeners.has(collection)) {
    listeners.set(collection, new Set());
  }
  listeners.get(collection)!.add(listener);
  return () => {
    listeners.get(collection)?.delete(listener);
  };
}

function notify(collection: string): void {
  listeners.get(collection)?.forEach((l) => l());
}

// Convenience wrappers with notifications
export function addAndNotify<T extends keyof Database>(
  collection: T,
  item: Database[T] extends Array<infer U> ? U : never
): void {
  add(collection, item);
  notify(collection as string);
}

export function updateAndNotify<T extends keyof Database>(
  collection: T,
  id: string,
  data: Partial<Database[T] extends Array<infer U> ? U : never>,
  key?: string
): void {
  update(collection, id, data, key);
  notify(collection as string);
}

export function removeAndNotify<T extends keyof Database>(
  collection: T,
  id: string,
  key?: string
): void {
  remove(collection, id, key);
  notify(collection as string);
}
