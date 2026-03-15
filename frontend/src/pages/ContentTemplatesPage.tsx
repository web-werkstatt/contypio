import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Copy, Check, Plus, Trash2, Sparkles } from 'lucide-react';
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
    <button onClick={handleCopy} className="text-xs px-2 py-1 rounded border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer">
      {copied ? <><Check size={12} className="inline mr-1" />Kopiert</> : <><Copy size={12} className="inline mr-1" />Kopieren</>}
    </button>
  );
}

function Chip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-sm border transition-colors cursor-pointer ${
        active ? 'bg-blue-600 text-white border-blue-600' : 'bg-transparent text-gray-500 border-gray-300 hover:border-gray-500 dark:border-gray-600'
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

  // Create dialog state
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
      <div className="flex gap-1 mb-6 border-b border-gray-200 dark:border-gray-700">
        {TABS.map((t, i) => (
          <button
            key={t}
            onClick={() => setTab(i)}
            className={`px-4 py-2 text-sm border-b-2 transition-colors cursor-pointer ${
              tab === i ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
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
            <p className="text-xs font-medium text-gray-400 uppercase tracking-widest mb-2">Service</p>
            <div className="flex flex-wrap gap-2">
              {services && Object.entries(services).map(([k, v]) => (
                <Chip key={k} label={v} active={service === k} onClick={() => setService(k)} />
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-400 uppercase tracking-widest mb-2">Kanal</p>
            <div className="flex flex-wrap gap-2">
              {channels && Object.entries(channels).map(([k, v]) => (
                <Chip key={k} label={v} active={channel === k} onClick={() => setChannel(k)} />
              ))}
            </div>
          </div>
          {templateData && (
            <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
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
                <div key={k} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                  <p className="text-xs font-medium text-gray-400 mb-1">{k}</p>
                  <p className="text-sm leading-snug">{v}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Text prüfen */}
      {tab === 1 && (
        <div className="space-y-4">
          <textarea
            value={freeText}
            onChange={(e) => setFreeText(e.target.value)}
            placeholder="Text hier einfügen..."
            rows={8}
            className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-3 text-sm bg-white dark:bg-gray-900 resize-y"
          />
          <div className="flex items-center gap-3">
            <select
              value={freeChannel}
              onChange={(e) => setFreeChannel(e.target.value)}
              className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-900"
            >
              <option value="">Kanal (optional)</option>
              {channels && Object.entries(channels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
            <button
              onClick={() => freeText.length >= 10 && qualityMutation.mutate({ text: freeText, channel: freeChannel || undefined })}
              disabled={freeText.length < 10 || qualityMutation.isPending}
              className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 cursor-pointer"
            >
              {qualityMutation.isPending ? 'Prüfe...' : 'Text prüfen'}
            </button>
          </div>
          <p className="text-xs text-gray-400">Dein Text wird nicht gespeichert und verlässt nicht deinen Server.</p>
          {qualityMutation.data && (
            <QualityScore scores={qualityMutation.data.scores} metrics={qualityMutation.data.metrics as never} recommendation={qualityMutation.data.recommendation} />
          )}
        </div>
      )}

      {/* Tab 3: Eigene Vorlagen */}
      {tab === 2 && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-500">{customTemplates.length} eigene Vorlagen</p>
            <button onClick={() => setShowCreate(true)} className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 cursor-pointer">
              <Plus size={14} /> Neue Vorlage
            </button>
          </div>
          {customTemplates.length === 0 && (
            <p className="text-center text-gray-400 py-8 text-sm">Noch keine eigenen Vorlagen erstellt.</p>
          )}
          {customTemplates.map((t) => (
            <div key={t.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-medium text-sm">{t.title}</h3>
                  <span className="text-xs text-gray-400">{t.service_name} · {channels?.[t.channel] ?? t.channel}</span>
                  {t.ai_generated && <span className="text-xs ml-2 text-purple-500"><Sparkles size={10} className="inline" /> KI</span>}
                </div>
                <div className="flex gap-1">
                  <CopyButton text={t.content} />
                  <button onClick={() => deleteMutation.mutate(t.id)} className="text-xs px-2 py-1 rounded border border-red-200 text-red-500 hover:bg-red-50 cursor-pointer">
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
              <pre className="text-xs whitespace-pre-wrap font-sans text-gray-600 dark:text-gray-400 line-clamp-3">{t.content}</pre>
            </div>
          ))}

          {/* Create Dialog */}
          {showCreate && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowCreate(false)}>
              <div className="bg-white dark:bg-gray-900 rounded-xl p-6 w-full max-w-lg mx-4 space-y-3" onClick={(e) => e.stopPropagation()}>
                <h2 className="text-lg font-semibold">Neue Vorlage</h2>
                <input placeholder="Titel" value={createForm.title} onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-900" />
                <div className="grid grid-cols-2 gap-3">
                  <input placeholder="Service-Key (z.B. webdesign)" value={createForm.service_key} onChange={(e) => setCreateForm({ ...createForm, service_key: e.target.value })}
                    className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-900" />
                  <input placeholder="Service-Name" value={createForm.service_name} onChange={(e) => setCreateForm({ ...createForm, service_name: e.target.value })}
                    className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-900" />
                </div>
                <select value={createForm.channel} onChange={(e) => setCreateForm({ ...createForm, channel: e.target.value })}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-900">
                  {channels && Object.entries(channels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
                <textarea placeholder="Template-Inhalt" value={createForm.content} onChange={(e) => setCreateForm({ ...createForm, content: e.target.value })}
                  rows={6} className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-900 resize-y" />
                <div className="flex justify-end gap-2">
                  <button onClick={() => setShowCreate(false)} className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 cursor-pointer">Abbrechen</button>
                  <button onClick={() => createMutation.mutate(createForm)} disabled={!createForm.title || !createForm.content || !createForm.service_key}
                    className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 cursor-pointer">Erstellen</button>
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
