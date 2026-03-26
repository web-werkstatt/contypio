import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import api from '@/lib/api';
import type { CollectionSchema, CollectionItem, FieldDef } from '@/types/cms';
import FieldRenderer from './FieldRenderer';

interface Props {
  schema: CollectionSchema;
  item: CollectionItem | null;
  collectionKey: string;
  onSaved: () => void;
  onCancel: () => void;
  isSingleton?: boolean;
}

export default function DynamicForm({ schema, item, collectionKey, onSaved, onCancel, isSingleton }: Props) {
  const isEdit = !!item;

  const buildInitialData = () => {
    const d: Record<string, unknown> = {};
    for (const field of schema.fields) {
      d[field.name] = item?.data[field.name] ?? '';
    }
    return d;
  };

  const [title, setTitle] = useState(item?.title ?? '');
  const [slug, setSlug] = useState(item?.slug ?? '');
  const [data, setData] = useState<Record<string, unknown>>(buildInitialData);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [saved, setSaved] = useState(false);

  const mutation = useMutation({
    mutationFn: async (statusOverride: 'draft' | 'published' | undefined) => {
      const payload = {
        title,
        slug: slug || undefined,
        data,
        status: statusOverride ?? (isEdit ? item!.status : 'published'),
      };
      if (isSingleton) {
        return api.put(`/api/collections/${collectionKey}/item`, payload);
      }
      if (isEdit) {
        return api.put(`/api/collections/${collectionKey}/items/${item!.id}`, payload);
      }
      return api.post(`/api/collections/${collectionKey}/items`, payload);
    },
    onSuccess: () => {
      onSaved();
      if (isSingleton) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
      }
    },
  });

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!title.trim()) errs.title = 'Pflichtfeld';
    for (const field of schema.fields) {
      if (field.required && !data[field.name]) {
        errs[field.name] = 'Pflichtfeld';
      }
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent, statusOverride?: 'draft' | 'published') => {
    e.preventDefault();
    if (validate()) mutation.mutate(statusOverride ?? undefined);
  };

  const handleFieldChange = (name: string, value: unknown) => {
    setData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => { const n = { ...prev }; delete n[name]; return n; });
  };

  const autoSlug = (val: string) => {
    setTitle(val);
    if (!isEdit && schema.slug_field) {
      setSlug(val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''));
    }
  };

  // Singleton: show all fields directly, no title/slug inputs
  const fieldsToRender = isSingleton
    ? schema.fields
    : schema.fields.filter((f) => f.name !== schema.title_field && f.name !== schema.slug_field);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {!isSingleton && (
        <>
          <div>
            <label className="block text-xs font-medium mb-1">
              Titel <span className="text-[var(--danger)]">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => autoSlug(e.target.value)}
              className={`w-full px-3 py-2 text-sm border rounded-md ${errors.title ? 'border-[var(--danger)]' : 'border-[var(--border)]'}`}
            />
            {errors.title && <span className="text-xs text-[var(--danger)]">{errors.title}</span>}
          </div>

          {schema.slug_field && (
            <div>
              <label className="block text-xs font-medium mb-1">Slug</label>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-[var(--border)] rounded-md font-mono"
              />
            </div>
          )}
        </>
      )}

      {fieldsToRender.map((field: FieldDef) => (
        <FieldRenderer
          key={field.name}
          field={field}
          value={data[field.name]}
          onChange={(val) => handleFieldChange(field.name, val)}
          error={errors[field.name]}
          collectionKey={collectionKey}
          itemData={data}
        />
      ))}

      {mutation.isError && (
        <div className="text-xs text-[var(--danger)]">Fehler beim Speichern</div>
      )}

      {isSingleton ? (
        <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-[var(--border)] bg-white/95 backdrop-blur-sm shadow-[0_-2px_10px_rgba(0,0,0,0.06)]">
          <div className="max-w-3xl mx-auto px-6 py-3 flex items-center justify-between">
            <div className="text-sm text-[var(--text-muted)]">
              {saved && <span className="text-[var(--success)]">Gespeichert</span>}
              {mutation.isError && <span className="text-[var(--danger)]">Fehler beim Speichern</span>}
            </div>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="flex items-center gap-2 px-5 py-2 text-sm font-medium text-white bg-[var(--primary)] rounded-lg hover:bg-[var(--primary-dark)] disabled:opacity-50 transition-colors"
            >
              {mutation.isPending ? 'Speichern...' : saved ? 'Gespeichert' : 'Speichern'}
            </button>
          </div>
        </div>
      ) : (
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onCancel} className="px-3 py-1.5 text-sm border border-[var(--border)] rounded-md hover:bg-gray-50">
            Abbrechen
          </button>
          <button
            type="button"
            disabled={mutation.isPending}
            onClick={(e) => handleSubmit(e as unknown as React.FormEvent, 'draft')}
            className="px-3 py-1.5 text-sm border border-yellow-400 text-yellow-700 rounded-md hover:bg-yellow-50 disabled:opacity-50"
          >
            Als Entwurf speichern
          </button>
          <button
            type="submit"
            disabled={mutation.isPending}
            className="px-3 py-1.5 text-sm bg-[var(--primary)] text-white rounded-md hover:opacity-90 disabled:opacity-50"
          >
            {mutation.isPending ? 'Speichern...' : 'Veröffentlichen'}
          </button>
        </div>
      )}
    </form>
  );
}
