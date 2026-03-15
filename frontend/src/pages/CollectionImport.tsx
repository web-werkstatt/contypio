import { useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Upload, ArrowLeft, ArrowRight, Check, AlertCircle, FileUp } from 'lucide-react';
import api from '@/lib/api';
import type { CollectionSchema } from '@/types/cms';

type Step = 'upload' | 'mapping' | 'result';

interface PreviewData {
  columns: string[];
  rows_preview: Record<string, unknown>[];
  total_rows: number;
}

interface ImportResult {
  created: number;
  updated: number;
  skipped: number;
  errors: string[];
}

export default function CollectionImport() {
  const { key } = useParams<{ key: string }>();
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<PreviewData | null>(null);
  const [allRows, setAllRows] = useState<Record<string, unknown>[]>([]);
  const [fieldMapping, setFieldMapping] = useState<Record<string, string>>({});
  const [titleColumn, setTitleColumn] = useState('');
  const [importStatus, setImportStatus] = useState<'draft' | 'published'>('draft');
  const [conflict, setConflict] = useState<'skip' | 'overwrite'>('skip');
  const [result, setResult] = useState<ImportResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { data: schema } = useQuery<CollectionSchema>({
    queryKey: ['collectionSchema', key],
    queryFn: async () => (await api.get(`/api/collections/${key}/schema`)).data,
  });

  const handleFileSelect = useCallback(async (selectedFile: File) => {
    setFile(selectedFile);
    setError('');
    setLoading(true);

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const res = await api.post(`/api/collections/${key}/items/import/preview`, formData);
      setPreview(res.data);

      // Also read full file for execute step
      const text = await selectedFile.text();
      const ext = selectedFile.name.split('.').pop()?.toLowerCase();
      if (ext === 'json') {
        setAllRows(JSON.parse(text));
      } else {
        // CSV: parse on client too for full rows
        setAllRows(res.data.rows_preview); // will use server rows
      }

      // Auto-mapping
      if (schema && res.data.columns) {
        const fieldNames = schema.fields.map((f) => f.name);
        const autoMap: Record<string, string> = {};
        for (const col of res.data.columns as string[]) {
          if (fieldNames.includes(col)) {
            autoMap[col] = col;
          } else if (col.toLowerCase() === 'title' || col.toLowerCase() === 'titel') {
            autoMap[col] = 'title';
          }
        }
        setFieldMapping(autoMap);

        // Auto-detect title column
        const titleCol = (res.data.columns as string[]).find(
          (c: string) => c.toLowerCase() === 'title' || c.toLowerCase() === 'titel' || c.toLowerCase() === 'name'
        );
        if (titleCol) setTitleColumn(titleCol);
      }

      setStep('mapping');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Fehler beim Parsen der Datei';
      if (typeof err === 'object' && err !== null && 'response' in err) {
        const axiosErr = err as { response?: { data?: { detail?: string } } };
        setError(axiosErr.response?.data?.detail ?? msg);
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  }, [key, schema]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) handleFileSelect(droppedFile);
  }, [handleFileSelect]);

  const handleExecute = async () => {
    if (!titleColumn) {
      setError('Bitte eine Titel-Spalte auswählen');
      return;
    }
    setLoading(true);
    setError('');

    // Read full file for all rows
    let rows = allRows;
    if (file && file.name.endsWith('.csv')) {
      // For CSV: parse all rows client-side
      const text = await file.text();
      const lines = text.split('\n').filter((l) => l.trim());
      if (lines.length > 1) {
        const headers = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, ''));
        rows = lines.slice(1).map((line) => {
          const vals = line.split(',').map((v) => v.trim().replace(/^"|"$/g, ''));
          const obj: Record<string, string> = {};
          headers.forEach((h, i) => { obj[h] = vals[i] ?? ''; });
          return obj;
        });
      }
    }

    try {
      const res = await api.post(`/api/collections/${key}/items/import/execute`, {
        rows,
        field_mapping: fieldMapping,
        title_column: titleColumn,
        status: importStatus,
        conflict,
      });
      setResult(res.data);
      setStep('result');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Import fehlgeschlagen';
      if (typeof err === 'object' && err !== null && 'response' in err) {
        const axiosErr = err as { response?: { data?: { detail?: string } } };
        setError(axiosErr.response?.data?.detail ?? msg);
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const updateMapping = (col: string, targetField: string) => {
    setFieldMapping((prev) => {
      if (!targetField) {
        const next = { ...prev };
        delete next[col];
        return next;
      }
      return { ...prev, [col]: targetField };
    });
  };

  if (!schema) return <div className="p-6 text-sm text-[var(--text-muted)]">Laden...</div>;

  const schemaFieldOptions = [
    { value: '', label: '— Nicht importieren —' },
    { value: 'title', label: 'Titel (Pflichtfeld)' },
    ...schema.fields.map((f) => ({ value: f.name, label: f.label })),
  ];

  return (
    <div className="p-6 max-w-4xl">
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate(`/collections/${key}`)}
          className="p-1.5 text-[var(--text-muted)] hover:text-[var(--text)]"
        >
          <ArrowLeft size={18} />
        </button>
        <h1 className="text-lg font-semibold">
          {schema.label}: Import
        </h1>
      </div>

      {/* Steps indicator */}
      <div className="flex items-center gap-2 mb-6 text-sm">
        {(['upload', 'mapping', 'result'] as const).map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            {i > 0 && <div className="w-8 h-px bg-[var(--border)]" />}
            <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full ${
              step === s ? 'bg-[var(--primary)] text-white' : 'bg-gray-100 text-[var(--text-muted)]'
            }`}>
              <span className="font-medium">{i + 1}</span>
              <span>{s === 'upload' ? 'Datei' : s === 'mapping' ? 'Zuordnung' : 'Ergebnis'}</span>
            </div>
          </div>
        ))}
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 mb-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {/* Step 1: Upload */}
      {step === 'upload' && (
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          className="flex flex-col items-center justify-center gap-4 p-12 border-2 border-dashed border-[var(--border)] rounded-lg hover:border-[var(--primary)] transition-colors cursor-pointer"
          onClick={() => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.csv,.json';
            input.onchange = (e) => {
              const f = (e.target as HTMLInputElement).files?.[0];
              if (f) handleFileSelect(f);
            };
            input.click();
          }}
        >
          {loading ? (
            <div className="text-sm text-[var(--text-muted)]">Datei wird analysiert...</div>
          ) : (
            <>
              <FileUp size={40} className="text-[var(--text-muted)]" />
              <div className="text-center">
                <p className="text-sm font-medium">CSV oder JSON Datei hierhin ziehen</p>
                <p className="text-xs text-[var(--text-muted)] mt-1">oder klicken zum Auswählen (max. 10 MB)</p>
              </div>
            </>
          )}
        </div>
      )}

      {/* Step 2: Mapping */}
      {step === 'mapping' && preview && (
        <div className="space-y-6">
          <div className="text-sm text-[var(--text-muted)]">
            {file?.name} — {preview.total_rows} Zeilen, {preview.columns.length} Spalten
          </div>

          {/* Title column selection */}
          <div>
            <label className="block text-sm font-medium mb-1">Titel-Spalte (Pflicht)</label>
            <select
              value={titleColumn}
              onChange={(e) => setTitleColumn(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-[var(--border)] rounded-md"
            >
              <option value="">— Auswählen —</option>
              {preview.columns.map((col) => (
                <option key={col} value={col}>{col}</option>
              ))}
            </select>
          </div>

          {/* Field mapping table */}
          <div>
            <h3 className="text-sm font-medium mb-2">Spalten-Zuordnung</h3>
            <div className="bg-white border border-[var(--border)] rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--border)] bg-gray-50">
                    <th className="text-left px-4 py-2 font-medium">Quell-Spalte</th>
                    <th className="text-left px-4 py-2 font-medium">→</th>
                    <th className="text-left px-4 py-2 font-medium">Ziel-Feld</th>
                    <th className="text-left px-4 py-2 font-medium">Vorschau</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.columns.map((col) => (
                    <tr key={col} className="border-b border-[var(--border)] last:border-0">
                      <td className="px-4 py-2 font-mono text-xs">{col}</td>
                      <td className="px-4 py-2 text-[var(--text-muted)]">→</td>
                      <td className="px-4 py-2">
                        <select
                          value={fieldMapping[col] ?? ''}
                          onChange={(e) => updateMapping(col, e.target.value)}
                          className="w-full px-2 py-1 text-sm border border-[var(--border)] rounded"
                        >
                          {schemaFieldOptions.map((opt) => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-2 text-xs text-[var(--text-muted)] max-w-[200px] truncate">
                        {String(preview.rows_preview[0]?.[col] ?? '')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Options */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Status</label>
              <select
                value={importStatus}
                onChange={(e) => setImportStatus(e.target.value as 'draft' | 'published')}
                className="w-full px-3 py-2 text-sm border border-[var(--border)] rounded-md"
              >
                <option value="draft">Entwurf</option>
                <option value="published">Veröffentlicht</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Bei Duplikaten</label>
              <select
                value={conflict}
                onChange={(e) => setConflict(e.target.value as 'skip' | 'overwrite')}
                className="w-full px-3 py-2 text-sm border border-[var(--border)] rounded-md"
              >
                <option value="skip">Überspringen</option>
                <option value="overwrite">Überschreiben</option>
              </select>
            </div>
          </div>

          {/* Preview mapped rows */}
          {preview.rows_preview.length > 0 && titleColumn && (
            <div>
              <h3 className="text-sm font-medium mb-2">Vorschau (erste {preview.rows_preview.length} Zeilen)</h3>
              <div className="bg-gray-50 border border-[var(--border)] rounded-lg p-3 text-xs space-y-2 max-h-48 overflow-auto">
                {preview.rows_preview.map((row, i) => (
                  <div key={i} className="flex gap-4">
                    <span className="text-[var(--text-muted)] w-6">{i + 1}.</span>
                    <span className="font-medium">{String(row[titleColumn] ?? '—')}</span>
                    <span className="text-[var(--text-muted)]">
                      {Object.entries(fieldMapping)
                        .filter(([src]) => src !== titleColumn)
                        .map(([src, tgt]) => `${tgt}: ${String(row[src] ?? '')}`)
                        .join(' | ')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-between">
            <button
              onClick={() => { setStep('upload'); setPreview(null); setFile(null); }}
              className="flex items-center gap-1.5 px-4 py-2 text-sm border border-[var(--border)] rounded-md hover:bg-gray-50"
            >
              <ArrowLeft size={14} /> Zurück
            </button>
            <button
              onClick={handleExecute}
              disabled={loading || !titleColumn}
              className="flex items-center gap-1.5 px-4 py-2 text-sm bg-[var(--primary)] text-white rounded-md hover:opacity-90 disabled:opacity-50"
            >
              {loading ? 'Importiere...' : (
                <>
                  <Upload size={14} /> {preview.total_rows} Einträge importieren
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Result */}
      {step === 'result' && result && (
        <div className="space-y-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <Check size={18} className="text-green-600" />
              <span className="font-medium text-green-800">Import abgeschlossen</span>
            </div>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div className="text-center p-3 bg-white rounded-lg">
                <div className="text-2xl font-bold text-green-600">{result.created}</div>
                <div className="text-[var(--text-muted)]">Erstellt</div>
              </div>
              <div className="text-center p-3 bg-white rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{result.updated}</div>
                <div className="text-[var(--text-muted)]">Aktualisiert</div>
              </div>
              <div className="text-center p-3 bg-white rounded-lg">
                <div className="text-2xl font-bold text-gray-500">{result.skipped}</div>
                <div className="text-[var(--text-muted)]">Übersprungen</div>
              </div>
            </div>
          </div>

          {result.errors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h3 className="text-sm font-medium text-red-800 mb-2">Fehler ({result.errors.length})</h3>
              <ul className="text-xs text-red-700 space-y-1 max-h-32 overflow-auto">
                {result.errors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>
          )}

          <button
            onClick={() => navigate(`/collections/${key}`)}
            className="flex items-center gap-1.5 px-4 py-2 text-sm bg-[var(--primary)] text-white rounded-md hover:opacity-90"
          >
            <ArrowRight size={14} /> Zur Collection
          </button>
        </div>
      )}
    </div>
  );
}
