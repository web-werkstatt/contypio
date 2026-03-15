import { nanoid } from 'nanoid';

interface Tile {
  id: string;
  title: string;
  imageId: string;
  href: string;
  tag: string;
}

interface Props {
  data: Record<string, unknown>;
  onChange(data: Record<string, unknown>): void;
}

export default function InspirationTilesEditor({ data, onChange }: Props) {
  const headline = (data.headline as string) || '';
  const tiles = (data.tiles as Tile[]) || [];

  const addTile = () => onChange({
    tiles: [...tiles, { id: nanoid(8), title: '', imageId: '', href: '', tag: '' }],
  });
  const removeTile = (id: string) => onChange({ tiles: tiles.filter((t) => t.id !== id) });
  const updateTile = (id: string, field: keyof Tile, val: string) =>
    onChange({ tiles: tiles.map((t) => (t.id === id ? { ...t, [field]: val } : t)) });

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-xs font-medium mb-1">Ueberschrift</label>
        <input
          value={headline}
          onChange={(e) => onChange({ headline: e.target.value })}
          className="w-full px-2.5 py-1.5 border border-[var(--border)] rounded-md text-sm"
          placeholder="Reise-Inspiration"
        />
      </div>
      <div className="space-y-3">
        {tiles.map((tile, idx) => (
          <div key={tile.id} className="border border-gray-200 rounded-md p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[var(--text-muted)]">Inspiration {idx + 1}</span>
              <button onClick={() => removeTile(tile.id)} className="text-xs text-[var(--danger)] hover:underline">Entfernen</button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input value={tile.title} onChange={(e) => updateTile(tile.id, 'title', e.target.value)} className="px-2.5 py-1.5 border border-[var(--border)] rounded-md text-sm" placeholder="Titel" />
              <input value={tile.tag} onChange={(e) => updateTile(tile.id, 'tag', e.target.value)} className="px-2.5 py-1.5 border border-[var(--border)] rounded-md text-sm" placeholder="Tag z.B. Abenteuer" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input value={tile.imageId} onChange={(e) => updateTile(tile.id, 'imageId', e.target.value)} className="px-2.5 py-1.5 border border-[var(--border)] rounded-md text-sm" placeholder="Bild-ID" />
              <input value={tile.href} onChange={(e) => updateTile(tile.id, 'href', e.target.value)} className="px-2.5 py-1.5 border border-[var(--border)] rounded-md text-sm" placeholder="Link" />
            </div>
          </div>
        ))}
      </div>
      <button onClick={addTile} className="text-xs text-[var(--primary)] hover:underline">+ Inspiration hinzufuegen</button>
    </div>
  );
}
