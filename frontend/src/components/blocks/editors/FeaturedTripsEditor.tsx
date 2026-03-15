import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Loader2, Wand2 } from 'lucide-react';
import { nanoid } from 'nanoid';
import api from '@/lib/api';

interface TripRef {
  id: string;
  tripId: string;
  label: string;
}

interface Props {
  data: Record<string, unknown>;
  onChange(data: Record<string, unknown>): void;
}

type SourceMode = 'auto' | 'manual';

export default function FeaturedTripsEditor({ data, onChange }: Props) {
  const headline = (data.headline as string) || '';
  const maxItems = (data.maxItems as number) || 6;
  const trips = (data.trips as TripRef[]) || [];
  const source = (data.source as SourceMode) || 'manual';
  const filters = (data.filters as Record<string, string>) || {};
  const [loading, setLoading] = useState(false);

  const { data: filterOptions } = useQuery<Record<string, string[]>>({
    queryKey: ['filter-options'],
    queryFn: async () => (await api.get('/api/autofill/filters')).data,
    staleTime: 5 * 60 * 1000,
    enabled: source === 'auto',
  });

  const addTrip = () => onChange({
    trips: [...trips, { id: nanoid(8), tripId: '', label: '' }],
  });
  const removeTrip = (id: string) => onChange({ trips: trips.filter((t) => t.id !== id) });
  const updateTrip = (id: string, field: keyof TripRef, val: string) =>
    onChange({ trips: trips.map((t) => (t.id === id ? { ...t, [field]: val } : t)) });

  const updateFilter = (key: string, val: string) => {
    const next = { ...filters, [key]: val };
    if (!val) delete next[key];
    onChange({ filters: next });
  };

  const handleAutoFill = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = { limit: String(maxItems), featured: 'true' };
      if (filters.continent) params.continent = filters.continent;
      if (filters.country) params.country = filters.country;
      const res = await api.get('/api/autofill/trips', { params });
      const filled = (res.data as Array<{ tripId: string; label: string }>).map((t) => ({
        id: nanoid(8),
        tripId: t.tripId,
        label: t.label,
      }));
      onChange({ trips: filled });
    } catch { /* ignore */ }
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
          placeholder="Unsere Reise-Empfehlungen"
        />
      </div>
      <div>
        <label className="block text-xs font-medium mb-1">Max. Anzahl</label>
        <input
          type="number"
          value={maxItems}
          onChange={(e) => onChange({ maxItems: parseInt(e.target.value, 10) || 6 })}
          min={1}
          max={24}
          className="w-24 px-2.5 py-1.5 border border-[var(--border)] rounded-md text-sm"
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
            ? 'Reisen werden automatisch nach Filtern geladen und bleiben aktuell.'
            : 'Sie wählen einzelne Reisen manuell aus oder nutzen Auto-Fill.'}
        </p>
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
          </div>
        </fieldset>
      )}

      {source === 'manual' && (
        <>
          <div className="space-y-2">
            {trips.map((trip, idx) => (
              <div key={trip.id} className="flex items-center gap-2">
                <span className="text-xs text-[var(--text-muted)] w-5">{idx + 1}.</span>
                <input
                  value={trip.tripId}
                  onChange={(e) => updateTrip(trip.id, 'tripId', e.target.value)}
                  className="flex-1 px-2.5 py-1.5 border border-[var(--border)] rounded-md text-sm"
                  placeholder="Reise-ID"
                />
                <input
                  value={trip.label}
                  onChange={(e) => updateTrip(trip.id, 'label', e.target.value)}
                  className="flex-1 px-2.5 py-1.5 border border-[var(--border)] rounded-md text-sm"
                  placeholder="Anzeigename (optional)"
                />
                <button onClick={() => removeTrip(trip.id)} className="text-xs text-[var(--danger)] hover:underline">x</button>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <button onClick={addTrip} className="text-xs text-[var(--primary)] hover:underline">+ Reise hinzufügen</button>
            <button
              onClick={handleAutoFill}
              disabled={loading}
              className="flex items-center gap-1 text-xs text-amber-600 hover:underline disabled:opacity-50"
            >
              {loading ? <Loader2 size={12} className="animate-spin" /> : <Wand2 size={12} />}
              Auto-Fill aus Datenbank
            </button>
          </div>
        </>
      )}
    </div>
  );
}
