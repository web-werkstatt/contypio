import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Trash2, RotateCcw, ArrowLeft } from 'lucide-react';
import api from '@/lib/api';
import type { CollectionSchema, CollectionItem } from '@/types/cms';

export default function CollectionTrash() {
  const { key } = useParams<{ key: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: schema } = useQuery<CollectionSchema>({
    queryKey: ['collectionSchema', key],
    queryFn: async () => (await api.get(`/api/collections/${key}/schema`)).data,
  });

  const { data: trashData, isLoading } = useQuery<{ items: CollectionItem[]; total: number }>({
    queryKey: ['collectionTrash', key],
    queryFn: async () => (await api.get(`/api/collections/${key}/items/trash`)).data,
  });

  const restoreMutation = useMutation({
    mutationFn: (itemId: number) => api.post(`/api/collections/${key}/items/${itemId}/restore`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collectionTrash', key] });
      queryClient.invalidateQueries({ queryKey: ['collectionItems', key] });
      queryClient.invalidateQueries({ queryKey: ['collections'] });
    },
  });

  const permanentDeleteMutation = useMutation({
    mutationFn: (itemId: number) => api.delete(`/api/collections/${key}/items/${itemId}/permanent`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collectionTrash', key] });
      queryClient.invalidateQueries({ queryKey: ['collections'] });
    },
  });

  const label = schema?.label ?? 'Collection';

  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate(`/collections/${key}`)}
          className="p-1.5 text-[var(--text-muted)] hover:text-[var(--primary)] rounded"
          title="Zurück"
        >
          <ArrowLeft size={18} />
        </button>
        <Trash2 size={20} className="text-amber-600" />
        <div>
          <h1 className="text-lg font-semibold">Papierkorb: {label}</h1>
          <p className="text-xs text-[var(--text-muted)]">
            Gelöschte Einträge können wiederhergestellt oder endgültig gelöscht werden.
          </p>
        </div>
      </div>

      {isLoading && <p className="text-sm text-[var(--text-muted)]">Laden...</p>}

      {trashData && trashData.items.length === 0 && (
        <div className="text-center py-16">
          <Trash2 size={40} className="mx-auto mb-3 text-gray-300" />
          <p className="text-sm text-[var(--text-muted)]">Papierkorb ist leer</p>
        </div>
      )}

      {trashData && trashData.items.length > 0 && (
        <div className="bg-white rounded-lg border border-[var(--border)] overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] bg-gray-50">
                <th className="text-left px-4 py-2.5 font-medium">Titel</th>
                <th className="text-left px-4 py-2.5 font-medium">Status</th>
                <th className="text-left px-4 py-2.5 font-medium">Gelöscht am</th>
                <th className="text-right px-4 py-2.5 font-medium">Aktionen</th>
              </tr>
            </thead>
            <tbody>
              {trashData.items.map((item) => (
                <tr key={item.id} className="border-b border-[var(--border)] last:border-b-0 hover:bg-gray-50">
                  <td className="px-4 py-2.5 font-medium">{item.title}</td>
                  <td className="px-4 py-2.5">
                    <span className={`inline-flex items-center px-2 py-0.5 text-xs rounded-full ${
                      item.status === 'published'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {item.status === 'published' ? 'Veröffentlicht' : 'Entwurf'}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-[var(--text-muted)] text-xs">
                    {item.deleted_at
                      ? new Date(item.deleted_at).toLocaleDateString('de-DE', {
                          day: '2-digit', month: '2-digit', year: 'numeric',
                          hour: '2-digit', minute: '2-digit',
                        })
                      : '\u2014'}
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => restoreMutation.mutate(item.id)}
                        disabled={restoreMutation.isPending}
                        className="flex items-center gap-1 px-2.5 py-1 text-xs text-green-700 bg-green-50 border border-green-200 rounded hover:bg-green-100 transition-colors disabled:opacity-50"
                        title="Wiederherstellen"
                      >
                        <RotateCcw size={12} /> Wiederherstellen
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`"${item.title}" endgültig löschen? Dies kann nicht rückgängig gemacht werden.`))
                            permanentDeleteMutation.mutate(item.id);
                        }}
                        disabled={permanentDeleteMutation.isPending}
                        className="flex items-center gap-1 px-2.5 py-1 text-xs text-red-600 bg-red-50 border border-red-200 rounded hover:bg-red-100 transition-colors disabled:opacity-50"
                        title="Endgültig löschen"
                      >
                        <Trash2 size={12} /> Löschen
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
