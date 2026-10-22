import type { LucideIcon } from 'lucide-react';
import { Briefcase, Building2, Globe, Hash, Users } from 'lucide-react';
import type { Chat } from '@/types';

type ChatPresentationInput = Pick<Chat, 'type' | 'scope' | 'externalEntityType'>;

export type ChatPresentation = {
  Icon: LucideIcon;
  label: string;
  iconClassName: string;
  avatarClassName: string;
  unreadClassName: string;
};

const presentations: Record<string, ChatPresentation> = {
  client: {
    Icon: Building2,
    label: 'Client',
    iconClassName: 'text-blue-400',
    avatarClassName: 'bg-blue-500/10 text-blue-400',
    unreadClassName: 'bg-blue-500 text-white',
  },
  vendor: {
    Icon: Briefcase,
    label: 'Fournisseur',
    iconClassName: 'text-[var(--accent-primary)]',
    avatarClassName: 'bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]',
    unreadClassName: 'bg-[var(--accent-primary)] text-white',
  },
  partner: {
    Icon: Globe,
    label: 'Partenaire',
    iconClassName: 'text-purple-400',
    avatarClassName: 'bg-purple-500/10 text-purple-400',
    unreadClassName: 'bg-purple-500 text-white',
  },
  other: {
    Icon: Globe,
    label: 'Externe',
    iconClassName: 'text-slate-400',
    avatarClassName: 'bg-slate-500/10 text-slate-400',
    unreadClassName: 'bg-slate-500 text-white',
  },
  department: {
    Icon: Users,
    label: 'Département',
    iconClassName: 'text-emerald-400',
    avatarClassName: 'bg-emerald-500/10 text-emerald-400',
    unreadClassName: 'bg-emerald-500 text-white',
  },
  project: {
    Icon: Briefcase,
    label: 'Projet',
    iconClassName: 'text-amber-400',
    avatarClassName: 'bg-amber-500/10 text-amber-400',
    unreadClassName: 'bg-amber-500 text-white',
  },
  general: {
    Icon: Hash,
    label: 'Général',
    iconClassName: 'text-[var(--accent-primary)]',
    avatarClassName: 'bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]',
    unreadClassName: 'bg-[var(--accent-primary)] text-white',
  },
};

export function getChatPresentation(chat: ChatPresentationInput): ChatPresentation {
  if (chat.type === 'external') return presentations[chat.externalEntityType ?? 'other'];
  return presentations[chat.scope === 'department' || chat.scope === 'project' ? chat.scope : 'general'];
}
