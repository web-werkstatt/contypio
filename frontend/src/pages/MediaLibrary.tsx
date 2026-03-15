import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import {
  LayoutGrid, List, Upload, FolderPlus, ChevronRight, Home,
  Trash2, FolderInput, CheckSquare, X,
} from 'lucide-react';
import api from '@/lib/api';
import MediaCard, { type MediaItem } from '@/components/media/MediaCard';
import FolderCard, { type FolderItem } from '@/components/media/FolderCard';
import MediaDetailPanel from '@/components/media/MediaDetailPanel';
import UploadZone from '@/components/media/UploadZone';

interface MediaListResponse {
  items: MediaItem[];
  total: number;
  page: number;
  per_page: number;
}

type ViewMode = 'grid' | 'list';
type SortKey = 'newest' | 'oldest' | 'name' | 'size';
type TypeFilter = '' | 'image' | 'document' | 'video';

interface BreadcrumbItem {
  id: number;
  name: string;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function MediaLibrary() {
  const { t } = useTranslation(['content', 'common']);
  const queryClient = useQueryClient();

  const [view, setView] = useState<ViewMode>('grid');
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [sort, setSort] = useState<SortKey>('newest');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('');
  const [showUpload, setShowUpload] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [detailItem, setDetailItem] = useState<MediaItem | null>(null);

  // Folder state
  const [currentFolderId, setCurrentFolderId] = useState<number | null>(null);
  const [newFolderName, setNewFolderName] = useState('');
  const [showNewFolder, setShowNewFolder] = useState(false);

  // Bulk state
  const [checkedIds, setCheckedIds] = useState<Set<number>>(new Set());
  const bulkMode = checkedIds.size > 0;

  // Folders query
  const { data: folders = [] } = useQuery<FolderItem[]>({
    queryKey: ['media-folders', currentFolderId],
    queryFn: async () => {
      const params = currentFolderId ? `?parent_id=${currentFolderId}` : '';
      return (await api.get(`/api/media/folders${params}`)).data;
    },
  });

  // Breadcrumb query
  const { data: breadcrumb = [] } = useQuery<BreadcrumbItem[]>({
    queryKey: ['media-breadcrumb', currentFolderId],
    queryFn: async () => {
      if (!currentFolderId) return [];
      return (await api.get(`/api/media/folders/${currentFolderId}/breadcrumb`)).data;
    },
    enabled: currentFolderId !== null,
  });

  // Media query
  const { data, isLoading, refetch } = useQuery<MediaListResponse>({
    queryKey: ['media-library', page, search, category, currentFolderId, typeFilter],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), per_page: '24' });
      if (search) params.set('search', search);
      if (category) params.set('category', category);
      if (typeFilter) params.set('type', typeFilter);
      if (currentFolderId !== null) {
        params.set('folder_id', String(currentFolderId));
      } else {
        params.set('root', 'true');
      }
      return (await api.get(`/api/media?${params}`)).data;
    },
  });

  const items = data?.items || [];
  const total = data?.total || 0;
  const totalPages = data ? Math.ceil(data.total / data.per_page) : 1;

  const sorted = [...items].sort((a, b) => {
    switch (sort) {
      case 'oldest': return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      case 'name': return a.original_name.localeCompare(b.original_name);
      case 'size': return b.file_size - a.file_size;
      default: return 0;
    }
  });

  // Mutations
  const createFolderMutation = useMutation({
    mutationFn: async (name: string) => {
      return (await api.post('/api/media/folders', { name, parent_id: currentFolderId })).data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['media-folders'] });
      setShowNewFolder(false);
      setNewFolderName('');
    },
  });

  const renameFolderMutation = useMutation({
    mutationFn: async ({ id, name }: { id: number; name: string }) => {
      return (await api.patch(`/api/media/folders/${id}`, { name })).data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['media-folders'] });
    },
  });

  const deleteFolderMutation = useMutation({
    mutationFn: async (id: number) => {
      return (await api.delete(`/api/media/folders/${id}`)).data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['media-folders'] });
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: number[]) => {
      return (await api.post('/api/media/bulk/delete', { ids })).data;
    },
    onSuccess: () => {
      setCheckedIds(new Set());
      queryClient.invalidateQueries({ queryKey: ['media-library'] });
    },
  });

  const bulkMoveMutation = useMutation({
    mutationFn: async ({ ids, folderId }: { ids: number[]; folderId: number | null }) => {
      return (await api.post('/api/media/bulk/move', { ids, folder_id: folderId })).data;
    },
    onSuccess: () => {
      setCheckedIds(new Set());
      queryClient.invalidateQueries({ queryKey: ['media-library'] });
      queryClient.invalidateQueries({ queryKey: ['media-folders'] });
    },
  });

  const navigateToFolder = (folderId: number | null) => {
    setCurrentFolderId(folderId);
    setPage(1);
    setCheckedIds(new Set());
    setDetailItem(null);
  };

  const toggleCheck = useCallback((id: number) => {
    setCheckedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const selectAll = () => {
    if (checkedIds.size === items.length) {
      setCheckedIds(new Set());
    } else {
      setCheckedIds(new Set(items.map((i) => i.id)));
    }
  };

  const copyUrl = (item: MediaItem) => {
    navigator.clipboard.writeText(item.url);
  };

  const handleDelete = (item: MediaItem) => {
    if (confirm(t('content:confirm_delete_media', { name: item.original_name }))) {
      api.delete(`/api/media/${item.id}`).then(() => {
        if (detailItem?.id === item.id) setDetailItem(null);
        refetch();
        queryClient.invalidateQueries({ queryKey: ['media-folders'] });
      });
    }
  };

  const handleBulkDelete = () => {
    const count = checkedIds.size;
    if (confirm(`${count} Dateien unwiderruflich löschen?`)) {
      bulkDeleteMutation.mutate(Array.from(checkedIds));
    }
  };

  const handleBulkMoveToRoot = () => {
    bulkMoveMutation.mutate({ ids: Array.from(checkedIds), folderId: null });
  };

  const handleDeleteFolder = (folder: FolderItem) => {
    if (folder.file_count > 0 || folder.subfolder_count > 0) {
      alert(`Ordner "${folder.name}" ist nicht leer und kann nicht gelöscht werden.`);
      return;
    }
    if (confirm(`Ordner "${folder.name}" löschen?`)) {
      deleteFolderMutation.mutate(folder.id);
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-[var(--border)] bg-white">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-semibold">{t('content:media_library')}</h1>
          <span className="text-xs text-[var(--text-muted)] bg-gray-100 px-2 py-0.5 rounded-full">
            {t('content:files_count', { count: total })}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex border border-[var(--border)] rounded-md overflow-hidden">
            <button
              onClick={() => setView('grid')}
              className={`p-1.5 transition-colors ${view === 'grid' ? 'bg-gray-100 text-[var(--primary)]' : 'text-[var(--text-muted)] hover:bg-gray-50'}`}
            >
              <LayoutGrid size={16} />
            </button>
            <button
              onClick={() => setView('list')}
              className={`p-1.5 transition-colors ${view === 'list' ? 'bg-gray-100 text-[var(--primary)]' : 'text-[var(--text-muted)] hover:bg-gray-50'}`}
            >
              <List size={16} />
            </button>
          </div>
          <button
            onClick={() => setShowNewFolder(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-[var(--border)] rounded-md hover:bg-gray-50 transition-colors"
          >
            <FolderPlus size={14} /> Neuer Ordner
          </button>
          <button
            onClick={() => setShowUpload(!showUpload)}
            className="flex items-center gap-1.5 px-4 py-1.5 text-sm bg-[var(--primary)] text-white rounded-md hover:bg-[var(--primary-dark)] transition-colors"
          >
            <Upload size={14} /> {t('common:upload')}
          </button>
        </div>
      </div>

      {/* Breadcrumb */}
      <div className="flex items-center gap-1 px-6 py-2 border-b border-[var(--border)] bg-gray-50 text-xs">
        <button
          onClick={() => navigateToFolder(null)}
          className={`flex items-center gap-1 px-2 py-1 rounded hover:bg-gray-200 transition-colors ${
            currentFolderId === null ? 'font-semibold text-[var(--primary)]' : 'text-[var(--text-muted)]'
          }`}
        >
          <Home size={12} /> Medien
        </button>
        {breadcrumb.map((crumb) => (
          <span key={crumb.id} className="flex items-center gap-1">
            <ChevronRight size={12} className="text-gray-400" />
            <button
              onClick={() => navigateToFolder(crumb.id)}
              className={`px-2 py-1 rounded hover:bg-gray-200 transition-colors ${
                crumb.id === currentFolderId ? 'font-semibold text-[var(--primary)]' : 'text-[var(--text-muted)]'
              }`}
            >
              {crumb.name}
            </button>
          </span>
        ))}
      </div>

      {/* Upload Zone */}
      {showUpload && (
        <div className="px-6 py-4 border-b border-[var(--border)] bg-gray-50">
          <UploadZone folderId={currentFolderId} onUploaded={() => { refetch(); queryClient.invalidateQueries({ queryKey: ['media-folders'] }); }} />
        </div>
      )}

      {/* Bulk Action Bar */}
      {bulkMode && (
        <div className="flex items-center gap-3 px-6 py-2 border-b border-[var(--border)] bg-blue-50">
          <button onClick={selectAll} className="flex items-center gap-1.5 text-xs text-[var(--primary)]">
            <CheckSquare size={14} />
            {checkedIds.size === items.length ? 'Alle abwählen' : 'Alle auswählen'}
          </button>
          <span className="text-xs font-medium">{checkedIds.size} ausgewählt</span>
          <div className="flex-1" />
          {currentFolderId !== null && (
            <button
              onClick={handleBulkMoveToRoot}
              className="flex items-center gap-1.5 px-3 py-1 text-xs border border-[var(--border)] rounded-md hover:bg-white transition-colors"
            >
              <FolderInput size={12} /> Zum Root verschieben
            </button>
          )}
          {folders.length > 0 && (
            <select
              onChange={(e) => {
                const fId = parseInt(e.target.value);
                if (!isNaN(fId)) {
                  bulkMoveMutation.mutate({ ids: Array.from(checkedIds), folderId: fId });
                }
                e.target.value = '';
              }}
              className="px-3 py-1 text-xs border border-[var(--border)] rounded-md"
              defaultValue=""
            >
              <option value="" disabled>In Ordner verschieben...</option>
              {folders.map((f) => (
                <option key={f.id} value={f.id}>{f.name}</option>
              ))}
            </select>
          )}
          <button
            onClick={handleBulkDelete}
            className="flex items-center gap-1.5 px-3 py-1 text-xs text-[var(--danger)] border border-red-200 rounded-md hover:bg-red-50 transition-colors"
          >
            <Trash2 size={12} /> Löschen
          </button>
          <button onClick={() => setCheckedIds(new Set())} className="p-1 hover:bg-gray-200 rounded">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Filter Bar */}
      <div className="flex items-center gap-3 px-6 py-3 border-b border-[var(--border)] bg-white">
        <input
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder={t('common:search')}
          className="flex-1 max-w-xs px-3 py-1.5 border border-[var(--border)] rounded-md text-sm"
        />
        <select
          value={typeFilter}
          onChange={(e) => { setTypeFilter(e.target.value as TypeFilter); setPage(1); }}
          className="px-3 py-1.5 border border-[var(--border)] rounded-md text-sm"
        >
          <option value="">Alle Typen</option>
          <option value="image">Bilder</option>
          <option value="document">Dokumente</option>
          <option value="video">Videos</option>
        </select>
        <select
          value={category}
          onChange={(e) => { setCategory(e.target.value); setPage(1); }}
          className="px-3 py-1.5 border border-[var(--border)] rounded-md text-sm"
        >
          <option value="">{t('content:all_categories')}</option>
          <option value="general">{t('content:category_general')}</option>
          <option value="hero">{t('content:category_hero')}</option>
          <option value="gallery">{t('content:category_gallery')}</option>
          <option value="logo">{t('content:category_logo')}</option>
          <option value="document">{t('content:category_document')}</option>
        </select>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortKey)}
          className="px-3 py-1.5 border border-[var(--border)] rounded-md text-sm"
        >
          <option value="newest">{t('content:sort_newest')}</option>
          <option value="oldest">{t('content:sort_oldest')}</option>
          <option value="name">{t('content:sort_name')}</option>
          <option value="size">{t('content:sort_size')}</option>
        </select>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        {/* New Folder Dialog */}
        {showNewFolder && (
          <div className="mb-4 flex items-center gap-2">
            <input
              autoFocus
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && newFolderName.trim()) createFolderMutation.mutate(newFolderName.trim());
                if (e.key === 'Escape') { setShowNewFolder(false); setNewFolderName(''); }
              }}
              placeholder="Ordnername..."
              className="px-3 py-1.5 border border-[var(--border)] rounded-md text-sm"
            />
            <button
              onClick={() => { if (newFolderName.trim()) createFolderMutation.mutate(newFolderName.trim()); }}
              disabled={!newFolderName.trim()}
              className="px-3 py-1.5 text-sm bg-[var(--primary)] text-white rounded-md hover:bg-[var(--primary-dark)] disabled:opacity-40 transition-colors"
            >
              Erstellen
            </button>
            <button
              onClick={() => { setShowNewFolder(false); setNewFolderName(''); }}
              className="px-3 py-1.5 text-sm border border-[var(--border)] rounded-md hover:bg-gray-50 transition-colors"
            >
              Abbrechen
            </button>
          </div>
        )}

        {isLoading ? (
          <div className="text-center py-16 text-sm text-[var(--text-muted)]">{t('common:loading')}</div>
        ) : (
          <>
            {/* Folders */}
            {folders.length > 0 && view === 'grid' && (
              <div className="mb-6">
                <h3 className="text-xs font-medium text-[var(--text-muted)] mb-3 uppercase tracking-wide">Ordner</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                  {folders.map((folder) => (
                    <FolderCard
                      key={folder.id}
                      folder={folder}
                      onOpen={() => navigateToFolder(folder.id)}
                      onRename={(name) => renameFolderMutation.mutate({ id: folder.id, name })}
                      onDelete={() => handleDeleteFolder(folder)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Files */}
            {sorted.length === 0 && folders.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-sm text-[var(--text-muted)]">
                  {search || category ? t('common:no_results') : t('content:no_media')}
                </p>
                <p className="text-xs text-gray-400 mt-1">{t('content:upload_hint')}</p>
              </div>
            ) : view === 'grid' ? (
              <>
                {sorted.length > 0 && folders.length > 0 && (
                  <h3 className="text-xs font-medium text-[var(--text-muted)] mb-3 uppercase tracking-wide">Dateien</h3>
                )}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                  {sorted.map((item) => (
                    <MediaCard
                      key={item.id}
                      item={item}
                      selected={selectedId === item.id}
                      bulkMode={bulkMode}
                      checked={checkedIds.has(item.id)}
                      onSelect={() => { setSelectedId(item.id); setDetailItem(item); }}
                      onEdit={() => setDetailItem(item)}
                      onDelete={() => handleDelete(item)}
                      onCopyUrl={() => copyUrl(item)}
                      onCheckToggle={() => toggleCheck(item.id)}
                    />
                  ))}
                </div>
              </>
            ) : (
              <div className="border border-[var(--border)] rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-[var(--border)]">
                    <tr>
                      <th className="px-4 py-2 text-left w-10">
                        <input
                          type="checkbox"
                          checked={checkedIds.size === items.length && items.length > 0}
                          onChange={selectAll}
                          className="w-4 h-4 rounded"
                        />
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-[var(--text-muted)]">{t('content:image')}</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-[var(--text-muted)]">{t('content:filename')}</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-[var(--text-muted)]">{t('content:type')}</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-[var(--text-muted)]">{t('content:size')}</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-[var(--text-muted)]">{t('content:date')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {folders.map((folder) => (
                      <tr
                        key={`folder-${folder.id}`}
                        onClick={() => navigateToFolder(folder.id)}
                        className="border-b border-[var(--border)] hover:bg-gray-50 cursor-pointer transition-colors"
                      >
                        <td className="px-4 py-2" />
                        <td className="px-4 py-2">
                          <div className="w-12 h-12 bg-amber-50 rounded flex items-center justify-center">
                            <FolderPlus size={20} className="text-amber-400" />
                          </div>
                        </td>
                        <td className="px-4 py-2 font-medium">{folder.name}</td>
                        <td className="px-4 py-2 text-[var(--text-muted)]">Ordner</td>
                        <td className="px-4 py-2 text-right text-[var(--text-muted)]">{folder.file_count} Dateien</td>
                        <td className="px-4 py-2 text-right text-[var(--text-muted)]">{new Date(folder.created_at).toLocaleDateString('de-DE')}</td>
                      </tr>
                    ))}
                    {sorted.map((item) => (
                      <tr
                        key={item.id}
                        onClick={() => setDetailItem(item)}
                        className="border-b border-[var(--border)] hover:bg-gray-50 cursor-pointer transition-colors"
                      >
                        <td className="px-4 py-2">
                          <input
                            type="checkbox"
                            checked={checkedIds.has(item.id)}
                            onChange={() => toggleCheck(item.id)}
                            onClick={(e) => e.stopPropagation()}
                            className="w-4 h-4 rounded"
                          />
                        </td>
                        <td className="px-4 py-2">
                          {item.mime_type.startsWith('image/') ? (
                            <img
                              src={item.sizes?.sm?.url || item.url}
                              alt={item.alt}
                              className="w-12 h-12 object-cover rounded"
                              loading="lazy"
                            />
                          ) : (
                            <div className="w-12 h-12 bg-gray-50 rounded flex items-center justify-center text-gray-400 text-[10px] font-bold uppercase">
                              {item.mime_type.split('/')[1]?.slice(0, 4)}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-2 font-medium truncate max-w-[200px]">{item.original_name}</td>
                        <td className="px-4 py-2 text-[var(--text-muted)]">{item.mime_type.split('/')[1]}</td>
                        <td className="px-4 py-2 text-right text-[var(--text-muted)]">{formatSize(item.file_size)}</td>
                        <td className="px-4 py-2 text-right text-[var(--text-muted)]">{new Date(item.created_at).toLocaleDateString('de-DE')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 mt-6">
            <button
              onClick={() => setPage(page - 1)}
              disabled={page <= 1}
              className="px-3 py-1.5 text-xs border border-[var(--border)] rounded-md disabled:opacity-30 hover:bg-gray-50 transition-colors"
            >
              {t('common:previous')}
            </button>
            <span className="text-xs text-[var(--text-muted)]">{t('common:page_x_of_y', { page, total: totalPages })}</span>
            <button
              onClick={() => setPage(page + 1)}
              disabled={page >= totalPages}
              className="px-3 py-1.5 text-xs border border-[var(--border)] rounded-md disabled:opacity-30 hover:bg-gray-50 transition-colors"
            >
              {t('common:next')}
            </button>
          </div>
        )}
      </div>

      {/* Detail Panel */}
      {detailItem && (
        <MediaDetailPanel
          item={detailItem}
          onClose={() => setDetailItem(null)}
          onDeleted={() => { setDetailItem(null); refetch(); queryClient.invalidateQueries({ queryKey: ['media-folders'] }); }}
        />
      )}
    </div>
  );
}
