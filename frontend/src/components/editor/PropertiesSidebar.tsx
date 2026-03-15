import { useState } from 'react';
import { PanelRightClose, PanelRightOpen, Calendar, Archive, Copy, RotateCcw, Undo2, Redo2, GitCompareArrows } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Page, Block, Section } from '@/types/cms';
import VersionCompareModal from './VersionCompareModal';
import { BLOCK_TYPES } from '@/types/cms';
import { STATUS_LABELS, STATUS_STYLES, formatLocalDateTime } from './StatusOption';
import api from '@/lib/api';

export interface BlockSelection {
  sectionId: string;
  columnId: string;
  blockId: string;
  block: Block;
  index: number;
  total: number;
}

interface PageVersion {
  id: number;
  page_id: number;
  version_number: number;
  title: string;
  slug: string;
  status: string;
  change_summary: string | null;
  created_at: string;
}

interface Props {
  open: boolean;
  onToggle: () => void;
  // Undo / Redo
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  currentSections: Section[];
  // Status / Publish
  page?: Page;
  isNew: boolean;
  onStatusChange: (status: string, publishedAt?: string | null) => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onSave: () => void;
  isSaving: boolean;
  isDirty: boolean;
  // Block selection
  selectedBlock: BlockSelection | null;
  onSelectBlock: (sectionId: string, columnId: string, blockId: string) => void;
  // Version restore
  onVersionRestored?: () => void;
}

export default function PropertiesSidebar({
  open,
  onToggle,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  currentSections,
  page,
  isNew,
  onStatusChange,
  onDelete,
  onDuplicate,
  onSave,
  isSaving,
  isDirty,
  selectedBlock,
  onSelectBlock,
  onVersionRestored,
}: Props) {
  const [bottomTab, setBottomTab] = useState<'block' | 'versions'>('block');

  if (!open) {
    return (
      <button
        onClick={onToggle}
        className="hidden xl:flex items-start justify-center pt-3 w-8 bg-[var(--bg)] hover:bg-gray-200/60 transition-colors shrink-0"
        title="Properties-Sidebar oeffnen (Ctrl+\)"
      >
        <PanelRightOpen size={16} className="text-[var(--text-muted)]" />
      </button>
    );
  }

  const currentStatus = page?.status ?? 'draft';

  return (
    <div className="hidden xl:flex w-80 flex-col shrink-0 p-3 bg-[var(--bg)]">
      <div className="flex-1 flex flex-col bg-white rounded-lg shadow-sm overflow-hidden">
      {/* Undo / Redo + Close */}
      <div className="flex items-center gap-1 px-3 py-1.5 bg-gray-50 rounded-t-lg">
        <button onClick={onUndo} disabled={!canUndo} className="p-1 rounded hover:bg-gray-200 disabled:opacity-30 transition-colors" title="Rückgängig (Strg+Z)">
          <Undo2 size={14} className="text-[var(--text-muted)]" />
        </button>
        <button onClick={onRedo} disabled={!canRedo} className="p-1 rounded hover:bg-gray-200 disabled:opacity-30 transition-colors" title="Wiederherstellen (Strg+Y)">
          <Redo2 size={14} className="text-[var(--text-muted)]" />
        </button>
        {isDirty && (
          <span className="text-[10px] text-amber-600 flex items-center gap-1 ml-1">
            <span className="w-1 h-1 rounded-full bg-amber-500 animate-pulse" />
            Nicht gespeichert
          </span>
        )}
        <button
          onClick={onToggle}
          className="p-1 rounded hover:bg-gray-200 text-[var(--text-muted)] transition-colors ml-auto"
          title="Sidebar schließen (Ctrl+\)"
        >
          <PanelRightClose size={14} />
        </button>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-auto">
        {/* Status / Publish - always visible */}
        <div className="p-3 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[var(--text)]">Status</span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${STATUS_STYLES[currentStatus] ?? 'bg-gray-100 text-gray-600'}`}>
              {STATUS_LABELS[currentStatus] ?? currentStatus}
            </span>
          </div>

          <div className="space-y-1">
            {([
              { key: 'draft', label: 'Entwurf', desc: 'Nicht öffentlich' },
              { key: 'published', label: 'Publiziert', desc: 'Öffentlich sichtbar' },
              { key: 'scheduled', label: 'Geplant', desc: 'Zeitgesteuert' },
              { key: 'archived', label: 'Archiviert', desc: 'Ausgeblendet' },
            ] as const).map((opt) => (
              <label
                key={opt.key}
                className={`flex items-start gap-2 px-2.5 py-1.5 rounded-md cursor-pointer transition-colors text-xs ${
                  currentStatus === opt.key ? 'bg-blue-50 border border-blue-200' : 'hover:bg-gray-50 border border-transparent'
                }`}
              >
                <input
                  type="radio"
                  name="page-status"
                  checked={currentStatus === opt.key}
                  onChange={() => {
                    if (opt.key === 'scheduled') {
                      const dateStr = prompt('Veröffentlichungsdatum (JJJJ-MM-TT HH:MM):', formatLocalDateTime(page?.published_at));
                      if (dateStr) {
                        const d = new Date(dateStr);
                        if (!isNaN(d.getTime())) onStatusChange('scheduled', d.toISOString());
                      }
                    } else {
                      onStatusChange(opt.key, opt.key === 'draft' ? null : undefined);
                    }
                  }}
                  className="mt-0.5 accent-[var(--primary)]"
                  disabled={isNew}
                />
                <div className="flex-1 min-w-0">
                  <div className="font-medium">{opt.label}</div>
                  <div className="text-[10px] text-[var(--text-muted)]">{opt.desc}</div>
                </div>
              </label>
            ))}
          </div>

          {currentStatus === 'scheduled' && page?.published_at && (
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-blue-50 rounded text-xs text-blue-700">
              <Calendar size={12} />
              {new Date(page.published_at).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </div>
          )}

          <button
            onClick={onSave}
            disabled={isSaving}
            className={`w-full flex items-center justify-center gap-1.5 px-3 py-2.5 text-sm font-semibold rounded-md disabled:opacity-50 transition-colors shadow-sm ${
              isDirty
                ? 'bg-[var(--primary)] text-white hover:bg-[var(--primary-dark)]'
                : currentStatus === 'published'
                  ? 'bg-green-600 text-white hover:bg-green-700'
                  : 'bg-gray-100 text-[var(--text-muted)] border border-[var(--border)]'
            }`}
          >
            {isSaving ? 'Speichern...' : isDirty ? 'Aktualisieren' : isNew ? 'Seite erstellen' : currentStatus === 'published' ? 'Publiziert' : 'Gespeichert'}
          </button>

          {!isNew && (
            <div className="flex items-center justify-center gap-3 pt-1">
              <button onClick={onDuplicate} className="flex items-center gap-1 text-[10px] text-[var(--text-muted)] hover:text-[var(--primary)] hover:underline transition-colors">
                <Copy size={10} /> Duplizieren
              </button>
              <span className="text-[10px] text-[var(--border)]">|</span>
              <button
                onClick={() => { if (confirm('Seite deaktivieren? Sie wird nicht mehr öffentlich sichtbar sein.')) onDelete(); }}
                className="flex items-center gap-1 text-[10px] text-[var(--text-muted)] hover:text-amber-600 hover:underline transition-colors"
              >
                <Archive size={10} /> Deaktivieren
              </button>
            </div>
          )}
        </div>

      </div>
      </div>

      {/* Block / Versionen - eigene Card */}
      <div className="mt-2 flex-1 flex flex-col bg-white rounded-lg shadow-sm overflow-hidden min-h-0">
        <div className="flex bg-gray-50 rounded-t-lg">
          {(['block', 'versions'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setBottomTab(tab)}
              className={`flex-1 px-3 py-1.5 text-xs font-medium transition-colors border-b-2 ${
                bottomTab === tab
                  ? 'border-[var(--primary)] text-[var(--primary)]'
                  : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text)]'
              }`}
            >
              {tab === 'block' ? 'Block' : 'Versionen'}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-auto">
          {bottomTab === 'block' && (
            <BlocksPanel
              sections={currentSections}
              selectedBlockId={selectedBlock?.blockId ?? null}
              onSelectBlock={onSelectBlock}
            />
          )}

          {bottomTab === 'versions' && page && (
            <VersionsPanel
              pageId={page.id}
              currentTitle={page.title}
              currentSections={currentSections}
              currentSeo={{ title: page.seo?.title || '', description: page.seo?.description || '' }}
              onVersionRestored={onVersionRestored}
            />
          )}
          {bottomTab === 'versions' && !page && (
            <div className="text-center py-8 px-3">
              <div className="text-xs text-[var(--text-muted)]">Seite zuerst speichern</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function getBlockPreview(block: Block): string | null {
  const d = block.data;
  if (!d) return null;
  const text = (d.title ?? d.heading ?? d.headline ?? d.label ?? d.question ?? d.buttonText ?? d.alt) as string | undefined;
  if (text) return text;
  if (typeof d.html === 'string') {
    const stripped = d.html.replace(/<[^>]*>/g, '').trim();
    return stripped ? stripped.slice(0, 60) : null;
  }
  if (typeof d.content === 'string') {
    const stripped = d.content.replace(/<[^>]*>/g, '').trim();
    return stripped ? stripped.slice(0, 60) : null;
  }
  return null;
}

function BlocksPanel({ sections, selectedBlockId, onSelectBlock }: {
  sections: Section[];
  selectedBlockId: string | null;
  onSelectBlock: (sectionId: string, columnId: string, blockId: string) => void;
}) {
  const allBlocks: { sectionId: string; columnId: string; block: Block; sectionIndex: number }[] = [];
  sections.forEach((section, si) => {
    section.columns.forEach((col) => {
      col.blocks.forEach((block) => {
        allBlocks.push({ sectionId: section.id, columnId: col.id, block, sectionIndex: si });
      });
    });
  });

  if (allBlocks.length === 0) {
    return (
      <div className="text-center py-8 px-3">
        <div className="text-xs text-[var(--text-muted)]">Keine Bloecke vorhanden</div>
        <div className="text-[10px] text-[var(--text-muted)] mt-1">Fuege im Inhalt-Tab Bloecke hinzu</div>
      </div>
    );
  }

  return (
    <div className="space-y-px">
      {allBlocks.map((item) => {
        const bt = BLOCK_TYPES.find((t) => t.type_key === item.block.blockType);
        const isSelected = selectedBlockId === item.block.id;
        const preview = getBlockPreview(item.block);
        return (
          <button
            key={item.block.id}
            onClick={() => {
              onSelectBlock(item.sectionId, item.columnId, item.block.id);
              const el = document.querySelector(`[data-block-id="${item.block.id}"]`);
              el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }}
            className={`w-full flex items-center gap-2 px-3 py-2 text-left transition-colors ${
              isSelected ? 'bg-blue-50 border-l-2 border-l-[var(--primary)]' : 'hover:bg-gray-50 border-l-2 border-l-transparent'
            }`}
          >
            <div className="flex-1 min-w-0">
              <div className={`text-xs font-medium truncate ${isSelected ? 'text-[var(--primary)]' : ''}`}>
                {bt?.label ?? item.block.blockType}
              </div>
              {preview && (
                <div className="text-[10px] text-[var(--text-muted)] truncate">{preview}</div>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}

function VersionsPanel({ pageId, currentTitle, currentSections, currentSeo, onVersionRestored }: {
  pageId: number;
  currentTitle: string;
  currentSections: Section[];
  currentSeo: { title: string; description: string };
  onVersionRestored?: () => void;
}) {
  const queryClient = useQueryClient();
  const [compareVersionId, setCompareVersionId] = useState<number | null>(null);

  const { data: versions, isLoading } = useQuery<PageVersion[]>({
    queryKey: ['pageVersions', pageId],
    queryFn: async () => (await api.get(`/api/pages/${pageId}/versions`)).data,
  });

  const restoreMutation = useMutation({
    mutationFn: (versionId: number) => api.post(`/api/pages/${pageId}/versions/${versionId}/restore`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pageVersions', pageId] });
      setCompareVersionId(null);
      onVersionRestored?.();
    },
  });

  if (isLoading) return <div className="p-3 text-xs text-[var(--text-muted)]">Laden...</div>;

  if (!versions || versions.length === 0) {
    return (
      <div className="text-center py-8 px-3">
        <div className="text-xs text-[var(--text-muted)]">Noch keine Versionen</div>
        <div className="text-[10px] text-[var(--text-muted)] mt-1">Versionen werden automatisch beim Speichern erstellt.</div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-px">
        {versions.map((v) => (
          <div key={v.id} className="px-3 py-2 hover:bg-gray-50 transition-colors group">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium">v{v.version_number}</span>
              <span className="text-[10px] text-[var(--text-muted)]">
                {new Date(v.created_at).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            {v.change_summary && (
              <div className="text-[10px] text-[var(--text-muted)] mt-0.5 truncate">{v.change_summary}</div>
            )}
            <div className="flex items-center gap-2 mt-1">
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${STATUS_STYLES[v.status] ?? 'bg-gray-100 text-gray-600'}`}>
                {STATUS_LABELS[v.status] ?? v.status}
              </span>
              <div className="flex items-center gap-1.5 ml-auto opacity-0 group-hover:opacity-100 transition-all">
                <button
                  onClick={() => setCompareVersionId(v.id)}
                  className="flex items-center gap-0.5 text-[10px] text-[var(--text-muted)] hover:text-[var(--primary)]"
                >
                  <GitCompareArrows size={10} /> Vergleichen
                </button>
                <button
                  onClick={() => {
                    if (confirm(`Seite auf Version ${v.version_number} zuruecksetzen? Der aktuelle Stand wird vorher gesichert.`))
                      restoreMutation.mutate(v.id);
                  }}
                  className="flex items-center gap-0.5 text-[10px] text-[var(--text-muted)] hover:text-[var(--primary)]"
                >
                  <RotateCcw size={10} /> Wiederherstellen
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {compareVersionId && (
        <VersionCompareModal
          pageId={pageId}
          versionId={compareVersionId}
          currentTitle={currentTitle}
          currentSections={currentSections}
          currentSeo={currentSeo}
          onRestore={(vid) => restoreMutation.mutate(vid)}
          onClose={() => setCompareVersionId(null)}
        />
      )}
    </>
  );
}
