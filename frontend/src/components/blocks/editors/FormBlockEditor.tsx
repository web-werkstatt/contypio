import { nanoid } from 'nanoid';

interface FormField {
  id: string;
  label: string;
  type: string;
  required: boolean;
  placeholder: string;
}

interface Props {
  data: Record<string, unknown>;
  onChange(data: Record<string, unknown>): void;
}

const FIELD_TYPES = [
  { value: 'text', label: 'Text' },
  { value: 'email', label: 'E-Mail' },
  { value: 'tel', label: 'Telefon' },
  { value: 'number', label: 'Zahl' },
  { value: 'textarea', label: 'Textbereich' },
  { value: 'select', label: 'Auswahl' },
  { value: 'checkbox', label: 'Checkbox' },
  { value: 'date', label: 'Datum' },
];

export default function FormBlockEditor({ data, onChange }: Props) {
  const fields = (data.fields as FormField[]) || [];

  const addField = () => onChange({
    fields: [...fields, { id: nanoid(8), label: '', type: 'text', required: false, placeholder: '' }],
  });
  const removeField = (id: string) => onChange({ fields: fields.filter((f) => f.id !== id) });
  const updateField = (id: string, field: keyof FormField, val: string | boolean) =>
    onChange({ fields: fields.map((f) => (f.id === id ? { ...f, [field]: val } : f)) });

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-xs font-medium mb-1">Formulartitel</label>
        <input
          value={(data.title as string) || ''}
          onChange={(e) => onChange({ title: e.target.value })}
          className="w-full px-2.5 py-1.5 border border-[var(--border)] rounded-md text-sm"
          placeholder="Kontaktformular"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium mb-1">Empfänger E-Mail</label>
          <input
            value={(data.recipientEmail as string) || ''}
            onChange={(e) => onChange({ recipientEmail: e.target.value })}
            className="w-full px-2.5 py-1.5 border border-[var(--border)] rounded-md text-sm"
            placeholder="info@example.com"
          />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1">Betreff</label>
          <input
            value={(data.subject as string) || 'Kontaktanfrage'}
            onChange={(e) => onChange({ subject: e.target.value })}
            className="w-full px-2.5 py-1.5 border border-[var(--border)] rounded-md text-sm"
            placeholder="Kontaktanfrage"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium mb-1">Button-Text</label>
          <input
            value={(data.submitLabel as string) || 'Absenden'}
            onChange={(e) => onChange({ submitLabel: e.target.value })}
            className="w-full px-2.5 py-1.5 border border-[var(--border)] rounded-md text-sm"
            placeholder="Absenden"
          />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1">Erfolgsmeldung</label>
          <input
            value={(data.successMessage as string) || ''}
            onChange={(e) => onChange({ successMessage: e.target.value })}
            className="w-full px-2.5 py-1.5 border border-[var(--border)] rounded-md text-sm"
            placeholder="Vielen Dank für Ihre Nachricht!"
          />
        </div>
      </div>
      <div className="space-y-3">
        <label className="block text-xs font-medium">Formularfelder ({fields.length})</label>
        {fields.map((field, idx) => (
          <div key={field.id} className="border border-gray-200 rounded-md p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[var(--text-muted)]">Feld {idx + 1}</span>
              <button onClick={() => removeField(field.id)} className="text-xs text-[var(--danger)] hover:underline">Entfernen</button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <input
                value={field.label || ''}
                onChange={(e) => updateField(field.id, 'label', e.target.value)}
                className="px-2.5 py-1.5 border border-[var(--border)] rounded-md text-sm"
                placeholder="Feldbezeichnung"
              />
              <select
                value={field.type || 'text'}
                onChange={(e) => updateField(field.id, 'type', e.target.value)}
                className="px-2.5 py-1.5 border border-[var(--border)] rounded-md text-sm"
              >
                {FIELD_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
              <input
                value={field.placeholder || ''}
                onChange={(e) => updateField(field.id, 'placeholder', e.target.value)}
                className="px-2.5 py-1.5 border border-[var(--border)] rounded-md text-sm"
                placeholder="Platzhalter"
              />
            </div>
            <label className="flex items-center gap-1.5 text-xs">
              <input
                type="checkbox"
                checked={field.required || false}
                onChange={(e) => updateField(field.id, 'required', e.target.checked)}
              />
              Pflichtfeld
            </label>
          </div>
        ))}
      </div>
      <button onClick={addField} className="text-xs text-[var(--primary)] hover:underline">+ Feld hinzufügen</button>
    </div>
  );
}
