import { Database, Plus, Pencil, Trash2 } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import type { CollectionSchema, CollectionItem } from '@/types/cms';
import CollectionFormModal from '@/components/editor/CollectionFormModal';

interface PageCollectionTabProps {
  linkedKey: string;
  linkedSchema: CollectionSchema | undefined;
  linkedItems: { items: CollectionItem[]; total: number } | undefined;
  colEditItem: CollectionItem | null;
  colShowForm: boolean;
  setColEditItem: (item: CollectionItem | null) => void;
  setColShowForm: (show: boolean) => void;
  colDeleteMutation: { mutate: (id: number) => void };
  refetchLinkedItems: () => void;
}

export default function PageCollectionTab({
  linkedKey,
  linkedSchema,
  linkedItems,
  colEditItem,
  colShowForm,
  setColEditItem,
  setColShowForm,
  colDeleteMutation,
  refetchLinkedItems,
}: PageCollectionTabProps) {
  const queryClient = useQueryClient();

  return (
    <div className="max-w-5xl mx-auto">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold flex items-center gap-2">
            <Database size={16} />
            {linkedSchema?.label || linkedKey} ({linkedItems?.total ?? 0} Einträge)
          </h2>
          <button
            onClick={() => { setColEditItem(null); setColShowForm(true); }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-[var(--primary)] text-white rounded-md hover:bg-[var(--primary-dark)] transition-colors"
          >
            <Plus size={14} /> Neuer Eintrag
          </button>
        </div>

        {linkedItems?.items.length ? (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] bg-gray-50">
                  <th className="text-left px-4 py-2 font-medium">ID</th>
                  {linkedSchema?.fields?.slice(0, 4).map((f) => (
                    <th key={f.name} className="text-left px-4 py-2 font-medium">{f.label}</th>
                  ))}
                  <th className="text-right px-4 py-2 font-medium">Aktionen</th>
                </tr>
              </thead>
              <tbody>
                {linkedItems.items.map((item) => (
                  <tr key={item.id} className="border-b border-[var(--border)] last:border-b-0 hover:bg-gray-50">
                    <td className="px-4 py-2 text-[var(--text-muted)]">{item.id}</td>
                    {linkedSchema?.fields?.slice(0, 4).map((f) => (
                      <td key={f.name} className="px-4 py-2 max-w-[200px] truncate">
                        {String(item.data?.[f.name] ?? '\u2014')}
                      </td>
                    ))}
                    <td className="px-4 py-2 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => { setColEditItem(item); setColShowForm(true); }}
                          className="p-1 text-[var(--text-muted)] hover:text-[var(--primary)] transition-colors"
                          title="Bearbeiten"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => { if (confirm('Eintrag wirklich löschen?')) colDeleteMutation.mutate(item.id); }}
                          className="p-1 text-[var(--text-muted)] hover:text-[var(--danger)] transition-colors"
                          title="Löschen"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <Database size={32} className="mx-auto mb-3 text-[var(--text-muted)]" />
            <p className="text-sm text-[var(--text-muted)]">Noch keine Einträge in dieser Collection.</p>
            <button
              onClick={() => { setColEditItem(null); setColShowForm(true); }}
              className="mt-3 text-sm text-[var(--primary)] hover:underline"
            >
              Ersten Eintrag erstellen
            </button>
          </div>
        )}

        {colShowForm && linkedSchema && (
          <CollectionFormModal
            schema={linkedSchema}
            item={colEditItem}
            collectionKey={linkedKey}
            onClose={() => { setColShowForm(false); setColEditItem(null); }}
            onSaved={() => {
              setColShowForm(false);
              setColEditItem(null);
              refetchLinkedItems();
              queryClient.invalidateQueries({ queryKey: ['collections'] });
            }}
          />
        )}
      </div>
    </div>
  );
}
