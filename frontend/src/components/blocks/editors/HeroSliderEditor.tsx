import { nanoid } from 'nanoid';

interface Slide {
  id: string;
  title: string;
  subtitle: string;
  imageId: string;
  buttonText: string;
  buttonHref: string;
}

interface Props {
  data: Record<string, unknown>;
  onChange(data: Record<string, unknown>): void;
}

export default function HeroSliderEditor({ data, onChange }: Props) {
  const slides = (data.slides as Slide[]) || [];
  const autoplay = (data.autoplay as boolean) ?? true;
  const interval = (data.interval as number) || 5000;

  const addSlide = () => onChange({
    slides: [...slides, { id: nanoid(8), title: '', subtitle: '', imageId: '', buttonText: '', buttonHref: '' }],
  });
  const removeSlide = (id: string) => onChange({ slides: slides.filter((s) => s.id !== id) });
  const updateSlide = (id: string, field: keyof Slide, val: string) =>
    onChange({ slides: slides.map((s) => (s.id === id ? { ...s, [field]: val } : s)) });

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-4">
        <label className="flex items-center gap-1.5 text-xs">
          <input
            type="checkbox"
            checked={autoplay}
            onChange={(e) => onChange({ autoplay: e.target.checked })}
          />
          Autoplay
        </label>
        {autoplay && (
          <div className="flex items-center gap-1.5">
            <label className="text-xs">Intervall (ms)</label>
            <input
              type="number"
              value={interval}
              onChange={(e) => onChange({ interval: parseInt(e.target.value, 10) || 5000 })}
              min={1000}
              max={15000}
              step={500}
              className="w-20 px-2.5 py-1.5 border border-[var(--border)] rounded-md text-sm"
            />
          </div>
        )}
      </div>
      <div className="space-y-3">
        {slides.map((slide, idx) => (
          <div key={slide.id} className="border border-gray-200 rounded-md p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[var(--text-muted)]">Slide {idx + 1}</span>
              <button onClick={() => removeSlide(slide.id)} className="text-xs text-[var(--danger)] hover:underline">Entfernen</button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input value={slide.title} onChange={(e) => updateSlide(slide.id, 'title', e.target.value)} className="px-2.5 py-1.5 border border-[var(--border)] rounded-md text-sm" placeholder="Titel" />
              <input value={slide.subtitle} onChange={(e) => updateSlide(slide.id, 'subtitle', e.target.value)} className="px-2.5 py-1.5 border border-[var(--border)] rounded-md text-sm" placeholder="Untertitel" />
            </div>
            <input value={slide.imageId} onChange={(e) => updateSlide(slide.id, 'imageId', e.target.value)} className="w-full px-2.5 py-1.5 border border-[var(--border)] rounded-md text-sm" placeholder="Bild-ID" />
            <div className="grid grid-cols-2 gap-2">
              <input value={slide.buttonText} onChange={(e) => updateSlide(slide.id, 'buttonText', e.target.value)} className="px-2.5 py-1.5 border border-[var(--border)] rounded-md text-sm" placeholder="Button Text" />
              <input value={slide.buttonHref} onChange={(e) => updateSlide(slide.id, 'buttonHref', e.target.value)} className="px-2.5 py-1.5 border border-[var(--border)] rounded-md text-sm" placeholder="Button Link" />
            </div>
          </div>
        ))}
      </div>
      <button onClick={addSlide} className="text-xs text-[var(--primary)] hover:underline">+ Slide hinzufuegen</button>
    </div>
  );
}
