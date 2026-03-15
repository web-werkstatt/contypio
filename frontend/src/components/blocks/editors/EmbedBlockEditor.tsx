interface Props {
  data: Record<string, unknown>;
  onChange(data: Record<string, unknown>): void;
}

export default function EmbedBlockEditor({ data, onChange }: Props) {
  return (
    <div className="space-y-3">
      <div>
        <label className="block text-xs font-medium mb-1">URL</label>
        <input
          value={(data.url as string) || ''}
          onChange={(e) => onChange({ url: e.target.value })}
          className="w-full px-2.5 py-1.5 border border-[var(--border)] rounded-md text-sm"
          placeholder="https://example.com/embed"
        />
      </div>
      <div>
        <label className="block text-xs font-medium mb-1">HTML-Code (optional, überschreibt URL)</label>
        <textarea
          value={(data.html as string) || ''}
          onChange={(e) => onChange({ html: e.target.value })}
          rows={4}
          className="w-full px-2.5 py-1.5 border border-[var(--border)] rounded-md text-sm font-mono"
          placeholder="<iframe src=&quot;...&quot;></iframe>"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium mb-1">Maximale Breite</label>
          <input
            value={(data.maxWidth as string) || '100%'}
            onChange={(e) => onChange({ maxWidth: e.target.value })}
            className="w-full px-2.5 py-1.5 border border-[var(--border)] rounded-md text-sm"
            placeholder="100% oder 800px"
          />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1">Seitenverhältnis (optional)</label>
          <input
            value={(data.aspectRatio as string) || ''}
            onChange={(e) => onChange({ aspectRatio: e.target.value })}
            className="w-full px-2.5 py-1.5 border border-[var(--border)] rounded-md text-sm"
            placeholder="16:9 oder leer"
          />
        </div>
      </div>
    </div>
  );
}
