import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Webhook, Plus, Trash2, TestTube, Eye, EyeOff, Copy, Check, ChevronDown, ChevronRight } from 'lucide-react';
import api from '@/lib/api';

interface WebhookItem {
  id: string;
  name: string;
  url: string;
  events: string[];
  active: boolean;
  secret?: string;
  created_at: string;
  updated_at: string;
}

interface WebhookLog {
  id: string;
  event: string;
  status_code: number | null;
  success: boolean;
  duration_ms: number | null;
  attempt: number;
  created_at: string;
  response_body: string | null;
}

export default function WebhooksPage() {
  const { t } = useTranslation(['settings', 'common', 'auth']);
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [createdSecret, setCreatedSecret] = useState<string | null>(null);
  const [copiedSecret, setCopiedSecret] = useState(false);
  const [expandedLogs, setExpandedLogs] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, { success: boolean; status_code?: number; error?: string } | null>>({});

  const { data: webhooks = [], isLoading } = useQuery<WebhookItem[]>({
    queryKey: ['webhooks'],
    queryFn: async () => (await api.get('/api/webhooks')).data,
  });

  const createMutation = useMutation({
    mutationFn: (data: { name: string; url: string; events: string[] }) =>
      api.post('/api/webhooks', data),
    onSuccess: (resp) => {
      queryClient.invalidateQueries({ queryKey: ['webhooks'] });
      setCreatedSecret(resp.data.secret);
      setShowCreate(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/api/webhooks/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['webhooks'] }),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) =>
      api.put(`/api/webhooks/${id}`, { active }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['webhooks'] }),
  });

  const handleTest = async (id: string) => {
    setTestResults((prev) => ({ ...prev, [id]: null }));
    try {
      const resp = await api.post(`/api/webhooks/${id}/test`);
      setTestResults((prev) => ({ ...prev, [id]: resp.data }));
      queryClient.invalidateQueries({ queryKey: ['webhook-logs', id] });
    } catch {
      setTestResults((prev) => ({ ...prev, [id]: { success: false, error: t('settings:network_error') } }));
    }
  };

  const copySecret = (secret: string) => {
    navigator.clipboard.writeText(secret);
    setCopiedSecret(true);
    setTimeout(() => setCopiedSecret(false), 2000);
  };

  return (
    <div className="p-6 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Webhook size={24} className="text-[var(--primary)]" />
          <h1 className="text-xl font-semibold">{t('settings:webhooks')}</h1>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[var(--primary)] text-white rounded-md text-sm hover:opacity-90 transition-opacity"
        >
          <Plus size={16} /> {t('settings:create_webhook')}
        </button>
      </div>

      {/* Secret display after creation */}
      {createdSecret && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-sm font-medium text-amber-800 mb-2">
            {t('settings:webhook_secret_hint')}
          </p>
          <div className="flex items-center gap-2">
            <code className="flex-1 px-3 py-2 bg-white rounded border text-sm font-mono break-all">
              {createdSecret}
            </code>
            <button
              onClick={() => copySecret(createdSecret)}
              className="p-2 rounded hover:bg-amber-100 transition-colors"
              title={t('common:copy')}
            >
              {copiedSecret ? <Check size={16} className="text-green-600" /> : <Copy size={16} />}
            </button>
          </div>
          <button
            onClick={() => setCreatedSecret(null)}
            className="mt-2 text-xs text-amber-600 hover:underline"
          >
            {t('common:understood_close')}
          </button>
        </div>
      )}

      {/* Create Dialog */}
      {showCreate && (
        <CreateWebhookDialog
          onClose={() => setShowCreate(false)}
          onCreate={(data) => createMutation.mutate(data)}
          isLoading={createMutation.isPending}
        />
      )}

      {/* Webhook List */}
      {isLoading ? (
        <p className="text-sm text-[var(--text-muted)]">{t('common:loading')}</p>
      ) : webhooks.length === 0 ? (
        <div className="text-center py-12 text-[var(--text-muted)]">
          <Webhook size={40} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">{t('settings:no_webhooks')}</p>
          <p className="text-xs mt-1">{t('settings:webhooks_desc')}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {webhooks.map((wh) => (
            <WebhookCard
              key={wh.id}
              webhook={wh}
              testResult={testResults[wh.id]}
              logsExpanded={expandedLogs === wh.id}
              onToggleLogs={() => setExpandedLogs(expandedLogs === wh.id ? null : wh.id)}
              onTest={() => handleTest(wh.id)}
              onToggleActive={() => toggleMutation.mutate({ id: wh.id, active: !wh.active })}
              onDelete={() => {
                if (confirm(t('common:confirm_delete'))) {
                  deleteMutation.mutate(wh.id);
                }
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function WebhookCard({
  webhook,
  testResult,
  logsExpanded,
  onToggleLogs,
  onTest,
  onToggleActive,
  onDelete,
}: {
  webhook: WebhookItem;
  testResult: { success: boolean; status_code?: number; error?: string } | null | undefined;
  logsExpanded: boolean;
  onToggleLogs: () => void;
  onTest: () => void;
  onToggleActive: () => void;
  onDelete: () => void;
}) {
  const { t } = useTranslation(['settings', 'common']);

  return (
    <div className="border rounded-lg bg-white">
      <div className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-medium text-sm">{webhook.name}</h3>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                  webhook.active
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-500'
                }`}
              >
                {webhook.active ? t('common:active') : t('common:inactive')}
              </span>
            </div>
            <p className="text-xs text-[var(--text-muted)] mt-1 font-mono truncate">{webhook.url}</p>
            <div className="flex flex-wrap gap-1 mt-2">
              {webhook.events.map((ev) => (
                <span key={ev} className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-[10px]">
                  {ev}
                </span>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-1 ml-3">
            <button
              onClick={onTest}
              className="p-2 rounded hover:bg-gray-100 transition-colors text-[var(--text-muted)]"
              title={t('settings:send_test')}
            >
              <TestTube size={16} />
            </button>
            <button
              onClick={onToggleActive}
              className="p-2 rounded hover:bg-gray-100 transition-colors text-[var(--text-muted)]"
              title={webhook.active ? t('common:deactivate') : t('common:activate')}
            >
              {webhook.active ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
            <button
              onClick={onDelete}
              className="p-2 rounded hover:bg-red-50 transition-colors text-[var(--text-muted)] hover:text-red-600"
              title={t('common:delete')}
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>

        {/* Test Result */}
        {testResult && (
          <div
            className={`mt-3 p-2 rounded text-xs ${
              testResult.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
            }`}
          >
            {testResult.success
              ? t('settings:test_success', { code: testResult.status_code })
              : t('settings:test_failed', { error: testResult.error || `HTTP ${testResult.status_code}` })}
          </div>
        )}
      </div>

      {/* Logs Toggle */}
      <button
        onClick={onToggleLogs}
        className="w-full flex items-center gap-1 px-4 py-2 text-xs text-[var(--text-muted)] hover:bg-gray-50 transition-colors border-t"
      >
        {logsExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        {t('settings:recent_deliveries')}
      </button>

      {logsExpanded && <WebhookLogs webhookId={webhook.id} />}
    </div>
  );
}

function WebhookLogs({ webhookId }: { webhookId: string }) {
  const { t } = useTranslation(['settings', 'common']);
  const { data: logs = [], isLoading } = useQuery<WebhookLog[]>({
    queryKey: ['webhook-logs', webhookId],
    queryFn: async () => (await api.get(`/api/webhooks/${webhookId}/logs?limit=10`)).data,
  });

  if (isLoading) return <div className="px-4 py-3 text-xs text-[var(--text-muted)]">{t('common:loading')}</div>;
  if (logs.length === 0) return <div className="px-4 py-3 text-xs text-[var(--text-muted)]">{t('settings:no_entries_log')}</div>;

  return (
    <div className="border-t">
      <table className="w-full text-xs">
        <thead>
          <tr className="text-left text-[var(--text-muted)]">
            <th className="px-4 py-2 font-medium">{t('settings:event')}</th>
            <th className="px-4 py-2 font-medium">{t('common:status')}</th>
            <th className="px-4 py-2 font-medium">{t('settings:duration')}</th>
            <th className="px-4 py-2 font-medium">{t('settings:timestamp')}</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((log) => (
            <tr key={log.id} className="border-t border-gray-50">
              <td className="px-4 py-2 font-mono">{log.event}</td>
              <td className="px-4 py-2">
                <span className={log.success ? 'text-green-600' : 'text-red-600'}>
                  {log.status_code ?? t('common:error')}
                </span>
              </td>
              <td className="px-4 py-2">{log.duration_ms != null ? `${log.duration_ms}ms` : '-'}</td>
              <td className="px-4 py-2 text-[var(--text-muted)]">
                {new Date(log.created_at).toLocaleString('de-DE')}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CreateWebhookDialog({
  onClose,
  onCreate,
  isLoading,
}: {
  onClose: () => void;
  onCreate: (data: { name: string; url: string; events: string[] }) => void;
  isLoading: boolean;
}) {
  const { t } = useTranslation(['settings', 'common', 'auth']);
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);

  const EVENT_GROUPS: Record<string, { label: string; events: string[] }> = {
    pages: {
      label: t('settings:event_group_pages'),
      events: ['page.created', 'page.updated', 'page.published', 'page.unpublished', 'page.deleted'],
    },
    collections: {
      label: 'Collections',
      events: ['collection.item_created', 'collection.item_updated', 'collection.item_deleted'],
    },
    media: { label: t('settings:event_group_media'), events: ['media.uploaded', 'media.deleted'] },
    globals: { label: t('settings:event_group_globals'), events: ['global.updated'] },
  };

  const toggleEvent = (event: string) => {
    setSelectedEvents((prev) =>
      prev.includes(event) ? prev.filter((e) => e !== event) : [...prev, event]
    );
  };

  const toggleGroup = (events: string[]) => {
    const allSelected = events.every((e) => selectedEvents.includes(e));
    if (allSelected) {
      setSelectedEvents((prev) => prev.filter((e) => !events.includes(e)));
    } else {
      setSelectedEvents((prev) => [...new Set([...prev, ...events])]);
    }
  };

  const canSubmit = name.trim() && url.trim() && selectedEvents.length > 0;

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4">
        <div className="p-5">
          <h2 className="text-lg font-semibold mb-4">{t('settings:new_webhook')}</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">{t('auth:name')}</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t('settings:webhook_name_placeholder')}
                className="w-full px-3 py-2 border rounded-md text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">URL</label>
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com/webhook"
                className="w-full px-3 py-2 border rounded-md text-sm font-mono"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">{t('settings:events')}</label>
              <div className="space-y-3">
                {Object.entries(EVENT_GROUPS).map(([key, group]) => (
                  <div key={key}>
                    <label className="flex items-center gap-2 text-xs font-medium text-[var(--text-muted)] mb-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={group.events.every((e) => selectedEvents.includes(e))}
                        onChange={() => toggleGroup(group.events)}
                        className="rounded"
                      />
                      {group.label}
                    </label>
                    <div className="ml-5 flex flex-wrap gap-1">
                      {group.events.map((ev) => (
                        <label
                          key={ev}
                          className={`flex items-center gap-1 px-2 py-1 rounded text-[11px] cursor-pointer transition-colors ${
                            selectedEvents.includes(ev)
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={selectedEvents.includes(ev)}
                            onChange={() => toggleEvent(ev)}
                            className="sr-only"
                          />
                          {ev}
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 px-5 py-3 bg-gray-50 rounded-b-lg">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-[var(--text-muted)] hover:bg-gray-100 rounded-md transition-colors"
          >
            {t('common:cancel')}
          </button>
          <button
            onClick={() => onCreate({ name: name.trim(), url: url.trim(), events: selectedEvents })}
            disabled={!canSubmit || isLoading}
            className="px-4 py-2 text-sm bg-[var(--primary)] text-white rounded-md hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {isLoading ? t('common:creating') : t('common:create')}
          </button>
        </div>
      </div>
    </div>
  );
}
