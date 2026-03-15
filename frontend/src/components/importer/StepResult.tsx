import { CheckCircle, AlertTriangle, ExternalLink, RotateCcw, FileDown } from 'lucide-react';
import type { PageScrapeResult, ImportSummary } from './types';

interface Props {
  summary: ImportSummary;
  pageResults: Record<string, PageScrapeResult>;
  onRestart(): void;
}

export default function StepResult({ summary, pageResults, onRestart }: Props) {
  const exportJson = () => {
    const data = Object.fromEntries(
      Object.entries(pageResults)
        .filter(([, r]) => r.result)
        .map(([path, r]) => [path, r.result?.sections])
    );
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `astro-import-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
          <CheckCircle size={24} className="text-green-600" />
        </div>
        <div>
          <h2 className="text-lg font-semibold">Import abgeschlossen</h2>
          <p className="text-sm text-[var(--text-muted)]">
            {summary.importedPages} von {summary.totalPages} Seiten erfolgreich importiert
          </p>
        </div>
      </div>

      {/* Ergebnis-Karten */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-green-50 border border-green-100 rounded-lg p-4 text-center">
          <p className="text-3xl font-bold text-green-700">{summary.importedPages}</p>
          <p className="text-xs text-green-600 mt-1">Seiten importiert</p>
        </div>
        <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 text-center">
          <p className="text-3xl font-bold text-blue-700">{summary.totalSections}</p>
          <p className="text-xs text-blue-600 mt-1">Sections erstellt</p>
        </div>
        <div className="bg-purple-50 border border-purple-100 rounded-lg p-4 text-center">
          <p className="text-3xl font-bold text-purple-700">{summary.totalBlocks}</p>
          <p className="text-xs text-purple-600 mt-1">Blöcke erzeugt</p>
        </div>
      </div>

      {/* Block-Typ Auflistung */}
      <div className="border border-[var(--border)] rounded-lg p-4 mb-6">
        <h3 className="text-sm font-medium mb-3">Block-Typen Übersicht</h3>
        <div className="grid grid-cols-2 gap-1.5">
          {Object.entries(summary.blockCounts)
            .sort(([, a], [, b]) => b - a)
            .map(([type, count]) => (
              <div key={type} className="flex items-center justify-between text-sm py-1 px-2 bg-gray-50 rounded">
                <span>{type}</span>
                <span className="font-mono text-xs font-medium">{count}x</span>
              </div>
            ))}
        </div>
      </div>

      {/* Warnungen */}
      {summary.warnings.length > 0 && (
        <div className="border border-amber-200 bg-amber-50 rounded-lg p-4 mb-6">
          <h3 className="text-sm font-medium text-amber-800 flex items-center gap-1.5 mb-2">
            <AlertTriangle size={14} /> {summary.warnings.length} Hinweise
          </h3>
          <ul className="space-y-1">
            {summary.warnings.map((w, i) => (
              <li key={i} className="text-xs text-amber-700">{w}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Aktionen */}
      <div className="flex flex-wrap gap-3">
        <a
          href="/"
          className="flex items-center gap-2 px-4 py-2 bg-[var(--primary)] text-white rounded-lg text-sm font-medium hover:opacity-90"
        >
          <ExternalLink size={14} /> Importierte Seiten öffnen
        </a>
        <button
          onClick={exportJson}
          className="flex items-center gap-2 px-4 py-2 border border-[var(--border)] rounded-lg text-sm hover:bg-gray-50"
        >
          <FileDown size={14} /> Bericht herunterladen
        </button>
        <button
          onClick={onRestart}
          className="flex items-center gap-2 px-4 py-2 border border-[var(--border)] rounded-lg text-sm hover:bg-gray-50"
        >
          <RotateCcw size={14} /> Erneut importieren
        </button>
      </div>
    </div>
  );
}
