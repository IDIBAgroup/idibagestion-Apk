import type {
  Company, User, Role, Department, Project, Task,
  Invoice, AccountingEntry, ChartAccount, Asset,
  Ticket, Idea, CalendarEvent, Expense, Notification,
  Employee, Candidate, Leave, PayrollItem, Client,
  PerformanceReview, ClosingEntry,
  Lead, BuySignal, SocialTrend, OutreachCampaign, OutreachMessage,
} from '@/types';
import {
  seedCompany, seedUsers, seedRoles, seedDepartments,
  seedProjects, seedTasks, seedInvoices, seedAccountingEntries,
  seedChartAccounts, seedAssets, seedTickets, seedIdeas,
  seedCalendarEvents, seedExpenses, seedNotifications,
  seedEmployees, seedCandidates, seedLeaves, seedPayroll,
  seedClients, seedPerformanceReviews, seedClosingEntries,
  seedLeads, seedSignals, seedTrends, seedCampaigns, seedMessages,
} from '@/data/seed';

// ============================================
// LOCAL DATABASE - Simulates Firestore
// ============================================

const STORAGE_KEY = 'idibages_db_v2';

interface Database {
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
  performanceReviews: PerformanceReview[];
  closingEntries: ClosingEntry[];
  leads: Lead[];
  signals: BuySignal[];
  trends: SocialTrend[];
  campaigns: OutreachCampaign[];
  messages: OutreachMessage[];
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
    clients: [...seedClients],
    performanceReviews: [...seedPerformanceReviews],
    closingEntries: [...seedClosingEntries],
    leads: [...seedLeads],
    signals: [...seedSignals],
    trends: [...seedTrends],
    campaigns: [...seedCampaigns],
    messages: [...seedMessages],
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
          performanceReviews: parsed.performanceReviews ?? defaults.performanceReviews,
          closingEntries: parsed.closingEntries ?? defaults.closingEntries,
          leads: parsed.leads ?? defaults.leads,
          signals: parsed.signals ?? defaults.signals,
          trends: parsed.trends ?? defaults.trends,
          campaigns: parsed.campaigns ?? defaults.campaigns,
          messages: parsed.messages ?? defaults.messages,
          initialized: true,
        };
        saveDb(merged);
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
