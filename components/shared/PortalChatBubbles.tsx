import { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquare, X, Send, ChevronDown, ChevronUp, Paperclip,
  Hash, Building2, Truck, Handshake, Reply, CheckCheck,
} from 'lucide-react';
import { GlassCard } from '@/components/shared/GlassCard';
import { cn } from '@/lib/utils';
import { getAll, addAndNotify, updateAndNotify } from '@/lib/db';
import type { Chat, ChatMessage, PortalUser } from '@/types';

interface PortalChatBubblesProps {
  portalUser: PortalUser;
  themeColor: 'blue' | 'emerald' | 'purple';
}

export function PortalChatBubbles({ portalUser, themeColor }: PortalChatBubblesProps) {
  const [chats, setChats] = useState<Chat[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [expanded, setExpanded] = useState(true);
  const [activeChat, setActiveChat] = useState<Chat | null>(null);
  const [messageText, setMessageText] = useState('');
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Color map
  const colors = {
    blue:    { bg: 'bg-blue-500',    bgLight: 'bg-blue-500/10',    text: 'text-blue-400',    border: 'border-blue-500/30',    ring: 'ring-blue-500/20' },
    emerald: { bg: 'bg-emerald-500', bgLight: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/30', ring: 'ring-emerald-500/20' },
    purple:  { bg: 'bg-purple-500',  bgLight: 'bg-purple-500/10',  text: 'text-purple-400',  border: 'border-purple-500/30',  ring: 'ring-purple-500/20' },
  }[themeColor];

  // Load data
  useEffect(() => {
    const allChats = getAll('chats') as Chat[];
    const allMessages = getAll('chatMessages') as ChatMessage[];

    // Filter external chats linked to this portal user
    const myChats = allChats.filter(c =>
      c.type === 'external' &&
      c.externalEntityId === portalUser.linkedInternalId
    );

    setChats(myChats);
    setMessages(allMessages);
  }, [portalUser, activeChat?.id]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, activeChat?.id]);

  const chatMessages = useMemo(() => {
    if (!activeChat) return [];
    return messages
      .filter(m => m.chatId === activeChat.id)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }, [messages, activeChat]);

  const unreadCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    chats.forEach(c => {
      counts[c.id] = messages.filter(
        m => m.chatId === c.id && !m.readBy.includes(portalUser.id)
      ).length;
    });
    return counts;
  }, [chats, messages, portalUser.id]);

  const totalUnread = Object.values(unreadCounts).reduce((a, b) => a + b, 0);

  const handleSend = () => {
    if (!messageText.trim() || !activeChat) return;

    const newMessage: ChatMessage = {
      id: `cmsg-${Date.now()}`,
      chatId: activeChat.id,
      senderId: portalUser.id,
      senderName: portalUser.displayName,
      senderRole: portalUser.portalType === 'client' ? 'Client' : portalUser.portalType === 'vendor' ? 'Fournisseur' : 'Partenaire',
      content: messageText.trim(),
      attachments: [],
      replyToId: replyTo?.id,
      replyToPreview: replyTo ? `${replyTo.senderName}: ${replyTo.content.slice(0, 40)}...` : undefined,
      isEdited: false,
      readBy: [portalUser.id],
      reactions: [],
      createdAt: new Date().toISOString(),
    };

    addAndNotify('chatMessages', newMessage);
    setMessages(prev => [...prev, newMessage]);
    setMessageText('');
    setReplyTo(null);

    // Update chat last message
    updateAndNotify('chats', activeChat.id, {
      lastMessageAt: newMessage.createdAt,
      lastMessagePreview: newMessage.content.slice(0, 60),
    });
  };

  const markAsRead = (chatId: string) => {
    const toUpdate = messages.filter(m => m.chatId === chatId && !m.readBy.includes(portalUser.id));
    toUpdate.forEach(m => {
      updateAndNotify('chatMessages', m.id, { readBy: [...m.readBy, portalUser.id] });
    });
    setMessages(prev => prev.map(m =>
      m.chatId === chatId && !m.readBy.includes(portalUser.id)
        ? { ...m, readBy: [...m.readBy, portalUser.id] }
        : m
    ));
  };

  const getScopeIcon = (scope: string) => {
    if (scope === 'client') return <Building2 size={14} />;
    if (scope === 'vendor') return <Truck size={14} />;
    if (scope === 'partner') return <Handshake size={14} />;
    return <Hash size={14} />;
  };

  const formatTime = (d: string) => new Date(d).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

  return (
    <>
      {/* ===== FLOATING BUBBLES - RIGHT SIDE ===== */}
      <div className="fixed right-0 bottom-16 sm:bottom-0 z-40 flex flex-col-reverse items-center gap-2 p-3 pointer-events-none">
        {/* Toggle Button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setExpanded(!expanded)}
          className={cn(
            "pointer-events-auto w-12 h-12 rounded-full flex items-center justify-center shadow-lg backdrop-blur-md border",
            colors.bgLight, colors.border, colors.text
          )}
        >
          {expanded ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
          {!expanded && totalUnread > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
              {totalUnread}
            </span>
          )}
        </motion.button>

        {/* Chat Bubbles */}
        <AnimatePresence>
          {expanded && chats.map((chat, index) => (
            <motion.button
              key={chat.id}
              initial={{ x: 50, opacity: 0, scale: 0.8 }}
              animate={{ x: 0, opacity: 1, scale: 1 }}
              exit={{ x: 50, opacity: 0, scale: 0.8 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => { setActiveChat(chat); markAsRead(chat.id); }}
              className={cn(
                "pointer-events-auto relative w-12 h-12 rounded-full flex items-center justify-center shadow-lg backdrop-blur-md border transition-colors",
                activeChat?.id === chat.id
                  ? cn(colors.bg, 'text-white border-transparent')
                  : cn(colors.bgLight, colors.border, colors.text, 'hover:bg-opacity-20')
              )}
              title={chat.name}
            >
              {getScopeIcon(chat.scope)}
              {unreadCounts[chat.id] > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center shadow-md">
                  {unreadCounts[chat.id]}
                </span>
              )}
            </motion.button>
          ))}
        </AnimatePresence>
      </div>

      {/* ===== CONVERSATION DRAWER ===== */}
      <AnimatePresence>
        {activeChat && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
            onClick={() => setActiveChat(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              onClick={e => e.stopPropagation()}
              className="glass-card w-full max-w-none sm:max-w-2xl h-[100dvh] sm:h-[80vh] flex flex-col border border-[var(--divider)] shadow-2xl sm:rounded-2xl"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-[var(--divider)]">
                <div className="flex items-center gap-3">
                  <div className={cn("w-10 h-10 rounded-full flex items-center justify-center", colors.bgLight, colors.text)}>
                    {getScopeIcon(activeChat.scope)}
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-[var(--text-primary)]">{activeChat.name}</h3>
                    <p className="text-[11px] text-[var(--text-muted)]">
                      {activeChat.participants.length} participant{activeChat.participants.length > 1 ? 's' : ''}
                      {activeChat.description && ` · ${activeChat.description}`}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveChat(null)}
                  className="p-2 rounded-lg hover:bg-white/5 text-[var(--text-muted)] transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {chatMessages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-[var(--text-muted)]">
                    <MessageSquare size={32} className="mb-2 opacity-30" />
                    <p className="text-sm">Aucun message</p>
                    <p className="text-xs">Soyez le premier à écrire</p>
                  </div>
                ) : (
                  chatMessages.map(msg => {
                    const isMe = msg.senderId === portalUser.id;
                    return (
                      <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={cn("flex", isMe ? 'justify-end' : 'justify-start')}
                      >
                        <div className={cn(
                          "max-w-[80%] rounded-2xl px-4 py-2.5",
                          isMe
                            ? cn(colors.bg, 'text-white rounded-br-md')
                            : 'bg-[var(--bg-elevated)] text-[var(--text-primary)] rounded-bl-md border border-[var(--divider)]'
                        )}>
                          {/* Reply preview */}
                          {msg.replyToPreview && (
                            <div className={cn(
                              "text-[11px] mb-1.5 pl-2 border-l-2",
                              isMe ? 'border-white/30 text-white/70' : 'border-[var(--accent-primary)] text-[var(--text-muted)]'
                            )}>
                              {msg.replyToPreview}
                            </div>
                          )}

                          <div className="flex items-baseline gap-2 mb-0.5">
                            {!isMe && (
                              <span className="text-[11px] font-medium text-[var(--accent-primary)]">{msg.senderName}</span>
                            )}
                            <span className="text-[10px] opacity-60">{formatTime(msg.createdAt)}</span>
                            {msg.isEdited && <span className="text-[9px] opacity-50">(modifié)</span>}
                          </div>

                          <p className="text-sm leading-relaxed">{msg.content}</p>

                          {/* Attachments */}
                          {msg.attachments && msg.attachments.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-2">
                              {msg.attachments.map(att => (
                                <button key={att.id} className={cn(
                                  "flex items-center gap-1.5 px-2 py-1 rounded-lg text-[11px]",
                                  isMe ? 'bg-white/10' : 'bg-[var(--bg-secondary)]'
                                )}>
                                  <Paperclip size={10} />
                                  {att.name}
                                </button>
                              ))}
                            </div>
                          )}

                          {/* Read status */}
                          {isMe && (
                            <div className="flex justify-end mt-1">
                              <CheckCheck size={12} className={
                                msg.readBy.length > 1 ? 'text-white/80' : 'text-white/40'
                              } />
                            </div>
                          )}
                        </div>
                      </motion.div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Reply indicator */}
              {replyTo && (
                <div className="px-4 py-2 bg-[var(--bg-elevated)] border-t border-[var(--divider)] flex items-center justify-between">
                  <div className="flex items-center gap-2 text-[11px] text-[var(--text-muted)]">
                    <Reply size={12} />
                    <span>Répondre à {replyTo.senderName}: {replyTo.content.slice(0, 50)}...</span>
                  </div>
                  <button onClick={() => setReplyTo(null)} className="p-1 hover:bg-white/5 rounded">
                    <X size={12} className="text-[var(--text-muted)]" />
                  </button>
                </div>
              )}

              {/* Input */}
              <div className="p-3 border-t border-[var(--divider)]">
                <div className="flex items-center gap-2">
                  <button className="p-2 rounded-lg hover:bg-white/5 text-[var(--text-muted)] transition-colors">
                    <Paperclip size={18} />
                  </button>
                  <input
                    value={messageText}
                    onChange={e => setMessageText(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                    placeholder="Écrivez un message..."
                    className="flex-1 px-4 py-2.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--divider)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-primary)] transition-colors"
                  />
                  <button
                    onClick={handleSend}
                    disabled={!messageText.trim()}
                    className={cn(
                      "p-2.5 rounded-xl transition-colors",
                      messageText.trim()
                        ? cn(colors.bg, 'text-white hover:opacity-90')
                        : 'bg-[var(--bg-elevated)] text-[var(--text-muted)] cursor-not-allowed'
                    )}
                  >
                    <Send size={18} />
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
