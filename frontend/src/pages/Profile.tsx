import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { User, Shield, Mail, KeyRound, Save, Check, Type } from 'lucide-react';
import api from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';

const FONT_OPTIONS = [
  { value: 'Inter', label: 'Inter', desc: 'Modern, klar – für Interfaces optimiert' },
  { value: 'Source Sans 3', label: 'Source Sans 3', desc: 'Professionell, von Adobe' },
  { value: 'Nunito Sans', label: 'Nunito Sans', desc: 'Freundlich, gut lesbar' },
  { value: 'IBM Plex Sans', label: 'IBM Plex Sans', desc: 'Technisch, präzise' },
  { value: 'system-ui', label: 'System-Standard', desc: 'Schrift des Betriebssystems' },
] as const;

function applyFont(fontFamily: string) {
  document.documentElement.style.setProperty('--font-family', `'${fontFamily}'`);
}

function getSavedFont(): string {
  return localStorage.getItem('cms-font-family') || 'Inter';
}

export default function Profile() {
  const { t } = useTranslation(['auth', 'common']);
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [displayName, setDisplayName] = useState(user?.display_name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [selectedFont, setSelectedFont] = useState(getSavedFont);
  const [profileSaved, setProfileSaved] = useState(false);
  const [passwordSaved, setPasswordSaved] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  useEffect(() => {
    applyFont(selectedFont);
  }, [selectedFont]);

  const profileMutation = useMutation({
    mutationFn: async () => {
      await api.patch('/api/auth/me', { display_name: displayName, email });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user'] });
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 2000);
    },
  });

  const passwordMutation = useMutation({
    mutationFn: async () => {
      await api.post('/api/auth/me/password', {
        current_password: currentPassword,
        new_password: newPassword,
      });
    },
    onSuccess: () => {
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordError('');
      setPasswordSaved(true);
      setTimeout(() => setPasswordSaved(false), 2000);
    },
    onError: (err: { response?: { data?: { detail?: string } } }) => {
      setPasswordError(err.response?.data?.detail || t('auth:password_change_error'));
    },
  });

  const handlePasswordSubmit = () => {
    setPasswordError('');
    if (newPassword.length < 8) {
      setPasswordError(t('auth:min_8_chars'));
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError(t('auth:password_mismatch'));
      return;
    }
    passwordMutation.mutate();
  };

  const roleLabel = user?.role === 'admin' ? t('auth:administrator') : t('auth:editor');

  return (
    <div className="p-6 max-w-2xl space-y-6">
      <h1 className="text-xl font-bold">{t('auth:my_profile')}</h1>

      {/* Profil-Info Card */}
      <div className="bg-white rounded-lg border border-[var(--border)] shadow-sm">
        <div className="px-5 py-4 border-b border-[var(--border)] flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[var(--primary)] text-white flex items-center justify-center text-sm font-bold">
            {(user?.display_name || user?.email || '?')[0].toUpperCase()}
          </div>
          <div>
            <p className="text-sm font-semibold">{user?.display_name || user?.email}</p>
            <div className="flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
              <Shield size={12} />
              {roleLabel}
            </div>
          </div>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">{t('auth:display_name')}</label>
            <div className="relative">
              <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
              <input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm border border-[var(--border)] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
                placeholder={t('auth:your_name')}
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">{t('auth:email')}</label>
            <div className="relative">
              <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm border border-[var(--border)] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
              />
            </div>
          </div>
          <button
            onClick={() => profileMutation.mutate()}
            disabled={profileMutation.isPending}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[var(--primary)] rounded-md hover:bg-[var(--primary-dark)] disabled:opacity-50 transition-colors"
          >
            {profileSaved ? <><Check size={16} /> {t('common:saved')}</> : <><Save size={16} /> {t('common:save')}</>}
          </button>
        </div>
      </div>

      {/* Schrift Card */}
      <div className="bg-white rounded-lg border border-[var(--border)] shadow-sm">
        <div className="px-5 py-3 border-b border-[var(--border)]">
          <h2 className="text-sm font-semibold flex items-center gap-2">
            <Type size={16} /> {t('auth:font')}
          </h2>
        </div>
        <div className="p-5 space-y-3">
          {FONT_OPTIONS.map((font) => (
            <label
              key={font.value}
              className={`flex items-center gap-3 p-3 rounded-md border cursor-pointer transition-colors ${
                selectedFont === font.value
                  ? 'border-[var(--primary)] bg-[var(--primary-light)]'
                  : 'border-[var(--border)] hover:border-[var(--primary)]/50'
              }`}
            >
              <input
                type="radio"
                name="font"
                value={font.value}
                checked={selectedFont === font.value}
                onChange={(e) => {
                  setSelectedFont(e.target.value);
                  localStorage.setItem('cms-font-family', e.target.value);
                }}
                className="accent-[var(--primary)]"
              />
              <div className="flex-1">
                <span className="text-sm font-medium" style={{ fontFamily: `'${font.value}', sans-serif` }}>
                  {font.label}
                </span>
                <span className="text-xs text-[var(--text-muted)] ml-2">{font.desc}</span>
              </div>
              <span
                className="text-xs text-[var(--text-muted)]"
                style={{ fontFamily: `'${font.value}', sans-serif` }}
              >
                AaBbCc 123
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Passwort Card */}
      <div className="bg-white rounded-lg border border-[var(--border)] shadow-sm">
        <div className="px-5 py-3 border-b border-[var(--border)]">
          <h2 className="text-sm font-semibold flex items-center gap-2">
            <KeyRound size={16} /> {t('auth:change_password')}
          </h2>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">{t('auth:current_password')}</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-[var(--border)] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">{t('auth:new_password')}</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-[var(--border)] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
              placeholder={t('auth:min_8_chars')}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">{t('auth:confirm_password')}</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-[var(--border)] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
            />
          </div>
          {passwordError && (
            <p className="text-xs text-[var(--danger)]">{passwordError}</p>
          )}
          <button
            onClick={handlePasswordSubmit}
            disabled={!currentPassword || !newPassword || passwordMutation.isPending}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[var(--primary)] rounded-md hover:bg-[var(--primary-dark)] disabled:opacity-50 transition-colors"
          >
            {passwordSaved ? <><Check size={16} /> {t('auth:password_changed')}</> : t('auth:change_password')}
          </button>
        </div>
      </div>
    </div>
  );
}
