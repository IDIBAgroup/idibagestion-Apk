import { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from '@/lib/navigation';
import {
  MessageSquare, Plus, Search, Send, MoreVertical, UserPlus,
  Users, Building2, Briefcase, Archive, Trash2, Edit3, X,
  ChevronLeft, Hash, Globe, Lock, Paperclip, Smile, Reply,
  CheckCheck, Clock, Filter, User, Crown, Video, Phone, Monitor,
  Mic, MicOff, VideoOff, PhoneOff, Sparkles, Bot, Share2, FileText, CheckCircle2,
  MessageCircle, ScreenShare, Loader2
} from 'lucide-react';
import { getAll, addAndNotify, updateAndNotify, removeAndNotify, subscribe } from '@/lib/db';
import { useAuth } from '@/hooks/useAuth';
import { useUIStore } from '@/stores/uiStore';
import type { Chat, ChatMessage, ChatParticipant, User as UserType } from '@/types';
import { cn } from '@/lib/utils';

// ============================================
// CHAT PAGE - Messagerie Interne & Externe
// ============================================

export function ChatPage() {
  const { user } = useAuth();
  const { sidebarOpen, showToast, setCurrentPageTitle } = useUIStore();
  const navigate = useNavigate();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const callVideoRef = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);

  // ---- State ----
  const [chats, setChats] = useState<Chat[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [users, setUsers] = useState<UserType[]>([]);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [messageInput, setMessageInput] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'internal' | 'external'>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showParticipantsModal, setShowParticipantsModal] = useState(false);
  const [showMobileList, setShowMobileList] = useState(true);
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);
  const [chatMenuOpen, setChatMenuOpen] = useState<string | null>(null);
  const [showMeetingModal, setShowMeetingModal] = useState(false);
  const [meetingType, setMeetingType] = useState<'video' | 'audio' | 'screen_share'>('video');
  const [isCallActive, setIsCallActive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isCamOff, setIsCamOff] = useState(false);
  const [isSharingScreen, setIsSharingScreen] = useState(false);
  const [callStartedAt, setCallStartedAt] = useState<number | null>(null);
  const [callElapsedSeconds, setCallElapsedSeconds] = useState(0);
  const [callPanelTab, setCallPanelTab] = useState<'chat' | 'notes'>('chat');
  const [callMessageInput, setCallMessageInput] = useState('');
  const [isJoiningCall, setIsJoiningCall] = useState(false);
  const [isNotetakerActive, setIsNotetakerActive] = useState(true);
  const [notetakerNotes, setNotetakerNotes] = useState<string[]>([
    "Ordre du jour: Synchronisation d'équipe & révision du budget d'exploitation",
    "Présentation de la feuille de route du T4 par l'administration",
    "Validation des livrables et de l'automatisation des factures/devis",
    "Action demandée: Finaliser la soumission du relevé OHADA pour le closing"
  ]);

  // Create chat form
  const [newChatName, setNewChatName] = useState('');
  const [newChatDesc, setNewChatDesc] = useState('');
  const [newChatType, setNewChatType] = useState<'internal' | 'external'>('internal');
  const [newChatScope, setNewChatScope] = useState<Chat['scope']>('general');
  const [newChatExternalName, setNewChatExternalName] = useState('');
  const [newChatExternalType, setNewChatExternalType] = useState<'client' | 'vendor' | 'partner' | 'other'>('client');
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([]);
  const [messagingPolicy, setMessagingPolicy] = useState({ allowDirectMessages: true, allowExternalGuests: false, allowFiles: true, allowAudioVideoCalls: true, allowDepartmentChannels: true, retentionDays: 365, maxFileSize: 10, allowedFileTypes: 'pdf,jpg,png,doc,docx,xls,xlsx' });

  // Permission checks
  const isAdmin = user?.roleName === 'Administrateur' || user?.permissions?.includes('*');
  const isManager = user?.roleName === 'Manager' || isAdmin;
  const canCreateChat = isAdmin || isManager;

  // ---- Load data ----
  useEffect(() => {
    const syncPolicy = () => {
      try {
        const settings = JSON.parse(localStorage.getItem('idibages_settings_v1') || '{}');
        const retentionDays = Math.max(1, Number(settings.messaging?.retentionDays ?? 365));
        setMessagingPolicy({
          allowDirectMessages: settings.messaging?.allowDirectMessages ?? true,
          allowExternalGuests: settings.messaging?.allowExternalGuests ?? false,
          allowFiles: settings.messaging?.allowFiles ?? true,
          allowAudioVideoCalls: settings.messaging?.allowAudioVideoCalls ?? true,
          allowDepartmentChannels: settings.messaging?.allowDepartmentChannels ?? true,
          retentionDays,
          maxFileSize: Number(settings.system?.maxFileSize ?? 10),
          allowedFileTypes: settings.system?.allowedFileTypes ?? 'pdf,jpg,png,doc,docx,xls,xlsx',
        });
      } catch { /* Keep safe defaults if local preferences are malformed. */ }
    };
    syncPolicy();
    window.addEventListener('idibages-settings-updated', syncPolicy);
    return () => window.removeEventListener('idibages-settings-updated', syncPolicy);
  }, []);

  useEffect(() => {
    const load = () => {
      setChats(getAll('chats') as Chat[]);
      setMessages(getAll('chatMessages') as ChatMessage[]);
      setUsers(getAll('users') as UserType[]);
    };
    load();
    const unsub1 = subscribe('chats', load);
    const unsub2 = subscribe('chatMessages', load);
    return () => { unsub1(); unsub2(); };
  }, []);

  useEffect(() => { setCurrentPageTitle('Messagerie'); }, [setCurrentPageTitle]);

  useEffect(() => {
    const openRequestedCall = (request: { chatId?: string; type?: 'video' | 'audio' }) => {
      if (!request.chatId || !chats.some(chat => chat.id === request.chatId)) return;
      sessionStorage.removeItem('idibages_pending_chat_call');
      setSelectedChatId(request.chatId);
      setShowMobileList(false);
      setMeetingType(request.type === 'audio' ? 'audio' : 'video');
      setShowMeetingModal(true);
    };
    const handleCallRequest = (event: Event) => {
      openRequestedCall((event as CustomEvent<{ chatId?: string; type?: 'video' | 'audio' }>).detail || {});
    };
    try {
      const pendingRequest = sessionStorage.getItem('idibages_pending_chat_call');
      if (pendingRequest) openRequestedCall(JSON.parse(pendingRequest));
    } catch { sessionStorage.removeItem('idibages_pending_chat_call'); }
    window.addEventListener('idibages-open-chat-call', handleCallRequest);
    return () => window.removeEventListener('idibages-open-chat-call', handleCallRequest);
  }, [chats]);

  useEffect(() => {
    if (!isCallActive || !callVideoRef.current) return;
    callVideoRef.current.srcObject = (isSharingScreen ? screenStreamRef.current : localStreamRef.current) || null;
    void callVideoRef.current.play().catch(() => undefined);
  }, [isCallActive, isSharingScreen]);

  useEffect(() => {
    if (!isCallActive || !callStartedAt) return;
    const timer = window.setInterval(() => setCallElapsedSeconds(Math.floor((Date.now() - callStartedAt) / 1000)), 1000);
    return () => window.clearInterval(timer);
  }, [isCallActive, callStartedAt]);

  useEffect(() => () => {
    localStreamRef.current?.getTracks().forEach(track => track.stop());
    screenStreamRef.current?.getTracks().forEach(track => track.stop());
  }, []);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, selectedChatId]);

  // ---- Derived state ----
  const selectedChat = useMemo(() =>
    chats.find(c => c.id === selectedChatId) || null
  , [chats, selectedChatId]);

  const chatMessages = useMemo(() =>
    messages
      .filter(m => m.chatId === selectedChatId && new Date(m.createdAt).getTime() >= Date.now() - messagingPolicy.retentionDays * 24 * 60 * 60 * 1000)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
  , [messages, selectedChatId, messagingPolicy.retentionDays]);

  const filteredChats = useMemo(() => {
    let list = chats.filter(c => {
      // User must be a participant
      const isParticipant = c.participantIds.includes(user?.uid || '');
      if (!isParticipant && !isAdmin) return false;
      if (filterType !== 'all' && c.type !== filterType) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return c.name.toLowerCase().includes(q) ||
          c.lastMessagePreview?.toLowerCase().includes(q);
      }
      return true;
    });
    // Sort by last message date desc
    return list.sort((a, b) => {
      const aTime = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
      const bTime = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
      return bTime - aTime;
    });
  }, [chats, filterType, searchQuery, user, isAdmin]);

  // ---- Actions ----
  const handleSelectChat = (chatId: string) => {
    setSelectedChatId(chatId);
    setShowMobileList(false);
    // Mark messages as read
    const chat = chats.find(c => c.id === chatId);
    if (chat && chat.unreadCount > 0) {
      updateAndNotify('chats', chatId, { unreadCount: 0 });
    }
  };

  const handleSendMessage = () => {
    if (!messageInput.trim() || !selectedChatId || !user) return;

    const newMsg: ChatMessage = {
      id: `cmsg-${Date.now()}`,
      chatId: selectedChatId,
      senderId: user.uid,
      senderName: user.displayName,
      senderRole: user.roleName,
      content: messageInput.trim(),
      readBy: [user.uid],
      reactions: [],
      isEdited: false,
      createdAt: new Date().toISOString(),
      replyToId: replyingTo?.id,
      replyToPreview: replyingTo ? replyingTo.content.substring(0, 60) : undefined,
    };

    addAndNotify('chatMessages', newMsg as any);
    updateAndNotify('chats', selectedChatId, {
      lastMessageAt: newMsg.createdAt,
      lastMessagePreview: newMsg.content.substring(0, 80),
    });

    setMessageInput('');
    setReplyingTo(null);
  };

  const handleJoinMeeting = async () => {
    if (!selectedChat || isJoiningCall) return;
    try {
      const settings = JSON.parse(localStorage.getItem('idibages_settings_v1') || '{}');
      if (settings?.modules?.audioVideoCalls === false) {
        showToast("L'option d'appel vidéo/audio est désactivée par le Super Admin sur cet abonnement", 'warning');
        return;
      }
    } catch { /* Continue with the account's messaging policy if local settings are malformed. */ }

    if (!messagingPolicy.allowAudioVideoCalls) {
      showToast('Les appels sont désactivés dans les paramètres.', 'warning');
      return;
    }
    if (!navigator.mediaDevices) {
      showToast('Les appels nécessitent un navigateur compatible et une connexion sécurisée.', 'warning');
      return;
    }

    setIsJoiningCall(true);
    let displayStream: MediaStream | null = null;
    let microphoneStream: MediaStream | null = null;
    try {
      if (meetingType === 'screen_share') {
        displayStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
        microphoneStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      } else {
        microphoneStream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: meetingType === 'video',
        });
      }
      localStreamRef.current = microphoneStream;
      screenStreamRef.current = displayStream;
      setIsMuted(false);
      setIsCamOff(meetingType !== 'video');
      setIsSharingScreen(Boolean(displayStream));
      setCallPanelTab('chat');
      setCallStartedAt(Date.now());
      setCallElapsedSeconds(0);
      setShowMeetingModal(false);
      setIsCallActive(true);
      showToast('Appareil prêt. Vous êtes dans l’aperçu local de la salle.', 'success');
    } catch (error) {
      displayStream?.getTracks().forEach(track => track.stop());
      microphoneStream?.getTracks().forEach(track => track.stop());
      const name = error instanceof DOMException ? error.name : '';
      showToast(name === 'NotAllowedError'
        ? 'Autorisez l’accès au micro et à la caméra pour démarrer l’appel.'
        : 'Impossible d’accéder à vos appareils audio ou vidéo.', 'warning');
    } finally {
      setIsJoiningCall(false);
    }
  };

  const handleToggleMicrophone = () => {
    const tracks = localStreamRef.current?.getAudioTracks() || [];
    if (!tracks.length) {
      showToast('Aucun microphone actif dans cette salle.', 'warning');
      return;
    }
    setIsMuted(current => {
      const next = !current;
      tracks.forEach(track => { track.enabled = !next; });
      return next;
    });
  };

  const handleToggleCamera = () => {
    const tracks = localStreamRef.current?.getVideoTracks() || [];
    if (!tracks.length) {
      showToast('Aucune caméra active dans cet appel audio.', 'info');
      return;
    }
    setIsCamOff(current => {
      const next = !current;
      tracks.forEach(track => { track.enabled = !next; });
      return next;
    });
  };

  const handleToggleScreenShare = async () => {
    if (isSharingScreen) {
      screenStreamRef.current?.getTracks().forEach(track => track.stop());
      screenStreamRef.current = null;
      setIsSharingScreen(false);
      return;
    }
    if (!navigator.mediaDevices?.getDisplayMedia) {
      showToast('Le partage d’écran n’est pas pris en charge par ce navigateur.', 'warning');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
      screenStreamRef.current = stream;
      stream.getVideoTracks()[0].addEventListener('ended', () => {
        screenStreamRef.current = null;
        setIsSharingScreen(false);
      }, { once: true });
      setIsSharingScreen(true);
    } catch (error) {
      if (error instanceof DOMException && error.name !== 'NotAllowedError') {
        showToast('Impossible de démarrer le partage d’écran.', 'warning');
      }
    }
  };

  const handleSendCallMessage = () => {
    if (!callMessageInput.trim() || !selectedChat || !user) return;
    const newMessage: ChatMessage = {
      id: `cmsg-${Date.now()}`,
      chatId: selectedChat.id,
      senderId: user.uid,
      senderName: user.displayName,
      senderRole: user.roleName,
      content: callMessageInput.trim(),
      readBy: [user.uid],
      reactions: [],
      isEdited: false,
      createdAt: new Date().toISOString(),
    };
    addAndNotify('chatMessages', newMessage as any);
    updateAndNotify('chats', selectedChat.id, {
      lastMessageAt: newMessage.createdAt,
      lastMessagePreview: newMessage.content.substring(0, 80),
    });
    setCallMessageInput('');
  };

  const handleEndMeeting = () => {
    localStreamRef.current?.getTracks().forEach(track => track.stop());
    screenStreamRef.current?.getTracks().forEach(track => track.stop());
    localStreamRef.current = null;
    screenStreamRef.current = null;
    setIsSharingScreen(false);
    setIsCallActive(false);
    setCallStartedAt(null);
    setCallElapsedSeconds(0);
    showToast('Réunion terminée', 'info');
  };

  const formatCallDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    return [hours, minutes, remainingSeconds].map(value => String(value).padStart(2, '0')).join(':');
  };

  const handleCreateChat = () => {
    if (!newChatName.trim() || !user || !canCreateChat) return;
    if (newChatType === 'internal' && selectedParticipants.length === 1 && !messagingPolicy.allowDirectMessages) { showToast('Les messages directs sont désactivés dans les paramètres.', 'warning'); return; }
    if (newChatType === 'external' && !messagingPolicy.allowExternalGuests) { showToast('Les conversations avec des invités externes sont désactivées dans les paramètres.', 'warning'); return; }
    if (newChatScope === 'department' && !messagingPolicy.allowDepartmentChannels) { showToast('Les canaux par département sont désactivés dans les paramètres.', 'warning'); return; }

    const participants: ChatParticipant[] = [{
      userId: user.uid,
      name: user.displayName,
      role: user.roleName,
      departmentId: user.departmentId,
      departmentName: users.find(u => u.uid === user.uid)?.departmentId || '',
      addedBy: user.uid,
      addedAt: new Date().toISOString(),
    }];

    // Add selected participants
    selectedParticipants.forEach(uid => {
      const u = users.find(us => us.uid === uid);
      if (u) {
        participants.push({
          userId: u.uid,
          name: u.displayName,
          role: u.roleName,
          departmentId: u.departmentId,
          departmentName: '',
          addedBy: user.uid,
          addedAt: new Date().toISOString(),
        });
      }
    });

    const newChat: Chat = {
      id: `chat-${Date.now()}`,
      name: newChatName.trim(),
      description: newChatDesc.trim(),
      type: newChatType,
      scope: newChatScope,
      createdBy: user.uid,
      createdByName: user.displayName,
      createdByRole: user.roleName,
      participantIds: [user.uid, ...selectedParticipants],
      participants,
      externalEntityName: newChatType === 'external' ? newChatExternalName.trim() : undefined,
      externalEntityType: newChatType === 'external' ? newChatExternalType : undefined,
      unreadCount: 0,
      isArchived: false,
      companyId: 'comp-1',
      createdAt: new Date().toISOString(),
    };

    addAndNotify('chats', newChat as any);
    showToast('Chat cree avec succes', 'success');
    setShowCreateModal(false);
    resetCreateForm();
  };

  const handleAddParticipants = (userIds: string[]) => {
    if (!selectedChat || !user) return;

    const newParticipants = [...selectedChat.participants];
    const newParticipantIds = [...selectedChat.participantIds];

    userIds.forEach(uid => {
      if (!newParticipantIds.includes(uid)) {
        const u = users.find(us => us.uid === uid);
        if (u) {
          newParticipants.push({
            userId: u.uid,
            name: u.displayName,
            role: u.roleName,
            departmentId: u.departmentId,
            departmentName: '',
            addedBy: user.uid,
            addedAt: new Date().toISOString(),
          });
          newParticipantIds.push(uid);
        }
      }
    });

    updateAndNotify('chats', selectedChat.id, {
      participants: newParticipants,
      participantIds: newParticipantIds,
    });
    showToast('Participants ajoutes', 'success');
    setShowParticipantsModal(false);
  };

  const handleArchiveChat = (chatId: string) => {
    updateAndNotify('chats', chatId, { isArchived: true });
    if (selectedChatId === chatId) setSelectedChatId(null);
    setChatMenuOpen(null);
    showToast('Chat archive', 'info');
  };

  const handleDeleteChat = (chatId: string) => {
    if (!confirm('Supprimer ce chat definitivement ?')) return;
    const msgs = (getAll('chatMessages') as ChatMessage[]).filter(m => m.chatId === chatId);
    msgs.forEach((message) => removeAndNotify('chatMessages', message.id));
    removeAndNotify('chats', chatId);
    setChats(prev => prev.filter(c => c.id !== chatId));
    if (selectedChatId === chatId) setSelectedChatId(null);
    setChatMenuOpen(null);
    showToast('Chat supprime', 'success');
  };

  const resetCreateForm = () => {
    setNewChatName('');
    setNewChatDesc('');
    setNewChatType('internal');
    setNewChatScope('general');
    setNewChatExternalName('');
    setNewChatExternalType('client');
    setSelectedParticipants([]);
  };

  // ---- Render helpers ----
  const getChatIcon = (chat: Chat) => {
    if (chat.type === 'external') {
      if (chat.externalEntityType === 'client') return <Building2 size={18} className="text-blue-400" />;
      if (chat.externalEntityType === 'vendor') return <Briefcase size={18} className="text-[var(--accent-primary)]" />;
      return <Globe size={18} className="text-purple-400" />;
    }
    if (chat.scope === 'department') return <Users size={18} className="text-emerald-400" />;
    if (chat.scope === 'project') return <Briefcase size={18} className="text-amber-400" />;
    return <Hash size={18} className="text-[var(--accent-primary)]" />;
  };

  const formatTime = (dateStr?: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const today = new Date();
    if (d.toDateString() === today.toDateString()) return formatTime(dateStr);
    if (d.getDate() === today.getDate() - 1) return 'Hier';
    return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  };

  // ---- JSX ----
  return (
    <div className="h-[calc(100vh-var(--header-height))] flex">
      {/* ===== LEFT SIDEBAR: Chat List ===== */}
      <AnimatePresence>
        {(showMobileList || sidebarOpen) && (
          <motion.div
            initial={{ x: -300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -300, opacity: 0 }}
            className={cn(
              "flex flex-col border-r border-[var(--divider)] bg-[var(--bg-secondary)]",
              "w-full md:w-80 lg:w-96 shrink-0"
            )}
          >
            {/* Header */}
            <div className="p-4 border-b border-[var(--divider)]">
              <div className="flex items-center justify-between mb-3">
                <h1 className="text-lg font-bold text-[var(--text-primary)]">Messagerie</h1>
                {canCreateChat && (
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="p-2 rounded-lg bg-[var(--accent-primary)] text-white hover:opacity-90 transition-opacity"
                    title="Nouveau chat"
                  >
                    <Plus size={18} />
                  </button>
                )}
              </div>

              {/* Search */}
              <div className="relative mb-3">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                <input
                  type="text"
                  placeholder="Rechercher un chat..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-lg bg-[var(--bg-elevated)] border border-[var(--divider)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-primary)]"
                />
              </div>

              {/* Filters */}
              <div className="flex gap-1">
                {(['all', 'internal', 'external'] as const).map(f => (
                  <button
                    key={f}
                    onClick={() => setFilterType(f)}
                    className={cn(
                      "flex-1 py-1.5 px-2 rounded-md text-xs font-medium transition-colors",
                      filterType === f
                        ? "bg-[var(--accent-primary)]/15 text-[var(--accent-primary)]"
                        : "text-[var(--text-muted)] hover:bg-white/5"
                    )}
                  >
                    {f === 'all' ? 'Tous' : f === 'internal' ? 'Internes' : 'Externes'}
                  </button>
                ))}
              </div>
            </div>

            {/* Chat List */}
            <div className="flex-1 overflow-y-auto">
              {filteredChats.length === 0 ? (
                <div className="p-8 text-center text-[var(--text-muted)] text-sm">
                  <MessageSquare size={32} className="mx-auto mb-2 opacity-30" />
                  Aucun chat trouve
                </div>
              ) : (
                filteredChats.map(chat => (
                  <button
                    key={chat.id}
                    onClick={() => handleSelectChat(chat.id)}
                    className={cn(
                      "w-full flex items-start gap-3 p-3 text-left transition-colors hover:bg-white/5 relative",
                      selectedChatId === chat.id && "bg-[var(--accent-primary)]/10"
                    )}
                  >
                    <div className="w-10 h-10 rounded-full bg-[var(--bg-elevated)] flex items-center justify-center shrink-0 border border-[var(--divider)]">
                      {getChatIcon(chat)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className={cn(
                          "text-sm font-medium truncate",
                          chat.unreadCount > 0 ? "text-[var(--text-primary)]" : "text-[var(--text-secondary)]"
                        )}>
                          {chat.name}
                        </span>
                        <span className="text-[10px] text-[var(--text-muted)] shrink-0 ml-2">
                          {formatDate(chat.lastMessageAt)}
                        </span>
                      </div>
                      <p className="text-xs text-[var(--text-muted)] truncate mt-0.5">
                        {chat.lastMessagePreview || 'Nouveau chat'}
                      </p>
                    </div>
                    {chat.unreadCount > 0 && (
                      <span className="absolute right-3 top-3 w-5 h-5 rounded-full bg-[var(--accent-primary)] text-white text-[10px] font-bold flex items-center justify-center">
                        {chat.unreadCount}
                      </span>
                    )}
                  </button>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ===== RIGHT: Conversation ===== */}
      <div className="flex-1 flex flex-col min-w-0">
        {selectedChat ? (
          <>
            {/* Chat Header */}
            <div className="h-14 flex items-center justify-between px-4 border-b border-[var(--divider)] bg-[var(--bg-secondary)] shrink-0">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowMobileList(true)}
                  className="md:hidden p-1.5 rounded-lg hover:bg-white/5 text-[var(--text-muted)]"
                >
                  <ChevronLeft size={20} />
                </button>
                <div className="w-9 h-9 rounded-full bg-[var(--bg-elevated)] flex items-center justify-center border border-[var(--divider)]">
                  {getChatIcon(selectedChat)}
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-[var(--text-primary)]">{selectedChat.name}</h2>
                  <p className="text-[11px] text-[var(--text-muted)]">
                    {selectedChat.type === 'external'
                      ? `${selectedChat.externalEntityName} · ${selectedChat.participants.length} participant${selectedChat.participants.length > 1 ? 's' : ''}`
                      : `${selectedChat.participants.length} participant${selectedChat.participants.length > 1 ? 's' : ''}`
                    }
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => { if (!messagingPolicy.allowAudioVideoCalls) { showToast('Les appels sont désactivés dans les paramètres.', 'warning'); return; } setMeetingType('video'); setShowMeetingModal(true); }}
                  className="flex items-center gap-1.5 rounded-lg bg-[var(--accent-primary)]/10 px-2.5 py-2 text-[var(--accent-primary)] transition-colors hover:bg-[var(--accent-primary)]/20"
                  aria-label="Démarrer un appel vidéo"
                  title="Appel vidéo"
                >
                  <Video size={18} /><span className="hidden text-[11px] font-semibold lg:inline">Vidéo</span>
                </button>
                <button
                  onClick={() => { if (!messagingPolicy.allowAudioVideoCalls) { showToast('Les appels sont désactivés dans les paramètres.', 'warning'); return; } setMeetingType('audio'); setShowMeetingModal(true); }}
                  className="flex items-center gap-1.5 rounded-lg bg-[var(--accent-primary)]/10 px-2.5 py-2 text-[var(--accent-primary)] transition-colors hover:bg-[var(--accent-primary)]/20"
                  aria-label="Démarrer un appel audio"
                  title="Appel audio"
                >
                  <Phone size={17} /><span className="hidden text-[11px] font-semibold lg:inline">Audio</span>
                </button>
                <button
                  onClick={() => { if (!messagingPolicy.allowAudioVideoCalls) { showToast('Les appels sont désactivés dans les paramètres.', 'warning'); return; } setMeetingType('screen_share'); setShowMeetingModal(true); }}
                  className="p-2 rounded-lg bg-[var(--bg-elevated)] text-[var(--text-secondary)] transition-colors hover:bg-white/10 hover:text-[var(--text-primary)]"
                  aria-label="Partager l’écran"
                  title="Partage d'ecran"
                >
                  <Monitor size={18} />
                </button>
                <button
                  onClick={() => setShowParticipantsModal(true)}
                  className="p-2 rounded-lg hover:bg-white/5 text-[var(--text-muted)] transition-colors"
                  title="Participants"
                >
                  <Users size={18} />
                </button>
                <div className="relative">
                  <button
                    onClick={() => setChatMenuOpen(chatMenuOpen === selectedChat.id ? null : selectedChat.id)}
                    className="p-2 rounded-lg hover:bg-white/5 text-[var(--text-muted)] transition-colors"
                  >
                    <MoreVertical size={18} />
                  </button>
                  <AnimatePresence>
                    {chatMenuOpen === selectedChat.id && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="absolute right-0 top-full mt-1 w-48 rounded-lg bg-[var(--bg-elevated)] border border-[var(--divider)] shadow-xl z-50 py-1"
                      >
                        <button
                          onClick={() => handleArchiveChat(selectedChat.id)}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[var(--text-muted)] hover:bg-white/5 hover:text-[var(--text-primary)]"
                        >
                          <Archive size={14} /> Archiver
                        </button>
                        {(isAdmin || selectedChat.createdBy === user?.uid) && (
                          <button
                            onClick={() => handleDeleteChat(selectedChat.id)}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10"
                          >
                            <Trash2 size={14} /> Supprimer
                          </button>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {chatMessages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-[var(--text-muted)]">
                  <MessageSquare size={40} className="mb-3 opacity-20" />
                  <p className="text-sm">Aucun message encore</p>
                  <p className="text-xs mt-1">Soyez le premier a ecrire !</p>
                </div>
              ) : (
                chatMessages.map((msg, idx) => {
                  const isMe = msg.senderId === user?.uid;
                  const showAvatar = idx === 0 || chatMessages[idx - 1].senderId !== msg.senderId;
                  const sender = selectedChat.participants.find(p => p.userId === msg.senderId);

                  return (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={cn(
                        "flex gap-2",
                        isMe ? "justify-end" : "justify-start"
                      )}
                    >
                      {!isMe && showAvatar && (
                        <div className="w-8 h-8 rounded-full bg-[var(--bg-elevated)] flex items-center justify-center text-[10px] font-bold text-[var(--text-muted)] shrink-0 border border-[var(--divider)]">
                          {msg.senderName.charAt(0)}
                        </div>
                      )}
                      {!isMe && !showAvatar && <div className="w-8 shrink-0" />}

                      <div className={cn(
                        "max-w-[70%] rounded-2xl px-4 py-2.5",
                        isMe
                          ? "bg-[var(--accent-primary)] text-white rounded-br-md"
                          : "bg-[var(--bg-elevated)] text-[var(--text-primary)] rounded-bl-md border border-[var(--divider)]"
                      )}>
                        {!isMe && showAvatar && (
                          <p className="text-[10px] font-semibold mb-1 opacity-70">
                            {msg.senderName}
                          </p>
                        )}
                        {msg.replyToPreview && (
                          <div className={cn(
                            "text-xs mb-1.5 px-2 py-1 rounded border-l-2",
                            isMe ? "bg-black/10 border-black/20" : "bg-white/5 border-[var(--accent-primary)]"
                          )}>
                            <p className="truncate opacity-60">{msg.replyToPreview}</p>
                          </div>
                        )}
                        <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                        <div className={cn(
                          "flex items-center gap-1 mt-1",
                          isMe ? "text-[#0B0F14]/60" : "text-[var(--text-muted)]"
                        )}>
                          <span className="text-[10px]">{formatTime(msg.createdAt)}</span>
                          {isMe && (
                            <CheckCheck size={12} className={
                              msg.readBy.length > 1 ? "text-blue-500" : ""
                            } />
                          )}
                        </div>
                      </div>

                      {isMe && showAvatar && (
                        <div className="w-8 h-8 rounded-full bg-[var(--accent-primary)]/20 flex items-center justify-center text-[10px] font-bold text-[var(--accent-primary)] shrink-0">
                          {msg.senderName.charAt(0)}
                        </div>
                      )}
                      {isMe && !showAvatar && <div className="w-8 shrink-0" />}
                    </motion.div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-3 border-t border-[var(--divider)] bg-[var(--bg-secondary)] shrink-0">
              {replyingTo && (
                <div className="flex items-center gap-2 mb-2 px-3 py-1.5 rounded-lg bg-[var(--bg-elevated)] border border-[var(--divider)]">
                  <Reply size={14} className="text-[var(--accent-primary)]" />
                  <span className="text-xs text-[var(--text-muted)] truncate flex-1">
                    Repondre a {replyingTo.senderName}: {replyingTo.content.substring(0, 40)}...
                  </span>
                  <button onClick={() => setReplyingTo(null)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                    <X size={14} />
                  </button>
                </div>
              )}
              <div className="flex items-end gap-2">
                <button
                  onClick={() => { if (!messagingPolicy.allowFiles) { showToast('Le partage de fichiers est désactivé dans les paramètres.', 'warning'); return; } fileInputRef.current?.click(); }}
                  className="p-2.5 rounded-lg hover:bg-white/5 text-[var(--text-muted)] transition-colors"
                >
                  <Paperclip size={18} />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  onChange={(event) => { const file = event.target.files?.[0]; if (!file) return; const allowed = messagingPolicy.allowedFileTypes.split(',').map((type) => type.trim().toLowerCase().replace(/^\./, '')).filter(Boolean); const extension = file.name.split('.').pop()?.toLowerCase() || ''; if (file.size > messagingPolicy.maxFileSize * 1024 * 1024) showToast(`La taille maximale autorisée est de ${messagingPolicy.maxFileSize} Mo.`, 'warning'); else if (allowed.length && !allowed.includes(extension)) showToast(`Format non autorisé. Formats acceptés : ${allowed.join(', ')}.`, 'warning'); else showToast('Fichier sélectionné (envoi de pièce jointe à configurer).', 'info'); event.target.value = ''; }}
                />
                <div className="flex-1 relative">
                  <textarea
                    value={messageInput}
                    onChange={e => setMessageInput(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    placeholder="Ecrivez un message..."
                    rows={1}
                    className="w-full px-4 py-2.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--divider)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-primary)] resize-none max-h-32"
                    style={{ minHeight: '42px' }}
                  />
                </div>
                <button
                  onClick={handleSendMessage}
                  disabled={!messageInput.trim()}
                  className={cn(
                    "p-2.5 rounded-xl transition-all",
                    messageInput.trim()
                      ? "bg-[var(--accent-primary)] text-white hover:opacity-90"
                      : "bg-[var(--bg-elevated)] text-[var(--text-muted)]"
                  )}
                >
                  <Send size={18} />
                </button>
              </div>
            </div>
          </>
        ) : (
          /* Empty state */
          <div className="h-full flex flex-col items-center justify-center text-[var(--text-muted)]">
            <div className="w-20 h-20 rounded-full bg-[var(--bg-elevated)] flex items-center justify-center mb-4 border border-[var(--divider)]">
              <MessageSquare size={36} className="opacity-30" />
            </div>
            <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-1">Vos conversations</h3>
            <p className="text-sm text-center max-w-xs mb-4">
              Selectionnez un chat pour commencer a discuter avec votre equipe ou vos partenaires externes.
            </p>
            {canCreateChat && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--accent-primary)] text-white text-sm font-medium hover:opacity-90 transition-opacity"
              >
                <Plus size={16} /> Nouveau chat
              </button>
            )}
          </div>
        )}
      </div>

      {/* ===== CREATE CHAT MODAL ===== */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => { setShowCreateModal(false); resetCreateForm(); }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="glass-card w-full max-w-lg max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between p-4 border-b border-[var(--divider)]">
                <h2 className="text-lg font-bold text-[var(--text-primary)]">Nouveau chat</h2>
                <button onClick={() => { setShowCreateModal(false); resetCreateForm(); }} className="p-1 rounded-lg hover:bg-white/5 text-[var(--text-muted)]">
                  <X size={20} />
                </button>
              </div>

              <div className="p-4 space-y-4">
                {/* Type */}
                <div>
                  <label className="text-xs font-medium text-[var(--text-muted)] uppercase mb-2 block">Type de chat</label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setNewChatType('internal')}
                      className={cn(
                        "flex-1 py-2 px-3 rounded-lg text-sm font-medium border transition-colors flex items-center justify-center gap-2",
                        newChatType === 'internal'
                          ? "border-[var(--accent-primary)] bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]"
                          : "border-[var(--divider)] text-[var(--text-muted)] hover:bg-white/5"
                      )}
                    >
                      <Lock size={14} /> Interne
                    </button>
                    <button
                      disabled={!messagingPolicy.allowExternalGuests}
                      onClick={() => { if (!messagingPolicy.allowExternalGuests) { showToast('Les invités externes sont désactivés dans les paramètres.', 'warning'); return; } setNewChatType('external'); }}
                      className={cn(
                        "flex-1 py-2 px-3 rounded-lg text-sm font-medium border transition-colors flex items-center justify-center gap-2",
                        newChatType === 'external'
                          ? "border-[var(--accent-primary)] bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]"
                          : "border-[var(--divider)] text-[var(--text-muted)] hover:bg-white/5"
                      )}
                    >
                      <Globe size={14} /> Externe
                    </button>
                  </div>
                </div>

                {/* Name */}
                <div>
                  <label className="text-xs font-medium text-[var(--text-muted)] uppercase mb-1.5 block">Nom du chat</label>
                  <input
                    value={newChatName}
                    onChange={e => setNewChatName(e.target.value)}
                    placeholder="Ex: Projet Nestle, Direction Marketing..."
                    className="w-full px-3 py-2 rounded-lg bg-[var(--bg-elevated)] border border-[var(--divider)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-primary)]"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="text-xs font-medium text-[var(--text-muted)] uppercase mb-1.5 block">Description (optionnel)</label>
                  <textarea
                    value={newChatDesc}
                    onChange={e => setNewChatDesc(e.target.value)}
                    placeholder="Decrivez l'objet de ce chat..."
                    rows={2}
                    className="w-full px-3 py-2 rounded-lg bg-[var(--bg-elevated)] border border-[var(--divider)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-primary)] resize-none"
                  />
                </div>

                {/* Scope (internal only) */}
                {newChatType === 'internal' && (
                  <div>
                    <label className="text-xs font-medium text-[var(--text-muted)] uppercase mb-2 block">Portee</label>
                    <div className="grid grid-cols-3 gap-2">
                      {(['general', 'department', 'project'] as const).map(s => (
                        <button
                          key={s}
                          disabled={s === 'department' && !messagingPolicy.allowDepartmentChannels}
                          onClick={() => { if (s === 'department' && !messagingPolicy.allowDepartmentChannels) { showToast('Les canaux par département sont désactivés dans les paramètres.', 'warning'); return; } setNewChatScope(s); }}
                          className={cn(
                            "py-2 px-2 rounded-lg text-xs font-medium border transition-colors",
                            newChatScope === s
                              ? "border-[var(--accent-primary)] bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]"
                              : "border-[var(--divider)] text-[var(--text-muted)] hover:bg-white/5"
                          )}
                        >
                          {s === 'general' ? 'General' : s === 'department' ? 'Departement' : 'Projet'}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* External entity (external only) */}
                {newChatType === 'external' && (
                  <>
                    <div>
                      <label className="text-xs font-medium text-[var(--text-muted)] uppercase mb-1.5 block">Nom de l'organisme</label>
                      <input
                        value={newChatExternalName}
                        onChange={e => setNewChatExternalName(e.target.value)}
                        placeholder="Ex: Societe Generale, Imprimerie Centrale..."
                        className="w-full px-3 py-2 rounded-lg bg-[var(--bg-elevated)] border border-[var(--divider)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-primary)]"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-[var(--text-muted)] uppercase mb-2 block">Type d'organisme</label>
                      <div className="grid grid-cols-4 gap-2">
                        {(['client', 'vendor', 'partner', 'other'] as const).map(t => (
                          <button
                            key={t}
                            onClick={() => setNewChatExternalType(t)}
                            className={cn(
                              "py-2 px-1 rounded-lg text-xs font-medium border transition-colors",
                              newChatExternalType === t
                                ? "border-[var(--accent-primary)] bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]"
                                : "border-[var(--divider)] text-[var(--text-muted)] hover:bg-white/5"
                            )}
                          >
                            {t === 'client' ? 'Client' : t === 'vendor' ? 'Fourn.' : t === 'partner' ? 'Partn.' : 'Autre'}
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {/* Participants */}
                <div>
                  <label className="text-xs font-medium text-[var(--text-muted)] uppercase mb-2 block">
                    Participants ({selectedParticipants.length + 1})
                  </label>
                  <div className="max-h-40 overflow-y-auto space-y-1 border border-[var(--divider)] rounded-lg p-2 bg-[var(--bg-elevated)]">
                    {/* Current user (always included) */}
                    <div className="flex items-center gap-2 px-2 py-1.5 rounded bg-[var(--accent-primary)]/10">
                      <Crown size={14} className="text-[var(--accent-primary)]" />
                      <span className="text-sm text-[var(--text-primary)]">{user?.displayName}</span>
                      <span className="text-[10px] text-[var(--text-muted)] ml-auto">Vous (createur)</span>
                    </div>
                    {/* Available users */}
                    {users.filter(u => u.uid !== user?.uid).map(u => {
                      const isSelected = selectedParticipants.includes(u.uid);
                      return (
                        <button
                          key={u.uid}
                          onClick={() => {
                            setSelectedParticipants(prev =>
                              isSelected ? prev.filter(id => id !== u.uid) : [...prev, u.uid]
                            );
                          }}
                          className={cn(
                            "w-full flex items-center gap-2 px-2 py-1.5 rounded text-left transition-colors",
                            isSelected ? "bg-[var(--accent-primary)]/10" : "hover:bg-white/5"
                          )}
                        >
                          <div className={cn(
                            "w-4 h-4 rounded border flex items-center justify-center",
                            isSelected ? "bg-[var(--accent-primary)] border-[var(--accent-primary)]" : "border-[var(--divider)]"
                          )}>
                            {isSelected && <CheckCheck size={10} className="text-[#0B0F14]" />}
                          </div>
                          <span className="text-sm text-[var(--text-primary)]">{u.displayName}</span>
                          <span className="text-[10px] text-[var(--text-muted)] ml-auto">{u.roleName}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <button
                  onClick={handleCreateChat}
                  disabled={!newChatName.trim() || (newChatType === 'external' && !newChatExternalName.trim())}
                  className={cn(
                    "w-full py-2.5 rounded-lg font-medium text-sm transition-all",
                    newChatName.trim() && (newChatType !== 'external' || newChatExternalName.trim())
                      ? "bg-[var(--accent-primary)] text-white hover:opacity-90"
                      : "bg-[var(--bg-elevated)] text-[var(--text-muted)] cursor-not-allowed"
                  )}
                >
                  Creer le chat
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ===== PARTICIPANTS MODAL ===== */}
      <AnimatePresence>
        {showParticipantsModal && selectedChat && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setShowParticipantsModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="glass-card w-full max-w-md"
            >
              <div className="flex items-center justify-between p-4 border-b border-[var(--divider)]">
                <h2 className="text-lg font-bold text-[var(--text-primary)]">Participants</h2>
                <button onClick={() => setShowParticipantsModal(false)} className="p-1 rounded-lg hover:bg-white/5 text-[var(--text-muted)]">
                  <X size={20} />
                </button>
              </div>
              <div className="p-4">
                {/* Current participants */}
                <div className="space-y-2 mb-4">
                  {selectedChat.participants.map(p => (
                    <div key={p.userId} className="flex items-center gap-3 p-2 rounded-lg bg-[var(--bg-elevated)]">
                      <div className="w-8 h-8 rounded-full bg-[var(--bg-secondary)] flex items-center justify-center text-xs font-bold text-[var(--text-muted)] border border-[var(--divider)]">
                        {p.name.charAt(0)}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-[var(--text-primary)]">{p.name}</p>
                        <p className="text-[10px] text-[var(--text-muted)]">{p.role} {p.departmentName ? `· ${p.departmentName}` : ''}</p>
                      </div>
                      {p.userId === selectedChat.createdBy && (
                        <span className="text-[10px] bg-[var(--accent-primary)]/15 text-[var(--accent-primary)] px-2 py-0.5 rounded-full">Createur</span>
                      )}
                    </div>
                  ))}
                </div>

                {/* Add participants (only for creator/admin) */}
                {(isAdmin || selectedChat.createdBy === user?.uid) && (
                  <div className="border-t border-[var(--divider)] pt-4">
                    <label className="text-xs font-medium text-[var(--text-muted)] uppercase mb-2 block">Ajouter des participants</label>
                    <div className="max-h-48 overflow-y-auto space-y-1 border border-[var(--divider)] rounded-lg p-2 bg-[var(--bg-elevated)]">
                      {users.filter(u => !selectedChat.participantIds.includes(u.uid)).map(u => (
                        <button
                          key={u.uid}
                          onClick={() => handleAddParticipants([u.uid])}
                          className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-left hover:bg-white/5 transition-colors"
                        >
                          <UserPlus size={14} className="text-[var(--accent-primary)]" />
                          <span className="text-sm text-[var(--text-primary)]">{u.displayName}</span>
                          <span className="text-[10px] text-[var(--text-muted)] ml-auto">{u.roleName}</span>
                        </button>
                      ))}
                      {users.filter(u => !selectedChat.participantIds.includes(u.uid)).length === 0 && (
                        <p className="text-xs text-[var(--text-muted)] text-center py-2">Tous les utilisateurs sont deja participants</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* ===== MEETING LAUNCH MODAL ===== */}
      <AnimatePresence>
        {showMeetingModal && selectedChat && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4"
            onClick={() => setShowMeetingModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="glass-card w-full max-w-md p-6 text-center border border-white/20 shadow-2xl"
            >
              <div className="w-16 h-16 rounded-2xl bg-[var(--accent-primary)]/20 border border-[var(--accent-primary)]/40 flex items-center justify-center mx-auto mb-4 text-[var(--accent-primary)]">
                {meetingType === 'video' ? <Video size={32} /> : meetingType === 'audio' ? <Phone size={32} /> : <Monitor size={32} />}
              </div>
              <h2 className="text-lg font-bold text-white mb-1">
                {meetingType === 'video' ? 'Lancer un Appel Vidéo' : meetingType === 'audio' ? 'Lancer un Appel Audio' : 'Partage d\'Écran'}
              </h2>
              <p className="text-xs text-[var(--text-muted)] mb-5">
                Canal: <span className="font-bold text-white">{selectedChat.name}</span> ({selectedChat.participants.length} participants)
              </p>

              {/* AI Notetaker option banner */}
              <div className="p-3 rounded-xl bg-gradient-to-r from-[var(--accent-primary)]/10 to-[var(--accent-primary-hover)]/10 border border-[var(--accent-primary)]/30 text-left mb-6 flex items-start gap-3">
                <Bot size={22} className="text-[var(--accent-primary)] shrink-0 mt-0.5" />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-white flex items-center gap-1.5">
                      Assistant IA Notetaker
                      <span className="text-[9px] bg-[var(--accent-primary)] text-white font-bold px-1.5 py-0.5 rounded">Pro</span>
                    </p>
                    <input
                      type="checkbox"
                      checked={isNotetakerActive}
                      onChange={e => setIsNotetakerActive(e.target.checked)}
                      className="accent-[var(--accent-primary)] cursor-pointer"
                    />
                  </div>
                  <p className="text-[11px] text-[var(--text-muted)] mt-1">
                    Génère automatiquement la transcription, la synthèse et le compte-rendu des décisions de la réunion.
                  </p>
                </div>
              </div>

              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => setShowMeetingModal(false)}
                  className="px-5 py-2.5 rounded-xl bg-white/5 text-[var(--text-muted)] text-xs font-semibold hover:bg-white/10 transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={handleJoinMeeting}
                  disabled={isJoiningCall}
                  className="px-6 py-2.5 rounded-xl bg-[var(--accent-primary)] text-white text-xs font-bold hover:opacity-90 transition-opacity flex items-center gap-2 shadow-lg shadow-[var(--accent-primary)]/20 disabled:opacity-60"
                >
                  {isJoiningCall ? <Loader2 size={16} className="animate-spin" /> : meetingType === 'audio' ? <Phone size={16} /> : meetingType === 'screen_share' ? <Monitor size={16} /> : <Video size={16} />}
                  {isJoiningCall ? 'Connexion aux appareils…' : 'Rejoindre la salle'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ===== LIVE CALL ROOM ===== */}
      <AnimatePresence>
        {isCallActive && selectedChat && (
          <motion.div
            initial={{ opacity: 0, scale: 0.985 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.985 }}
            className="fixed inset-0 z-50 flex flex-col overflow-hidden bg-[#081C2D] text-white"
          >
            <header className="flex h-[72px] shrink-0 items-center justify-between gap-4 border-b border-white/10 bg-[#0A2533] px-4 sm:px-7">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#1FB472]/15 text-[#1FB472]">
                  {meetingType === 'audio' ? <Phone size={19} /> : <Video size={19} />}
                </div>
                <div className="min-w-0">
                  <h3 className="truncate text-sm font-semibold">{selectedChat.name}</h3>
                  <p className="mt-0.5 flex items-center gap-2 text-[10px] text-white/55">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#1FB472]" />
                    {formatCallDuration(callElapsedSeconds)} <span>·</span> Aperçu local
                  </p>
                </div>
              </div>
              <div className="hidden items-center gap-2 text-xs text-white/60 sm:flex">
                <Users size={15} /> {selectedChat.participants.length} participant{selectedChat.participants.length > 1 ? 's' : ''} dans le canal
              </div>
              <button type="button" onClick={handleEndMeeting} aria-label="Quitter la salle" className="rounded-xl p-2 text-white/60 transition hover:bg-white/10 hover:text-white"><X size={19} /></button>
            </header>

            <main className="flex min-h-0 flex-1 flex-col gap-3 p-3 sm:gap-4 sm:p-5 lg:flex-row">
              <section className="flex min-h-0 min-w-0 flex-1 flex-col gap-3 sm:gap-4">
                <div className="relative min-h-[220px] flex-1 overflow-hidden rounded-2xl border border-white/10 bg-[#0D2C39] shadow-xl sm:min-h-[300px]">
                  {meetingType === 'audio' ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-[radial-gradient(ellipse_at_center,_#174838,_#0b2632_70%)]">
                      <div className="relative mb-5 flex h-24 w-24 items-center justify-center rounded-full border border-[#1FB472]/40 bg-[#1FB472]/15 text-3xl font-semibold text-[#B8F7D6] shadow-[0_0_70px_rgba(31,180,114,.2)] sm:h-32 sm:w-32 sm:text-4xl">
                        {(user?.displayName || 'Vous').trim().split(/\s+/).map(part => part[0]).join('').slice(0, 2).toUpperCase()}
                        {!isMuted && <span className="absolute -inset-2 rounded-full border border-[#1FB472]/35 animate-pulse" />}
                      </div>
                      <h2 className="text-lg font-semibold">{user?.displayName || 'Vous'}</h2>
                      <p className="mt-1 text-xs text-white/55">Appel audio · aperçu du micro</p>
                      <div className="mt-5 flex h-7 items-center gap-1.5" aria-hidden="true">
                        {[10, 18, 13, 24, 15, 21, 11, 17, 9].map((height, index) => <span key={index} className={cn('w-1 rounded-full transition-colors', isMuted ? 'bg-white/20' : 'bg-[#1FB472]')} style={{ height: `${height}px` }} />)}
                      </div>
                    </div>
                  ) : (
                    <>
                      <video ref={callVideoRef} autoPlay playsInline muted aria-label={isSharingScreen ? 'Aperçu du partage d’écran' : 'Aperçu vidéo local'} className={cn('absolute inset-0 h-full w-full bg-[#0D2C39] object-cover', isCamOff && !isSharingScreen && 'invisible')} />
                      {isCamOff && !isSharingScreen && <div className="absolute inset-0 flex flex-col items-center justify-center bg-[radial-gradient(ellipse_at_center,_#174838,_#0b2632_70%)]">
                        <div className="flex h-24 w-24 items-center justify-center rounded-full bg-[#1FB472]/15 text-3xl font-semibold text-[#B8F7D6]">{(user?.displayName || 'Vous').trim().split(/\s+/).map(part => part[0]).join('').slice(0, 2).toUpperCase()}</div>
                        <p className="mt-4 text-sm font-medium">Caméra désactivée</p>
                      </div>}
                    </>
                  )}

                  <div className="absolute left-3 top-3 flex items-center gap-2 rounded-full border border-white/10 bg-black/45 px-3 py-1.5 text-[10px] font-medium backdrop-blur-md sm:left-5 sm:top-5">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#1FB472]" />{isSharingScreen ? 'Partage d’écran actif' : 'Aperçu local'}
                  </div>
                  <div className="absolute bottom-3 left-3 flex items-center gap-2 rounded-lg bg-black/50 px-3 py-2 text-xs font-medium backdrop-blur-md sm:bottom-5 sm:left-5">
                    <span className="h-2 w-2 rounded-full bg-[#1FB472]" />{user?.displayName || 'Vous'}
                    {isMuted && <MicOff size={13} className="text-red-300" />}
                  </div>
                  <div className="absolute bottom-3 right-3 flex items-center gap-2 sm:bottom-5 sm:right-5">
                    <button type="button" onClick={handleToggleMicrophone} aria-label={isMuted ? 'Activer le microphone' : 'Couper le microphone'} className={cn('flex h-10 w-10 items-center justify-center rounded-full border border-white/10 backdrop-blur-md transition', isMuted ? 'bg-red-500 text-white' : 'bg-black/45 text-white hover:bg-black/65')}>
                      {isMuted ? <MicOff size={17} /> : <Mic size={17} />}
                    </button>
                    <button type="button" onClick={handleToggleCamera} disabled={meetingType === 'audio'} aria-label={isCamOff ? 'Activer la caméra' : 'Désactiver la caméra'} className={cn('flex h-10 w-10 items-center justify-center rounded-full border border-white/10 backdrop-blur-md transition disabled:opacity-40', isCamOff ? 'bg-red-500 text-white' : 'bg-black/45 text-white hover:bg-black/65')}>
                      {isCamOff ? <VideoOff size={17} /> : <Video size={17} />}
                    </button>
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-3 overflow-x-auto rounded-2xl border border-white/10 bg-[#0A2533]/80 p-3 sm:gap-4 sm:p-4">
                  {selectedChat.participants.slice(0, 8).map((participant, index) => (
                    <div key={participant.userId} className="flex min-w-[82px] flex-col items-center gap-2 text-center">
                      <div className={cn('relative flex h-12 w-12 items-center justify-center rounded-2xl text-sm font-semibold', participant.userId === user?.uid ? 'bg-[#1FB472]/20 text-[#B8F7D6]' : 'bg-white/10 text-white/80')}>
                        {participant.name.trim().split(/\s+/).map(part => part[0]).join('').slice(0, 2).toUpperCase()}
                        {participant.userId === user?.uid && <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full border-2 border-[#0A2533] bg-[#1FB472]"><CheckCircle2 size={10} className="text-[#081C2D]" /></span>}
                      </div>
                      <span className="max-w-[90px] truncate text-[10px] text-white/65">{participant.userId === user?.uid ? 'Vous' : participant.name}</span>
                      {index === 0 && participant.userId === user?.uid && <span className="-mt-2 text-[9px] text-[#1FB472]">Appareil local</span>}
                    </div>
                  ))}
                  {selectedChat.participants.length === 0 && <p className="text-xs text-white/50">Invitez des participants depuis le chat.</p>}
                </div>

                <div className="flex shrink-0 items-center justify-center gap-2 border-t border-white/10 pt-3 sm:gap-3 sm:pt-4">
                  <button type="button" onClick={handleToggleMicrophone} aria-label={isMuted ? 'Activer le microphone' : 'Couper le microphone'} title={isMuted ? 'Activer le micro' : 'Couper le micro'} className={cn('flex h-11 w-11 items-center justify-center rounded-xl border transition sm:h-12 sm:w-12', isMuted ? 'border-red-400/40 bg-red-500/15 text-red-300' : 'border-white/10 bg-white/5 text-white hover:bg-white/10')}>
                    {isMuted ? <MicOff size={19} /> : <Mic size={19} />}
                  </button>
                  <button type="button" onClick={handleToggleCamera} disabled={meetingType === 'audio'} aria-label={isCamOff ? 'Activer la caméra' : 'Désactiver la caméra'} title={meetingType === 'audio' ? 'Caméra indisponible en appel audio' : isCamOff ? 'Activer la caméra' : 'Désactiver la caméra'} className={cn('flex h-11 w-11 items-center justify-center rounded-xl border transition disabled:cursor-not-allowed disabled:opacity-30 sm:h-12 sm:w-12', isCamOff ? 'border-red-400/40 bg-red-500/15 text-red-300' : 'border-white/10 bg-white/5 text-white hover:bg-white/10')}>
                    {isCamOff ? <VideoOff size={19} /> : <Video size={19} />}
                  </button>
                  <button type="button" onClick={handleToggleScreenShare} aria-label={isSharingScreen ? 'Arrêter le partage d’écran' : 'Partager l’écran'} title={isSharingScreen ? 'Arrêter le partage' : 'Partager l’écran'} className={cn('flex h-11 w-11 items-center justify-center rounded-xl border transition sm:h-12 sm:w-12', isSharingScreen ? 'border-[#1FB472]/50 bg-[#1FB472]/15 text-[#74E5B0]' : 'border-white/10 bg-white/5 text-white hover:bg-white/10')}>
                    <ScreenShare size={19} />
                  </button>
                  <button type="button" onClick={() => setCallPanelTab(current => current === 'notes' ? 'chat' : 'notes')} aria-label="Basculer les notes de réunion" title="Notes de réunion" className={cn('flex h-11 w-11 items-center justify-center rounded-xl border transition sm:h-12 sm:w-12', callPanelTab === 'notes' ? 'border-[#1FB472]/50 bg-[#1FB472]/15 text-[#74E5B0]' : 'border-white/10 bg-white/5 text-white hover:bg-white/10')}>
                    <Sparkles size={19} />
                  </button>
                  <button type="button" onClick={handleEndMeeting} aria-label="Terminer l’appel" title="Terminer l’appel" className="flex h-11 min-w-14 items-center justify-center gap-2 rounded-xl bg-red-600 px-4 text-white shadow-lg shadow-red-950/30 transition hover:bg-red-500 sm:h-12">
                    <PhoneOff size={19} /><span className="hidden text-xs font-semibold sm:inline">Quitter</span>
                  </button>
                </div>
              </section>

              <aside className="flex max-h-[36vh] min-h-[190px] shrink-0 flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#0A2533] lg:max-h-none lg:w-[320px] xl:w-[350px]">
                <div className="flex h-14 shrink-0 items-center justify-between border-b border-white/10 px-4">
                  <div className="flex items-center gap-2 text-sm font-semibold"><MessageCircle size={16} className="text-[#1FB472]" />{callPanelTab === 'chat' ? 'Chat de la réunion' : 'Notes de réunion'}</div>
                  <div className="flex rounded-lg bg-black/20 p-0.5">
                    <button type="button" onClick={() => setCallPanelTab('chat')} aria-label="Afficher le chat" className={cn('rounded-md p-1.5 transition', callPanelTab === 'chat' ? 'bg-[#1FB472] text-[#081C2D]' : 'text-white/50 hover:text-white')}><MessageCircle size={14} /></button>
                    <button type="button" onClick={() => setCallPanelTab('notes')} aria-label="Afficher les notes" className={cn('rounded-md p-1.5 transition', callPanelTab === 'notes' ? 'bg-[#1FB472] text-[#081C2D]' : 'text-white/50 hover:text-white')}><FileText size={14} /></button>
                  </div>
                </div>

                {callPanelTab === 'chat' ? <>
                  <div className="flex-1 space-y-3 overflow-y-auto p-4">
                    {messages.filter(message => message.chatId === selectedChat.id).slice(-30).map(message => {
                      const mine = message.senderId === user?.uid;
                      return <div key={message.id} className={cn('flex items-end gap-2', mine ? 'justify-end' : 'justify-start')}>
                        {!mine && <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/10 text-[9px] font-semibold text-white/70">{message.senderName.trim().split(/\s+/).map(part => part[0]).join('').slice(0, 2).toUpperCase()}</div>}
                        <div className={cn('max-w-[86%] rounded-2xl px-3 py-2', mine ? 'rounded-br-sm bg-[#1F7A63] text-white' : 'rounded-bl-sm bg-white/8 text-white/90')}>
                          {!mine && <p className="mb-1 text-[9px] font-semibold text-[#74E5B0]">{message.senderName}</p>}
                          <p className="whitespace-pre-wrap break-words text-[11px] leading-relaxed">{message.content}</p>
                          <p className="mt-1 text-right text-[8px] text-white/45">{new Date(message.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</p>
                        </div>
                      </div>;
                    })}
                    {messages.filter(message => message.chatId === selectedChat.id).length === 0 && <div className="flex h-full flex-col items-center justify-center text-center text-white/45"><MessageCircle size={24} className="mb-2 opacity-50" /><p className="text-xs">Aucun message pour le moment</p><p className="mt-1 text-[10px]">Les échanges du canal apparaîtront ici.</p></div>}
                  </div>
                  <form onSubmit={event => { event.preventDefault(); handleSendCallMessage(); }} className="flex shrink-0 items-center gap-2 border-t border-white/10 p-3">
                    <input value={callMessageInput} onChange={event => setCallMessageInput(event.target.value)} placeholder="Écrire un message…" aria-label="Message dans la réunion" className="h-10 min-w-0 flex-1 rounded-xl border border-white/10 bg-black/20 px-3 text-[11px] text-white outline-none placeholder:text-white/40 focus:border-[#1FB472]/60" />
                    <button type="submit" disabled={!callMessageInput.trim()} aria-label="Envoyer le message" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#1FB472] text-[#081C2D] transition hover:brightness-110 disabled:opacity-40"><Send size={15} /></button>
                  </form>
                </> : <>
                  <div className="flex-1 space-y-3 overflow-y-auto p-4">
                    <div className="flex items-center justify-between rounded-xl border border-[#1FB472]/20 bg-[#1FB472]/10 p-3">
                      <div className="flex items-center gap-2"><Bot size={17} className="text-[#74E5B0]" /><div><p className="text-xs font-semibold">Assistant IA Notetaker</p><p className="mt-0.5 text-[9px] text-white/50">{isNotetakerActive ? 'Notes de démonstration' : 'En pause'}</p></div></div>
                      <button type="button" onClick={() => setIsNotetakerActive(active => !active)} aria-label={isNotetakerActive ? 'Mettre le notetaker en pause' : 'Activer le notetaker'} className={cn('rounded border px-2 py-0.5 text-xs font-semibold', isNotetakerActive ? 'border-[#1FB472] bg-[#1FB472] text-[#081C2D]' : 'border-white/15 bg-white/10 text-white/60')}>{isNotetakerActive ? 'Actif' : 'Pause'}</button>
                    </div>
                    <p className="text-[10px] leading-relaxed text-white/50">Les notes ci-dessous sont des exemples. La transcription audio en direct nécessite un service de transcription connecté.</p>
                    {notetakerNotes.map((note, index) => <div key={index} className="flex items-start gap-2 rounded-xl border border-white/8 bg-white/5 p-3 text-[11px] leading-relaxed text-white/80"><CheckCircle2 size={14} className="mt-0.5 shrink-0 text-[#1FB472]" /><span>{note}</span></div>)}
                  </div>
                  <div className="border-t border-white/10 p-3">
                    <button type="button" onClick={() => {
                      const summaryText = `📋 Compte-rendu de réunion : ${selectedChat.name}\n\n${notetakerNotes.map(note => `• ${note}`).join('\n')}`;
                      const newMessage: ChatMessage = { id: `cmsg-ai-${Date.now()}`, chatId: selectedChat.id, senderId: 'ai-bot', senderName: 'AI Notetaker', senderRole: 'Assistant IA', content: summaryText, readBy: [user?.uid || ''], reactions: [], isEdited: false, createdAt: new Date().toISOString() };
                      addAndNotify('chatMessages', newMessage as any);
                      showToast('Compte-rendu publié dans le chat.', 'success');
                    }} className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#1FB472] py-2.5 text-[11px] font-semibold text-[#081C2D] transition hover:brightness-110"><Share2 size={14} />Publier les notes dans le chat</button>
                  </div>
                </>}
              </aside>
            </main>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
