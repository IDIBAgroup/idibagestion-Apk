import {
  mysqlTable,
  mysqlEnum,
  serial,
  varchar,
  text,
  timestamp,
  int,
  decimal,
  boolean,
  date,
  bigint,
  index,
  uniqueIndex,
} from "drizzle-orm/mysql-core";

// ============================================
// USERS (Auth)
// ============================================

export const users = mysqlTable("users", {
  id: serial("id").primaryKey(),
  externalId: varchar("externalId", { length: 255 }).unique("users_externalId_unique"),
  name: varchar("name", { length: 255 }),
  email: varchar("email", { length: 320 }).unique("users_email_unique"),
  googleSub: varchar("googleSub", { length: 255 }).unique("users_googleSub_unique"),
  passwordHash: varchar("passwordHash", { length: 255 }),
  avatar: text("avatar"),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
  lastSignInAt: timestamp("lastSignInAt").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const userSessions = mysqlTable(
  "user_sessions",
  {
    id: varchar("id", { length: 64 }).primaryKey(),
    userId: bigint("userId", { mode: "number", unsigned: true }).notNull(),
    expiresAt: timestamp("expiresAt").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => [index("user_sessions_user_expires_idx").on(table.userId, table.expiresAt)],
);

export type UserSession = typeof userSessions.$inferSelect;

export const googleAuthTransactions = mysqlTable(
  "google_auth_transactions",
  {
    stateHash: varchar("stateHash", { length: 64 }).primaryKey(),
    browserHash: varchar("browserHash", { length: 64 }).notNull(),
    nonce: varchar("nonce", { length: 64 }).notNull(),
    codeVerifier: varchar("codeVerifier", { length: 128 }).notNull(),
    expiresAt: timestamp("expiresAt").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => [index("google_auth_transactions_expires_idx").on(table.expiresAt)],
);

export type GoogleAuthTransaction = typeof googleAuthTransactions.$inferSelect;

// ============================================
// SAAS — PLANS (Forfaits d'abonnement)
// ============================================

export const plans = mysqlTable("plans", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 50 }).notNull().unique(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  billingCycle: mysqlEnum("billingCycle", ["monthly", "yearly"]).notNull(),
  priceXAF: int("priceXAF").notNull(),
  originalPriceXAF: int("originalPriceXAF"),
  isPopular: boolean("isPopular").default(false),
  isEnterprise: boolean("isEnterprise").default(false),
  maxUsers: int("maxUsers").default(1),
  maxClients: int("maxClients").default(100),
  maxInvoices: int("maxInvoices").default(50),
  maxProjects: int("maxProjects").default(5),
  features: text("features"), // JSON array
  moduleAccess: text("moduleAccess"), // JSON array of stable subscription feature keys
  supportLevel: mysqlEnum("supportLevel", ["email", "priority", "dedicated"]).default("email"),
  trialDays: int("trialDays").default(14),
  isActive: boolean("isActive").default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Plan = typeof plans.$inferSelect;
export type InsertPlan = typeof plans.$inferInsert;

// ============================================
// SAAS — COMPANIES (Tenants / Clients)
// ============================================

export const companies = mysqlTable("companies", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 50 }),
  address: text("address"),
  city: varchar("city", { length: 100 }),
  country: varchar("country", { length: 100 }).default("Cameroun"),
  logoUrl: text("logoUrl"),
  siret: varchar("siret", { length: 100 }),
  taxId: varchar("taxId", { length: 100 }),
  niu: varchar("niu", { length: 100 }),
  rccm: varchar("rccm", { length: 100 }),
  capitalSocial: varchar("capitalSocial", { length: 100 }),
  status: mysqlEnum("status", ["active", "suspended", "cancelled", "trial"]).default("trial").notNull(),
  ownerUserId: bigint("ownerUserId", { mode: "number", unsigned: true }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull().$onUpdate(() => new Date()),
});

export type Company = typeof companies.$inferSelect;
export type InsertCompany = typeof companies.$inferInsert;

/** Jurisdiction and operating defaults for each legal company (one row per tenant company). */
export const companyProfiles = mysqlTable(
  "company_profiles",
  {
    id: serial("id").primaryKey(),
    companyId: bigint("companyId", { mode: "number", unsigned: true }).notNull(),
    countryCode: varchar("countryCode", { length: 2 }).notNull(),
    currencyCode: varchar("currencyCode", { length: 3 }).notNull(),
    timezone: varchar("timezone", { length: 80 }).notNull(),
    locale: varchar("locale", { length: 12 }).notNull(),
    fiscalYearStartMonth: int("fiscalYearStartMonth").default(1).notNull(),
    fiscalYearStartDay: int("fiscalYearStartDay").default(1).notNull(),
    industryCode: varchar("industryCode", { length: 40 }).default("other").notNull(),
    customIndustryName: varchar("customIndustryName", { length: 120 }),
    accountingFramework: varchar("accountingFramework", { length: 40 }).default("SYSCOHADA_REVISED").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().notNull().$onUpdate(() => new Date()),
  },
  (table) => [
    uniqueIndex("company_profiles_company_uq").on(table.companyId),
    index("company_profiles_country_industry_idx").on(table.countryCode, table.industryCode),
  ],
);

export type CompanyProfile = typeof companyProfiles.$inferSelect;

/** Company-configured tax rules are effective-dated; statutory rates are never guessed by the app. */
export const companyTaxRules = mysqlTable(
  "company_tax_rules",
  {
    id: serial("id").primaryKey(),
    companyId: bigint("companyId", { mode: "number", unsigned: true }).notNull(),
    countryCode: varchar("countryCode", { length: 2 }).notNull(),
    code: varchar("code", { length: 40 }).notNull(),
    name: varchar("name", { length: 120 }).notNull(),
    taxType: mysqlEnum("taxType", ["vat", "withholding", "excise", "corporate_income", "payroll_income", "employee_social", "employer_social", "other"]).default("vat").notNull(),
    rateBasisPoints: int("rateBasisPoints").notNull(),
    effectiveFrom: date("effectiveFrom", { mode: "string" }).notNull(),
    effectiveTo: date("effectiveTo", { mode: "string" }),
    isActive: boolean("isActive").default(true).notNull(),
    createdByUserId: bigint("createdByUserId", { mode: "number", unsigned: true }).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().notNull().$onUpdate(() => new Date()),
  },
  (table) => [
    uniqueIndex("company_tax_rules_company_code_from_uq").on(table.companyId, table.countryCode, table.code, table.effectiveFrom),
    index("company_tax_rules_effective_idx").on(table.companyId, table.countryCode, table.taxType, table.isActive, table.effectiveFrom),
  ],
);

// ============================================
// COMPANY MEMBERSHIPS (Company-scoped access)
// ============================================

export const companyMemberships = mysqlTable(
  "company_memberships",
  {
    id: serial("id").primaryKey(),
    companyId: bigint("companyId", { mode: "number", unsigned: true }).notNull(),
    userId: bigint("userId", { mode: "number", unsigned: true }).notNull(),
    role: mysqlEnum("role", ["owner", "admin", "manager", "member"]).default("member").notNull(),
    status: mysqlEnum("status", ["active", "invited", "suspended", "revoked"]).default("active").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().notNull().$onUpdate(() => new Date()),
  },
  (table) => [
    uniqueIndex("company_memberships_company_user_uq").on(table.companyId, table.userId),
    index("company_memberships_user_status_idx").on(table.userId, table.status),
  ],
);

export type CompanyMembership = typeof companyMemberships.$inferSelect;
export type InsertCompanyMembership = typeof companyMemberships.$inferInsert;

export const companyAccessInvitations = mysqlTable(
  "company_access_invitations",
  {
    id: serial("id").primaryKey(),
    companyId: bigint("companyId", { mode: "number", unsigned: true }).notNull(),
    role: mysqlEnum("role", ["admin", "manager", "member"]).notNull(),
    tokenHash: varchar("tokenHash", { length: 64 }).notNull(),
    expiresAt: timestamp("expiresAt").notNull(),
    claimedAt: timestamp("claimedAt"),
    createdByUserId: bigint("createdByUserId", { mode: "number", unsigned: true }).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("company_access_invitations_token_hash_uq").on(table.tokenHash),
    index("company_access_invitations_company_claimed_idx").on(table.companyId, table.claimedAt),
  ],
);

export type CompanyAccessInvitation = typeof companyAccessInvitations.$inferSelect;

// ============================================
// CLIENTS (Portefeuille Clients)
// ============================================

export const clients = mysqlTable("clients", {
  id: serial("id").primaryKey(),
  companyId: bigint("companyId", { mode: "number", unsigned: true }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 50 }),
  whatsapp: varchar("whatsapp", { length: 50 }),
  address: text("address"),
  city: varchar("city", { length: 100 }),
  country: varchar("country", { length: 100 }).default("Cameroun"),
  niu: varchar("niu", { length: 100 }),
  rccm: varchar("rccm", { length: 100 }),
  taxCategory: varchar("taxCategory", { length: 100 }),
  status: mysqlEnum("status", ["active", "inactive", "lead"]).default("active").notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull().$onUpdate(() => new Date()),
});

export type Client = typeof clients.$inferSelect;
export type InsertClient = typeof clients.$inferInsert;

/** Tenant-owned departments and explicit membership links for the HR directory. */
export const departments = mysqlTable(
  "departments",
  {
    id: serial("id").primaryKey(),
    companyId: bigint("companyId", { mode: "number", unsigned: true }).notNull(),
    name: varchar("name", { length: 120 }).notNull(),
    managerUserId: bigint("managerUserId", { mode: "number", unsigned: true }),
    createdByUserId: bigint("createdByUserId", { mode: "number", unsigned: true }).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().notNull().$onUpdate(() => new Date()),
  },
  (table) => [
    uniqueIndex("departments_company_name_uq").on(table.companyId, table.name),
    index("departments_company_manager_idx").on(table.companyId, table.managerUserId),
  ],
);

export const departmentMembers = mysqlTable(
  "department_members",
  {
    id: serial("id").primaryKey(),
    companyId: bigint("companyId", { mode: "number", unsigned: true }).notNull(),
    departmentId: int("departmentId").notNull(),
    userId: bigint("userId", { mode: "number", unsigned: true }).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("department_members_department_user_uq").on(table.departmentId, table.userId),
    index("department_members_company_department_idx").on(table.companyId, table.departmentId),
    index("department_members_company_user_idx").on(table.companyId, table.userId),
  ],
);

// ============================================
// PRODUCTS / ARTICLES (Catalogue Produits)
// ============================================

export const products = mysqlTable("products", {
  id: serial("id").primaryKey(),
  companyId: bigint("companyId", { mode: "number", unsigned: true }).notNull(),
  code: varchar("code", { length: 50 }),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  unitPriceHT: int("unitPriceHT").notNull(),
  taxRate: decimal("taxRate", { precision: 5, scale: 2 }).default("19.25"),
  unit: varchar("unit", { length: 50 }).default("Unité"),
  category: varchar("category", { length: 100 }).default("Service"),
  stockQuantity: int("stockQuantity").default(0),
  isActive: boolean("isActive").default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull().$onUpdate(() => new Date()),
});

export type Product = typeof products.$inferSelect;
export type InsertProduct = typeof products.$inferInsert;

/** Immutable posted journal document; every document owns its balanced debit/credit lines. */
export const journalEntries = mysqlTable(
  "journal_entries",
  {
    id: serial("id").primaryKey(),
    companyId: bigint("companyId", { mode: "number", unsigned: true }).notNull(),
    entryDate: date("entryDate", { mode: "string" }).notNull(),
    journalCode: varchar("journalCode", { length: 12 }).notNull(),
    pieceNumber: varchar("pieceNumber", { length: 100 }).notNull(),
    label: varchar("label", { length: 500 }).notNull(),
    analyticCode: varchar("analyticCode", { length: 120 }),
    baseCurrency: varchar("baseCurrency", { length: 3 }).notNull(),
    transactionCurrency: varchar("transactionCurrency", { length: 3 }).notNull(),
    exchangeRate: decimal("exchangeRate", { precision: 22, scale: 10 }).notNull(),
    transactionAmount: decimal("transactionAmount", { precision: 22, scale: 2 }).notNull(),
    createdByUserId: bigint("createdByUserId", { mode: "number", unsigned: true }).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => [
    index("journal_entries_company_date_idx").on(table.companyId, table.entryDate),
    uniqueIndex("journal_entries_company_journal_piece_uq").on(table.companyId, table.journalCode, table.pieceNumber),
  ],
);

export const journalEntryLines = mysqlTable(
  "journal_entry_lines",
  {
    id: serial("id").primaryKey(),
    companyId: bigint("companyId", { mode: "number", unsigned: true }).notNull(),
    journalEntryId: bigint("journalEntryId", { mode: "number", unsigned: true }).notNull(),
    lineNumber: int("lineNumber").notNull(),
    accountCode: varchar("accountCode", { length: 20 }).notNull(),
    accountLabel: varchar("accountLabel", { length: 255 }).notNull(),
    debit: decimal("debit", { precision: 22, scale: 2 }).default("0.00").notNull(),
    credit: decimal("credit", { precision: 22, scale: 2 }).default("0.00").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("journal_entry_lines_entry_number_uq").on(table.journalEntryId, table.lineNumber),
    index("journal_entry_lines_company_entry_idx").on(table.companyId, table.journalEntryId),
    index("journal_entry_lines_company_account_idx").on(table.companyId, table.accountCode),
  ],
);

export const financialReports = mysqlTable(
  "financial_reports",
  {
    id: serial("id").primaryKey(),
    companyId: bigint("companyId", { mode: "number", unsigned: true }).notNull(),
    type: mysqlEnum("type", ["income_statement", "balance_sheet", "cash_flow"]).notNull(),
    period: varchar("period", { length: 12 }).notNull(),
    startDate: date("startDate", { mode: "string" }).notNull(),
    endDate: date("endDate", { mode: "string" }).notNull(),
    reportData: text("reportData").notNull(),
    generatedByUserId: bigint("generatedByUserId", { mode: "number", unsigned: true }).notNull(),
    generatedAt: timestamp("generatedAt").defaultNow().notNull(),
  },
  (table) => [index("financial_reports_company_period_idx").on(table.companyId, table.period, table.generatedAt)],
);

/** Explicit fiscal-year locks; period changes are serialized against journal postings by locking the tenant row. */
export const fiscalPeriods = mysqlTable(
  "fiscal_periods",
  {
    id: serial("id").primaryKey(),
    companyId: bigint("companyId", { mode: "number", unsigned: true }).notNull(),
    fiscalYear: int("fiscalYear").notNull(),
    label: varchar("label", { length: 24 }).notNull(),
    startDate: date("startDate", { mode: "string" }).notNull(),
    endDate: date("endDate", { mode: "string" }).notNull(),
    status: mysqlEnum("status", ["open", "closed"]).default("closed").notNull(),
    closedByUserId: bigint("closedByUserId", { mode: "number", unsigned: true }),
    closedAt: timestamp("closedAt"),
    reopenedByUserId: bigint("reopenedByUserId", { mode: "number", unsigned: true }),
    reopenedAt: timestamp("reopenedAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().notNull().$onUpdate(() => new Date()),
  },
  (table) => [
    uniqueIndex("fiscal_periods_company_year_uq").on(table.companyId, table.fiscalYear),
    index("fiscal_periods_company_dates_status_idx").on(table.companyId, table.startDate, table.endDate, table.status),
  ],
);

/** Tenant-owned fixed asset register; depreciation remains computed from the saved method and useful life. */
export const fixedAssets = mysqlTable(
  "fixed_assets",
  {
    id: serial("id").primaryKey(),
    companyId: bigint("companyId", { mode: "number", unsigned: true }).notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    category: varchar("category", { length: 180 }).notNull(),
    serialNumber: varchar("serialNumber", { length: 120 }).notNull(),
    description: text("description"),
    acquisitionDate: date("acquisitionDate", { mode: "string" }),
    acquisitionValue: decimal("acquisitionValue", { precision: 18, scale: 2 }).notNull(),
    currencyCode: varchar("currencyCode", { length: 3 }).default("XAF").notNull(),
    location: varchar("location", { length: 255 }),
    status: mysqlEnum("status", ["active", "maintenance", "disposed", "out_of_service"]).default("active").notNull(),
    usefulLifeYears: int("usefulLifeYears"),
    depreciationMethod: mysqlEnum("depreciationMethod", ["linear", "degressive"]),
    createdByUserId: bigint("createdByUserId", { mode: "number", unsigned: true }).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().notNull().$onUpdate(() => new Date()),
  },
  (table) => [
    uniqueIndex("fixed_assets_company_serial_uq").on(table.companyId, table.serialNumber),
    index("fixed_assets_company_status_idx").on(table.companyId, table.status),
  ],
);

export type FixedAsset = typeof fixedAssets.$inferSelect;

/** Employee expense claims and approval evidence, isolated per company. */
export const expenseClaims = mysqlTable(
  "expense_claims",
  {
    id: serial("id").primaryKey(),
    companyId: bigint("companyId", { mode: "number", unsigned: true }).notNull(),
    employeeUserId: bigint("employeeUserId", { mode: "number", unsigned: true }).notNull(),
    description: varchar("description", { length: 255 }).notNull(),
    amount: decimal("amount", { precision: 18, scale: 2 }).notNull(),
    currencyCode: varchar("currencyCode", { length: 3 }).notNull(),
    category: varchar("category", { length: 120 }).notNull(),
    incurredOn: date("incurredOn", { mode: "string" }).notNull(),
    notes: text("notes"),
    status: mysqlEnum("status", ["pending", "approved", "rejected"]).default("pending").notNull(),
    decisionNote: text("decisionNote"),
    decidedByUserId: bigint("decidedByUserId", { mode: "number", unsigned: true }),
    decidedAt: timestamp("decidedAt"),
    receiptStorageKey: varchar("receiptStorageKey", { length: 512 }),
    receiptName: varchar("receiptName", { length: 180 }),
    receiptMimeType: varchar("receiptMimeType", { length: 120 }),
    receiptSha256: varchar("receiptSha256", { length: 64 }),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().notNull().$onUpdate(() => new Date()),
  },
  (table) => [
    index("expense_claims_company_status_date_idx").on(table.companyId, table.status, table.incurredOn),
    index("expense_claims_employee_date_idx").on(table.companyId, table.employeeUserId, table.incurredOn),
  ],
);

export const expenseClaimEvents = mysqlTable(
  "expense_claim_events",
  {
    id: serial("id").primaryKey(),
    companyId: bigint("companyId", { mode: "number", unsigned: true }).notNull(),
    claimId: bigint("claimId", { mode: "number", unsigned: true }).notNull(),
    eventType: varchar("eventType", { length: 40 }).notNull(),
    actorUserId: bigint("actorUserId", { mode: "number", unsigned: true }).notNull(),
    detailsJson: text("detailsJson"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => [
    index("expense_claim_events_company_claim_created_idx").on(table.companyId, table.claimId, table.createdAt),
  ],
);

/** Atomic per-company sequence for customer orders and delivery notes. */
export const salesDocumentSequences = mysqlTable(
  "sales_document_sequences",
  {
    id: serial("id").primaryKey(),
    companyId: bigint("companyId", { mode: "number", unsigned: true }).notNull(),
    kind: mysqlEnum("kind", ["quote", "order", "delivery", "invoice"]).notNull(),
    fiscalYear: int("fiscalYear").notNull(),
    lastValue: int("lastValue").default(0).notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().notNull().$onUpdate(() => new Date()),
  },
  (table) => [uniqueIndex("sales_document_sequences_company_kind_year_uq").on(table.companyId, table.kind, table.fiscalYear)],
);

export const customerInvoiceReminders = mysqlTable(
  "customer_invoice_reminders",
  {
    id: serial("id").primaryKey(),
    companyId: bigint("companyId", { mode: "number", unsigned: true }).notNull(),
    invoiceDocumentId: bigint("invoiceDocumentId", { mode: "number", unsigned: true }).notNull(),
    reminderType: mysqlEnum("reminderType", ["before_due", "on_due", "after_due_7", "after_due_15", "after_due_30", "final"]).notNull(),
    reminderDate: date("reminderDate", { mode: "string" }).notNull(),
    status: mysqlEnum("status", ["scheduled", "sent", "failed", "cancelled"]).default("scheduled").notNull(),
    templateUsed: varchar("templateUsed", { length: 180 }).notNull(),
    sentAt: timestamp("sentAt"),
    sentByUserId: bigint("sentByUserId", { mode: "number", unsigned: true }),
    notes: text("notes"),
    createdByUserId: bigint("createdByUserId", { mode: "number", unsigned: true }).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().notNull().$onUpdate(() => new Date()),
  },
  (table) => [
    uniqueIndex("customer_invoice_reminders_invoice_type_date_uq").on(table.invoiceDocumentId, table.reminderType, table.reminderDate),
    index("customer_invoice_reminders_company_date_status_idx").on(table.companyId, table.reminderDate, table.status),
  ],
);

// ============================================
// SAAS — SUBSCRIPTIONS
// ============================================

export const subscriptions = mysqlTable("subscriptions", {
  id: serial("id").primaryKey(),
  companyId: bigint("companyId", { mode: "number", unsigned: true }).notNull(),
  planId: bigint("planId", { mode: "number", unsigned: true }).notNull(),
  status: mysqlEnum("status", ["trial", "active", "past_due", "cancelled", "expired"]).default("trial").notNull(),
  billingCycle: mysqlEnum("billingCycle", ["monthly", "yearly"]).notNull(),
  priceXAF: int("priceXAF").notNull(),
  startedAt: timestamp("startedAt").defaultNow().notNull(),
  trialEndsAt: timestamp("trialEndsAt"),
  currentPeriodStart: timestamp("currentPeriodStart").defaultNow().notNull(),
  currentPeriodEnd: timestamp("currentPeriodEnd").notNull(),
  cancelledAt: timestamp("cancelledAt"),
  cancelReason: text("cancelReason"),
  autoRenew: boolean("autoRenew").default(true),
  paymentMethod: mysqlEnum("paymentMethod", ["card", "mobile_money", "bank_transfer", "cash"]),
  lastPaymentAt: timestamp("lastPaymentAt"),
  nextPaymentAt: timestamp("nextPaymentAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull().$onUpdate(() => new Date()),
});

export type Subscription = typeof subscriptions.$inferSelect;
export type InsertSubscription = typeof subscriptions.$inferInsert;

// ============================================
// SAAS — TRANSACTIONS (Paiements)
// ============================================

export const transactions = mysqlTable("transactions", {
  id: serial("id").primaryKey(),
  companyId: bigint("companyId", { mode: "number", unsigned: true }).notNull(),
  subscriptionId: bigint("subscriptionId", { mode: "number", unsigned: true }),
  type: mysqlEnum("type", ["subscription", "renewal", "upgrade", "refund", "charge"]).notNull(),
  amountXAF: int("amountXAF").notNull(),
  status: mysqlEnum("status", ["pending", "completed", "failed", "refunded"]).default("pending").notNull(),
  isVerified: boolean("isVerified").default(false).notNull(),
  paymentMethod: mysqlEnum("paymentMethod", ["card", "mobile_money", "bank_transfer", "cash"]).notNull(),
  paymentProvider: varchar("paymentProvider", { length: 50 }), // stripe, mtncm, orange, etc.
  providerTransactionId: varchar("providerTransactionId", { length: 255 }),
  description: text("description"),
  paidAt: timestamp("paidAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = typeof transactions.$inferInsert;

// ============================================
// SAAS — INVOICES (Factures d'abonnement)
// ============================================

export const invoices = mysqlTable("invoices", {
  id: serial("id").primaryKey(),
  companyId: bigint("companyId", { mode: "number", unsigned: true }).notNull(),
  subscriptionId: bigint("subscriptionId", { mode: "number", unsigned: true }),
  invoiceNumber: varchar("invoiceNumber", { length: 100 }).notNull().unique(),
  amountXAF: int("amountXAF").notNull(),
  taxAmountXAF: int("taxAmountXAF").default(0),
  totalXAF: int("totalXAF").notNull(),
  status: mysqlEnum("status", ["draft", "sent", "paid", "overdue", "cancelled"]).default("draft").notNull(),
  dueDate: date("dueDate").notNull(),
  paidAt: timestamp("paidAt"),
  items: text("items"), // JSON
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Invoice = typeof invoices.$inferSelect;
export type InsertInvoice = typeof invoices.$inferInsert;

// ============================================
// PARTNERS — IDIBA GROUP BUSINESS PARTNERS
// ============================================

export const partnerLevels = mysqlTable("partner_levels", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 50 }).notNull().unique(),
  name: varchar("name", { length: 100 }).notNull(),
  commissionRate: decimal("commissionRate", { precision: 5, scale: 2 }).notNull(),
  minRevenueXAF: int("minRevenueXAF").default(0),
  maxRevenueXAF: int("maxRevenueXAF").default(0),
  description: text("description"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PartnerLevel = typeof partnerLevels.$inferSelect;

export const partners = mysqlTable(
  "partners",
  {
    id: serial("id").primaryKey(),
    code: varchar("code", { length: 50 }).notNull().unique(),
    firstName: varchar("firstName", { length: 100 }).notNull(),
    lastName: varchar("lastName", { length: 100 }).notNull(),
    email: varchar("email", { length: 320 }).notNull(),
    userId: bigint("userId", { mode: "number", unsigned: true }),
    phone: varchar("phone", { length: 50 }),
    whatsapp: varchar("whatsapp", { length: 50 }),
    city: varchar("city", { length: 100 }),
    companyName: varchar("companyName", { length: 255 }),
    jobTitle: varchar("jobTitle", { length: 100 }),
    photoUrl: text("photoUrl"),
    levelId: bigint("levelId", { mode: "number", unsigned: true }).notNull(),
    status: mysqlEnum("status", ["active", "suspended", "inactive", "pending"]).default("pending").notNull(),
    internalManagerId: bigint("internalManagerId", { mode: "number", unsigned: true }),
    notes: text("notes"),
    partnershipDate: date("partnershipDate").notNull(),
    lastLoginAt: timestamp("lastLoginAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().notNull().$onUpdate(() => new Date()),
  },
  (table) => [
    uniqueIndex("partners_user_id_uq").on(table.userId),
  ],
);

export type Partner = typeof partners.$inferSelect;
export type InsertPartner = typeof partners.$inferInsert;

export const partnerAccountInvitations = mysqlTable(
  "partner_account_invitations",
  {
    id: serial("id").primaryKey(),
    partnerId: bigint("partnerId", { mode: "number", unsigned: true }).notNull(),
    tokenHash: varchar("tokenHash", { length: 64 }).notNull(),
    expiresAt: timestamp("expiresAt").notNull(),
    claimedAt: timestamp("claimedAt"),
    createdByUserId: bigint("createdByUserId", { mode: "number", unsigned: true }).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("partner_account_invitations_token_hash_uq").on(table.tokenHash),
    index("partner_account_invitations_partner_claimed_idx").on(table.partnerId, table.claimedAt),
  ],
);

export type PartnerAccountInvitation = typeof partnerAccountInvitations.$inferSelect;

export const partnerProspects = mysqlTable("partner_prospects", {
  id: serial("id").primaryKey(),
  leadId: varchar("leadId", { length: 50 }).notNull().unique(),
  partnerId: bigint("partnerId", { mode: "number", unsigned: true }).notNull(),
  companyName: varchar("companyName", { length: 255 }).notNull(),
  contactName: varchar("contactName", { length: 255 }),
  contactFunction: varchar("contactFunction", { length: 100 }),
  phone: varchar("phone", { length: 50 }),
  whatsapp: varchar("whatsapp", { length: 50 }),
  email: varchar("email", { length: 320 }),
  city: varchar("city", { length: 100 }),
  sector: varchar("sector", { length: 100 }),
  need: text("need"),
  serviceSearched: varchar("serviceSearched", { length: 255 }),
  estimatedBudget: int("estimatedBudget"),
  urgency: mysqlEnum("urgency", ["low", "medium", "high", "critical"]).default("medium"),
  description: text("description"),
  source: varchar("source", { length: 100 }),
  status: mysqlEnum("status", [
    "new", "to_qualify", "qualified", "appointment", "proposal",
    "negotiation", "won", "lost", "cancelled"
  ]).default("new").notNull(),
  estimatedAmount: int("estimatedAmount"),
  probability: int("probability").default(0),
  nextAction: text("nextAction"),
  assignedTo: bigint("assignedTo", { mode: "number", unsigned: true }),
  protectionEndDate: date("protectionEndDate"),
  isDuplicate: boolean("isDuplicate").default(false),
  duplicateOfId: bigint("duplicateOfId", { mode: "number", unsigned: true }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull().$onUpdate(() => new Date()),
});

export type PartnerProspect = typeof partnerProspects.$inferSelect;
export type InsertPartnerProspect = typeof partnerProspects.$inferInsert;

export const partnerOpportunities = mysqlTable("partner_opportunities", {
  id: serial("id").primaryKey(),
  prospectId: bigint("prospectId", { mode: "number", unsigned: true }).notNull(),
  partnerId: bigint("partnerId", { mode: "number", unsigned: true }).notNull(),
  quoteNumber: varchar("quoteNumber", { length: 100 }),
  quoteAmountHT: int("quoteAmountHT"),
  quoteAmountTTC: int("quoteAmountTTC"),
  quoteStatus: mysqlEnum("quoteStatus", ["draft", "sent", "viewed", "accepted", "rejected", "expired"]),
  contractNumber: varchar("contractNumber", { length: 100 }),
  contractAmount: int("contractAmount"),
  contractStatus: mysqlEnum("contractStatus", ["draft", "signed", "active", "terminated", "cancelled"]),
  contractSignatureDate: date("contractSignatureDate"),
  contractDuration: int("contractDuration"),
  contractType: varchar("contractType", { length: 100 }),
  collectedAmount: int("collectedAmount").default(0),
  remainingAmount: int("remainingAmount").default(0),
  commissionRate: decimal("commissionRate", { precision: 5, scale: 2 }),
  commissionEarned: int("commissionEarned").default(0),
  commissionStatus: mysqlEnum("commissionStatus", ["pending", "validated", "paid", "cancelled"]).default("pending"),
  closedAt: timestamp("closedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull().$onUpdate(() => new Date()),
});

export type PartnerOpportunity = typeof partnerOpportunities.$inferSelect;

export const partnerCommissions = mysqlTable("partner_commissions", {
  id: serial("id").primaryKey(),
  partnerId: bigint("partnerId", { mode: "number", unsigned: true }).notNull(),
  opportunityId: bigint("opportunityId", { mode: "number", unsigned: true }).notNull(),
  invoiceNumber: varchar("invoiceNumber", { length: 100 }),
  collectedAmount: int("collectedAmount").notNull(),
  rate: decimal("rate", { precision: 5, scale: 2 }).notNull(),
  amount: int("amount").notNull(),
  status: mysqlEnum("status", ["pending", "validated", "paid", "cancelled"]).default("pending").notNull(),
  validatedAt: timestamp("validatedAt"),
  paidAt: timestamp("paidAt"),
  paymentMethod: mysqlEnum("paymentMethod", ["bank_transfer", "mobile_money", "cash", "other"]),
  paymentReference: varchar("paymentReference", { length: 255 }),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PartnerCommission = typeof partnerCommissions.$inferSelect;
export type InsertPartnerCommission = typeof partnerCommissions.$inferInsert;

export const partnerNotifications = mysqlTable("partner_notifications", {
  id: serial("id").primaryKey(),
  partnerId: bigint("partnerId", { mode: "number", unsigned: true }).notNull(),
  type: mysqlEnum("type", [
    "prospect_qualified", "quote_sent", "contract_signed",
    "commission_validated", "commission_paid", "level_up", "general"
  ]).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message"),
  isRead: boolean("isRead").default(false),
  link: text("link"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PartnerNotification = typeof partnerNotifications.$inferSelect;

// ============================================
// DOCUMENT STUDIO & EXTERNAL COLLABORATION
// ============================================

/** A template is an editable family; published layout snapshots live in template versions. */
export const documentTemplates = mysqlTable(
  "document_templates",
  {
    id: serial("id").primaryKey(),
    companyId: bigint("companyId", { mode: "number", unsigned: true }).notNull(),
    name: varchar("name", { length: 180 }).notNull(),
    documentType: varchar("documentType", { length: 80 }).notNull(),
    status: mysqlEnum("status", ["draft", "active", "archived"]).default("draft").notNull(),
    currentVersion: int("currentVersion").default(1).notNull(),
    createdByUserId: bigint("createdByUserId", { mode: "number", unsigned: true }).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().notNull().$onUpdate(() => new Date()),
  },
  (table) => [index("document_templates_company_status_idx").on(table.companyId, table.status)],
);

export const documentTemplateVersions = mysqlTable(
  "document_template_versions",
  {
    id: serial("id").primaryKey(),
    companyId: bigint("companyId", { mode: "number", unsigned: true }).notNull(),
    templateId: bigint("templateId", { mode: "number", unsigned: true }).notNull(),
    version: int("version").notNull(),
    layoutJson: text("layoutJson").notNull(),
    createdByUserId: bigint("createdByUserId", { mode: "number", unsigned: true }).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("document_template_versions_template_version_uq").on(table.templateId, table.version),
    index("document_template_versions_company_template_idx").on(table.companyId, table.templateId),
  ],
);

/** Metadata and private object keys only; file bytes must be kept in a private object store. */
export const businessDocuments = mysqlTable(
  "business_documents",
  {
    id: serial("id").primaryKey(),
    companyId: bigint("companyId", { mode: "number", unsigned: true }).notNull(),
    templateId: bigint("templateId", { mode: "number", unsigned: true }),
    documentType: varchar("documentType", { length: 80 }).notNull(),
    documentNumber: varchar("documentNumber", { length: 100 }),
    title: varchar("title", { length: 255 }).notNull(),
    classification: mysqlEnum("classification", ["public", "internal", "confidential", "restricted"]).default("internal").notNull(),
    status: mysqlEnum("status", ["draft", "review", "approved", "finalized", "void"]).default("draft").notNull(),
    metadataJson: text("metadataJson"),
    storageKey: varchar("storageKey", { length: 512 }),
    mimeType: varchar("mimeType", { length: 120 }),
    sha256: varchar("sha256", { length: 64 }),
    createdByUserId: bigint("createdByUserId", { mode: "number", unsigned: true }).notNull(),
    finalizedAt: timestamp("finalizedAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().notNull().$onUpdate(() => new Date()),
  },
  (table) => [
    index("business_documents_company_type_created_idx").on(table.companyId, table.documentType, table.createdAt),
    uniqueIndex("business_documents_company_number_uq").on(table.companyId, table.documentNumber),
  ],
);

export const businessDocumentVersions = mysqlTable(
  "business_document_versions",
  {
    id: serial("id").primaryKey(),
    companyId: bigint("companyId", { mode: "number", unsigned: true }).notNull(),
    documentId: bigint("documentId", { mode: "number", unsigned: true }).notNull(),
    version: int("version").notNull(),
    storageKey: varchar("storageKey", { length: 512 }),
    mimeType: varchar("mimeType", { length: 120 }),
    sha256: varchar("sha256", { length: 64 }),
    snapshotJson: text("snapshotJson"),
    createdByUserId: bigint("createdByUserId", { mode: "number", unsigned: true }).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("business_document_versions_document_version_uq").on(table.documentId, table.version),
    index("business_document_versions_company_document_idx").on(table.companyId, table.documentId),
  ],
);

/** Shares keep only a SHA-256 digest of a high-entropy bearer token. */
export const externalDocumentShares = mysqlTable(
  "external_document_shares",
  {
    id: serial("id").primaryKey(),
    companyId: bigint("companyId", { mode: "number", unsigned: true }).notNull(),
    documentId: bigint("documentId", { mode: "number", unsigned: true }).notNull(),
    tokenHash: varchar("tokenHash", { length: 64 }).notNull(),
    recipientEmail: varchar("recipientEmail", { length: 320 }),
    permission: mysqlEnum("permission", ["view", "comment", "upload"]).default("view").notNull(),
    expiresAt: timestamp("expiresAt").notNull(),
    revokedAt: timestamp("revokedAt"),
    createdByUserId: bigint("createdByUserId", { mode: "number", unsigned: true }).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("external_document_shares_token_hash_uq").on(table.tokenHash),
    index("external_document_shares_company_document_idx").on(table.companyId, table.documentId),
    index("external_document_shares_expiry_idx").on(table.expiresAt, table.revokedAt),
  ],
);

export const externalShareChallenges = mysqlTable(
  "external_share_challenges",
  {
    id: serial("id").primaryKey(),
    shareId: bigint("shareId", { mode: "number", unsigned: true }).notNull(),
    challengeHash: varchar("challengeHash", { length: 64 }).notNull(),
    otpHash: varchar("otpHash", { length: 64 }).notNull(),
    attempts: int("attempts").default(0).notNull(),
    expiresAt: timestamp("expiresAt").notNull(),
    consumedAt: timestamp("consumedAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("external_share_challenges_hash_uq").on(table.challengeHash),
    index("external_share_challenges_share_created_idx").on(table.shareId, table.createdAt),
  ],
);

export const externalShareSessions = mysqlTable(
  "external_share_sessions",
  {
    id: serial("id").primaryKey(),
    shareId: bigint("shareId", { mode: "number", unsigned: true }).notNull(),
    sessionHash: varchar("sessionHash", { length: 64 }).notNull(),
    expiresAt: timestamp("expiresAt").notNull(),
    revokedAt: timestamp("revokedAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("external_share_sessions_hash_uq").on(table.sessionHash),
    index("external_share_sessions_share_expiry_idx").on(table.shareId, table.expiresAt),
  ],
);

export const externalDocumentComments = mysqlTable(
  "external_document_comments",
  {
    id: serial("id").primaryKey(),
    companyId: bigint("companyId", { mode: "number", unsigned: true }).notNull(),
    documentId: bigint("documentId", { mode: "number", unsigned: true }).notNull(),
    shareId: bigint("shareId", { mode: "number", unsigned: true }).notNull(),
    body: text("body").notNull(),
    attachmentStorageKey: varchar("attachmentStorageKey", { length: 512 }),
    attachmentName: varchar("attachmentName", { length: 180 }),
    attachmentMimeType: varchar("attachmentMimeType", { length: 120 }),
    attachmentSha256: varchar("attachmentSha256", { length: 64 }),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => [index("external_document_comments_share_created_idx").on(table.shareId, table.createdAt)],
);

export const externalDocumentEvents = mysqlTable(
  "external_document_events",
  {
    id: serial("id").primaryKey(),
    companyId: bigint("companyId", { mode: "number", unsigned: true }).notNull(),
    documentId: bigint("documentId", { mode: "number", unsigned: true }).notNull(),
    shareId: bigint("shareId", { mode: "number", unsigned: true }),
    eventType: varchar("eventType", { length: 80 }).notNull(),
    actorUserId: bigint("actorUserId", { mode: "number", unsigned: true }),
    detailsJson: text("detailsJson"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => [
    index("external_document_events_company_document_idx").on(table.companyId, table.documentId, table.createdAt),
    index("external_document_events_share_idx").on(table.shareId, table.createdAt),
  ],
);

export const documentApprovals = mysqlTable(
  "document_approvals",
  {
    id: serial("id").primaryKey(),
    companyId: bigint("companyId", { mode: "number", unsigned: true }).notNull(),
    documentId: bigint("documentId", { mode: "number", unsigned: true }).notNull(),
    step: int("step").notNull(),
    approverUserId: bigint("approverUserId", { mode: "number", unsigned: true }).notNull(),
    status: mysqlEnum("status", ["pending", "approved", "rejected", "cancelled"]).default("pending").notNull(),
    note: text("note"),
    decidedAt: timestamp("decidedAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("document_approvals_document_step_uq").on(table.documentId, table.step),
    index("document_approvals_company_approver_status_idx").on(table.companyId, table.approverUserId, table.status),
  ],
);

export const documentStamps = mysqlTable(
  "document_stamps",
  {
    id: serial("id").primaryKey(),
    companyId: bigint("companyId", { mode: "number", unsigned: true }).notNull(),
    name: varchar("name", { length: 160 }).notNull(),
    assetStorageKey: varchar("assetStorageKey", { length: 512 }).notNull(),
    sha256: varchar("sha256", { length: 64 }).notNull(),
    status: mysqlEnum("status", ["active", "disabled", "revoked"]).default("active").notNull(),
    allowedRolesJson: text("allowedRolesJson"),
    createdByUserId: bigint("createdByUserId", { mode: "number", unsigned: true }).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => [index("document_stamps_company_status_idx").on(table.companyId, table.status)],
);

/** This records internal sign-off workflows; it does not represent a qualified electronic signature. */
export const documentSignatureRequests = mysqlTable(
  "document_signature_requests",
  {
    id: serial("id").primaryKey(),
    companyId: bigint("companyId", { mode: "number", unsigned: true }).notNull(),
    documentId: bigint("documentId", { mode: "number", unsigned: true }).notNull(),
    signerUserId: bigint("signerUserId", { mode: "number", unsigned: true }),
    signerEmail: varchar("signerEmail", { length: 320 }),
    status: mysqlEnum("status", ["pending", "signed", "declined", "cancelled"]).default("pending").notNull(),
    signatureKind: mysqlEnum("signatureKind", ["internal_acknowledgement", "visual_stamp", "provider_signature"]).default("internal_acknowledgement").notNull(),
    documentSha256: varchar("documentSha256", { length: 64 }),
    provider: varchar("provider", { length: 80 }),
    providerReference: varchar("providerReference", { length: 255 }),
    lastStatusCheckedAt: timestamp("lastStatusCheckedAt"),
    completedAt: timestamp("completedAt"),
    createdByUserId: bigint("createdByUserId", { mode: "number", unsigned: true }).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => [index("document_signature_requests_company_document_idx").on(table.companyId, table.documentId)],
);

export const documentSignatureEvents = mysqlTable(
  "document_signature_events",
  {
    id: serial("id").primaryKey(),
    companyId: bigint("companyId", { mode: "number", unsigned: true }).notNull(),
    requestId: bigint("requestId", { mode: "number", unsigned: true }).notNull(),
    eventType: varchar("eventType", { length: 80 }).notNull(),
    actorUserId: bigint("actorUserId", { mode: "number", unsigned: true }),
    payloadJson: text("payloadJson"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => [index("document_signature_events_company_request_idx").on(table.companyId, table.requestId, table.createdAt)],
);

export const partnerDocuments = mysqlTable("partner_documents", {
  id: serial("id").primaryKey(),
  partnerId: bigint("partnerId", { mode: "number", unsigned: true }),
  name: varchar("name", { length: 255 }).notNull(),
  fileUrl: text("fileUrl").notNull(),
  fileType: varchar("fileType", { length: 50 }),
  category: mysqlEnum("category", [
    "partnership_contract", "terms", "commission_grid",
    "sales_support", "catalog", "presentation", "brochure", "template"
  ]).notNull(),
  isPublic: boolean("isPublic").default(false),
  allowedLevels: text("allowedLevels"), // JSON array of level slugs
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PartnerDocument = typeof partnerDocuments.$inferSelect;
