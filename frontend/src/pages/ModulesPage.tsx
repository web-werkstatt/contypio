import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import {
  FileText, Database, Image, PenLine, FileInput, Search, Settings, Download,
  Webhook, BarChart3, Key, GitBranch, Box, Lock, PenTool, LayoutGrid,
} from 'lucide-react';
import api from '@/lib/api';

interface ModuleItem {
  key: string;
  label: string;
  description: string;
  category: string;
  category_label: string;
  icon: string;
  min_edition: string;
  depends_on: string[];
  available: boolean;
  active: boolean;
}

const ICON_MAP: Record<string, React.ReactNode> = {
  FileText: <FileText size={20} />,
  Database: <Database size={20} />,
  Image: <Image size={20} />,
  PenLine: <PenLine size={20} />,
  FileInput: <FileInput size={20} />,
  Search: <Search size={20} />,
  Settings: <Settings size={20} />,
  Download: <Download size={20} />,
  Webhook: <Webhook size={20} />,
  BarChart3: <BarChart3 size={20} />,
  Key: <Key size={20} />,
  GitBranch: <GitBranch size={20} />,
  Box: <Box size={20} />,
  PenTool: <PenTool size={20} />,
  LayoutGrid: <LayoutGrid size={20} />,
};

const EDITION_COLORS: Record<string, string> = {
  light: 'bg-gray-100 text-gray-600',
  starter: 'bg-blue-100 text-blue-700',
  pro: 'bg-purple-100 text-purple-700',
  agency: 'bg-amber-100 text-amber-700',
};

export default function ModulesPage() {
  const queryClient = useQueryClient();
  const { t } = useTranslation(['settings', 'common']);

  const { data: modules = [], isLoading } = useQuery<ModuleItem[]>({
    queryKey: ['modules'],
    queryFn: async () => (await api.get('/api/modules')).data,
  });

  const toggleMutation = useMutation({
    mutationFn: async (toggleKey: string) => {
      const currentActive = modules.filter((m) => m.active).map((m) => m.key);
      const isActive = currentActive.includes(toggleKey);
      const newActive = isActive
        ? currentActive.filter((k) => k !== toggleKey)
        : [...currentActive, toggleKey];
      return api.patch('/api/modules', { active_modules: newActive });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['modules'] });
    },
  });

  if (isLoading) {
    return <div className="p-6 text-sm text-[var(--text-muted)]">{t('common:loading')}</div>;
  }

  const categories = [...new Set(modules.map((m) => m.category))];

  return (
    <div className="p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-xl font-semibold">{t('settings:modules_title')}</h1>
        <p className="text-sm text-[var(--text-muted)] mt-1">
          {t('settings:modules_desc')}
        </p>
      </div>

      {categories.map((cat) => {
        const catModules = modules.filter((m) => m.category === cat);
        const catLabel = catModules[0]?.category_label || cat;
        return (
          <div key={cat} className="mb-8">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-3">
              {catLabel}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {catModules.map((mod) => (
                <ModuleCard
                  key={mod.key}
                  module={mod}
                  onToggle={() => toggleMutation.mutate(mod.key)}
                  isToggling={toggleMutation.isPending}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ModuleCard({
  module: mod,
  onToggle,
  isToggling,
}: {
  module: ModuleItem;
  onToggle: () => void;
  isToggling: boolean;
}) {
  const { t } = useTranslation(['settings', 'common']);
  const icon = ICON_MAP[mod.icon] || <Box size={20} />;
  const editionColor = EDITION_COLORS[mod.min_edition] || EDITION_COLORS.light;

  return (
    <div
      className={`relative border rounded-lg p-4 transition-colors ${
        mod.active ? 'bg-white border-[var(--primary)]/30' : 'bg-gray-50/50 border-gray-200'
      } ${!mod.available ? 'opacity-60' : ''}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div className={`shrink-0 mt-0.5 ${mod.active ? 'text-[var(--primary)]' : 'text-gray-400'}`}>
            {mod.available ? icon : <Lock size={20} />}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-medium truncate">{mod.label}</h3>
              <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${editionColor}`}>
                {mod.min_edition}
              </span>
            </div>
            <p className="text-xs text-[var(--text-muted)] mt-1">{mod.description}</p>
            {mod.depends_on.length > 0 && (
              <p className="text-[10px] text-[var(--text-muted)] mt-1.5">
                {t('settings:requires', { deps: mod.depends_on.join(', ') })}
              </p>
            )}
          </div>
        </div>

        <button
          onClick={onToggle}
          disabled={!mod.available || isToggling}
          className={`shrink-0 w-10 h-6 rounded-full transition-colors relative ${
            mod.active ? 'bg-[var(--primary)]' : 'bg-gray-300'
          } ${!mod.available ? 'cursor-not-allowed' : 'cursor-pointer'}`}
          title={!mod.available ? t('settings:requires_edition', { edition: mod.min_edition }) : mod.active ? t('common:deactivate') : t('common:activate')}
        >
          <span
            className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${
              mod.active ? 'translate-x-5' : 'translate-x-1'
            }`}
          />
        </button>
      </div>
    </div>
  );
}
