import { X, History, ChevronLeft, ChevronRight } from 'lucide-react';
import type { Section } from '@/types/cms';
import { BLOCK_TYPES } from '@/types/cms';

interface Props {
  historyLength: number;
  historyPosition: number;
  currentSections: Section[];
  savedSections: Section[];
  onGoToRevision: (position: number) => void;
  onClose: () => void;
}

interface DiffEntry {
  type: 'added' | 'removed' | 'changed' | 'moved';
  label: string;
}

function getBlockLabel(blockType: string): string {
  return BLOCK_TYPES.find((bt) => bt.type_key === blockType)?.label ?? blockType;
}

function countBlocks(sections: Section[]): number {
  return sections.reduce((sum, s) => sum + s.columns.reduce((cs, c) => cs + c.blocks.length, 0), 0);
}

function computeDiff(current: Section[], saved: Section[]): DiffEntry[] {
  const diffs: DiffEntry[] = [];

  // Section count changes
  if (current.length !== saved.length) {
    const diff = current.length - saved.length;
    if (diff > 0) diffs.push({ type: 'added', label: `${diff} Sektion${diff > 1 ? 'en' : ''} hinzugefuegt` });
    else diffs.push({ type: 'removed', label: `${Math.abs(diff)} Sektion${Math.abs(diff) > 1 ? 'en' : ''} entfernt` });
  }

  // Block-level comparison
  const currentBlocks = current.flatMap((s) => s.columns.flatMap((c) => c.blocks));
  const savedBlocks = saved.flatMap((s) => s.columns.flatMap((c) => c.blocks));

  const currentIds = new Set(currentBlocks.map((b) => b.id));
  const savedIds = new Set(savedBlocks.map((b) => b.id));

  const added = currentBlocks.filter((b) => !savedIds.has(b.id));
  const removed = savedBlocks.filter((b) => !currentIds.has(b.id));

  // Check for data changes in shared blocks
  const savedMap = new Map(savedBlocks.map((b) => [b.id, b]));
  const shared = currentBlocks.filter((b) => savedIds.has(b.id));
  const changed = shared.filter((b) => {
    const old = savedMap.get(b.id);
    return old && JSON.stringify(old.data) !== JSON.stringify(b.data);
  });

  added.forEach((b) => diffs.push({ type: 'added', label: `${getBlockLabel(b.blockType)} hinzugefuegt` }));
  removed.forEach((b) => diffs.push({ type: 'removed', label: `${getBlockLabel(b.blockType)} entfernt` }));
  changed.forEach((b) => diffs.push({ type: 'changed', label: `${getBlockLabel(b.blockType)} geaendert` }));

  // Layout changes
  const currentLayouts = current.map((s) => s.layout);
  const savedLayouts = saved.map((s) => s.layout);
  const layoutChanges = currentLayouts.filter((l, i) => i < savedLayouts.length && savedLayouts[i] !== l).length;
  if (layoutChanges > 0) diffs.push({ type: 'changed', label: `${layoutChanges} Layout${layoutChanges > 1 ? 's' : ''} geaendert` });

  return diffs;
}

const DIFF_STYLES: Record<DiffEntry['type'], string> = {
  added: 'text-green-700 bg-green-50',
  removed: 'text-red-700 bg-red-50',
  changed: 'text-blue-700 bg-blue-50',
  moved: 'text-amber-700 bg-amber-50',
};

const DIFF_PREFIX: Record<DiffEntry['type'], string> = {
  added: '+',
  removed: '-',
  changed: '~',
  moved: '\u21D5',
};

export default function RevisionSlider({ historyLength, historyPosition, currentSections, savedSections, onGoToRevision, onClose }: Props) {
  if (historyLength === 0) return null;

  const maxPos = historyLength;
  // Compare current viewed revision against saved (server) state
  const diffs = computeDiff(currentSections, savedSections);

  return (
    <div className="border-b border-[var(--border)] bg-gray-50 px-6 py-3">
      <div className="flex items-center gap-3">
        <History size={16} className="text-[var(--text-muted)] shrink-0" />

        {/* Step back/forward buttons */}
        <button
          onClick={() => onGoToRevision(Math.min(historyPosition + 1, maxPos))}
          disabled={historyPosition >= maxPos}
          className="p-1 rounded hover:bg-gray-200 disabled:opacity-30 transition-colors"
          title="Aeltere Version"
        >
          <ChevronLeft size={14} />
        </button>

        {/* Slider */}
        <div className="flex-1 flex items-center gap-2">
          <input
            type="range"
            min={0}
            max={maxPos}
            value={maxPos - historyPosition}
            onChange={(e) => onGoToRevision(maxPos - Number(e.target.value))}
            className="flex-1 accent-[var(--primary)] h-1.5"
          />
        </div>

        <button
          onClick={() => onGoToRevision(Math.max(historyPosition - 1, 0))}
          disabled={historyPosition <= 0}
          className="p-1 rounded hover:bg-gray-200 disabled:opacity-30 transition-colors"
          title="Neuere Version"
        >
          <ChevronRight size={14} />
        </button>

        {/* Position label */}
        <span className="text-xs text-[var(--text-muted)] whitespace-nowrap min-w-[80px] text-center">
          {historyPosition === 0
            ? 'Aktuell'
            : `${historyPosition} von ${maxPos} zurueck`}
        </span>

        {/* Stats */}
        <span className="text-[10px] text-[var(--text-muted)] whitespace-nowrap">
          {currentSections.length} Sek. / {countBlocks(currentSections)} Bl.
        </span>

        <button
          onClick={onClose}
          className="p-1 rounded hover:bg-gray-200 text-[var(--text-muted)] transition-colors"
          title="Versionsvergleich schließen"
        >
          <X size={14} />
        </button>
      </div>

      {/* Diff summary - comparing current view against saved state */}
      {diffs.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2 ml-7">
          {diffs.map((d, i) => (
            <span key={i} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium ${DIFF_STYLES[d.type]}`}>
              <span className="font-mono">{DIFF_PREFIX[d.type]}</span>
              {d.label}
            </span>
          ))}
        </div>
      )}
      {diffs.length === 0 && historyPosition === 0 && (
        <div className="mt-2 ml-7 text-[10px] text-[var(--text-muted)]">
          Keine Aenderungen gegenüber der gespeicherten Version
        </div>
      )}
    </div>
  );
}
