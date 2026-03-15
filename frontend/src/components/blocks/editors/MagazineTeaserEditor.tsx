interface Props {
  data: Record<string, unknown>;
  onChange(data: Record<string, unknown>): void;
}

export default function MagazineTeaserEditor({ data, onChange }: Props) {
  const headline = (data.headline as string) || '';
  const maxItems = (data.maxItems as number) || 3;
  const source = (data.source as string) || 'ghost';
  const tag = (data.tag as string) || '';

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-xs font-medium mb-1">Ueberschrift</label>
        <input
          value={headline}
          onChange={(e) => onChange({ headline: e.target.value })}
          className="w-full px-2.5 py-1.5 border border-[var(--border)] rounded-md text-sm"
          placeholder="Aus unserem Magazin"
        />
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="block text-xs font-medium mb-1">Quelle</label>
          <select
            value={source}
            onChange={(e) => onChange({ source: e.target.value })}
            className="w-full px-2.5 py-1.5 border border-[var(--border)] rounded-md text-sm"
          >
            <option value="ghost">Ghost Blog</option>
            <option value="manual">Manuell</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium mb-1">Max. Artikel</label>
          <input
            type="number"
            value={maxItems}
            onChange={(e) => onChange({ maxItems: parseInt(e.target.value, 10) || 3 })}
            min={1}
            max={12}
            className="w-full px-2.5 py-1.5 border border-[var(--border)] rounded-md text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1">Tag-Filter</label>
          <input
            value={tag}
            onChange={(e) => onChange({ tag: e.target.value })}
            className="w-full px-2.5 py-1.5 border border-[var(--border)] rounded-md text-sm"
            placeholder="z.B. reise-tipps"
          />
        </div>
      </div>
      <p className="text-[10px] text-[var(--text-muted)]">Bei Quelle "Ghost Blog" werden Artikel automatisch geladen. Tag-Filter schraenkt auf bestimmte Tags ein.</p>
    </div>
  );
}
