import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Archive, RotateCcw, Trash2 } from 'lucide-react';
import api from '@/lib/api';
import type { Page } from '@/types/cms';

export default function ArchivedPages() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: pages, isLoading } = useQuery<Page[]>({
    queryKey: ['pages', 'archived'],
    queryFn: async () => (await api.get('/api/pages?status=archived')).data,
  });

  const restoreMutation = useMutation({
    mutationFn: (pageId: number) => api.put(`/api/pages/${pageId}`, { status: 'draft' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pages'] });
      queryClient.invalidateQueries({ queryKey: ['pageTree'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (pageId: number) => api.delete(`/api/pages/${pageId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pages'] });
      queryClient.invalidateQueries({ queryKey: ['pageTree'] });
    },
  });

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center gap-3 px-6 py-4 border-b border-[var(--border)] bg-white">
        <Archive size={20} className="text-amber-600" />
        <div>
          <h1 className="text-lg font-semibold">Archiv</h1>
          <p className="text-xs text-[var(--text-muted)]">Archivierte Seiten können wiederhergestellt oder endgueltig geloescht werden.</p>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        {isLoading && <p className="text-sm text-[var(--text-muted)]">Laden...</p>}

        {pages && pages.length === 0 && (
          <div className="text-center py-16">
            <Archive size={40} className="mx-auto mb-3 text-gray-300" />
            <p className="text-sm text-[var(--text-muted)]">Keine archivierten Seiten</p>
          </div>
        )}

        {pages && pages.length > 0 && (
          <div className="bg-white rounded-lg border border-[var(--border)] overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] bg-gray-50">
                  <th className="text-left px-4 py-2.5 font-medium">Titel</th>
                  <th className="text-left px-4 py-2.5 font-medium">Pfad</th>
                  <th className="text-left px-4 py-2.5 font-medium">Typ</th>
                  <th className="text-left px-4 py-2.5 font-medium">Archiviert am</th>
                  <th className="text-right px-4 py-2.5 font-medium">Aktionen</th>
                </tr>
              </thead>
              <tbody>
                {pages.map((page) => (
                  <tr key={page.id} className="border-b border-[var(--border)] last:border-b-0 hover:bg-gray-50">
                    <td className="px-4 py-2.5">
                      <button
                        onClick={() => navigate(`/pages/${page.id}`)}
                        className="text-[var(--primary)] hover:underline font-medium"
                      >
                        {page.title}
                      </button>
                    </td>
                    <td className="px-4 py-2.5 text-[var(--text-muted)] font-mono text-xs">{page.path}</td>
                    <td className="px-4 py-2.5 text-[var(--text-muted)]">{page.page_type}</td>
                    <td className="px-4 py-2.5 text-[var(--text-muted)] text-xs">
                      {page.updated_at ? new Date(page.updated_at).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '\u2014'}
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => restoreMutation.mutate(page.id)}
                          className="flex items-center gap-1 px-2.5 py-1 text-xs text-green-700 bg-green-50 border border-green-200 rounded hover:bg-green-100 transition-colors"
                          title="Als Entwurf wiederherstellen"
                        >
                          <RotateCcw size={12} /> Wiederherstellen
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`"${page.title}" endgueltig löschen? Dies kann nicht rueckgaengig gemacht werden.`))
                              deleteMutation.mutate(page.id);
                          }}
                          className="flex items-center gap-1 px-2.5 py-1 text-xs text-red-600 bg-red-50 border border-red-200 rounded hover:bg-red-100 transition-colors"
                          title="Endgueltig löschen"
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
    </div>
  );
}
