import { nanoid } from 'nanoid';

interface TrustItem {
  id: string;
  icon: string;
  text: string;
}

const ICON_OPTIONS = [
  { value: 'shield', label: 'Schutzschild' },
  { value: 'star', label: 'Stern' },
  { value: 'phone', label: 'Telefon' },
  { value: 'heart', label: 'Herz' },
  { value: 'check', label: 'Haken' },
  { value: 'award', label: 'Auszeichnung' },
  { value: 'lock', label: 'Schloss' },
  { value: 'thumbsUp', label: 'Daumen hoch' },
];

interface Props {
  data: Record<string, unknown>;
  onChange(data: Record<string, unknown>): void;
}

export default function TrustStripEditor({ data, onChange }: Props) {
  const items = (data.items as TrustItem[]) || [];

  const addItem = () => onChange({
    items: [...items, { id: nanoid(8), icon: 'shield', text: '' }],
  });
  const removeItem = (id: string) => onChange({ items: items.filter((it) => it.id !== id) });
  const updateItem = (id: string, field: keyof TrustItem, val: string) =>
    onChange({ items: items.map((it) => (it.id === id ? { ...it, [field]: val } : it)) });

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        {items.map((item, idx) => (
          <div key={item.id} className="flex items-center gap-2">
            <span className="text-xs text-[var(--text-muted)] w-5">{idx + 1}.</span>
            <select
              value={item.icon}
              onChange={(e) => updateItem(item.id, 'icon', e.target.value)}
              className="px-2.5 py-1.5 border border-[var(--border)] rounded-md text-sm w-36"
            >
              {ICON_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <input
              value={item.text}
              onChange={(e) => updateItem(item.id, 'text', e.target.value)}
              className="flex-1 px-2.5 py-1.5 border border-[var(--border)] rounded-md text-sm"
              placeholder="Trust-Text"
            />
            <button onClick={() => removeItem(item.id)} className="text-xs text-[var(--danger)] hover:underline">×</button>
          </div>
        ))}
      </div>
      <button onClick={addItem} className="text-xs text-[var(--primary)] hover:underline">+ Trust-Element hinzufuegen</button>
    </div>
  );
}
