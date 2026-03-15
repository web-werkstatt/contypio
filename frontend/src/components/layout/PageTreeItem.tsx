import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, FileText, GripVertical, Copy, Archive, MoreHorizontal } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { PageTreeNode } from '@/types/cms';

interface Props {
  node: PageTreeNode;
  activeId?: number;
  depth: number;
  onDuplicate?: (pageId: number) => void;
  onArchive?: (pageId: number) => void;
}

const TREE_DOT_COLORS: Record<string, string> = { published: 'bg-green-500', draft: 'bg-amber-400', scheduled: 'bg-blue-400', archived: 'bg-gray-400' };
const TREE_DOT_LABELS: Record<string, string> = { published: 'Publiziert', draft: 'Entwurf', scheduled: 'Geplant', archived: 'Archiviert' };

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'gerade';
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  return `${days}d`;
}

export default function PageTreeItem({ node, activeId, depth, onDuplicate, onArchive }: Props) {
  const [expanded, setExpanded] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const hasChildren = node.children && node.children.length > 0;
  const isActive = node.id === activeId;

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: node.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  // Close menu on outside click
  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [menuOpen]);

  return (
    <li ref={setNodeRef} style={style}>
      <div
        className={`group flex items-center gap-1 px-2 py-1.5 rounded-md cursor-pointer text-sm transition-colors ${isActive ? 'bg-[var(--primary-light)] text-[var(--primary)] font-medium' : 'text-[var(--text)] hover:bg-gray-50'}`}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
        onClick={() => navigate(`/pages/${node.id}`)}
      >
        <button
          {...attributes}
          {...listeners}
          className="p-0.5 cursor-grab active:cursor-grabbing text-[var(--text-muted)] hover:text-[var(--text)] shrink-0 touch-none"
          onClick={(e) => e.stopPropagation()}
          title="Ziehen zum Sortieren"
        >
          <GripVertical size={12} />
        </button>
        {hasChildren ? (
          <button
            onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
            className="p-0.5 hover:bg-gray-200 rounded shrink-0"
          >
            <ChevronRight size={12} className={`transition-transform ${expanded ? 'rotate-90' : ''}`} />
          </button>
        ) : (
          <span className="w-4 shrink-0" />
        )}
        <FileText size={14} className="shrink-0 text-[var(--text-muted)]" />
        <span className="truncate flex-1">{node.title}</span>

        {/* Updated time - visible on hover */}
        {node.updated_at && (
          <span className="text-[10px] text-[var(--text-muted)] opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
            {timeAgo(node.updated_at)}
          </span>
        )}

        {/* Context menu button */}
        <div className="relative shrink-0" ref={menuRef}>
          <button
            onClick={(e) => { e.stopPropagation(); setMenuOpen((v) => !v); }}
            className="p-0.5 rounded opacity-0 group-hover:opacity-100 hover:bg-gray-200 text-[var(--text-muted)] transition-all"
            title="Aktionen"
          >
            <MoreHorizontal size={12} />
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-full mt-1 bg-white rounded-lg border border-[var(--border)] shadow-lg z-30 py-1 w-40">
              <button
                onClick={(e) => { e.stopPropagation(); setMenuOpen(false); onDuplicate?.(node.id); }}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-[var(--text)] hover:bg-gray-50 transition-colors"
              >
                <Copy size={12} /> Duplizieren
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuOpen(false);
                  if (confirm(`"${node.title}" archivieren?`)) onArchive?.(node.id);
                }}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-amber-600 hover:bg-amber-50 transition-colors"
              >
                <Archive size={12} /> Archivieren
              </button>
            </div>
          )}
        </div>

        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${TREE_DOT_COLORS[node.status] ?? 'bg-gray-400'}`} title={TREE_DOT_LABELS[node.status] ?? node.status} />
      </div>
      {hasChildren && expanded && (
        <ul className="space-y-0.5">
          {node.children!.map((child: PageTreeNode) => (
            <PageTreeItem key={child.id} node={child} activeId={activeId} depth={depth + 1} onDuplicate={onDuplicate} onArchive={onArchive} />
          ))}
        </ul>
      )}
    </li>
  );
}
