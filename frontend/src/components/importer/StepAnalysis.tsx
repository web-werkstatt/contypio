import { useState, useRef, useEffect } from 'react';
import { Loader2, CheckCircle, XCircle, ArrowRight, RotateCcw } from 'lucide-react';
import type { PageScrapeResult } from './types';

const DEFAULT_PAGES = [
  '/', '/kontakt', '/agb', '/impressum', '/datenschutz', '/ueber-uns', '/service',
  '/busreisen', '/flugreisen', '/kreuzfahrten', '/wanderreisen', '/zugreisen',
  '/individualreisen', '/exklusivreisen', '/incentive-reisen',
  '/europa-reisen', '/asien-reisen', '/afrika-reisen', '/reisen',
];

interface Props {
  pageResults: Record<string, PageScrapeResult>;
  isAnalyzing: boolean;
  onStartAnalysis(paths: string[]): void;
  onNext(): void;
}

function SelectAllCheckbox({ total, selected, disabled, onChange }: {
  total: number;
  selected: number;
  disabled: boolean;
  onChange: (selectAll: boolean) => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const isAll = selected === total;
  const isPartial = selected > 0 && selected < total;

  useEffect(() => {
    if (ref.current) {
      ref.current.indeterminate = isPartial;
    }
  }, [isPartial]);

  return (
    <input
      ref={ref}
      type="checkbox"
      checked={isAll}
      disabled={disabled}
      onChange={() => onChange(!isAll)}
      className="rounded"
      aria-label={isAll ? 'Alle abwählen' : 'Alle auswählen'}
    />
  );
}

export default function StepAnalysis({ pageResults, isAnalyzing, onStartAnalysis, onNext }: Props) {
  const [selectedPaths, setSelectedPaths] = useState<string[]>([...DEFAULT_PAGES]);

  const togglePath = (path: string) => {
    setSelectedPaths((prev) =>
      prev.includes(path) ? prev.filter((p) => p !== path) : [...prev, path]
    );
  };

  const allDone = selectedPaths.every((p) => pageResults[p]?.status === 'done');
  const hasResults = Object.values(pageResults).some((r) => r.status === 'done');

  // Statistik-Karten
  const doneResults = Object.values(pageResults).filter((r) => r.status === 'done');
  const totalSections = doneResults.reduce((s, r) => s + (r.result?.section_count || 0), 0);
  const totalBlocks = doneResults.reduce((s, r) => s + (r.result?.block_count || 0), 0);
  const errorCount = Object.values(pageResults).filter((r) => r.status === 'error').length;

  return (
    <div>
      <h2 className="text-lg font-semibold mb-1">Seiten analysieren</h2>
      <p className="text-sm text-[var(--text-muted)] mb-4">
        Wählen Sie die Seiten aus und starten Sie die Analyse. Jede Seite wird analysiert und in CMS-Blöcke konvertiert.
      </p>

      {/* Statistik-Karten */}
      {hasResults && (
        <div className="grid grid-cols-4 gap-3 mb-4">
          <div className="bg-green-50 border border-green-100 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-green-700">{doneResults.length}</p>
            <p className="text-xs text-green-600">Seiten analysiert</p>
          </div>
          <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-blue-700">{totalSections}</p>
            <p className="text-xs text-blue-600">Sections erkannt</p>
          </div>
          <div className="bg-purple-50 border border-purple-100 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-purple-700">{totalBlocks}</p>
            <p className="text-xs text-purple-600">Blöcke erkannt</p>
          </div>
          {errorCount > 0 ? (
            <div className="bg-red-50 border border-red-100 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-red-700">{errorCount}</p>
              <p className="text-xs text-red-600">Fehler</p>
            </div>
          ) : (
            <div className="bg-gray-50 border border-gray-100 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-gray-400">0</p>
              <p className="text-xs text-gray-500">Warnungen</p>
            </div>
          )}
        </div>
      )}

      {/* Seiten-Liste */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          <SelectAllCheckbox
            total={DEFAULT_PAGES.length}
            selected={selectedPaths.length}
            disabled={isAnalyzing}
            onChange={(all) => setSelectedPaths(all ? [...DEFAULT_PAGES] : [])}
          />
          <span className="text-xs font-medium">
            {selectedPaths.length} von {DEFAULT_PAGES.length} Seiten ausgewählt
          </span>
        </div>

        <div className="border border-[var(--border)] rounded-lg overflow-hidden">
          {DEFAULT_PAGES.map((path) => {
            const pr = pageResults[path];
            return (
              <div
                key={path}
                className={`flex items-center gap-3 px-3 py-2 text-sm border-b border-[var(--border)] last:border-b-0 ${
                  pr?.status === 'done' ? 'bg-green-50/50' : pr?.status === 'error' ? 'bg-red-50/50' : ''
                }`}
              >
                <input
                  type="checkbox"
                  checked={selectedPaths.includes(path)}
                  onChange={() => togglePath(path)}
                  className="rounded"
                  disabled={isAnalyzing}
                />
                <span className="font-mono text-xs flex-1">{path === '/' ? '/ (Startseite)' : path}</span>
                {pr?.status === 'scraping' && <Loader2 size={14} className="animate-spin text-blue-500" />}
                {pr?.status === 'done' && (
                  <span className="flex items-center gap-1 text-xs text-green-600">
                    <CheckCircle size={12} />
                    {pr.result?.section_count}S / {pr.result?.block_count}B
                  </span>
                )}
                {pr?.status === 'error' && (
                  <span className="flex items-center gap-1 text-xs text-red-500" title={pr.error}>
                    <XCircle size={12} /> {pr.error || 'Fehler'}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Aktionen */}
      <div className="flex gap-3">
        <button
          onClick={() => onStartAnalysis(selectedPaths)}
          disabled={selectedPaths.length === 0 || isAnalyzing}
          className="flex items-center gap-2 px-5 py-2.5 bg-[var(--primary)] text-white rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50"
        >
          {isAnalyzing ? (
            <><Loader2 size={14} className="animate-spin" /> Analysiere...</>
          ) : hasResults ? (
            <><RotateCcw size={14} /> Erneut analysieren</>
          ) : (
            <>Analyse starten</>
          )}
        </button>
        {allDone && (
          <button
            onClick={onNext}
            className="flex items-center gap-2 px-5 py-2.5 border border-[var(--primary)] text-[var(--primary)] rounded-lg text-sm font-medium hover:bg-blue-50"
          >
            Weiter zur Zuordnung <ArrowRight size={14} />
          </button>
        )}
      </div>
    </div>
  );
}
