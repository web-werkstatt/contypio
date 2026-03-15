import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import type { PageScrapeResult, CmsPage } from './types';

interface Props {
  pageResults: Record<string, PageScrapeResult>;
  cmsPages: CmsPage[];
  isImporting: boolean;
  importProgress: Record<string, 'pending' | 'importing' | 'done' | 'error'>;
  onStartImport(): void;
  onNext(): void;
}

export default function StepImport({ pageResults, cmsPages, isImporting, importProgress, onStartImport, onNext }: Props) {
  const donePages = Object.entries(pageResults).filter(([, r]) => r.status === 'done' && r.result);
  const totalPages = donePages.length;
  const importedCount = Object.values(importProgress).filter((s) => s === 'done').length;
  const errorCount = Object.values(importProgress).filter((s) => s === 'error').length;
  const progress = totalPages > 0 ? Math.round((importedCount / totalPages) * 100) : 0;
  const allDone = importedCount + errorCount === totalPages && totalPages > 0;

  return (
    <div className="max-w-2xl">
      <h2 className="text-lg font-semibold mb-1">Import durchführen</h2>
      <p className="text-sm text-[var(--text-muted)] mb-6">
        Die erkannten Blöcke werden jetzt in die CMS-Seiten importiert.
      </p>

      {/* Fortschrittsbalken */}
      {isImporting || allDone ? (
        <div className="mb-6">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="font-medium">
              {allDone ? 'Import abgeschlossen' : 'Import läuft...'}
            </span>
            <span className="text-[var(--text-muted)]">{progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className={`h-3 rounded-full transition-all duration-300 ${allDone ? 'bg-green-500' : 'bg-[var(--primary)]'}`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      ) : null}

      {/* Seiten-Status */}
      <div className="border border-[var(--border)] rounded-lg overflow-hidden mb-6">
        {donePages.map(([path, pr]) => {
          const cmsPage = cmsPages.find((p) => p.path === path);
          const status = importProgress[path] || 'pending';

          return (
            <div key={path} className="flex items-center gap-3 px-3 py-2.5 border-b border-[var(--border)] last:border-b-0">
              {status === 'importing' && <Loader2 size={14} className="animate-spin text-blue-500 shrink-0" />}
              {status === 'done' && <CheckCircle size={14} className="text-green-500 shrink-0" />}
              {status === 'error' && <XCircle size={14} className="text-red-500 shrink-0" />}
              {status === 'pending' && <div className="w-3.5 h-3.5 rounded-full bg-gray-200 shrink-0" />}

              <span className="font-mono text-xs flex-1">{path}</span>
              <span className="text-xs text-[var(--text-muted)]">
                {pr.result?.section_count}S / {pr.result?.block_count}B
              </span>
              {!cmsPage && (
                <span className="text-xs text-amber-500">Keine CMS-Seite</span>
              )}
            </div>
          );
        })}
      </div>

      {/* Aktionen */}
      {!isImporting && !allDone && (
        <button
          onClick={onStartImport}
          className="flex items-center gap-2 px-5 py-2.5 bg-[var(--primary)] text-white rounded-lg text-sm font-medium hover:opacity-90"
        >
          Jetzt importieren ({totalPages} Seiten)
        </button>
      )}
      {allDone && (
        <button
          onClick={onNext}
          className="flex items-center gap-2 px-5 py-2.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:opacity-90"
        >
          <CheckCircle size={14} /> Ergebnis anzeigen
        </button>
      )}
    </div>
  );
}
