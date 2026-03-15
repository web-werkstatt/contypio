import { useEffect, useMemo } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Database, Plus, Settings } from 'lucide-react';
import api from '@/lib/api';
import type { CollectionSchema } from '@/types/cms';

const LAST_COLLECTION_KEY = 'collections:lastOpened';

/** Extrahiert den Collection-Key aus dem Pfad: /collections/[key] oder /collections/[key]/edit */
function extractKey(pathname: string): string | undefined {
  const match = pathname.match(/^\/collections\/([^/]+)/);
  if (!match || match[1] === 'new') return undefined;
  return match[1];
}

export default function CollectionsLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  const activeKey = useMemo(() => extractKey(location.pathname), [location.pathname]);
  const isEditing = location.pathname.endsWith('/edit');
  const isIndex = location.pathname === '/collections';
  const isNew = location.pathname === '/collections/new';

  const { data: schemas, isLoading } = useQuery<CollectionSchema[]>({
    queryKey: ['collections'],
    queryFn: async () => (await api.get('/api/collections')).data,
  });

  // Speichere letzte geöffnete Collection
  useEffect(() => {
    if (activeKey) localStorage.setItem(LAST_COLLECTION_KEY, activeKey);
  }, [activeKey]);

  // Auto-Redirect: Wenn /collections exakt (Index), zur letzten oder ersten Collection
  useEffect(() => {
    if (!isIndex || isLoading || !schemas || schemas.length === 0) return;
    const last = localStorage.getItem(LAST_COLLECTION_KEY);
    const target = schemas.find((s) => s.collection_key === last) ? last : schemas[0].collection_key;
    navigate(`/collections/${target}`, { replace: true });
  }, [isIndex, isLoading, schemas, navigate]);

  return (
    <div className="flex h-full">
      {/* Collections Sidebar */}
      <nav className="w-60 shrink-0 border-r border-[var(--border)] bg-white overflow-y-auto">
        <div className="px-4 pt-5 pb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database size={16} className="text-[var(--primary)]" />
            <h2 className="text-sm font-bold">Collections</h2>
          </div>
          <button
            onClick={() => navigate('/collections/new')}
            className={`p-1 rounded transition-colors ${
              isNew ? 'text-[var(--primary)]' : 'text-[var(--text-muted)] hover:text-[var(--primary)]'
            }`}
            title="Neue Collection"
          >
            <Plus size={16} />
          </button>
        </div>

        <div className="px-3 pb-3">
          {schemas?.map((schema) => {
            const isActive = activeKey === schema.collection_key;

            return (
              <div key={schema.collection_key}>
                <button
                  onClick={() => navigate(`/collections/${schema.collection_key}`)}
                  className={`w-full flex items-center justify-between px-2.5 py-2 text-[13px] rounded-lg transition-colors relative group ${
                    isActive
                      ? 'bg-[var(--primary-light)] text-[var(--primary)] font-medium'
                      : 'text-[var(--text-muted)] hover:bg-gray-50 hover:text-[var(--text)]'
                  }`}
                >
                  {isActive && (
                    <span className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-r-full bg-[var(--primary)]" />
                  )}
                  <span className="flex items-center gap-2.5 truncate">
                    <Database size={14} className="shrink-0" />
                    <span className="truncate">{schema.label}</span>
                  </span>
                  <span className="flex items-center gap-1.5 shrink-0">
                    <span className={`text-[10px] ${isActive ? 'text-[var(--primary)]' : 'text-[var(--text-muted)]'}`}>
                      {schema.item_count}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/collections/${schema.collection_key}/edit`);
                      }}
                      className={`p-0.5 rounded transition-colors ${
                        isActive && isEditing
                          ? 'text-[var(--primary)]'
                          : 'text-[var(--text-muted)] opacity-0 group-hover:opacity-100 hover:text-[var(--primary)]'
                      }`}
                      title="Schema bearbeiten"
                    >
                      <Settings size={12} />
                    </button>
                  </span>
                </button>

                {/* Sub-Navigation: Einträge / Schema wenn aktiv */}
                {isActive && (
                  <div className="ml-7 mt-0.5 mb-1 space-y-0.5">
                    <button
                      onClick={() => navigate(`/collections/${schema.collection_key}`)}
                      className={`w-full text-left px-2 py-1 text-[12px] rounded transition-colors ${
                        !isEditing
                          ? 'text-[var(--primary)] font-medium bg-[var(--primary-light)]/50'
                          : 'text-[var(--text-muted)] hover:text-[var(--text)]'
                      }`}
                    >
                      Einträge
                    </button>
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
                  </div>
                )}
              </div>
            );
          })}

          {!isLoading && schemas?.length === 0 && (
            <div className="px-2.5 py-4 text-xs text-[var(--text-muted)] text-center">
              Noch keine Collections vorhanden.
            </div>
          )}
        </div>
      </nav>

      {/* Collections Content */}
      <div className="flex-1 overflow-auto">
        <Outlet />
      </div>
    </div>
  );
}
