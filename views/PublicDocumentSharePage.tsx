'use client';

import { useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { Download, FileText, LoaderCircle, LockKeyhole, MessageSquareText, Send, ShieldCheck, Upload, X } from 'lucide-react';
import { trpc } from '@/providers/trpc';

export function PublicDocumentSharePage() {
  const params = useParams<{ token: string }>();
  const token = Array.isArray(params.token) ? params.token[0] : params.token;
  const [challenge, setChallenge] = useState('');
  const [code, setCode] = useState('');
  const [sessionToken, setSessionToken] = useState('');
  const [comment, setComment] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [note, setNote] = useState('');
  const [fileError, setFileError] = useState('');
  const utils = trpc.useUtils();
  const share = trpc.document.openPublicShare.useQuery({ token }, { enabled: Boolean(token), retry: false });
  const startOtp = trpc.document.startPublicShareOtp.useMutation({ onSuccess: ({ challenge }) => setChallenge(challenge) });
  const verifyOtp = trpc.document.verifyPublicShareOtp.useMutation({ onSuccess: ({ sessionToken }) => setSessionToken(sessionToken) });
  const content = trpc.document.getPublicShareContent.useQuery({ token, sessionToken }, { enabled: Boolean(token && sessionToken), retry: false });
  const comments = trpc.document.listPublicShareComments.useQuery({ token, sessionToken }, { enabled: Boolean(token && sessionToken), retry: false });
  const addComment = trpc.document.addPublicShareComment.useMutation({ onSuccess: async () => { setComment(''); await comments.refetch(); } });
  const uploadAttachment = trpc.document.uploadPublicShareAttachment.useMutation({ onSuccess: async () => { setFile(null); setNote(''); await comments.refetch(); } });
  const canComment = content.data?.permission === 'comment';
  const canUpload = content.data?.permission === 'upload';
  const expiresAt = useMemo(() => share.data?.valid ? new Date(share.data.expiresAt).toLocaleString('fr-FR') : '', [share.data]);

  const fileToBase64 = (selected: File) => new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Impossible de lire ce fichier.'));
    reader.onload = () => resolve(String(reader.result).split(',')[1] ?? '');
    reader.readAsDataURL(selected);
  });

  const submitAttachment = async () => {
    if (!file) return;
    setFileError('');
    if (file.size > 10 * 1024 * 1024) { setFileError('Le fichier dépasse la limite de 10 Mo.'); return; }
    if (!['application/pdf', 'image/png', 'image/jpeg'].includes(file.type)) { setFileError('Formats acceptés : PDF, PNG ou JPEG.'); return; }
    try {
      const base64 = await fileToBase64(file);
      uploadAttachment.mutate({ token, sessionToken, fileName: file.name, mimeType: file.type as 'application/pdf' | 'image/png' | 'image/jpeg', base64, note: note || undefined });
    } catch (error) {
      setFileError(error instanceof Error ? error.message : 'Lecture du fichier impossible.');
    }
  };

  const downloadAttachment = async (commentId: number) => {
    try {
      const result = await utils.document.downloadPublicShareAttachment.fetch({ token, sessionToken, commentId });
      const link = document.createElement('a');
      link.href = result.url;
      link.target = '_blank';
      link.rel = 'noreferrer';
      link.click();
    } catch (error) {
      setFileError(error instanceof Error ? error.message : 'Téléchargement indisponible.');
    }
  };

  const errorMessage = (error?: { message?: string }) => error?.message || 'Une erreur est survenue. Réessayez.';

  return <main className="min-h-screen bg-slate-50 px-4 py-10 text-slate-900">
    <div className="mx-auto max-w-2xl">
      <div className="mb-8 flex items-center gap-3"><div className="grid h-11 w-11 place-items-center rounded bg-emerald-700 text-white"><FileText size={21} /></div><div><p className="text-xs font-bold uppercase tracking-[.16em] text-emerald-800">IDIBA · Partage externe</p><p className="text-sm text-slate-500">Accès documentaire sécurisé</p></div></div>

      {share.isLoading && <StateCard icon={LoaderCircle} title="Vérification du lien…" detail="Nous vérifions sa validité et sa date d’expiration." />}
      {share.isError && <StateCard icon={X} title="Lien indisponible" detail={errorMessage(share.error)} />}
      {share.data && !share.data.valid && <StateCard icon={X} title="Lien expiré ou révoqué" detail="Demandez à l’entreprise qui vous a transmis ce lien de vous en envoyer un nouveau." />}

      {share.data?.valid && !sessionToken && <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="mb-5 grid h-12 w-12 place-items-center rounded-full bg-emerald-50 text-emerald-800"><LockKeyhole size={21} /></div>
        <h1 className="text-2xl font-bold">Vérifiez votre accès</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">Un code à usage unique sera envoyé à l’adresse autorisée {share.data.recipientHint ? <strong>{share.data.recipientHint}</strong> : 'du destinataire'}.</p>
        {!challenge ? <button disabled={startOtp.isPending} onClick={() => startOtp.mutate({ token })} className="mt-6 inline-flex h-11 items-center justify-center gap-2 rounded bg-emerald-700 px-5 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-50"><Send size={16} />{startOtp.isPending ? 'Envoi…' : 'Recevoir mon code'}</button> : <form className="mt-6 space-y-4" onSubmit={(event) => { event.preventDefault(); verifyOtp.mutate({ token, challenge, code }); }}>
          <label className="block text-sm font-semibold">Code à 6 chiffres<input autoFocus required inputMode="numeric" pattern="[0-9]{6}" maxLength={6} value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))} className="mt-2 h-12 w-full rounded border border-slate-300 px-3 text-lg tracking-[.4em] outline-none focus:border-emerald-700" placeholder="000000" /></label>
          <button disabled={verifyOtp.isPending || code.length !== 6} className="inline-flex h-11 items-center gap-2 rounded bg-emerald-700 px-5 text-sm font-semibold text-white disabled:opacity-50">{verifyOtp.isPending ? 'Vérification…' : 'Valider le code'}</button>
          {verifyOtp.error && <p role="alert" className="text-sm text-red-700">{verifyOtp.error.message}</p>}
          <button type="button" disabled={startOtp.isPending} onClick={() => { setChallenge(''); setCode(''); startOtp.mutate({ token }); }} className="ml-3 text-sm font-medium text-emerald-800">Renvoyer un code</button>
        </form>}
        {startOtp.error && <p role="alert" className="mt-4 text-sm text-red-700">{startOtp.error.message}</p>}
        <p className="mt-6 flex items-center gap-2 border-t border-slate-100 pt-4 text-xs text-slate-500"><ShieldCheck size={14} />Lien temporaire · expiration {expiresAt}</p>
      </section>}

      {sessionToken && content.isLoading && <StateCard icon={LoaderCircle} title="Ouverture du document…" detail="Le lien et le code d’accès sont vérifiés." />}
      {sessionToken && content.isError && <StateCard icon={X} title="Session expirée" detail={errorMessage(content.error)} />}
      {content.data && <>
        <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start"><div><div className="mb-2 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-emerald-800"><ShieldCheck size={14} />Accès vérifié</div><h1 className="text-2xl font-bold">{content.data.document.title}</h1><p className="mt-2 text-sm text-slate-600">{content.data.document.documentType}{content.data.document.documentNumber ? ` · ${content.data.document.documentNumber}` : ''}</p></div>{content.data.downloadUrl && <a href={content.data.downloadUrl} rel="noreferrer" className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded bg-emerald-700 px-4 text-sm font-semibold text-white hover:bg-emerald-800"><Download size={16} />Télécharger</a>}</div>
          <div className="mt-6 grid gap-3 rounded bg-slate-50 p-4 text-xs text-slate-600 sm:grid-cols-2"><div><span className="font-semibold">Accès valable jusqu’au</span><br />{new Date(content.data.expiresAt).toLocaleString('fr-FR')}</div><div className="break-all"><span className="font-semibold">Empreinte SHA-256</span><br />{content.data.document.sha256 || 'Non disponible'}</div></div>
        </section>

        {(canComment || canUpload) && <section className="mt-5 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="flex items-center gap-2 text-lg font-bold"><MessageSquareText size={18} />Échanges avec l’entreprise</h2>
          <div className="mt-4 space-y-3">{comments.data?.length ? comments.data.map((item) => <article key={item.id} className="rounded bg-slate-50 p-3"><p className="whitespace-pre-wrap text-sm text-slate-800">{item.body}</p>{item.attachmentName && <button onClick={() => void downloadAttachment(item.id)} className="mt-2 inline-flex items-center gap-2 text-xs font-semibold text-emerald-800"><Download size={13} />{item.attachmentName}</button>}<time className="mt-2 block text-[11px] text-slate-400">{new Date(item.createdAt).toLocaleString('fr-FR')}</time></article>) : <p className="text-sm text-slate-500">Aucun message pour le moment.</p>}</div>
          {canComment && <form className="mt-4" onSubmit={(event) => { event.preventDefault(); addComment.mutate({ token, sessionToken, body: comment }); }}><label className="block text-sm font-semibold">Votre commentaire<textarea required maxLength={3000} rows={3} value={comment} onChange={(event) => setComment(event.target.value)} className="mt-2 w-full rounded border border-slate-300 p-3 text-sm outline-none focus:border-emerald-700" placeholder="Écrivez votre réponse…" /></label><button disabled={addComment.isPending || !comment.trim()} className="mt-3 inline-flex h-10 items-center gap-2 rounded bg-emerald-700 px-4 text-sm font-semibold text-white disabled:opacity-50"><Send size={15} />Envoyer</button>{addComment.error && <p role="alert" className="mt-2 text-sm text-red-700">{addComment.error.message}</p>}</form>}
          {canUpload && <div className="mt-5 border-t border-slate-100 pt-4"><label className="block text-sm font-semibold">Déposer un fichier (PDF, PNG ou JPEG, 10 Mo max)<input type="file" accept="application/pdf,image/png,image/jpeg" onChange={(event) => { setFile(event.target.files?.[0] ?? null); setFileError(''); }} className="mt-2 block w-full text-sm text-slate-600 file:mr-3 file:rounded file:border-0 file:bg-emerald-50 file:px-3 file:py-2 file:font-semibold file:text-emerald-800" /></label>{file && <><input value={note} onChange={(event) => setNote(event.target.value)} maxLength={1000} placeholder="Note (facultatif)" className="mt-3 h-10 w-full rounded border border-slate-300 px-3 text-sm" /><button onClick={() => void submitAttachment()} disabled={uploadAttachment.isPending} className="mt-3 inline-flex h-10 items-center gap-2 rounded bg-emerald-700 px-4 text-sm font-semibold text-white disabled:opacity-50"><Upload size={15} />{uploadAttachment.isPending ? 'Analyse en cours…' : 'Envoyer le fichier'}</button></>}{fileError && <p role="alert" className="mt-2 text-sm text-red-700">{fileError}</p>}{uploadAttachment.error && <p role="alert" className="mt-2 text-sm text-red-700">{uploadAttachment.error.message}</p>}</div>}
        </section>}
      </>}
    </div>
  </main>;
}

function StateCard({ icon: Icon, title, detail }: { icon: typeof FileText; title: string; detail: string }) {
  return <section className="rounded-lg border border-slate-200 bg-white p-8 text-center shadow-sm"><div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-slate-100 text-slate-600"><Icon size={21} /></div><h1 className="mt-4 text-xl font-bold">{title}</h1><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">{detail}</p></section>;
}
