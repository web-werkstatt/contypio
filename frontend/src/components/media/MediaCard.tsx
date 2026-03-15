import { Pencil, Copy, Trash2, FileText, Film, File } from 'lucide-react';

export interface MediaItem {
  id: number;
  filename: string;
  original_name: string;
  mime_type: string;
  file_size: number;
  width: number | null;
  height: number | null;
  alt: string;
  caption: string | null;
  category: string;
  folder_id: number | null;
  tags: string[];
  url: string;
  sizes: Record<string, { url: string; width: number; height: number }>;
  created_at: string;
}

interface Props {
  item: MediaItem;
  selected: boolean;
  bulkMode: boolean;
  checked: boolean;
  onSelect(): void;
  onEdit(): void;
  onDelete(): void;
  onCopyUrl(): void;
  onCheckToggle(): void;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function isImage(mime: string): boolean {
  return mime.startsWith('image/');
}

function FileIcon({ mime }: { mime: string }) {
  if (mime === 'application/pdf') return <FileText size={32} className="text-red-400" />;
  if (mime.startsWith('video/')) return <Film size={32} className="text-purple-400" />;
  return <File size={32} className="text-gray-400" />;
}

export default function MediaCard({ item, selected, bulkMode, checked, onSelect, onEdit, onDelete, onCopyUrl, onCheckToggle }: Props) {
  const thumbUrl = item.sizes?.sm?.url || item.sizes?.md?.url || item.url;

  return (
    <div
      onClick={bulkMode ? onCheckToggle : onSelect}
      className={`group relative rounded-lg border overflow-hidden cursor-pointer transition-all ${
        selected ? 'border-[var(--primary)] ring-2 ring-[var(--primary)]/20'
        : checked ? 'border-blue-400 ring-2 ring-blue-400/20'
        : 'border-[var(--border)] hover:border-gray-300'
      }`}
    >
      {/* Checkbox */}
      <div
        className={`absolute top-2 left-2 z-10 transition-opacity ${
          bulkMode || checked ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
        }`}
      >
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => { e.stopPropagation(); onCheckToggle(); }}
          onClick={(e) => e.stopPropagation()}
          className="w-4 h-4 rounded border-gray-300 text-[var(--primary)] cursor-pointer"
        />
      </div>

      <div className="aspect-square bg-gray-50 flex items-center justify-center">
        {isImage(item.mime_type) ? (
          <img
            src={thumbUrl}
            alt={item.alt || item.original_name}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <FileIcon mime={item.mime_type} />
        )}
      </div>

      {/* Hover overlay (nur wenn nicht Bulk-Modus) */}
      {!bulkMode && (
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
          <button
            onClick={(e) => { e.stopPropagation(); onEdit(); }}
            className="p-2 bg-white rounded-full shadow hover:bg-gray-100 transition-colors"
            title="Bearbeiten"
          >
            <Pencil size={14} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onCopyUrl(); }}
            className="p-2 bg-white rounded-full shadow hover:bg-gray-100 transition-colors"
            title="URL kopieren"
          >
            <Copy size={14} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className="p-2 bg-white rounded-full shadow hover:bg-red-50 text-[var(--danger)] transition-colors"
            title="Löschen"
          >
            <Trash2 size={14} />
          </button>
        </div>
      )}

      {/* Info */}
      <div className="px-2.5 py-2 border-t border-[var(--border)]">
        <p className="text-xs font-medium truncate">{item.original_name}</p>
        <p className="text-[10px] text-[var(--text-muted)]">
          {formatSize(item.file_size)}
          {item.width && item.height ? ` · ${item.width}×${item.height}` : ''}
        </p>
      </div>
    </div>
  );
}
