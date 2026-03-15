import { useState, useEffect, useRef } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Image as ImageIcon, LogOut, Database, Settings, ChevronDown, Search, HelpCircle, User, Shield, BarChart3, Euro, CreditCard, PanelLeftClose, PanelLeftOpen, Globe, PenTool } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/useAuth';
import api from '@/lib/api';
import PageTree from './PageTree';
import CommandPalette from '@/components/CommandPalette';
import PageAssemblyWizard from '@/components/PageAssemblyWizard';
import TenantSelector from '@/components/TenantSelector';
import { useSidebar } from '@/contexts/SidebarContext';

const LANGUAGES = [
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'de', label: 'Deutsch', flag: '🇩🇪' },
] as const;

export default function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { collapsed, toggle: toggleSidebar } = useSidebar();
  const { t, i18n } = useTranslation(['common', 'auth', 'settings']);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setPaletteOpen((v) => !v);
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'b') {
        e.preventDefault();
        toggleSidebar();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [toggleSidebar]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const { data: modules } = useQuery<{ key: string; active: boolean }[]>({
    queryKey: ['modules'],
    queryFn: async () => (await api.get('/api/modules')).data,
  });

  const isModuleActive = (key: string) => {
    if (!modules) return true;
    return modules.some((m) => m.key === key && m.active);
  };

  const changeLanguage = (lang: string) => {
    i18n.changeLanguage(lang);
    localStorage.setItem('cms_lang', lang);
  };

  return (
    <div className="h-screen flex flex-col bg-[var(--bg)]">
      {/* Top Bar */}
      <header className="h-12 flex items-center justify-between px-4 bg-white shrink-0">
        <div className="flex items-center gap-3">
          <TenantSelector />
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setPaletteOpen(true)}
            className="flex items-center gap-2 px-3 py-1 bg-gray-50 rounded-md text-xs text-[var(--text-muted)] hover:bg-gray-100 transition-colors"
          >
            <Search size={14} />
            <span>{t('common:search')}</span>
            <kbd className="text-[10px] bg-gray-100 px-1 py-0.5 rounded font-mono ml-1">Ctrl+K</kbd>
          </button>
          <a href="/hilfe" target="_blank" rel="noopener noreferrer" className="p-1.5 text-[var(--text-muted)] hover:text-[var(--primary)] transition-colors" title={t('common:help')}>
            <HelpCircle size={16} />
          </a>
          {/* User Dropdown */}
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center gap-2 px-2 py-1 rounded-md hover:bg-gray-50 transition-colors"
            >
              <div className="w-7 h-7 rounded-full bg-[var(--primary)] text-white flex items-center justify-center text-xs font-bold">
                {(user?.display_name || user?.email || '?')[0].toUpperCase()}
              </div>
              <span className="text-xs text-[var(--text-muted)] hidden sm:inline">{user?.display_name || user?.email}</span>
              <ChevronDown size={12} className="text-[var(--text-muted)]" />
            </button>
            {userMenuOpen && (
              <div className="absolute right-0 top-full mt-1 w-56 bg-white rounded-lg shadow-lg z-50 py-1">
                <div className="px-3 py-2">
                  <p className="text-sm font-medium truncate">{user?.display_name || user?.email}</p>
                  <p className="text-xs text-[var(--text-muted)] flex items-center gap-1">
                    <Shield size={10} />
                    {user?.role === 'admin' ? t('auth:administrator') : t('auth:editor')}
                  </p>
                </div>
                <button
                  onClick={() => { setUserMenuOpen(false); navigate('/profile'); }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[var(--text)] hover:bg-gray-50 transition-colors"
                >
                  <User size={14} /> {t('auth:my_profile')}
                </button>
                <button
                  onClick={() => { setUserMenuOpen(false); navigate('/usage'); }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[var(--text)] hover:bg-gray-50 transition-colors"
                >
                  <BarChart3 size={14} /> {t('auth:usage_plan')}
                </button>
                {user?.role === 'admin' && (
                  <>
                    <button
                      onClick={() => { setUserMenuOpen(false); navigate('/billing'); }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[var(--text)] hover:bg-gray-50 transition-colors"
                    >
                      <CreditCard size={14} /> {t('auth:billing')}
                    </button>
                    <button
                      onClick={() => { setUserMenuOpen(false); navigate('/pricing'); }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[var(--text)] hover:bg-gray-50 transition-colors"
                    >
                      <Euro size={14} /> {t('auth:pricing')}
                    </button>
                  </>
                )}
                {/* Language Switcher */}
                <div className="border-t border-[var(--border)] mt-1 pt-1">
                  <div className="px-3 py-1.5 flex items-center gap-2 text-xs text-[var(--text-muted)]">
                    <Globe size={12} /> {t('settings:language')}
                  </div>
                  {LANGUAGES.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => changeLanguage(lang.code)}
                      className={`w-full flex items-center gap-2 px-3 py-1.5 text-sm transition-colors ${
                        i18n.language?.startsWith(lang.code)
                          ? 'text-[var(--primary)] bg-[var(--primary-light)]'
                          : 'text-[var(--text)] hover:bg-gray-50'
                      }`}
                    >
                      <span>{lang.flag}</span> {lang.label}
                    </button>
                  ))}
                </div>
                <div className="border-t border-[var(--border)] mt-1 pt-1">
                  <button
                    onClick={logout}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[var(--danger)] hover:bg-red-50 transition-colors"
                  >
                    <LogOut size={14} /> {t('auth:sign_out')}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside
          className="bg-[var(--bg)] flex flex-col shrink-0 overflow-hidden transition-[width] duration-200 ease-in-out"
          style={{ width: collapsed ? 0 : 256 }}
        >
          {/* CONTENTS */}
          <div className="px-3 pt-3 pb-1">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">{t('common:contents')}</span>
          </div>
          <nav className="px-2">
            <button
              onClick={() => navigate('/')}
              className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors ${location.pathname === '/' ? 'bg-[var(--primary-light)] text-[var(--primary)]' : 'text-[var(--text-muted)] hover:bg-gray-200/40'}`}
            >
              <LayoutDashboard size={16} /> {t('common:dashboard')}
            </button>
            {isModuleActive('media') && (
              <button
                onClick={() => navigate('/media')}
                className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors ${location.pathname === '/media' ? 'bg-[var(--primary-light)] text-[var(--primary)]' : 'text-[var(--text-muted)] hover:bg-gray-200/40'}`}
              >
                <ImageIcon size={16} /> {t('common:media')}
              </button>
            )}
            {isModuleActive('collections') && (
              <button
                onClick={() => navigate('/collections')}
                className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors ${location.pathname.startsWith('/collections') ? 'bg-[var(--primary-light)] text-[var(--primary)]' : 'text-[var(--text-muted)] hover:bg-gray-200/40'}`}
              >
                <Database size={16} /> {t('common:collections')}
              </button>
            )}
            {isModuleActive('content_templates') && (
              <button
                onClick={() => navigate('/content-templates')}
                className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors ${location.pathname === '/content-templates' ? 'bg-[var(--primary-light)] text-[var(--primary)]' : 'text-[var(--text-muted)] hover:bg-gray-200/40'}`}
              >
                <PenTool size={16} /> Content Templates
              </button>
            )}
          </nav>

          {/* PAGES */}
          <div className="px-3 pt-4 pb-1">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">{t('common:pages')}</span>
          </div>
          <div className="flex-1 overflow-auto">
            <PageTree />

            {/* SYSTEM */}
            <div className="mt-4 px-2">
              <div className="px-1 pb-1">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">{t('common:system')}</span>
              </div>
              <button
                onClick={() => navigate('/settings')}
                className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors ${
                  location.pathname.startsWith('/settings')
                    ? 'bg-[var(--primary-light)] text-[var(--primary)]'
                    : 'text-[var(--text-muted)] hover:bg-gray-200/40'
                }`}
              >
                <Settings size={16} /> {t('common:settings')}
              </button>
            </div>
          </div>
        </aside>

        {/* Sidebar Toggle */}
        <button
          onClick={toggleSidebar}
          className="shrink-0 w-7 flex items-start justify-center pt-3 bg-[var(--bg)] hover:bg-gray-200/60 transition-colors"
          title={collapsed ? t('common:show_sidebar') : t('common:hide_sidebar')}
        >
          {collapsed ? <PanelLeftOpen size={14} className="text-[var(--text-muted)]" /> : <PanelLeftClose size={14} className="text-[var(--text-muted)]" />}
        </button>

        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>

      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} onNewPage={() => setWizardOpen(true)} />
      {wizardOpen && <PageAssemblyWizard onClose={() => setWizardOpen(false)} />}
    </div>
  );
}
