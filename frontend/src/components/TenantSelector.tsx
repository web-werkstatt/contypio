import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Building2 } from 'lucide-react';
import { useTenant } from '@/hooks/useTenant';

export default function TenantSelector() {
  const { tenant, tenants, switchTenant, branding } = useTenant();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Nur anzeigen wenn mehrere Tenants verfügbar
  if (tenants.length < 2) {
    return (
      <div className="flex items-center gap-2">
        {branding.logo_url ? (
          <img src={branding.logo_url} alt={branding.name} className="h-5 w-auto" />
        ) : (
          <img src="/contypio-logo.svg" alt="Contypio" className="h-7 w-auto" />
        )}
      </div>
    );
  }

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-2 py-1 rounded-md hover:bg-gray-50 transition-colors"
      >
        {branding.logo_url ? (
          <img src={branding.logo_url} alt={branding.name} className="h-5 w-auto" />
        ) : (
          <Building2 size={16} className="text-[var(--primary)]" />
        )}
        <span className="text-sm font-bold text-[var(--primary)]">{branding.name}</span>
        <ChevronDown size={14} className="text-[var(--text-muted)]" />
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1 w-56 bg-white border border-[var(--border)] rounded-lg shadow-lg z-50 py-1">
          <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
            Mandant wechseln
          </div>
          {tenants.map((t) => (
            <button
              key={t.id}
              onClick={() => {
                switchTenant(t.id);
                setOpen(false);
              }}
              className={`w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors ${
                t.id === tenant?.id
                  ? 'bg-[var(--primary-light)] text-[var(--primary)] font-medium'
                  : 'text-[var(--text)] hover:bg-gray-50'
              }`}
            >
              {t.logo_url ? (
                <img src={t.logo_url} alt={t.name} className="h-4 w-auto" />
              ) : (
                <Building2 size={14} />
              )}
              <span className="flex-1 text-left truncate">{t.name}</span>
              {!t.active && (
                <span className="text-[10px] bg-gray-100 px-1.5 py-0.5 rounded text-[var(--text-muted)]">inaktiv</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
