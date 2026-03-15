import { useState, useEffect } from 'react';
import { Copy, X } from 'lucide-react';

interface Props {
  title: string;
  slug: string;
  open: boolean;
  onClose: () => void;
  onConfirm: (title: string, slug: string) => void;
}

function titleToSlug(t: string): string {
  return t
    .toLowerCase()
    .replace(/[äöüß]/g, (c) => ({ ä: 'ae', ö: 'oe', ü: 'ue', ß: 'ss' })[c] || c)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export default function DuplicateDialog({ title, slug, open, onClose, onConfirm }: Props) {
  const [newTitle, setNewTitle] = useState('');
  const [newSlug, setNewSlug] = useState('');
  const [slugEdited, setSlugEdited] = useState(false);

  useEffect(() => {
    if (open) {
      const t = `${title} (Kopie)`;
      setNewTitle(t);
      setNewSlug(`${slug}-kopie`);
      setSlugEdited(false);
    }
  }, [open, title, slug]);

  const handleTitleChange = (val: string) => {
    setNewTitle(val);
    if (!slugEdited) {
      setNewSlug(titleToSlug(val));
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Copy size={16} />
            Seite duplizieren
          </h3>
          <button onClick={onClose} className="p-1 rounded hover:bg-gray-100 transition-colors">
            <X size={16} className="text-[var(--text-muted)]" />
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium mb-1">Titel der Kopie</label>
            <input
              value={newTitle}
              onChange={(e) => handleTitleChange(e.target.value)}
              className="w-full px-3 py-2 border border-[var(--border)] rounded-md text-sm"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">Slug</label>
            <input
              value={newSlug}
              onChange={(e) => { setNewSlug(e.target.value); setSlugEdited(true); }}
              className="w-full px-3 py-2 border border-[var(--border)] rounded-md text-sm font-mono"
            />
            <p className="text-[10px] text-[var(--text-muted)] mt-0.5">URL-Pfad: /{newSlug}</p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 mt-5">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-sm text-[var(--text-muted)] border border-[var(--border)] rounded-md hover:bg-gray-50 transition-colors"
          >
            Abbrechen
          </button>
          <button
            onClick={() => onConfirm(newTitle, newSlug)}
            disabled={!newTitle.trim() || !newSlug.trim()}
            className="px-4 py-1.5 text-sm bg-[var(--primary)] text-white rounded-md hover:bg-[var(--primary-dark)] disabled:opacity-50 transition-colors"
          >
            Duplizieren
          </button>
        </div>
      </div>
    </div>
  );
}
