import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Search, Plus, Upload, Navigation, Database, Settings, LayoutDashboard,
  FileText, Share2, Sliders,
} from 'lucide-react';
import api from '@/lib/api';
import type { Page, CollectionSchema, GlobalConfig } from '@/types/cms';

interface Command {
  id: string;
  category: string;
  title: string;
  icon: React.ReactNode;
  action: () => void;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onNewPage: () => void;
}

export default function CommandPalette({ open, onClose, onNewPage }: Props) {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const { data: pages } = useQuery<Page[]>({
    queryKey: ['pages'],
    queryFn: async () => (await api.get('/api/pages')).data,
    enabled: open,
  });

  const { data: collections } = useQuery<CollectionSchema[]>({
    queryKey: ['collections'],
    queryFn: async () => (await api.get('/api/collections')).data,
    enabled: open,
  });

  const { data: globals } = useQuery<GlobalConfig[]>({
    queryKey: ['globals'],
    queryFn: async () => (await api.get('/api/globals')).data,
    enabled: open,
  });

  const go = useCallback((path: string) => { onClose(); navigate(path); }, [onClose, navigate]);

  const commands: Command[] = [
    // Aktionen
    { id: 'new-page', category: 'Aktionen', title: 'Neue Seite erstellen', icon: <Plus size={16} />, action: () => { onClose(); onNewPage(); } },
    { id: 'upload', category: 'Aktionen', title: 'Medien hochladen', icon: <Upload size={16} />, action: () => go('/media') },
    { id: 'new-collection', category: 'Aktionen', title: 'Collection erstellen', icon: <Database size={16} />, action: () => go('/collections/new') },
    { id: 'nav', category: 'Aktionen', title: 'Navigation bearbeiten', icon: <Navigation size={16} />, action: () => go('/globals/navigation') },
    { id: 'dashboard', category: 'Aktionen', title: 'Dashboard', icon: <LayoutDashboard size={16} />, action: () => go('/') },

    // Seiten
    ...(pages?.map((p) => ({
      id: `page-${p.id}`,
      category: 'Seiten',
      title: p.title,
      icon: <FileText size={16} />,
      action: () => go(`/pages/${p.id}`),
    })) ?? []),

    // Collections
    ...(collections?.map((c) => ({
      id: `col-${c.collection_key}`,
      category: 'Collections',
      title: c.label,
      icon: <Database size={16} />,
      action: () => go(`/collections/${c.collection_key}`),
    })) ?? []),

    // Einstellungen
    ...(globals?.map((g) => {
      const icon = g.slug === 'navigation' ? <Navigation size={16} />
        : g.slug === 'social-media' ? <Share2 size={16} />
        : g.slug === 'site-settings' ? <Sliders size={16} />
        : <Settings size={16} />;
      return {
        id: `global-${g.slug}`,
        category: 'Einstellungen',
        title: g.label,
        icon,
        action: () => go(`/globals/${g.slug}`),
      };
    }) ?? []),
  ];

  const filtered = query.trim()
    ? commands.filter((c) => c.title.toLowerCase().includes(query.toLowerCase()))
    : commands;

  // Reset on open/query change
  useEffect(() => { setSelectedIndex(0); }, [query, open]);
  useEffect(() => { if (open) { setQuery(''); setTimeout(() => inputRef.current?.focus(), 0); } }, [open]);

  // Scroll selected item into view
  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-index="${selectedIndex}"]`);
    el?.scrollIntoView({ block: 'nearest' });
  }, [selectedIndex]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && filtered[selectedIndex]) {
      e.preventDefault();
      filtered[selectedIndex].action();
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!open) return null;

  // Group by category, preserving order
  const categories: { name: string; items: (Command & { globalIndex: number })[] }[] = [];
  let globalIdx = 0;
  for (const cmd of filtered) {
    let cat = categories.find((c) => c.name === cmd.category);
    if (!cat) { cat = { name: cmd.category, items: [] }; categories.push(cat); }
    cat.items.push({ ...cmd, globalIndex: globalIdx++ });
  }

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/40 z-50" onClick={onClose} />

      {/* Palette */}
      <div className="fixed top-[20%] left-1/2 -translate-x-1/2 w-full max-w-lg bg-white rounded-xl shadow-2xl z-50 overflow-hidden border border-[var(--border)]">
        {/* Search */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--border)]">
          <Search size={18} className="text-[var(--text-muted)] shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Suche im CMS..."
            className="flex-1 text-sm outline-none bg-transparent placeholder:text-[var(--text-muted)]"
          />
          <kbd className="text-[10px] text-[var(--text-muted)] bg-gray-100 px-1.5 py-0.5 rounded font-mono">ESC</kbd>
        </div>

        {/* Results */}
        <div ref={listRef} className="max-h-80 overflow-auto py-2">
          {filtered.length === 0 ? (
            <p className="px-4 py-6 text-sm text-[var(--text-muted)] text-center">Keine Ergebnisse</p>
          ) : (
            categories.map((cat) => (
              <div key={cat.name}>
                <div className="px-4 pt-2 pb-1">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">{cat.name}</span>
                </div>
                {cat.items.map((cmd) => (
                  <button
                    key={cmd.id}
                    data-index={cmd.globalIndex}
                    onClick={cmd.action}
                    onMouseEnter={() => setSelectedIndex(cmd.globalIndex)}
                    className={`w-full flex items-center gap-3 px-4 py-2 text-sm text-left transition-colors ${
                      cmd.globalIndex === selectedIndex
                        ? 'bg-[var(--primary-light)] text-[var(--primary)]'
                        : 'text-[var(--text)] hover:bg-gray-50'
                    }`}
                  >
                    <span className={cmd.globalIndex === selectedIndex ? 'text-[var(--primary)]' : 'text-[var(--text-muted)]'}>{cmd.icon}</span>
                    <span className="flex-1">{cmd.title}</span>
                  </button>
                ))}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t border-[var(--border)] flex items-center gap-4 text-[10px] text-[var(--text-muted)]">
          <span><kbd className="bg-gray-100 px-1 py-0.5 rounded font-mono">&#8593;&#8595;</kbd> navigieren</span>
          <span><kbd className="bg-gray-100 px-1 py-0.5 rounded font-mono">Enter</kbd> oeffnen</span>
          <span><kbd className="bg-gray-100 px-1 py-0.5 rounded font-mono">ESC</kbd> schließen</span>
        </div>
      </div>
    </>
  );
}
