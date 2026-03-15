import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Key, Plus, Trash2, Eye, EyeOff, Copy, Check } from 'lucide-react';
import api from '@/lib/api';

interface ApiKeyItem {
  id: number;
  name: string;
  key_prefix: string;
  scopes: string[];
  active: boolean;
  expires_at: string | null;
  last_used_at: string | null;
  created_at: string;
}

interface ApiKeyCreated extends ApiKeyItem {
  raw_key: string;
}

export default function ApiKeysPage() {
  const { t } = useTranslation(['settings', 'common', 'auth']);
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [createdKey, setCreatedKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const { data: keys = [], isLoading } = useQuery<ApiKeyItem[]>({
    queryKey: ['api-keys'],
    queryFn: async () => (await api.get('/api/api-keys')).data,
  });

  const createMutation = useMutation({
    mutationFn: (data: { name: string; scopes: string[]; expires_at?: string }) =>
      api.post('/api/api-keys', data),
    onSuccess: (resp) => {
      const created = resp.data as ApiKeyCreated;
      setCreatedKey(created.raw_key);
      setShowCreate(false);
      queryClient.invalidateQueries({ queryKey: ['api-keys'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/api/api-keys/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['api-keys'] }),
  });

  const toggleMutation = useMutation({
    mutationFn: (id: number) => api.patch(`/api/api-keys/${id}/toggle`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['api-keys'] }),
  });

  const copyKey = (key: string) => {
    navigator.clipboard.writeText(key);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="p-6 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Key size={24} className="text-[var(--primary)]" />
          <h1 className="text-xl font-semibold">{t('settings:api_keys')}</h1>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[var(--primary)] text-white rounded-md text-sm hover:opacity-90 transition-opacity"
        >
          <Plus size={16} /> {t('settings:create_api_key')}
        </button>
      </div>

      {createdKey && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-sm font-medium text-amber-800 mb-2">
            {t('settings:api_key_hint')}
          </p>
          <div className="flex items-center gap-2">
            <code className="flex-1 px-3 py-2 bg-white rounded border text-sm font-mono break-all">
              {createdKey}
            </code>
            <button
              onClick={() => copyKey(createdKey)}
              className="p-2 rounded hover:bg-amber-100 transition-colors"
              title={t('common:copy')}
            >
              {copied ? <Check size={16} className="text-green-600" /> : <Copy size={16} />}
            </button>
          </div>
          <button
            onClick={() => setCreatedKey(null)}
            className="mt-2 text-xs text-amber-600 hover:underline"
          >
            {t('common:understood_close')}
          </button>
        </div>
      )}

      {showCreate && (
        <CreateKeyDialog
          onClose={() => setShowCreate(false)}
          onCreate={(data) => createMutation.mutate(data)}
          isLoading={createMutation.isPending}
        />
      )}

      {isLoading ? (
        <p className="text-sm text-[var(--text-muted)]">{t('common:loading')}</p>
      ) : keys.length === 0 ? (
        <div className="text-center py-12 text-[var(--text-muted)]">
          <Key size={40} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">{t('settings:no_api_keys')}</p>
          <p className="text-xs mt-1">{t('settings:api_keys_desc')}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {keys.map((k) => (
            <div key={k.id} className="border rounded-lg bg-white p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-sm">{k.name}</h3>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                      k.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {k.active ? t('common:active') : t('common:inactive')}
                    </span>
                  </div>
                  <p className="text-xs text-[var(--text-muted)] mt-1 font-mono">{k.key_prefix}...</p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {k.scopes.map((scope) => (
                      <span key={scope} className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-[10px]">
                        {scope === '*' ? t('settings:all_collections') : scope}
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-4 mt-2 text-[10px] text-[var(--text-muted)]">
                    <span>{t('settings:created')} {new Date(k.created_at).toLocaleDateString('de-DE')}</span>
                    {k.last_used_at && <span>{t('settings:last_used')} {new Date(k.last_used_at).toLocaleDateString('de-DE')}</span>}
                    {k.expires_at && <span>{t('settings:expires')} {new Date(k.expires_at).toLocaleDateString('de-DE')}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-1 ml-3">
                  <button
                    onClick={() => toggleMutation.mutate(k.id)}
                    className="p-2 rounded hover:bg-gray-100 transition-colors text-[var(--text-muted)]"
                    title={k.active ? t('common:deactivate') : t('common:activate')}
                  >
                    {k.active ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(t('common:confirm_delete'))) {
                        deleteMutation.mutate(k.id);
                      }
                    }}
                    className="p-2 rounded hover:bg-red-50 transition-colors text-[var(--text-muted)] hover:text-red-600"
                    title={t('common:delete')}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function CreateKeyDialog({
  onClose,
  onCreate,
  isLoading,
}: {
  onClose: () => void;
  onCreate: (data: { name: string; scopes: string[]; expires_at?: string }) => void;
  isLoading: boolean;
}) {
  const { t } = useTranslation(['settings', 'common', 'auth']);
  const [name, setName] = useState('');
  const [scopeMode, setScopeMode] = useState<'all' | 'custom'>('all');
  const [customScopes, setCustomScopes] = useState('');
  const [expiresAt, setExpiresAt] = useState('');

  const canSubmit = name.trim().length > 0;

  const handleSubmit = () => {
    const scopes = scopeMode === 'all' ? ['*'] : customScopes.split(',').map((s) => s.trim()).filter(Boolean);
    onCreate({
      name: name.trim(),
      scopes,
      expires_at: expiresAt || undefined,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4">
        <div className="p-5">
          <h2 className="text-lg font-semibold mb-4">{t('settings:create_api_key')}</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">{t('auth:name')}</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="z.B. Astro Frontend, Mobile App"
                className="w-full px-3 py-2 border rounded-md text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t('settings:access')}</label>
              <div className="flex gap-3 mb-2">
                <label className="flex items-center gap-1.5 text-sm">
                  <input
                    type="radio"
                    checked={scopeMode === 'all'}
                    onChange={() => setScopeMode('all')}
                  />
                  {t('settings:all_collections')}
                </label>
                <label className="flex items-center gap-1.5 text-sm">
                  <input
                    type="radio"
                    checked={scopeMode === 'custom'}
                    onChange={() => setScopeMode('custom')}
                  />
                  {t('settings:restricted')}
                </label>
              </div>
              {scopeMode === 'custom' && (
                <input
                  type="text"
                  value={customScopes}
                  onChange={(e) => setCustomScopes(e.target.value)}
                  placeholder="tours, destinations (kommagetrennt)"
                  className="w-full px-3 py-2 border rounded-md text-sm font-mono"
                />
              )}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t('settings:expiry_date')}</label>
              <input
                type="date"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
                className="w-full px-3 py-2 border rounded-md text-sm"
              />
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
            onClick={handleSubmit}
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
