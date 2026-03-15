import { Folder, MoreVertical, Pencil, Trash2 } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

export interface FolderItem {
  id: number;
  name: string;
  parent_id: number | null;
  position: number;
  created_at: string;
  file_count: number;
  subfolder_count: number;
}

interface Props {
  folder: FolderItem;
  onOpen(): void;
  onRename(name: string): void;
  onDelete(): void;
  onMoveTo?(): void;
}

export default function FolderCard({ folder, onOpen, onRename, onDelete }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [name, setName] = useState(folder.name);
  const inputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (renaming && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [renaming]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    if (menuOpen) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [menuOpen]);

  const handleRenameSubmit = () => {
    if (name.trim() && name !== folder.name) {
      onRename(name.trim());
    } else {
      setName(folder.name);
    }
    setRenaming(false);
  };

  return (
    <div
      onClick={renaming ? undefined : onOpen}
      className="group relative rounded-lg border border-[var(--border)] hover:border-gray-300 overflow-hidden cursor-pointer transition-all"
    >
      <div className="aspect-square bg-gray-50 flex flex-col items-center justify-center gap-2">
        <Folder size={40} className="text-amber-400" />
        {renaming ? (
          <input
            ref={inputRef}
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={handleRenameSubmit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleRenameSubmit();
              if (e.key === 'Escape') { setName(folder.name); setRenaming(false); }
            }}
            onClick={(e) => e.stopPropagation()}
            className="w-[80%] px-2 py-1 text-xs text-center border border-[var(--border)] rounded"
          />
        ) : (
          <span className="text-xs font-medium text-center px-2 truncate max-w-full">{folder.name}</span>
        )}
        <span className="text-[10px] text-[var(--text-muted)]">
          {folder.file_count} Dateien{folder.subfolder_count > 0 ? ` · ${folder.subfolder_count} Ordner` : ''}
        </span>
      </div>

      {/* Context Menu Button */}
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity" ref={menuRef}>
        <button
          onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen); }}
          className="p-1 rounded hover:bg-gray-200 transition-colors"
        >
          <MoreVertical size={14} />
        </button>
        {menuOpen && (
          <div className="absolute right-0 top-8 bg-white border border-[var(--border)] rounded-md shadow-lg py-1 min-w-[140px] z-20">
            <button
              onClick={(e) => { e.stopPropagation(); setMenuOpen(false); setRenaming(true); }}
              className="flex items-center gap-2 w-full px-3 py-1.5 text-xs hover:bg-gray-50 transition-colors"
            >
              <Pencil size={12} /> Umbenennen
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); setMenuOpen(false); onDelete(); }}
              className="flex items-center gap-2 w-full px-3 py-1.5 text-xs text-[var(--danger)] hover:bg-red-50 transition-colors"
            >
              <Trash2 size={12} /> Löschen
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
