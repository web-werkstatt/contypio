import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Loader2, Wand2 } from 'lucide-react';
import api from '@/lib/api';

interface Props {
  data: Record<string, unknown>;
  onChange(data: Record<string, unknown>): void;
}

type SourceMode = 'auto' | 'manual';

export default function TripListingEditor({ data, onChange }: Props) {
  const headline = (data.headline as string) || '';
  const filters = (data.filters as Record<string, string>) || {};
  const maxItems = (data.maxItems as number) || 12;
  const layout = (data.layout as string) || 'grid';
  const source = (data.source as SourceMode) || 'auto';
  const [loading, setLoading] = useState(false);
  const [previewCount, setPreviewCount] = useState<number | null>(null);

  const { data: filterOptions } = useQuery<Record<string, string[]>>({
    queryKey: ['filter-options'],
    queryFn: async () => (await api.get('/api/autofill/filters')).data,
    staleTime: 5 * 60 * 1000,
  });

  const updateFilter = (key: string, val: string) => {
    const next = { ...filters, [key]: val };
    if (!val) delete next[key];
    onChange({ filters: next });
  };

  const handlePreview = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = { limit: String(maxItems) };
      if (filters.continent) params.continent = filters.continent;
      if (filters.country) params.country = filters.country;
      if (filters.theme) params.theme = filters.theme;
      if (filters.travelType) params.travel_type = filters.travelType;
      const res = await api.get('/api/autofill/trips', { params });
      setPreviewCount((res.data as unknown[]).length);
    } catch {
      setPreviewCount(0);
    }
    setLoading(false);
  };

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-xs font-medium mb-1">Überschrift</label>
        <input
          value={headline}
          onChange={(e) => onChange({ headline: e.target.value })}
          className="w-full px-2.5 py-1.5 border border-[var(--border)] rounded-md text-sm"
          placeholder="Alle Reisen"
        />
      </div>

      {/* Quelle */}
      <div>
        <label className="block text-xs font-medium mb-1.5">Quelle</label>
        <div className="flex gap-2">
          <button
            onClick={() => onChange({ source: 'auto' })}
            className={`flex-1 px-3 py-1.5 text-xs rounded-md border transition-colors ${
              source === 'auto'
                ? 'border-[var(--primary)] bg-[var(--primary)]/5 text-[var(--primary)] font-medium'
                : 'border-[var(--border)] text-[var(--text-muted)] hover:bg-gray-50'
            }`}
          >
            Automatisch
          </button>
          <button
            onClick={() => onChange({ source: 'manual' })}
            className={`flex-1 px-3 py-1.5 text-xs rounded-md border transition-colors ${
              source === 'manual'
                ? 'border-[var(--primary)] bg-[var(--primary)]/5 text-[var(--primary)] font-medium'
                : 'border-[var(--border)] text-[var(--text-muted)] hover:bg-gray-50'
            }`}
          >
            Manuell
          </button>
        </div>
        <p className="text-[10px] text-[var(--text-muted)] mt-1">
          {source === 'auto'
            ? 'Reisen werden automatisch aus der Datenbank geladen und bleiben aktuell.'
            : 'Sie wählen einzelne Reisen manuell aus.'}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium mb-1">Layout</label>
          <select
            value={layout}
            onChange={(e) => onChange({ layout: e.target.value })}
            className="w-full px-2.5 py-1.5 border border-[var(--border)] rounded-md text-sm"
          >
            <option value="grid">Kacheln</option>
            <option value="list">Liste</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium mb-1">Max. Anzahl</label>
          <input
            type="number"
            value={maxItems}
            onChange={(e) => onChange({ maxItems: parseInt(e.target.value, 10) || 12 })}
            min={1}
            max={100}
            className="w-full px-2.5 py-1.5 border border-[var(--border)] rounded-md text-sm"
          />
        </div>
      </div>

      {source === 'auto' && (
        <fieldset className="border border-gray-200 rounded-md p-3 space-y-2">
          <legend className="text-xs font-medium px-1">Filter (optional)</legend>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-medium mb-1">Kontinent</label>
              <select
                value={filters.continent || ''}
                onChange={(e) => updateFilter('continent', e.target.value)}
                className="w-full px-2.5 py-1.5 border border-[var(--border)] rounded-md text-sm"
              >
                <option value="">Alle</option>
                {(filterOptions?.continents ?? []).map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Land</label>
              <select
                value={filters.country || ''}
                onChange={(e) => updateFilter('country', e.target.value)}
                className="w-full px-2.5 py-1.5 border border-[var(--border)] rounded-md text-sm"
              >
                <option value="">Alle</option>
                {(filterOptions?.countries ?? []).map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Thema</label>
              <select
                value={filters.theme || ''}
                onChange={(e) => updateFilter('theme', e.target.value)}
                className="w-full px-2.5 py-1.5 border border-[var(--border)] rounded-md text-sm"
              >
                <option value="">Alle</option>
                {(filterOptions?.themes ?? []).map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Reiseart</label>
              <input
                value={filters.travelType || ''}
                onChange={(e) => updateFilter('travelType', e.target.value)}
                className="w-full px-2.5 py-1.5 border border-[var(--border)] rounded-md text-sm"
                placeholder="z.B. Rundreise"
              />
            </div>
          </div>
          <div className="flex items-center gap-3 pt-1">
            <button
              onClick={handlePreview}
              disabled={loading}
              className="flex items-center gap-1 text-xs text-amber-600 hover:underline disabled:opacity-50"
            >
              {loading ? <Loader2 size={12} className="animate-spin" /> : <Wand2 size={12} />}
              Vorschau: Wie viele Reisen?
            </button>
            {previewCount !== null && (
              <span className="text-xs text-[var(--text-muted)]">
                {previewCount} {previewCount === 1 ? 'Reise' : 'Reisen'} gefunden
              </span>
            )}
          </div>
        </fieldset>
      )}
    </div>
  );
}
