# Spécification Technique — IDIBAGES ERP

## Architecture Logicielle

### Stack Frontend
| Technologie | Version | Justification |
|---|---|---|
| React | 18+ | Framework UI principal, hooks, concurrent features |
| TypeScript | 5.x | Typage fort pour un ERP complexe |
| Vite | 5.x | Build rapide, HMR, tree-shaking |
| Tailwind CSS | 3.4 | Utility-first, theming via CSS variables, dark mode natif |
| shadcn/ui | latest | Composants base (Dialog, Dropdown, Tabs, Table, etc.) |
| Framer Motion | 11.x | Animations, micro-interactions, transitions de page |
| Recharts | 2.x | Graphiques analytiques (barres, lignes, aires, sparklines) |
| D3.js | 7.x | Visualisations avancées (donuts, tree maps, Gantt) |
| React Router DOM | 6.x | Routage SPA, routes protégées, layouts imbriqués |
| Lucide React | latest | Icônes consistentes, style outline |
| date-fns | 3.x | Manipulation de dates, formatage, i18n |
| zustand | 4.x | State management léger (auth, UI, offline queue) |

### Architecture de Données (Simulée)

Étant donné que l'environnement est isolé (sandbox) sans connexion Firebase réelle, les données sont simulées via un **Data Layer local** :

- `src/lib/db.ts` — Couche d'abstraction simulant Firestore avec `localStorage` pour la persistance.
- `src/data/seed.ts` — Données de démo pré-générées (entreprises, utilisateurs, projets, factures, etc.).
- `src/hooks/useFirestore.ts` — Hook custom exposant les mêmes patterns que Firestore (collection, doc, query, real-time subscriptions simulées).
- `src/hooks/useAuth.ts` — Hook d'authentification avec login mock, gestion du profil, rôles et permissions.
- `src/hooks/useOffline.ts` — Gestionnaire de file d'attente hors-ligne avec `localStorage` et synchronisation différée.

### Modules de l'Application

| Module | Composants Clés | Dépendances |
|---|---|---|
| **Layout Shell** | `Shell.tsx`, `Sidebar.tsx`, `Header.tsx`, `AppLayout.tsx` | zustand (UI store) |
| **Auth** | `LoginPage.tsx`, `useAuth.ts`, `ProtectedRoute.tsx` | zustand |
| **Dashboard** | `DashboardPage.tsx`, `KPICard.tsx`, `CashFlowChart.tsx`, `RecentTransactions.tsx` | Recharts |
| **Projets** | `ProjectsPage.tsx`, `KanbanBoard.tsx`, `KanbanCard.tsx`, `ProjectDetailPage.tsx`, `TaskTable.tsx` | Framer Motion (D&D) |
| **Facturation** | `InvoicesPage.tsx`, `InvoiceTable.tsx`, `InvoiceDrawer.tsx`, `InvoiceForm.tsx` | date-fns |
| **Comptabilité** | `AccountingPage.tsx`, `ChartOfAccounts.tsx`, `AccountingEntries.tsx` | D3.js (tree) |
| **Immobilisations** | `AssetsPage.tsx`, `AssetGrid.tsx`, `AssetCard.tsx`, `AssetForm.tsx` | — |
| **Admin** | `UsersPage.tsx`, `RolesPage.tsx`, `PermissionMatrix.tsx` | — |
| **Paramètres** | `SettingsPage.tsx`, `BrandingPanel.tsx`, `ColorWheel.tsx`, `WorkflowEditor.tsx` | Canvas API |
| **Innovation** | `InnovationPage.tsx`, `IdeaCard.tsx`, `IdeaDetail.tsx` | — |
| **Support** | `SupportPage.tsx`, `TicketTable.tsx`, `TicketDetail.tsx` | — |
| **Marketing** | `MarketingCalendar.tsx`, `CalendarGrid.tsx`, `EventModal.tsx` | date-fns |
| **Shared** | `GlassCard.tsx`, `StatusBadge.tsx`, `DataTable.tsx`, `SearchModal.tsx`, `ToastProvider.tsx` | Framer Motion |

### Routes (React Router v6)

```
/login                    → LoginPage (public)
/*                        → AppLayout (protégé)
  /dashboard              → DashboardPage
  /projects               → ProjectsPage
  /projects/:id           → ProjectDetailPage
  /marketing              → MarketingCalendar
  /innovation             → InnovationPage
  /finance/invoices       → InvoicesPage
  /finance/expenses       → ExpensesPage (shared layout)
  /finance/accounting     → AccountingPage
  /finance/assets         → AssetsPage
  /admin/users            → UsersPage
  /admin/roles            → RolesPage
  /admin/departments      → DepartmentsPage
  /admin/employees        → EmployeesPage
  /settings               → SettingsPage
  /support                → SupportPage
```

### State Management (Zustand Stores)

| Store | Données | Actions |
|---|---|---|
| `useAuthStore` | user, isAuthenticated, isLoading | login, logout, updateProfile |
| `useUIStore` | sidebarOpen, theme, notifications, searchOpen | toggleSidebar, setTheme, addNotification |
| `useOfflineStore` | isOnline, pendingQueue, isSyncing | queueAction, syncNow, setOnline |
| `useBrandingStore` | companyName, logo, primaryColor, secondaryColor | updateBranding, resetToDefault |

### Composants Partagés Critiques

- **`<GlassCard />`** — Wrapper glassmorphism pour toutes les cartes. Props: `variant` (default/compact), `hover`, `className`.
- **`<StatusBadge />`** — Badge de statut coloré. Props: `status`, `variant` (success/warning/danger/info/neutral).
- **`<DataTable />`** — Tableau réutilisable avec tri, pagination, sélection. Props: `columns`, `data`, `pageSize`.
- **`<SearchModal />`** — Recherche globale Ctrl+K avec navigation rapide.
- **`<ToastProvider />`** — Système de notifications toast (contexte global).

### Animations Clés (Framer Motion)

| Animation | Implémentation |
|---|---|
| Entrée cartes | `staggerChildren: 0.05`, `variants: { hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0 } }` |
| Survol cartes | `whileHover: { y: -2, borderColor: 'rgba(255,255,255,0.12)' }` |
| Transition page | `<AnimatePresence>` + `motion.div` avec `initial/animate/exit` |
| Sidebar toggle | `animate: { width: isOpen ? 240 : 72 }` |
| Modal/Drawer | `AnimatePresence`, overlay `opacity: 0→0.6`, content `x: 100%→0` (drawer) |
| Kanban D&D | Framer Motion `Reorder.Group` + `Reorder.Item` |

### Plan de Développement

1. **Initialisation** : Projet Vite + React + TS + Tailwind + shadcn/ui
2. **Fondations** : Design system (CSS variables, GlassCard, StatusBadge), Layout Shell, Auth
3. **Dashboard** : KPI Cards, Charts (Recharts), page principale
4. **Projets** : Kanban board, Gantt, détail projet
5. **Finance** : Facturation, comptabilité, immobilisations
6. **Admin** : Utilisateurs, rôles, permissions
7. **Paramètres** : Branding dynamique, roue chromatique
8. **Innovation/Support/Marketing** : Pages secondaires
9. **Polish** : Animations, hors-ligne, recherche globale, responsive

### Contraintes Techniques

- **Limites d'images générées** : Max 12 images. Priorité : login illustration, avatars variés, placeholders assets.
- **Données mockées** : `localStorage` pour persistance locale, `seed.ts` pour données initiales.
- **Pas de backend réel** : Firebase simulé uniquement côté client.
- **Dark mode unique** : Pas de toggle clair/sombre, le dark est le seul thème.
