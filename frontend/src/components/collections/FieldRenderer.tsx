import { useState } from 'react';
import { Sparkles, Loader2 } from 'lucide-react';
import type { FieldDef } from '@/types/cms';
import MediaPicker from '@/components/media/MediaPicker';
import RelationPicker from '@/components/collections/RelationPicker';
import RichTextField from '@/components/RichTextField';
import api from '@/lib/api';

interface Props {
  field: FieldDef;
  value: unknown;
  onChange: (value: unknown) => void;
  error?: string;
  collectionKey?: string;
  itemData?: Record<string, unknown>;
}

export default function FieldRenderer({ field, value, onChange, error, collectionKey, itemData }: Props) {
  const config = field.config ?? {};
  const renderKind = field.render ?? 'input';
  const strVal = String(value ?? '');
  const borderClass = error ? 'border-[var(--danger)]' : 'border-[var(--border)]';
  const errorEl = error ? <span className="text-xs text-[var(--danger)]">{error}</span> : null;

  const [aiLoading, setAiLoading] = useState(false);
  const hasAi = !!(config.ai as Record<string, unknown> | undefined);

  const handleAiGenerate = async () => {
    if (!collectionKey || !itemData) return;
    setAiLoading(true);
    try {
      const res = await api.post('/api/ai/generate-field', {
        collection_key: collectionKey,
        field_name: field.name,
        item_data: itemData,
      });
      onChange(res.data.content);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail || 'KI-Fehler';
      alert(msg);
    } finally {
      setAiLoading(false);
    }
  };

  const labelEl = (
    <label className="flex items-center gap-1.5 text-xs font-medium mb-1">
      {field.label} {field.required && <span className="text-[var(--danger)]">*</span>}
      {hasAi && collectionKey && (
        <button
          type="button"
          onClick={handleAiGenerate}
          disabled={aiLoading}
          className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] bg-purple-50 text-purple-600 rounded hover:bg-purple-100 transition-colors disabled:opacity-50"
          title="Mit KI generieren"
        >
          {aiLoading ? <Loader2 size={10} className="animate-spin" /> : <Sparkles size={10} />}
          KI
        </button>
      )}
    </label>
  );

  switch (renderKind) {
    case 'input': {
      const inputType = (config.inputType as string) ?? 'text';
      const isNumber = inputType === 'number';
      return (
        <div>
          {labelEl}
          <input
            type={inputType}
            value={isNumber ? (value !== undefined && value !== '' ? Number(value) : '') : strVal}
            onChange={(e) => onChange(isNumber && e.target.value ? Number(e.target.value) : e.target.value || (isNumber ? '' : e.target.value))}
            pattern={config.pattern as string | undefined}
            placeholder={config.placeholder as string | undefined}
            step={config.step as string | undefined}
            className={`w-full px-3 py-2 text-sm border rounded-md ${borderClass}`}
          />
          {errorEl}
        </div>
      );
    }

    case 'textarea': {
      // Use TipTap WYSIWYG for richtext fields, plain textarea for others
      const isRichtext = field.type === 'richtext';
      if (isRichtext) {
        return (
          <div>
            {labelEl}
            <RichTextField
              value={strVal}
              onChange={(html) => onChange(html)}
              placeholder={config.placeholder as string | undefined}
            />
            {errorEl}
          </div>
        );
      }
      return (
        <div>
          {labelEl}
          <textarea
            value={strVal}
            onChange={(e) => onChange(e.target.value)}
            rows={(config.rows as number) ?? 3}
            placeholder={config.placeholder as string | undefined}
            className={`w-full px-3 py-2 text-sm border rounded-md resize-y ${config.monospace ? 'font-mono ' : ''}${borderClass}`}
          />
          {errorEl}
        </div>
      );
    }

    case 'select':
      return (
        <div>
          {labelEl}
          <select
            value={strVal}
            onChange={(e) => onChange(e.target.value)}
            className={`w-full px-3 py-2 text-sm border rounded-md ${borderClass}`}
          >
            <option value="">-- Bitte waehlen --</option>
            {field.options?.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
          {errorEl}
        </div>
      );

    case 'checkbox':
      return (
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={!!value}
            onChange={(e) => onChange(e.target.checked)}
            className="rounded"
          />
          <label className="text-xs font-medium">{field.label}</label>
        </div>
      );

    case 'color':
      return (
        <div>
          {labelEl}
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={strVal || '#000000'}
              onChange={(e) => onChange(e.target.value)}
              className="w-10 h-8 border border-[var(--border)] rounded cursor-pointer"
            />
            <input
              type="text"
              value={strVal}
              onChange={(e) => onChange(e.target.value)}
              placeholder="#000000"
              className={`flex-1 px-3 py-2 text-sm border rounded-md font-mono ${borderClass}`}
            />
          </div>
          {errorEl}
        </div>
      );

    case 'media-picker':
      return (
        <div>
          {labelEl}
          <MediaPicker
            value={value as string | number | null}
            onChange={(mediaId) => onChange(mediaId)}
          />
          {errorEl}
        </div>
      );

    case 'relation':
      return (
        <div>
          {labelEl}
          <RelationPicker
            value={value as number | number[] | null}
            collection={(config.collection as string) ?? ''}
            displayField={(config.display_field as string) ?? 'title'}
            multiple={!!config.multiple}
            onChange={(val) => onChange(val)}
          />
          {errorEl}
        </div>
      );

    case 'group':
      return <GroupRenderer field={field} value={value} onChange={onChange} error={error} />;

    case 'repeater':
      return <RepeaterRenderer field={field} value={value} onChange={onChange} error={error} />;

    default:
      return (
        <div>
          {labelEl}
          <input
            type="text"
            value={strVal}
            onChange={(e) => onChange(e.target.value)}
            className={`w-full px-3 py-2 text-sm border rounded-md ${borderClass}`}
          />
          {errorEl}
        </div>
      );
  }
}

/* ---- Composite Renderers ---- */

function GroupRenderer({ field, value, onChange }: Props) {
  const data = (value && typeof value === 'object' && !Array.isArray(value) ? value : {}) as Record<string, unknown>;
  const subFields = field.fields ?? [];

  if (subFields.length === 0) {
    return <div className="text-xs text-[var(--text-muted)]">{field.label}: Keine Sub-Felder definiert</div>;
  }

  return (
    <fieldset className="border border-[var(--border)] rounded-lg p-3 space-y-3">
      <legend className="text-xs font-medium px-1">{field.label}</legend>
      {subFields.map((sub) => (
        <FieldRenderer
          key={sub.name}
          field={sub}
          value={data[sub.name] ?? ''}
          onChange={(v) => onChange({ ...data, [sub.name]: v })}
        />
      ))}
    </fieldset>
  );
}

function RepeaterRenderer({ field, value, onChange }: Props) {
  const items = (Array.isArray(value) ? value : []) as Record<string, unknown>[];
  const subFields = field.fields ?? [];
  const maxItems = field.maxItems;
  const canAdd = maxItems === undefined || items.length < maxItems;

  if (subFields.length === 0) {
    return <div className="text-xs text-[var(--text-muted)]">{field.label}: Keine Sub-Felder definiert</div>;
  }

  const updateItem = (idx: number, updated: Record<string, unknown>) => {
    const next = [...items];
    next[idx] = updated;
    onChange(next);
  };

  const removeItem = (idx: number) => {
    onChange(items.filter((_, i) => i !== idx));
  };

  const addItem = () => {
    const empty: Record<string, unknown> = {};
    for (const sf of subFields) {
      empty[sf.name] = '';
    }
    onChange([...items, empty]);
  };

  const moveItem = (from: number, to: number) => {
    if (to < 0 || to >= items.length) return;
    const next = [...items];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    onChange(next);
  };

  return (
    <div className="border border-[var(--border)] rounded-lg p-3 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium">{field.label} ({items.length}{maxItems !== undefined ? `/${maxItems}` : ''})</span>
        {canAdd && (
          <button
            type="button"
            onClick={addItem}
            className="text-xs text-[var(--primary)] hover:underline"
          >
            + Eintrag
          </button>
        )}
      </div>
      {items.map((item, idx) => (
        <div key={idx} className="bg-gray-50 border border-[var(--border)] rounded-md p-3 space-y-2">
          <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
            <span>#{idx + 1}</span>
            <div className="flex items-center gap-2">
              <button type="button" disabled={idx === 0} onClick={() => moveItem(idx, idx - 1)} className="hover:text-[var(--text)] disabled:opacity-30">&uarr;</button>
              <button type="button" disabled={idx === items.length - 1} onClick={() => moveItem(idx, idx + 1)} className="hover:text-[var(--text)] disabled:opacity-30">&darr;</button>
              <button type="button" onClick={() => removeItem(idx)} className="text-red-400 hover:text-red-600">&times;</button>
            </div>
          </div>
          {subFields.map((sub) => (
            <FieldRenderer
              key={sub.name}
              field={sub}
              value={item[sub.name] ?? ''}
              onChange={(v) => updateItem(idx, { ...item, [sub.name]: v })}
            />
          ))}
        </div>
      ))}
      {items.length === 0 && (
        <div className="text-xs text-[var(--text-muted)] text-center py-3">Keine Eintraege</div>
      )}
    </div>
  );
}
