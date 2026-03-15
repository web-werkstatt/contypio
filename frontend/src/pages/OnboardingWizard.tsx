import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Building2, Briefcase, FileText, Plane, ArrowLeft, ArrowRight, Check } from 'lucide-react';
import api from '@/lib/api';
import type { IndustryPreset, Tenant } from '@/types/cms';

interface OnboardingState {
  name: string;
  domain: string;
  industry: IndustryPreset;
  admin_email: string;
  admin_password: string;
  admin_name: string;
}

interface OnboardingResponse {
  tenant: Tenant;
  access_token: string;
  message: string;
}

export default function OnboardingWizard() {
  const navigate = useNavigate();
  const { t } = useTranslation(['auth', 'common']);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState<OnboardingState>({
    name: '',
    domain: '',
    industry: 'neutral',
    admin_email: '',
    admin_password: '',
    admin_name: '',
  });

  const INDUSTRY_OPTIONS: { key: IndustryPreset; label: string; description: string; icon: typeof Plane }[] = [
    {
      key: 'travel',
      label: t('auth:industry_travel'),
      description: t('auth:industry_travel_desc'),
      icon: Plane,
    },
    {
      key: 'agency',
      label: t('auth:industry_agency'),
      description: t('auth:industry_agency_desc'),
      icon: Briefcase,
    },
    {
      key: 'neutral',
      label: t('auth:industry_neutral'),
      description: t('auth:industry_neutral_desc'),
      icon: FileText,
    },
  ];

  const updateField = <K extends keyof OnboardingState>(key: K, value: OnboardingState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const canProceed = (): boolean => {
    if (step === 1) return form.name.trim().length >= 2;
    if (step === 2) return true;
    if (step === 3) return form.admin_email.length >= 5 && form.admin_password.length >= 8;
    return false;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (step < 3) {
      setStep(step + 1);
      return;
    }

    setError('');
    setLoading(true);

    try {
      const res = await api.post<OnboardingResponse>('/api/tenants/onboard', {
        name: form.name.trim(),
        domain: form.domain.trim() || undefined,
        industry: form.industry,
        admin_email: form.admin_email.trim(),
        admin_password: form.admin_password,
        admin_name: form.admin_name.trim() || 'Admin',
      });

      localStorage.setItem('cms_token', res.data.access_token);
      navigate('/');
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { detail?: string } } };
      setError(axiosErr.response?.data?.detail || t('auth:registration_error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg)]">
      <div className="w-full max-w-lg">
        <div className="bg-white rounded-xl shadow-lg p-8 border border-[var(--border)]">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[var(--primary)] text-white mb-3">
              <Building2 size={24} />
            </div>
            <h1 className="text-xl font-bold text-[var(--text)]">{t('auth:create_account')}</h1>
            <p className="text-sm text-[var(--text-muted)] mt-1">
              {t('auth:step_x_of_y', { step, total: 3 })}
            </p>
          </div>

          {/* Progress Bar */}
          <div className="flex gap-1 mb-8">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`h-1 flex-1 rounded-full transition-colors ${
                  s <= step ? 'bg-[var(--primary)]' : 'bg-gray-200'
                }`}
              />
            ))}
          </div>

          <form onSubmit={handleSubmit}>
            {/* Step 1: Name + Domain */}
            {step === 1 && (
              <div className="space-y-4">
                <h2 className="text-sm font-semibold text-[var(--text)]">{t('auth:org_name_question')}</h2>
                <div>
                  <label className="block text-sm font-medium mb-1.5">{t('auth:name')}</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => updateField('name', e.target.value)}
                    className="w-full px-3 py-2 border border-[var(--border)] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
                    placeholder={t('auth:org_name_placeholder')}
                    required
                    autoFocus
                    minLength={2}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">{t('auth:domain_label')}</label>
                  <input
                    type="text"
                    value={form.domain}
                    onChange={(e) => updateField('domain', e.target.value)}
                    className="w-full px-3 py-2 border border-[var(--border)] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
                    placeholder={t('auth:domain_placeholder')}
                  />
                  <p className="text-xs text-[var(--text-muted)] mt-1">{t('auth:domain_hint')}</p>
                </div>
              </div>
            )}

            {/* Step 2: Industry */}
            {step === 2 && (
              <div className="space-y-4">
                <h2 className="text-sm font-semibold text-[var(--text)]">{t('auth:choose_industry')}</h2>
                <p className="text-xs text-[var(--text-muted)]">
                  {t('auth:industry_hint')}
                </p>
                <div className="space-y-2">
                  {INDUSTRY_OPTIONS.map((opt) => {
                    const Icon = opt.icon;
                    const selected = form.industry === opt.key;
                    return (
                      <button
                        key={opt.key}
                        type="button"
                        onClick={() => updateField('industry', opt.key)}
                        className={`w-full flex items-start gap-3 p-4 border rounded-lg text-left transition-colors ${
                          selected
                            ? 'border-[var(--primary)] bg-[var(--primary-light)]'
                            : 'border-[var(--border)] hover:border-gray-300'
                        }`}
                      >
                        <div className={`mt-0.5 ${selected ? 'text-[var(--primary)]' : 'text-[var(--text-muted)]'}`}>
                          <Icon size={20} />
                        </div>
                        <div className="flex-1">
                          <div className={`text-sm font-medium ${selected ? 'text-[var(--primary)]' : 'text-[var(--text)]'}`}>
                            {opt.label}
                          </div>
                          <div className="text-xs text-[var(--text-muted)] mt-0.5">{opt.description}</div>
                        </div>
                        {selected && (
                          <div className="text-[var(--primary)] mt-0.5">
                            <Check size={18} />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Step 3: Admin User */}
            {step === 3 && (
              <div className="space-y-4">
                <h2 className="text-sm font-semibold text-[var(--text)]">{t('auth:create_admin')}</h2>
                <div>
                  <label className="block text-sm font-medium mb-1.5">{t('auth:name')}</label>
                  <input
                    type="text"
                    value={form.admin_name}
                    onChange={(e) => updateField('admin_name', e.target.value)}
                    className="w-full px-3 py-2 border border-[var(--border)] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
                    placeholder="Max Mustermann"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">{t('auth:email')}</label>
                  <input
                    type="email"
                    value={form.admin_email}
                    onChange={(e) => updateField('admin_email', e.target.value)}
                    className="w-full px-3 py-2 border border-[var(--border)] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
                    placeholder={t('auth:admin_email_placeholder')}
                    required
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">{t('auth:password')}</label>
                  <input
                    type="password"
                    value={form.admin_password}
                    onChange={(e) => updateField('admin_password', e.target.value)}
                    className="w-full px-3 py-2 border border-[var(--border)] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
                    placeholder={t('auth:min_8_chars')}
                    required
                    minLength={8}
                  />
                </div>
              </div>
            )}

            {error && (
              <p className="text-sm text-[var(--danger)] bg-red-50 px-3 py-2 rounded-md mt-4">{error}</p>
            )}

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between mt-8">
              <button
                type="button"
                onClick={() => {
                  if (step === 1) {
                    navigate('/login');
                  } else {
                    setStep(step - 1);
                  }
                }}
                className="flex items-center gap-1 px-4 py-2 text-sm text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
              >
                <ArrowLeft size={14} />
                {step === 1 ? t('auth:go_to_login') : t('common:back')}
              </button>

              <button
                type="submit"
                disabled={!canProceed() || loading}
                className="flex items-center gap-1 px-6 py-2.5 bg-[var(--primary)] hover:bg-[var(--primary-dark)] text-white rounded-md text-sm font-medium transition-colors disabled:opacity-50"
              >
                {step < 3 ? (
                  <>
                    {t('common:next')}
                    <ArrowRight size={14} />
                  </>
                ) : loading ? (
                  t('auth:creating_account')
                ) : (
                  <>
                    {t('auth:create_account')}
                    <Check size={14} />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
