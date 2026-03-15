import { nanoid } from 'nanoid';
import RichTextField from '@/components/RichTextField';

interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

interface Props {
  data: Record<string, unknown>;
  onChange(data: Record<string, unknown>): void;
}

export default function FaqBlockEditor({ data, onChange }: Props) {
  const items = (data.items as FaqItem[]) || [];

  const addItem = () => onChange({
    items: [...items, { id: nanoid(8), question: '', answer: '' }],
  });
  const removeItem = (id: string) => onChange({ items: items.filter((it) => it.id !== id) });
  const updateItem = (id: string, field: 'question' | 'answer', val: string) =>
    onChange({ items: items.map((it) => (it.id === id ? { ...it, [field]: val } : it)) });

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-xs font-medium mb-1">Titel (optional)</label>
        <input
          value={(data.title as string) || ''}
          onChange={(e) => onChange({ title: e.target.value })}
          className="w-full px-2.5 py-1.5 border border-[var(--border)] rounded-md text-sm"
          placeholder="Häufige Fragen"
        />
      </div>
      <div className="space-y-3">
        {items.map((item, idx) => (
          <div key={item.id} className="border border-gray-200 rounded-md p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[var(--text-muted)]">Frage {idx + 1}</span>
              <button onClick={() => removeItem(item.id)} className="text-xs text-[var(--danger)] hover:underline">Entfernen</button>
            </div>
            <input
              value={item.question}
              onChange={(e) => updateItem(item.id, 'question', e.target.value)}
              className="w-full px-2.5 py-1.5 border border-[var(--border)] rounded-md text-sm"
              placeholder="Frage"
            />
            <RichTextField
              value={item.answer}
              onChange={(val) => updateItem(item.id, 'answer', val)}
              placeholder="Antwort eingeben..."
            />
          </div>
        ))}
      </div>
      <button onClick={addItem} className="text-xs text-[var(--primary)] hover:underline">+ Frage hinzufügen</button>
    </div>
  );
}
