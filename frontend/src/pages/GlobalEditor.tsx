import { useState, useEffect, useMemo } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Save, Check, Building2, Phone, MapPin, AlertCircle } from 'lucide-react';

/** Map settings route segments to global slugs */
const ROUTE_TO_SLUG: Record<string, string> = {
  general: 'site-settings',
  navigation: 'navigation',
  'social-media': 'social-media',
};
import api from '@/lib/api';
import type { GlobalConfig } from '@/types/cms';
import MediaPicker from '@/components/media/MediaPicker';
import NavigationEditor from '@/components/globals/NavigationEditor';
import SocialMediaEditor from '@/components/globals/SocialMediaEditor';

interface FieldConfig {
  key: string;
  label: string;
  type: 'text' | 'email' | 'tel' | 'url' | 'textarea' | 'media';
  placeholder?: string;
  hint?: string;
}

interface FieldSection {
  title: string;
  description: string;
  icon: React.ReactNode;
  fields: FieldConfig[];
}

const SITE_SETTINGS_SECTIONS: FieldSection[] = [
  {
    title: 'Allgemein',
    description: 'Name, Slogan und Logo deiner Website',
    icon: <Building2 size={18} className="text-[var(--primary)]" />,
    fields: [
      { key: 'site_name', label: 'Site-Name', type: 'text', placeholder: 'z.B. Meine Firma GmbH', hint: 'Erscheint im Browser-Tab und in der Kopfzeile' },
      { key: 'tagline', label: 'Tagline', type: 'text', placeholder: 'z.B. Ihr Partner für ...', hint: 'Kurzer Slogan unter dem Logo' },
      { key: 'logo_id', label: 'Logo', type: 'media', hint: 'PNG oder SVG empfohlen, min. 200px breit' },
    ],
  },
  {
    title: 'Kontakt',
    description: 'E-Mail und Telefon für Besucher',
    icon: <Phone size={18} className="text-[var(--primary)]" />,
    fields: [
      { key: 'contact_email', label: 'Kontakt E-Mail', type: 'email', placeholder: 'info@example.de' },
      { key: 'contact_phone', label: 'Kontakt Telefon', type: 'tel', placeholder: '+49 (0) 123 456789' },
    ],
  },
  {
    title: 'Adresse',
    description: 'Firmenanschrift für Impressum und Footer',
    icon: <MapPin size={18} className="text-[var(--primary)]" />,
    fields: [
      { key: 'address', label: 'Firmenadresse', type: 'textarea', placeholder: 'Musterstr. 1\n12345 Berlin' },
    ],
  },
];

function TypedField({ field, value, onChange }: { field: FieldConfig; value: unknown; onChange: (v: unknown) => void }) {
  const strVal = String(value ?? '');
  const inputClass = 'w-full px-3 py-2.5 text-sm border border-[var(--border)] rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent transition-shadow';

  if (field.type === 'media') {
    return (
      <div>
        <label className="block text-sm font-medium mb-1.5">{field.label}</label>
        {field.hint && <p className="text-xs text-[var(--text-muted)] mb-2">{field.hint}</p>}
        <MediaPicker value={value as string | number | null} onChange={onChange} />
      </div>
    );
  }

  if (field.type === 'textarea') {
    return (
      <div>
        <label className="block text-sm font-medium mb-1.5">{field.label}</label>
        {field.hint && <p className="text-xs text-[var(--text-muted)] mb-2">{field.hint}</p>}
        <textarea
          value={strVal}
          onChange={(e) => onChange(e.target.value || null)}
          placeholder={field.placeholder}
          rows={3}
          className={`${inputClass} resize-y`}
        />
      </div>
    );
  }

  return (
    <div>
      <label className="block text-sm font-medium mb-1.5">{field.label}</label>
      {field.hint && <p className="text-xs text-[var(--text-muted)] mb-2">{field.hint}</p>}
      <input
        type={field.type}
        value={strVal}
        onChange={(e) => onChange(e.target.value || null)}
        placeholder={field.placeholder}
        className={inputClass}
      />
    </div>
  );
}

function StickyFooter({ saved, isPending, hasChanges, onSave, error }: {
  saved: boolean;
  isPending: boolean;
  hasChanges: boolean;
  onSave: () => void;
  error: boolean;
}) {
  if (!hasChanges && !saved && !error) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-[var(--border)] bg-white/95 backdrop-blur-sm shadow-[0_-2px_10px_rgba(0,0,0,0.06)]">
      <div className="max-w-3xl mx-auto px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm">
          {error ? (
            <><AlertCircle size={16} className="text-[var(--danger)]" /><span className="text-[var(--danger)]">Fehler beim Speichern</span></>
          ) : saved ? (
            <><Check size={16} className="text-[var(--success)]" /><span className="text-[var(--success)]">Änderungen gespeichert</span></>
          ) : (
            <><span className="w-2 h-2 rounded-full bg-[var(--warning)] animate-pulse" /><span className="text-[var(--text-muted)]">Ungespeicherte Änderungen</span></>
          )}
        </div>
        <button
          onClick={onSave}
          disabled={isPending || saved}
          className="flex items-center gap-2 px-5 py-2 text-sm font-medium text-white bg-[var(--primary)] rounded-lg hover:bg-[var(--primary-dark)] disabled:opacity-50 transition-colors"
        >
          {saved ? <><Check size={16} /> Gespeichert</> : <><Save size={16} /> Änderungen speichern</>}
        </button>
      </div>
    </div>
  );
}

/** Hook for global data loading + mutation */
function useGlobalData(slug: string | undefined) {
  const queryClient = useQueryClient();
  const [data, setData] = useState<Record<string, unknown>>({});
  const [saved, setSaved] = useState(false);

  const { data: global, isLoading } = useQuery<GlobalConfig>({
    queryKey: ['global', slug],
    queryFn: async () => (await api.get(`/api/globals/${slug}`)).data,
    enabled: !!slug,
  });

  const initialData = useMemo(() => global?.data ?? {}, [global]);

  useEffect(() => {
    if (global) setData(global.data);
  }, [global]);

  const hasChanges = JSON.stringify(data) !== JSON.stringify(initialData);

  const mutation = useMutation({
    mutationFn: () => api.put(`/api/globals/${slug}`, { data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['global', slug] });
      queryClient.invalidateQueries({ queryKey: ['globals'] });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    },
  });

  const handleFieldChange = (key: string, value: unknown) => {
    setSaved(false);
    setData((prev) => ({ ...prev, [key]: value }));
  };

  return { global, isLoading, data, setData, saved, hasChanges, mutation, handleFieldChange };
}

/** Page header with title and description */
function SettingsPageHeader({ title, description }: { title: string; description?: string }) {
  return (
    <div className="mb-8">
      <h1 className="text-xl font-bold">{title}</h1>
      {description && <p className="text-sm text-[var(--text-muted)] mt-1">{description}</p>}
    </div>
  );
}

export default function GlobalEditor() {
  const { slug: paramSlug } = useParams<{ slug: string }>();
  const location = useLocation();

  // Resolve slug: from /globals/:slug (legacy) or /settings/:segment
  const settingsSegment = location.pathname.split('/settings/')[1]?.split('/')[0];
  const slug = paramSlug || (settingsSegment ? ROUTE_TO_SLUG[settingsSegment] : undefined) || 'site-settings';

  const { global, isLoading, data, setData, saved, hasChanges, mutation, handleFieldChange } = useGlobalData(slug);

  if (isLoading) return <div className="p-6 text-sm text-[var(--text-muted)]">Laden...</div>;
  if (!global) return <div className="p-6 text-sm text-[var(--danger)]">Global nicht gefunden</div>;

  const footerProps = { saved, isPending: mutation.isPending, hasChanges, onSave: () => mutation.mutate(), error: mutation.isError };

  // Navigation Editor
  if (slug === 'navigation') {
    return (
      <div className="p-6 pb-20">
        <SettingsPageHeader title="Navigation" description="Menüstruktur und Links deiner Website" />
        <NavigationEditor data={data} onChange={setData} />
        <StickyFooter {...footerProps} />
      </div>
    );
  }

  // Social Media Editor
  if (slug === 'social-media') {
    return (
      <div className="p-6 pb-20">
        <SettingsPageHeader title="Social Media" description="Links zu deinen Social-Media-Profilen" />
        <SocialMediaEditor data={data} onChange={setData} />
        <StickyFooter {...footerProps} />
      </div>
    );
  }

  // Site Settings - Grouped Layout
  if (slug === 'site-settings') {
    return (
      <div className="p-6 pb-20">
        <SettingsPageHeader title="Allgemein" description="Grundlegende Informationen und Darstellung deiner Website" />
        <div className="space-y-8">
          {SITE_SETTINGS_SECTIONS.map((section) => (
            <section key={section.title} className="bg-white border border-[var(--border)] rounded-xl shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-[var(--border)] bg-gray-50/50">
                <div className="flex items-center gap-3">
                  {section.icon}
                  <div>
                    <h2 className="text-sm font-semibold">{section.title}</h2>
                    <p className="text-xs text-[var(--text-muted)] mt-0.5">{section.description}</p>
                  </div>
                </div>
              </div>
              <div className="px-6 py-5 space-y-5">
                {section.fields.map((field) => (
                  <TypedField key={field.key} field={field} value={data[field.key]} onChange={(v) => handleFieldChange(field.key, v)} />
                ))}
              </div>
            </section>
          ))}
        </div>
        <StickyFooter {...footerProps} />
      </div>
    );
  }

  // Generic Global Editor (Fallback)
  return (
    <div className="p-6 pb-20">
      <SettingsPageHeader title={global.label} />
      <div className="bg-white border border-[var(--border)] rounded-xl p-6 space-y-5">
        {Object.entries(data).map(([key, value]) => {
          if (typeof value === 'object' && value !== null) return null;
          return (
            <div key={key}>
              <label className="block text-sm font-medium mb-1.5">{key.replace(/_/g, ' ')}</label>
              <input
                type="text"
                value={String(value ?? '')}
                onChange={(e) => handleFieldChange(key, e.target.value || null)}
                className="w-full px-3 py-2.5 text-sm border border-[var(--border)] rounded-lg"
              />
            </div>
          );
        })}
      </div>
      <StickyFooter {...footerProps} />
    </div>
  );
}
