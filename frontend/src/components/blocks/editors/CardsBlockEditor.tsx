import { nanoid } from 'nanoid';

interface CardItem {
  id: string;
  title: string;
  text: string;
  imageId: string;
  href: string;
}

interface Props {
  data: Record<string, unknown>;
  onChange(data: Record<string, unknown>): void;
}

export default function CardsBlockEditor({ data, onChange }: Props) {
  const items = (data.items as CardItem[]) || [];

  const addItem = () => onChange({
    items: [...items, { id: nanoid(8), title: '', text: '', imageId: '', href: '' }],
  });
  const removeItem = (id: string) => onChange({ items: items.filter((it) => it.id !== id) });
  const updateItem = (id: string, field: keyof CardItem, val: string) =>
    onChange({ items: items.map((it) => (it.id === id ? { ...it, [field]: val } : it)) });

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-xs font-medium mb-1">Titel (optional)</label>
        <input
          value={(data.title as string) || ''}
          onChange={(e) => onChange({ title: e.target.value })}
          className="w-full px-2.5 py-1.5 border border-[var(--border)] rounded-md text-sm"
          placeholder="Kartentitel"
        />
      </div>
      <div className="space-y-3">
        {items.map((item, idx) => (
          <div key={item.id} className="border border-gray-200 rounded-md p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[var(--text-muted)]">Karte {idx + 1}</span>
              <button onClick={() => removeItem(item.id)} className="text-xs text-[var(--danger)] hover:underline">Entfernen</button>
            </div>
            <input value={item.title} onChange={(e) => updateItem(item.id, 'title', e.target.value)} className="w-full px-2.5 py-1.5 border border-[var(--border)] rounded-md text-sm" placeholder="Titel" />
            <textarea value={item.text} onChange={(e) => updateItem(item.id, 'text', e.target.value)} rows={2} className="w-full px-2.5 py-1.5 border border-[var(--border)] rounded-md text-sm" placeholder="Beschreibung" />
            <div className="grid grid-cols-2 gap-2">
              <input value={item.imageId} onChange={(e) => updateItem(item.id, 'imageId', e.target.value)} className="px-2.5 py-1.5 border border-[var(--border)] rounded-md text-sm" placeholder="Bild-ID" />
              <input value={item.href} onChange={(e) => updateItem(item.id, 'href', e.target.value)} className="px-2.5 py-1.5 border border-[var(--border)] rounded-md text-sm" placeholder="Link" />
            </div>
          </div>
        ))}
      </div>
      <button onClick={addItem} className="text-xs text-[var(--primary)] hover:underline">+ Karte hinzufügen</button>
    </div>
  );
}
