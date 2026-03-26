import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Copy, Check, Plus, Trash2, Sparkles, X } from 'lucide-react';
import api from '@/lib/api';
import QualityScore from '@/components/content/QualityScore';
import GenerateWizard from '@/components/content/GenerateWizard';

const TABS = ['Vorlagen', 'Text prüfen', 'Eigene Vorlagen', 'KI Wizard'] as const;

interface QualityResult {
  metrics: Record<string, unknown>;
  scores: { readability: number; sentences: number; paragraphs: number; buzzwords: number; channel_fit: number; overall: number };
  recommendation: string;
}

interface CustomTemplate {
  id: string;
  service_key: string;
  service_name: string;
  channel: string;
  title: string;
  content: string;
  ai_generated: boolean;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [text]);
  return (
    <button onClick={handleCopy} className="text-xs px-2 py-1 rounded border border-[var(--border)] hover:bg-gray-50 transition-colors cursor-pointer">
      {copied ? <><Check size={12} className="inline mr-1" />Kopiert</> : <><Copy size={12} className="inline mr-1" />Kopieren</>}
    </button>
  );
}

function Chip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-sm border transition-colors cursor-pointer ${
        active ? 'bg-[var(--primary)] text-white border-[var(--primary)]' : 'bg-transparent text-[var(--text-muted)] border-[var(--border)] hover:border-[var(--text)]'
      }`}
    >
      {label}
    </button>
  );
}

export default function ContentTemplatesPage() {
  const [tab, setTab] = useState(0);
  const [service, setService] = useState('webdesign');
  const [channel, setChannel] = useState('linkedin');
  const [freeText, setFreeText] = useState('');
  const [freeChannel, setFreeChannel] = useState('');
  const queryClient = useQueryClient();

  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({ service_key: '', service_name: '', channel: 'linkedin', title: '', content: '' });

  const { data: allData } = useQuery({
    queryKey: ['content-templates', 'all'],
    queryFn: async () => (await api.get('/api/content-templates/all')).data,
  });

  const { data: templateData } = useQuery({
    queryKey: ['content-templates', service, channel],
    queryFn: async () => (await api.get(`/api/content-templates/${service}/${channel}`)).data,
    enabled: tab === 0,
  });

  const qualityMutation = useMutation({
    mutationFn: async (params: { text: string; channel?: string }) =>
      (await api.post('/api/content-templates/quality-check', params)).data as QualityResult,
  });

  const templateQuality = useQuery({
    queryKey: ['content-templates', 'quality', service, channel],
    queryFn: async () => {
      if (!templateData?.content) return null;
      return (await api.post('/api/content-templates/quality-check', { text: templateData.content, channel })).data as QualityResult;
    },
    enabled: tab === 0 && !!templateData?.content,
  });

  const createMutation = useMutation({
    mutationFn: async (body: typeof createForm) => (await api.post('/api/content-templates', body)).data,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['content-templates'] }); setShowCreate(false); },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => (await api.delete(`/api/content-templates/${id}`)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['content-templates'] }),
  });

  const services = allData?.services as Record<string, string> | undefined;
  const channels = allData?.channels as Record<string, string> | undefined;
  const customTemplates = (allData?.custom ?? []) as CustomTemplate[];

  return (
    <div className="max-w-3xl mx-auto py-6 px-4">
      <h1 className="text-xl font-semibold mb-4">Content Templates</h1>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-[var(--border)]">
        {TABS.map((t, i) => (
          <button
            key={t}
            onClick={() => setTab(i)}
            className={`px-4 py-2 text-sm border-b-2 transition-colors cursor-pointer ${
              tab === i ? 'border-[var(--primary)] text-[var(--primary)]' : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text)]'
            } ${i === 3 ? 'flex items-center gap-1' : ''}`}
          >
            {i === 3 && <Sparkles size={12} />}
            {t}
          </button>
        ))}
      </div>

      {/* Tab 1: Vorlagen */}
      {tab === 0 && (
        <div className="space-y-4">
          <div>
            <p className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-widest mb-2">Service</p>
            <div className="flex flex-wrap gap-2">
              {services && Object.entries(services).map(([k, v]) => (
                <Chip key={k} label={v} active={service === k} onClick={() => setService(k)} />
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-widest mb-2">Kanal</p>
            <div className="flex flex-wrap gap-2">
              {channels && Object.entries(channels).map(([k, v]) => (
                <Chip key={k} label={v} active={channel === k} onClick={() => setChannel(k)} />
              ))}
            </div>
          </div>
          {templateData && (
            <div className="bg-gray-50 border border-[var(--border)] rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-[var(--primary-light)] text-[var(--primary)]">
                  {templateData.service_name} · {channels?.[channel]}
                </span>
                <CopyButton text={templateData.content} />
              </div>
              <pre className="text-sm whitespace-pre-wrap font-sans leading-relaxed mb-4">{templateData.content}</pre>
              {templateQuality.data && (
                <QualityScore scores={templateQuality.data.scores} metrics={templateQuality.data.metrics as QualityResult['metrics'] & Record<string, unknown> as never} recommendation={templateQuality.data.recommendation} compact />
              )}
            </div>
          )}
          {templateData?.tips && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {Object.entries(templateData.tips as Record<string, string>).map(([k, v]) => (
                <div key={k} className="bg-white border border-[var(--border)] rounded-lg p-3">
                  <p className="text-xs font-medium text-[var(--text-muted)] mb-1">{k}</p>
                  <p className="text-sm leading-snug">{v}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Text pruefen */}
      {tab === 1 && (
        <div className="space-y-4">
          <textarea
            value={freeText}
            onChange={(e) => setFreeText(e.target.value)}
            placeholder="Text hier einfügen..."
            rows={8}
            className="w-full border border-[var(--border)] rounded-lg p-3 text-sm bg-white resize-y"
          />
          <div className="flex items-center gap-3">
            <select
              value={freeChannel}
              onChange={(e) => setFreeChannel(e.target.value)}
              className="border border-[var(--border)] rounded-lg px-3 py-2 text-sm bg-white"
            >
              <option value="">Kanal (optional)</option>
              {channels && Object.entries(channels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
            <button
              onClick={() => freeText.length >= 10 && qualityMutation.mutate({ text: freeText, channel: freeChannel || undefined })}
              disabled={freeText.length < 10 || qualityMutation.isPending}
              className="px-4 py-2 bg-[var(--primary)] text-white text-sm rounded-lg hover:opacity-90 disabled:opacity-50 cursor-pointer"
            >
              {qualityMutation.isPending ? 'Prüfe...' : 'Text prüfen'}
            </button>
          </div>
          <p className="text-xs text-[var(--text-muted)]">Dein Text wird nicht gespeichert und verlässt nicht deinen Server.</p>
          {qualityMutation.data && (
            <QualityScore scores={qualityMutation.data.scores} metrics={qualityMutation.data.metrics as never} recommendation={qualityMutation.data.recommendation} />
          )}
        </div>
      )}

      {/* Tab 3: Eigene Vorlagen */}
      {tab === 2 && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-[var(--text-muted)]">{customTemplates.length} eigene Vorlagen</p>
            <button onClick={() => setShowCreate(true)} className="flex items-center gap-1 px-3 py-1.5 bg-[var(--primary)] text-white text-sm rounded-lg hover:opacity-90 cursor-pointer">
              <Plus size={14} /> Neue Vorlage
            </button>
          </div>
          {customTemplates.length === 0 && (
            <p className="text-center text-[var(--text-muted)] py-8 text-sm">Noch keine eigenen Vorlagen erstellt.</p>
          )}
          {customTemplates.map((t) => (
            <div key={t.id} className="border border-[var(--border)] rounded-lg p-4">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-medium text-sm">{t.title}</h3>
                  <span className="text-xs text-[var(--text-muted)]">{t.service_name} · {channels?.[t.channel] ?? t.channel}</span>
                  {t.ai_generated && <span className="text-xs ml-2 text-purple-500"><Sparkles size={10} className="inline" /> KI</span>}
                </div>
                <div className="flex gap-1">
                  <CopyButton text={t.content} />
                  <button onClick={() => deleteMutation.mutate(t.id)} className="text-xs px-2 py-1 rounded border border-red-200 text-[var(--danger)] hover:bg-red-50 cursor-pointer">
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
              <pre className="text-xs whitespace-pre-wrap font-sans text-[var(--text-muted)] line-clamp-3">{t.content}</pre>
            </div>
          ))}

          {/* Create Dialog */}
          {showCreate && (
            <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setShowCreate(false)}>
              <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-lg mx-4 space-y-3" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold">Neue Vorlage</h2>
                  <button onClick={() => setShowCreate(false)} className="p-1 text-[var(--text-muted)] hover:text-[var(--text)]"><X size={18} /></button>
                </div>
                <input placeholder="Titel" value={createForm.title} onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
                  className="w-full border border-[var(--border)] rounded-lg px-3 py-2 text-sm" />
                <div className="grid grid-cols-2 gap-3">
                  <input placeholder="Service-Key (z.B. webdesign)" value={createForm.service_key} onChange={(e) => setCreateForm({ ...createForm, service_key: e.target.value })}
                    className="border border-[var(--border)] rounded-lg px-3 py-2 text-sm" />
                  <input placeholder="Service-Name" value={createForm.service_name} onChange={(e) => setCreateForm({ ...createForm, service_name: e.target.value })}
                    className="border border-[var(--border)] rounded-lg px-3 py-2 text-sm" />
                </div>
                <select value={createForm.channel} onChange={(e) => setCreateForm({ ...createForm, channel: e.target.value })}
                  className="w-full border border-[var(--border)] rounded-lg px-3 py-2 text-sm">
                  {channels && Object.entries(channels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
                <textarea placeholder="Template-Inhalt" value={createForm.content} onChange={(e) => setCreateForm({ ...createForm, content: e.target.value })}
                  rows={6} className="w-full border border-[var(--border)] rounded-lg px-3 py-2 text-sm resize-y" />
                <div className="flex justify-end gap-2">
                  <button onClick={() => setShowCreate(false)} className="px-4 py-2 text-sm text-[var(--text-muted)] hover:text-[var(--text)] cursor-pointer">Abbrechen</button>
                  <button onClick={() => createMutation.mutate(createForm)} disabled={!createForm.title || !createForm.content || !createForm.service_key}
                    className="px-4 py-2 bg-[var(--primary)] text-white text-sm rounded-lg hover:opacity-90 disabled:opacity-50 cursor-pointer">Erstellen</button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 4: KI Wizard */}
      {tab === 3 && services && channels && (
        <GenerateWizard services={services} channels={channels} />
      )}
    </div>
  );
}
