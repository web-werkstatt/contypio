import { Globe, ArrowRight } from 'lucide-react';

interface Props {
  sourceUrl: string;
  onSourceUrlChange(url: string): void;
  onNext(): void;
}

export default function StepSource({ sourceUrl, onSourceUrlChange, onNext }: Props) {
  return (
    <div className="max-w-xl">
      <h2 className="text-lg font-semibold mb-1">Quelle verbinden</h2>
      <p className="text-sm text-[var(--text-muted)] mb-6">
        Geben Sie die URL der Website ein, die analysiert und in CMS-Blöcke konvertiert werden soll.
      </p>

      <div className="space-y-4">
        <div>
          <label className="block text-xs font-medium mb-1.5">Website-URL</label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Globe size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
              <input
                value={sourceUrl}
                onChange={(e) => onSourceUrlChange(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 border border-[var(--border)] rounded-lg text-sm"
                placeholder="https://preview.ir-tours.de"
              />
            </div>
          </div>
          <p className="text-xs text-[var(--text-muted)] mt-1.5">
            Die Seiten werden von dieser URL gescrapt und die HTML-Struktur analysiert.
          </p>
        </div>

        <div className="bg-blue-50 border border-blue-100 rounded-lg p-3">
          <p className="text-xs text-blue-800">
            <strong>Hinweis:</strong> Der Importer analysiert die gerenderte HTML-Ausgabe und erkennt
            automatisch Sections, Layouts und Block-Typen wie Rich Text, FAQ, Karten, CTAs und mehr.
          </p>
        </div>

        <button
          onClick={onNext}
          disabled={!sourceUrl.trim()}
          className="flex items-center gap-2 px-5 py-2.5 bg-[var(--primary)] text-white rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
        >
          Seiten analysieren <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );
}
