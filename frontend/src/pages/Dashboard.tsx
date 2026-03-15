import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FileText, Image, Database, Plus, Upload, Settings, Clock, ArrowRight, Menu, BarChart3, AlertTriangle, PenLine, Search, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '@/lib/api';
import type { Page, CollectionSchema } from '@/types/cms';
import PageAssemblyWizard from '@/components/PageAssemblyWizard';
import { useTenant } from '@/hooks/useTenant';
import { QuickAction, UsageBar, formatRelativeDate } from '@/components/dashboard/DashboardWidgets';

interface ContentTask {
  label: string;
  count: number;
  icon: React.ReactNode;
  color: string;
  onClick: () => void;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [wizardOpen, setWizardOpen] = useState(false);
  const { branding } = useTenant();
  const { t } = useTranslation(['content', 'common']);

  const { data: pages } = useQuery<Page[]>({
    queryKey: ['pages'],
    queryFn: async () => (await api.get('/api/pages')).data,
  });

  const { data: mediaData } = useQuery<{ total: number }>({
    queryKey: ['mediaCount'],
    queryFn: async () => (await api.get('/api/media', { params: { per_page: 1 } })).data,
  });

  const { data: collections } = useQuery<CollectionSchema[]>({
    queryKey: ['collections'],
    queryFn: async () => (await api.get('/api/collections')).data,
  });

  const { data: usage } = useQuery<{
    plan: string;
    pages: { used: number; max: number; percent: number };
    media_mb: { used: number; max: number; percent: number };
    users: { used: number; max: number; percent: number };
  }>({
    queryKey: ['usage'],
    queryFn: async () => (await api.get('/api/tenants/current/usage')).data,
  });

  const recentPages = useMemo(() =>
    pages
      ? [...pages].sort((a, b) => new Date(b.updated_at ?? b.created_at).getTime() - new Date(a.updated_at ?? a.created_at).getTime()).slice(0, 6)
      : [],
    [pages]
  );

  const tasks = useMemo<ContentTask[]>(() => {
    if (!pages) return [];
    const result: ContentTask[] = [];

    const drafts = pages.filter((p) => p.status === 'draft');
    if (drafts.length > 0) {
      result.push({
        label: drafts.length === 1 ? t('content:publish_draft') : t('content:publish_drafts'),
        count: drafts.length,
        icon: <PenLine size={16} />,
        color: 'text-amber-600 bg-amber-50',
        onClick: () => navigate(`/pages/${drafts[0].id}`),
      });
    }

    const noSeoTitle = pages.filter((p) => p.status === 'published' && !p.seo?.title);
    if (noSeoTitle.length > 0) {
      result.push({
        label: t('content:no_seo_title'),
        count: noSeoTitle.length,
        icon: <Search size={16} />,
        color: 'text-orange-600 bg-orange-50',
        onClick: () => navigate(`/pages/${noSeoTitle[0].id}`),
      });
    }

    const noSeoDesc = pages.filter((p) => p.status === 'published' && !p.seo?.description);
    if (noSeoDesc.length > 0) {
      result.push({
        label: t('content:no_seo_desc'),
        count: noSeoDesc.length,
        icon: <AlertTriangle size={16} />,
        color: 'text-red-500 bg-red-50',
        onClick: () => navigate(`/pages/${noSeoDesc[0].id}`),
      });
    }

    const emptySections = pages.filter((p) => p.status === 'published' && (!p.sections || p.sections.length === 0));
    if (emptySections.length > 0) {
      result.push({
        label: t('content:empty_pages'),
        count: emptySections.length,
        icon: <FileText size={16} />,
        color: 'text-gray-500 bg-gray-100',
        onClick: () => navigate(`/pages/${emptySections[0].id}`),
      });
    }

    return result;
  }, [pages, navigate, t]);

  const published = pages?.filter((p) => p.status === 'published').length ?? 0;
  const totalPages = pages?.length ?? 0;
  const totalMedia = mediaData?.total ?? 0;
  const totalCollections = collections?.length ?? 0;

  return (
    <div className="p-6 max-w-5xl space-y-6">

      {/* Header + Primary CTA */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold">{t('content:welcome', { name: branding.name })}</h1>
          <p className="text-sm text-[var(--text-muted)]">{t('content:what_today')}</p>
        </div>
        <button
          onClick={() => setWizardOpen(true)}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[var(--primary)] rounded-lg hover:bg-[var(--primary-dark)] transition-colors shadow-sm"
        >
          <Plus size={16} /> {t('common:new_page')}
        </button>
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-2">
        <QuickAction onClick={() => navigate('/media')} icon={<Upload size={15} />} label={t('common:media')} />
        <QuickAction onClick={() => navigate('/collections')} icon={<Database size={15} />} label={t('common:collections')} />
        <QuickAction onClick={() => navigate('/settings/navigation')} icon={<Menu size={15} />} label={t('content:navigation')} />
        <QuickAction onClick={() => navigate('/settings')} icon={<Settings size={15} />} label={t('common:settings')} />
      </div>

      {/* Open Tasks */}
      {tasks.length > 0 && (
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-3">{t('content:open_tasks')}</h2>
          <div className="bg-white rounded-xl border border-[var(--border)] shadow-sm overflow-hidden divide-y divide-[var(--border)]">
            {tasks.map((task) => (
              <button
                key={task.label}
                onClick={task.onClick}
                className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors group text-left"
              >
                <span className={`p-1.5 rounded-lg ${task.color}`}>{task.icon}</span>
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium">{task.count} {task.label}</span>
                </div>
                <ArrowRight size={14} className="text-[var(--text-muted)] opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* All done */}
      {tasks.length === 0 && pages && pages.length > 0 && (
        <div className="flex items-center gap-3 px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-xl">
          <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
          <span className="text-sm text-emerald-700 font-medium">{t('content:all_done')}</span>
        </div>
      )}

      {/* Recent Changes */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">{t('content:recent_changes')}</h2>
        </div>
        {recentPages.length > 0 ? (
          <div className="bg-white rounded-xl border border-[var(--border)] shadow-sm overflow-hidden">
            <div className="divide-y divide-[var(--border)]">
              {recentPages.map((page) => (
                <div
                  key={page.id}
                  onClick={() => navigate(`/pages/${page.id}`)}
                  className="px-4 py-3 flex items-center justify-between hover:bg-gray-50 cursor-pointer transition-colors group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-2 h-2 rounded-full shrink-0 ${page.status === 'published' ? 'bg-green-500' : 'bg-amber-400'}`} />
                    <span className="text-sm font-medium truncate">{page.title}</span>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-xs text-[var(--text-muted)] flex items-center gap-1">
                      <Clock size={12} />
                      {formatRelativeDate(page.updated_at ?? page.created_at)}
                    </span>
                    <ArrowRight size={14} className="text-[var(--text-muted)] opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-dashed border-[var(--border)] p-8 text-center">
            <p className="text-sm text-[var(--text-muted)]">{t('content:no_changes')}</p>
            <button onClick={() => setWizardOpen(true)} className="mt-3 text-sm text-[var(--primary)] hover:underline font-medium">
              {t('content:create_first_page')}
            </button>
          </div>
        )}
      </div>

      {/* Content Overview + System */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-[var(--border)] p-5 shadow-sm">
          <h2 className="text-sm font-semibold mb-3">{t('content:content_overview')}</h2>
          <div className="space-y-2.5">
            <ContentRow icon={<FileText size={15} />} label={t('common:pages')} value={totalPages} detail={t('content:published_count', { count: published })} onClick={() => navigate('/')} />
            <ContentRow icon={<Image size={15} />} label={t('common:media')} value={totalMedia} onClick={() => navigate('/media')} />
            <ContentRow icon={<Database size={15} />} label={t('common:collections')} value={totalCollections} onClick={() => navigate('/collections')} />
          </div>
        </div>

        {usage && (
          <div className="bg-white rounded-xl border border-[var(--border)] p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold">{t('common:system')}</h2>
              <span className="text-[10px] font-medium uppercase tracking-wider px-2 py-0.5 rounded-full bg-gray-100 text-[var(--text-muted)]">{usage.plan}-Plan</span>
            </div>
            <div className="space-y-3">
              <UsageBar label={t('common:pages')} used={usage.pages.used} max={usage.pages.max} percent={usage.pages.percent} icon={<FileText size={14} />} />
              <UsageBar label={t('content:storage')} used={usage.media_mb.used} max={usage.media_mb.max} percent={usage.media_mb.percent} unit="MB" icon={<Image size={14} />} />
              <UsageBar label={t('content:users')} used={usage.users.used} max={usage.users.max} percent={usage.users.percent} icon={<BarChart3 size={14} />} />
            </div>
          </div>
        )}
      </div>

      {wizardOpen && <PageAssemblyWizard onClose={() => setWizardOpen(false)} />}
    </div>
  );
}

function ContentRow({ icon, label, value, detail, onClick }: {
  icon: React.ReactNode; label: string; value: number; detail?: string; onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={`flex items-center justify-between py-1.5 ${onClick ? 'cursor-pointer hover:text-[var(--primary)] transition-colors' : ''}`}
    >
      <div className="flex items-center gap-2.5 text-sm text-[var(--text-muted)]">
        {icon}
        <span>{label}</span>
      </div>
      <div className="flex items-center gap-2">
        {detail && <span className="text-xs text-[var(--text-muted)]">{detail}</span>}
        <span className="text-sm font-semibold">{value}</span>
      </div>
    </div>
  );
}
