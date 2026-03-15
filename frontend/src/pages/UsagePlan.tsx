import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { BarChart3, FileText, Image, Users, Sparkles, Check, ChevronDown } from 'lucide-react';
import api from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';

interface UsageData {
  plan: string;
  pages: { used: number; max: number; percent: number };
  media_mb: { used: number; max: number; percent: number };
  users: { used: number; max: number; percent: number };
}

interface EditionInfo {
  edition: string;
  limits: { max_pages: number; max_media_mb: number; max_users: number; max_spaces: number; max_sites: number };
  features: Record<string, boolean>;
  all_editions: Record<string, { max_pages: number; max_media_mb: number; max_users: number; max_spaces: number; max_sites: number }>;
}

const EDITION_COLORS: Record<string, { bg: string; text: string }> = {
  light: { bg: 'bg-gray-100', text: 'text-gray-600' },
  starter: { bg: 'bg-green-100', text: 'text-green-700' },
  pro: { bg: 'bg-blue-100', text: 'text-blue-700' },
  agency: { bg: 'bg-purple-100', text: 'text-purple-700' },
};

export default function UsagePlan() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: usage } = useQuery<UsageData>({
    queryKey: ['usage'],
    queryFn: async () => (await api.get('/api/tenants/current/usage')).data,
  });

  const { data: edition } = useQuery<EditionInfo>({
    queryKey: ['edition'],
    queryFn: async () => (await api.get('/api/tenants/current/edition')).data,
  });

  return (
    <div className="p-6 max-w-2xl space-y-6">
      <h1 className="text-xl font-bold">Nutzung & Plan</h1>

      {/* Edition Card */}
      {edition && (
        <EditionCard edition={edition} isAdmin={user?.role === 'admin'} queryClient={queryClient} />
      )}

      {/* Nutzung Card */}
      {usage && (
        <div className="bg-white rounded-lg border border-[var(--border)] shadow-sm">
          <div className="px-5 py-3 border-b border-[var(--border)]">
            <h2 className="text-sm font-semibold flex items-center gap-2">
              <BarChart3 size={16} /> Aktuelle Nutzung
            </h2>
          </div>
          <div className="p-5 space-y-4">
            <UsageRow icon={<FileText size={16} />} label="Seiten" used={usage.pages.used} max={usage.pages.max} percent={usage.pages.percent} />
            <UsageRow icon={<Image size={16} />} label="Speicher" used={usage.media_mb.used} max={usage.media_mb.max} percent={usage.media_mb.percent} unit="MB" />
            <UsageRow icon={<Users size={16} />} label="Benutzer" used={usage.users.used} max={usage.users.max} percent={usage.users.percent} />
          </div>
        </div>
      )}

      {/* Editions-Vergleich */}
      {edition && (
        <div className="bg-white rounded-lg border border-[var(--border)] shadow-sm">
          <div className="px-5 py-3 border-b border-[var(--border)]">
            <h2 className="text-sm font-semibold">Editions-Vergleich</h2>
          </div>
          <div className="p-5">
            <div className="grid grid-cols-4 gap-3">
              {Object.entries(edition.all_editions).map(([name, limits]) => {
                const colors = EDITION_COLORS[name] || EDITION_COLORS.light;
                const isActive = name === edition.edition;
                return (
                  <div
                    key={name}
                    className={`p-4 rounded-lg border-2 text-center ${
                      isActive ? `${colors.bg} border-current ${colors.text}` : 'border-[var(--border)]'
                    }`}
                  >
                    <p className={`text-xs font-bold uppercase mb-3 ${isActive ? colors.text : 'text-[var(--text-muted)]'}`}>
                      {name}
                    </p>
                    <div className="space-y-1.5 text-xs text-[var(--text-muted)]">
                      <p><span className="font-semibold text-[var(--text)]">{limits.max_pages >= 99999 ? '∞' : limits.max_pages}</span> Seiten</p>
                      <p><span className="font-semibold text-[var(--text)]">{limits.max_media_mb >= 99999 ? '∞' : `${Math.round(limits.max_media_mb / 1000)}G`}</span> Speicher</p>
                      <p><span className="font-semibold text-[var(--text)]">{limits.max_users >= 999 ? '∞' : limits.max_users}</span> Nutzer</p>
                      <p><span className="font-semibold text-[var(--text)]">{limits.max_spaces}</span> Spaces</p>
                      <p><span className="font-semibold text-[var(--text)]">{limits.max_sites}</span> Sites</p>
                    </div>
                    {isActive && (
                      <p className="mt-3 text-[10px] font-bold uppercase tracking-wider">Aktiv</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function EditionCard({ edition, isAdmin, queryClient }: {
  edition: EditionInfo; isAdmin: boolean; queryClient: ReturnType<typeof useQueryClient>;
}) {
  const [editionSaved, setEditionSaved] = useState(false);

  const editionMutation = useMutation({
    mutationFn: async (newEdition: string) => {
      await api.put('/api/tenants/current/edition', { edition: newEdition });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['edition'] });
      queryClient.invalidateQueries({ queryKey: ['usage'] });
      setEditionSaved(true);
      setTimeout(() => setEditionSaved(false), 2000);
    },
  });

  const colors = EDITION_COLORS[edition.edition] || EDITION_COLORS.light;

  return (
    <div className="bg-white rounded-lg border border-[var(--border)] shadow-sm">
      <div className="px-5 py-3 border-b border-[var(--border)] flex items-center justify-between">
        <h2 className="text-sm font-semibold flex items-center gap-2">
          <Sparkles size={16} /> Edition
          <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${colors.bg} ${colors.text}`}>
            {edition.edition}
          </span>
          {editionSaved && <span className="text-xs text-green-600 flex items-center gap-1"><Check size={12} /> Gespeichert</span>}
        </h2>
        {isAdmin && (
          <div className="relative">
            <select
              value={edition.edition}
              onChange={(e) => editionMutation.mutate(e.target.value)}
              disabled={editionMutation.isPending}
              className="appearance-none pl-3 pr-8 py-1.5 text-xs font-medium border border-[var(--border)] rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-[var(--primary)] cursor-pointer disabled:opacity-50"
            >
              {Object.keys(edition.all_editions).map((ed) => (
                <option key={ed} value={ed}>{ed.charAt(0).toUpperCase() + ed.slice(1)}</option>
              ))}
            </select>
            <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none" />
          </div>
        )}
      </div>
      <div className="p-5 space-y-3">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
          {Object.entries(edition.features).filter(([, v]) => typeof v === 'boolean').map(([key, enabled]) => (
            <div key={key} className={`flex items-center gap-1.5 ${enabled ? 'text-[var(--text)]' : 'text-gray-300'}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${enabled ? 'bg-green-500' : 'bg-gray-200'}`} />
              {key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
            </div>
          ))}
        </div>
        <div className="pt-3 border-t border-[var(--border)] grid grid-cols-5 gap-2 text-center text-xs">
          <div><p className="text-lg font-bold">{edition.limits.max_pages >= 99999 ? '∞' : edition.limits.max_pages}</p><p className="text-[var(--text-muted)]">Seiten</p></div>
          <div><p className="text-lg font-bold">{edition.limits.max_media_mb >= 99999 ? '∞' : `${Math.round(edition.limits.max_media_mb / 1000)}G`}</p><p className="text-[var(--text-muted)]">Speicher</p></div>
          <div><p className="text-lg font-bold">{edition.limits.max_users >= 999 ? '∞' : edition.limits.max_users}</p><p className="text-[var(--text-muted)]">Nutzer</p></div>
          <div><p className="text-lg font-bold">{edition.limits.max_spaces}</p><p className="text-[var(--text-muted)]">Spaces</p></div>
          <div><p className="text-lg font-bold">{edition.limits.max_sites}</p><p className="text-[var(--text-muted)]">Sites</p></div>
        </div>
      </div>
    </div>
  );
}

function UsageRow({ icon, label, used, max, percent, unit }: {
  icon: React.ReactNode; label: string; used: number; max: number; percent: number; unit?: string;
}) {
  const barColor = percent >= 90 ? 'bg-red-500' : percent >= 70 ? 'bg-amber-500' : 'bg-[var(--primary)]';
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2 text-sm text-[var(--text)]">
          <span className="text-[var(--text-muted)]">{icon}</span>
          {label}
        </div>
        <span className="text-xs text-[var(--text-muted)]">
          {used}{unit ? ` ${unit}` : ''} / {max}{unit ? ` ${unit}` : ''}
        </span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: `${Math.min(percent, 100)}%` }} />
      </div>
    </div>
  );
}
