interface Props {
  data: Record<string, unknown>;
  onChange(data: Record<string, unknown>): void;
}

export default function CtaBlockEditor({ data, onChange }: Props) {
  return (
    <div className="space-y-3">
      <div>
        <label className="block text-xs font-medium mb-1">Titel</label>
        <input
          value={(data.title as string) || ''}
          onChange={(e) => onChange({ title: e.target.value })}
          className="w-full px-2.5 py-1.5 border border-[var(--border)] rounded-md text-sm"
          placeholder="Call to Action Titel"
        />
      </div>
      <div>
        <label className="block text-xs font-medium mb-1">Text</label>
        <textarea
          value={(data.text as string) || ''}
          onChange={(e) => onChange({ text: e.target.value })}
          rows={2}
          className="w-full px-2.5 py-1.5 border border-[var(--border)] rounded-md text-sm"
          placeholder="Beschreibungstext"
        />
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="block text-xs font-medium mb-1">Button Text</label>
          <input
            value={(data.buttonLabel as string) || ''}
            onChange={(e) => onChange({ buttonLabel: e.target.value })}
            className="w-full px-2.5 py-1.5 border border-[var(--border)] rounded-md text-sm"
            placeholder="Jetzt buchen"
          />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1">Button Link</label>
          <input
            value={(data.buttonHref as string) || ''}
            onChange={(e) => onChange({ buttonHref: e.target.value })}
            className="w-full px-2.5 py-1.5 border border-[var(--border)] rounded-md text-sm"
            placeholder="/kontakt"
          />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1">Variante</label>
          <select
            value={(data.buttonVariant as string) || 'primary'}
            onChange={(e) => onChange({ buttonVariant: e.target.value })}
            className="w-full px-2.5 py-1.5 border border-[var(--border)] rounded-md text-sm"
          >
            <option value="primary">Primary</option>
            <option value="secondary">Secondary</option>
            <option value="outline">Outline</option>
          </select>
        </div>
      </div>
    </div>
  );
}
