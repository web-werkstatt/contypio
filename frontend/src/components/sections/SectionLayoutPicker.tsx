import { useState } from 'react';
import { LAYOUT_PRESETS, type LayoutKey, type GridConfig } from '@/types/cms';
import { Settings2 } from 'lucide-react';

interface Props {
  onSelect(layout: LayoutKey, gridConfig?: GridConfig): void;
  current?: LayoutKey;
  currentGridConfig?: GridConfig;
}

const LAYOUT_ICONS: Record<string, number[]> = {
  'full': [12],
  'two-col-equal': [6, 6],
  'two-col-left-wide': [8, 4],
  'two-col-right-wide': [4, 8],
  'three-col-equal': [4, 4, 4],
  'four-col-equal': [3, 3, 3, 3],
};

const COLUMN_PRESETS = [
  { label: '2 Spalten', columns: ['1fr', '1fr'] },
  { label: '3 Spalten', columns: ['1fr', '1fr', '1fr'] },
  { label: 'Sidebar links', columns: ['250px', '1fr'] },
  { label: 'Sidebar rechts', columns: ['1fr', '300px'] },
  { label: 'Breit + 2 Schmal', columns: ['2fr', '1fr', '1fr'] },
  { label: '4 gleich', columns: ['1fr', '1fr', '1fr', '1fr'] },
];

const GAP_OPTIONS = [
  { label: 'Kein', value: '0px' },
  { label: 'Klein', value: '0.75rem' },
  { label: 'Normal', value: '1.5rem' },
  { label: 'Gross', value: '2.5rem' },
];

export default function SectionLayoutPicker({ onSelect, current, currentGridConfig }: Props) {
  const [showCustom, setShowCustom] = useState(current === 'custom');
  const [columns, setColumns] = useState<string[]>(
    currentGridConfig?.tracks?.lg?.columns || ['1fr', '1fr']
  );
  const [gap, setGap] = useState(currentGridConfig?.tracks?.lg?.gap || '1.5rem');
  const [mobileColumns, setMobileColumns] = useState<string[]>(
    currentGridConfig?.tracks?.sm?.columns || ['1fr']
  );

  const applyCustom = () => {
    const config: GridConfig = {
      tracks: {
        lg: { columns, gap },
        sm: { columns: mobileColumns, gap },
      },
    };
    onSelect('custom', config);
  };

  const addColumn = () => {
    if (columns.length < 6) setColumns([...columns, '1fr']);
  };
  const removeColumn = (idx: number) => {
    if (columns.length > 1) setColumns(columns.filter((_, i) => i !== idx));
  };
  const updateColumn = (idx: number, value: string) => {
    setColumns(columns.map((c, i) => (i === idx ? value : c)));
  };

  return (
    <div className="p-2">
      {/* Preset grid */}
      <div className="grid grid-cols-3 gap-2 mb-2">
        {LAYOUT_PRESETS.filter(p => p.key !== 'custom').map((preset) => {
          const widths = LAYOUT_ICONS[preset.key];
          const isActive = current === preset.key;
          return (
            <button
              key={preset.key}
              onClick={() => { setShowCustom(false); onSelect(preset.key); }}
              className={`flex flex-col items-center gap-1.5 p-2.5 rounded-md border transition-colors ${
                isActive
                  ? 'border-[var(--primary)] bg-[var(--primary)]/5'
                  : 'border-[var(--border)] hover:border-[var(--primary)] hover:bg-gray-50'
              }`}
            >
              <div className="flex gap-0.5 w-full h-5">
                {widths.map((w, i) => (
                  <div
                    key={i}
                    className={`h-full rounded-sm ${isActive ? 'bg-[var(--primary)]' : 'bg-gray-300'}`}
                    style={{ flex: w }}
                  />
                ))}
              </div>
              <span className="text-[10px] text-[var(--text-muted)] leading-tight">{preset.label}</span>
            </button>
          );
        })}
      </div>

      {/* Custom toggle */}
      <button
        onClick={() => setShowCustom(!showCustom)}
        className={`w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-md border transition-colors text-xs ${
          current === 'custom'
            ? 'border-[var(--primary)] bg-[var(--primary)]/5 text-[var(--primary)]'
            : 'border-[var(--border)] hover:border-[var(--primary)] text-[var(--text-muted)]'
        }`}
      >
        <Settings2 size={12} /> Benutzerdefiniert
      </button>

      {/* Custom editor */}
      {showCustom && (
        <div className="mt-3 space-y-3 border-t border-[var(--border)] pt-3">
          {/* Quick presets */}
          <div>
            <label className="text-[10px] font-medium text-[var(--text-muted)] mb-1 block">Schnellauswahl</label>
            <div className="flex flex-wrap gap-1">
              {COLUMN_PRESETS.map((p) => (
                <button
                  key={p.label}
                  onClick={() => setColumns(p.columns)}
                  className="px-2 py-0.5 text-[10px] rounded border border-[var(--border)] hover:border-[var(--primary)] transition-colors"
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Column definitions */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[10px] font-medium text-[var(--text-muted)]">
                Spalten (Desktop) — {columns.length}
              </label>
              <button
                onClick={addColumn}
                disabled={columns.length >= 6}
                className="text-[10px] text-[var(--primary)] hover:underline disabled:opacity-30"
              >
                + Spalte
              </button>
            </div>

            {/* Visual preview */}
            <div className="flex gap-0.5 h-6 mb-2 rounded overflow-hidden">
              {columns.map((col, i) => {
                const flex = col.includes('fr') ? parseFloat(col) || 1 : 1;
                return (
                  <div
                    key={i}
                    className="bg-[var(--primary)]/20 border border-[var(--primary)]/30 rounded-sm flex items-center justify-center"
                    style={{ flex }}
                  >
                    <span className="text-[8px] text-[var(--primary)] font-mono">{col}</span>
                  </div>
                );
              })}
            </div>

            {/* Column inputs */}
            <div className="space-y-1">
              {columns.map((col, i) => (
                <div key={i} className="flex items-center gap-1">
                  <span className="text-[10px] text-[var(--text-muted)] w-4">{i + 1}.</span>
                  <input
                    value={col}
                    onChange={(e) => updateColumn(i, e.target.value)}
                    placeholder="1fr, 300px, minmax(...)..."
                    className="flex-1 text-xs px-2 py-1 border border-[var(--border)] rounded font-mono"
                  />
                  {columns.length > 1 && (
                    <button
                      onClick={() => removeColumn(i)}
                      className="text-[10px] text-[var(--danger)] hover:underline"
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Gap */}
          <div>
            <label className="text-[10px] font-medium text-[var(--text-muted)] mb-1 block">Abstand (Gap)</label>
            <div className="flex gap-1">
              {GAP_OPTIONS.map((g) => (
                <button
                  key={g.value}
                  onClick={() => setGap(g.value)}
                  className={`px-2 py-0.5 text-[10px] rounded border transition-colors ${
                    gap === g.value
                      ? 'border-[var(--primary)] bg-[var(--primary)]/5 text-[var(--primary)]'
                      : 'border-[var(--border)] hover:border-[var(--primary)]'
                  }`}
                >
                  {g.label}
                </button>
              ))}
            </div>
          </div>

          {/* Mobile columns */}
          <div>
            <label className="text-[10px] font-medium text-[var(--text-muted)] mb-1 block">
              Mobil (sm) — Spalten
            </label>
            <select
              value={mobileColumns.join(', ')}
              onChange={(e) => setMobileColumns(e.target.value.split(',').map(s => s.trim()))}
              className="w-full text-xs px-2 py-1 border border-[var(--border)] rounded"
            >
              <option value="1fr">1 Spalte</option>
              <option value="1fr, 1fr">2 Spalten</option>
            </select>
          </div>

          {/* Apply button */}
          <button
            onClick={applyCustom}
            className="w-full px-3 py-1.5 text-xs font-medium bg-[var(--primary)] text-white rounded-md hover:opacity-90 transition-opacity"
          >
            Layout anwenden
          </button>
        </div>
      )}
    </div>
  );
}
