import { useEffect, useMemo } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Database, Plus, Settings, List, FileText } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import api from '@/lib/api';
import type { CollectionSchema } from '@/types/cms';

const LAST_COLLECTION_KEY = 'collections:lastOpened';

function extractKey(pathname: string): string | undefined {
  const match = pathname.match(/^\/collections\/([^/]+)/);
  if (!match || match[1] === 'new') return undefined;
  return match[1];
}

// ---------------------------------------------------------------------------
// Nav Item — einzelne Collection oder Singleton in der Sidebar
// ---------------------------------------------------------------------------

function CollectionNavItem({ schema, isActive, isEditing, isAdmin, navigate }: {
  schema: CollectionSchema;
  isActive: boolean;
  isEditing: boolean;
  isAdmin: boolean;
  navigate: (path: string) => void;
}) {
  const isSingleton = schema.singleton;

  return (
    <div>
      <button
        onClick={() => navigate(`/collections/${schema.collection_key}`)}
        className={`w-full flex items-center gap-2.5 px-2.5 py-2 text-[13px] rounded-lg transition-colors relative group ${
          isActive
            ? 'bg-[var(--primary-light)] text-[var(--primary)] font-medium'
            : 'text-[var(--text-muted)] hover:bg-gray-50 hover:text-[var(--text)]'
        }`}
      >
        {isActive && (
          <span className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-r-full bg-[var(--primary)]" />
        )}

        {/* Icon — farbig nach Typ */}
        <span className={`w-5 h-5 rounded flex items-center justify-center shrink-0 text-[11px] ${
          isSingleton
            ? 'bg-orange-50 border border-orange-200 text-orange-500'
            : 'bg-teal-50 border border-teal-200 text-teal-600'
        }`}>
          {isSingleton ? <FileText size={12} /> : <List size={12} />}
        </span>

        {/* Label */}
        <span className="flex-1 truncate">{schema.label}</span>

        {/* Type Badge + Item Count */}
        <span className="flex items-center gap-1.5 shrink-0">
          {!isSingleton && (
            <span className={`text-[10px] font-mono ${isActive ? 'text-[var(--primary)]' : 'text-[var(--text-muted)]'}`}>
              {schema.item_count}
            </span>
          )}
          <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded ${
            isSingleton
              ? 'bg-orange-50 text-orange-400 border border-orange-100'
              : 'bg-teal-50 text-teal-400 border border-teal-100'
          } ${isActive ? 'opacity-100' : 'opacity-60'}`}>
            {isSingleton ? 'Formular' : 'Liste'}
          </span>

          {/* Schema Button — nur Admin */}
          {isAdmin && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/collections/${schema.collection_key}/edit`);
              }}
              className={`w-5 h-5 rounded flex items-center justify-center transition-colors ${
                isActive && isEditing
                  ? 'bg-orange-100 border border-orange-300 text-orange-600'
                  : 'text-[var(--text-muted)] opacity-0 group-hover:opacity-100 hover:bg-orange-50 hover:text-orange-500 hover:border-orange-200 border border-transparent'
              }`}
              title="Schema bearbeiten"
            >
              <Settings size={10} />
            </button>
          )}
        </span>
      </button>

      {/* Sub-Navigation: nur fuer regulaere Collections wenn aktiv */}
      {isActive && !isSingleton && (
        <div className="ml-7 mt-0.5 mb-1 space-y-0.5">
          <button
            onClick={() => navigate(`/collections/${schema.collection_key}`)}
            className={`w-full text-left px-2 py-1 text-[12px] rounded transition-colors ${
              !isEditing
                ? 'text-[var(--primary)] font-medium bg-[var(--primary-light)]/50'
                : 'text-[var(--text-muted)] hover:text-[var(--text)]'
            }`}
          >
            Eintraege
          </button>
          {isAdmin && (
            <button
              onClick={() => navigate(`/collections/${schema.collection_key}/edit`)}
              className={`w-full text-left px-2 py-1 text-[12px] rounded transition-colors ${
                isEditing
                  ? 'text-[var(--primary)] font-medium bg-[var(--primary-light)]/50'
                  : 'text-[var(--text-muted)] hover:text-[var(--text)]'
              }`}
            >
              Schema
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Layout
// ---------------------------------------------------------------------------

export default function CollectionsLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const activeKey = useMemo(() => extractKey(location.pathname), [location.pathname]);
  const isEditing = location.pathname.endsWith('/edit');
  const isIndex = location.pathname === '/collections';
  const isNew = location.pathname === '/collections/new';

  const { data: schemas, isLoading } = useQuery<CollectionSchema[]>({
    queryKey: ['collections'],
    queryFn: async () => (await api.get('/api/collections')).data,
  });

  useEffect(() => {
    if (activeKey) localStorage.setItem(LAST_COLLECTION_KEY, activeKey);
  }, [activeKey]);

  const regularSchemas = useMemo(() => schemas?.filter((s) => !s.singleton) ?? [], [schemas]);
  const singletonSchemas = useMemo(() => schemas?.filter((s) => s.singleton) ?? [], [schemas]);

  useEffect(() => {
    const allSchemas = [...regularSchemas, ...singletonSchemas];
    if (!isIndex || isLoading || allSchemas.length === 0) return;
    const last = localStorage.getItem(LAST_COLLECTION_KEY);
    const target = allSchemas.find((s) => s.collection_key === last) ? last : allSchemas[0].collection_key;
    navigate(`/collections/${target}`, { replace: true });
  }, [isIndex, isLoading, regularSchemas, singletonSchemas, navigate]);

  return (
    <div className="flex h-full">
      {/* Sidebar */}
      <nav className="w-60 shrink-0 border-r border-[var(--border)] bg-white overflow-y-auto">
        <div className="px-4 pt-5 pb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database size={16} className="text-[var(--primary)]" />
            <h2 className="text-sm font-bold">Daten</h2>
          </div>
          {isAdmin && (
            <button
              onClick={() => navigate('/collections/new')}
              className={`p-1 rounded transition-colors ${
                isNew ? 'text-[var(--primary)]' : 'text-[var(--text-muted)] hover:text-[var(--primary)]'
              }`}
              title="Neue Collection"
            >
              <Plus size={16} />
            </button>
          )}
        </div>

        <div className="px-3 pb-3">
          {/* Collections */}
          {regularSchemas.length > 0 && (
            <span className="block px-2.5 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
              Collections
            </span>
          )}
          {regularSchemas.map((schema) => (
            <CollectionNavItem
              key={schema.collection_key}
              schema={schema}
              isActive={activeKey === schema.collection_key}
              isEditing={isEditing}
              isAdmin={isAdmin}
              navigate={navigate}
            />
          ))}

          {/* Singletons */}
          {singletonSchemas.length > 0 && (
            <>
              {regularSchemas.length > 0 && <div className="my-2 border-t border-[var(--border)]" />}
              <span className="block px-2.5 pb-1.5 pt-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                Einstellungen
              </span>
              {singletonSchemas.map((schema) => (
                <CollectionNavItem
                  key={schema.collection_key}
                  schema={schema}
                  isActive={activeKey === schema.collection_key}
                  isEditing={isEditing}
                  isAdmin={isAdmin}
                  navigate={navigate}
                />
              ))}
            </>
          )}

          {/* + Neue Collection — nur Admin */}
          {isAdmin && (
            <button
              onClick={() => navigate('/collections/new')}
              className="w-full flex items-center gap-2 px-2.5 py-2 mt-2 text-[12px] text-teal-600 bg-teal-50 border border-dashed border-teal-200 rounded-lg hover:bg-teal-100 transition-colors"
            >
              <Plus size={12} /> Neue Collection
            </button>
          )}

          {!isLoading && schemas?.length === 0 && (
            <div className="px-2.5 py-8 text-xs text-[var(--text-muted)] text-center">
              <Database size={24} className="mx-auto mb-2 opacity-30" />
              <p>Noch keine Daten vorhanden.</p>
              {isAdmin && (
                <button
                  onClick={() => navigate('/collections/new')}
                  className="mt-3 px-3 py-1.5 text-xs bg-[var(--primary)] text-white rounded-lg hover:opacity-90"
                >
                  Erste Collection erstellen
                </button>
              )}
            </div>
          )}
        </div>
      </nav>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        <Outlet />
      </div>
    </div>
  );
}
