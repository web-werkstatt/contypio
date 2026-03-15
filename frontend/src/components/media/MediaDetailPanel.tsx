import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { X, Copy, Trash2, Save, Plus } from 'lucide-react';
import api from '@/lib/api';
import type { MediaItem } from './MediaCard';

interface Props {
  item: MediaItem;
  onClose(): void;
  onDeleted(): void;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function MediaDetailPanel({ item, onClose, onDeleted }: Props) {
  const queryClient = useQueryClient();
  const [alt, setAlt] = useState(item.alt || '');
  const [caption, setCaption] = useState(item.caption || '');
  const [category, setCategory] = useState(item.category || 'general');
  const [tags, setTags] = useState<string[]>(item.tags || []);
  const [newTag, setNewTag] = useState('');

  const isDirty =
    alt !== (item.alt || '') ||
    caption !== (item.caption || '') ||
    category !== (item.category || 'general') ||
    JSON.stringify(tags) !== JSON.stringify(item.tags || []);

  useEffect(() => {
    setAlt(item.alt || '');
    setCaption(item.caption || '');
    setCategory(item.category || 'general');
    setTags(item.tags || []);
    setNewTag('');
  }, [item]);

  const { data: usage } = useQuery<{ pages: { id: number; title: string; block_type: string }[] }>({
    queryKey: ['media-usage', item.id],
    queryFn: async () => (await api.get(`/api/media/${item.id}/usage`)).data,
  });

  const saveMutation = useMutation({
    mutationFn: async () => (await api.patch(`/api/media/${item.id}`, { alt, caption, category, tags })).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['media-library'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => api.delete(`/api/media/${item.id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['media-library'] });
      onDeleted();
    },
  });

  const handleDelete = () => {
    const usedIn = usage?.pages?.length || 0;
    const msg = usedIn > 0
      ? `Dieses Bild wird in ${usedIn} Seite(n) verwendet. Trotzdem löschen?`
      : 'Datei unwiderruflich löschen?';
    if (confirm(msg)) deleteMutation.mutate();
  };

  const addTag = () => {
    const tag = newTag.trim().toLowerCase();
    if (tag && !tags.includes(tag)) {
      setTags([...tags, tag]);
    }
    setNewTag('');
  };

  const removeTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  const copyUrl = () => {
    navigator.clipboard.writeText(item.url);
  };

  const imgUrl = item.sizes?.md?.url || item.sizes?.lg?.url || item.url;
  const isImage = item.mime_type.startsWith('image/');

  return (
    <div className="fixed inset-y-0 right-0 z-40 w-[400px] bg-white border-l border-[var(--border)] shadow-xl flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-[var(--border)]">
        <h3 className="text-sm font-semibold">Mediendetails</h3>
        <button onClick={onClose} className="p-1 rounded hover:bg-gray-100"><X size={16} /></button>
      </div>

      <div className="flex-1 overflow-auto p-5 space-y-5">
        {/* Preview */}
        <div className="bg-gray-50 rounded-lg overflow-hidden flex items-center justify-center min-h-[120px]">
          {isImage ? (
            <img src={imgUrl} alt={item.alt} className="w-full object-contain max-h-64" />
          ) : (
            <div className="py-8 text-center">
              <div className="text-3xl font-bold text-gray-300 uppercase">
                {item.mime_type.split('/')[1]?.slice(0, 4)}
              </div>
              <p className="text-xs text-[var(--text-muted)] mt-2">{item.original_name}</p>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="space-y-1 text-xs">
          <div className="flex justify-between">
            <span className="text-[var(--text-muted)]">Dateiname</span>
            <span className="font-medium truncate ml-2">{item.original_name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[var(--text-muted)]">Format</span>
            <span>{item.mime_type}{item.width && item.height ? `, ${item.width}×${item.height}px` : ''}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[var(--text-muted)]">Größe</span>
            <span>{formatSize(item.file_size)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[var(--text-muted)]">Hochgeladen</span>
            <span>{new Date(item.created_at).toLocaleDateString('de-DE')}</span>
          </div>
        </div>

        {/* Editable fields */}
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium mb-1">Alt-Text *</label>
            <input
              value={alt}
              onChange={(e) => setAlt(e.target.value)}
              className="w-full px-2.5 py-1.5 border border-[var(--border)] rounded-md text-sm"
              placeholder="Bildbeschreibung für SEO und Barrierefreiheit"
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">Bildunterschrift</label>
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              rows={2}
              className="w-full px-2.5 py-1.5 border border-[var(--border)] rounded-md text-sm"
              placeholder="Optionale Bildunterschrift"
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">Kategorie</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-2.5 py-1.5 border border-[var(--border)] rounded-md text-sm"
            >
              <option value="general">Allgemein</option>
              <option value="hero">Hero</option>
              <option value="gallery">Galerie</option>
              <option value="logo">Logo</option>
              <option value="document">Dokument</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">Tags</label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 rounded-full text-[11px]"
                >
                  {tag}
                  <button onClick={() => removeTag(tag)} className="text-gray-400 hover:text-[var(--danger)]">
                    <X size={10} />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-1">
              <input
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
                className="flex-1 px-2.5 py-1.5 border border-[var(--border)] rounded-md text-sm"
                placeholder="Tag hinzufügen..."
              />
              <button
                onClick={addTag}
                disabled={!newTag.trim()}
                className="px-2 py-1.5 border border-[var(--border)] rounded-md hover:bg-gray-50 disabled:opacity-30 transition-colors"
              >
                <Plus size={14} />
              </button>
            </div>
          </div>
        </div>

        {/* Usage */}
        {usage?.pages && usage.pages.length > 0 && (
          <div>
            <p className="text-xs font-medium mb-1.5">Verwendet in:</p>
            <div className="space-y-1">
              {usage.pages.map((p) => (
                <div key={`${p.id}-${p.block_type}`} className="text-xs text-[var(--text-muted)]">
                  · {p.title} ({p.block_type})
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={copyUrl}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-[var(--border)] rounded-md hover:bg-gray-50 transition-colors"
          >
            <Copy size={12} /> URL kopieren
          </button>
        </div>
      </div>

      {/* Footer */}
      <div className="px-5 py-3 border-t border-[var(--border)] space-y-2">
        <button
          onClick={() => saveMutation.mutate()}
          disabled={!isDirty || saveMutation.isPending}
          className="w-full flex items-center justify-center gap-1.5 px-4 py-2 text-sm bg-[var(--primary)] text-white rounded-md hover:bg-[var(--primary-dark)] disabled:opacity-40 transition-colors"
        >
          <Save size={14} /> {saveMutation.isPending ? 'Speichern...' : 'Speichern'}
        </button>
        <button
          onClick={handleDelete}
          disabled={deleteMutation.isPending}
          className="w-full flex items-center justify-center gap-1.5 px-4 py-2 text-sm text-[var(--danger)] border border-[var(--border)] rounded-md hover:bg-red-50 transition-colors"
        >
          <Trash2 size={14} /> Löschen
        </button>
      </div>
    </div>
  );
}
