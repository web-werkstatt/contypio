import { useMemo } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Settings, Sliders, Navigation, Share2, Webhook, Download, Globe, Blocks, Key } from 'lucide-react';
import api from '@/lib/api';

interface NavGroup {
  label: string;
  items: NavItem[];
}

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
  moduleKey?: string;
}

export default function SettingsLayout() {
  const { t } = useTranslation(['settings', 'common', 'content']);
  const navigate = useNavigate();
  const location = useLocation();

  const { data: modules } = useQuery<{ key: string; active: boolean }[]>({
    queryKey: ['modules'],
    queryFn: async () => (await api.get('/api/modules')).data,
  });

  const isModuleActive = (key: string) => {
    if (!modules) return true;
    return modules.some((m) => m.key === key && m.active);
  };

  const navGroups: NavGroup[] = useMemo(() => [
    {
      label: t('settings:general'),
      items: [
        { label: t('settings:general'), path: '/settings/general', icon: <Sliders size={15} /> },
        { label: t('content:navigation'), path: '/settings/navigation', icon: <Navigation size={15} /> },
        { label: t('settings:social_media'), path: '/settings/social-media', icon: <Share2 size={15} /> },
      ],
    },
    {
      label: t('settings:integrations'),
      items: [
        { label: t('settings:webhooks'), path: '/settings/webhooks', icon: <Webhook size={15} />, moduleKey: 'webhooks' },
        { label: t('settings:api_keys'), path: '/settings/api-keys', icon: <Key size={15} /> },
      ],
    },
    {
      label: t('common:system'),
      items: [
        { label: t('settings:import_export'), path: '/settings/import', icon: <Download size={15} />, moduleKey: 'import_export' },
        { label: t('settings:website_importer'), path: '/settings/website-import', icon: <Globe size={15} /> },
        { label: t('settings:modules'), path: '/settings/modules', icon: <Blocks size={15} /> },
      ],
    },
  ], [t]);

  return (
    <div className="flex h-full">
      {/* Settings Navigation */}
      <nav className="w-60 shrink-0 border-r border-[var(--border)] bg-white overflow-y-auto">
        <div className="px-4 pt-5 pb-3">
          <div className="flex items-center gap-2">
            <Settings size={16} className="text-[var(--primary)]" />
            <h2 className="text-sm font-bold">{t('common:settings')}</h2>
          </div>
        </div>

        {navGroups.map((group) => {
          const visibleItems = group.items.filter(
            (item) => !item.moduleKey || isModuleActive(item.moduleKey)
          );
          if (visibleItems.length === 0) return null;

          return (
            <div key={group.label} className="px-3 mb-3">
              <span className="block px-2 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                {group.label}
              </span>
              {visibleItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <button
                    key={item.path}
                    onClick={() => navigate(item.path)}
                    className={`w-full flex items-center gap-2.5 px-2.5 py-2 text-[13px] rounded-lg transition-colors relative ${
                      isActive
                        ? 'bg-[var(--primary-light)] text-[var(--primary)] font-medium'
                        : 'text-[var(--text-muted)] hover:bg-gray-50 hover:text-[var(--text)]'
                    }`}
                  >
                    {isActive && (
                      <span className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-r-full bg-[var(--primary)]" />
                    )}
                    {item.icon}
                    {item.label}
                  </button>
                );
              })}
            </div>
          );
        })}
      </nav>

      {/* Settings Content */}
      <div className="flex-1 overflow-auto">
        <Outlet />
      </div>
    </div>
  );
}
