interface Props {
  data: Record<string, unknown>;
  onChange(data: Record<string, unknown>): void;
}

export default function GalleryBlockEditor({ data, onChange }: Props) {
  const images = (data.images as string[]) || [];

  const addImage = () => onChange({ images: [...images, ''] });
  const removeImage = (idx: number) => onChange({ images: images.filter((_, i) => i !== idx) });
  const updateImage = (idx: number, val: string) => onChange({ images: images.map((v, i) => (i === idx ? val : v)) });

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-xs font-medium mb-1">Titel (optional)</label>
        <input
          value={(data.title as string) || ''}
          onChange={(e) => onChange({ title: e.target.value })}
          className="w-full px-2.5 py-1.5 border border-[var(--border)] rounded-md text-sm"
          placeholder="Galerietitel"
        />
      </div>
      <div>
        <label className="block text-xs font-medium mb-1">Layout</label>
        <select
          value={(data.variant as string) || 'grid'}
          onChange={(e) => onChange({ variant: e.target.value })}
          className="px-2.5 py-1.5 border border-[var(--border)] rounded-md text-sm"
        >
          <option value="grid">Grid</option>
          <option value="slider">Slider</option>
        </select>
      </div>
      <div>
        <label className="block text-xs font-medium mb-1">Bilder ({images.length})</label>
        <div className="space-y-1.5">
          {images.map((img, idx) => (
            <div key={idx} className="flex gap-2">
              <input
                value={img}
                onChange={(e) => updateImage(idx, e.target.value)}
                className="flex-1 px-2.5 py-1.5 border border-[var(--border)] rounded-md text-sm"
                placeholder={`Media ID ${idx + 1}`}
              />
              <button onClick={() => removeImage(idx)} className="text-xs text-[var(--danger)] px-2 hover:bg-red-50 rounded">Entfernen</button>
            </div>
          ))}
        </div>
        <button onClick={addImage} className="mt-2 text-xs text-[var(--primary)] hover:underline">+ Bild hinzufügen</button>
      </div>
    </div>
  );
}
