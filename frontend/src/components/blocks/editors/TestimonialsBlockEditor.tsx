import { nanoid } from 'nanoid';

interface TestimonialItem {
  id: string;
  quote: string;
  author: string;
  role: string;
  rating: number;
  imageId: string;
}

interface Props {
  data: Record<string, unknown>;
  onChange(data: Record<string, unknown>): void;
}

export default function TestimonialsBlockEditor({ data, onChange }: Props) {
  const items = (data.items as TestimonialItem[]) || [];

  const addItem = () => onChange({
    items: [...items, { id: nanoid(8), quote: '', author: '', role: '', rating: 5, imageId: '' }],
  });
  const removeItem = (id: string) => onChange({ items: items.filter((it) => it.id !== id) });
  const updateItem = (id: string, field: keyof TestimonialItem, val: string | number) =>
    onChange({ items: items.map((it) => (it.id === id ? { ...it, [field]: val } : it)) });

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-xs font-medium mb-1">Titel (optional)</label>
        <input
          value={(data.title as string) || ''}
          onChange={(e) => onChange({ title: e.target.value })}
          className="w-full px-2.5 py-1.5 border border-[var(--border)] rounded-md text-sm"
          placeholder="Das sagen unsere Kunden"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium mb-1">Layout</label>
          <select
            value={(data.layout as string) || 'grid'}
            onChange={(e) => onChange({ layout: e.target.value })}
            className="w-full px-2.5 py-1.5 border border-[var(--border)] rounded-md text-sm"
          >
            <option value="grid">Grid</option>
            <option value="slider">Slider</option>
            <option value="list">Liste</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium mb-1">Spalten</label>
          <select
            value={(data.columns as number) || 3}
            onChange={(e) => onChange({ columns: parseInt(e.target.value) })}
            className="w-full px-2.5 py-1.5 border border-[var(--border)] rounded-md text-sm"
          >
            <option value={2}>2 Spalten</option>
            <option value={3}>3 Spalten</option>
            <option value={4}>4 Spalten</option>
          </select>
        </div>
      </div>
      <div className="space-y-3">
        {items.map((item, idx) => (
          <div key={item.id} className="border border-gray-200 rounded-md p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[var(--text-muted)]">Kundenstimme {idx + 1}</span>
              <button onClick={() => removeItem(item.id)} className="text-xs text-[var(--danger)] hover:underline">Entfernen</button>
            </div>
            <textarea
              value={item.quote || ''}
              onChange={(e) => updateItem(item.id, 'quote', e.target.value)}
              rows={2}
              className="w-full px-2.5 py-1.5 border border-[var(--border)] rounded-md text-sm"
              placeholder="Zitat / Bewertungstext"
            />
            <div className="grid grid-cols-3 gap-2">
              <input
                value={item.author || ''}
                onChange={(e) => updateItem(item.id, 'author', e.target.value)}
                className="px-2.5 py-1.5 border border-[var(--border)] rounded-md text-sm"
                placeholder="Name"
              />
              <input
                value={item.role || ''}
                onChange={(e) => updateItem(item.id, 'role', e.target.value)}
                className="px-2.5 py-1.5 border border-[var(--border)] rounded-md text-sm"
                placeholder="Rolle (optional)"
              />
              <select
                value={item.rating || 5}
                onChange={(e) => updateItem(item.id, 'rating', parseInt(e.target.value))}
                className="px-2.5 py-1.5 border border-[var(--border)] rounded-md text-sm"
              >
                <option value={5}>★★★★★ (5)</option>
                <option value={4}>★★★★☆ (4)</option>
                <option value={3}>★★★☆☆ (3)</option>
                <option value={2}>★★☆☆☆ (2)</option>
                <option value={1}>★☆☆☆☆ (1)</option>
              </select>
            </div>
            <input
              value={item.imageId || ''}
              onChange={(e) => updateItem(item.id, 'imageId', e.target.value)}
              className="w-full px-2.5 py-1.5 border border-[var(--border)] rounded-md text-sm"
              placeholder="Bild-ID (optional)"
            />
          </div>
        ))}
      </div>
      <button onClick={addItem} className="text-xs text-[var(--primary)] hover:underline">+ Kundenstimme hinzufügen</button>
    </div>
  );
}
