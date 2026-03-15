import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Save, Check, Euro, Tag, Eye, EyeOff } from 'lucide-react';
import api from '@/lib/api';

interface PricingPlan {
  id: number;
  edition: string;
  name: string;
  description: string | null;
  price_monthly: number;
  price_yearly: number;
  currency: string;
  stripe_price_id_monthly: string | null;
  stripe_price_id_yearly: string | null;
  is_public: boolean;
  sort_order: number;
  badge: string | null;
  cta_label: string | null;
  limits: { max_pages: number; max_media_mb: number; max_users: number; max_spaces: number; max_sites: number } | null;
  features: Record<string, boolean> | null;
}

interface PlanForm {
  id: number;
  edition: string;
  name: string;
  description: string;
  price_monthly: number;
  price_yearly: number;
  currency: string;
  stripe_price_id_monthly: string;
  stripe_price_id_yearly: string;
  is_public: boolean;
  badge: string;
  cta_label: string;
  limits: PricingPlan['limits'];
}

function planToForm(p: PricingPlan): PlanForm {
  return {
    id: p.id, edition: p.edition, name: p.name,
    description: p.description || '', price_monthly: p.price_monthly,
    price_yearly: p.price_yearly, currency: p.currency,
    stripe_price_id_monthly: p.stripe_price_id_monthly || '',
    stripe_price_id_yearly: p.stripe_price_id_yearly || '',
    is_public: p.is_public, badge: p.badge || '', cta_label: p.cta_label || '',
    limits: p.limits,
  };
}

function formatPrice(cents: number, currency: string): string {
  const amount = (cents / 100).toFixed(cents % 100 === 0 ? 0 : 2);
  const sym = currency.toUpperCase();
  if (sym === 'USD' || sym === '$') return `$${amount}`;
  if (sym === 'GBP' || sym === '£') return `£${amount}`;
  if (sym === 'CHF') return `CHF ${amount}`;
  return `${amount} ${sym}`;
}

export default function PricingAdmin() {
  const queryClient = useQueryClient();
  const [forms, setForms] = useState<PlanForm[]>([]);
  const [saved, setSaved] = useState(false);

  const { data: plans, isLoading } = useQuery<PricingPlan[]>({
    queryKey: ['admin-pricing'],
    queryFn: async () => (await api.get('/api/admin/pricing')).data,
  });

  useEffect(() => {
    if (plans) setForms(plans.map(planToForm));
  }, [plans]);

  const mutation = useMutation({
    mutationFn: async () => {
      await Promise.all(forms.map(f =>
        api.put(`/api/admin/pricing/${f.id}`, {
          name: f.name, description: f.description || null,
          price_monthly: f.price_monthly, price_yearly: f.price_yearly,
          currency: f.currency,
          stripe_price_id_monthly: f.stripe_price_id_monthly || null,
          stripe_price_id_yearly: f.stripe_price_id_yearly || null,
          is_public: f.is_public, badge: f.badge || null, cta_label: f.cta_label || null,
        })
      ));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-pricing'] });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    },
  });

  const updateForm = (id: number, patch: Partial<PlanForm>) => {
    setForms(prev => prev.map(f => f.id === id ? { ...f, ...patch } : f));
  };

  if (isLoading) return <div className="p-6 text-sm text-[var(--text-muted)]">Laden...</div>;

  return (
    <div className="relative">
      {/* Sticky Header */}
      <div className="sticky top-0 z-10 bg-[var(--bg)] border-b border-[var(--border)] px-6 py-3">
        <div className="max-w-5xl flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">Preise & Pläne</h1>
            <p className="text-sm text-[var(--text-muted)]">Preise, Beschreibungen und Stripe-IDs bearbeiten.</p>
          </div>
          <button
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending}
            className={`flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-md transition-colors ${
              saved
                ? 'bg-green-600 text-white'
                : 'text-white bg-[var(--primary)] hover:bg-[var(--primary-dark)] disabled:opacity-50'
            }`}
          >
            {saved ? <><Check size={16} /> Gespeichert</> : <><Save size={16} /> Speichern</>}
          </button>
        </div>
      </div>

      <div className="p-6 max-w-5xl space-y-6">

      <div className="space-y-4">
        {forms.map((form) => (
          <PlanCard key={form.id} form={form} onChange={(patch) => updateForm(form.id, patch)} />
        ))}
      </div>

      {/* Vorschau */}
      <div>
        <h2 className="text-sm font-semibold mb-3">Vorschau (so sehen Kunden die Preise)</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {forms.filter(p => p.is_public).map((plan) => (
            <div key={plan.id} className={`relative bg-white rounded-lg border-2 p-5 ${plan.badge ? 'border-[var(--primary)]' : 'border-[var(--border)]'}`}>
              {plan.badge && (
                <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-[var(--primary)] text-white">
                  {plan.badge}
                </span>
              )}
              <h3 className="text-lg font-bold">{plan.name}</h3>
              <p className="text-xs text-[var(--text-muted)] mt-1 min-h-[2.5rem]">{plan.description}</p>
              <div className="mt-3 mb-4">
                {plan.price_monthly === 0 ? (
                  <p className="text-2xl font-bold">Kostenlos</p>
                ) : (
                  <p className="text-2xl font-bold">
                    {formatPrice(plan.price_monthly, plan.currency)} <span className="text-sm font-normal text-[var(--text-muted)]">/Monat</span>
                  </p>
                )}
                {plan.price_yearly > 0 && (
                  <p className="text-xs text-[var(--text-muted)]">
                    oder {formatPrice(plan.price_yearly, plan.currency)}/Jahr
                  </p>
                )}
              </div>
              <div className="space-y-1 text-xs text-[var(--text-muted)] mb-4">
                {plan.limits && (
                  <>
                    <p>{plan.limits.max_pages >= 99999 ? 'Unbegrenzte' : plan.limits.max_pages} Seiten</p>
                    <p>{plan.limits.max_media_mb >= 99999 ? 'Unbegrenzt' : `${Math.round(plan.limits.max_media_mb / 1000)} GB`} Speicher</p>
                    <p>{plan.limits.max_users >= 999 ? 'Unbegrenzte' : plan.limits.max_users} Benutzer</p>
                    <p>{plan.limits.max_spaces} {plan.limits.max_spaces === 1 ? 'Space' : 'Spaces'}</p>
                  </>
                )}
              </div>
              <button className="w-full py-2 rounded-md text-sm font-medium bg-[var(--primary)] text-white">
                {plan.cta_label || 'Auswählen'}
              </button>
            </div>
          ))}
        </div>
      </div>
      </div>
    </div>
  );
}

function PlanCard({ form, onChange }: { form: PlanForm; onChange: (patch: Partial<PlanForm>) => void }) {
  const editionColor = form.edition === 'agency' ? 'border-l-purple-500' :
    form.edition === 'pro' ? 'border-l-blue-500' :
    form.edition === 'starter' ? 'border-l-green-500' : 'border-l-gray-300';

  return (
    <div className={`bg-white rounded-lg border border-[var(--border)] shadow-sm border-l-4 ${editionColor}`}>
      <div className="px-5 py-3 border-b border-[var(--border)] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">{form.edition}</span>
          <span className="text-sm font-semibold">{form.name}</span>
        </div>
        <button
          onClick={() => onChange({ is_public: !form.is_public })}
          className={`flex items-center gap-1 text-xs px-2 py-1 rounded ${form.is_public ? 'text-green-600 bg-green-50' : 'text-gray-400 bg-gray-50'}`}
        >
          {form.is_public ? <Eye size={12} /> : <EyeOff size={12} />}
          {form.is_public ? 'Sichtbar' : 'Versteckt'}
        </button>
      </div>
      <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-3">
          <Field label="Name" value={form.name} onChange={v => onChange({ name: v })} />
          <div>
            <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">Beschreibung</label>
            <textarea
              value={form.description}
              onChange={e => onChange({ description: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 text-sm border border-[var(--border)] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Badge" value={form.badge} onChange={v => onChange({ badge: v })} placeholder="z.B. Empfohlen" icon={<Tag size={14} />} />
            <Field label="Button-Text" value={form.cta_label} onChange={v => onChange({ cta_label: v })} placeholder="z.B. Jetzt starten" />
          </div>
        </div>

        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">Monatlich (Cent)</label>
              <div className="relative">
                <Euro size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                <input
                  type="number"
                  value={form.price_monthly}
                  onChange={e => onChange({ price_monthly: parseInt(e.target.value) || 0 })}
                  className="w-full pl-7 pr-2 py-2 text-sm border border-[var(--border)] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">Jährlich (Cent)</label>
              <div className="relative">
                <Euro size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                <input
                  type="number"
                  value={form.price_yearly}
                  onChange={e => onChange({ price_yearly: parseInt(e.target.value) || 0 })}
                  className="w-full pl-7 pr-2 py-2 text-sm border border-[var(--border)] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">Währung</label>
              <select
                value={form.currency}
                onChange={e => onChange({ currency: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-[var(--border)] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
              >
                <option value="EUR">EUR</option>
                <option value="USD">USD</option>
                <option value="GBP">GBP</option>
                <option value="CHF">CHF</option>
              </select>
            </div>
          </div>
          <Field label="Stripe Price ID (monatlich)" value={form.stripe_price_id_monthly} onChange={v => onChange({ stripe_price_id_monthly: v })} placeholder="price_..." />
          <Field label="Stripe Price ID (jährlich)" value={form.stripe_price_id_yearly} onChange={v => onChange({ stripe_price_id_yearly: v })} placeholder="price_..." />

          {form.limits && (
            <div className="pt-2 border-t border-[var(--border)]">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-1">Limits (Edition-Gate)</p>
              <div className="flex flex-wrap gap-2 text-xs text-[var(--text-muted)]">
                <span>{form.limits.max_pages >= 99999 ? '∞' : form.limits.max_pages} Seiten</span>
                <span>·</span>
                <span>{form.limits.max_media_mb >= 99999 ? '∞' : `${Math.round(form.limits.max_media_mb / 1000)}G`}</span>
                <span>·</span>
                <span>{form.limits.max_users} Nutzer</span>
                <span>·</span>
                <span>{form.limits.max_spaces} Spaces</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, placeholder, icon }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; icon?: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">{label}</label>
      <div className="relative">
        {icon && <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[var(--text-muted)]">{icon}</span>}
        <input
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          className={`w-full ${icon ? 'pl-7' : 'px-3'} pr-3 py-2 text-sm border border-[var(--border)] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--primary)]`}
        />
      </div>
    </div>
  );
}
