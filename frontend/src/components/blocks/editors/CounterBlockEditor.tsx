import { nanoid } from 'nanoid';

interface CounterItem {
  id: string;
  number: number;
  label: string;
  prefix: string;
  suffix: string;
}

interface Props {
  data: Record<string, unknown>;
  onChange(data: Record<string, unknown>): void;
}

export default function CounterBlockEditor({ data, onChange }: Props) {
  const items = (data.items as CounterItem[]) || [];

  const addItem = () => onChange({
    items: [...items, { id: nanoid(8), number: 0, label: '', prefix: '', suffix: '' }],
  });
  const removeItem = (id: string) => onChange({ items: items.filter((it) => it.id !== id) });
  const updateItem = (id: string, field: keyof CounterItem, val: string | number) =>
    onChange({ items: items.map((it) => (it.id === id ? { ...it, [field]: val } : it)) });

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-xs font-medium mb-1">Titel (optional)</label>
        <input
          value={(data.title as string) || ''}
          onChange={(e) => onChange({ title: e.target.value })}
          className="w-full px-2.5 py-1.5 border border-[var(--border)] rounded-md text-sm"
          placeholder="Unsere Zahlen"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium mb-1">Spalten</label>
          <select
            value={(data.columns as number) || 4}
            onChange={(e) => onChange({ columns: parseInt(e.target.value) })}
            className="w-full px-2.5 py-1.5 border border-[var(--border)] rounded-md text-sm"
          >
            <option value={2}>2 Spalten</option>
            <option value={3}>3 Spalten</option>
            <option value={4}>4 Spalten</option>
          </select>
        </div>
        <div className="flex items-end">
          <label className="flex items-center gap-1.5 text-xs">
            <input
              type="checkbox"
              checked={(data.animated as boolean) ?? true}
              onChange={(e) => onChange({ animated: e.target.checked })}
            />
            Animation beim Scrollen
          </label>
        </div>
      </div>
      <div className="space-y-3">
        {items.map((item, idx) => (
          <div key={item.id} className="border border-gray-200 rounded-md p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[var(--text-muted)]">Zähler {idx + 1}</span>
              <button onClick={() => removeItem(item.id)} className="text-xs text-[var(--danger)] hover:underline">Entfernen</button>
            </div>
            <div className="grid grid-cols-4 gap-2">
              <input
                value={item.prefix || ''}
                onChange={(e) => updateItem(item.id, 'prefix', e.target.value)}
                className="px-2.5 py-1.5 border border-[var(--border)] rounded-md text-sm"
                placeholder="Präfix (z.B. >)"
              />
              <input
                type="number"
                value={item.number || 0}
                onChange={(e) => updateItem(item.id, 'number', parseInt(e.target.value) || 0)}
                className="px-2.5 py-1.5 border border-[var(--border)] rounded-md text-sm"
                placeholder="Zahl"
              />
              <input
                value={item.suffix || ''}
                onChange={(e) => updateItem(item.id, 'suffix', e.target.value)}
                className="px-2.5 py-1.5 border border-[var(--border)] rounded-md text-sm"
                placeholder="Suffix (z.B. +)"
              />
              <input
                value={item.label || ''}
                onChange={(e) => updateItem(item.id, 'label', e.target.value)}
                className="px-2.5 py-1.5 border border-[var(--border)] rounded-md text-sm"
                placeholder="Bezeichnung"
              />
            </div>
          </div>
        ))}
      </div>
      <button onClick={addItem} className="text-xs text-[var(--primary)] hover:underline">+ Zähler hinzufügen</button>
    </div>
  );
}
