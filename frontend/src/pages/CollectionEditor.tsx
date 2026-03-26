import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Plus, Pencil, Trash2, Search, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Eye, EyeOff, CheckSquare, Upload, Download, GripVertical, FileCode, Settings } from 'lucide-react';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import api from '@/lib/api';
import type { CollectionSchema, CollectionItem, FieldDef } from '@/types/cms';
import { useAuth } from '@/hooks/useAuth';
import DynamicForm from '@/components/collections/DynamicForm';
import SchemaSlideOver from '@/components/collections/SchemaSlideOver';

const PER_PAGE = 25;

interface SortableRowProps {
  item: CollectionItem;
  displayFields: FieldDef[];
  selectedIds: Set<number>;
  isDragEnabled: boolean;
  onToggleSelect: (id: number) => void;
  onEdit: (item: CollectionItem) => void;
  onDelete: (id: number) => void;
  onPublishToggle: (id: number, action: 'publish' | 'unpublish') => void;
  t: (key: string, options?: Record<string, unknown>) => string;
}

function SortableRow({ item, displayFields, selectedIds, isDragEnabled, onToggleSelect, onEdit, onDelete, onPublishToggle, t }: SortableRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <tr ref={setNodeRef} style={style} className="border-b border-[var(--border)] last:border-0 hover:bg-gray-50">
      {isDragEnabled && (
        <td className="w-8 px-1 py-2.5">
          <button {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing p-1 text-[var(--text-muted)] hover:text-[var(--text)]">
            <GripVertical size={14} />
          </button>
        </td>
      )}
      <td className="w-10 px-3 py-2.5">
        <input
          type="checkbox"
          checked={selectedIds.has(item.id)}
          onChange={() => onToggleSelect(item.id)}
          className="rounded border-gray-300"
        />
      </td>
      <td className="px-4 py-2.5">{item.title}</td>
      {displayFields.map((f) => (
        <td key={f.name} className="px-4 py-2.5 text-[var(--text-muted)] hidden sm:table-cell">
          {String(item.data[f.name] ?? '')}
        </td>
      ))}
      <td className="px-4 py-2.5 hidden sm:table-cell">
        <span className={`inline-flex items-center px-2 py-0.5 text-xs rounded-full ${
          item.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
        }`}>
          {item.status === 'published' ? t('common:published') : t('common:draft')}
        </span>
      </td>
      <td className="px-4 py-2.5 text-right">
        <button
          onClick={() => onPublishToggle(item.id, item.status === 'published' ? 'unpublish' : 'publish')}
          className="p-1 text-[var(--text-muted)] hover:text-[var(--primary)]"
          title={item.status === 'published' ? t('content:unpublish') : t('content:publish')}
        >
          {item.status === 'published' ? <EyeOff size={14} /> : <Eye size={14} />}
        </button>
        <button onClick={() => onEdit(item)} className="p-1 text-[var(--text-muted)] hover:text-[var(--primary)] ml-1" title={t('common:edit')}>
          <Pencil size={14} />
        </button>
        <button
          onClick={() => { if (confirm(t('content:confirm_delete_entry'))) onDelete(item.id); }}
          className="p-1 text-[var(--text-muted)] hover:text-[var(--danger)] ml-1"
          title={t('common:delete')}
        >
          <Trash2 size={14} />
        </button>
      </td>
    </tr>
  );
}

export default function CollectionEditor({ overrideKey }: { overrideKey?: string } = {}) {
  const { key: paramKey } = useParams<{ key: string }>();
  const key = overrideKey || paramKey;
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { t } = useTranslation(['common', 'content']);
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [search, setSearch] = useState('');
  const [editItem, setEditItem] = useState<CollectionItem | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState('sort_order');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft'>('all');
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [schemaOpen, setSchemaOpen] = useState(false);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const { data: schema } = useQuery<CollectionSchema>({
    queryKey: ['collectionSchema', key],
    queryFn: async () => (await api.get(`/api/collections/${key}/schema`)).data,
  });

  const { data: itemsData, isLoading } = useQuery<{ items: CollectionItem[]; total: number }>({
    queryKey: ['collectionItems', key, search, page, sortBy, sortDir, statusFilter],
    queryFn: async () => (await api.get(`/api/collections/${key}/items`, {
      params: {
        search: search || undefined,
        limit: PER_PAGE,
        offset: (page - 1) * PER_PAGE,
        sort_by: sortBy,
        sort_dir: sortDir,
        status: statusFilter !== 'all' ? statusFilter : undefined,
      },
    })).data,
  });

  const { data: trashCount } = useQuery<{ count: number }>({
    queryKey: ['collectionTrashCount', key],
    queryFn: async () => (await api.get(`/api/collections/${key}/items/trash-count`)).data,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/api/collections/${key}/items/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collectionItems', key] });
      queryClient.invalidateQueries({ queryKey: ['collectionTrashCount', key] });
      queryClient.invalidateQueries({ queryKey: ['collections'] });
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: (ids: number[]) => api.delete(`/api/collections/${key}/items/bulk`, { data: { ids } }),
    onSuccess: () => {
      setSelectedIds(new Set());
      queryClient.invalidateQueries({ queryKey: ['collectionItems', key] });
      queryClient.invalidateQueries({ queryKey: ['collectionTrashCount', key] });
      queryClient.invalidateQueries({ queryKey: ['collections'] });
    },
  });

  const publishMutation = useMutation({
    mutationFn: ({ id, action }: { id: number; action: 'publish' | 'unpublish' }) =>
      api.post(`/api/collections/${key}/items/${id}/${action}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collectionItems', key] });
    },
  });

  const reorderMutation = useMutation({
    mutationFn: (itemIds: number[]) => api.put(`/api/collections/${key}/items/reorder`, { item_ids: itemIds }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collectionItems', key] });
    },
  });

  const handleNew = () => { setEditItem(null); setShowForm(true); };
  const handleEdit = (item: CollectionItem) => { setEditItem(item); setShowForm(true); };
  const handleSaved = () => {
    setShowForm(false);
    setEditItem(null);
    queryClient.invalidateQueries({ queryKey: ['collectionItems', key] });
    queryClient.invalidateQueries({ queryKey: ['collections'] });
  };

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(field);
      setSortDir('asc');
    }
    setPage(1);
  };

  const handleSearch = (val: string) => {
    setSearch(val);
    setPage(1);
  };

  const handleStatusFilter = (filter: 'all' | 'published' | 'draft') => {
    setStatusFilter(filter);
    setPage(1);
  };

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    const ids = itemsData?.items.map((i) => i.id) ?? [];
    const allSelected = ids.length > 0 && ids.every((id) => selectedIds.has(id));
    setSelectedIds(allSelected ? new Set() : new Set(ids));
  };

  const handleBulkDelete = () => {
    if (selectedIds.size === 0) return;
    if (!confirm(t('content:confirm_bulk_delete', { count: selectedIds.size }))) return;
    bulkDeleteMutation.mutate([...selectedIds]);
  };

  const handleExport = async (format: 'csv' | 'json') => {
    try {
      const res = await api.get(`/api/collections/${key}/items/export`, {
        params: { format },
        responseType: 'blob',
      });
      const blob = new Blob([res.data]);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${key}.${format}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch { /* ignore */ }
  };

  const handleSchemaExport = async (format: 'yaml' | 'json') => {
    try {
      const res = await api.get(`/api/collections/${key}/schema/export`, {
        params: { format },
        responseType: 'blob',
      });
      const blob = new Blob([res.data]);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${key}-schema.${format}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch { /* ignore */ }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id || !itemsData) return;
    const items = [...itemsData.items];
    const oldIndex = items.findIndex((i) => i.id === active.id);
    const newIndex = items.findIndex((i) => i.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    const [moved] = items.splice(oldIndex, 1);
    items.splice(newIndex, 0, moved);
    // Optimistic update
    queryClient.setQueryData(
      ['collectionItems', key, search, page, sortBy, sortDir, statusFilter],
      { items, total: itemsData.total },
    );
    reorderMutation.mutate(items.map((i) => i.id));
  };

  if (!schema) return <div className="p-6 text-sm text-[var(--text-muted)]">{t('common:loading')}</div>;

  // Singleton mode: show form directly instead of list
  if (schema.singleton) {
    const singletonItem = itemsData?.items[0] ?? null;
    return (
      <div className="p-6 pb-20">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-xl font-bold">{schema.label}</h1>
            <p className="text-sm text-[var(--text-muted)] mt-1">
              {schema.label_singular}
            </p>
          </div>
          {isAdmin && (
            <button
              onClick={() => setSchemaOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-[var(--border)] rounded-md hover:bg-gray-50"
              title="Felder verwalten"
            >
              <Settings size={14} /> Felder verwalten
            </button>
          )}
        </div>
        <div className="bg-white border border-[var(--border)] rounded-xl shadow-sm p-6">
          <DynamicForm
            schema={schema}
            item={singletonItem}
            collectionKey={key!}
            onSaved={() => {
              queryClient.invalidateQueries({ queryKey: ['collectionItems', key] });
              queryClient.invalidateQueries({ queryKey: ['collections'] });
            }}
            onCancel={() => {}}
            isSingleton
          />
        </div>
        <SchemaSlideOver
          open={schemaOpen}
          onClose={() => setSchemaOpen(false)}
          collectionKey={key!}
          onSaved={() => {
            queryClient.invalidateQueries({ queryKey: ['collectionSchema', key] });
            queryClient.invalidateQueries({ queryKey: ['collectionItems', key] });
          }}
        />
      </div>
    );
  }

  const displayFields = schema.fields.filter(f => f.list_visible !== false).slice(0, 3);
  const total = itemsData?.total ?? 0;
  const totalPages = Math.ceil(total / PER_PAGE);
  const rangeStart = total > 0 ? (page - 1) * PER_PAGE + 1 : 0;
  const rangeEnd = Math.min(page * PER_PAGE, total);
  const isDragEnabled = sortBy === 'sort_order' && sortDir === 'asc' && !search && statusFilter === 'all';

  const SortIcon = ({ field }: { field: string }) => {
    if (sortBy !== field) return null;
    return sortDir === 'asc'
      ? <ChevronUp size={12} className="inline ml-0.5" />
      : <ChevronDown size={12} className="inline ml-0.5" />;
  };

  const tableBody = (
    <tbody>
      {itemsData?.items.map((item) => (
        <SortableRow
          key={item.id}
          item={item}
          displayFields={displayFields}
          selectedIds={selectedIds}
          isDragEnabled={isDragEnabled}
          onToggleSelect={toggleSelect}
          onEdit={handleEdit}
          onDelete={(id) => deleteMutation.mutate(id)}
          onPublishToggle={(id, action) => publishMutation.mutate({ id, action })}
          t={t}
        />
      ))}
      {itemsData?.items.length === 0 && (
        <tr>
          <td colSpan={displayFields.length + (isDragEnabled ? 5 : 4)} className="px-4 py-8 text-center text-[var(--text-muted)]">
            {t('content:no_entries')}
          </td>
        </tr>
      )}
    </tbody>
  );

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-lg font-semibold">{schema.label}</h1>
        <div className="flex items-center gap-2">
          {isAdmin && (
            <button
              onClick={() => setSchemaOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-[var(--border)] rounded-md hover:bg-gray-50"
              title="Felder verwalten"
            >
              <Settings size={14} /> Felder verwalten
            </button>
          )}
          <div className="relative group">
            <button
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-[var(--border)] rounded-md hover:bg-gray-50"
              title={t('content:data_export')}
            >
              <Download size={14} />
              {t('common:export')}
            </button>
            <div className="hidden group-hover:block absolute right-0 top-full mt-1 bg-white border border-[var(--border)] rounded-md shadow-lg z-10 min-w-[160px]">
              <div className="px-3 py-1.5 text-[10px] font-semibold uppercase text-[var(--text-muted)] border-b border-[var(--border)]">{t('common:data')}</div>
              <button onClick={() => handleExport('csv')} className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50">CSV</button>
              <button onClick={() => handleExport('json')} className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 border-t border-[var(--border)]">JSON</button>
              <div className="px-3 py-1.5 text-[10px] font-semibold uppercase text-[var(--text-muted)] border-t border-[var(--border)]">{t('common:schema')}</div>
              <button onClick={() => handleSchemaExport('yaml')} className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center gap-2">
                <FileCode size={12} /> YAML
              </button>
              <button onClick={() => handleSchemaExport('json')} className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 border-t border-[var(--border)] flex items-center gap-2">
                <FileCode size={12} /> JSON
              </button>
            </div>
          </div>
          <button
            onClick={() => navigate(`/collections/${key}/import`)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-[var(--border)] rounded-md hover:bg-gray-50"
            title="CSV/JSON Import"
          >
            <Upload size={14} />
            {t('common:import')}
          </button>
          <button
            onClick={() => navigate(`/collections/${key}/trash`)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-[var(--border)] rounded-md hover:bg-gray-50"
            title={t('content:trash')}
          >
            <Trash2 size={14} />
            {t('content:trash')}
            {(trashCount?.count ?? 0) > 0 && (
              <span className="ml-1 px-1.5 py-0.5 text-xs bg-amber-100 text-amber-700 rounded-full">
                {trashCount?.count}
              </span>
            )}
          </button>
          <button
            onClick={handleNew}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-[var(--primary)] text-white rounded-md hover:opacity-90"
          >
            <Plus size={14} /> {t('content:new_entry')}
          </button>
        </div>
      </div>

      <div className="relative mb-4">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
        <input
          type="text"
          placeholder={t('common:search')}
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          className="w-full pl-8 pr-3 py-2 text-sm border border-[var(--border)] rounded-md"
        />
      </div>

      <div className="flex gap-1 mb-4">
        {([['all', t('common:all')], ['published', t('common:published')], ['draft', t('common:drafts')]] as [string, string][]).map(([val, label]) => (
          <button
            key={val}
            onClick={() => handleStatusFilter(val as 'all' | 'published' | 'draft')}
            className={`px-3 py-1.5 text-xs rounded-md border ${
              statusFilter === val
                ? 'bg-[var(--primary)] text-white border-[var(--primary)]'
                : 'border-[var(--border)] hover:bg-gray-50'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[80vh] overflow-auto p-5">
            <h2 className="text-sm font-semibold mb-4">
              {editItem ? t('content:edit_entry', { label: schema.label_singular }) : t('content:create_entry', { label: schema.label_singular })}
            </h2>
            <DynamicForm
              schema={schema}
              item={editItem}
              collectionKey={key!}
              onSaved={handleSaved}
              onCancel={() => { setShowForm(false); setEditItem(null); }}
            />
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="text-sm text-[var(--text-muted)]">{t('common:loading')}</div>
      ) : (
        <>
        {selectedIds.size > 0 && (
          <div className="flex items-center gap-3 mb-3 px-4 py-2.5 bg-red-50 border border-red-200 rounded-lg">
            <CheckSquare size={14} className="text-red-600" />
            <span className="text-sm font-medium text-red-700">{selectedIds.size} {t('common:selected')}</span>
            <button
              onClick={handleBulkDelete}
              disabled={bulkDeleteMutation.isPending}
              className="ml-auto flex items-center gap-1.5 px-3 py-1.5 text-sm bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
            >
              <Trash2 size={14} />
              {bulkDeleteMutation.isPending ? t('common:deleting') : t('content:bulk_delete_count', { count: selectedIds.size })}
            </button>
            <button
              onClick={() => setSelectedIds(new Set())}
              className="px-3 py-1.5 text-sm border border-red-200 rounded-md hover:bg-red-100 text-red-700"
            >
              {t('common:cancel')}
            </button>
          </div>
        )}

        <div className="bg-white border border-[var(--border)] rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] bg-gray-50">
                {isDragEnabled && <th className="w-8" />}
                <th className="w-10 px-3 py-2.5">
                  <input
                    type="checkbox"
                    checked={
                      (itemsData?.items.length ?? 0) > 0 &&
                      (itemsData?.items.every((i) => selectedIds.has(i.id)) ?? false)
                    }
                    onChange={toggleAll}
                    className="rounded border-gray-300"
                  />
                </th>
                <th
                  className="text-left px-4 py-2.5 font-medium cursor-pointer select-none hover:text-[var(--primary)]"
                  onClick={() => handleSort('title')}
                >
                  {t('common:title')} <SortIcon field="title" />
                </th>
                {displayFields.map((f) => (
                  <th key={f.name} className="text-left px-4 py-2.5 font-medium hidden sm:table-cell">{f.label}</th>
                ))}
                <th className="text-left px-4 py-2.5 font-medium w-24 hidden sm:table-cell">{t('common:status')}</th>
                <th className="text-right px-4 py-2.5 font-medium w-32">{t('common:actions')}</th>
              </tr>
            </thead>
            {isDragEnabled ? (
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={itemsData?.items.map((i) => i.id) ?? []} strategy={verticalListSortingStrategy}>
                  {tableBody}
                </SortableContext>
              </DndContext>
            ) : tableBody}
          </table>

          {/* Pagination */}
          {total > PER_PAGE && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-[var(--border)] text-xs text-[var(--text-muted)]">
              <span>{t('common:range_of_total', { start: rangeStart, end: rangeEnd, total })}</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="flex items-center gap-1 px-2 py-1 border border-[var(--border)] rounded hover:bg-gray-50 disabled:opacity-30"
                >
                  <ChevronLeft size={12} /> {t('common:previous')}
                </button>
                <span>{t('common:page_x_of_y', { page, total: totalPages })}</span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="flex items-center gap-1 px-2 py-1 border border-[var(--border)] rounded hover:bg-gray-50 disabled:opacity-30"
                >
                  {t('common:next')} <ChevronRight size={12} />
                </button>
              </div>
            </div>
          )}
        </div>
        </>
      )}
      <SchemaSlideOver
        open={schemaOpen}
        onClose={() => setSchemaOpen(false)}
        collectionKey={key!}
        onSaved={() => {
          queryClient.invalidateQueries({ queryKey: ['collectionSchema', key] });
          queryClient.invalidateQueries({ queryKey: ['collectionItems', key] });
        }}
      />
    </div>
  );
}
