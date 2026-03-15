import { nanoid } from 'nanoid';

interface SocialLink {
  id: string;
  platform: string;
  url: string;
}

interface Props {
  data: Record<string, unknown>;
  onChange(data: Record<string, unknown>): void;
}

const PLATFORMS = [
  { value: 'facebook', label: 'Facebook' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'twitter', label: 'X (Twitter)' },
  { value: 'youtube', label: 'YouTube' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'tiktok', label: 'TikTok' },
  { value: 'pinterest', label: 'Pinterest' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'email', label: 'E-Mail' },
];

export default function SocialLinksBlockEditor({ data, onChange }: Props) {
  const links = (data.links as SocialLink[]) || [];

  const addLink = () => onChange({
    links: [...links, { id: nanoid(8), platform: 'facebook', url: '' }],
  });
  const removeLink = (id: string) => onChange({ links: links.filter((l) => l.id !== id) });
  const updateLink = (id: string, field: keyof SocialLink, val: string) =>
    onChange({ links: links.map((l) => (l.id === id ? { ...l, [field]: val } : l)) });

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-xs font-medium mb-1">Titel (optional)</label>
        <input
          value={(data.title as string) || ''}
          onChange={(e) => onChange({ title: e.target.value })}
          className="w-full px-2.5 py-1.5 border border-[var(--border)] rounded-md text-sm"
          placeholder="Folgen Sie uns"
        />
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="block text-xs font-medium mb-1">Darstellung</label>
          <select
            value={(data.variant as string) || 'icons'}
            onChange={(e) => onChange({ variant: e.target.value })}
            className="w-full px-2.5 py-1.5 border border-[var(--border)] rounded-md text-sm"
          >
            <option value="icons">Icons</option>
            <option value="buttons">Buttons</option>
            <option value="text">Text</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium mb-1">Größe</label>
          <select
            value={(data.size as string) || 'md'}
            onChange={(e) => onChange({ size: e.target.value })}
            className="w-full px-2.5 py-1.5 border border-[var(--border)] rounded-md text-sm"
          >
            <option value="sm">Klein</option>
            <option value="md">Mittel</option>
            <option value="lg">Groß</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium mb-1">Ausrichtung</label>
          <select
            value={(data.alignment as string) || 'center'}
            onChange={(e) => onChange({ alignment: e.target.value })}
            className="w-full px-2.5 py-1.5 border border-[var(--border)] rounded-md text-sm"
          >
            <option value="left">Links</option>
            <option value="center">Zentriert</option>
            <option value="right">Rechts</option>
          </select>
        </div>
      </div>
      <div className="space-y-2">
        {links.map((link) => (
          <div key={link.id} className="flex gap-2 items-center">
            <select
              value={link.platform}
              onChange={(e) => updateLink(link.id, 'platform', e.target.value)}
              className="w-36 px-2.5 py-1.5 border border-[var(--border)] rounded-md text-sm"
            >
              {PLATFORMS.map((p) => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
            <input
              value={link.url}
              onChange={(e) => updateLink(link.id, 'url', e.target.value)}
              className="flex-1 px-2.5 py-1.5 border border-[var(--border)] rounded-md text-sm"
              placeholder={link.platform === 'email' ? 'info@example.com' : 'https://...'}
            />
            <button onClick={() => removeLink(link.id)} className="text-xs text-[var(--danger)] px-2 hover:underline">×</button>
          </div>
        ))}
      </div>
      <button onClick={addLink} className="text-xs text-[var(--primary)] hover:underline">+ Link hinzufügen</button>
    </div>
  );
}
