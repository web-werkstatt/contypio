interface Props {
  data: Record<string, unknown>;
  onChange(data: Record<string, unknown>): void;
}

export default function VideoBlockEditor({ data, onChange }: Props) {
  return (
    <div className="space-y-3">
      <div>
        <label className="block text-xs font-medium mb-1">Video-URL</label>
        <input
          value={(data.url as string) || ''}
          onChange={(e) => onChange({ url: e.target.value })}
          className="w-full px-2.5 py-1.5 border border-[var(--border)] rounded-md text-sm"
          placeholder="https://www.youtube.com/watch?v=... oder Datei-URL"
        />
      </div>
      <div>
        <label className="block text-xs font-medium mb-1">Titel (optional)</label>
        <input
          value={(data.title as string) || ''}
          onChange={(e) => onChange({ title: e.target.value })}
          className="w-full px-2.5 py-1.5 border border-[var(--border)] rounded-md text-sm"
          placeholder="Videotitel"
        />
      </div>
      <div>
        <label className="block text-xs font-medium mb-1">Poster-Bild URL (optional)</label>
        <input
          value={(data.poster as string) || ''}
          onChange={(e) => onChange({ poster: e.target.value })}
          className="w-full px-2.5 py-1.5 border border-[var(--border)] rounded-md text-sm"
          placeholder="Vorschaubild-URL"
        />
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="block text-xs font-medium mb-1">Seitenverhältnis</label>
          <select
            value={(data.aspectRatio as string) || '16:9'}
            onChange={(e) => onChange({ aspectRatio: e.target.value })}
            className="w-full px-2.5 py-1.5 border border-[var(--border)] rounded-md text-sm"
          >
            <option value="16:9">16:9</option>
            <option value="4:3">4:3</option>
            <option value="1:1">1:1</option>
            <option value="21:9">21:9</option>
          </select>
        </div>
        <div className="flex items-end gap-3">
          <label className="flex items-center gap-1.5 text-xs">
            <input
              type="checkbox"
              checked={(data.autoplay as boolean) || false}
              onChange={(e) => onChange({ autoplay: e.target.checked })}
            />
            Autoplay
          </label>
        </div>
        <div className="flex items-end gap-3">
          <label className="flex items-center gap-1.5 text-xs">
            <input
              type="checkbox"
              checked={(data.muted as boolean) || false}
              onChange={(e) => onChange({ muted: e.target.checked })}
            />
            Stumm
          </label>
        </div>
      </div>
    </div>
  );
}
