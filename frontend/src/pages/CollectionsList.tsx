import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Database, Plus, ArrowRight, Upload } from 'lucide-react';
import api from '@/lib/api';

export default function CollectionsList() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { t } = useTranslation(['common', 'content']);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ status: string; collection_key: string } | null>(null);
  const [importError, setImportError] = useState<string | null>(null);

  const handleSchemaImport = async (file: File) => {
    setImporting(true);
    setImportError(null);
    setImportResult(null);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await api.post('/api/collections/schema/import?conflict=fail', formData);
      setImportResult(res.data);
      queryClient.invalidateQueries({ queryKey: ['collections'] });
      queryClient.invalidateQueries({ queryKey: ['collectionSchemas'] });
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail || t('content:import_failed');
      setImportError(msg);
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="p-6 max-w-lg mx-auto mt-12">
      <input
        ref={fileInputRef}
        type="file"
        accept=".yaml,.yml,.json"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleSchemaImport(file);
        }}
      />

      {importResult && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
          {t('content:schema_imported', { key: importResult.collection_key, action: importResult.status === 'created' ? t('content:imported') : t('content:updated') })}
          <button
            onClick={() => navigate(`/collections/${importResult.collection_key}`)}
            className="ml-2 underline hover:no-underline"
          >
            {t('common:open')}
          </button>
        </div>
      )}
      {importError && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {importError}
        </div>
      )}

      <div className="bg-white rounded-xl border border-[var(--border)] p-8 text-center shadow-sm">
        <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-[var(--primary-light)] flex items-center justify-center">
          <Database size={24} className="text-[var(--primary)]" />
        </div>
        <h2 className="text-base font-semibold mb-2">{t('content:setup_collections')}</h2>
        <p className="text-sm text-[var(--text-muted)] mb-6 max-w-xs mx-auto">
          {t('content:collections_desc')}
        </p>
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => navigate('/collections/new')}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-[var(--primary)] rounded-lg hover:opacity-90 transition-opacity"
          >
            <Plus size={15} /> {t('content:new_collection')}
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={importing}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium border border-[var(--border)] rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <Upload size={15} /> {importing ? t('common:importing') : t('content:import_schema')}
          </button>
        </div>
      </div>

      <div className="mt-6 space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">{t('content:examples')}</h3>
        {[
          { title: t('content:example_team'), desc: t('content:example_team_desc') },
          { title: t('content:example_faq'), desc: t('content:example_faq_desc') },
          { title: t('content:example_references'), desc: t('content:example_references_desc') },
        ].map((ex) => (
          <button
            key={ex.title}
            onClick={() => navigate('/collections/new')}
            className="w-full flex items-center justify-between px-4 py-3 bg-white rounded-lg border border-[var(--border)] hover:border-[var(--primary)] transition-colors text-left group"
          >
            <div>
              <span className="text-sm font-medium">{ex.title}</span>
              <span className="text-xs text-[var(--text-muted)] ml-2">{ex.desc}</span>
            </div>
            <ArrowRight size={14} className="text-[var(--text-muted)] opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>
        ))}
      </div>
    </div>
  );
}
