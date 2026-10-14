// ============================================
// PORTAL API SERVICE
// Simulated REST API for Client / Vendor / Partner portals
// All operations use localStorage as persistence layer
// ============================================

import { getAll, addAndNotify, updateAndNotify, removeAndNotify, query } from './db';
import type {
  PortalUser, PortalProject, PortalInvoice, PortalPayment,
  PortalContract, PortalActivity, PortalNotification, PortalNews, PortalNewsComment,
  Idea, IdeaComment, IdeaStatus,
} from '@/types';

// ============================================
// AUTH
// ============================================

export interface PortalLoginCredentials {
  email: string;
  password: string;
  portalType: 'client' | 'vendor' | 'partner';
}

export interface PortalAuthResponse {
  success: boolean;
  user?: PortalUser;
  token?: string;
  error?: string;
}

export function portalLogin(credentials: PortalLoginCredentials): PortalAuthResponse {
  const users = getAll('portalUsers') as PortalUser[];
  const user = users.find(
    u => u.email === credentials.email && u.portalType === credentials.portalType && u.status === 'active'
  );
  if (!user) {
    const available = users.filter(u => u.portalType === credentials.portalType).map(u => u.email).join(', ');
    return { success: false, error: `Identifiants invalides ou compte inactif (dispo: ${available})` };
  }
  // Update last login
  updateAndNotify('portalUsers', user.id, { lastLoginAt: new Date().toISOString() });
  // Log activity
  logPortalActivity(user.id, user.portalType, 'login', 'Connexion au portail');
  return { success: true, user, token: `portal-token-${user.id}-${Date.now()}` };
}

export function portalLogout(): void {
  localStorage.removeItem('portal_session');
}

export function getPortalSession(): { user: PortalUser; token: string } | null {
  const raw = localStorage.getItem('portal_session');
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function setPortalSession(user: PortalUser, token: string): void {
  localStorage.setItem('portal_session', JSON.stringify({ user, token }));
}

// ============================================
// PORTAL USERS (CRUD)
// ============================================

export function getPortalUsers(type?: 'client' | 'vendor' | 'partner'): PortalUser[] {
  const users = getAll('portalUsers') as PortalUser[];
  if (type) return users.filter(u => u.portalType === type);
  return users;
}

export function getPortalUserById(id: string): PortalUser | undefined {
  return (getAll('portalUsers') as PortalUser[]).find(u => u.id === id);
}

export function createPortalUser(user: Omit<PortalUser, 'id' | 'createdAt'>): PortalUser {
  const newUser: PortalUser = {
    ...user,
    id: `portal-${user.portalType}-${Date.now()}`,
    createdAt: new Date().toISOString(),
  };
  addAndNotify('portalUsers', newUser);
  return newUser;
}

export function updatePortalUser(id: string, data: Partial<PortalUser>): void {
  updateAndNotify('portalUsers', id, data);
}

export function deletePortalUser(id: string): void {
  removeAndNotify('portalUsers', id);
}

// ============================================
// PORTAL PROJECTS (CRUD)
// ============================================

export function getPortalProjects(userId?: string): PortalProject[] {
  const projects = getAll('portalProjects') as PortalProject[];
  if (userId) return projects.filter(p => p.portalUserId === userId);
  return projects;
}

export function getPortalProjectById(id: string): PortalProject | undefined {
  return (getAll('portalProjects') as PortalProject[]).find(p => p.id === id);
}

export function createPortalProject(project: Omit<PortalProject, 'id' | 'createdAt' | 'updatedAt'>): PortalProject {
  const now = new Date().toISOString();
  const newProject: PortalProject = {
    ...project,
    id: `pproj-${Date.now()}`,
    createdAt: now,
    updatedAt: now,
  };
  addAndNotify('portalProjects', newProject);
  return newProject;
}

export function updatePortalProject(id: string, data: Partial<PortalProject>): void {
  updateAndNotify('portalProjects', id, { ...data, updatedAt: new Date().toISOString() });
}

export function deletePortalProject(id: string): void {
  removeAndNotify('portalProjects', id);
}

// ============================================
// PORTAL INVOICES (CRUD)
// ============================================

export function getPortalInvoices(userId?: string): PortalInvoice[] {
  const invoices = getAll('portalInvoices') as PortalInvoice[];
  if (userId) return invoices.filter(i => i.portalUserId === userId);
  return invoices;
}

export function getPortalInvoiceById(id: string): PortalInvoice | undefined {
  return (getAll('portalInvoices') as PortalInvoice[]).find(i => i.id === id);
}

export function createPortalInvoice(invoice: Omit<PortalInvoice, 'id' | 'createdAt'>): PortalInvoice {
  const newInvoice: PortalInvoice = {
    ...invoice,
    id: `pinv-${Date.now()}`,
    createdAt: new Date().toISOString(),
  };
  addAndNotify('portalInvoices', newInvoice);
  return newInvoice;
}

export function updatePortalInvoice(id: string, data: Partial<PortalInvoice>): void {
  updateAndNotify('portalInvoices', id, data);
}

export function deletePortalInvoice(id: string): void {
  removeAndNotify('portalInvoices', id);
}

// ============================================
// PORTAL PAYMENTS (CRUD)
// ============================================

export function getPortalPayments(userId?: string): PortalPayment[] {
  const payments = getAll('portalPayments') as PortalPayment[];
  if (userId) return payments.filter(p => p.portalUserId === userId);
  return payments;
}

export function createPortalPayment(payment: Omit<PortalPayment, 'id'>): PortalPayment {
  const newPayment: PortalPayment = {
    ...payment,
    id: `ppay-${Date.now()}`,
  };
  addAndNotify('portalPayments', newPayment);
  return newPayment;
}

// ============================================
// PORTAL CONTRACTS (CRUD)
// ============================================

export function getPortalContracts(userId?: string): PortalContract[] {
  const contracts = getAll('portalContracts') as PortalContract[];
  if (userId) return contracts.filter(c => c.portalUserId === userId);
  return contracts;
}

export function getPortalContractById(id: string): PortalContract | undefined {
  return (getAll('portalContracts') as PortalContract[]).find(c => c.id === id);
}

export function createPortalContract(contract: Omit<PortalContract, 'id' | 'createdAt'>): PortalContract {
  const newContract: PortalContract = {
    ...contract,
    id: `pcon-${Date.now()}`,
    createdAt: new Date().toISOString(),
  };
  addAndNotify('portalContracts', newContract);
  return newContract;
}

export function updatePortalContract(id: string, data: Partial<PortalContract>): void {
  updateAndNotify('portalContracts', id, data);
}

export function deletePortalContract(id: string): void {
  removeAndNotify('portalContracts', id);
}

// ============================================
// PORTAL ACTIVITIES
// ============================================

export function getPortalActivities(userId?: string): PortalActivity[] {
  const activities = getAll('portalActivities') as PortalActivity[];
  if (userId) return activities.filter(a => a.portalUserId === userId);
  return activities.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function logPortalActivity(
  userId: string,
  portalType: 'client' | 'vendor' | 'partner',
  type: PortalActivity['type'],
  description: string,
  metadata?: Record<string, unknown>
): void {
  const activity: PortalActivity = {
    id: `pact-${Date.now()}`,
    portalUserId: userId,
    portalType,
    type,
    description,
    metadata,
    createdAt: new Date().toISOString(),
    companyId: 'comp-1',
  };
  addAndNotify('portalActivities', activity);
}

// ============================================
// PORTAL NOTIFICATIONS
// ============================================

export function getPortalNotifications(userId: string): PortalNotification[] {
  return (getAll('portalNotifications') as PortalNotification[])
    .filter(n => n.portalUserId === userId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function markNotificationAsRead(id: string): void {
  updateAndNotify('portalNotifications', id, { read: true });
}

export function createPortalNotification(notification: Omit<PortalNotification, 'id' | 'createdAt'>): PortalNotification {
  const newNotification: PortalNotification = {
    ...notification,
    id: `pnot-${Date.now()}`,
    createdAt: new Date().toISOString(),
  };
  addAndNotify('portalNotifications', newNotification);
  return newNotification;
}

// ============================================
// STATISTICS / DASHBOARD
// ============================================

export interface PortalStats {
  totalUsers: number;
  activeUsers: number;
  pendingUsers: number;
  totalProjects: number;
  inProgressProjects: number;
  completedProjects: number;
  totalInvoices: number;
  paidInvoices: number;
  overdueInvoices: number;
  totalRevenue: number;
  totalContracts: number;
  recentActivities: PortalActivity[];
}

export function getPortalStats(portalType?: 'client' | 'vendor' | 'partner'): PortalStats {
  const users = getPortalUsers(portalType);
  const projects = portalType
    ? (getAll('portalProjects') as PortalProject[]).filter(p => p.portalType === portalType)
    : getAll('portalProjects') as PortalProject[];
  const invoices = portalType
    ? (getAll('portalInvoices') as PortalInvoice[]).filter(i => i.portalType === portalType)
    : getAll('portalInvoices') as PortalInvoice[];
  const contracts = portalType
    ? (getAll('portalContracts') as PortalContract[]).filter(c => c.portalType === portalType)
    : getAll('portalContracts') as PortalContract[];

  return {
    totalUsers: users.length,
    activeUsers: users.filter(u => u.status === 'active').length,
    pendingUsers: users.filter(u => u.status === 'pending').length,
    totalProjects: projects.length,
    inProgressProjects: projects.filter(p => p.status === 'in_progress').length,
    completedProjects: projects.filter(p => p.status === 'delivered').length,
    totalInvoices: invoices.length,
    paidInvoices: invoices.filter(i => i.status === 'paid').length,
    overdueInvoices: invoices.filter(i => i.status === 'overdue').length,
    totalRevenue: invoices.filter(i => i.status === 'paid').reduce((sum, i) => sum + i.total, 0),
    totalContracts: contracts.length,
    recentActivities: getPortalActivities().slice(0, 10),
  };
}

// ============================================
// LINKING INTERNAL <-> EXTERNAL
// ============================================

export function linkPortalToInternal(portalUserId: string, internalId: string, internalName: string): void {
  updateAndNotify('portalUsers', portalUserId, {
    linkedInternalId: internalId,
    linkedInternalName: internalName,
  });
}

// ============================================
// SEARCH
// ============================================

export function searchPortalData(query: string, portalType?: 'client' | 'vendor' | 'partner') {
  const q = query.toLowerCase();
  const users = getPortalUsers(portalType).filter(u =>
    u.displayName.toLowerCase().includes(q) ||
    u.companyName.toLowerCase().includes(q) ||
    u.email.toLowerCase().includes(q)
  );
  const projects = getPortalProjects().filter(p =>
    p.title.toLowerCase().includes(q) || p.description.toLowerCase().includes(q)
  );
  const invoices = getPortalInvoices().filter(i =>
    i.number.toLowerCase().includes(q)
  );
  return { users, projects, invoices };
}

// ============================================
// PORTAL NEWS (ACTUALITÉS) - SOCIAL FEATURES
// ============================================

export function getPortalNews(targetType?: 'all' | 'client' | 'vendor' | 'partner'): PortalNews[] {
  const news = (getAll('portalNews') || []) as PortalNews[];
  if (!targetType) return news.filter(n => n.isPublished).sort((a, b) => new Date(b.publishedAt || b.createdAt).getTime() - new Date(a.publishedAt || a.createdAt).getTime());
  return news.filter(n => n.isPublished && (n.targetType === 'all' || n.targetType === targetType)).sort((a, b) => new Date(b.publishedAt || b.createdAt).getTime() - new Date(a.publishedAt || a.createdAt).getTime());
}

export function getAllPortalNews(): PortalNews[] {
  const news = (getAll('portalNews') || []) as PortalNews[];
  return news.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function getPortalNewsById(id: string): PortalNews | undefined {
  const news = (getAll('portalNews') || []) as PortalNews[];
  return news.find(n => n.id === id);
}

export function createPortalNews(news: Omit<PortalNews, 'id' | 'createdAt'>): PortalNews {
  const item: PortalNews = {
    ...news,
    id: `pnews-${Date.now()}`,
    createdAt: new Date().toISOString(),
  };
  addAndNotify('portalNews', item);
  return item;
}

export function updatePortalNews(id: string, data: Partial<PortalNews>): void {
  updateAndNotify('portalNews', id, { ...data, updatedAt: new Date().toISOString() });
}

export function deletePortalNews(id: string): void {
  removeAndNotify('portalNews', id);
}

// ---- Social interactions ----

export function toggleLikeNews(newsId: string, userId: string): { liked: boolean; likes: number } {
  const news = getPortalNewsById(newsId);
  if (!news) return { liked: false, likes: 0 };
  const likedBy = news.likedBy || [];
  const alreadyLiked = likedBy.includes(userId);
  if (alreadyLiked) {
    const updated = likedBy.filter(id => id !== userId);
    updateAndNotify('portalNews', newsId, { likedBy: updated, likes: Math.max(0, (news.likes || 0) - 1) });
    return { liked: false, likes: Math.max(0, (news.likes || 0) - 1) };
  } else {
    const updated = [...likedBy, userId];
    updateAndNotify('portalNews', newsId, { likedBy: updated, likes: (news.likes || 0) + 1 });
    return { liked: true, likes: (news.likes || 0) + 1 };
  }
}

export function addCommentToNews(newsId: string, userId: string, userName: string, content: string): PortalNewsComment {
  const news = getPortalNewsById(newsId);
  if (!news) throw new Error('News not found');
  const comment: PortalNewsComment = {
    id: `nc-${Date.now()}`,
    userId,
    userName,
    content,
    createdAt: new Date().toISOString(),
  };
  const comments = [...(news.comments || []), comment];
  updateAndNotify('portalNews', newsId, { comments });
  return comment;
}

export function shareNews(newsId: string): number {
  const news = getPortalNewsById(newsId);
  if (!news) return 0;
  const shares = (news.shares || 0) + 1;
  updateAndNotify('portalNews', newsId, { shares });
  return shares;
}

// ============================================
// INNOVATION / IDEAS
// ============================================

export function getIdeaById(id: string): Idea | undefined {
  const ideas = getAll('ideas') as Idea[];
  return ideas.find(i => i.id === id);
}

export function toggleLikeIdea(ideaId: string, userId: string): { liked: boolean; upvotes: number } {
  const idea = getIdeaById(ideaId);
  if (!idea) return { liked: false, upvotes: 0 };
  const likedBy = idea.likedBy || [];
  const alreadyLiked = likedBy.includes(userId);
  let newLikedBy: string[];
  let newUpvotes: number;
  if (alreadyLiked) {
    newLikedBy = likedBy.filter(uid => uid !== userId);
    newUpvotes = Math.max(0, (idea.upvotes || 0) - 1);
  } else {
    newLikedBy = [...likedBy, userId];
    newUpvotes = (idea.upvotes || 0) + 1;
  }
  updateAndNotify('ideas', ideaId, {
    likedBy: newLikedBy,
    upvotes: newUpvotes,
    hasUpvoted: newLikedBy.length > 0,
  });
  return { liked: !alreadyLiked, upvotes: newUpvotes };
}

export function addCommentToIdea(ideaId: string, userId: string, userName: string, content: string): IdeaComment {
  const idea = getIdeaById(ideaId);
  if (!idea) throw new Error('Idea not found');
  const comment: IdeaComment = {
    id: `ic-${Date.now()}`,
    userId,
    userName,
    content,
    createdAt: new Date().toISOString(),
  };
  const commentsList = [...(idea.commentsList || []), comment];
  updateAndNotify('ideas', ideaId, {
    commentsList,
    comments: commentsList.length,
  });
  return comment;
}

export function updateIdeaStatus(ideaId: string, status: IdeaStatus): void {
  updateAndNotify('ideas', ideaId, { status });
}

export interface PortalAccountForm {
  email: string;
  password: string;
  displayName: string;
  portalType: 'client' | 'vendor' | 'partner';
  companyName: string;
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
  ifu?: string;
  rccm?: string;
  linkedInternalId?: string;
  linkedInternalName?: string;
}

export function createPortalAccount(form: PortalAccountForm): PortalUser {
  const now = new Date().toISOString();
  const user: PortalUser = {
    id: `portal-${form.portalType}-${Date.now()}`,
    email: form.email,
    displayName: form.displayName,
    portalType: form.portalType,
    companyName: form.companyName,
    companyId: 'comp-1',
    phone: form.phone,
    address: form.address,
    city: form.city,
    country: form.country,
    ifu: form.ifu,
    rccm: form.rccm,
    status: 'active',
    createdAt: now,
    lastLoginAt: undefined,
    linkedInternalId: form.linkedInternalId,
    linkedInternalName: form.linkedInternalName,
  };
  addAndNotify('portalUsers', user);
  return user;
}

export function updatePortalAccount(id: string, data: Partial<PortalAccountForm>): void {
  const updateData: Partial<PortalUser> = {};
  if (data.email) updateData.email = data.email;
  if (data.displayName) updateData.displayName = data.displayName;
  if (data.companyName) updateData.companyName = data.companyName;
  if (data.phone !== undefined) updateData.phone = data.phone;
  if (data.address !== undefined) updateData.address = data.address;
  if (data.city !== undefined) updateData.city = data.city;
  if (data.country !== undefined) updateData.country = data.country;
  if (data.ifu !== undefined) updateData.ifu = data.ifu;
  if (data.rccm !== undefined) updateData.rccm = data.rccm;
  updateAndNotify('portalUsers', id, updateData);
}

export function changePortalPassword(id: string, newPassword: string): void {
  // Simulated - in real app this would hash the password
  updateAndNotify('portalUsers', id, { status: 'active' });
}
