import { useState, useMemo } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles, Compass, Globe, Newspaper, FileText, List, File,
  ArrowLeft, ArrowRight, Loader2, X, Search, Star,
} from 'lucide-react';
import api from '@/lib/api';
import type { PageTypeInfo, PresetStyleInfo } from '@/types/cms';

const PAGE_TYPE_ICONS: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  Sparkles, Compass, Globe, Newspaper, FileText, List, File,
};

/** Gruppierung der Seitentypen nach Kategorie */
const TYPE_GROUPS: { label: string; keys: string[] }[] = [
  { label: 'Marketing', keys: ['homepage', 'landing', 'target'] },
  { label: 'Content', keys: ['magazine', 'content'] },
  { label: 'Struktur', keys: ['listing', 'blank'] },
];

/** Empfohlene Typen werden hervorgehoben */
const RECOMMENDED_KEYS = new Set(['homepage', 'landing', 'content']);

interface Props {
  onClose(): void;
}

export default function PageAssemblyWizard({ onClose }: Props) {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [selectedType, setSelectedType] = useState<PageTypeInfo | null>(null);
  const [selectedPreset, setSelectedPreset] = useState<PresetStyleInfo | null>(null);
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [brand, setBrand] = useState('');
  const [targetAudience, setTargetAudience] = useState('');
  const [tone, setTone] = useState('');
  const [search, setSearch] = useState('');

  const { data: pageTypes } = useQuery<PageTypeInfo[]>({
    queryKey: ['page-types'],
    queryFn: async () => (await api.get('/api/page-types')).data,
  });

  const { data: presets } = useQuery<PresetStyleInfo[]>({
    queryKey: ['page-presets', selectedType?.key],
    queryFn: async () => (await api.get(`/api/page-types/${selectedType!.key}/presets`)).data,
    enabled: !!selectedType && selectedType.key !== 'blank',
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      if (selectedType?.key === 'blank') {
        return (await api.post('/api/pages', { title, slug, path: `/${slug}`, page_type: 'content', seo: {}, sections: [] })).data;
      }
      return (await api.post('/api/pages/from-preset', {
        title, slug, page_type: selectedType!.key,
        preset_key: `${selectedType!.key}:${selectedPreset!.key}`,
        metadata: { title, brand: brand || title, target_audience: targetAudience, tone },
      })).data;
    },
    onSuccess: (data) => {
      navigate(`/pages/${data.id}`, { replace: true });
      onClose();
    },
  });

  const titleToSlug = (t: string) =>
    t.toLowerCase()
      .replace(/[äöüß]/g, (c) => ({ ä: 'ae', ö: 'oe', ü: 'ue', ß: 'ss' })[c] || c)
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

  const handleTitleChange = (val: string) => {
    setTitle(val);
    setSlug(titleToSlug(val));
  };

  const handleSelectType = (pt: PageTypeInfo) => {
    setSelectedType(pt);
    setStep(pt.key === 'blank' ? 3 : 2);
  };

  const handleSelectPreset = (ps: PresetStyleInfo) => {
    setSelectedPreset(ps);
    setStep(3);
  };

  /** Gruppierte und gefilterte Seitentypen */
  const groupedTypes = useMemo(() => {
    if (!pageTypes) return [];
    const q = search.toLowerCase().trim();
    return TYPE_GROUPS.map((group) => {
      const types = group.keys
        .map((key) => pageTypes.find((pt) => pt.key === key))
        .filter((pt): pt is PageTypeInfo => !!pt)
        .filter((pt) => !q || pt.label.toLowerCase().includes(q) || pt.description.toLowerCase().includes(q));
      return { ...group, types };
    }).filter((g) => g.types.length > 0);
  }, [pageTypes, search]);

  /** Ungroupierte Typen (die in keiner Gruppe sind) */
  const ungroupedTypes = useMemo(() => {
    if (!pageTypes) return [];
    const groupedKeys = TYPE_GROUPS.flatMap((g) => g.keys);
    const q = search.toLowerCase().trim();
    return pageTypes
      .filter((pt) => !groupedKeys.includes(pt.key))
      .filter((pt) => !q || pt.label.toLowerCase().includes(q) || pt.description.toLowerCase().includes(q));
  }, [pageTypes, search]);

  const canCreate = title.trim().length > 0 && slug.trim().length > 0;
  const isBlank = selectedType?.key === 'blank';
  const inputClass = 'w-full px-3 py-2.5 text-sm border border-[var(--border)] rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent transition-shadow';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl w-[680px] max-h-[85vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
          <div>
            <h2 className="text-base font-semibold">Neue Seite erstellen</h2>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              {step === 1 && 'Wähle eine Vorlage für deine Seite'}
              {step === 2 && 'Wähle einen Stil'}
              {step === 3 && 'Grunddaten eingeben'}
              {step === 4 && 'Zusammenfassung prüfen'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex gap-1">
              {[1, 2, 3, 4].map((s) => (
                <div
                  key={s}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    s === step ? 'bg-[var(--primary)]' : s < step ? 'bg-[var(--primary)]/40' : 'bg-gray-200'
                  } ${isBlank && s === 2 ? 'hidden' : ''} ${isBlank && s === 4 ? 'hidden' : ''}`}
                />
              ))}
            </div>
            <button onClick={onClose} className="p-1 rounded-md hover:bg-gray-100 text-[var(--text-muted)] hover:text-[var(--text)] transition-colors" title="Schließen">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {/* Step 1: Seitentyp mit Gruppierung + Suche */}
          {step === 1 && (
            <div>
              {/* Suchfeld */}
              <div className="relative mb-5">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Vorlage suchen..."
                  className="w-full pl-10 pr-3 py-2.5 text-sm border border-[var(--border)] rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent transition-shadow"
                  autoFocus
                />
              </div>

              {/* Gruppierte Typen */}
              <div className="space-y-5">
                {groupedTypes.map((group) => (
                  <div key={group.label}>
                    <h3 className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-2 px-1">{group.label}</h3>
                    <div className="grid grid-cols-2 gap-2.5">
                      {group.types.map((pt) => {
                        const Icon = PAGE_TYPE_ICONS[pt.icon] ?? File;
                        const isRecommended = RECOMMENDED_KEYS.has(pt.key);
                        return (
                          <button
                            key={pt.key}
                            onClick={() => handleSelectType(pt)}
                            className={`flex items-start gap-3 p-3.5 rounded-lg border text-left transition-all hover:shadow-sm ${
                              isRecommended
                                ? 'border-[var(--primary)]/30 bg-[var(--primary)]/[0.02] hover:border-[var(--primary)] hover:bg-[var(--primary)]/5'
                                : 'border-[var(--border)] hover:border-[var(--primary)] hover:bg-gray-50'
                            }`}
                          >
                            <span className={`p-2 rounded-lg shrink-0 ${isRecommended ? 'bg-[var(--primary)]/10 text-[var(--primary)]' : 'bg-gray-100 text-gray-500'}`}>
                              <Icon size={18} />
                            </span>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="text-sm font-medium">{pt.label}</span>
                                {isRecommended && <Star size={12} className="text-[var(--primary)] fill-[var(--primary)]" />}
                              </div>
                              <span className="text-xs text-[var(--text-muted)] leading-snug line-clamp-2 mt-0.5 block">{pt.description}</span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}

                {/* Ungroupierte Typen */}
                {ungroupedTypes.length > 0 && (
                  <div>
                    <h3 className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-2 px-1">Weitere</h3>
                    <div className="grid grid-cols-2 gap-2.5">
                      {ungroupedTypes.map((pt) => {
                        const Icon = PAGE_TYPE_ICONS[pt.icon] ?? File;
                        return (
                          <button
                            key={pt.key}
                            onClick={() => handleSelectType(pt)}
                            className="flex items-start gap-3 p-3.5 rounded-lg border border-[var(--border)] hover:border-[var(--primary)] hover:bg-gray-50 text-left transition-all hover:shadow-sm"
                          >
                            <span className="p-2 rounded-lg bg-gray-100 text-gray-500 shrink-0"><Icon size={18} /></span>
                            <div className="min-w-0">
                              <span className="text-sm font-medium">{pt.label}</span>
                              <span className="text-xs text-[var(--text-muted)] leading-snug line-clamp-2 mt-0.5 block">{pt.description}</span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {groupedTypes.length === 0 && ungroupedTypes.length === 0 && (
                  <div className="text-center py-8 text-sm text-[var(--text-muted)]">
                    Keine Vorlage gefunden für „{search}"
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 2: Stil-Variante */}
          {step === 2 && (
            <div>
              <div className="grid grid-cols-2 gap-3">
                {presets?.map((ps) => (
                  <button
                    key={ps.key}
                    onClick={() => handleSelectPreset(ps)}
                    className="flex flex-col gap-1.5 p-4 rounded-lg border border-[var(--border)] hover:border-[var(--primary)] hover:bg-[var(--primary)]/5 transition-all text-left hover:shadow-sm"
                  >
                    <span className="text-sm font-medium">{ps.label}</span>
                    <span className="text-xs text-[var(--text-muted)]">{ps.description}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Grunddaten */}
          {step === 3 && (
            <div className="space-y-4 max-w-lg">
              <div>
                <label className="block text-sm font-medium mb-1.5">Seitentitel *</label>
                <input
                  value={title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  className={inputClass}
                  placeholder="z.B. BR Reisen"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">URL-Pfad *</label>
                <div className="flex items-center border border-[var(--border)] rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-[var(--primary)]">
                  <span className="px-3 py-2.5 text-sm text-[var(--text-muted)] bg-gray-50 border-r border-[var(--border)] select-none">/</span>
                  <input
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    className="flex-1 px-3 py-2.5 text-sm border-none outline-none font-mono"
                    placeholder="br-reisen"
                  />
                </div>
              </div>
              {!isBlank && (
                <>
                  <div className="pt-2 border-t border-[var(--border)]">
                    <p className="text-xs text-[var(--text-muted)] mb-3">Optionale Angaben für die Texterstellung</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5">Marke / Name</label>
                    <input value={brand} onChange={(e) => setBrand(e.target.value)} className={inputClass} placeholder="z.B. BR Reisen" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1.5">Zielgruppe</label>
                      <input value={targetAudience} onChange={(e) => setTargetAudience(e.target.value)} className={inputClass} placeholder="z.B. Premium-Reisende 50+" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1.5">Tonalität</label>
                      <input value={tone} onChange={(e) => setTone(e.target.value)} className={inputClass} placeholder="z.B. exklusiv, einladend" />
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Step 4: Zusammenfassung */}
          {step === 4 && (
            <div className="max-w-lg">
              <div className="bg-gray-50 rounded-xl p-5 space-y-3">
                {[
                  { label: 'Seitentyp', value: selectedType?.label },
                  selectedPreset ? { label: 'Stil', value: selectedPreset.label } : null,
                  { label: 'Titel', value: title },
                  { label: 'URL', value: `/${slug}`, mono: true },
                  brand ? { label: 'Marke', value: brand } : null,
                ].filter(Boolean).map((row) => (
                  <div key={row!.label} className="flex justify-between text-sm">
                    <span className="text-[var(--text-muted)]">{row!.label}</span>
                    <span className={`font-medium ${(row as { mono?: boolean }).mono ? 'font-mono text-xs' : ''}`}>{row!.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-[var(--border)]">
          <div>
            {step > 1 && (
              <button
                onClick={() => setStep(isBlank && step === 3 ? 1 : step - 1)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
              >
                <ArrowLeft size={14} /> Zurück
              </button>
            )}
          </div>
          <div>
            {step === 3 && !isBlank && (
              <button
                onClick={() => setStep(4)}
                disabled={!canCreate}
                className="flex items-center gap-1.5 px-5 py-2 text-sm font-medium bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-dark)] disabled:opacity-40 transition-colors"
              >
                Weiter <ArrowRight size={14} />
              </button>
            )}
            {(step === 4 || (step === 3 && isBlank)) && (
              <button
                onClick={() => createMutation.mutate()}
                disabled={!canCreate || createMutation.isPending}
                className="flex items-center gap-1.5 px-5 py-2 text-sm font-medium bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-dark)] disabled:opacity-40 transition-colors"
              >
                {createMutation.isPending ? (
                  <><Loader2 size={14} className="animate-spin" /> Erstellen...</>
                ) : (
                  <><Sparkles size={14} /> Seite erzeugen</>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
