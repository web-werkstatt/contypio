import { Plus, X, GripVertical } from 'lucide-react';
import type { FieldDef, FieldTypePreset } from '@/types/cms';
import RelationConfigEditor from './RelationConfigEditor';
import AiFieldConfig from './AiFieldConfig';

interface Props {
  fields: FieldDef[];
  presets: FieldTypePreset[];
  onChange(fields: FieldDef[]): void;
}

function emptyField(presets: FieldTypePreset[]): FieldDef {
  const defaultPreset = presets.find((p) => p.type_key === 'text');
  return {
    name: '',
    label: '',
    required: false,
    type: 'text',
    render: defaultPreset?.render ?? 'input',
    config: defaultPreset?.config ?? { inputType: 'text' },
    list_visible: defaultPreset?.list_visible ?? true,
  };
}

export default function FieldsEditor({ fields, presets, onChange }: Props) {
  const getPreset = (typeKey: string) => presets.find((p) => p.type_key === typeKey);

  const addField = () => onChange([...fields, emptyField(presets)]);

  const removeField = (index: number) => onChange(fields.filter((_, i) => i !== index));

  const updateField = (index: number, updates: Partial<FieldDef>) => {
    onChange(fields.map((f, i) => (i === index ? { ...f, ...updates } : f)));
  };

  const handleTypeChange = (index: number, typeKey: string) => {
    const preset = getPreset(typeKey);
    if (preset) {
      updateField(index, {
        type: typeKey,
        render: preset.render,
        config: { ...preset.config },
        list_visible: preset.list_visible,
      });
    } else {
      updateField(index, { type: typeKey });
    }
  };

  const moveField = (from: number, to: number) => {
    if (to < 0 || to >= fields.length) return;
    const updated = [...fields];
    const [moved] = updated.splice(from, 1);
    updated.splice(to, 0, moved);
    onChange(updated);
  };

  return (
    <div className="bg-white border border-[var(--border)] rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-medium">Felder ({fields.length})</h2>
        <button onClick={addField} className="flex items-center gap-1 text-xs text-[var(--primary)] hover:underline">
          <Plus size={12} /> Feld hinzufügen
        </button>
      </div>

      {fields.length === 0 && (
        <p className="text-sm text-[var(--text-muted)] py-4 text-center">Noch keine Felder definiert</p>
      )}

      <div className="space-y-2">
        {fields.map((field, idx) => {
          const preset = getPreset(field.type ?? 'text');
          const hasOptions = preset?.has_options ?? false;
          const hasSubFields = preset?.has_sub_fields ?? false;

          return (
            <div key={idx}>
              <div className="flex items-start gap-2 p-3 bg-gray-50 border border-[var(--border)] rounded-md">
                <div className="flex flex-col gap-1 pt-1">
                  <button onClick={() => moveField(idx, idx - 1)} disabled={idx === 0} className="text-[var(--text-muted)] hover:text-[var(--text)] disabled:opacity-30">
                    <GripVertical size={14} />
                  </button>
                </div>
                <div className="flex-1 grid grid-cols-4 gap-2">
                  <input
                    type="text"
                    value={field.name}
                    onChange={(e) => updateField(idx, { name: e.target.value.replace(/[^a-z0-9_]/g, '') })}
                    placeholder="name"
                    className="w-full px-2 py-1 text-xs border border-[var(--border)] rounded"
                  />
                  <select
                    value={field.type ?? 'text'}
                    onChange={(e) => handleTypeChange(idx, e.target.value)}
                    className="w-full px-2 py-1 text-xs border border-[var(--border)] rounded"
                  >
                    {presets.map((p) => <option key={p.type_key} value={p.type_key}>{p.label}</option>)}
                  </select>
                  <input
                    type="text"
                    value={field.label}
                    onChange={(e) => updateField(idx, { label: e.target.value })}
                    placeholder="Label"
                    className="w-full px-2 py-1 text-xs border border-[var(--border)] rounded"
                  />
                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-1 text-xs">
                      <input
                        type="checkbox"
                        checked={field.required ?? false}
                        onChange={(e) => updateField(idx, { required: e.target.checked })}
                      />
                      Pflicht
                    </label>
                    <button onClick={() => removeField(idx)} className="text-[var(--text-muted)] hover:text-red-600 ml-auto">
                      <X size={14} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Options editor for select fields */}
              {hasOptions && (
                <OptionsEditor
                  label={field.label || field.name}
                  options={field.options ?? []}
                  onChange={(options) => updateField(idx, { options })}
                />
              )}

              {/* Relation config editor */}
              {(field.type === 'relation' || field.render === 'relation') && (
                <RelationConfigEditor
                  config={field.config ?? {}}
                  onChange={(config) => updateField(idx, { config })}
                />
              )}

              {/* AI field config for text-based fields */}
              <AiFieldConfig
                config={field.config ?? {}}
                fieldType={field.type ?? 'text'}
                availableFields={fields.filter((_, i) => i !== idx).map((f) => f.name).filter(Boolean)}
                onChange={(config) => updateField(idx, { config })}
              />

              {/* Sub-Field editor for group/repeater */}
              {hasSubFields && (
                <SubFieldsEditor
                  field={field}
                  presets={presets}
                  onUpdate={(updates) => updateField(idx, updates)}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function OptionsEditor({ label, options, onChange }: { label: string; options: string[]; onChange(opts: string[]): void }) {
  return (
    <div className="ml-8 mt-1 p-2 bg-blue-50 border border-blue-200 rounded text-xs">
      <div className="font-medium mb-1">Optionen für "{label}":</div>
      <div className="flex flex-wrap gap-1 mb-1">
        {options.map((opt, oi) => (
          <span key={oi} className="inline-flex items-center gap-1 px-2 py-0.5 bg-white border rounded">
            {opt}
            <button onClick={() => onChange(options.filter((_, i) => i !== oi))} className="text-red-400 hover:text-red-600">
              <X size={10} />
            </button>
          </span>
        ))}
      </div>
      <input
        type="text"
        placeholder="Option eingeben + Enter"
        className="px-2 py-1 border rounded w-48"
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            const val = e.currentTarget.value.trim();
            if (val) {
              onChange([...options, val]);
              e.currentTarget.value = '';
            }
          }
        }}
      />
    </div>
  );
}

function SubFieldsEditor({ field, presets, onUpdate }: {
  field: FieldDef;
  presets: FieldTypePreset[];
  onUpdate(updates: Partial<FieldDef>): void;
}) {
  const subFields = field.fields ?? [];
  const getPreset = (typeKey: string) => presets.find((p) => p.type_key === typeKey);

  return (
    <div className="ml-8 mt-1 p-2 bg-purple-50 border border-purple-200 rounded text-xs space-y-2">
      <div className="flex items-center justify-between">
        <span className="font-medium">Sub-Felder für "{field.label || field.name}"</span>
        <button
          onClick={() => onUpdate({ fields: [...subFields, { name: '', label: '', type: 'text', render: 'input', config: { inputType: 'text' }, list_visible: true, required: false }] })}
          className="text-[var(--primary)] hover:underline"
        >
          <Plus size={10} className="inline" /> Sub-Feld
        </button>
      </div>
      {field.type === 'repeater' && (
        <div className="flex gap-2">
          <label className="flex items-center gap-1">
            Min: <input type="number" min={0} value={field.minItems ?? ''} onChange={(e) => onUpdate({ minItems: e.target.value ? Number(e.target.value) : undefined })} className="w-14 px-1 py-0.5 border rounded" />
          </label>
          <label className="flex items-center gap-1">
            Max: <input type="number" min={0} value={field.maxItems ?? ''} onChange={(e) => onUpdate({ maxItems: e.target.value ? Number(e.target.value) : undefined })} className="w-14 px-1 py-0.5 border rounded" />
          </label>
        </div>
      )}
      {subFields.map((sf, si) => (
        <div key={si} className="flex items-center gap-1 bg-white p-1.5 rounded border">
          <input
            type="text"
            value={sf.name}
            onChange={(e) => {
              const next = [...subFields];
              next[si] = { ...sf, name: e.target.value.replace(/[^a-z0-9_]/g, '') };
              onUpdate({ fields: next });
            }}
            placeholder="name"
            className="w-24 px-1 py-0.5 border rounded"
          />
          <select
            value={sf.type ?? 'text'}
            onChange={(e) => {
              const next = [...subFields];
              const subPreset = getPreset(e.target.value);
              next[si] = {
                ...sf,
                type: e.target.value,
                render: subPreset?.render ?? 'input',
                config: subPreset?.config ?? {},
                list_visible: subPreset?.list_visible ?? true,
              };
              onUpdate({ fields: next });
            }}
            className="px-1 py-0.5 border rounded"
          >
            {presets.filter((p) => !p.has_sub_fields).map((p) => (
              <option key={p.type_key} value={p.type_key}>{p.label}</option>
            ))}
          </select>
          <input
            type="text"
            value={sf.label}
            onChange={(e) => {
              const next = [...subFields];
              next[si] = { ...sf, label: e.target.value };
              onUpdate({ fields: next });
            }}
            placeholder="Label"
            className="flex-1 px-1 py-0.5 border rounded"
          />
          <button onClick={() => onUpdate({ fields: subFields.filter((_, i) => i !== si) })} className="text-red-400 hover:text-red-600">
            <X size={10} />
          </button>
        </div>
      ))}
      {subFields.length === 0 && <div className="text-[var(--text-muted)] text-center py-1">Keine Sub-Felder</div>}
    </div>
  );
}

