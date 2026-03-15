import { useState } from 'react';
import { Plus, Pencil, Trash2, ChevronDown, ChevronRight, GripVertical } from 'lucide-react';

interface MenuItem {
  label: string;
  href: string;
  newTab?: boolean;
  children?: MenuItem[];
}

interface Props {
  data: Record<string, unknown>;
  onChange: (data: Record<string, unknown>) => void;
}

function MenuItemRow({
  item,
  depth,
  onEdit,
  onDelete,
  onAddChild,
}: {
  item: MenuItem;
  depth: number;
  onEdit: () => void;
  onDelete: () => void;
  onAddChild?: () => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = item.children && item.children.length > 0;

  return (
    <div>
      <div
        className="flex items-center gap-2 px-3 py-2 border-b border-[var(--border)] hover:bg-gray-50"
        style={{ paddingLeft: `${12 + depth * 24}px` }}
      >
        <GripVertical size={14} className="text-[var(--text-muted)] shrink-0" />
        {hasChildren ? (
          <button onClick={() => setExpanded(!expanded)} className="shrink-0">
            {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </button>
        ) : (
          <span className="w-[14px] shrink-0" />
        )}
        <span className="text-sm flex-1">{item.label}</span>
        <span className="text-xs text-[var(--text-muted)] font-mono">&rarr; {item.href}</span>
        <button onClick={onEdit} className="p-1 text-[var(--text-muted)] hover:text-[var(--primary)]" title="Bearbeiten"><Pencil size={12} /></button>
        <button onClick={onDelete} className="p-1 text-[var(--text-muted)] hover:text-[var(--danger)]" title="Löschen"><Trash2 size={12} /></button>
        {onAddChild && (
          <button onClick={onAddChild} className="p-1 text-[var(--text-muted)] hover:text-[var(--primary)]" title="Unterpunkt hinzufügen"><Plus size={12} /></button>
        )}
      </div>
      {expanded && hasChildren && item.children!.map((child, i) => (
        <MenuItemRow
          key={i}
          item={child}
          depth={depth + 1}
          onEdit={() => onEdit()}
          onDelete={() => onDelete()}
        />
      ))}
    </div>
  );
}

function MenuItemDialog({
  item,
  onSave,
  onCancel,
}: {
  item?: MenuItem;
  onSave: (item: MenuItem) => void;
  onCancel: () => void;
}) {
  const [label, setLabel] = useState(item?.label ?? '');
  const [href, setHref] = useState(item?.href ?? '');

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-sm p-5">
        <h3 className="text-sm font-semibold mb-3">{item ? 'Menüpunkt bearbeiten' : 'Neuer Menüpunkt'}</h3>
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium mb-1">Label</label>
            <input type="text" value={label} onChange={(e) => setLabel(e.target.value)} className="w-full px-3 py-2 text-sm border border-[var(--border)] rounded-md" autoFocus />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">Link (href)</label>
            <input type="text" value={href} onChange={(e) => setHref(e.target.value)} className="w-full px-3 py-2 text-sm border border-[var(--border)] rounded-md font-mono" />
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <button onClick={onCancel} className="px-3 py-1.5 text-sm border border-[var(--border)] rounded-md">Abbrechen</button>
          <button
            onClick={() => { if (label && href) onSave({ label, href, children: item?.children ?? [] }); }}
            className="px-3 py-1.5 text-sm bg-[var(--primary)] text-white rounded-md"
          >
            Speichern
          </button>
        </div>
      </div>
    </div>
  );
}

type EditTarget = { section: 'main' | 'footer'; path: number[] } | null;

export default function NavigationEditor({ data, onChange }: Props) {
  const mainMenu = (data.main_menu ?? []) as MenuItem[];
  const footerLinks = (data.footer_links ?? []) as MenuItem[];
  const [editTarget, setEditTarget] = useState<EditTarget>(null);
  const [isNew, setIsNew] = useState(false);

  const updateMainMenu = (items: MenuItem[]) => onChange({ ...data, main_menu: items });
  const updateFooterLinks = (items: MenuItem[]) => onChange({ ...data, footer_links: items });

  const getItemAtPath = (items: MenuItem[], path: number[]): MenuItem | undefined => {
    let current = items[path[0]];
    for (let i = 1; i < path.length; i++) {
      if (!current?.children) return undefined;
      current = current.children[path[i]];
    }
    return current;
  };

  const updateItemAtPath = (items: MenuItem[], path: number[], updated: MenuItem): MenuItem[] => {
    const result = [...items];
    if (path.length === 1) {
      result[path[0]] = { ...result[path[0]], label: updated.label, href: updated.href };
      return result;
    }
    const parent = { ...result[path[0]], children: [...(result[path[0]].children ?? [])] };
    parent.children![path[1]] = { ...parent.children![path[1]], label: updated.label, href: updated.href };
    result[path[0]] = parent;
    return result;
  };

  const deleteItemAtPath = (items: MenuItem[], path: number[]): MenuItem[] => {
    if (path.length === 1) {
      return items.filter((_, i) => i !== path[0]);
    }
    const result = [...items];
    const parent = { ...result[path[0]], children: [...(result[path[0]].children ?? [])] };
    parent.children = parent.children!.filter((_, i) => i !== path[1]);
    result[path[0]] = parent;
    return result;
  };

  const openEdit = (section: 'main' | 'footer', path: number[]) => {
    setEditTarget({ section, path });
    setIsNew(false);
  };

  const openNew = (section: 'main' | 'footer') => {
    setEditTarget({ section, path: [] });
    setIsNew(true);
  };

  const handleSave = (item: MenuItem) => {
    if (!editTarget) return;
    const { section, path } = editTarget;
    const items = section === 'main' ? [...mainMenu] : [...footerLinks];
    const update = section === 'main' ? updateMainMenu : updateFooterLinks;

    if (isNew) {
      update([...items, item]);
    } else {
      update(updateItemAtPath(items, path, item));
    }
    setEditTarget(null);
  };

  const handleDelete = (section: 'main' | 'footer', path: number[]) => {
    const items = section === 'main' ? mainMenu : footerLinks;
    const update = section === 'main' ? updateMainMenu : updateFooterLinks;
    update(deleteItemAtPath(items, path));
  };

  const addChildToMain = (parentIdx: number) => {
    const items = [...mainMenu];
    const parent = { ...items[parentIdx], children: [...(items[parentIdx].children ?? [])] };
    parent.children.push({ label: 'Neu', href: '/', children: [] });
    items[parentIdx] = parent;
    updateMainMenu(items);
  };

  const renderMainItem = (item: MenuItem, idx: number) => (
    <div key={idx}>
      <MenuItemRow
        item={item}
        depth={0}
        onEdit={() => openEdit('main', [idx])}
        onDelete={() => handleDelete('main', [idx])}
        onAddChild={() => addChildToMain(idx)}
      />
      {item.children?.map((child, ci) => (
        <div key={ci} className="flex items-center gap-2 px-3 py-2 border-b border-[var(--border)] hover:bg-gray-50" style={{ paddingLeft: '36px' }}>
          <span className="text-xs text-[var(--text-muted)]">└</span>
          <span className="text-sm flex-1">{child.label}</span>
          <span className="text-xs text-[var(--text-muted)] font-mono">&rarr; {child.href}</span>
          <button onClick={() => openEdit('main', [idx, ci])} className="p-1 text-[var(--text-muted)] hover:text-[var(--primary)]" title="Bearbeiten"><Pencil size={12} /></button>
          <button onClick={() => handleDelete('main', [idx, ci])} className="p-1 text-[var(--text-muted)] hover:text-[var(--danger)]" title="Löschen"><Trash2 size={12} /></button>
        </div>
      ))}
    </div>
  );

  const editItem = editTarget && !isNew
    ? getItemAtPath(editTarget.section === 'main' ? mainMenu : footerLinks, editTarget.path)
    : undefined;

  return (
    <div className="space-y-6">
      <div className="bg-white border border-[var(--border)] rounded-lg">
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)] bg-gray-50">
          <span className="text-sm font-medium">Hauptmenü</span>
          <button
            onClick={() => openNew('main')}
            className="flex items-center gap-1 text-xs text-[var(--primary)] hover:underline"
          >
            <Plus size={12} /> Hinzufügen
          </button>
        </div>
        {mainMenu.map((item, i) => renderMainItem(item, i))}
        {mainMenu.length === 0 && (
          <div className="px-4 py-6 text-center text-sm text-[var(--text-muted)]">Keine Menüpunkte vorhanden</div>
        )}
      </div>

      <div className="bg-white border border-[var(--border)] rounded-lg">
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)] bg-gray-50">
          <span className="text-sm font-medium">Footer-Links</span>
          <button
            onClick={() => openNew('footer')}
            className="flex items-center gap-1 text-xs text-[var(--primary)] hover:underline"
          >
            <Plus size={12} /> Hinzufügen
          </button>
        </div>
        {footerLinks.map((item, i) => (
          <div key={i} className="flex items-center gap-2 px-4 py-2 border-b border-[var(--border)] last:border-0 hover:bg-gray-50">
            <GripVertical size={14} className="text-[var(--text-muted)]" />
            <span className="text-sm flex-1">{item.label}</span>
            <span className="text-xs text-[var(--text-muted)] font-mono">&rarr; {item.href}</span>
            <button onClick={() => openEdit('footer', [i])} className="p-1 text-[var(--text-muted)] hover:text-[var(--primary)]" title="Bearbeiten"><Pencil size={12} /></button>
            <button onClick={() => handleDelete('footer', [i])} className="p-1 text-[var(--text-muted)] hover:text-[var(--danger)]" title="Löschen"><Trash2 size={12} /></button>
          </div>
        ))}
        {footerLinks.length === 0 && (
          <div className="px-4 py-6 text-center text-sm text-[var(--text-muted)]">Keine Footer-Links</div>
        )}
      </div>

      {editTarget && (
        <MenuItemDialog
          item={editItem}
          onSave={handleSave}
          onCancel={() => setEditTarget(null)}
        />
      )}
    </div>
  );
}
