import MediaPicker from '@/components/media/MediaPicker';

interface Props {
  data: Record<string, unknown>;
  onChange(data: Record<string, unknown>): void;
}

export default function HeroBlockEditor({ data, onChange }: Props) {
  return (
    <div className="space-y-3">
      <div>
        <label className="block text-xs font-medium mb-1">Überschrift (H1)</label>
        <input
          value={(data.title as string) || ''}
          onChange={(e) => onChange({ title: e.target.value })}
          className="w-full px-2.5 py-1.5 border border-[var(--border)] rounded-md text-sm"
          placeholder="Hauptüberschrift"
        />
      </div>
      <div>
        <label className="block text-xs font-medium mb-1">Untertitel</label>
        <textarea
          value={(data.subtitle as string) || ''}
          onChange={(e) => onChange({ subtitle: e.target.value })}
          rows={2}
          className="w-full px-2.5 py-1.5 border border-[var(--border)] rounded-md text-sm"
          placeholder="Optionaler Untertitel"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium mb-1">CTA Button Text</label>
          <input
            value={(data.ctaLabel as string) || ''}
            onChange={(e) => onChange({ ctaLabel: e.target.value })}
            className="w-full px-2.5 py-1.5 border border-[var(--border)] rounded-md text-sm"
            placeholder="z.B. Jetzt entdecken"
          />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1">CTA Link</label>
          <input
            value={(data.ctaHref as string) || ''}
            onChange={(e) => onChange({ ctaHref: e.target.value })}
            className="w-full px-2.5 py-1.5 border border-[var(--border)] rounded-md text-sm"
            placeholder="/reisen"
          />
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium mb-1">Hintergrundbild</label>
        <MediaPicker
          value={(data.imageId as number) || null}
          onChange={(id) => onChange({ imageId: id })}
        />
      </div>
    </div>
  );
}
