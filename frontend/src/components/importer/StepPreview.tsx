import { useState } from 'react';
import { ArrowRight, Eye, Blocks } from 'lucide-react';
import type { PageScrapeResult } from './types';

interface Props {
  pageResults: Record<string, PageScrapeResult>;
  onNext(): void;
}

export default function StepPreview({ pageResults, onNext }: Props) {
  const donePages = Object.entries(pageResults).filter(([, r]) => r.status === 'done' && r.result);
  const [activePath, setActivePath] = useState(donePages[0]?.[0] || '');

  const activeResult = pageResults[activePath]?.result;

  return (
    <div>
      <h2 className="text-lg font-semibold mb-1">Vorschau prüfen</h2>
      <p className="text-sm text-[var(--text-muted)] mb-4">
        Prüfen Sie die erkannte Block-Struktur jeder Seite vor dem Import.
      </p>

      <div className="flex gap-4">
        {/* Seiten-Liste links */}
        <div className="w-48 shrink-0 space-y-0.5">
          {donePages.map(([path]) => (
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
            </button>
          ))}
        </div>

        {/* Vorschau rechts */}
        <div className="flex-1 border border-[var(--border)] rounded-lg overflow-hidden">
          {activeResult ? (
            <div>
              <div className="bg-gray-50 px-4 py-2 border-b border-[var(--border)] flex items-center gap-2">
                <Eye size={14} className="text-[var(--text-muted)]" />
                <span className="text-sm font-medium">{activePath}</span>
                <span className="text-xs text-[var(--text-muted)] ml-auto">
                  {activeResult.section_count} Sections, {activeResult.block_count} Blöcke
                </span>
              </div>
              <div className="p-4 space-y-3 max-h-[500px] overflow-auto">
                {activeResult.sections.map((section, si) => (
                  <div key={section.id} className="border border-gray-200 rounded-lg overflow-hidden">
                    <div className="bg-gray-50 px-3 py-1.5 text-xs text-[var(--text-muted)] flex items-center justify-between">
                      <span>Section {si + 1}</span>
                      <span className="font-mono">{section.layout}</span>
                    </div>
                    <div className="p-2 space-y-1.5">
                      {section.columns.map((col) =>
                        col.blocks.map((block) => (
                          <div
                            key={block.id}
                            className="flex items-start gap-2 px-2.5 py-2 bg-blue-50/50 border border-blue-100 rounded"
                          >
                            <Blocks size={12} className="text-blue-500 mt-0.5 shrink-0" />
                            <div className="flex-1 min-w-0">
                              <span className="text-xs font-medium text-blue-700">{block.blockType}</span>
                              {typeof block.data.title === 'string' && block.data.title && (
                                <p className="text-xs text-[var(--text-muted)] truncate mt-0.5">
                                  {block.data.title}
                                </p>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
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
          className="flex items-center gap-2 px-5 py-2.5 bg-[var(--primary)] text-white rounded-lg text-sm font-medium hover:opacity-90"
        >
          Import starten <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );
}
