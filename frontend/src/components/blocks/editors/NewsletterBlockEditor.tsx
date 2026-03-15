interface Props {
  data: Record<string, unknown>;
  onChange(data: Record<string, unknown>): void;
}

export default function NewsletterBlockEditor({ data, onChange }: Props) {
  return (
    <div className="space-y-3">
      <div>
        <label className="block text-xs font-medium mb-1">Titel</label>
        <input
          value={(data.title as string) || ''}
          onChange={(e) => onChange({ title: e.target.value })}
          className="w-full px-2.5 py-1.5 border border-[var(--border)] rounded-md text-sm"
          placeholder="Newsletter abonnieren"
        />
      </div>
      <div>
        <label className="block text-xs font-medium mb-1">Untertitel</label>
        <input
          value={(data.subtitle as string) || ''}
          onChange={(e) => onChange({ subtitle: e.target.value })}
          className="w-full px-2.5 py-1.5 border border-[var(--border)] rounded-md text-sm"
          placeholder="Erhalten Sie exklusive Reiseangebote"
        />
      </div>
      <div>
        <label className="block text-xs font-medium mb-1">Variante</label>
        <select
          value={(data.variant as string) || 'inline'}
          onChange={(e) => onChange({ variant: e.target.value })}
          className="px-2.5 py-1.5 border border-[var(--border)] rounded-md text-sm"
        >
          <option value="inline">Inline</option>
          <option value="modal">Modal</option>
        </select>
      </div>
    </div>
  );
}
