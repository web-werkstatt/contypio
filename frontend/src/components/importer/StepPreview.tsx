import { useState, useEffect } from 'react';
import { ArrowRight, Eye, CheckSquare, Square, Image, LayoutGrid } from 'lucide-react';
import type { PageScrapeResult, SectionData } from './types';

interface Props {
  pageResults: Record<string, PageScrapeResult>;
  sectionSelection: Record<string, number[]>;
  onToggleSection(path: string, index: number): void;
  onSelectAll(path: string, count: number): void;
  onNext(): void;
}

const BLOCK_ICONS: Record<string, string> = {
  richText: 'T', image: 'I', gallery: 'G', cta: 'C', cards: 'K',
  faq: 'F', hero: 'H', heroSlider: 'HS', video: 'V', newsletter: 'N',
  form: 'Fo', table: 'Ta', team: 'Te', featuredTrips: 'FT',
};

function SectionCard({
  section, index, selected, onToggle,
}: {
  section: SectionData; index: number; selected: boolean; onToggle(): void;
}) {
  const colCount = section.columns.length;

  return (
    <div
      className={`border rounded-lg overflow-hidden transition-colors cursor-pointer ${
        selected ? 'border-[var(--primary)] bg-blue-50/30' : 'border-gray-200 hover:border-gray-300'
      }`}
      onClick={onToggle}
    >
      <div className="bg-gray-50 px-3 py-1.5 flex items-center gap-2 border-b border-gray-200">
        {selected
          ? <CheckSquare size={14} className="text-[var(--primary)] shrink-0" />
          : <Square size={14} className="text-gray-300 shrink-0" />
        }
        <span className="text-xs font-medium">Section {index + 1}</span>
        <span className="text-[10px] font-mono text-[var(--text-muted)] ml-auto flex items-center gap-1.5">
          <LayoutGrid size={10} /> {section.layout}
          {colCount > 1 && <span>({colCount} Spalten)</span>}
        </span>
      </div>
      <div className="p-2 space-y-1">
        {section.columns.map((col, ci) => (
          <div key={col.id} className={colCount > 1 ? 'pl-2 border-l-2 border-gray-200' : ''}>
            {colCount > 1 && (
              <span className="text-[10px] text-[var(--text-muted)]">Spalte {ci + 1}</span>
            )}
            {col.blocks.map((block) => (
              <div key={block.id} className="flex items-center gap-2 px-2 py-1 rounded text-xs">
                <span className="w-5 h-5 rounded bg-blue-100 text-blue-600 flex items-center justify-center text-[10px] font-bold shrink-0">
                  {BLOCK_ICONS[block.blockType] || '?'}
                </span>
                <span className="font-medium text-blue-700">{block.blockType}</span>
                {typeof block.data.title === 'string' && block.data.title && (
                  <span className="text-[var(--text-muted)] truncate">{block.data.title}</span>
                )}
                {block.blockType === 'gallery' && Array.isArray(block.data.images) && (
                  <span className="text-[var(--text-muted)] flex items-center gap-0.5">
                    <Image size={10} /> {(block.data.images as unknown[]).length}
                  </span>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function StepPreview({ pageResults, sectionSelection, onToggleSection, onSelectAll, onNext }: Props) {
  const donePages = Object.entries(pageResults).filter(([, r]) => r.status === 'done' && r.result);
  const [activePath, setActivePath] = useState(donePages[0]?.[0] || '');
  const activeResult = pageResults[activePath]?.result;
  const selected = sectionSelection[activePath] || [];

  // Auto-select all sections for new pages
  useEffect(() => {
    for (const [path, pr] of donePages) {
      if (!sectionSelection[path] && pr.result) {
        onSelectAll(path, pr.result.sections.length);
      }
    }
  }, [donePages.length]);

  const allSelected = activeResult ? selected.length === activeResult.sections.length : false;
  const selectedCount = selected.length;

  return (
    <div>
      <h2 className="text-lg font-semibold mb-1">Vorschau prüfen</h2>
      <p className="text-sm text-[var(--text-muted)] mb-4">
        Sections an-/abwählen um nur bestimmte Bereiche zu importieren.
      </p>

      <div className="flex gap-4">
        {/* Seiten-Liste links */}
        <div className="w-48 shrink-0 space-y-0.5">
          {donePages.map(([path, pr]) => {
            const sel = sectionSelection[path] || [];
            const total = pr.result?.sections.length || 0;
            return (
              <button
                key={path}
                onClick={() => setActivePath(path)}
                className={`w-full text-left px-2.5 py-1.5 rounded text-xs transition-colors ${
                  activePath === path
                    ? 'bg-[var(--primary-light)] text-[var(--primary)] font-medium'
                    : 'text-[var(--text-muted)] hover:bg-gray-100'
                }`}
              >
                {path}
                <span className="block text-[10px] opacity-70">{sel.length}/{total} Sections</span>
              </button>
            );
          })}
        </div>

        {/* Vorschau rechts */}
        <div className="flex-1 border border-[var(--border)] rounded-lg overflow-hidden">
          {activeResult ? (
            <div>
              <div className="bg-gray-50 px-4 py-2 border-b border-[var(--border)] flex items-center gap-2">
                <Eye size={14} className="text-[var(--text-muted)]" />
                <span className="text-sm font-medium">{activePath}</span>
                <span className="text-xs text-[var(--text-muted)] ml-auto">
                  {selectedCount}/{activeResult.sections.length} Sections ausgewählt
                </span>
                <button
                  onClick={() => {
                    if (allSelected) {
                      // Deselect all by setting empty
                      onSelectAll(activePath, 0);
                    } else {
                      onSelectAll(activePath, activeResult.sections.length);
                    }
                  }}
                  className="text-xs text-[var(--primary)] hover:underline ml-2"
                >
                  {allSelected ? 'Keine' : 'Alle'}
                </button>
              </div>
              <div className="p-3 space-y-2 max-h-[500px] overflow-auto">
                {activeResult.sections.map((section, si) => (
                  <SectionCard
                    key={section.id}
                    section={section}
                    index={si}
                    selected={selected.includes(si)}
                    onToggle={() => onToggleSection(activePath, si)}
                  />
                ))}
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-sm text-[var(--text-muted)]">
              Wählen Sie eine Seite aus
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-3 mt-4">
        <button
          onClick={onNext}
          disabled={Object.values(sectionSelection).every((s) => s.length === 0)}
          className="flex items-center gap-2 px-5 py-2.5 bg-[var(--primary)] text-white rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50"
        >
          Import starten <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );
}
