import { useState, type FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/useAuth';
import { useTenant } from '@/hooks/useTenant';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { branding } = useTenant();
  const navigate = useNavigate();
  const { t } = useTranslation(['auth', 'common']);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch {
      setError(t('auth:invalid_credentials'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg)]">
      <div className="w-full max-w-sm">
        <div className="bg-white rounded-xl shadow-lg p-8 border border-[var(--border)]">
          <div className="text-center mb-8">
            <img
              src={branding.logo_url || '/contypio-logo.svg'}
              alt={branding.name}
              className="h-12 mx-auto mb-4"
            />
            <p className="text-sm text-[var(--text-muted)]">{t('auth:sign_in')}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">{t('auth:email')}</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-[var(--border)] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
                placeholder="you@example.com"
                required
                autoFocus
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">{t('auth:password')}</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-[var(--border)] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
                required
              />
            </div>

            {error && (
              <p className="text-sm text-[var(--danger)] bg-red-50 px-3 py-2 rounded-md">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-[var(--primary)] hover:bg-[var(--primary-dark)] text-white rounded-md text-sm font-medium transition-colors disabled:opacity-50"
            >
              {loading ? t('auth:signing_in') : t('auth:sign_in')}
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link to="/onboarding" className="text-xs text-[var(--text-muted)] hover:text-[var(--primary)] transition-colors">
              {t('auth:create_account')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
