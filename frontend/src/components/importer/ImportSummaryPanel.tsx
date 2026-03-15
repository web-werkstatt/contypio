import { AlertTriangle, FileText, Image, Blocks, CheckCircle } from 'lucide-react';
import type { ImportSummary } from './types';

interface Props {
  summary: ImportSummary;
}

export default function ImportSummaryPanel({ summary }: Props) {
  return (
    <div className="space-y-4">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
        Zusammenfassung
      </h3>

      {/* Projekt-Zahlen */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="flex items-center gap-1.5 text-[var(--text-muted)]">
            <FileText size={13} /> Seiten
          </span>
          <span className="font-medium">{summary.scrapedPages}/{summary.totalPages}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="flex items-center gap-1.5 text-[var(--text-muted)]">
            <Blocks size={13} /> Blöcke
          </span>
          <span className="font-medium">{summary.totalBlocks}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="flex items-center gap-1.5 text-[var(--text-muted)]">
            <Image size={13} /> Sections
          </span>
          <span className="font-medium">{summary.totalSections}</span>
        </div>
        {summary.importedPages > 0 && (
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-1.5 text-green-600">
              <CheckCircle size={13} /> Importiert
            </span>
            <span className="font-medium text-green-600">{summary.importedPages}</span>
          </div>
        )}
      </div>

      {/* Block-Typen */}
      {Object.keys(summary.blockCounts).length > 0 && (
        <div>
          <h4 className="text-xs font-medium text-[var(--text-muted)] mb-1.5">Erkannte Blöcke</h4>
          <div className="space-y-1">
            {Object.entries(summary.blockCounts)
              .sort(([, a], [, b]) => b - a)
              .map(([type, count]) => (
                <div key={type} className="flex items-center justify-between text-xs">
                  <span className="text-[var(--text-muted)]">{type}</span>
                  <span className="font-mono bg-gray-100 px-1.5 py-0.5 rounded">{count}</span>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Warnungen */}
      {summary.warnings.length > 0 && (
        <div>
          <h4 className="text-xs font-medium text-amber-600 mb-1.5 flex items-center gap-1">
            <AlertTriangle size={12} /> Warnungen ({summary.warnings.length})
          </h4>
          <div className="space-y-1">
            {summary.warnings.map((w, i) => (
              <p key={i} className="text-xs text-amber-700 bg-amber-50 px-2 py-1 rounded">
                {w}
              </p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
