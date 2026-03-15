import { nanoid } from 'nanoid';
import RichTextField from '@/components/RichTextField';

interface TabItem {
  id: string;
  label: string;
  content: string;
}

interface Props {
  data: Record<string, unknown>;
  onChange(data: Record<string, unknown>): void;
}

export default function TabsBlockEditor({ data, onChange }: Props) {
  const tabs = (data.tabs as TabItem[]) || [];

  const addTab = () => onChange({
    tabs: [...tabs, { id: nanoid(8), label: '', content: '' }],
  });
  const removeTab = (id: string) => onChange({ tabs: tabs.filter((t) => t.id !== id) });
  const updateTab = (id: string, field: keyof TabItem, val: string) =>
    onChange({ tabs: tabs.map((t) => (t.id === id ? { ...t, [field]: val } : t)) });

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-xs font-medium mb-1">Titel (optional)</label>
        <input
          value={(data.title as string) || ''}
          onChange={(e) => onChange({ title: e.target.value })}
          className="w-full px-2.5 py-1.5 border border-[var(--border)] rounded-md text-sm"
          placeholder="Tab-Überschrift"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium mb-1">Darstellung</label>
          <select
            value={(data.variant as string) || 'default'}
            onChange={(e) => onChange({ variant: e.target.value })}
            className="w-full px-2.5 py-1.5 border border-[var(--border)] rounded-md text-sm"
          >
            <option value="default">Standard</option>
            <option value="pills">Pills</option>
            <option value="underline">Unterstrichen</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium mb-1">Standard-Tab</label>
          <input
            type="number"
            min={0}
            max={Math.max(0, tabs.length - 1)}
            value={(data.defaultTab as number) || 0}
            onChange={(e) => onChange({ defaultTab: parseInt(e.target.value) || 0 })}
            className="w-full px-2.5 py-1.5 border border-[var(--border)] rounded-md text-sm"
          />
        </div>
      </div>
      <div className="space-y-3">
        {tabs.map((tab, idx) => (
          <div key={tab.id} className="border border-gray-200 rounded-md p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[var(--text-muted)]">Tab {idx + 1}</span>
              <button onClick={() => removeTab(tab.id)} className="text-xs text-[var(--danger)] hover:underline">Entfernen</button>
            </div>
            <input
              value={tab.label || ''}
              onChange={(e) => updateTab(tab.id, 'label', e.target.value)}
              className="w-full px-2.5 py-1.5 border border-[var(--border)] rounded-md text-sm"
              placeholder="Tab-Bezeichnung"
            />
            <RichTextField
              value={tab.content || ''}
              onChange={(val) => updateTab(tab.id, 'content', val)}
              placeholder="Tab-Inhalt eingeben..."
            />
          </div>
        ))}
      </div>
      <button onClick={addTab} className="text-xs text-[var(--primary)] hover:underline">+ Tab hinzufügen</button>
    </div>
  );
}
