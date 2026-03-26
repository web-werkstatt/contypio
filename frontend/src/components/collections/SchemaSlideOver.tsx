import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { X, Plus, Pencil, Trash2, Check, ChevronDown } from 'lucide-react';
import api from '@/lib/api';
import { useFieldTypePresets } from '@/hooks/useFieldTypePresets';
import type { CollectionSchema, FieldDef } from '@/types/cms';
import RelationConfigEditor from './RelationConfigEditor';

interface SchemaSlideOverProps {
  open: boolean;
  onClose: () => void;
  collectionKey: string;
  onSaved?: () => void;
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function SchemaSlideOver({ open, onClose, collectionKey, onSaved }: SchemaSlideOverProps) {
  const queryClient = useQueryClient();
  const { presets } = useFieldTypePresets();
  const [fields, setFields] = useState<FieldDef[]>([]);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [addType, setAddType] = useState('text');

  const { data: schema } = useQuery<CollectionSchema>({
    queryKey: ['collectionSchema', collectionKey],
    queryFn: async () => (await api.get(`/api/collections/${collectionKey}/schema`)).data,
    enabled: open,
  });

  useEffect(() => {
    if (schema) {
      setFields(schema.fields);
      setHasChanges(false);
      setSelectedIdx(null);
    }
  }, [schema]);

  const saveMutation = useMutation({
    mutationFn: () => api.put(`/api/collections/${collectionKey}`, { fields }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collectionSchema', collectionKey] });
      queryClient.invalidateQueries({ queryKey: ['collections'] });
      onSaved?.();
      onClose();
    },
  });

  const updateFields = useCallback((next: FieldDef[]) => {
    setFields(next);
    setHasChanges(true);
  }, []);

  const getPreset = (typeKey: string) => presets.find((p) => p.type_key === typeKey);

  const addField = () => {
    const preset = getPreset(addType);
    const count = fields.filter((f) => f.type === addType).length + 1;
    const newField: FieldDef = {
      name: `${addType}_${count}`,
      label: `${preset?.label ?? addType} ${count}`,
      required: false,
      type: addType,
      render: preset?.render ?? 'input',
      config: preset?.config ?? { inputType: 'text' },
      list_visible: preset?.list_visible ?? true,
    };
    const next = [...fields, newField];
    updateFields(next);
    setSelectedIdx(next.length - 1);
  };

  const removeField = (idx: number) => {
    const field = fields[idx];
    const isEmpty = !field.label && !field.name;
    if (!isEmpty && !confirm(`Feld "${field.label || field.name}" wirklich löschen?`)) return;
    updateFields(fields.filter((_, i) => i !== idx));
    if (selectedIdx === idx) setSelectedIdx(null);
    else if (selectedIdx !== null && selectedIdx > idx) setSelectedIdx(selectedIdx - 1);
  };

  const updateField = (idx: number, updates: Partial<FieldDef>) => {
    updateFields(fields.map((f, i) => (i === idx ? { ...f, ...updates } : f)));
  };

  const handleTypeChange = (idx: number, typeKey: string) => {
    const preset = getPreset(typeKey);
    if (preset) {
      updateField(idx, {
        type: typeKey,
        render: preset.render,
        config: { ...preset.config },
        list_visible: preset.list_visible,
      });
    } else {
      updateField(idx, { type: typeKey });
    }
  };

  const moveField = (from: number, to: number) => {
    if (to < 0 || to >= fields.length) return;
    const next = [...fields];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    updateFields(next);
    if (selectedIdx === from) setSelectedIdx(to);
  };

  const handleClose = () => {
    if (hasChanges && !confirm('Ungespeicherte Änderungen verwerfen?')) return;
    onClose();
  };

  // Close on ESC
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') handleClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/20 transition-opacity"
        onClick={handleClose}
      />

      {/* Panel */}
      <div
        className="fixed top-0 right-0 bottom-0 z-50 w-[420px] bg-white border-l border-[var(--border)] shadow-2xl flex flex-col animate-slide-in-right"
        style={{ animation: 'slideInRight 280ms ease' }}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 px-5 py-4 border-b border-[var(--border)] bg-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold">Felder verwalten</h2>
              <span className="text-xs text-[var(--text-muted)] font-mono">{collectionKey}</span>
            </div>
            <button onClick={handleClose} className="p-1 text-[var(--text-muted)] hover:text-[var(--text)] rounded">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {/* Field List */}
          <div className="space-y-1 mb-4">
            {fields.map((field, idx) => (
              <FieldRow
                key={idx}
                field={field}
                isSelected={selectedIdx === idx}
                onSelect={() => setSelectedIdx(selectedIdx === idx ? null : idx)}
                onRemove={() => removeField(idx)}
                onMoveUp={() => moveField(idx, idx - 1)}
                onMoveDown={() => moveField(idx, idx + 1)}
                isFirst={idx === 0}
                isLast={idx === fields.length - 1}
              />
            ))}
            {fields.length === 0 && (
              <p className="text-sm text-[var(--text-muted)] text-center py-6">
                Noch keine Felder definiert
              </p>
            )}
          </div>

          {/* Add Field */}
          <div className="flex gap-2 mb-6">
            <div className="relative flex-1">
              <select
                value={addType}
                onChange={(e) => setAddType(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-[var(--border)] rounded-lg appearance-none pr-8 bg-white"
              >
                {presets.map((p) => (
                  <option key={p.type_key} value={p.type_key}>{p.label}</option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none" />
            </div>
            <button
              onClick={addField}
              className="flex items-center gap-1.5 px-3 py-2 text-sm bg-[var(--primary)] text-white rounded-lg hover:opacity-90"
            >
              <Plus size={14} /> Feld
            </button>
          </div>

          {/* Detail Panel */}
          {selectedIdx !== null && fields[selectedIdx] && (
            <FieldDetailPanel
              field={fields[selectedIdx]}
              presets={presets}
              onChange={(updates) => updateField(selectedIdx, updates)}
              onTypeChange={(type) => handleTypeChange(selectedIdx, type)}
            />
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 z-10 px-5 py-3 border-t border-[var(--border)] bg-white flex items-center justify-between">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-sm border border-[var(--border)] rounded-lg hover:bg-gray-50"
          >
            Abbrechen
          </button>
          <button
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending || !hasChanges}
            className="flex items-center gap-1.5 px-4 py-2 text-sm bg-[var(--primary)] text-white rounded-lg hover:opacity-90 disabled:opacity-50"
          >
            {saveMutation.isPending ? 'Speichern...' : (
              <><Check size={14} /> Schema speichern</>
            )}
          </button>
        </div>
      </div>

      {/* CSS Animation */}
      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
      `}</style>
    </>
  );
}

// ---------------------------------------------------------------------------
// FieldRow
// ---------------------------------------------------------------------------

function FieldRow({ field, isSelected, onSelect, onRemove, onMoveUp, onMoveDown, isFirst, isLast }: {
  field: FieldDef;
  isSelected: boolean;
  onSelect: () => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  isFirst: boolean;
  isLast: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors cursor-pointer ${
        isSelected
          ? 'border-[var(--primary)] bg-[var(--primary-light)]'
          : 'border-[var(--border)] bg-gray-50/50 hover:bg-gray-50'
      }`}
      onClick={onSelect}
    >
      <div className="flex flex-col gap-0.5">
        <button
          onClick={(e) => { e.stopPropagation(); onMoveUp(); }}
          disabled={isFirst}
          className="text-[var(--text-muted)] hover:text-[var(--text)] disabled:opacity-20 p-0 leading-none text-[10px]"
        >▲</button>
        <button
          onClick={(e) => { e.stopPropagation(); onMoveDown(); }}
          disabled={isLast}
          className="text-[var(--text-muted)] hover:text-[var(--text)] disabled:opacity-20 p-0 leading-none text-[10px]"
        >▼</button>
      </div>
      <span className="flex-1 text-sm truncate">{field.label || field.name || '(kein Name)'}</span>
      <span className="px-1.5 py-0.5 text-[10px] font-mono bg-gray-200 text-gray-600 rounded">
        {field.type ?? 'text'}
      </span>
      {field.required && (
        <span className="px-1.5 py-0.5 text-[10px] bg-red-100 text-red-600 rounded">Pflicht</span>
      )}
      <button
        onClick={(e) => { e.stopPropagation(); onSelect(); }}
        className="p-0.5 text-[var(--text-muted)] hover:text-[var(--primary)]"
      >
        <Pencil size={12} />
      </button>
      <button
        onClick={(e) => { e.stopPropagation(); onRemove(); }}
        className="p-0.5 text-[var(--text-muted)] hover:text-red-600"
      >
        <Trash2 size={12} />
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// FieldDetailPanel
// ---------------------------------------------------------------------------

function FieldDetailPanel({ field, presets, onChange, onTypeChange }: {
  field: FieldDef;
  presets: { type_key: string; label: string; has_options?: boolean; has_sub_fields?: boolean }[];
  onChange: (updates: Partial<FieldDef>) => void;
  onTypeChange: (type: string) => void;
}) {
  const preset = presets.find((p) => p.type_key === field.type);
  const hasOptions = preset?.has_options ?? false;
  const isRelation = field.type === 'relation' || field.render === 'relation';
  const isNumberLike = field.type === 'number' || field.type === 'range';

  const autoKey = (label: string) => {
    return label.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
  };

  return (
    <div className="border border-[var(--primary)]/30 rounded-xl bg-white p-4 space-y-3">
      <h3 className="text-xs font-semibold uppercase text-[var(--text-muted)] tracking-wider">Feld-Details</h3>

      {/* Label */}
      <div>
        <label className="block text-xs text-[var(--text-muted)] mb-1">Label</label>
        <input
          type="text"
          value={field.label}
          onChange={(e) => {
            const label = e.target.value;
            const updates: Partial<FieldDef> = { label };
            // Auto-generate key from label if key matches auto-pattern
            if (!field.name || field.name === autoKey(field.label)) {
              updates.name = autoKey(label);
            }
            onChange(updates);
          }}
          className="w-full px-3 py-2 text-sm border border-[var(--border)] rounded-lg"
          placeholder="z.B. Telefonnummer"
        />
      </div>

      {/* Key */}
      <div>
        <label className="block text-xs text-[var(--text-muted)] mb-1">Key (API)</label>
        <input
          type="text"
          value={field.name}
          onChange={(e) => onChange({ name: e.target.value.replace(/[^a-z0-9_]/g, '') })}
          className="w-full px-3 py-2 text-sm border border-[var(--border)] rounded-lg font-mono"
          placeholder="telefonnummer"
        />
      </div>

      {/* Type */}
      <div>
        <label className="block text-xs text-[var(--text-muted)] mb-1">Feldtyp</label>
        <select
          value={field.type ?? 'text'}
          onChange={(e) => onTypeChange(e.target.value)}
          className="w-full px-3 py-2 text-sm border border-[var(--border)] rounded-lg"
        >
          {presets.map((p) => <option key={p.type_key} value={p.type_key}>{p.label}</option>)}
        </select>
      </div>

      {/* Required */}
      <label className="flex items-center gap-2 text-sm cursor-pointer">
        <input
          type="checkbox"
          checked={field.required ?? false}
          onChange={(e) => onChange({ required: e.target.checked })}
          className="rounded border-gray-300"
        />
        Pflichtfeld
      </label>

      {/* Type-specific: Options (select, radio, checkbox) */}
      {hasOptions && (
        <div>
          <label className="block text-xs text-[var(--text-muted)] mb-1">Optionen (eine pro Zeile)</label>
          <textarea
            value={(field.options ?? []).join('\n')}
            onChange={(e) => onChange({ options: e.target.value.split('\n').filter(Boolean) })}
            rows={4}
            className="w-full px-3 py-2 text-sm border border-[var(--border)] rounded-lg font-mono"
            placeholder="Option A&#10;Option B&#10;Option C"
          />
        </div>
      )}

      {/* Type-specific: Relation */}
      {isRelation && (
        <RelationConfigEditor
          config={field.config ?? {}}
          onChange={(config) => onChange({ config })}
        />
      )}

      {/* Type-specific: Number/Range min/max */}
      {isNumberLike && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-[var(--text-muted)] mb-1">Min-Wert</label>
            <input
              type="number"
              value={String(field.config?.min ?? '')}
              onChange={(e) => onChange({ config: { ...field.config, min: e.target.value ? Number(e.target.value) : undefined } })}
              className="w-full px-3 py-2 text-sm border border-[var(--border)] rounded-lg"
            />
          </div>
          <div>
            <label className="block text-xs text-[var(--text-muted)] mb-1">Max-Wert</label>
            <input
              type="number"
              value={String(field.config?.max ?? '')}
              onChange={(e) => onChange({ config: { ...field.config, max: e.target.value ? Number(e.target.value) : undefined } })}
              className="w-full px-3 py-2 text-sm border border-[var(--border)] rounded-lg"
            />
          </div>
        </div>
      )}

      {/* Validations */}
      <ValidationsEditor
        validations={field.validations ?? []}
        onChange={(validations) => onChange({ validations })}
        fieldType={field.type ?? 'text'}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// ValidationsEditor
// ---------------------------------------------------------------------------

interface Validation {
  rule: string;
  value: string;
}

const VALIDATION_RULES: Record<string, { label: string; types: string[] }> = {
  minLength: { label: 'Min. Länge', types: ['text', 'textarea', 'richtext', 'markdown'] },
  maxLength: { label: 'Max. Länge', types: ['text', 'textarea', 'richtext', 'markdown'] },
  min: { label: 'Min. Wert', types: ['number', 'range'] },
  max: { label: 'Max. Wert', types: ['number', 'range'] },
  pattern: { label: 'Pattern (Regex)', types: ['text', 'url'] },
  custom: { label: 'Custom Fehler', types: ['text', 'textarea', 'richtext', 'number', 'url', 'email', 'phone', 'select', 'date', 'datetime', 'markdown', 'range', 'color', 'boolean', 'media', 'media-picker', 'relation', 'group', 'repeater', 'toggle', 'tags', 'radio', 'checkbox'] },
};

function ValidationsEditor({ validations, onChange, fieldType }: {
  validations: Validation[];
  onChange: (v: Validation[]) => void;
  fieldType: string;
}) {
  const applicableRules = Object.entries(VALIDATION_RULES)
    .filter(([, v]) => v.types.includes(fieldType))
    .map(([key, v]) => ({ key, label: v.label }));

  if (applicableRules.length === 0) return null;

  const [addRule, setAddRule] = useState(applicableRules[0]?.key ?? '');

  const addValidation = () => {
    if (!addRule) return;
    onChange([...validations, { rule: addRule, value: '' }]);
  };

  return (
    <div>
      <label className="block text-xs text-[var(--text-muted)] mb-1">Validierung</label>
      <div className="space-y-1.5 mb-2">
        {validations.map((v, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="text-xs font-mono text-[var(--text-muted)] w-24 shrink-0">
              {VALIDATION_RULES[v.rule]?.label ?? v.rule}
            </span>
            <input
              type="text"
              value={v.value}
              onChange={(e) => {
                const next = [...validations];
                next[i] = { ...v, value: e.target.value };
                onChange(next);
              }}
              className="flex-1 px-2 py-1 text-xs border border-[var(--border)] rounded"
              placeholder="Wert"
            />
            <button
              onClick={() => onChange(validations.filter((_, j) => j !== i))}
              className="p-0.5 text-[var(--text-muted)] hover:text-red-600"
            >
              <X size={12} />
            </button>
          </div>
        ))}
      </div>
      {applicableRules.length > 0 && (
        <div className="flex gap-2">
          <select
            value={addRule}
            onChange={(e) => setAddRule(e.target.value)}
            className="flex-1 px-2 py-1 text-xs border border-[var(--border)] rounded"
          >
            {applicableRules.map((r) => (
              <option key={r.key} value={r.key}>{r.label}</option>
            ))}
          </select>
          <button
            onClick={addValidation}
            className="px-2 py-1 text-xs text-[var(--primary)] border border-[var(--primary)]/30 rounded hover:bg-[var(--primary-light)]"
          >
            + Regel
          </button>
        </div>
      )}
    </div>
  );
}
