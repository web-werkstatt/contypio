import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { X, Upload, Search, Image as ImageIcon, ChevronRight, Home, Folder } from 'lucide-react';
import api from '@/lib/api';
import type { FolderItem } from './FolderCard';

interface MediaItem {
  id: number;
  filename: string;
  original_name: string;
  mime_type: string;
  width: number | null;
  height: number | null;
  alt: string;
  url: string;
  sizes: Record<string, { url: string; width: number; height: number }>;
}

interface MediaListResponse {
  items: MediaItem[];
  total: number;
  page: number;
  per_page: number;
}

interface BreadcrumbItem {
  id: number;
  name: string;
}

interface Props {
  value: string | number | null;
  onChange(mediaId: number | null, media: MediaItem | null): void;
}

function MediaPickerDialog({ onSelect, onClose }: { onSelect(media: MediaItem): void; onClose(): void }) {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [folderId, setFolderId] = useState<number | null>(null);
  const queryClient = useQueryClient();

  const { data: folders = [] } = useQuery<FolderItem[]>({
    queryKey: ['media-picker-folders', folderId],
    queryFn: async () => {
      const params = folderId ? `?parent_id=${folderId}` : '';
      return (await api.get(`/api/media/folders${params}`)).data;
    },
  });

  const { data: breadcrumb = [] } = useQuery<BreadcrumbItem[]>({
    queryKey: ['media-picker-breadcrumb', folderId],
    queryFn: async () => {
      if (!folderId) return [];
      return (await api.get(`/api/media/folders/${folderId}/breadcrumb`)).data;
    },
    enabled: folderId !== null,
  });

  const { data, isLoading } = useQuery<MediaListResponse>({
    queryKey: ['media-picker', search, page, folderId],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), per_page: '24' });
      if (search) params.set('search', search);
      if (folderId !== null) {
        params.set('folder_id', String(folderId));
      } else {
        params.set('root', 'true');
      }
      return (await api.get(`/api/media?${params}`)).data;
    },
  });

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const form = new FormData();
      form.append('file', file);
      if (folderId) form.append('folder_id', String(folderId));
      return (await api.post('/api/media/upload', form)).data as MediaItem;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['media-picker'] });
      queryClient.invalidateQueries({ queryKey: ['media-picker-folders'] });
    },
  });

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) uploadMutation.mutate(file);
  }, [uploadMutation]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadMutation.mutate(file);
    e.target.value = '';
  }, [uploadMutation]);

  const navigateToFolder = (id: number | null) => {
    setFolderId(id);
    setPage(1);
  };

  const totalPages = data ? Math.ceil(data.total / data.per_page) : 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl w-[700px] max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-[var(--border)]">
          <h3 className="text-sm font-semibold">Medien-Bibliothek</h3>
          <button onClick={onClose} className="p-1 rounded hover:bg-gray-100"><X size={16} /></button>
        </div>

        {/* Breadcrumb */}
        <div className="flex items-center gap-1 px-5 py-2 border-b border-[var(--border)] bg-gray-50 text-xs">
          <button
            onClick={() => navigateToFolder(null)}
            className={`flex items-center gap-1 px-2 py-1 rounded hover:bg-gray-200 transition-colors ${
              folderId === null ? 'font-semibold text-[var(--primary)]' : 'text-[var(--text-muted)]'
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
                  crumb.id === folderId ? 'font-semibold text-[var(--primary)]' : 'text-[var(--text-muted)]'
                }`}
              >
                {crumb.name}
              </button>
            </span>
          ))}
        </div>

        {/* Search + Upload */}
        <div className="flex items-center gap-3 px-5 py-3 border-b border-[var(--border)]">
          <div className="flex items-center gap-2 flex-1 px-3 py-1.5 border border-[var(--border)] rounded-md">
            <Search size={14} className="text-gray-400" />
            <input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Suchen..."
              className="flex-1 text-sm border-none outline-none bg-transparent"
            />
          </div>
          <label className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-[var(--border)] rounded-md hover:bg-gray-50 cursor-pointer transition-colors">
            <Upload size={14} /> Hochladen
            <input type="file" accept="image/*" className="hidden" onChange={handleFileInput} />
          </label>
        </div>

        {/* Grid */}
        <div
          className="flex-1 overflow-auto p-5"
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
        >
          {uploadMutation.isPending && (
            <div className="mb-3 text-xs text-[var(--primary)]">Wird hochgeladen...</div>
          )}

          {/* Folders */}
          {folders.length > 0 && !search && (
            <div className="grid grid-cols-4 gap-3 mb-4">
              {folders.map((folder) => (
                <button
                  key={`folder-${folder.id}`}
                  onClick={() => navigateToFolder(folder.id)}
                  className="flex flex-col items-center gap-1 p-3 rounded-lg border border-[var(--border)] hover:border-amber-300 hover:bg-amber-50 transition-all"
                >
                  <Folder size={24} className="text-amber-400" />
                  <span className="text-[10px] truncate max-w-full">{folder.name}</span>
                </button>
              ))}
            </div>
          )}

          {isLoading ? (
            <div className="text-center py-12 text-sm text-[var(--text-muted)]">Laden...</div>
          ) : data && data.items.length > 0 ? (
            <div className="grid grid-cols-4 gap-3">
              {data.items.map((item) => (
                <button
                  key={item.id}
                  onClick={() => onSelect(item)}
                  className="group relative aspect-square rounded-lg border border-[var(--border)] overflow-hidden hover:border-[var(--primary)] hover:ring-2 hover:ring-[var(--primary)]/20 transition-all"
                >
                  {item.mime_type.startsWith('image/') ? (
                    <img
                      src={item.sizes?.sm?.url || item.url}
                      alt={item.alt || item.original_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-50">
                      <span className="text-xs font-bold text-gray-300 uppercase">
                        {item.mime_type.split('/')[1]?.slice(0, 4)}
                      </span>
                    </div>
                  )}
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent px-2 py-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-[10px] text-white truncate block">{item.original_name}</span>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <ImageIcon size={32} className="mx-auto text-gray-300 mb-2" />
              <p className="text-sm text-[var(--text-muted)]">
                {search ? 'Keine Ergebnisse' : 'Noch keine Medien vorhanden'}
              </p>
              <p className="text-xs text-gray-400 mt-1">Bilder hierher ziehen oder hochladen</p>
            </div>
          )}
        </div>

        {/* Pagination */}
        {data && totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 px-5 py-3 border-t border-[var(--border)]">
            <button onClick={() => setPage(page - 1)} disabled={page <= 1} className="px-2 py-1 text-xs border rounded disabled:opacity-30">Zurück</button>
            <span className="text-xs text-[var(--text-muted)]">{page} / {totalPages}</span>
            <button onClick={() => setPage(page + 1)} disabled={page >= totalPages} className="px-2 py-1 text-xs border rounded disabled:opacity-30">Weiter</button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function MediaPicker({ value, onChange }: Props) {
  const [open, setOpen] = useState(false);

  const { data: selected } = useQuery<MediaItem>({
    queryKey: ['media', value],
    queryFn: async () => (await api.get(`/api/media/${value}`)).data,
    enabled: !!value,
  });

  return (
    <div>
      {selected ? (
        <div className="flex items-start gap-3 p-2 border border-[var(--border)] rounded-md">
          {selected.mime_type?.startsWith('image/') ? (
            <img
              src={selected.sizes?.sm?.url || selected.url}
              alt={selected.alt}
              className="w-20 h-20 object-cover rounded"
            />
          ) : (
            <div className="w-20 h-20 bg-gray-50 rounded flex items-center justify-center text-gray-400 text-xs font-bold uppercase">
              {selected.mime_type?.split('/')[1]?.slice(0, 4)}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium truncate">{selected.original_name}</p>
            <p className="text-[10px] text-[var(--text-muted)]">
              {selected.width && selected.height ? `${selected.width}×${selected.height} · ` : ''}ID: {selected.id}
            </p>
            <div className="flex gap-2 mt-2">
              <button onClick={() => setOpen(true)} className="text-xs text-[var(--primary)] hover:underline">Ändern</button>
              <button onClick={() => onChange(null, null)} className="text-xs text-[var(--danger)] hover:underline">Entfernen</button>
            </div>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 w-full px-3 py-3 border border-dashed border-gray-300 rounded-md text-xs text-[var(--text-muted)] hover:border-[var(--primary)] hover:text-[var(--primary)] transition-colors"
        >
          <ImageIcon size={16} /> Bild auswählen
        </button>
      )}

      {open && (
        <MediaPickerDialog
          onSelect={(media) => {
            onChange(media.id, media);
            setOpen(false);
          }}
          onClose={() => setOpen(false)}
        />
      )}
    </div>
  );
}
