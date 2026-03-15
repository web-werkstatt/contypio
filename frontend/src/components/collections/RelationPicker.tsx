import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { X, Search, Link2, ChevronLeft, ChevronRight } from 'lucide-react';
import api from '@/lib/api';
import type { CollectionItem } from '@/types/cms';

interface Props {
  value: number | number[] | null;
  collection: string;
  displayField: string;
  multiple: boolean;
  onChange(value: number | number[] | null): void;
}

interface ItemsResponse {
  items: CollectionItem[];
  total: number;
}

function RelationPickerDialog({
  collection,
  displayField,
  multiple,
  selected,
  onSelect,
  onClose,
}: {
  collection: string;
  displayField: string;
  multiple: boolean;
  selected: number[];
  onSelect(ids: number[]): void;
  onClose(): void;
}) {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const perPage = 15;

  const { data, isLoading } = useQuery<ItemsResponse>({
    queryKey: ['relationItems', collection, search, page],
    queryFn: async () =>
      (await api.get(`/api/collections/${collection}/items`, {
        params: { search: search || undefined, limit: perPage, offset: (page - 1) * perPage },
      })).data,
    enabled: !!collection,
  });

  const totalPages = data ? Math.ceil(data.total / perPage) : 1;

  const handleToggle = (id: number) => {
    if (multiple) {
      const next = selected.includes(id)
        ? selected.filter((s) => s !== id)
        : [...selected, id];
      onSelect(next);
    } else {
      onSelect([id]);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl w-[600px] max-h-[70vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-3 border-b border-[var(--border)]">
          <h3 className="text-sm font-semibold">Verknüpfung wählen — {collection}</h3>
          <button onClick={onClose} className="p-1 rounded hover:bg-gray-100"><X size={16} /></button>
        </div>

        <div className="px-5 py-3 border-b border-[var(--border)]">
          <div className="flex items-center gap-2 px-3 py-1.5 border border-[var(--border)] rounded-md">
            <Search size={14} className="text-gray-400" />
            <input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Suchen..."
              className="flex-1 text-sm border-none outline-none bg-transparent"
            />
          </div>
        </div>

        <div className="flex-1 overflow-auto">
          {isLoading ? (
            <div className="text-center py-8 text-sm text-[var(--text-muted)]">Laden...</div>
          ) : data && data.items.length > 0 ? (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] bg-gray-50">
                  <th className="w-10 px-3 py-2"></th>
                  <th className="text-left px-3 py-2 font-medium">ID</th>
                  <th className="text-left px-3 py-2 font-medium">Titel</th>
                  <th className="text-left px-3 py-2 font-medium">{displayField !== 'title' ? displayField : 'Slug'}</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((item) => {
                  const isSelected = selected.includes(item.id);
                  return (
                    <tr
                      key={item.id}
                      onClick={() => handleToggle(item.id)}
                      className={`border-b border-[var(--border)] cursor-pointer hover:bg-blue-50 ${isSelected ? 'bg-blue-50' : ''}`}
                    >
                      <td className="px-3 py-2 text-center">
                        <input
                          type={multiple ? 'checkbox' : 'radio'}
                          checked={isSelected}
                          onChange={() => handleToggle(item.id)}
                          className="rounded"
                        />
                      </td>
                      <td className="px-3 py-2 text-[var(--text-muted)]">{item.id}</td>
                      <td className="px-3 py-2 font-medium">{item.title}</td>
                      <td className="px-3 py-2 text-[var(--text-muted)]">
                        {displayField !== 'title'
                          ? String(item.data[displayField] ?? '')
                          : (item.slug ?? '')}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div className="text-center py-8 text-sm text-[var(--text-muted)]">
              {search ? 'Keine Ergebnisse' : 'Keine Einträge vorhanden'}
            </div>
          )}
        </div>

        {data && totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-2 border-t border-[var(--border)] text-xs text-[var(--text-muted)]">
            <span>{data.total} Einträge</span>
            <div className="flex items-center gap-2">
              <button onClick={() => setPage(page - 1)} disabled={page <= 1} className="p-1 rounded hover:bg-gray-100 disabled:opacity-30">
                <ChevronLeft size={14} />
              </button>
              <span>Seite {page} von {totalPages}</span>
              <button onClick={() => setPage(page + 1)} disabled={page >= totalPages} className="p-1 rounded hover:bg-gray-100 disabled:opacity-30">
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}

        {multiple && (
          <div className="flex justify-end px-5 py-3 border-t border-[var(--border)]">
            <button
              onClick={onClose}
              className="px-3 py-1.5 text-sm bg-[var(--primary)] text-white rounded-md hover:opacity-90"
            >
              Übernehmen ({selected.length})
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function RelationPicker({ value, collection, displayField, multiple, onChange }: Props) {
  const [open, setOpen] = useState(false);

  const selectedIds: number[] = multiple
    ? (Array.isArray(value) ? value : [])
    : (typeof value === 'number' ? [value] : []);

  // Fetch selected items for display
  const { data: selectedItems } = useQuery<ItemsResponse>({
    queryKey: ['relationSelected', collection, selectedIds],
    queryFn: async () => {
      if (selectedIds.length === 0) return { items: [], total: 0 };
      // Fetch all items and filter client-side (small set)
      const resp = await api.get(`/api/collections/${collection}/items`, {
        params: { limit: 100 },
      });
      const allItems = resp.data as ItemsResponse;
      const filtered = allItems.items.filter((i: CollectionItem) => selectedIds.includes(i.id));
      return { items: filtered, total: filtered.length };
    },
    enabled: selectedIds.length > 0 && !!collection,
  });

  if (!collection) {
    return <div className="text-xs text-[var(--text-muted)]">Keine Ziel-Collection konfiguriert</div>;
  }

  const handleSelect = (ids: number[]) => {
    if (multiple) {
      onChange(ids.length > 0 ? ids : null);
    } else {
      onChange(ids[0] ?? null);
    }
  };

  const handleRemove = (id: number) => {
    if (multiple) {
      const next = selectedIds.filter((s) => s !== id);
      onChange(next.length > 0 ? next : null);
    } else {
      onChange(null);
    }
  };

  return (
    <div>
      {selectedIds.length > 0 && selectedItems?.items ? (
        <div className="space-y-1">
          {selectedItems.items.map((item) => (
            <div key={item.id} className="flex items-center gap-2 px-3 py-1.5 border border-[var(--border)] rounded-md text-sm">
              <Link2 size={12} className="text-[var(--text-muted)]" />
              <span className="flex-1 truncate">{item.title}</span>
              <button onClick={() => handleRemove(item.id)} className="text-[var(--text-muted)] hover:text-[var(--danger)]">
                <X size={12} />
              </button>
            </div>
          ))}
          <button
            onClick={() => setOpen(true)}
            className="text-xs text-[var(--primary)] hover:underline"
          >
            {multiple ? 'Weitere hinzufügen...' : 'Ändern...'}
          </button>
        </div>
      ) : (
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 w-full px-3 py-3 border border-dashed border-gray-300 rounded-md text-xs text-[var(--text-muted)] hover:border-[var(--primary)] hover:text-[var(--primary)] transition-colors"
        >
          <Link2 size={16} /> Verknüpfung wählen
        </button>
      )}

      {open && (
        <RelationPickerDialog
          collection={collection}
          displayField={displayField}
          multiple={multiple}
          selected={selectedIds}
          onSelect={handleSelect}
          onClose={() => setOpen(false)}
        />
      )}
    </div>
  );
}
