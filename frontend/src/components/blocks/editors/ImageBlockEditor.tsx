import MediaPicker from '@/components/media/MediaPicker';

interface Props {
  data: Record<string, unknown>;
  onChange(data: Record<string, unknown>): void;
}

export default function ImageBlockEditor({ data, onChange }: Props) {
  return (
    <div className="space-y-3">
      <div>
        <label className="block text-xs font-medium mb-1">Bild</label>
        <MediaPicker
          value={(data.imageId as number) || null}
          onChange={(id) => onChange({ imageId: id })}
        />
      </div>
      <div>
        <label className="block text-xs font-medium mb-1">Alt-Text</label>
        <input
          value={(data.alt as string) || ''}
          onChange={(e) => onChange({ alt: e.target.value })}
          className="w-full px-2.5 py-1.5 border border-[var(--border)] rounded-md text-sm"
          placeholder="Bildbeschreibung für SEO"
        />
      </div>
      <div>
        <label className="block text-xs font-medium mb-1">Bildunterschrift (optional)</label>
        <input
          value={(data.caption as string) || ''}
          onChange={(e) => onChange({ caption: e.target.value })}
          className="w-full px-2.5 py-1.5 border border-[var(--border)] rounded-md text-sm"
          placeholder="Optionale Bildunterschrift"
        />
      </div>
      <div>
        <label className="block text-xs font-medium mb-1">Link (optional)</label>
        <input
          value={(data.href as string) || ''}
          onChange={(e) => onChange({ href: e.target.value })}
          className="w-full px-2.5 py-1.5 border border-[var(--border)] rounded-md text-sm"
          placeholder="/zielseite"
        />
      </div>
    </div>
  );
}
