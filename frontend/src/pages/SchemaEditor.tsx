import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Save, Trash2 } from 'lucide-react';
import api from '@/lib/api';
import { useFieldTypePresets } from '@/hooks/useFieldTypePresets';
import type { CollectionSchema, FieldDef } from '@/types/cms';
import FieldsEditor from '@/components/collections/FieldsEditor';

const ICON_OPTIONS = ['Globe', 'Tag', 'Users', 'Image', 'Database', 'MapPin', 'Star', 'Mail', 'Shield', 'Heart', 'Bookmark', 'Flag'];

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

export default function SchemaEditor() {
  const { key } = useParams<{ key: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation(['common', 'content']);
  const isNew = !key;
  const { presets } = useFieldTypePresets();

  const { data: existingSchema } = useQuery<CollectionSchema>({
    queryKey: ['collectionSchema', key],
    queryFn: async () => (await api.get(`/api/collections/${key}/schema`)).data,
    enabled: !!key,
  });

  const [collectionKey, setCollectionKey] = useState('');
  const [label, setLabel] = useState('');
  const [labelSingular, setLabelSingular] = useState('');
  const [icon, setIcon] = useState('Database');
  const [fields, setFields] = useState<FieldDef[]>([]);
  const [titleField, setTitleField] = useState('title');
  const [slugField, setSlugField] = useState('');
  const [sortField, setSortField] = useState('sort_order');
  const [autoSlug, setAutoSlug] = useState(true);

  useEffect(() => {
    if (existingSchema) {
      setCollectionKey(existingSchema.collection_key);
      setLabel(existingSchema.label);
      setLabelSingular(existingSchema.label_singular);
      setIcon(existingSchema.icon);
      setFields(existingSchema.fields.length > 0 ? existingSchema.fields : []);
      setTitleField(existingSchema.title_field);
      setSlugField(existingSchema.slug_field ?? '');
      setSortField(existingSchema.sort_field);
      setAutoSlug(false);
    }
  }, [existingSchema]);

  useEffect(() => {
    if (isNew && autoSlug && label) {
      setCollectionKey(slugify(label));
    }
  }, [label, isNew, autoSlug]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        label,
        label_singular: labelSingular,
        icon,
        fields,
        title_field: titleField,
        slug_field: slugField || null,
        sort_field: sortField,
      };
      if (isNew) {
        return api.post('/api/collections', { ...payload, collection_key: collectionKey });
      }
      return api.put(`/api/collections/${key}`, payload);
    },
    onSuccess: () => {
      navigate(isNew ? '/collections' : `/collections/${key}`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => api.delete(`/api/collections/${key}`),
    onSuccess: () => navigate('/collections'),
  });

  const fieldNames = fields.map((f) => f.name).filter(Boolean);

  return (
    <div className="p-6 max-w-3xl">
      <h1 className="text-lg font-semibold mb-6">
        {isNew ? t('content:new_schema') : t('content:schema_for', { label: existingSchema?.label ?? key })}
      </h1>

      {saveMutation.isError && (
        <div className="mb-4 p-3 text-sm bg-red-50 text-red-700 border border-red-200 rounded-md">
          {(saveMutation.error as Error)?.message ?? t('content:save_error')}
        </div>
      )}

      <div className="space-y-4">
        {/* Grundeinstellungen */}
        <div className="bg-white border border-[var(--border)] rounded-lg p-4 space-y-3">
          <h2 className="text-sm font-medium mb-2">{t('content:basic_settings')}</h2>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-[var(--text-muted)] mb-1">{t('content:label_plural')}</label>
              <input type="text" value={label} onChange={(e) => setLabel(e.target.value)} placeholder={t('content:label_plural_placeholder')} className="w-full px-3 py-1.5 text-sm border border-[var(--border)] rounded-md" />
            </div>
            <div>
              <label className="block text-xs text-[var(--text-muted)] mb-1">{t('content:label_singular')}</label>
              <input type="text" value={labelSingular} onChange={(e) => setLabelSingular(e.target.value)} placeholder={t('content:label_singular_placeholder')} className="w-full px-3 py-1.5 text-sm border border-[var(--border)] rounded-md" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-[var(--text-muted)] mb-1">{t('content:collection_key')}</label>
              <input type="text" value={collectionKey} onChange={(e) => { setAutoSlug(false); setCollectionKey(e.target.value); }} disabled={!isNew} placeholder={t('content:collection_key_placeholder')} className="w-full px-3 py-1.5 text-sm border border-[var(--border)] rounded-md disabled:bg-gray-100 disabled:text-[var(--text-muted)]" />
            </div>
            <div>
              <label className="block text-xs text-[var(--text-muted)] mb-1">{t('content:icon')}</label>
              <select value={icon} onChange={(e) => setIcon(e.target.value)} className="w-full px-3 py-1.5 text-sm border border-[var(--border)] rounded-md">
                {ICON_OPTIONS.map((i) => <option key={i} value={i}>{i}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs text-[var(--text-muted)] mb-1">{t('content:title_field')}</label>
              <select value={titleField} onChange={(e) => setTitleField(e.target.value)} className="w-full px-3 py-1.5 text-sm border border-[var(--border)] rounded-md">
                <option value="title">title ({t('content:default')})</option>
                {fieldNames.map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-[var(--text-muted)] mb-1">{t('content:slug_field')}</label>
              <select value={slugField} onChange={(e) => setSlugField(e.target.value)} className="w-full px-3 py-1.5 text-sm border border-[var(--border)] rounded-md">
                <option value="">{t('content:none')}</option>
                {fieldNames.map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-[var(--text-muted)] mb-1">{t('content:sort_field')}</label>
              <select value={sortField} onChange={(e) => setSortField(e.target.value)} className="w-full px-3 py-1.5 text-sm border border-[var(--border)] rounded-md">
                <option value="sort_order">sort_order ({t('content:default')})</option>
                {fieldNames.map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Felder-Editor (extrahierte Komponente) */}
        <FieldsEditor fields={fields} presets={presets} onChange={setFields} />

        {/* Aktionen */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending || !collectionKey || !label || !labelSingular}
            className="flex items-center gap-1.5 px-4 py-2 text-sm bg-[var(--primary)] text-white rounded-md hover:opacity-90 disabled:opacity-50"
          >
            <Save size={14} /> {saveMutation.isPending ? t('common:saving') : t('common:save')}
          </button>
          {!isNew && (
            <button
              onClick={() => { if (confirm(t('content:confirm_delete_collection'))) deleteMutation.mutate(); }}
              disabled={deleteMutation.isPending}
              className="flex items-center gap-1.5 px-4 py-2 text-sm text-red-600 border border-red-200 rounded-md hover:bg-red-50"
            >
              <Trash2 size={14} /> {t('common:delete')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
