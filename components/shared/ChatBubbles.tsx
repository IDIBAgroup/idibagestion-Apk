import { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquare, X, Send, Paperclip, Hash, Building2, Briefcase, Globe, Video, Phone,
  Users, Crown, Trash2, Archive, Reply, CheckCheck, Search, ArrowLeft,
} from 'lucide-react';
import { getAll, addAndNotify, updateAndNotify, removeAndNotify, subscribe } from '@/lib/db';
import { useAuth } from '@/hooks/useAuth';
import { useUIStore } from '@/stores/uiStore';
import { useNavigate } from '@/lib/navigation';
import type { Chat, ChatMessage } from '@/types';
import { cn } from '@/lib/utils';

// Floating messenger inspired by the clear, two-pane layout of WhatsApp Web.
export function ChatBubbles() {
  const { user } = useAuth();
  const { showToast } = useUIStore();
  const navigate = useNavigate();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [chats, setChats] = useState<Chat[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [panelOpen, setPanelOpen] = useState(false);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const [search, setSearch] = useState('');
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);
  const [showParticipants, setShowParticipants] = useState(false);

  const isAdmin = user?.roleName === 'Administrateur' || user?.permissions?.includes('*');

  useEffect(() => {
    const load = () => {
      setChats(getAll('chats') as Chat[]);
      setMessages(getAll('chatMessages') as ChatMessage[]);
    };
    load();
    const unsubChats = subscribe('chats', load);
    const unsubMessages = subscribe('chatMessages', load);
    return () => { unsubChats(); unsubMessages(); };
  }, []);

  const myChats = useMemo(() => chats
    .filter(chat => chat.participantIds?.includes(user?.uid || '') || isAdmin)
    .filter(chat => !chat.isArchived)
    .sort((a, b) => new Date(b.lastMessageAt || b.createdAt).getTime() - new Date(a.lastMessageAt || a.createdAt).getTime()),
  [chats, user?.uid, isAdmin]);

  const filteredChats = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase();
    if (!normalizedSearch) return myChats;
    return myChats.filter(chat => `${chat.name} ${chat.description || ''} ${chat.lastMessagePreview || ''}`.toLocaleLowerCase().includes(normalizedSearch));
  }, [myChats, search]);

  const activeChat = useMemo(() => myChats.find(chat => chat.id === activeChatId) || null, [myChats, activeChatId]);
  const chatMessages = useMemo(() => messages
    .filter(message => message.chatId === activeChatId)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()),
  [messages, activeChatId]);
  const totalUnread = myChats.reduce((sum, chat) => sum + (chat.unreadCount || 0), 0);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [chatMessages.length, activeChatId]);

  const formatTime = (dateStr?: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    if (Number.isNaN(date.getTime())) return '';
    const sameDay = date.toDateString() === new Date().toDateString();
    return sameDay ? date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
  };

  const getInitials = (name = '') => name.trim().split(/\s+/).filter(Boolean).map(part => part[0]).join('').substring(0, 2).toUpperCase() || '?';
  const getChatIcon = (chat: Chat, size = 16) => {
    if (chat.type === 'external') {
      if (chat.externalEntityType === 'client') return <Building2 size={size} />;
      if (chat.externalEntityType === 'vendor') return <Briefcase size={size} />;
      return <Globe size={size} />;
    }
    if (chat.scope === 'department') return <Users size={size} />;
    if (chat.scope === 'project') return <Briefcase size={size} />;
    return <Hash size={size} />;
  };

  const handleOpenChat = (chatId: string) => {
    setActiveChatId(chatId);
    setShowParticipants(false);
    const chat = chats.find(item => item.id === chatId);
    if (chat && chat.unreadCount > 0) updateAndNotify('chats', chatId, { unreadCount: 0 });
  };

  const handleSendMessage = () => {
    if (!messageInput.trim() || !activeChatId || !user) return;
    const newMessage: ChatMessage = {
      id: `cmsg-${Date.now()}`,
      chatId: activeChatId,
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
    addAndNotify('chatMessages', newMessage as any);
    updateAndNotify('chats', activeChatId, { lastMessageAt: newMessage.createdAt, lastMessagePreview: newMessage.content.substring(0, 80) });
    setMessageInput('');
    setReplyingTo(null);
  };

  const handleArchiveChat = (chatId: string) => {
    updateAndNotify('chats', chatId, { isArchived: true });
    setActiveChatId(null);
    showToast('Chat archivé', 'info');
  };

  const handleDeleteChat = (chatId: string) => {
    if (!confirm('Supprimer cette conversation définitivement ?')) return;
    messages.filter(message => message.chatId === chatId).forEach(message => removeAndNotify('chatMessages', message.id));
    removeAndNotify('chats', chatId);
    setChats(previous => previous.filter(chat => chat.id !== chatId));
    setMessages(previous => previous.filter(message => message.chatId !== chatId));
    setActiveChatId(null);
    showToast('Conversation supprimée', 'success');
  };

  const closePanel = () => { setPanelOpen(false); setShowParticipants(false); };
  const startCallFromBubble = (chatId: string, type: 'video' | 'audio') => {
    const request = { chatId, type };
    sessionStorage.setItem('idibages_pending_chat_call', JSON.stringify(request));
    closePanel();
    navigate('/chat');
    window.dispatchEvent(new CustomEvent('idibages-open-chat-call', { detail: request }));
  };

  return (
    <>
      <AnimatePresence>
        {panelOpen && (
          <motion.section
            role="dialog"
            aria-label="Messagerie"
            initial={{ opacity: 0, y: 18, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 18, scale: 0.98 }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            className="fixed z-50 inset-2 sm:inset-auto sm:right-6 sm:bottom-24 w-auto sm:w-[min(900px,calc(100vw-3rem))] h-auto sm:h-[min(650px,calc(100dvh-8rem))] min-h-0 rounded-2xl sm:rounded-[20px] overflow-hidden border border-[var(--divider)] bg-[var(--bg-primary)] shadow-[0_24px_80px_rgba(0,0,0,.34)] flex"
          >
            {/* Conversation rail */}
            <aside className={cn('w-full sm:w-[330px] shrink-0 flex-col bg-[var(--bg-secondary)] border-r border-[var(--divider)]', activeChat ? 'hidden sm:flex' : 'flex')}>
              <div className="px-5 pt-5 pb-4">
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <p className="text-[11px] uppercase tracking-[.16em] font-semibold text-[var(--accent-primary)]">IDIBAGES</p>
                    <h2 className="text-xl font-semibold text-[var(--text-primary)] mt-1">Messagerie</h2>
                  </div>
                  <button type="button" onClick={closePanel} aria-label="Fermer la messagerie" className="sm:hidden p-2 rounded-lg text-[var(--text-muted)] hover:bg-[var(--bg-elevated)]"><X size={19} /></button>
                </div>
                <label className="h-10 flex items-center gap-2.5 px-3 rounded-xl bg-[var(--bg-elevated)] border border-[var(--divider)] focus-within:border-[var(--accent-primary)]/60 transition-colors">
                  <Search size={16} className="text-[var(--text-muted)] shrink-0" />
                  <input value={search} onChange={event => setSearch(event.target.value)} placeholder="Rechercher une conversation" className="w-full bg-transparent outline-none text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)]" />
                </label>
              </div>
              <div className="px-5 pb-2 flex items-center justify-between text-[11px] text-[var(--text-muted)]">
                <span>Conversations</span><span>{myChats.length}</span>
              </div>
              <div className="flex-1 overflow-y-auto px-2 pb-3">
                {filteredChats.length === 0 ? (
                  <div className="h-full min-h-40 flex flex-col items-center justify-center px-6 text-center text-[var(--text-muted)]">
                    <MessageSquare size={24} className="mb-3 opacity-40" />
                    <p className="text-sm font-medium">{myChats.length ? 'Aucun résultat' : 'Aucune conversation'}</p>
                    <p className="text-xs mt-1">{myChats.length ? 'Essayez un autre terme de recherche.' : 'Vos conversations apparaîtront ici.'}</p>
                  </div>
                ) : filteredChats.map(chat => {
                  const lastMessage = messages.filter(message => message.chatId === chat.id).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
                  return (
                    <button type="button" key={chat.id} onClick={() => handleOpenChat(chat.id)} aria-current={activeChatId === chat.id ? 'true' : undefined}
                      className={cn('w-full flex items-center gap-3 px-3 py-3 text-left rounded-xl transition-colors', activeChatId === chat.id ? 'bg-[var(--accent-primary)]/12' : 'hover:bg-[var(--bg-elevated)]')}>
                      <span className="relative w-11 h-11 shrink-0 rounded-full bg-[var(--accent-primary)]/12 text-[var(--accent-primary)] flex items-center justify-center">
                        {getChatIcon(chat, 18)}
                        <span className="absolute -right-0.5 -bottom-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-[var(--bg-secondary)]" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center justify-between gap-2">
                          <span className="truncate text-[13px] font-semibold text-[var(--text-primary)]">{chat.name}</span>
                          <span className={cn('shrink-0 text-[10px]', chat.unreadCount ? 'text-[var(--accent-primary)] font-semibold' : 'text-[var(--text-muted)]')}>{formatTime(chat.lastMessageAt || chat.createdAt)}</span>
                        </span>
                        <span className="flex items-center justify-between gap-2 mt-1">
                          <span className="truncate text-[11px] text-[var(--text-muted)]">{lastMessage ? `${lastMessage.senderId === user?.uid ? 'Vous : ' : ''}${lastMessage.content}` : chat.lastMessagePreview || chat.description || 'Démarrer la conversation'}</span>
                          {!!chat.unreadCount && <span className="min-w-5 h-5 px-1 rounded-full bg-[var(--accent-primary)] text-white text-[10px] font-bold flex items-center justify-center">{chat.unreadCount}</span>}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
              <div className="border-t border-[var(--divider)] px-5 py-3 text-[10px] text-[var(--text-muted)] flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500" /> Messagerie sécurisée
              </div>
            </aside>

            {/* Active conversation */}
            <div className={cn('min-w-0 flex-1 flex-col bg-[var(--bg-primary)]', activeChat ? 'flex' : 'hidden sm:flex')}>
              {activeChat ? <>
                <header className="h-[72px] shrink-0 px-3 sm:px-5 flex items-center justify-between gap-3 border-b border-[var(--divider)] bg-[var(--bg-secondary)]">
                  <div className="flex items-center gap-3 min-w-0">
                    <button type="button" onClick={() => setActiveChatId(null)} aria-label="Retour aux conversations" className="sm:hidden p-2 -ml-2 rounded-lg text-[var(--text-muted)] hover:bg-[var(--bg-elevated)]"><ArrowLeft size={19} /></button>
                    <div className="w-10 h-10 shrink-0 rounded-full bg-[var(--accent-primary)]/12 text-[var(--accent-primary)] flex items-center justify-center">{getChatIcon(activeChat, 18)}</div>
                    <div className="min-w-0">
                      <h3 className="truncate text-sm font-semibold text-[var(--text-primary)]">{activeChat.name}</h3>
                      <p className="text-[11px] text-[var(--text-muted)] truncate">{activeChat.type === 'external' && activeChat.externalEntityName ? `${activeChat.externalEntityName} · ` : ''}{activeChat.participants.length} participant{activeChat.participants.length > 1 ? 's' : ''}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button type="button" onClick={() => startCallFromBubble(activeChat.id, 'video')} aria-label="Démarrer un appel vidéo" title="Appel vidéo" className="p-2 rounded-lg text-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/10 transition-colors"><Video size={17} /></button>
                    <button type="button" onClick={() => startCallFromBubble(activeChat.id, 'audio')} aria-label="Démarrer un appel audio" title="Appel audio" className="p-2 rounded-lg text-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/10 transition-colors"><Phone size={16} /></button>
                    <button type="button" onClick={() => setShowParticipants(!showParticipants)} aria-label="Afficher les participants" className={cn('p-2 rounded-lg transition-colors', showParticipants ? 'bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]' : 'text-[var(--text-muted)] hover:bg-[var(--bg-elevated)]')}><Users size={17} /></button>
                    {(isAdmin || activeChat.createdBy === user?.uid) && <>
                      <button type="button" onClick={() => handleArchiveChat(activeChat.id)} aria-label="Archiver la conversation" className="p-2 rounded-lg text-[var(--text-muted)] hover:bg-[var(--bg-elevated)]"><Archive size={17} /></button>
                      <button type="button" onClick={() => handleDeleteChat(activeChat.id)} aria-label="Supprimer la conversation" className="p-2 rounded-lg text-[var(--text-muted)] hover:bg-red-500/10 hover:text-red-400"><Trash2 size={17} /></button>
                    </>}
                    <button type="button" onClick={closePanel} aria-label="Fermer la messagerie" className="p-2 rounded-lg text-[var(--text-muted)] hover:bg-[var(--bg-elevated)]"><X size={18} /></button>
                  </div>
                </header>

                <AnimatePresence>
                  {showParticipants && <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden border-b border-[var(--divider)] bg-[var(--bg-secondary)]">
                    <div className="px-4 py-3 flex gap-2 overflow-x-auto">
                      {activeChat.participants.map(participant => <div key={participant.userId} className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--bg-elevated)] border border-[var(--divider)] shrink-0">
                        <div className="w-6 h-6 rounded-full bg-[var(--accent-primary)]/15 flex items-center justify-center text-[9px] font-bold text-[var(--accent-primary)]">{getInitials(participant.name)}</div>
                        <span className="text-[11px] text-[var(--text-primary)]">{participant.name}</span>
                        {participant.userId === activeChat.createdBy && <Crown size={11} className="text-amber-400" />}
                      </div>)}
                    </div>
                  </motion.div>}
                </AnimatePresence>

                <div className="flex-1 overflow-y-auto px-3 sm:px-6 py-5 space-y-3 bg-[radial-gradient(ellipse_at_top,_var(--bg-secondary),_var(--bg-primary)_70%)]">
                  {chatMessages.length === 0 ? <div className="h-full min-h-48 flex flex-col items-center justify-center text-center text-[var(--text-muted)]">
                    <div className="w-14 h-14 rounded-2xl bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] flex items-center justify-center mb-4"><MessageSquare size={24} /></div>
                    <p className="text-sm font-medium text-[var(--text-primary)]">Votre conversation commence ici</p>
                    <p className="text-xs mt-1">Envoyez un message pour lancer l’échange.</p>
                  </div> : chatMessages.map((message, index) => {
                    const isMe = message.senderId === user?.uid;
                    const showSender = index === 0 || chatMessages[index - 1].senderId !== message.senderId;
                    return <motion.div key={message.id} initial={{ opacity: 0, y: 7 }} animate={{ opacity: 1, y: 0 }} className={cn('group flex gap-2 items-end', isMe ? 'justify-end' : 'justify-start')}>
                      {!isMe && <div className="w-7 h-7 shrink-0 rounded-full bg-[var(--bg-elevated)] text-[var(--text-muted)] border border-[var(--divider)] flex items-center justify-center text-[9px] font-semibold">{showSender ? getInitials(message.senderName) : ''}</div>}
                      <div className={cn('max-w-[82%] sm:max-w-[72%] px-3.5 py-2.5 shadow-sm', isMe ? 'rounded-2xl rounded-br-sm bg-[var(--accent-primary)] text-white' : 'rounded-2xl rounded-bl-sm bg-[var(--bg-elevated)] text-[var(--text-primary)] border border-[var(--divider)]')}>
                        {!isMe && showSender && <p className="text-[10px] font-semibold text-[var(--accent-primary)] mb-1">{message.senderName}</p>}
                        {message.replyToPreview && <div className={cn('text-[10px] mb-2 px-2 py-1 rounded border-l-2 opacity-80 truncate', isMe ? 'bg-black/10 border-white/60' : 'bg-[var(--bg-primary)] border-[var(--accent-primary)]')}>{message.replyToPreview}</div>}
                        <p className="text-[13px] leading-relaxed whitespace-pre-wrap break-words">{message.content}</p>
                        <div className={cn('mt-1 flex justify-end items-center gap-1.5', isMe ? 'text-white/70' : 'text-[var(--text-muted)]')}>
                          <span className="text-[9px]">{formatTime(message.createdAt)}</span>
                          {isMe && <CheckCheck size={13} className={(message.readBy || []).length > 1 ? 'text-sky-200' : ''} />}
                        </div>
                      </div>
                      <button type="button" onClick={() => setReplyingTo(message)} aria-label={`Répondre à ${message.senderName}`} className="opacity-0 group-hover:opacity-100 focus:opacity-100 p-1.5 rounded-lg text-[var(--text-muted)] hover:bg-[var(--bg-elevated)] transition-opacity"><Reply size={14} /></button>
                    </motion.div>;
                  })}
                  <div ref={messagesEndRef} />
                </div>

                <form onSubmit={event => { event.preventDefault(); handleSendMessage(); }} className="shrink-0 border-t border-[var(--divider)] bg-[var(--bg-secondary)] p-3 sm:px-5 sm:py-4">
                  {replyingTo && <div className="flex items-center gap-2 mb-2.5 px-3 py-2 rounded-lg bg-[var(--bg-elevated)] border border-[var(--divider)]">
                    <Reply size={14} className="text-[var(--accent-primary)] shrink-0" />
                    <span className="text-[11px] text-[var(--text-muted)] truncate flex-1">Réponse à {replyingTo.senderName} : {replyingTo.content}</span>
                    <button type="button" onClick={() => setReplyingTo(null)} aria-label="Annuler la réponse" className="text-[var(--text-muted)] hover:text-[var(--text-primary)]"><X size={14} /></button>
                  </div>}
                  <div className="flex items-end gap-2">
                    <button type="button" onClick={() => showToast('La pièce jointe sera bientôt disponible', 'info')} aria-label="Ajouter une pièce jointe" className="h-10 w-10 shrink-0 rounded-xl text-[var(--text-muted)] hover:text-[var(--accent-primary)] hover:bg-[var(--bg-elevated)] flex items-center justify-center"><Paperclip size={18} /></button>
                    <textarea value={messageInput} onChange={event => setMessageInput(event.target.value)} onKeyDown={event => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); handleSendMessage(); } }} placeholder="Écrire un message…" aria-label="Votre message" rows={1} className="min-h-10 max-h-28 flex-1 resize-none rounded-xl border border-[var(--divider)] bg-[var(--bg-elevated)] px-3.5 py-2.5 text-[13px] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none focus:border-[var(--accent-primary)]/70" />
                    <button type="submit" disabled={!messageInput.trim()} aria-label="Envoyer le message" className={cn('h-10 w-10 shrink-0 rounded-xl flex items-center justify-center transition-all', messageInput.trim() ? 'bg-[var(--accent-primary)] text-white shadow-md shadow-[var(--accent-primary)]/20 hover:brightness-105' : 'bg-[var(--bg-elevated)] text-[var(--text-muted)]')}><Send size={17} /></button>
                  </div>
                  <p className="hidden sm:block text-[9px] text-[var(--text-muted)] ml-12 mt-1.5">Entrée pour envoyer · Maj + Entrée pour un retour à la ligne</p>
                </form>
              </> : <div className="hidden sm:flex flex-1 flex-col items-center justify-center p-8 text-center">
                <div className="w-20 h-20 rounded-[26px] bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] flex items-center justify-center mb-5"><MessageSquare size={34} /></div>
                <h3 className="text-lg font-semibold text-[var(--text-primary)]">Gardez vos échanges au même endroit</h3>
                <p className="max-w-sm text-sm text-[var(--text-muted)] mt-2">Choisissez une conversation pour retrouver les messages et répondre rapidement à votre équipe.</p>
                <div className="mt-6 flex items-center gap-2 text-[11px] text-[var(--text-muted)]"><span className="w-2 h-2 rounded-full bg-emerald-500" />{totalUnread ? `${totalUnread} message${totalUnread > 1 ? 's' : ''} non lu${totalUnread > 1 ? 's' : ''}` : 'Tout est à jour'}</div>
              </div>}
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {!panelOpen && <motion.button type="button" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.96 }} onClick={() => setPanelOpen(true)} aria-label="Ouvrir la messagerie" aria-expanded={false}
        className="fixed right-5 bottom-5 z-[60] w-14 h-14 rounded-2xl bg-[var(--accent-primary)] text-white flex items-center justify-center shadow-[0_10px_30px_rgba(31,180,114,.35)] hover:shadow-[0_14px_34px_rgba(31,180,114,.42)] transition-shadow">
        <MessageSquare size={22} />
        {totalUnread > 0 && <span className="absolute -top-1.5 -right-1.5 min-w-5 h-5 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center border-2 border-[var(--bg-primary)]">{totalUnread > 99 ? '99+' : totalUnread}</span>}
      </motion.button>}
    </>
  );
}
