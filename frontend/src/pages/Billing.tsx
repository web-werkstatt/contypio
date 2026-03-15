import { useMutation, useQuery } from '@tanstack/react-query';
import { CreditCard, ExternalLink, ToggleLeft, ToggleRight } from 'lucide-react';
import api from '@/lib/api';

interface BillingStatus {
  stripe_configured: boolean;
  billing_enabled: boolean;
  plan: string;
  has_subscription: boolean;
  plans: Record<string, { max_pages: number; max_media_mb: number; max_users: number }>;
}

export default function Billing() {
  const { data: billing, refetch: refetchBilling } = useQuery<BillingStatus>({
    queryKey: ['billing-status'],
    queryFn: async () => (await api.get('/api/billing/status')).data,
  });

  const toggleBillingMutation = useMutation({
    mutationFn: async () => { await api.post('/api/billing/toggle'); },
    onSuccess: () => { refetchBilling(); },
  });

  const portalMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post('/api/billing/portal');
      return res.data.portal_url;
    },
    onSuccess: (url: string) => { window.open(url, '_blank'); },
  });

  if (!billing) return <div className="p-6 text-sm text-[var(--text-muted)]">Laden...</div>;

  return (
    <div className="p-6 max-w-2xl space-y-6">
      <h1 className="text-xl font-bold">Abrechnung</h1>

      <div className="bg-white rounded-lg border border-[var(--border)] shadow-sm">
        <div className="px-5 py-3 border-b border-[var(--border)]">
          <h2 className="text-sm font-semibold flex items-center gap-2">
            <CreditCard size={16} /> Stripe-Anbindung
          </h2>
        </div>
        <div className="p-5 space-y-4">
          {/* Stripe Status */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Status</p>
              <p className="text-xs text-[var(--text-muted)]">
                {billing.stripe_configured
                  ? 'Stripe ist konfiguriert und einsatzbereit'
                  : 'Stripe-Keys nicht gesetzt (STRIPE_SECRET_KEY in .env)'}
              </p>
            </div>
            <span className={`text-xs px-2 py-1 rounded-full ${billing.stripe_configured ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
              {billing.stripe_configured ? 'Bereit' : 'Nicht konfiguriert'}
            </span>
          </div>

          {/* Billing Toggle */}
          {billing.stripe_configured && (
            <div className="flex items-center justify-between pt-4 border-t border-[var(--border)]">
              <div>
                <p className="text-sm font-medium">Abrechnung aktivieren</p>
                <p className="text-xs text-[var(--text-muted)]">
                  Kunden können Pläne über Stripe buchen
                </p>
              </div>
              <button
                onClick={() => toggleBillingMutation.mutate()}
                disabled={toggleBillingMutation.isPending}
                className="text-[var(--primary)] hover:text-[var(--primary-dark)] transition-colors"
              >
                {billing.billing_enabled
                  ? <ToggleRight size={32} />
                  : <ToggleLeft size={32} className="text-gray-300" />}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Aktiver Plan + Portal */}
      {billing.billing_enabled && (
        <div className="bg-white rounded-lg border border-[var(--border)] shadow-sm">
          <div className="px-5 py-3 border-b border-[var(--border)]">
            <h2 className="text-sm font-semibold">Aktueller Plan</h2>
          </div>
          <div className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium capitalize">{billing.plan}</p>
                <p className="text-xs text-[var(--text-muted)]">
                  {billing.has_subscription ? 'Aktives Abo' : 'Kein aktives Abo'}
                </p>
              </div>
            </div>
            {billing.has_subscription && (
              <button
                onClick={() => portalMutation.mutate()}
                disabled={portalMutation.isPending}
                className="flex items-center gap-2 text-sm text-[var(--primary)] hover:underline"
              >
                <ExternalLink size={14} /> Abo & Rechnungen verwalten (Stripe Portal)
              </button>
            )}

            {/* Plan-Uebersicht */}
            <div className="pt-4 border-t border-[var(--border)]">
              <p className="text-xs font-medium text-[var(--text-muted)] mb-3">Verfügbare Pläne</p>
              <div className="grid grid-cols-2 gap-3">
                {Object.entries(billing.plans).map(([name, limits]) => (
                  <div
                    key={name}
                    className={`p-3 rounded-lg border text-xs ${
                      name === billing.plan
                        ? 'border-[var(--primary)] bg-[var(--primary-light)]'
                        : 'border-[var(--border)]'
                    }`}
                  >
                    <p className="font-semibold capitalize mb-1">{name}</p>
                    <p className="text-[var(--text-muted)]">{limits.max_pages} Seiten</p>
                    <p className="text-[var(--text-muted)]">{limits.max_media_mb >= 99999 ? 'Unbegrenzt' : `${limits.max_media_mb} MB`} Speicher</p>
                    <p className="text-[var(--text-muted)]">{limits.max_users >= 999 ? 'Unbegrenzt' : limits.max_users} Benutzer</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
