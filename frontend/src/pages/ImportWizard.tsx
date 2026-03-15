import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import {
  ArrowLeft, ArrowRight, Upload, Database, FileJson, Check, AlertCircle,
  Loader2, Download, CheckCircle2,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '@/lib/api';

interface Provider {
  slug: string;
  name: string;
  description: string;
  config_fields: { name: string; label: string; type: string; required: boolean; placeholder: string }[];
}

interface Manifest {
  globals: { key: string; label: string; field_count: number }[];
  collections: { key: string; label: string; count: number }[];
  pages: { count: number; has_tree: boolean };
  media: { count: number; total_size_bytes: number };
}

interface ImportResultData {
  success: boolean;
  globals_created: number;
  globals_updated: number;
  pages_created: number;
  pages_updated: number;
  collections_created: number;
  items_created: number;
  media_uploaded: number;
  total_imported: number;
  errors: string[];
  warnings: string[];
}

const PROVIDER_ICONS: Record<string, typeof Database> = {
  payload: Database,
  json: FileJson,
};

export default function ImportWizard() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [provider, setProvider] = useState<Provider | null>(null);
  const [config, setConfig] = useState<Record<string, string>>({});
  const [connectionOk, setConnectionOk] = useState(false);
  const [connectionMsg, setConnectionMsg] = useState('');
  const [manifest, setManifest] = useState<Manifest | null>(null);
  const [selectedGlobals, setSelectedGlobals] = useState<string[]>([]);
  const [selectedCollections, setSelectedCollections] = useState<string[]>([]);
  const [importPages, setImportPages] = useState(false);
  const [conflict, setConflict] = useState('skip');
  const [result, setResult] = useState<ImportResultData | null>(null);
  const [jsonFileData, setJsonFileData] = useState<object | null>(null);

  // Fetch providers
  const [providers, setProviders] = useState<Provider[]>([]);
  const loadProviders = useMutation({
    mutationFn: async () => (await api.get('/api/import/providers')).data,
    onSuccess: (data) => setProviders(data),
  });

  if (providers.length === 0 && !loadProviders.isPending) {
    loadProviders.mutate();
  }

  // Test connection
  const testConnection = useMutation({
    mutationFn: async () => {
      const effectiveConfig = provider?.slug === 'json' && jsonFileData
        ? { ...config, data: jsonFileData }
        : config;
      return (await api.post('/api/import/test-connection', {
        provider: provider?.slug, config: effectiveConfig,
      })).data;
    },
    onSuccess: (data: { ok: boolean; message: string }) => {
      setConnectionOk(data.ok);
      setConnectionMsg(data.message);
    },
  });

  // Discover
  const discover = useMutation({
    mutationFn: async () => {
      const effectiveConfig = provider?.slug === 'json' && jsonFileData
        ? { ...config, data: jsonFileData }
        : config;
      return (await api.post('/api/import/discover', {
        provider: provider?.slug, config: effectiveConfig,
      })).data;
    },
    onSuccess: (data: Manifest) => {
      setManifest(data);
      setSelectedGlobals(data.globals.map((g) => g.key));
      setSelectedCollections(data.collections.map((c) => c.key));
      setImportPages(data.pages.count > 0);
      setStep(3);
    },
  });

  // Execute import
  const executeImport = useMutation({
    mutationFn: async () => {
      const effectiveConfig = provider?.slug === 'json' && jsonFileData
        ? { ...config, data: jsonFileData }
        : config;
      return (await api.post('/api/import/execute', {
        provider: provider?.slug,
        config: effectiveConfig,
        mapping: {
          globals: selectedGlobals,
          collections: selectedCollections,
          import_pages: importPages,
          import_media: false,
          conflict,
        },
      })).data;
    },
    onSuccess: (data: ImportResultData) => {
      setResult(data);
      setStep(4);
    },
  });

  // Export
  const exportData = useMutation({
    mutationFn: async () => {
      const res = await api.get('/api/export/full');
      const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cms-export-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    },
  });

  const handleJsonUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    try {
      const data = JSON.parse(text);
      setJsonFileData(data);
      setConnectionOk(true);
      setConnectionMsg(`${file.name} geladen (${(file.size / 1024).toFixed(0)} KB)`);
    } catch {
      setConnectionOk(false);
      setConnectionMsg('Ungueltiges JSON');
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-[var(--text)]">Daten importieren</h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">
            Schritt {step} von 4
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => exportData.mutate()}
            disabled={exportData.isPending}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-[var(--border)] rounded-md hover:bg-[var(--bg-hover)] text-[var(--text-muted)]"
          >
            <Download size={14} />
            Export
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="flex gap-1 mb-8">
        {[1, 2, 3, 4].map((s) => (
          <div
            key={s}
            className={`h-1 flex-1 rounded-full ${
              s <= step ? 'bg-blue-500' : 'bg-[var(--border)]'
            }`}
          />
        ))}
      </div>

      {/* Step 1: Choose provider */}
      {step === 1 && (
        <div>
          <h2 className="text-base font-medium text-[var(--text)] mb-4">Quelle waehlen</h2>
          <div className="grid grid-cols-2 gap-3">
            {providers.map((p) => {
              const Icon = PROVIDER_ICONS[p.slug] || Database;
              return (
                <button
                  key={p.slug}
                  onClick={() => {
                    setProvider(p);
                    setConfig({});
                    setConnectionOk(false);
                    setConnectionMsg('');
                    setJsonFileData(null);
                    setStep(2);
                  }}
                  className={`p-4 border rounded-lg text-left hover:border-blue-500 hover:bg-blue-500/5 transition-colors ${
                    provider?.slug === p.slug
                      ? 'border-blue-500 bg-blue-500/5'
                      : 'border-[var(--border)]'
                  }`}
                >
                  <Icon size={20} className="text-blue-500 mb-2" />
                  <div className="font-medium text-sm text-[var(--text)]">{p.name}</div>
                  <div className="text-xs text-[var(--text-muted)] mt-1">{p.description}</div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Step 2: Connect */}
      {step === 2 && provider && (
        <div>
          <h2 className="text-base font-medium text-[var(--text)] mb-4">
            Verbindung: {provider.name}
          </h2>

          {provider.slug === 'json' ? (
            <div className="space-y-4">
              <label className="block">
                <span className="text-sm text-[var(--text-muted)]">JSON-Datei hochladen</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleJsonUpload}
                  className="mt-1 block w-full text-sm file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border file:border-[var(--border)] file:text-sm file:bg-[var(--bg)] file:text-[var(--text)] hover:file:bg-[var(--bg-hover)]"
                />
              </label>
            </div>
          ) : (
            <div className="space-y-3">
              {provider.config_fields.map((field) => (
                <label key={field.name} className="block">
                  <span className="text-sm text-[var(--text-muted)]">
                    {field.label} {field.required && <span className="text-red-400">*</span>}
                  </span>
                  <input
                    type={field.type === 'url' ? 'url' : 'text'}
                    placeholder={field.placeholder}
                    value={config[field.name] || ''}
                    onChange={(e) => setConfig({ ...config, [field.name]: e.target.value })}
                    className="mt-1 w-full px-3 py-2 bg-[var(--bg)] border border-[var(--border)] rounded-md text-sm text-[var(--text)] focus:border-blue-500 focus:outline-none"
                  />
                </label>
              ))}
              <button
                onClick={() => testConnection.mutate()}
                disabled={testConnection.isPending}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-[var(--bg-hover)] border border-[var(--border)] rounded-md hover:bg-[var(--border)] text-[var(--text)]"
              >
                {testConnection.isPending ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                Verbindung testen
              </button>
            </div>
          )}

          {connectionMsg && (
            <div className={`mt-4 p-3 rounded-md text-sm flex items-center gap-2 ${
              connectionOk
                ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                : 'bg-red-500/10 text-red-400 border border-red-500/20'
            }`}>
              {connectionOk ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
              {connectionMsg}
            </div>
          )}

          <div className="flex justify-between mt-6">
            <button
              onClick={() => setStep(1)}
              className="flex items-center gap-1 text-sm text-[var(--text-muted)] hover:text-[var(--text)]"
            >
              <ArrowLeft size={14} /> Zurück
            </button>
            <button
              onClick={() => discover.mutate()}
              disabled={!connectionOk || discover.isPending}
              className="flex items-center gap-1.5 px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-40"
            >
              {discover.isPending ? <Loader2 size={14} className="animate-spin" /> : <ArrowRight size={14} />}
              Weiter: Daten analysieren
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Select what to import */}
      {step === 3 && manifest && (
        <div>
          <h2 className="text-base font-medium text-[var(--text)] mb-4">Import-Auswahl</h2>

          {/* Globals */}
          {manifest.globals.length > 0 && (
            <div className="mb-5">
              <h3 className="text-sm font-medium text-[var(--text-muted)] mb-2">
                Globals ({manifest.globals.length})
              </h3>
              <div className="space-y-1">
                {manifest.globals.map((g) => (
                  <label key={g.key} className="flex items-center gap-2 p-2 rounded hover:bg-[var(--bg-hover)] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedGlobals.includes(g.key)}
                      onChange={(e) => {
                        setSelectedGlobals(e.target.checked
                          ? [...selectedGlobals, g.key]
                          : selectedGlobals.filter((k) => k !== g.key));
                      }}
                      className="rounded"
                    />
                    <span className="text-sm text-[var(--text)]">{g.label}</span>
                    <span className="text-xs text-[var(--text-muted)]">({g.field_count} Felder)</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Collections */}
          {manifest.collections.length > 0 && (
            <div className="mb-5">
              <h3 className="text-sm font-medium text-[var(--text-muted)] mb-2">
                Collections ({manifest.collections.length})
              </h3>
              <div className="space-y-1">
                {manifest.collections.map((c) => (
                  <label key={c.key} className="flex items-center gap-2 p-2 rounded hover:bg-[var(--bg-hover)] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedCollections.includes(c.key)}
                      onChange={(e) => {
                        setSelectedCollections(e.target.checked
                          ? [...selectedCollections, c.key]
                          : selectedCollections.filter((k) => k !== c.key));
                      }}
                      className="rounded"
                    />
                    <span className="text-sm text-[var(--text)]">{c.label}</span>
                    <span className="text-xs text-[var(--text-muted)]">({c.count} Eintraege)</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Pages */}
          {manifest.pages.count > 0 && (
            <div className="mb-5">
              <label className="flex items-center gap-2 p-2 rounded hover:bg-[var(--bg-hover)] cursor-pointer">
                <input
                  type="checkbox"
                  checked={importPages}
                  onChange={(e) => setImportPages(e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm text-[var(--text)]">Pages</span>
                <span className="text-xs text-[var(--text-muted)]">({manifest.pages.count} Seiten)</span>
              </label>
            </div>
          )}

          {/* Conflict strategy */}
          <div className="mb-5">
            <h3 className="text-sm font-medium text-[var(--text-muted)] mb-2">Bei Konflikten</h3>
            <select
              value={conflict}
              onChange={(e) => setConflict(e.target.value)}
              className="w-full px-3 py-2 bg-[var(--bg)] border border-[var(--border)] rounded-md text-sm text-[var(--text)]"
            >
              <option value="skip">Ueberspringen (bestehende Daten behalten)</option>
              <option value="overwrite">Ueberschreiben (Quelle gewinnt)</option>
              <option value="merge">Zusammenfuehren (nur fehlende Felder ergaenzen)</option>
            </select>
          </div>

          <div className="flex justify-between mt-6">
            <button
              onClick={() => setStep(2)}
              className="flex items-center gap-1 text-sm text-[var(--text-muted)] hover:text-[var(--text)]"
            >
              <ArrowLeft size={14} /> Zurück
            </button>
            <button
              onClick={() => executeImport.mutate()}
              disabled={executeImport.isPending ||
                (selectedGlobals.length === 0 && selectedCollections.length === 0 && !importPages)}
              className="flex items-center gap-1.5 px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-40"
            >
              {executeImport.isPending
                ? <><Loader2 size={14} className="animate-spin" /> Importiere...</>
                : <><Upload size={14} /> Import starten</>
              }
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Result */}
      {step === 4 && result && (
        <div>
          <div className={`p-4 rounded-lg border mb-6 ${
            result.success
              ? 'bg-green-500/10 border-green-500/20'
              : 'bg-red-500/10 border-red-500/20'
          }`}>
            <div className="flex items-center gap-2 mb-2">
              {result.success
                ? <CheckCircle2 size={18} className="text-green-400" />
                : <AlertCircle size={18} className="text-red-400" />
              }
              <span className="font-medium text-[var(--text)]">
                {result.success ? 'Import erfolgreich' : 'Import mit Fehlern'}
              </span>
            </div>
            <p className="text-sm text-[var(--text-muted)]">
              {result.total_imported} Eintraege importiert
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            {[
              ['Globals erstellt', result.globals_created],
              ['Globals aktualisiert', result.globals_updated],
              ['Seiten erstellt', result.pages_created],
              ['Collection Items', result.items_created],
            ].filter(([, v]) => (v as number) > 0).map(([label, value]) => (
              <div key={label as string} className="p-3 border border-[var(--border)] rounded-lg">
                <div className="text-lg font-semibold text-[var(--text)]">{value as number}</div>
                <div className="text-xs text-[var(--text-muted)]">{label as string}</div>
              </div>
            ))}
          </div>

          {/* Warnings */}
          {result.warnings.length > 0 && (
            <div className="mb-4">
              <h3 className="text-sm font-medium text-yellow-400 mb-2">Warnungen ({result.warnings.length})</h3>
              <div className="max-h-40 overflow-y-auto text-xs space-y-1 p-3 bg-[var(--bg-hover)] rounded-md">
                {result.warnings.map((w, i) => (
                  <div key={i} className="text-[var(--text-muted)]">{w}</div>
                ))}
              </div>
            </div>
          )}

          {/* Errors */}
          {result.errors.length > 0 && (
            <div className="mb-4">
              <h3 className="text-sm font-medium text-red-400 mb-2">Fehler ({result.errors.length})</h3>
              <div className="max-h-40 overflow-y-auto text-xs space-y-1 p-3 bg-red-500/5 rounded-md border border-red-500/10">
                {result.errors.map((e, i) => (
                  <div key={i} className="text-red-300">{e}</div>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-between mt-6">
            <button
              onClick={() => {
                setStep(1);
                setResult(null);
                setManifest(null);
                setProvider(null);
              }}
              className="flex items-center gap-1 text-sm text-[var(--text-muted)] hover:text-[var(--text)]"
            >
              <ArrowLeft size={14} /> Neuer Import
            </button>
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-1.5 px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Zur Uebersicht
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
