import { useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Plus, Archive } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { usePageTree } from '@/hooks/usePageTree';
import type { PageTreeNode } from '@/types/cms';
import PageTreeItem from './PageTreeItem';
import PageAssemblyWizard from '@/components/PageAssemblyWizard';
import DuplicateDialog from '@/components/editor/DuplicateDialog';
import api from '@/lib/api';

function filterArchived(nodes: PageTreeNode[]): PageTreeNode[] {
  return nodes
    .filter((n) => n.status !== 'archived')
    .map((n) => ({ ...n, children: filterArchived(n.children ?? []) }));
}

function countArchived(nodes: PageTreeNode[]): number {
  return nodes.reduce((sum, n) => sum + (n.status === 'archived' ? 1 : 0) + countArchived(n.children ?? []), 0);
}

function findNode(nodes: PageTreeNode[], id: number): PageTreeNode | undefined {
  for (const n of nodes) {
    if (n.id === id) return n;
    const found = findNode(n.children ?? [], id);
    if (found) return found;
  }
  return undefined;
}

export default function PageTree() {
  const { data: tree, isLoading } = usePageTree();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [wizardOpen, setWizardOpen] = useState(false);
  const [dupTarget, setDupTarget] = useState<{ title: string; slug: string; pageId: number } | null>(null);
  const queryClient = useQueryClient();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor),
  );

  const reorderMutation = useMutation({
    mutationFn: (order: { id: number; sort_order: number; parent_id: number | null }[]) =>
      api.put('/api/pages/reorder', order),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pageTree'] });
    },
  });

  const archiveMutation = useMutation({
    mutationFn: (pageId: number) => api.put(`/api/pages/${pageId}`, { status: 'archived' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pageTree'] });
      queryClient.invalidateQueries({ queryKey: ['pages'] });
    },
  });

  const duplicateMutation = useMutation({
    mutationFn: async ({ pageId, title, slug }: { pageId: number; title: string; slug: string }) => {
      const { data: source } = await api.get(`/api/pages/${pageId}`);
      const body = {
        title,
        slug,
        path: `/${slug}`,
        page_type: source.page_type,
        parent_id: source.parent_id,
        collection_key: source.collection_key,
        seo: source.seo,
        hero: source.hero,
        sections: source.sections,
      };
      return (await api.post('/api/pages', body)).data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['pageTree'] });
      queryClient.invalidateQueries({ queryKey: ['pages'] });
      setDupTarget(null);
      navigate(`/pages/${data.id}`);
    },
  });

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id || !tree) return;

      const oldIndex = tree.findIndex((n) => n.id === active.id);
      const newIndex = tree.findIndex((n) => n.id === over.id);
      if (oldIndex === -1 || newIndex === -1) return;

      const reordered = arrayMove(tree, oldIndex, newIndex);
      queryClient.setQueryData(['pageTree'], reordered);

      const order = reordered.map((node, i) => ({
        id: node.id,
        sort_order: i,
        parent_id: null,
      }));
      reorderMutation.mutate(order);
    },
    [tree, queryClient, reorderMutation],
  );

  const handleDuplicate = (pageId: number) => {
    if (!tree) return;
    const node = findNode(tree, pageId);
    if (node) {
      setDupTarget({ title: node.title, slug: node.slug, pageId });
    }
  };

  const handleArchive = (pageId: number) => {
    archiveMutation.mutate(pageId);
  };

  if (isLoading) {
    return <div className="px-3 py-2 text-xs text-[var(--text-muted)]">Laden...</div>;
  }

  const visibleTree = tree ? filterArchived(tree) : [];
  const archivedCount = tree ? countArchived(tree) : 0;
  const rootIds = visibleTree.map((n) => n.id);

  return (
    <div className="px-1">
      {visibleTree.length > 0 ? (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={rootIds} strategy={verticalListSortingStrategy}>
            <ul className="space-y-0.5">
              {visibleTree.map((node: PageTreeNode) => (
                <PageTreeItem
                  key={node.id}
                  node={node}
                  activeId={id ? parseInt(id, 10) : undefined}
                  depth={0}
                  onDuplicate={handleDuplicate}
                  onArchive={handleArchive}
                />
              ))}
            </ul>
          </SortableContext>
        </DndContext>
      ) : (
        <p className="px-3 py-2 text-xs text-[var(--text-muted)]">Keine Seiten</p>
      )}

      <button
        onClick={() => setWizardOpen(true)}
        className="w-full flex items-center gap-1.5 px-3 py-2 mt-2 text-xs text-[var(--primary)] hover:bg-[var(--primary-light)] rounded-md transition-colors"
      >
        <Plus size={14} /> Neue Seite
      </button>

      {archivedCount > 0 && (
        <button
          onClick={() => navigate('/pages/archived')}
          className="w-full flex items-center gap-1.5 px-3 py-1.5 text-[10px] text-[var(--text-muted)] hover:text-amber-600 hover:bg-amber-50 rounded-md transition-colors"
        >
          <Archive size={12} /> Archiv ({archivedCount})
        </button>
      )}

      {wizardOpen && <PageAssemblyWizard onClose={() => setWizardOpen(false)} />}

      {dupTarget && (
        <DuplicateDialog
          title={dupTarget.title}
          slug={dupTarget.slug}
          open={true}
          onClose={() => setDupTarget(null)}
          onConfirm={(title, slug) => duplicateMutation.mutate({ pageId: dupTarget.pageId, title, slug })}
        />
      )}
    </div>
  );
}
