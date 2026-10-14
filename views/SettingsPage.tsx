import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Settings, Users, Shield, Palette, Bell, Globe, Lock,
  Save, Check, Moon, Sun, Monitor, Plug, Server,
  Search, Plus, Trash2, Edit3, X, Activity, Star,
  Smartphone, Mail, Database, HardDrive, AlertTriangle,
  FileSpreadsheet, Building2, Wallet, Briefcase,
  LayoutGrid, FolderTree, RefreshCw, Download, Upload,
  Eye, EyeOff, ToggleLeft, ToggleRight, ChevronRight,
  CheckSquare, XSquare, Archive, FileBarChart, BookOpen,
  Zap, MessageSquare, TrendingUp, Target, Award, Lightbulb, User,
  Crown, Hash, CheckCheck, Package, Image, CheckCircle2, Code, Share2, Sparkles, Layers
} from 'lucide-react';
import { GlassCard } from '@/components/shared/GlassCard';
import { useUIStore } from '@/stores/uiStore';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { useBrandingStore, AVAILABLE_FONTS, AVAILABLE_LANGUAGES } from '@/stores/brandingStore';
import { useActiveCompany } from '@/hooks/useActiveCompany';
import { useCompanySelectionStore } from '@/stores/companySelectionStore';
import { getAll, addAndNotify, updateAndNotify, removeAndNotify } from '@/lib/db';
import { trpc } from '@/providers/trpc';
import { applyPlatformLanguage } from '@/lib/language';

type SettingsTab = 'general' | 'products' | 'appearance' | 'integrations' | 'users' | 'roles' | 'departments' | 'modules' | 'messaging' | 'notifications' | 'security' | 'system';

const rolePermissions = [
  { module: 'Tableau de bord', actions: ['Voir'] },
  { module: 'Projets', actions: ['Voir', 'Créer', 'Modifier', 'Supprimer'] },
  { module: 'Factures & Devis', actions: ['Voir', 'Créer', 'Modifier', 'Supprimer', 'Valider'] },
  { module: 'Comptabilité', actions: ['Voir', 'Saisir', 'Valider', 'Clôturer'] },
  { module: 'Immobilisations', actions: ['Voir', 'Créer', 'Modifier', 'Supprimer'] },
  { module: 'Dépenses', actions: ['Voir', 'Soumettre', 'Approuver'] },
  { module: 'RH & Paie', actions: ['Voir', 'Gérer', 'Valider paie'] },
  { module: 'Clients', actions: ['Voir', 'Créer', 'Modifier', 'Supprimer'] },
  { module: 'Vibe Prospecting', actions: ['Voir', 'Gérer leads', 'Campagnes IA'] },
  { module: 'Innovation', actions: ['Voir', 'Soumettre', 'Approuver'] },
  { module: 'Bibliothèque', actions: ['Voir', 'Uploader'] },
  { module: 'Paramètres', actions: ['Voir', 'Modifier'] },
  { module: 'Rapports', actions: ['Voir', 'Exporter'] },
];

const colorPresets = ['#1F7A63', '#3B82F6', '#8B5CF6', '#F59E0B', '#EF4444', '#EC4899', '#06B6D4', '#10B981'];
const allPermissions = ['Voir', 'Créer', 'Modifier', 'Supprimer', 'Valider', 'Clôturer', 'Gérer', 'Valider paie', 'Soumettre', 'Approuver', 'Gérer leads', 'Campagnes IA', 'Exporter', 'Uploader'];

const defaultSettings = {
  general: {
    companyName: 'IDIBA Group SARL', address: 'Rue Joffre, Immeuble IDIBA, 3e étage',
    city: 'Douala', country: 'Cameroun', phone: '+237 233 42 00 00',
    email: 'contact@idibagroup.cm', website: 'www.idibagroup.cm',
    rccm: 'RC/DLA/2019/M/0847', niu: 'M0123456789C',
    taxRate: 19.25, currency: 'XAF', fiscalYearStart: '01-01',
    language: 'fr', timezone: 'Africa/Douala', dateFormat: 'DD/MM/YYYY',
  },
  appearance: { theme: 'dark' as const, primaryColor: '#1F7A63', secondaryColor: '#3B82F6', backgroundColor: '#FFFFFF', fontId: 'inter', denseMode: false, animations: true },
  notifications: { emailAlerts: true, pushNotifications: true, invoiceReminder: true, expenseApproval: true, newLeadAlert: true, dailyDigest: false, weeklyReport: true, securityAlert: true },
  security: { twoFactor: false, sessionTimeout: 30, passwordMinLength: 12, requireSpecialChar: true, loginAttempts: 5, ipRestriction: false, allowedIPs: '', auditLog: true },
  messaging: { allowDirectMessages: true, allowDepartmentChannels: true, allowExternalGuests: false, allowFiles: true, allowAudioVideoCalls: true, retentionDays: 365 },
  integrations: {
    metaPixelId: '123456789012345',
    gtmId: 'GTM-IDIBAGES01',
    linkedInPixelId: '9876543',
    tiktokPixelId: 'C1234567890',
    whatsappToken: 'EAAG1234567890AZ',
    whatsappPhoneId: '10987654321',
    mtnMerchantId: 'MOMO-CM-8877',
    orangeMerchantKey: 'OM-KEY-9988',
    sendgridApiKey: 'SG.1234567890',
    webhookUrl: 'https://api.idibagroup.cm/v1/webhooks',
    googleAnalytics: true, facebookPixel: true, mtnMoMo: true, orangeMoney: true, sendgrid: true, twilio: false, slack: false, whatsappBusiness: true
  },
  system: { autoBackup: true, backupFrequency: 'daily' as const, dataRetention: 365, debugMode: false, maintenanceMode: false, apiRateLimit: 1000, maxFileSize: 10, allowedFileTypes: 'pdf,jpg,png,doc,docx,xls,xlsx' },
  modules: {
    projects: true, commercial: true, accounting: true, assets: true, expenses: true,
    hr: true, clients: true, vibe: true, innovation: true, library: true,
    reports: true, settings: true, support: true,
  },
};

function loadSettings() {
  try {
    const raw = localStorage.getItem('idibages_settings_v1');
    if (raw) {
      const saved = JSON.parse(raw);
      return Object.fromEntries(Object.entries(defaultSettings).map(([key, defaults]) => [
        key, { ...defaults, ...(saved[key] || {}) },
      ]));
    }
  } catch { /* ignore */ }
  return defaultSettings;
}

function saveSettings(s: any) {
  localStorage.setItem('idibages_settings_v1', JSON.stringify(s));
}

export function SettingsPage() {
  const { setCurrentPageTitle, showToast } = useUIStore();
  const branding = useBrandingStore();
  const { companies } = useActiveCompany();
  const activeCompanyId = useCompanySelectionStore((state) => state.activeCompanyId);
  const setActiveCompanyId = useCompanySelectionStore((state) => state.setActiveCompanyId);
  const { data: authAccount, isLoading: authAccountLoading } = trpc.auth.me.useQuery();

  const [activeTab, setActiveTab] = useState<SettingsTab>('general');

  const [general, setGeneral] = useState(defaultSettings.general);
  const [appearance, setAppearance] = useState(defaultSettings.appearance);
  const [notifications, setNotifications] = useState(defaultSettings.notifications);
  const [security, setSecurity] = useState(defaultSettings.security);
  const [messaging, setMessaging] = useState(defaultSettings.messaging);
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [integrations, setIntegrations] = useState(defaultSettings.integrations);
  const [system, setSystem] = useState(defaultSettings.system);
  const [modules, setModules] = useState(defaultSettings.modules);

  const [users, setUsers] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [productsList, setProductsList] = useState<any[]>([]);
  const [searchUser, setSearchUser] = useState('');
  const [searchProduct, setSearchProduct] = useState('');
  const changePassword = trpc.auth.changePassword.useMutation({
    onSuccess: () => {
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      showToast('Mot de passe mis à jour. Les autres sessions ont été fermées.', 'success');
    },
    onError: (error) => showToast(error.message, 'error'),
  });

  // Modals & Forms
  const [showUserForm, setShowUserForm] = useState(false);
  const [showRoleForm, setShowRoleForm] = useState(false);
  const [showDeptForm, setShowDeptForm] = useState(false);
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);

  const [newUser, setNewUser] = useState({ displayName: '', email: '', roleId: '', departmentId: '', status: 'active' });
  const [newRole, setNewRole] = useState({ name: '', description: '', permissions: [] as string[] });
  const [newDept, setNewDept] = useState({ name: '', description: '', managerId: '' });
  const [productForm, setProductForm] = useState({
    name: '',
    category: 'Logiciel',
    description: '',
    unitPriceHT: 150000,
    taxRate: 19.25,
    unit: 'Forfait',
    stock: 100,
  });

  const [editingRole, setEditingRole] = useState<any>(null);
  const [editingDept, setEditingDept] = useState<any>(null);

  // Messaging state
  const [chats, setChats] = useState<any[]>([]);
  const [newChat, setNewChat] = useState({ name: '', description: '', scope: 'general' as 'general' | 'department', departmentId: '' });

  // Load persisted settings + data
  useEffect(() => {
    setCurrentPageTitle('Paramètres Système & Personnalisation');
    const s = loadSettings();
    setGeneral(s.general || defaultSettings.general);
    setAppearance(s.appearance || defaultSettings.appearance);
    setNotifications(s.notifications || defaultSettings.notifications);
    setSecurity({ ...defaultSettings.security, ...(s.security || {}), passwordMinLength: Math.max(12, Number(s.security?.passwordMinLength ?? 12)) });
    setMessaging(s.messaging || defaultSettings.messaging);
    setIntegrations(s.integrations || defaultSettings.integrations);
    setSystem(s.system || defaultSettings.system);
    setModules(s.modules || defaultSettings.modules);

    setUsers(getAll('users'));
    setRoles(getAll('roles'));
    setDepartments(getAll('departments'));
    setChats(getAll('chats'));
    setProductsList(getAll('products') as any[]);
  }, [setCurrentPageTitle]);

  const persistAll = () => {
    const payload = {
      general,
      appearance: { ...appearance, primaryColor: branding.primaryColor, secondaryColor: branding.secondaryColor, backgroundColor: branding.backgroundColor, fontId: branding.fontId, language: branding.language },
      notifications, security, messaging, integrations, system, modules,
    };
    saveSettings(payload);
    window.dispatchEvent(new Event('idibages-settings-updated'));
  };

  const handleSave = () => {
    branding.updateBranding({
      companyName: general.companyName,
      primaryColor: branding.primaryColor,
      secondaryColor: branding.secondaryColor,
      backgroundColor: branding.backgroundColor,
      fontId: branding.fontId,
      language: (general.language || branding.language) as 'fr' | 'en' | 'es',
    });
    persistAll();
    if (security.auditLog) {
      addAndNotify('auditLogs', {
        id: `audit-settings-${Date.now()}`,
        userId: String(authAccount?.id ?? 'current-user'),
        userName: authAccount?.name ?? authAccount?.email ?? 'Administrateur',
        action: 'settings.updated', entityType: 'settings', entityId: 'platform',
        details: 'Mise à jour des paramètres de la plateforme',
        createdAt: new Date().toISOString(), companyId: String(activeCompanyId ?? 'comp-1'),
      });
    }
    document.documentElement.dataset.theme = appearance.theme;
    document.documentElement.classList.toggle('platform-dense', Boolean(appearance.denseMode));
    document.documentElement.dataset.animations = appearance.animations ? 'on' : 'off';
    showToast('Tous les paramètres ont été enregistrés avec succès', 'success');
  };

  // Logo upload handler
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const logoUrl = ev.target?.result as string;
        branding.updateBranding({ logo: logoUrl });
        showToast('Logo de l\'entreprise mis à jour avec succès', 'success');
      };
      reader.readAsDataURL(file);
    }
  };

  // Products CRUD
  const handleSaveProduct = () => {
    if (!productForm.name) {
      showToast('Le nom de l\'article ou service est requis', 'warning');
      return;
    }
    if (editingProduct) {
      updateAndNotify('products', editingProduct.id, productForm);
      showToast('Article mis à jour avec succès', 'success');
    } else {
      addAndNotify('products', {
        id: Date.now(),
        ...productForm,
        unitPriceHT: Number(productForm.unitPriceHT),
        taxRate: Number(productForm.taxRate),
        stock: Number(productForm.stock),
      });
      showToast('Nouvel article ajouté au catalogue', 'success');
    }
    setProductsList(getAll('products') as any[]);
    setShowProductForm(false);
    setEditingProduct(null);
    setProductForm({ name: '', category: 'Logiciel', description: '', unitPriceHT: 150000, taxRate: 19.25, unit: 'Forfait', stock: 100 });
  };

  const handleDeleteProduct = (id: number) => {
    if (confirm('Voulez-vous vraiment supprimer cet article du catalogue ?')) {
      removeAndNotify('products', String(id));
      setProductsList(getAll('products') as any[]);
      showToast('Article supprimé du catalogue', 'success');
    }
  };

  const handleAddUser = () => {
    if (!newUser.displayName.trim() || !newUser.email.trim()) { showToast('Nom et email requis', 'warning'); return; }
    const role = roles.find((r: any) => r.id === newUser.roleId);
    const user = { uid: `user-${Date.now()}`, email: newUser.email.trim(), displayName: newUser.displayName.trim(), roleId: newUser.roleId, roleName: role?.name || 'Employé', companyId: String(activeCompanyId ?? 'comp-1'), departmentId: newUser.departmentId || undefined, status: newUser.status, createdAt: new Date().toISOString(), permissions: role?.permissions || [] };
    addAndNotify('users', user as any);
    setUsers(getAll('users'));
    setShowUserForm(false); setNewUser({ displayName: '', email: '', roleId: '', departmentId: '', status: 'active' });
    showToast('Utilisateur créé avec succès', 'success');
  };

  const handleAddRole = () => {
    if (!newRole.name.trim()) { showToast('Nom du rôle requis', 'warning'); return; }
    if (editingRole) {
      updateAndNotify('roles', editingRole.id, { name: newRole.name.trim(), description: newRole.description, permissions: newRole.permissions });
      showToast('Rôle mis à jour', 'success');
    } else {
      addAndNotify('roles', { id: `role-${Date.now()}`, name: newRole.name.trim(), description: newRole.description, permissions: newRole.permissions, isSystem: false } as any);
      showToast('Rôle créé', 'success');
    }
    setRoles(getAll('roles')); setShowRoleForm(false); setEditingRole(null); setNewRole({ name: '', description: '', permissions: [] });
  };

  const handleAddDept = () => {
    if (!newDept.name.trim()) { showToast('Nom du département requis', 'warning'); return; }
    const mgr = users.find((u: any) => u.uid === newDept.managerId);
    if (editingDept) {
      updateAndNotify('departments', editingDept.id, { name: newDept.name.trim(), description: newDept.description, managerId: newDept.managerId, managerName: mgr?.displayName || '' } as any);
      showToast('Département mis à jour', 'success');
    } else {
      addAndNotify('departments', { id: `dept-${Date.now()}`, name: newDept.name.trim(), description: newDept.description, managerId: newDept.managerId, managerName: mgr?.displayName || '', companyId: String(activeCompanyId ?? 'comp-1'), employeeCount: 0 } as any);
      showToast('Département créé', 'success');
    }
    setDepartments(getAll('departments')); setShowDeptForm(false); setEditingDept(null); setNewDept({ name: '', description: '', managerId: '' });
  };

  const handleDeleteDepartment = (departmentId: string) => {
    const assignedCount = users.filter((user: any) => user.departmentId === departmentId).length;
    if (assignedCount) { showToast(`Réaffectez les ${assignedCount} utilisateur(s) avant de supprimer ce département.`, 'warning'); return; }
    if (!confirm('Supprimer ce département ?')) return;
    removeAndNotify('departments', departmentId); setDepartments(getAll('departments'));
    showToast('Département supprimé', 'success');
  };

  const handleDeleteUser = (uid: string) => {
    if (!confirm('Supprimer cet utilisateur ?')) return;
    removeAndNotify('users', uid, 'uid'); setUsers(getAll('users'));
    showToast('Utilisateur supprimé', 'success');
  };
  const handlePasswordChange = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (passwordForm.newPassword.length < security.passwordMinLength) {
      showToast(`Le nouveau mot de passe doit contenir au moins ${security.passwordMinLength} caractères.`, 'warning');
      return;
    }
    if (security.requireSpecialChar && !/[^A-Za-z0-9]/.test(passwordForm.newPassword)) {
      showToast('Ajoutez au moins un caractère spécial au nouveau mot de passe.', 'warning');
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      showToast('Les nouveaux mots de passe ne correspondent pas.', 'error');
      return;
    }
    changePassword.mutate({
      currentPassword: passwordForm.currentPassword,
      newPassword: passwordForm.newPassword,
    });
  };

  const handleCreateChat = () => {
    if (!newChat.name.trim()) { showToast('Le nom du canal est requis.', 'warning'); return; }
    if (newChat.scope === 'department' && !newChat.departmentId) { showToast('Choisissez un département.', 'warning'); return; }
    const department = departments.find((item: any) => item.id === newChat.departmentId);
    const participants = users.filter((item: any) => newChat.scope !== 'department' || item.departmentId === newChat.departmentId);
    const chat = {
      id: `chat-${Date.now()}`, name: newChat.name.trim(), description: newChat.description.trim(), type: 'internal',
      scope: newChat.scope, createdBy: String(authAccount?.id ?? 'current-user'),
      createdByName: authAccount?.name ?? authAccount?.email ?? 'Administrateur', createdByRole: authAccount?.role ?? 'admin',
      participantIds: participants.map((item: any) => item.uid),
      participants: participants.map((item: any) => ({ userId: item.uid, name: item.displayName, role: item.roleName, departmentId: item.departmentId, addedBy: String(authAccount?.id ?? 'current-user'), addedAt: new Date().toISOString() })),
      departmentId: newChat.scope === 'department' ? newChat.departmentId : undefined, departmentName: department?.name,
      unreadCount: 0, isArchived: false, companyId: String(activeCompanyId ?? 'comp-1'), createdAt: new Date().toISOString(),
    };
    addAndNotify('chats', chat as any);
    setChats(getAll('chats'));
    setNewChat({ name: '', description: '', scope: 'general', departmentId: '' });
    showToast('Canal créé et enregistré dans la messagerie.', 'success');
  };

  const handleTestNotification = async () => {
    if (notifications.pushNotifications && 'Notification' in window) {
      const permission = Notification.permission === 'granted' ? 'granted' : await Notification.requestPermission();
      if (permission === 'granted') new Notification('IDIBAGES — test', { body: 'Les notifications navigateur sont activées.' });
    }
    useUIStore.getState().addNotification({
      id: `settings-notification-${Date.now()}`, type: 'success', title: 'Test des notifications',
      message: 'Les réglages de notification ont été pris en compte.', read: false, createdAt: new Date().toISOString(),
    });
    showToast('Notification de test envoyée.', 'success');
  };

  const handleDownloadBackup = () => {
    const payload = { exportedAt: new Date().toISOString(), settings: loadSettings(), database: JSON.parse(localStorage.getItem('idibages_db_v7') || '{}') };
    const url = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }));
    const link = document.createElement('a'); link.href = url; link.download = `idibages-sauvegarde-${new Date().toISOString().slice(0, 10)}.json`; link.click(); URL.revokeObjectURL(url);
    showToast('Sauvegarde téléchargée.', 'success');
  };

  const togglePerm = (perm: string) => setNewRole(p => ({ ...p, permissions: p.permissions.includes(perm) ? p.permissions.filter(x => x !== perm) : [...p.permissions, perm] }));

  const tabs: { key: SettingsTab; label: string; icon: React.ReactNode }[] = [
    { key: 'general', label: 'Général', icon: <Settings size={16} /> },
    { key: 'products', label: 'Catalogue Articles & Prix', icon: <Package size={16} /> },
    { key: 'appearance', label: 'Apparence & Marque', icon: <Palette size={16} /> },
    { key: 'integrations', label: 'Intégrations & Pixels', icon: <Plug size={16} /> },
    { key: 'users', label: 'Utilisateurs', icon: <Users size={16} /> },
    { key: 'roles', label: 'Rôles & Accès', icon: <Shield size={16} /> },
    { key: 'departments', label: 'Départements', icon: <FolderTree size={16} /> },
    { key: 'modules', label: 'Modules Système', icon: <LayoutGrid size={16} /> },
    { key: 'messaging', label: 'Messagerie', icon: <MessageSquare size={16} /> },
    { key: 'notifications', label: 'Notifications', icon: <Bell size={16} /> },
    { key: 'security', label: 'Sécurité & Audit', icon: <Lock size={16} /> },
    { key: 'system', label: 'Multi-Entreprises & Backup', icon: <Server size={16} /> },
  ];

  const Toggle = ({ label, ariaLabel, value, onChange }: { label: string; ariaLabel?: string; value: boolean; onChange: () => void }) => (
    <div className="flex items-center justify-between py-2">
      {label && <span className="text-sm text-[var(--text-primary)]">{label}</span>}
      <button type="button" role="switch" aria-checked={value} aria-label={ariaLabel || label} onClick={onChange} className={`relative w-10 h-5 rounded-full transition-colors ${value ? 'bg-[var(--accent-primary)]' : 'bg-[var(--text-muted)]/20'}`}>
        <div className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${value ? 'translate-x-5' : 'translate-x-0'}`} />
      </button>
    </div>
  );

  const Si = ({ label, value, onChange, type = 'text', options, placeholder }: { label: string; value: any; onChange: (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => void; type?: string; options?: { v: string; l: string }[]; placeholder?: string }) => (
    <div>
      <label className="block text-xs text-[var(--text-secondary)] mb-1">{label}</label>
      {options ? (
        <select value={value} onChange={onChange as any} className="w-full h-9 px-3 glass-input text-sm">{options.map((o: any) => <option key={o.v} value={o.v}>{o.l}</option>)}</select>
      ) : (
        <input type={type} value={value} onChange={onChange as any} placeholder={placeholder} className="w-full h-9 px-3 glass-input text-sm" />
      )}
    </div>
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Paramètres Système & Personnalisation</h2>
          <p className="text-xs text-[var(--text-muted)]">Gestion complète de la plateforme, identité visuelle, pixels et catalogue d'articles</p>
        </div>
        <button onClick={handleSave} className="btn-primary h-9 gap-1.5 font-bold shadow-lg"><Save size={15} /> Enregistrer les modifications</button>
      </div>

      <div className="flex flex-col lg:flex-row gap-5">
        {/* Navigation Sidebar Tabs */}
        <div className="lg:w-60 shrink-0 space-y-1">
          {tabs.map(t => (
            <button key={t.key} onClick={() => setActiveTab(t.key)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${activeTab === t.key ? 'bg-[var(--accent-primary)]/15 text-[var(--accent-primary)] border border-[var(--accent-primary)]/30 shadow-sm' : 'text-[var(--text-muted)] hover:bg-white/5 hover:text-[var(--text-primary)]'}`}>
              {t.icon}{t.label}
            </button>
          ))}
        </div>

        {/* Tab Content Area */}
        <div className="flex-1 min-w-0">
          <AnimatePresence mode="wait">
            <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>

              {/* ====== GENERAL ====== */}
              {activeTab === 'general' && (
                <div className="space-y-4">
                  <GlassCard><div className="p-5">
                    <h3 className="text-base font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2"><Building2 size={16} className="text-[var(--accent-primary)]" /> Informations sur l'entreprise émettrice</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Si label="Raison Sociale / Nom" value={general.companyName} onChange={(e: any) => setGeneral({ ...general, companyName: e.target.value })} />
                      <Si label="Adresse du siège" value={general.address} onChange={(e: any) => setGeneral({ ...general, address: e.target.value })} />
                      <Si label="Ville" value={general.city} onChange={(e: any) => setGeneral({ ...general, city: e.target.value })} />
                      <Si label="Pays" value={general.country} onChange={(e: any) => setGeneral({ ...general, country: e.target.value })} />
                      <Si label="Téléphone officiel" value={general.phone} onChange={(e: any) => setGeneral({ ...general, phone: e.target.value })} />
                      <Si label="Email de contact" value={general.email} onChange={(e: any) => setGeneral({ ...general, email: e.target.value })} />
                      <Si label="Site web" value={general.website} onChange={(e: any) => setGeneral({ ...general, website: e.target.value })} />
                      <Si label="RCCM (Registre du Commerce)" value={general.rccm} onChange={(e: any) => setGeneral({ ...general, rccm: e.target.value })} />
                      <Si label="NIU (Numéro Identifiant Unique)" value={general.niu} onChange={(e: any) => setGeneral({ ...general, niu: e.target.value })} />
                    </div>
                  </div></GlassCard>

                  <GlassCard><div className="p-5">
                    <h3 className="text-base font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2"><Wallet size={16} className="text-[var(--accent-primary)]" /> Configuration Financière & Fiscale</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Si label="Taux TVA (%)" type="number" value={general.taxRate} onChange={(e: any) => setGeneral({ ...general, taxRate: Number(e.target.value) })} />
                      <Si label="Devise Principale" options={[{ v: 'XAF', l: 'XAF (FCFA Cameroun/CEMAC)' }, { v: 'EUR', l: 'EUR (€ Euro)' }, { v: 'USD', l: 'USD ($ Dollar)' }]} value={general.currency} onChange={(e: any) => setGeneral({ ...general, currency: e.target.value })} />
                      <Si label="Début de l'exercice fiscal" value={general.fiscalYearStart} onChange={(e: any) => setGeneral({ ...general, fiscalYearStart: e.target.value })} />
                      <Si label="Langue générale" options={AVAILABLE_LANGUAGES.map(lang => ({ v: lang.code, l: `${lang.flag} ${lang.name}` }))} value={general.language} onChange={(e: any) => { setGeneral({ ...general, language: e.target.value }); applyPlatformLanguage(e.target.value); }} />
                      <Si label="Fuseau horaire" value={general.timezone} onChange={(e: any) => setGeneral({ ...general, timezone: e.target.value })} />
                      <Si label="Format de date" options={[{ v: 'DD/MM/YYYY', l: 'JJ/MM/AAAA' }, { v: 'MM/DD/YYYY', l: 'MM/JJ/AAAA' }, { v: 'YYYY-MM-DD', l: 'AAAA-MM-JJ' }]} value={general.dateFormat} onChange={(e: any) => setGeneral({ ...general, dateFormat: e.target.value })} />
                    </div>
                    <p className="text-[10px] text-[var(--text-muted)] mt-2">La devise et le taux de TVA configurent les nouveaux documents et le catalogue. La devise SYSCOHADA de reporting reste XAF.</p>
                  </div></GlassCard>
                </div>
              )}

              {/* ====== PRODUCTS & ARTICLES CATALOG ====== */}
              {activeTab === 'products' && (
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex-1 max-w-xs relative">
                      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                      <input
                        type="text"
                        value={searchProduct}
                        onChange={(e) => setSearchProduct(e.target.value)}
                        placeholder="Rechercher par désignation ou catégorie..."
                        className="w-full h-9 pl-9 pr-4 glass-input text-xs"
                      />
                    </div>
                    <button onClick={() => { setEditingProduct(null); setProductForm({ name: '', category: 'Informatique', description: '', unitPriceHT: 150000, taxRate: 19.25, unit: 'Forfait', stock: 100 }); setShowProductForm(true); }} className="btn-primary h-9 gap-1.5 text-xs font-bold">
                      <Plus size={14} /> Ajouter un Article / Service
                    </button>
                  </div>

                  <GlassCard>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b border-[var(--divider)] text-[10px] text-[var(--text-muted)] uppercase tracking-wider">
                            <th className="text-left p-3">Désignation / Article</th>
                            <th className="text-left p-3">Catégorie</th>
                            <th className="text-right p-3">Prix Unitaire HT</th>
                            <th className="text-right p-3">Taux TVA</th>
                            <th className="text-right p-3">Total TTC</th>
                            <th className="text-center p-3">Unité</th>
                            <th className="text-center p-3">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {productsList.filter((p: any) => !searchProduct || p.name?.toLowerCase().includes(searchProduct.toLowerCase()) || p.category?.toLowerCase().includes(searchProduct.toLowerCase())).map((p: any) => {
                            const pu = p.unitPriceHT || 0;
                            const tax = p.taxRate || 19.25;
                            const ttc = pu * (1 + tax / 100);
                            return (
                              <tr key={p.id} className="border-b border-[var(--divider)]/50 hover:bg-white/[0.02]">
                                <td className="p-3">
                                  <div className="flex items-center gap-2">
                                    <Package size={15} className="text-[var(--accent-primary)]" />
                                    <div>
                                      <p className="text-[var(--text-primary)] font-bold">{p.name}</p>
                                      {p.description && <p className="text-[10px] text-[var(--text-muted)]">{p.description}</p>}
                                    </div>
                                  </div>
                                </td>
                                <td className="p-3">
                                  <span className="text-[10px] bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded-full font-medium">
                                    {p.category || 'Général'}
                                  </span>
                                </td>
                                <td className="p-3 text-right font-mono font-semibold text-white">
                                  {pu.toLocaleString('fr-FR')} FCFA
                                </td>
                                <td className="p-3 text-right font-mono text-[var(--text-muted)]">
                                  {tax}%
                                </td>
                                <td className="p-3 text-right font-mono font-bold text-[var(--accent-primary)]">
                                  {Math.round(ttc).toLocaleString('fr-FR')} FCFA
                                </td>
                                <td className="p-3 text-center text-[var(--text-secondary)] font-mono">
                                  {p.unit || 'Unité'}
                                </td>
                                <td className="p-3 text-center">
                                  <div className="flex items-center justify-center gap-1">
                                    <button
                                      onClick={() => {
                                        setEditingProduct(p);
                                        setProductForm({ name: p.name, category: p.category || 'Services', description: p.description || '', unitPriceHT: p.unitPriceHT, taxRate: p.taxRate || 19.25, unit: p.unit || 'Forfait', stock: p.stock || 100 });
                                        setShowProductForm(true);
                                      }}
                                      className="p-1.5 rounded hover:bg-white/10 text-[var(--accent-secondary)]"
                                      title="Modifier"
                                    >
                                      <Edit3 size={13} />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteProduct(p.id)}
                                      className="p-1.5 rounded hover:bg-white/10 text-red-400"
                                      title="Supprimer"
                                    >
                                      <Trash2 size={13} />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </GlassCard>
                </div>
              )}

              {/* ====== APPEARANCE & BRANDING ====== */}
              {activeTab === 'appearance' && (
                <div className="space-y-4">
                  {/* Logo Customization */}
                  <GlassCard><div className="p-5">
                    <h3 className="text-base font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2"><Image size={16} className="text-[var(--accent-primary)]" /> Logo Officiel de l'Entreprise</h3>
                    <div className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/10">
                      <div className="w-20 h-20 rounded-xl bg-black/40 border border-white/20 flex items-center justify-center overflow-hidden shrink-0">
                        {branding.logo ? (
                          <img src={branding.logo} alt="Logo" className="w-full h-full object-contain p-2" />
                        ) : (
                          <span className="text-2xl font-bold text-[var(--accent-primary)]">{branding.companyName.charAt(0)}</span>
                        )}
                      </div>
                      <div className="flex-1 space-y-2">
                        <p className="text-xs text-[var(--text-secondary)]">Uploadez le logo officiel au format PNG ou SVG avec arrière-plan transparent.</p>
                        <div className="flex gap-2">
                          <label className="btn-primary h-8 px-3 text-xs gap-1.5 cursor-pointer">
                            <Upload size={13} /> Choisir une image
                            <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                          </label>
                          {branding.logo && (
                            <button onClick={() => branding.updateBranding({ logo: undefined })} className="btn-secondary h-8 px-3 text-xs text-red-400 hover:text-red-300">
                              Supprimer le logo
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div></GlassCard>

                  {/* Color Wheel Pickers */}
                  <GlassCard><div className="p-5">
                    <h3 className="text-base font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2"><Palette size={16} className="text-[var(--accent-primary)]" /> Roue Chromatique & Palette de Couleurs</h3>
                    <div className="mb-5 grid grid-cols-1 gap-4 md:grid-cols-3">
                      <Si label="Thème de l’interface" value={appearance.theme} options={[{ v: 'dark', l: 'Sombre' }, { v: 'light', l: 'Clair' }]} onChange={(e: any) => setAppearance({ ...appearance, theme: e.target.value })} />
                      <Toggle label="Affichage compact" value={appearance.denseMode} onChange={() => setAppearance({ ...appearance, denseMode: !appearance.denseMode })} />
                      <Toggle label="Animations de l’interface" value={appearance.animations} onChange={() => setAppearance({ ...appearance, animations: !appearance.animations })} />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                      <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 space-y-2">
                        <label className="block text-xs font-bold text-white">Couleur Principale (Accent)</label>
                        <div className="flex items-center gap-2">
                          <input type="color" value={branding.primaryColor} onChange={(e) => branding.updateBranding({ primaryColor: e.target.value })} className="w-10 h-10 rounded-lg border-0 cursor-pointer p-0" />
                          <input type="text" value={branding.primaryColor} onChange={(e) => branding.updateBranding({ primaryColor: e.target.value })} className="w-full h-9 px-3 glass-input font-mono text-xs uppercase" />
                        </div>
                      </div>

                      <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 space-y-2">
                        <label className="block text-xs font-bold text-white">Couleur Secondaire</label>
                        <div className="flex items-center gap-2">
                          <input type="color" value={branding.secondaryColor} onChange={(e) => branding.updateBranding({ secondaryColor: e.target.value })} className="w-10 h-10 rounded-lg border-0 cursor-pointer p-0" />
                          <input type="text" value={branding.secondaryColor} onChange={(e) => branding.updateBranding({ secondaryColor: e.target.value })} className="w-full h-9 px-3 glass-input font-mono text-xs uppercase" />
                        </div>
                      </div>

                      <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 space-y-2">
                        <label className="block text-xs font-bold text-white">Couleur d'Arrière-Plan</label>
                        <div className="flex items-center gap-2">
                          <input type="color" value={branding.backgroundColor} onChange={(e) => branding.updateBranding({ backgroundColor: e.target.value })} className="w-10 h-10 rounded-lg border-0 cursor-pointer p-0" />
                          <input type="text" value={branding.backgroundColor} onChange={(e) => branding.updateBranding({ backgroundColor: e.target.value })} className="w-full h-9 px-3 glass-input font-mono text-xs uppercase" />
                        </div>
                      </div>
                    </div>

                    <label className="block text-xs font-bold text-white mb-2">Palettes Prédéfinies Rapides</label>
                    <div className="flex flex-wrap gap-2">
                      {colorPresets.map(c => (
                        <button key={c} onClick={() => branding.updateBranding({ primaryColor: c })} className={`w-9 h-9 rounded-xl transition-all ${branding.primaryColor === c ? 'ring-2 ring-white scale-110 shadow-lg' : 'hover:scale-105'}`} style={{ backgroundColor: c }} />
                      ))}
                    </div>
                  </div></GlassCard>

                  {/* Typography Selector */}
                  <GlassCard><div className="p-5">
                    <h3 className="text-base font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2"><Sparkles size={16} className="text-[var(--accent-primary)]" /> Typographie de l'Interface</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {AVAILABLE_FONTS.map(f => {
                        const isSelected = branding.fontId === f.id;
                        return (
                          <button
                            key={f.id}
                            onClick={() => branding.updateBranding({ fontId: f.id })}
                            className={`p-3.5 rounded-xl border text-left transition-all ${isSelected ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]/10 text-white font-bold' : 'border-white/10 hover:bg-white/5 text-[var(--text-secondary)]'}`}
                          >
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-xs font-bold">{f.name}</span>
                              {isSelected && <Check size={14} className="text-[var(--accent-primary)]" />}
                            </div>
                            <p className="text-sm font-semibold truncate" style={{ fontFamily: f.family }}>
                              IDIBAGES ERP — 123 456 FCFA
                            </p>
                          </button>
                        );
                      })}
                    </div>
                  </div></GlassCard>

                  {/* Language Selector */}
                  <GlassCard><div className="p-5">
                    <h3 className="text-base font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2"><Globe size={16} className="text-[var(--accent-primary)]" /> Langue de la Plateforme</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {AVAILABLE_LANGUAGES.map(lang => {
                        const isSelected = branding.language === lang.code;
                        return (
                          <button
                            key={lang.code}
                            onClick={() => { setGeneral((current) => ({ ...current, language: lang.code })); applyPlatformLanguage(lang.code); }}
                            className={`p-3.5 rounded-xl border text-left transition-all flex items-center justify-between ${isSelected ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]/10 text-white font-bold' : 'border-white/10 hover:bg-white/5 text-[var(--text-secondary)]'}`}
                          >
                            <span className="text-xs">{lang.flag} {lang.name}</span>
                            {isSelected && <Check size={14} className="text-[var(--accent-primary)]" />}
                          </button>
                        );
                      })}
                    </div>
                    <button onClick={handleSave} className="btn-primary mt-4 h-9 gap-1.5 text-xs"><Save size={14}/> Appliquer l’apparence et la langue</button>
                  </div></GlassCard>
                </div>
              )}

              {/* ====== INTEGRATIONS & PIXELS ====== */}
              {activeTab === 'integrations' && (
                <div className="space-y-4">
                  {/* Social Media Pixels */}
                  <GlassCard><div className="p-5">
                    <h3 className="text-base font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2"><Share2 size={16} className="text-[var(--accent-primary)]" /> Pixels Social Media & Analytics</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Si label="Facebook / Meta Pixel ID" value={integrations.metaPixelId || ''} onChange={(e: any) => setIntegrations({ ...integrations, metaPixelId: e.target.value })} placeholder="123456789012345" />
                      <Si label="Google Tag Manager / GA4 ID" value={integrations.gtmId || ''} onChange={(e: any) => setIntegrations({ ...integrations, gtmId: e.target.value })} placeholder="GTM-XXXXXX" />
                      <Si label="LinkedIn Insight Tag ID" value={integrations.linkedInPixelId || ''} onChange={(e: any) => setIntegrations({ ...integrations, linkedInPixelId: e.target.value })} placeholder="9876543" />
                      <Si label="TikTok Pixel ID" value={integrations.tiktokPixelId || ''} onChange={(e: any) => setIntegrations({ ...integrations, tiktokPixelId: e.target.value })} placeholder="C1234567890" />
                    </div>
                  </div></GlassCard>

                  {/* Payment & Messaging APIs */}
                  <GlassCard><div className="p-5">
                    <h3 className="text-base font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2"><Code size={16} className="text-[var(--accent-primary)]" /> Clés APIs de Paiement & Messagerie</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Si label="WhatsApp Business API Token" type="password" value={integrations.whatsappToken || ''} onChange={(e: any) => setIntegrations({ ...integrations, whatsappToken: e.target.value })} placeholder="EAAG..." />
                      <Si label="WhatsApp Phone Number ID" value={integrations.whatsappPhoneId || ''} onChange={(e: any) => setIntegrations({ ...integrations, whatsappPhoneId: e.target.value })} placeholder="10987654321" />
                      <Si label="MTN Mobile Money Merchant ID" value={integrations.mtnMerchantId || ''} onChange={(e: any) => setIntegrations({ ...integrations, mtnMerchantId: e.target.value })} placeholder="MOMO-CM-XXXX" />
                      <Si label="Orange Money Web Payment Key" value={integrations.orangeMerchantKey || ''} onChange={(e: any) => setIntegrations({ ...integrations, orangeMerchantKey: e.target.value })} placeholder="OM-KEY-XXXX" />
                      <Si label="SendGrid Mail API Key" type="password" value={integrations.sendgridApiKey || ''} onChange={(e: any) => setIntegrations({ ...integrations, sendgridApiKey: e.target.value })} placeholder="SG.XXXXX" />
                      <Si label="URL Webhook Endpoint POST" value={integrations.webhookUrl || ''} onChange={(e: any) => setIntegrations({ ...integrations, webhookUrl: e.target.value })} placeholder="https://..." />
                    </div>
                  </div></GlassCard>
                </div>
              )}

              {activeTab === 'departments' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-3">
                    <div><h3 className="text-base font-semibold text-[var(--text-primary)]">Départements</h3><p className="text-xs text-[var(--text-muted)]">Organisez les équipes et leurs responsables.</p></div>
                    <button onClick={() => { setEditingDept(null); setNewDept({ name: '', description: '', managerId: '' }); setShowDeptForm(true); }} className="btn-primary h-9 gap-1.5 text-xs"><Plus size={14} /> Ajouter un département</button>
                  </div>
                  {departments.length === 0 ? <GlassCard><p className="p-5 text-sm text-[var(--text-muted)]">Aucun département enregistré.</p></GlassCard> : (
                    <div className="grid gap-3 md:grid-cols-2">
                      {departments.map((dept: any) => {
                        const assigned = users.filter((person: any) => person.departmentId === dept.id).length;
                        return <GlassCard key={dept.id}><div className="flex items-start justify-between gap-3 p-4">
                          <div><h4 className="text-sm font-semibold text-[var(--text-primary)]">{dept.name}</h4><p className="mt-1 text-xs text-[var(--text-muted)]">{dept.description || 'Aucune description'}</p><p className="mt-2 text-xs text-[var(--text-secondary)]">Responsable : {dept.managerName || 'Non assigné'} · {assigned} utilisateur(s)</p></div>
                          <div className="flex shrink-0 gap-1"><button aria-label="Modifier le département" onClick={() => { setEditingDept(dept); setNewDept({ name: dept.name, description: dept.description || '', managerId: dept.managerId || '' }); setShowDeptForm(true); }} className="btn-secondary h-8 px-2"><Edit3 size={13} /></button><button aria-label="Supprimer le département" onClick={() => handleDeleteDepartment(dept.id)} className="btn-secondary h-8 px-2 text-red-400"><Trash2 size={13} /></button></div>
                        </div></GlassCard>;
                      })}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'messaging' && (
                <div className="space-y-4">
                  <GlassCard><div className="p-5">
                    <h3 className="mb-3 flex items-center gap-2 text-base font-semibold text-[var(--text-primary)]"><MessageSquare size={16} className="text-[var(--accent-primary)]" /> Paramètres de messagerie</h3>
                    <Toggle label="Messages directs entre utilisateurs" value={messaging.allowDirectMessages} onChange={() => setMessaging((p: any) => ({ ...p, allowDirectMessages: !p.allowDirectMessages }))} />
                    <Toggle label="Canaux par département" value={messaging.allowDepartmentChannels} onChange={() => setMessaging((p: any) => ({ ...p, allowDepartmentChannels: !p.allowDepartmentChannels }))} />
                    <Toggle label="Invités externes dans les conversations" value={messaging.allowExternalGuests} onChange={() => setMessaging((p: any) => ({ ...p, allowExternalGuests: !p.allowExternalGuests }))} />
                    <Toggle label="Partage de fichiers" value={messaging.allowFiles} onChange={() => setMessaging((p: any) => ({ ...p, allowFiles: !p.allowFiles }))} />
                    <Toggle label="Appels audio et vidéo" value={messaging.allowAudioVideoCalls} onChange={() => setMessaging((p: any) => ({ ...p, allowAudioVideoCalls: !p.allowAudioVideoCalls }))} />
                    <div className="mt-3 max-w-xs"><Si label="Afficher les conversations des derniers (jours)" type="number" value={messaging.retentionDays} onChange={(e: any) => setMessaging({ ...messaging, retentionDays: Math.max(1, Number(e.target.value)) })} /></div>
                  </div></GlassCard>
                  <GlassCard><div className="p-5">
                    <div className="mb-3 flex items-center justify-between"><div><h3 className="text-sm font-semibold text-[var(--text-primary)]">Canaux enregistrés</h3><p className="text-xs text-[var(--text-muted)]">Les nouveaux canaux sont immédiatement visibles dans la Messagerie.</p></div><span className="text-xs text-[var(--text-muted)]">{chats.length} canal(aux)</span></div>
                    <div className="mb-4 grid gap-2 sm:grid-cols-2"><input value={newChat.name} onChange={e => setNewChat({ ...newChat, name: e.target.value })} placeholder="Nom du canal" className="h-9 px-3 glass-input text-sm"/><select value={newChat.scope} onChange={e => setNewChat({ ...newChat, scope: e.target.value as 'general' | 'department' })} className="h-9 px-3 glass-input text-sm"><option value="general">Général</option><option value="department" disabled={!messaging.allowDepartmentChannels}>Département</option></select>
                      {newChat.scope === 'department' && <select value={newChat.departmentId} onChange={e => setNewChat({ ...newChat, departmentId: e.target.value })} className="h-9 px-3 glass-input text-sm"><option value="">Choisir un département</option>{departments.map((d: any) => <option key={d.id} value={d.id}>{d.name}</option>)}</select>}
                      <input value={newChat.description} onChange={e => setNewChat({ ...newChat, description: e.target.value })} placeholder="Description (facultative)" className="h-9 px-3 glass-input text-sm"/>
                    </div><button onClick={handleCreateChat} className="btn-primary h-9 gap-1.5 text-xs"><Plus size={14}/> Créer le canal</button>
                    <div className="mt-4 divide-y divide-[var(--divider)]">{chats.map((chat: any) => <div key={chat.id} className="flex items-center justify-between gap-3 py-2.5"><div><p className="text-sm font-medium text-[var(--text-primary)]">{chat.name}</p><p className="text-xs text-[var(--text-muted)]">{chat.scope === 'department' ? chat.departmentName || 'Département' : 'Canal général'}{chat.description ? ` · ${chat.description}` : ''}</p></div><button onClick={() => { updateAndNotify('chats', chat.id, { isArchived: !chat.isArchived }); setChats(getAll('chats')); }} className="btn-secondary h-8 px-3 text-xs">{chat.isArchived ? 'Réactiver' : 'Archiver'}</button></div>)}</div>
                  </div></GlassCard>
                </div>
              )}

              {activeTab === 'notifications' && (
                <div className="space-y-4">
                  <GlassCard><div className="p-5">
                    <h3 className="mb-1 flex items-center gap-2 text-base font-semibold text-[var(--text-primary)]"><Bell size={16} className="text-[var(--accent-primary)]"/> Canaux et alertes</h3>
                    <p className="mb-3 text-xs text-[var(--text-muted)]">Choisissez les alertes navigateur et les événements à suivre. L’envoi d’e-mails et les synthèses nécessitent un service serveur configuré.</p>
                    <Toggle label="Notifications dans le navigateur" value={notifications.pushNotifications} onChange={() => setNotifications((p: any) => ({ ...p, pushNotifications: !p.pushNotifications }))}/>
                    <Toggle label="Alertes par e-mail" value={notifications.emailAlerts} onChange={() => setNotifications((p: any) => ({ ...p, emailAlerts: !p.emailAlerts }))}/>
                    <Toggle label="Rappels d’échéance des factures" value={notifications.invoiceReminder} onChange={() => setNotifications((p: any) => ({ ...p, invoiceReminder: !p.invoiceReminder }))}/>
                    <Toggle label="Demandes de validation de dépenses" value={notifications.expenseApproval} onChange={() => setNotifications((p: any) => ({ ...p, expenseApproval: !p.expenseApproval }))}/>
                    <Toggle label="Nouveaux prospects et leads" value={notifications.newLeadAlert} onChange={() => setNotifications((p: any) => ({ ...p, newLeadAlert: !p.newLeadAlert }))}/>
                    <Toggle label="Alertes de sécurité" value={notifications.securityAlert} onChange={() => setNotifications((p: any) => ({ ...p, securityAlert: !p.securityAlert }))}/>
                    <Toggle label="Synthèse quotidienne" value={notifications.dailyDigest} onChange={() => setNotifications((p: any) => ({ ...p, dailyDigest: !p.dailyDigest }))}/>
                    <Toggle label="Rapport hebdomadaire" value={notifications.weeklyReport} onChange={() => setNotifications((p: any) => ({ ...p, weeklyReport: !p.weeklyReport }))}/>
                    <div className="mt-4 flex flex-wrap gap-2"><button onClick={handleTestNotification} className="btn-secondary h-9 text-xs">Envoyer une notification de test</button><button onClick={handleSave} className="btn-primary h-9 gap-1.5 text-xs"><Save size={14}/> Enregistrer ces préférences</button></div>
                  </div></GlassCard>
                </div>
              )}

              {activeTab === 'security' && (
                <div className="space-y-4">
                  <GlassCard><div className="p-5">
                    <h3 className="mb-1 flex items-center gap-2 text-base font-semibold text-[var(--text-primary)]"><Shield size={16} className="text-[var(--accent-primary)]"/> Politique de sécurité</h3>
                    <p className="mb-3 text-xs text-[var(--text-muted)]">Le délai d’inactivité et la longueur minimale sont appliqués à la session et au changement de mot de passe.</p>
                    <div className="grid gap-4 md:grid-cols-2"><Si label="Déconnexion après inactivité (minutes, 0 = désactivée)" type="number" value={security.sessionTimeout} onChange={(e: any) => setSecurity({ ...security, sessionTimeout: Math.max(0, Number(e.target.value)) })}/><Si label="Longueur minimale du mot de passe" type="number" value={security.passwordMinLength} onChange={(e: any) => setSecurity({ ...security, passwordMinLength: Math.max(12, Number(e.target.value)) })}/></div>
                    <Toggle label="Exiger un caractère spécial au changement de mot de passe" value={security.requireSpecialChar} onChange={() => setSecurity((p: any) => ({ ...p, requireSpecialChar: !p.requireSpecialChar }))}/>
                    <Toggle label="Journaliser les actions d’administration" value={security.auditLog} onChange={() => setSecurity((p: any) => ({ ...p, auditLog: !p.auditLog }))}/>
                    <div className="mt-3"><button onClick={handleSave} className="btn-primary h-9 gap-1.5 text-xs"><Save size={14}/> Enregistrer la politique</button></div>
                  </div></GlassCard>
                  {security.auditLog && <GlassCard><div className="p-5"><div className="mb-3 flex items-center justify-between"><h3 className="text-sm font-semibold text-[var(--text-primary)]">Journal d’audit récent</h3><span className="text-xs text-[var(--text-muted)]">Actions de configuration</span></div><div className="max-h-64 space-y-2 overflow-y-auto">{(getAll('auditLogs') as any[]).slice(-20).reverse().map((entry: any) => <div key={entry.id} className="flex flex-wrap justify-between gap-2 border-b border-[var(--divider)] pb-2 text-xs"><span className="text-[var(--text-primary)]">{entry.details || entry.action}</span><span className="text-[var(--text-muted)]">{new Date(entry.createdAt).toLocaleString('fr-FR')} · {entry.userName}</span></div>)}</div></div></GlassCard>}
                  {authAccountLoading ? (
                    <GlassCard><div className="p-5 text-sm text-[var(--text-secondary)]">Chargement du compte…</div></GlassCard>
                  ) : !authAccount?.hasPassword ? (
                    <GlassCard>
                      <div className="p-5">
                        <h3 className="flex items-center gap-2 text-base font-semibold text-[var(--text-primary)]">
                          <Lock size={16} className="text-[var(--accent-primary)]" /> Compte connecté avec Google
                        </h3>
                        <p className="mt-1 text-sm text-[var(--text-secondary)]">
                          Ce compte n’a pas de mot de passe IDIBAGES. Gérez votre mot de passe depuis votre compte Google.
                        </p>
                      </div>
                    </GlassCard>
                  ) : <GlassCard>
                    <form onSubmit={handlePasswordChange} className="space-y-4 p-5">
                      <div>
                        <h3 className="flex items-center gap-2 text-base font-semibold text-[var(--text-primary)]">
                          <Lock size={16} className="text-[var(--accent-primary)]" /> Mot de passe du compte
                        </h3>
                        <p className="mt-1 text-sm text-[var(--text-secondary)]">
                          Choisissez au moins {security.passwordMinLength} caractères. La modification ferme vos autres sessions.
                        </p>
                      </div>
                      <div className="grid gap-4 md:grid-cols-3">
                        <label className="space-y-1.5 text-xs font-semibold text-[var(--text-secondary)]">
                          Mot de passe actuel
                          <input autoComplete="current-password" required type="password" value={passwordForm.currentPassword} onChange={(event) => setPasswordForm({ ...passwordForm, currentPassword: event.target.value })} className="glass-input mt-1 h-11 w-full px-3 text-sm" />
                        </label>
                        <label className="space-y-1.5 text-xs font-semibold text-[var(--text-secondary)]">
                          Nouveau mot de passe
                          <input autoComplete="new-password" required minLength={security.passwordMinLength} maxLength={128} type="password" value={passwordForm.newPassword} onChange={(event) => setPasswordForm({ ...passwordForm, newPassword: event.target.value })} className="glass-input mt-1 h-11 w-full px-3 text-sm" />
                        </label>
                        <label className="space-y-1.5 text-xs font-semibold text-[var(--text-secondary)]">
                          Confirmer le nouveau mot de passe
                          <input autoComplete="new-password" required minLength={security.passwordMinLength} maxLength={128} type="password" value={passwordForm.confirmPassword} onChange={(event) => setPasswordForm({ ...passwordForm, confirmPassword: event.target.value })} className="glass-input mt-1 h-11 w-full px-3 text-sm" />
                        </label>
                      </div>
                      <button type="submit" disabled={changePassword.isPending} className="btn-primary h-10 px-4 text-sm disabled:cursor-wait disabled:opacity-60">
                        {changePassword.isPending ? 'Mise à jour…' : 'Changer le mot de passe'}
                      </button>
                    </form>
                  </GlassCard>}
                </div>
              )}

              {/* ====== USERS ====== */}
              {activeTab === 'users' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex-1 max-w-xs relative">
                      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                      <input value={searchUser} onChange={(e: any) => setSearchUser(e.target.value)} placeholder="Rechercher..." className="w-full h-9 pl-9 pr-4 glass-input text-sm" />
                    </div>
                    <button onClick={() => setShowUserForm(true)} className="btn-primary h-9 gap-1.5 text-xs font-bold"><Plus size={14} /> Ajouter un utilisateur</button>
                  </div>
                  <GlassCard><div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead><tr className="border-b border-[var(--divider)] text-[10px] text-[var(--text-muted)] uppercase"><th className="text-left p-3">Utilisateur</th><th className="text-left p-3">Rôle</th><th className="text-left p-3">Département</th><th className="text-left p-3">Statut</th><th className="text-left p-3">Date création</th><th className="text-center p-3">Action</th></tr></thead>
                      <tbody>
                        {users.filter((u: any) => !searchUser || u.displayName?.toLowerCase().includes(searchUser.toLowerCase()) || u.email?.toLowerCase().includes(searchUser.toLowerCase())).map((u: any) => (
                          <tr key={u.uid} className="border-b border-[var(--divider)]/50 hover:bg-white/[0.02]">
                            <td className="p-3"><div className="flex items-center gap-2"><div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--accent-primary)] to-[var(--accent-primary-hover)] flex items-center justify-center text-white text-xs font-bold">{(u.displayName || '?').charAt(0)}</div><div><p className="text-[var(--text-primary)] font-medium">{u.displayName || '—'}</p><p className="text-[10px] text-[var(--text-muted)]">{u.email}</p></div></div></td>
                            <td className="p-3 text-[var(--text-secondary)]">{u.roleName || '—'}</td>
                            <td className="p-3 text-[var(--text-secondary)]">{u.departmentId ? (departments.find((d: any) => d.id === u.departmentId)?.name || '—') : '—'}</td>
                            <td className="p-3"><StatusBadge status={u.status || 'active'} /></td>
                            <td className="p-3 text-[var(--text-muted)]">{u.createdAt ? new Date(u.createdAt).toLocaleDateString('fr-FR') : '—'}</td>
                            <td className="p-3"><div className="flex items-center justify-center gap-1"><button onClick={() => handleDeleteUser(u.uid)} className="p-1.5 rounded hover:bg-white/5 text-[var(--accent-danger)]"><Trash2 size={12} /></button></div></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div></GlassCard>
                </div>
              )}

              {/* ====== ROLES ====== */}
              {activeTab === 'roles' && (
                <div className="space-y-4">
                  <div className="flex justify-end"><button onClick={() => { setEditingRole(null); setNewRole({ name: '', description: '', permissions: [] }); setShowRoleForm(true); }} className="btn-primary h-9 gap-1.5 text-xs font-bold"><Plus size={14} /> Nouveau rôle</button></div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {roles.map((r: any) => (
                      <GlassCard key={r.id}><div className="p-4">
                        <div className="flex items-center justify-between mb-2"><h4 className="text-sm font-semibold text-[var(--text-primary)]">{r.name}</h4><span className="text-[10px] text-[var(--text-muted)] bg-[var(--bg-elevated)] px-2 py-0.5 rounded">{(r.permissions || []).length} perms</span></div>
                        <p className="text-xs text-[var(--text-secondary)] mb-3">{r.description}</p>
                        <div className="flex flex-wrap gap-1 mb-3">{(r.permissions || []).slice(0, 6).map((p: string) => <span key={p} className="text-[9px] bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] px-1.5 py-0.5 rounded">{p}</span>)}{(r.permissions || []).length > 6 && <span className="text-[9px] text-[var(--text-muted)]">+{(r.permissions || []).length - 6}</span>}</div>
                        <button onClick={() => { setEditingRole(r); setNewRole({ name: r.name, description: r.description, permissions: [...(r.permissions || [])] }); setShowRoleForm(true); }} className="text-[10px] text-[var(--accent-secondary)] hover:underline flex items-center gap-1"><Edit3 size={10} /> Modifier</button>
                      </div></GlassCard>
                    ))}
                  </div>
                </div>
              )}

              {/* ====== MODULES ACTIVATION ====== */}
              {activeTab === 'modules' && (
                <div className="space-y-4">
                  <GlassCard>
                    <div className="p-5">
                      <h3 className="text-base font-semibold text-[var(--text-primary)] mb-2 flex items-center gap-2">
                        <LayoutGrid size={18} className="text-[var(--accent-primary)]" />
                        Activation & Désactivation des Modules Système
                      </h3>
                      <p className="text-xs text-[var(--text-muted)] mb-5">
                        Activez ou désactivez les fonctionnalités selon l'abonnement souscrit et l'organisation de votre entreprise. Les modules désactivés seront automatiquement masqués du menu latéral.
                      </p>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {[
                          { key: 'projects', label: 'Gestion des Projets', desc: 'Kanban, suivi des tâches et jalons' },
                          { key: 'commercial', label: 'Gestion Commerciale', desc: 'Clients, Devis, Factures & Bons de commande' },
                          { key: 'accounting', label: 'Comptabilité SYSCOHADA', desc: 'Plan comptable complet, journaux & DSF' },
                          { key: 'assets', label: 'Immobilisations', desc: 'Gestion des équipements et amortissements' },
                          { key: 'expenses', label: 'Dépenses & Notes de frais', desc: 'Demandes de remboursement et validation' },
                          { key: 'hr', label: 'RH, Paie & Congés', desc: 'Gestion du personnel, paie et demandes de congés' },
                          { key: 'vibe', label: 'Vibe Prospecting IA', desc: 'Scraping de leads, tendances et messages IA' },
                          { key: 'chat', label: 'Messagerie & Chat', desc: 'Canaux internes, discussions clients et fichiers' },
                          { key: 'audioVideoCalls', label: 'Appels Audio & Vidéo', desc: 'Réunions d\'équipe virtuelles en direct' },
                          { key: 'aiNotetaker', label: 'AI Notetaker & Synthèse IA', desc: 'Transcription automatique et compte-rendu IA' },
                          { key: 'innovation', label: 'Innovation & Idées', desc: 'Soumission d\'idées et boîtes à suggestions' },
                          { key: 'library', label: 'Bibliothèque de Documents', desc: 'Gestionnaire de fichiers et modèles' },
                          { key: 'reports', label: 'Rapports & Statistiques', desc: 'Analyses financières et rapports d\'activité' },
                          { key: 'partnerPortal', label: 'Portail Business Partners', desc: 'Accès dédié aux partenaires externes' },
                          { key: 'vendorPortal', label: 'Portail Fournisseurs', desc: 'Commandes et facturation fournisseurs' },
                          { key: 'invoiceHeader', label: 'Papier En-Tête & Pied de Page', desc: 'Personnalisation des documents à imprimer' },
                        ].map((m) => (
                          <div key={m.key} className="p-3.5 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
                            <div>
                              <p className="text-xs font-bold text-white">{m.label}</p>
                              <p className="text-[10px] text-[var(--text-muted)] mt-0.5">{m.desc}</p>
                            </div>
                            <Toggle
                              label=""
                              ariaLabel={m.label}
                              value={(modules as any)[m.key] !== false}
                              onChange={() => setModules((prev: any) => ({ ...prev, [m.key]: !(prev[m.key] !== false) }))}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </GlassCard>
                </div>
              )}

              {/* ====== SYSTEM & MULTI-COMPANIES ====== */}
              {activeTab === 'system' && (
                <div className="space-y-4">
                  {/* Multi-Company Configuration */}
                  <GlassCard><div className="p-5">
                    <h3 className="text-base font-semibold text-[var(--text-primary)] mb-2 flex items-center gap-2"><Layers size={16} className="text-[var(--accent-primary)]" /> Entreprises accessibles</h3>
                    <p className="mb-4 text-sm text-[var(--text-secondary)]">Les accès aux entreprises sont vérifiés sur le serveur. Cette liste contient uniquement les espaces associés à votre compte.</p>
                    {companies.length === 0 ? (
                      <p className="rounded-xl bg-[var(--bg-card-hover)] p-4 text-sm text-[var(--text-muted)]">Aucune entreprise n’est encore associée à votre compte.</p>
                    ) : (
                      <div className="space-y-2">
                        {companies.map((company) => (
                          <div key={company.id} className="flex items-center justify-between gap-3 rounded-xl border border-[var(--glass-border)] bg-[var(--bg-card-hover)] p-3">
                            <div className="flex min-w-0 items-center gap-3">
                              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--accent-primary)]/10 text-sm font-bold text-[var(--accent-primary)]">{company.name.charAt(0)}</div>
                              <div className="min-w-0">
                                <p className="truncate text-sm font-semibold text-[var(--text-primary)]">{company.name}</p>
                                <p className="truncate text-xs text-[var(--text-muted)]">{[company.city, company.country].filter(Boolean).join(', ')}</p>
                              </div>
                            </div>
                            {activeCompanyId === company.id ? (
                              <span className="rounded-full bg-[var(--accent-primary)]/10 px-2.5 py-1 text-[10px] font-semibold text-[var(--accent-primary)]">Sélectionnée</span>
                            ) : (
                              <button onClick={() => setActiveCompanyId(company.id)} className="btn-secondary h-8 shrink-0 px-3 text-xs">Sélectionner</button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                    <a href="/register" className="btn-secondary mt-4 h-9 text-xs"><Plus size={14} /> Ajouter une entreprise</a>
                  </div></GlassCard>
                  {/* Backups */}
                  <GlassCard><div className="p-5">
                    <h3 className="text-base font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2"><Database size={16} className="text-[var(--accent-primary)]" /> Sauvegardes & Exportations</h3>
                    <Toggle label="Sauvegarde automatique quotidienne" value={system.autoBackup} onChange={() => setSystem(p => ({ ...p, autoBackup: !p.autoBackup }))} />
                    <div className="mt-3 grid gap-3 sm:grid-cols-2"><Si label="Fréquence des sauvegardes" options={[{ v: 'daily', l: 'Chaque jour' }, { v: 'weekly', l: 'Chaque semaine' }, { v: 'monthly', l: 'Chaque mois' }]} value={system.backupFrequency} onChange={(event: any) => setSystem({ ...system, backupFrequency: event.target.value })} /><Si label="Durée de conservation (jours)" type="number" value={system.dataRetention} onChange={(event: any) => setSystem({ ...system, dataRetention: Math.max(1, Number(event.target.value)) })} /></div>
                    <button onClick={handleDownloadBackup} className="btn-secondary mt-3 h-9 gap-2 text-xs"><Download size={14}/> Télécharger une sauvegarde maintenant</button>
                  </div></GlassCard>
                  <GlassCard><div className="p-5">
                    <h3 className="mb-3 flex items-center gap-2 text-base font-semibold text-[var(--text-primary)]"><Server size={16} className="text-[var(--accent-primary)]"/> Politique système</h3>
                    <div className="grid gap-3 sm:grid-cols-2"><Si label="Limite API (requêtes/heure)" type="number" value={system.apiRateLimit} onChange={(event: any) => setSystem({ ...system, apiRateLimit: Math.max(1, Number(event.target.value)) })} /><Si label="Taille maximale des fichiers (Mo)" type="number" value={system.maxFileSize} onChange={(event: any) => setSystem({ ...system, maxFileSize: Math.max(1, Number(event.target.value)) })} /></div>
                    <Si label="Extensions autorisées (séparées par des virgules)" value={system.allowedFileTypes} onChange={(event: any) => setSystem({ ...system, allowedFileTypes: event.target.value })} />
                    <div className="mt-3"><Toggle label="Mode maintenance" value={system.maintenanceMode} onChange={() => setSystem({ ...system, maintenanceMode: !system.maintenanceMode })} /><Toggle label="Journal de diagnostic détaillé" value={system.debugMode} onChange={() => setSystem({ ...system, debugMode: !system.debugMode })} /></div>
                    <button onClick={handleSave} className="btn-primary mt-3 h-9 gap-1.5 text-xs"><Save size={14}/> Enregistrer les réglages système</button>
                  </div></GlassCard>
                </div>
              )}

            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      <AnimatePresence>
        {(showUserForm || showRoleForm || showDeptForm) && (
          <div className="fixed inset-0 z-[70] flex justify-end bg-black/70 backdrop-blur-sm" onMouseDown={(event) => { if (event.target === event.currentTarget) { setShowUserForm(false); setShowRoleForm(false); setShowDeptForm(false); } }}>
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }} className="h-full max-h-screen w-full max-w-xl space-y-4 overflow-y-auto border-l border-[var(--glass-border)] bg-[var(--bg-card)] p-5 shadow-2xl">
              <div className="flex items-center justify-between border-b border-[var(--divider)] pb-3"><h3 className="text-base font-semibold text-[var(--text-primary)]">{showUserForm ? 'Ajouter un utilisateur' : showRoleForm ? (editingRole ? 'Modifier le rôle' : 'Créer un rôle') : (editingDept ? 'Modifier le département' : 'Créer un département')}</h3><button type="button" onClick={() => { setShowUserForm(false); setShowRoleForm(false); setShowDeptForm(false); }} className="btn-secondary h-8 px-2" aria-label="Fermer"><X size={15}/></button></div>
              {showUserForm && <div className="space-y-3">
                <Si label="Nom complet *" value={newUser.displayName} onChange={(event: any) => setNewUser({ ...newUser, displayName: event.target.value })} placeholder="Nom et prénom" />
                <Si label="Adresse e-mail *" type="email" value={newUser.email} onChange={(event: any) => setNewUser({ ...newUser, email: event.target.value })} placeholder="nom@entreprise.com" />
                <div className="grid gap-3 sm:grid-cols-2"><Si label="Rôle" options={[{ v: '', l: 'Aucun rôle spécifique' }, ...roles.map((role: any) => ({ v: role.id, l: role.name }))]} value={newUser.roleId} onChange={(event: any) => setNewUser({ ...newUser, roleId: event.target.value })} /><Si label="Département" options={[{ v: '', l: 'Aucun département' }, ...departments.map((department: any) => ({ v: department.id, l: department.name }))]} value={newUser.departmentId} onChange={(event: any) => setNewUser({ ...newUser, departmentId: event.target.value })} /></div>
                <Si label="Statut" options={[{ v: 'active', l: 'Actif' }, { v: 'invited', l: 'Invitation en attente' }, { v: 'inactive', l: 'Inactif' }]} value={newUser.status} onChange={(event: any) => setNewUser({ ...newUser, status: event.target.value })} />
                <button type="button" onClick={handleAddUser} className="btn-primary h-9 w-full justify-center">Créer l&apos;utilisateur</button>
              </div>}
              {showRoleForm && <div className="space-y-3">
                <Si label="Nom du rôle *" value={newRole.name} onChange={(event: any) => setNewRole({ ...newRole, name: event.target.value })} placeholder="Ex. Responsable commercial" />
                <Si label="Description" value={newRole.description} onChange={(event: any) => setNewRole({ ...newRole, description: event.target.value })} placeholder="Responsabilités de ce rôle" />
                <fieldset><legend className="mb-2 text-xs font-semibold text-[var(--text-secondary)]">Autorisations</legend><div className="grid grid-cols-2 gap-2 sm:grid-cols-3">{allPermissions.map((permission) => <label key={permission} className="flex items-center gap-2 rounded border border-[var(--glass-border)] p-2 text-xs text-[var(--text-secondary)]"><input type="checkbox" checked={newRole.permissions.includes(permission)} onChange={() => togglePerm(permission)} />{permission}</label>)}</div></fieldset>
                <button type="button" onClick={handleAddRole} className="btn-primary h-9 w-full justify-center">Enregistrer le rôle</button>
              </div>}
              {showDeptForm && <div className="space-y-3">
                <Si label="Nom du département *" value={newDept.name} onChange={(event: any) => setNewDept({ ...newDept, name: event.target.value })} placeholder="Ex. Opérations" />
                <Si label="Description" value={newDept.description} onChange={(event: any) => setNewDept({ ...newDept, description: event.target.value })} placeholder="Mission et périmètre" />
                <Si label="Responsable" options={[{ v: '', l: 'Aucun responsable' }, ...users.map((person: any) => ({ v: person.uid, l: person.displayName }))]} value={newDept.managerId} onChange={(event: any) => setNewDept({ ...newDept, managerId: event.target.value })} />
                <button type="button" onClick={handleAddDept} className="btn-primary h-9 w-full justify-center">Enregistrer le département</button>
              </div>}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Product Form Modal */}
      <AnimatePresence>
        {showProductForm && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex justify-end">
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }} className="h-full w-full max-w-lg space-y-4 overflow-y-auto border-l border-[var(--glass-border)] bg-[var(--bg-card)] p-6 shadow-2xl">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Package size={16} className="text-[var(--accent-primary)]" />
                  {editingProduct ? 'Modifier l\'Article' : 'Nouveau Produit / Article ou Service'}
                </h3>
                <button onClick={() => setShowProductForm(false)} className="p-1 rounded hover:bg-white/10 text-white">
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-3">
                <Si label="Désignation / Nom de l'article *" value={productForm.name} onChange={(e: any) => setProductForm({ ...productForm, name: e.target.value })} placeholder="Ex: Audit Comptable SYSCOHADA" />
                
                <div className="grid grid-cols-2 gap-3">
                  <Si label="Catégorie" options={[{ v: 'Informatique', l: 'Informatique & Tech' }, { v: 'Conseil', l: 'Conseil & Audit' }, { v: 'Logiciel', l: 'Logiciel & SaaS' }, { v: 'Matériel', l: 'Matériel & Équipement' }, { v: 'Service', l: 'Service Général' }]} value={productForm.category} onChange={(e: any) => setProductForm({ ...productForm, category: e.target.value })} />
                  <Si label="Unité de mesure" options={[{ v: 'Forfait', l: 'Forfait' }, { v: 'Unité', l: 'Unité' }, { v: 'Heure', l: 'Heure' }, { v: 'Mois', l: 'Mois' }, { v: 'Jour', l: 'Jour' }]} value={productForm.unit} onChange={(e: any) => setProductForm({ ...productForm, unit: e.target.value })} />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Si label="Prix Unitaire HT (FCFA) *" type="number" value={productForm.unitPriceHT} onChange={(e: any) => setProductForm({ ...productForm, unitPriceHT: e.target.value })} />
                  <Si label="Taux TVA (%)" type="number" value={productForm.taxRate} onChange={(e: any) => setProductForm({ ...productForm, taxRate: e.target.value })} />
                </div>

                <div>
                  <label className="block text-xs text-[var(--text-secondary)] mb-1">Description détaillée</label>
                  <textarea value={productForm.description} onChange={(e: any) => setProductForm({ ...productForm, description: e.target.value })} className="w-full h-20 p-2.5 glass-input text-xs resize-none" placeholder="Détails de la prestation ou de l'article..." />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button onClick={() => setShowProductForm(false)} className="btn-ghost h-9 text-xs">Annuler</button>
                <button onClick={handleSaveProduct} className="btn-primary h-9 text-xs font-bold gap-1.5"><Save size={14} /> Enregistrer l'article</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
