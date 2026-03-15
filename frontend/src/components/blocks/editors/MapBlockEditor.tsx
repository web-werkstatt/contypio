interface Props {
  data: Record<string, unknown>;
  onChange(data: Record<string, unknown>): void;
}

export default function MapBlockEditor({ data, onChange }: Props) {
  return (
    <div className="space-y-3">
      <div>
        <label className="block text-xs font-medium mb-1">Adresse</label>
        <input
          value={(data.address as string) || ''}
          onChange={(e) => onChange({ address: e.target.value })}
          className="w-full px-2.5 py-1.5 border border-[var(--border)] rounded-md text-sm"
          placeholder="Musterstraße 1, 12345 Berlin"
        />
      </div>
      <div>
        <label className="block text-xs font-medium mb-1">Marker-Beschriftung (optional)</label>
        <input
          value={(data.markerLabel as string) || ''}
          onChange={(e) => onChange({ markerLabel: e.target.value })}
          className="w-full px-2.5 py-1.5 border border-[var(--border)] rounded-md text-sm"
          placeholder="IR-Tours Büro"
        />
      </div>
      <div className="grid grid-cols-4 gap-3">
        <div>
          <label className="block text-xs font-medium mb-1">Breitengrad</label>
          <input
            type="number"
            step="any"
            value={(data.lat as number) || 0}
            onChange={(e) => onChange({ lat: parseFloat(e.target.value) || 0 })}
            className="w-full px-2.5 py-1.5 border border-[var(--border)] rounded-md text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1">Längengrad</label>
          <input
            type="number"
            step="any"
            value={(data.lng as number) || 0}
            onChange={(e) => onChange({ lng: parseFloat(e.target.value) || 0 })}
            className="w-full px-2.5 py-1.5 border border-[var(--border)] rounded-md text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1">Zoom</label>
          <input
            type="number"
            min={1}
            max={20}
            value={(data.zoom as number) || 14}
            onChange={(e) => onChange({ zoom: parseInt(e.target.value) || 14 })}
            className="w-full px-2.5 py-1.5 border border-[var(--border)] rounded-md text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1">Anbieter</label>
          <select
            value={(data.provider as string) || 'osm'}
            onChange={(e) => onChange({ provider: e.target.value })}
            className="w-full px-2.5 py-1.5 border border-[var(--border)] rounded-md text-sm"
          >
            <option value="osm">OpenStreetMap</option>
            <option value="google">Google Maps</option>
          </select>
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium mb-1">Kartenhöhe</label>
        <input
          value={(data.height as string) || '400px'}
          onChange={(e) => onChange({ height: e.target.value })}
          className="w-full px-2.5 py-1.5 border border-[var(--border)] rounded-md text-sm"
          placeholder="400px"
        />
      </div>
    </div>
  );
}
