import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquare, Send, Sparkles, Copy, Mail, Linkedin, Smartphone, MessageCircle,
  Bot, User, ChevronDown, Flame, RefreshCw, ThumbsUp, ThumbsDown, Clock,
  CheckCircle, Eye, TrendingUp, Target, Plus, X, Edit3, Wand2, Paperclip,
  Check, FileText, Image, XCircle, LayoutTemplate, BarChart3, ArrowRightLeft
} from 'lucide-react';
import { GlassCard } from '@/components/shared/GlassCard';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { useUIStore } from '@/stores/uiStore';
import { getAll, addAndNotify } from '@/lib/db';

const channelIcons: Record<string, React.ReactNode> = {
  email: <Mail size={14} />,
  linkedin: <Linkedin size={14} />,
  whatsapp: <Smartphone size={14} />,
  sms: <MessageCircle size={14} />,
};

const channelLabels: Record<string, string> = {
  email: 'Email',
  linkedin: 'LinkedIn',
  whatsapp: 'WhatsApp',
  sms: 'SMS',
};

const toneLabels: Record<string, { label: string; color: string }> = {
  professional: { label: 'Professionnel', color: '#3B82F6' },
  casual: { label: 'Decontracte', color: '#2DD4A8' },
  enthusiastic: { label: 'Enthousiaste', color: '#F59E0B' },
  empathetic: { label: 'Empathique', color: '#8B5CF6' },
  urgent: { label: 'Urgent', color: '#EF4444' },
};

export function VibeOutreachPage() {
  const { setCurrentPageTitle, showToast } = useUIStore();
  const [activeTab, setActiveTab] = useState<'generator' | 'history' | 'campaigns' | 'templates'>('generator');
  const [selectedLead, setSelectedLead] = useState('');
  const [channel, setChannel] = useState<'email' | 'linkedin' | 'whatsapp' | 'sms'>('email');
  const [tone, setTone] = useState<'professional' | 'casual' | 'enthusiastic' | 'empathetic' | 'urgent'>('professional');
  const [prompt, setPrompt] = useState('');
  const [generatedMessage, setGeneratedMessage] = useState('');
  const [subject, setSubject] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showComposer, setShowComposer] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [attachments, setAttachments] = useState<{ name: string; size: string; type: string }[]>([]);
  const [fileInputEl, setFileInputEl] = useState<HTMLInputElement | null>(null);

  useEffect(() => { setCurrentPageTitle('Messages IA - Outreach'); }, [setCurrentPageTitle]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach(file => {
      const size = file.size < 1024 * 1024 ? `${(file.size / 1024).toFixed(0)} Ko` : `${(file.size / (1024 * 1024)).toFixed(1)} Mo`;
      setAttachments(prev => [...prev, { name: file.name, size, type: file.type }]);
    });
    showToast(`${files.length} fichier(s) ajoute(s)`, 'success');
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const leads = getAll('leads');
  const messages = getAll('messages');
  const campaigns = getAll('campaigns');

  const handleGenerate = () => {
    if (!selectedLead || !prompt) return;
    setIsGenerating(true);
    const lead = leads.find((l: any) => l.id === selectedLead);
    if (!lead) return;

    setTimeout(() => {
      const templates: Record<string, Record<string, string>> = {
        professional: {
          email: `Objet: ${subject || 'Proposition de collaboration'}\n\nBonjour ${lead.fullName},\n\nJ'espere que ce message vous trouve bien. Je suis ${lead.assignedToName || 'conseiller'} chez IDIBA Group SARL, agence creative et marketing leader en Afrique centrale.\n\n${prompt}\n\nNotre expertise reconnue dans le secteur ${lead.industry.toLowerCase()} nous permet de proposer des solutions adaptees a vos besoins specifiques. Nous avons deja accompagne des entreprises telles que ${lead.company} dans des projets similaires avec des resultats concluants.\n\nSeriez-vous disponible pour un echange de 15 minutes cette semaine ou la suivante ?\n\nJe reste a votre entiere disposition pour toute information complementaire.\n\nCordialement,`,
          linkedin: `Bonjour ${lead.fullName},\n\nJ'ai suivi avec interet votre parcours chez ${lead.company}. En tant que ${lead.position}, vous faites face a des enjeux strategiques qui necessitent des partenaires fiables.\n\n${prompt}\n\nIDIBA Group accompagne les leaders de l'industrie ${lead.industry.toLowerCase()} avec des solutions sur mesure.\n\nSeriez-vous ouvert a un echange de 15 minutes ?\n\nBien a vous,`,
          whatsapp: `Bonjour ${lead.fullName}, je suis de IDIBA Group SARL 👋\n\n${prompt}\n\nNous avons des solutions adaptees pour ${lead.company}. Pourrions-nous echanger brievement ?`,
          sms: `IDIBA Group: Bonjour ${lead.fullName}, ${prompt.slice(0, 80)}... Interesse par un echange rapide ? Repondez OUI.`,
        },
        casual: {
          email: `Salut ${lead.fullName},\n\nJ'espere que tu vas bien ! Je travaille chez IDIBA Group et je suis tombe sur ton profil.\n\n${prompt}\n\nCa te dirait qu'on en discute autour d'un cafe virtuel ? Pas de pression, juste pour echanger !\n\nA bientot,`,
          linkedin: `Hey ${lead.fullName} ! 👋\n\nJ'ai vu ton profil et je trouve ton parcours chez ${lead.company} super interessant.\n\n${prompt}\n\nCa te dit qu'on en parle ? Sans engagement, juste pour voir si ca matche !`,
          whatsapp: `Salut ${lead.fullName} ! C'est IDIBA Group 😊\n\n${prompt}\n\nTu aurais 5 min pour qu'on en parle ?`,
          sms: `Hey ${lead.fullName}, IDIBA Group ici ! ${prompt.slice(0, 70)}... T'as 2 min ?`,
        },
        enthusiastic: {
          email: `Objet: 🚀 Une opportunite incroyable pour ${lead.company} !\n\nBonjour ${lead.fullName},\n\nJ'ai une EXCELLENTE nouvelle pour vous ! 🎉\n\n${prompt}\n\nChez IDIBA Group, nous sommes passionnes par l'innovation et convaincus que ${lead.company} peut atteindre de nouveaux sommets avec nos solutions.\n\nNe manquez pas cette opportunite ! Rejoignez les leaders qui nous font deja confiance.\n\nA tres vite pour une demonstration !`,
          linkedin: `Bonjour ${lead.fullName} ! 🚀\n\nJ'ai decouvert ${lead.company} et je suis VRAIMENT impressionne par ce que vous faites !\n\n${prompt}\n\nIDIBA Group a exactement ce qu'il faut pour propulser ${lead.company} vers le succes ! 💪\n\nOn se prend un call cette semaine ?`,
          whatsapp: `🚀 Salut ${lead.fullName} ! Super nouvelle de IDIBA Group !\n\n${prompt}\n\nC'est le moment parfait pour ${lead.company} ! On en parle ?`,
          sms: `IDIBA Group: ${lead.fullName}, ${prompt.slice(0, 60)}... Opportunite exclusive! Repondez INFO.`,
        },
        empathetic: {
          email: `Bonjour ${lead.fullName},\n\nJe sais que le poste de ${lead.position} chez ${lead.company} comporte de nombreux defis, notamment en ce qui concerne l'infrastructure technologique.\n\n${prompt}\n\nNous comprenons parfaitement ces difficultes. C'est pourquoi IDIBA Group a developpe des solutions qui repondent precisement a ces besoins, en reduisant les tracas quotidiens et en ameliorant la productivite.\n\nJe serais honore de pouvoir vous accompagner dans cette demarche.\n\nAvec toute mon empathie,`,
          linkedin: `Bonjour ${lead.fullName},\n\nJe connais les defis du metier de ${lead.position}. Ce n'est pas toujours facile de trouver les bons partenaires technologiques.\n\n${prompt}\n\nIDIBA Group est la pour vous soutenir, pas pour vous vendre quelque chose dont vous n'avez pas besoin.\n\nSi vous en ressentez le besoin, je serai la pour echanger.`,
          whatsapp: `Bonjour ${lead.fullName}, je comprends que gerer ${lead.company} n'est pas simple. ${prompt.slice(0, 60)}... IDIBA Group peut vous aider. On en parle quand vous voulez.`,
          sms: `IDIBA Group: ${lead.fullName}, on sait que c'est dur. ${prompt.slice(0, 50)}... On peut vous aider. INFO pour plus de details.`,
        },
        urgent: {
          email: `Objet: ⚠️ ACTION REQUISE - Opportunite limitee pour ${lead.company}\n\nBonjour ${lead.fullName},\n\nCeci est un message important qui requiert votre attention immediate.\n\n${prompt}\n\nCette opportunite est disponible pour une duree limitee. Plusieurs entreprises du secteur ${lead.industry.toLowerCase()} ont deja adopte nos solutions.\n\nJe vous invite a repondre dans les 48h pour beneficier de nos conditions privilegiees.\n\nCordialement,`,
          linkedin: `${lead.fullName}, j'ai une info importante pour ${lead.company}.\n\n${prompt}\n\nC'est le moment ou jamais. Les places sont limitees pour ce trimestre.\n\nPeux-tu me confirmer ton interet avant la fin de la semaine ?`,
          whatsapp: `⚠️ ${lead.fullName}, info urgente de IDIBA Group :\n\n${prompt.slice(0, 80)}...\n\nRepondez vite, places limitees !`,
          sms: `URGENT IDIBA Group: ${lead.fullName}, ${prompt.slice(0, 55)}... Repondez MAINTENANT.`,
        },
      };

      const msg = templates[tone]?.[channel] || templates.professional.email;
      setGeneratedMessage(msg);
      setIsGenerating(false);
      showToast('Message genere par IA', 'success');
    }, 1500);
  };

  const copyMessage = () => {
    navigator.clipboard.writeText(generatedMessage);
    showToast('Message copie', 'success');
  };

  const sendMessage = () => {
    if (!generatedMessage || !selectedLead) return;
    const lead = leads.find((l: any) => l.id === selectedLead);
    if (!lead) return;
    const msg = {
      id: `msg-${Date.now()}`,
      campaignId: undefined,
      leadId: selectedLead,
      leadName: lead.fullName,
      channel,
      subject: subject || undefined,
      body: generatedMessage,
      aiGenerated: true,
      aiPrompt: prompt,
      status: 'sent' as const,
      tone,
      personalizationScore: Math.floor(Math.random() * 20) + 80,
      sentAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      companyId: 'comp-1',
      attachments: attachments.length > 0 ? attachments.map(a => a.name) : undefined,
    };
    addAndNotify('messages', msg);
    showToast('Message envoye avec succes', 'success');
    setGeneratedMessage('');
    setSubject('');
    setPrompt('');
    setAttachments([]);
    setIsEditing(false);
  };

  const messageStats = {
    total: messages.length,
    sent: messages.filter((m: any) => m.status === 'sent').length,
    opened: messages.filter((m: any) => m.status === 'opened').length,
    replied: messages.filter((m: any) => m.status === 'replied').length,
    draft: messages.filter((m: any) => m.status === 'draft').length,
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Messages IA - Outreach</h2>
          <p className="text-xs text-[var(--text-muted)]">Hyper-personnalisation par IA generative</p>
        </div>
        <div className="flex gap-1 bg-[var(--bg-elevated)] rounded-lg p-0.5">
          {[{ k: 'generator', l: 'Generateur', i: <Sparkles size={12} /> }, { k: 'history', l: 'Historique', i: <Clock size={12} /> }, { k: 'campaigns', l: 'Campagnes', i: <Target size={12} /> }, { k: 'templates', l: 'Templates', i: <LayoutTemplate size={12} /> }].map(t => (
            <button key={t.k} onClick={() => setActiveTab(t.k as any)} className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md ${activeTab === t.k ? 'bg-[var(--bg-card)] text-[var(--text-primary)] shadow-sm' : 'text-[var(--text-muted)]'}`}>{t.i} {t.l}</button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
        {[
          { label: 'Total', value: messageStats.total, icon: <MessageSquare size={16} />, color: 'var(--accent-primary)' },
          { label: 'Envoyés', value: messageStats.sent, icon: <Send size={16} />, color: 'var(--accent-secondary)' },
          { label: 'Ouverts', value: messageStats.opened, icon: <Eye size={16} />, color: 'var(--accent-warning)' },
          { label: 'Réponses', value: messageStats.replied, icon: <CheckCircle size={16} />, color: 'var(--accent-primary)' },
          { label: 'Brouillons', value: messageStats.draft, icon: <Edit3 size={16} />, color: 'var(--text-muted)' },
        ].map((s, i) => (
          <GlassCard key={s.label} delay={i * 0.05}>
            <div className="p-3 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: s.color + '20', color: s.color }}>{s.icon}</div>
              <div><p className="text-base font-bold text-[var(--text-primary)]">{s.value}</p><p className="text-[10px] text-[var(--text-muted)]">{s.label}</p></div>
            </div>
          </GlassCard>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'generator' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Generator Form */}
          <GlassCard delay={0.2}>
            <div className="p-4">
              <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2"><Wand2 size={14} className="text-[var(--accent-primary)]" /> Configuration du Message</h3>
              <div className="space-y-4">
                {/* Lead Selection */}
                <div>
                  <label className="block text-xs text-[var(--text-secondary)] mb-1.5">Prospect cible</label>
                  <select value={selectedLead} onChange={e => setSelectedLead(e.target.value)} className="w-full h-10 px-3 glass-input text-sm">
                    <option value="">Selectionner un lead...</option>
                    {leads.map((l: any) => <option key={l.id} value={l.id}>{l.fullName} - {l.company}</option>)}
                  </select>
                </div>

                {/* Channel */}
                <div>
                  <label className="block text-xs text-[var(--text-secondary)] mb-1.5">Canal</label>
                  <div className="flex gap-2">
                    {(['email', 'linkedin', 'whatsapp', 'sms'] as const).map(c => (
                      <button key={c} onClick={() => setChannel(c)} className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium ${channel === c ? 'bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] ring-1 ring-[var(--accent-primary)]/30' : 'bg-[var(--bg-elevated)] text-[var(--text-muted)]'}`}>
                        {channelIcons[c]} {channelLabels[c]}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tone */}
                <div>
                  <label className="block text-xs text-[var(--text-secondary)] mb-1.5">Ton</label>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(toneLabels).map(([k, v]) => (
                      <button key={k} onClick={() => setTone(k as any)} className={`px-3 py-1.5 rounded-lg text-xs font-medium ${tone === k ? 'text-white' : 'bg-[var(--bg-elevated)] text-[var(--text-muted)]'}`} style={tone === k ? { backgroundColor: v.color } : {}}>
                        {v.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Subject (for email) */}
                {channel === 'email' && (
                  <div>
                    <label className="block text-xs text-[var(--text-secondary)] mb-1.5">Objet</label>
                    <input value={subject} onChange={e => setSubject(e.target.value)} className="w-full h-10 px-3 glass-input text-sm" placeholder="Objet de l'email..." />
                  </div>
                )}

                {/* Prompt */}
                <div>
                  <label className="block text-xs text-[var(--text-secondary)] mb-1.5">Contexte / Prompt IA</label>
                  <textarea value={prompt} onChange={e => setPrompt(e.target.value)} className="w-full h-24 px-3 py-2 glass-input text-sm resize-none" placeholder="Decrivez le contexte, le signal d'achat detecte, ou ce que vous voulez communiquer..." />
                </div>

                {/* Generate Button */}
                <button
                  onClick={handleGenerate}
                  disabled={!selectedLead || !prompt || isGenerating}
                  className="w-full btn-primary h-10 justify-center gap-2 disabled:opacity-50"
                >
                  {isGenerating ? <><RefreshCw size={14} className="animate-spin" /> Generation en cours...</> : <><Sparkles size={14} /> Generer le message IA</>}
                </button>
              </div>
            </div>
          </GlassCard>

          {/* Preview */}
          <GlassCard delay={0.25}>
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-[var(--text-primary)] flex items-center gap-2"><Eye size={14} className="text-[var(--accent-primary)]" /> Apercu</h3>
                {generatedMessage && (
                  <div className="flex gap-2">
                    {isEditing ? (
                      <button onClick={() => { setIsEditing(false); showToast('Modifications enregistrees', 'success'); }} className="flex items-center gap-1 text-[10px] text-[var(--accent-primary)] hover:underline"><Check size={10} /> Enregistrer</button>
                    ) : (
                      <button onClick={() => setIsEditing(true)} className="flex items-center gap-1 text-[10px] text-[var(--accent-warning)] hover:underline"><Edit3 size={10} /> Modifier</button>
                    )}
                    <button onClick={copyMessage} className="flex items-center gap-1 text-[10px] text-[var(--accent-secondary)] hover:underline"><Copy size={10} /> Copier</button>
                    <button onClick={handleGenerate} className="flex items-center gap-1 text-[10px] text-[var(--accent-primary)] hover:underline"><RefreshCw size={10} /> Regenerer</button>
                  </div>
                )}
              </div>

              {generatedMessage ? (
                <div className="space-y-4">
                  <div className="bg-[var(--bg-elevated)] rounded-lg p-4 border border-[var(--glass-border)]">
                    <div className="flex items-center gap-2 mb-3 pb-2 border-b border-[var(--divider)]">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--accent-primary)] to-[var(--accent-primary-hover)] flex items-center justify-center text-white text-xs font-bold">
                        {selectedLead ? leads.find((l: any) => l.id === selectedLead)?.fullName.charAt(0) || '?' : '?'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-[var(--text-primary)] truncate">
                          {selectedLead ? leads.find((l: any) => l.id === selectedLead)?.fullName : 'Prospect'}
                        </p>
                        <p className="text-[10px] text-[var(--text-muted)]">
                          {channelLabels[channel]} · {toneLabels[tone].label}
                        </p>
                      </div>
                      {/* Paperclip attachment button */}
                      <button
                        onClick={() => fileInputEl?.click()}
                        className="p-2 rounded-lg hover:bg-[var(--accent-primary)]/10 text-[var(--text-muted)] hover:text-[var(--accent-primary)] transition-colors"
                        title="Ajouter un fichier joint"
                      >
                        <Paperclip size={14} />
                      </button>
                      <input
                        ref={setFileInputEl}
                        type="file"
                        multiple
                        className="hidden"
                        onChange={handleFileSelect}
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.xls,.xlsx,.ppt,.pptx"
                      />
                    </div>

                    {/* Message content — editable */}
                    {isEditing ? (
                      <textarea
                        value={generatedMessage}
                        onChange={e => setGeneratedMessage(e.target.value)}
                        className="w-full h-48 px-0 py-0 glass-input text-xs leading-relaxed resize-none bg-transparent border-0 focus:ring-1 focus:ring-[var(--accent-primary)]/30"
                      />
                    ) : (
                      <pre className="text-xs text-[var(--text-primary)] whitespace-pre-line leading-relaxed font-sans">{generatedMessage}</pre>
                    )}

                    {/* Attachments list */}
                    {attachments.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-[var(--divider)]/50 space-y-1.5">
                        {attachments.map((att, idx) => (
                          <div key={idx} className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-[var(--accent-primary)]/5 border border-[var(--accent-primary)]/10">
                            {att.type.startsWith('image/') ? <Image size={12} className="text-[var(--accent-primary)]" /> : <FileText size={12} className="text-[var(--accent-primary)]" />}
                            <span className="text-[10px] text-[var(--text-primary)] flex-1 truncate">{att.name}</span>
                            <span className="text-[9px] text-[var(--text-muted)]">{att.size}</span>
                            <button onClick={() => removeAttachment(idx)} className="p-0.5 rounded hover:bg-white/10 text-[var(--accent-danger)]">
                              <XCircle size={12} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* AI Score */}
                  <div className="glass-card-compact p-3 bg-gradient-to-r from-[var(--accent-primary)]/5 to-[var(--accent-primary-hover)]/5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Sparkles size={12} className="text-[var(--accent-primary)]" />
                        <span className="text-[10px] text-[var(--text-secondary)]">Score de personnalisation IA</span>
                      </div>
                      <span className="text-sm font-bold text-[var(--accent-primary)]">{Math.floor(Math.random() * 15) + 85}%</span>
                    </div>
                    <div className="h-1.5 bg-[var(--bg-elevated)] rounded-full overflow-hidden mt-1">
                      <div className="h-full bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-primary-hover)] rounded-full" style={{ width: `${Math.floor(Math.random() * 15) + 85}%` }} />
                    </div>
                  </div>

                  <button onClick={sendMessage} className="w-full btn-primary h-10 justify-center gap-2">
                    <Send size={14} /> Envoyer le message {attachments.length > 0 && `(${attachments.length} piece${attachments.length > 1 ? 's' : ''} jointe${attachments.length > 1 ? 's' : ''})`}
                  </button>
                </div>
              ) : (
                <div className="text-center py-12 text-[var(--text-muted)]">
                  <Bot size={32} className="mx-auto mb-3 opacity-30" />
                  <p className="text-xs">Configurez le generateur pour creer un message IA hyper-personnalise</p>
                </div>
              )}
            </div>
          </GlassCard>
        </div>
      )}

      {activeTab === 'history' && (
        <div className="space-y-3">
          {messages.map((msg: any, i: number) => (
            <motion.div key={msg.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
              <GlassCard hover={false}>
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[var(--accent-primary)]">{channelIcons[msg.channel]}</span>
                      <span className="text-xs font-medium text-[var(--text-primary)]">{msg.leadName}</span>
                      <StatusBadge status={msg.status} />
                      {msg.aiGenerated && <span className="text-[9px] bg-[var(--accent-purple)]/10 text-[var(--accent-purple)] px-1.5 py-0.5 rounded flex items-center gap-1"><Bot size={8} /> IA</span>}
                    </div>
                    <span className="text-[10px] text-[var(--text-muted)]">{msg.sentAt ? new Date(msg.sentAt).toLocaleDateString('fr-FR') : 'Brouillon'}</span>
                  </div>
                  {msg.subject && <p className="text-xs font-medium text-[var(--text-primary)] mb-1">{msg.subject}</p>}
                  <p className="text-xs text-[var(--text-secondary)] line-clamp-2">{msg.body}</p>
                  {msg.attachments && msg.attachments.length > 0 && (
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <Paperclip size={10} className="text-[var(--accent-primary)]" />
                      <span className="text-[9px] text-[var(--accent-primary)]">{msg.attachments.length} piece(s) jointe(s): {msg.attachments.join(', ')}</span>
                    </div>
                  )}
                  {msg.replyContent && (
                    <div className="mt-2 p-2 rounded-lg bg-[var(--accent-primary)]/5 border border-[var(--accent-primary)]/10">
                      <p className="text-[10px] text-[var(--accent-primary)] font-medium mb-0.5">Reponse :</p>
                      <p className="text-[10px] text-[var(--text-secondary)]">{msg.replyContent}</p>
                    </div>
                  )}
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </div>
      )}

      {activeTab === 'campaigns' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button className="btn-primary h-9 text-xs gap-1.5"><Plus size={14} /> Nouvelle campagne</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {campaigns.map((camp: any, i: number) => (
              <motion.div key={camp.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <GlassCard>
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-sm font-semibold text-[var(--text-primary)]">{camp.name}</h3>
                        <p className="text-[10px] text-[var(--text-muted)]">{camp.targetAudience}</p>
                      </div>
                      <StatusBadge status={camp.status} />
                    </div>

                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-[var(--accent-primary)]">{channelIcons[camp.channel]}</span>
                      <span className="text-[10px] text-[var(--text-secondary)]">{channelLabels[camp.channel]}</span>
                    </div>

                    {/* Metrics */}
                    <div className="grid grid-cols-3 gap-2 mb-3">
                      <div className="text-center p-2 rounded-lg bg-[var(--bg-elevated)]">
                        <p className="text-sm font-bold text-[var(--text-primary)]">{camp.leadsCount}</p>
                        <p className="text-[9px] text-[var(--text-muted)]">Leads</p>
                      </div>
                      <div className="text-center p-2 rounded-lg bg-[var(--bg-elevated)]">
                        <p className="text-sm font-bold text-[var(--text-primary)]">{camp.sentCount}</p>
                        <p className="text-[9px] text-[var(--text-muted)]">Envoyés</p>
                      </div>
                      <div className="text-center p-2 rounded-lg bg-[var(--bg-elevated)]">
                        <p className="text-sm font-bold text-[var(--accent-primary)]">{camp.conversionRate}%</p>
                        <p className="text-[9px] text-[var(--text-muted)]">Conversion</p>
                      </div>
                    </div>

                    {/* Funnel */}
                    <div className="space-y-1 mb-3">
                      {[
                        { label: 'Ouvertures', value: camp.openedCount, total: camp.sentCount },
                        { label: 'Réponses', value: camp.repliedCount, total: camp.sentCount },
                        { label: 'Positives', value: camp.positiveCount, total: camp.sentCount },
                      ].map(item => (
                        <div key={item.label} className="flex items-center gap-2">
                          <span className="text-[9px] text-[var(--text-secondary)] w-16">{item.label}</span>
                          <div className="flex-1 h-1.5 bg-[var(--bg-elevated)] rounded-full overflow-hidden">
                            <div className="h-full bg-[var(--accent-primary)] rounded-full" style={{ width: `${(item.value / item.total) * 100}%` }} />
                          </div>
                          <span className="text-[9px] text-[var(--text-primary)] w-6 text-right">{item.value}</span>
                        </div>
                      ))}
                    </div>

                    {/* AI Prompt */}
                    <div className="glass-card-compact p-2">
                      <div className="flex items-start gap-1.5">
                        <Sparkles size={10} className="text-[var(--accent-purple)] mt-0.5 shrink-0" />
                        <p className="text-[9px] text-[var(--text-secondary)] line-clamp-2">{camp.aiPrompt}</p>
                      </div>
                    </div>
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        </div>
      )}
      {activeTab === 'templates' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">Templates Email & A/B Testing</h3>
            <button className="btn-primary h-9 text-xs gap-1.5"><Plus size={14} /> Nouveau template</button>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <GlassCard>
              <div className="p-4">
                <h4 className="text-xs font-medium text-[var(--text-primary)] mb-3">Bibliothèque de templates</h4>
                <div className="space-y-2">
                  {[
                    { name: 'Introduction professionnelle', category: 'outreach', openRate: 68, clickRate: 12, usageCount: 45 },
                    { name: 'Suivi apres premiere prise de contact', category: 'follow_up', openRate: 72, clickRate: 18, usageCount: 32 },
                    { name: 'Relance facture amiable', category: 'reminder', openRate: 85, clickRate: 25, usageCount: 28 },
                    { name: 'Newsletter mensuelle', category: 'newsletter', openRate: 45, clickRate: 8, usageCount: 12 },
                    { name: 'Welcome new client', category: 'welcome', openRate: 92, clickRate: 35, usageCount: 18 },
                    { name: 'Cold email - Tech', category: 'cold', openRate: 35, clickRate: 5, usageCount: 56 },
                  ].map((tpl, i) => (
                    <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }} className="glass-card-compact p-3 cursor-pointer hover:bg-white/[0.02] transition-colors">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <LayoutTemplate size={12} className="text-[var(--accent-primary)]" />
                          <span className="text-xs font-medium text-[var(--text-primary)]">{tpl.name}</span>
                        </div>
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-[var(--bg-elevated)] text-[var(--text-muted)] uppercase">{tpl.category}</span>
                      </div>
                      <div className="flex items-center gap-3 mt-2">
                        <div className="flex items-center gap-1"><Eye size={10} className="text-[var(--text-muted)]" /><span className="text-[10px] text-[var(--text-secondary)]">{tpl.openRate}% ouverture</span></div>
                        <div className="flex items-center gap-1"><TrendingUp size={10} className="text-[var(--text-muted)]" /><span className="text-[10px] text-[var(--text-secondary)]">{tpl.clickRate}% clic</span></div>
                        <div className="flex items-center gap-1"><Send size={10} className="text-[var(--text-muted)]" /><span className="text-[10px] text-[var(--text-secondary)]">{tpl.usageCount} utilisations</span></div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </GlassCard>

            <GlassCard>
              <div className="p-4">
                <div className="flex items-center gap-2 mb-4">
                  <ArrowRightLeft size={14} className="text-[var(--accent-primary)]" />
                  <h4 className="text-xs font-medium text-[var(--text-primary)]">A/B Testing Actif</h4>
                </div>
                <div className="space-y-3">
                  <div className="glass-card-compact p-3 border-l-2 border-[var(--accent-primary)]">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-[var(--text-primary)]">Test: Sujet email</span>
                      <StatusBadge status="running" label="En cours" />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="p-2 rounded bg-[var(--bg-elevated)]">
                        <div className="flex items-center gap-1 mb-1"><span className="text-[9px] font-bold text-[var(--accent-primary)]">Variante A</span></div>
                        <p className="text-[10px] text-[var(--text-secondary)]">Proposition de collaboration</p>
                        <p className="text-sm font-bold text-[var(--text-primary)] mt-1">68% ouverture</p>
                      </div>
                      <div className="p-2 rounded bg-[var(--bg-elevated)]">
                        <div className="flex items-center gap-1 mb-1"><span className="text-[9px] font-bold text-[var(--accent-secondary)]">Variante B</span></div>
                        <p className="text-[10px] text-[var(--text-secondary)]">Opportunite pour [Entreprise]</p>
                        <p className="text-sm font-bold text-[var(--text-primary)] mt-1">74% ouverture</p>
                      </div>
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <BarChart3 size={12} className="text-[var(--accent-primary)]" />
                      <span className="text-[10px] text-[var(--accent-primary)]">Gagnant: Variante B (+6%)</span>
                    </div>
                  </div>

                  <div className="glass-card-compact p-3 border-l-2 border-[var(--accent-warning)]">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-[var(--text-primary)]">Test: CTA bouton</span>
                      <StatusBadge status="pending" label="Planifie" />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="p-2 rounded bg-[var(--bg-elevated)]">
                        <span className="text-[9px] font-bold text-[var(--accent-primary)]">Variante A</span>
                        <p className="text-[10px] text-[var(--text-secondary)]">"En savoir plus"</p>
                      </div>
                      <div className="p-2 rounded bg-[var(--bg-elevated)]">
                        <span className="text-[9px] font-bold text-[var(--accent-secondary)]">Variante B</span>
                        <p className="text-[10px] text-[var(--text-secondary)]">"Demarrer maintenant"</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </GlassCard>
          </div>
        </div>
      )}
    </div>
  );
}
