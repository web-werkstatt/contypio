import { nanoid } from 'nanoid';

interface LogoItem {
  id: string;
  imageId: string;
  alt: string;
  href: string;
}

interface Props {
  data: Record<string, unknown>;
  onChange(data: Record<string, unknown>): void;
}

export default function LogoSliderBlockEditor({ data, onChange }: Props) {
  const logos = (data.logos as LogoItem[]) || [];

  const addLogo = () => onChange({
    logos: [...logos, { id: nanoid(8), imageId: '', alt: '', href: '' }],
  });
  const removeLogo = (id: string) => onChange({ logos: logos.filter((l) => l.id !== id) });
  const updateLogo = (id: string, field: keyof LogoItem, val: string) =>
    onChange({ logos: logos.map((l) => (l.id === id ? { ...l, [field]: val } : l)) });

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-xs font-medium mb-1">Titel (optional)</label>
        <input
          value={(data.title as string) || ''}
          onChange={(e) => onChange({ title: e.target.value })}
          className="w-full px-2.5 py-1.5 border border-[var(--border)] rounded-md text-sm"
          placeholder="Unsere Partner"
        />
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div className="flex items-end">
          <label className="flex items-center gap-1.5 text-xs">
            <input
              type="checkbox"
              checked={(data.autoplay as boolean) ?? true}
              onChange={(e) => onChange({ autoplay: e.target.checked })}
            />
            Autoplay
          </label>
        </div>
        <div>
          <label className="block text-xs font-medium mb-1">Geschwindigkeit (ms)</label>
          <input
            type="number"
            min={1000}
            step={500}
            value={(data.speed as number) || 3000}
            onChange={(e) => onChange({ speed: parseInt(e.target.value) || 3000 })}
            className="w-full px-2.5 py-1.5 border border-[var(--border)] rounded-md text-sm"
          />
        </div>
        <div className="flex items-end">
          <label className="flex items-center gap-1.5 text-xs">
            <input
              type="checkbox"
              checked={(data.grayscale as boolean) ?? true}
              onChange={(e) => onChange({ grayscale: e.target.checked })}
            />
            Graustufen
          </label>
        </div>
      </div>
      <div className="space-y-2">
        {logos.map((logo, idx) => (
          <div key={logo.id} className="flex gap-2 items-center">
            <span className="text-xs text-[var(--text-muted)] w-5">{idx + 1}</span>
            <input
              value={logo.imageId || ''}
              onChange={(e) => updateLogo(logo.id, 'imageId', e.target.value)}
              className="w-24 px-2.5 py-1.5 border border-[var(--border)] rounded-md text-sm"
              placeholder="Bild-ID"
            />
            <input
              value={logo.alt || ''}
              onChange={(e) => updateLogo(logo.id, 'alt', e.target.value)}
              className="flex-1 px-2.5 py-1.5 border border-[var(--border)] rounded-md text-sm"
              placeholder="Alt-Text"
            />
            <input
              value={logo.href || ''}
              onChange={(e) => updateLogo(logo.id, 'href', e.target.value)}
              className="flex-1 px-2.5 py-1.5 border border-[var(--border)] rounded-md text-sm"
              placeholder="Link (optional)"
            />
            <button onClick={() => removeLogo(logo.id)} className="text-xs text-[var(--danger)] px-2 hover:underline">×</button>
          </div>
        ))}
      </div>
      <button onClick={addLogo} className="text-xs text-[var(--primary)] hover:underline">+ Logo hinzufügen</button>
    </div>
  );
}
