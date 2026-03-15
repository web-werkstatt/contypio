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
}

export default function DynamicForm({ schema, item, collectionKey, onSaved, onCancel }: Props) {
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

  const mutation = useMutation({
    mutationFn: async (statusOverride: 'draft' | 'published' | undefined) => {
      const payload = {
        title,
        slug: slug || undefined,
        data,
        status: statusOverride ?? (isEdit ? item!.status : 'published'),
      };
      if (isEdit) {
        return api.put(`/api/collections/${collectionKey}/items/${item!.id}`, payload);
      }
      return api.post(`/api/collections/${collectionKey}/items`, payload);
    },
    onSuccess: onSaved,
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

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
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

      {schema.fields
        .filter((f) => f.name !== schema.title_field && f.name !== schema.slug_field)
        .map((field: FieldDef) => (
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
    </form>
  );
}
