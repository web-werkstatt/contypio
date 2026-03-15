import { useState, useEffect, useCallback } from 'react';
import {
  ChevronRight, ChevronDown, Columns, Square, GripVertical, ArrowUp, ArrowDown, Trash2,
  Image, Type, LayoutGrid, Layers, MousePointerClick, HelpCircle, Mail,
  Star, List, MapPin, Sparkles, Newspaper, Shield, GalleryHorizontal,
} from 'lucide-react';
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext, verticalListSortingStrategy, useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Block } from '@/types/cms';
import { BLOCK_TYPES } from '@/types/cms';
import type { UseSectionEditorReturn } from '@/hooks/useSectionEditor';

const LAYOUT_LABELS: Record<string, string> = {
  'full': 'Volle Breite',
  '1': 'Volle Breite',
  '1-1': '2 Spalten',
  '1-1-1': '3 Spalten',
  '2-1': '2/3 + 1/3',
  '1-2': '1/3 + 2/3',
  '1-1-1-1': '4 Spalten',
};

const ICON_MAP: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  Image, ImageIcon: Image, Type, LayoutGrid, Layers, MousePointerClick, HelpCircle, Mail,
  Star, List, MapPin, Sparkles, Newspaper, Shield, GalleryHorizontal, Square,
};

function BlockIcon({ iconName, size = 14, className }: { iconName: string; size?: number; className?: string }) {
  const Icon = ICON_MAP[iconName] ?? Square;
  return <Icon size={size} className={className} />;
}

function getBlockPreview(block: Block): string | null {
  const d = block.data;
  if (!d) return null;
  const text = (d.title ?? d.heading ?? d.headline ?? d.label ?? d.question ?? d.buttonText ?? d.alt) as string | undefined;
  if (text) return text;
  if (typeof d.html === 'string') {
    const stripped = d.html.replace(/<[^>]*>/g, '').trim();
    return stripped ? stripped.slice(0, 50) : null;
  }
  if (typeof d.content === 'string') {
    const stripped = d.content.replace(/<[^>]*>/g, '').trim();
    return stripped ? stripped.slice(0, 50) : null;
  }
  return null;
}

interface Props {
  editor: UseSectionEditorReturn;
  selectedBlockId: string | null;
  onSelectBlock: (sectionId: string, columnId: string, blockId: string) => void;
}

const COLLAPSE_STORAGE_KEY = 'cms-structure-tree-collapsed';

export default function StructureTree({ editor, selectedBlockId, onSelectBlock }: Props) {
  const { sections, moveSection, removeSection, moveBlock, removeBlock, reorderSections, reorderBlocksInColumn } = editor;
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>(() => {
    try {
      const stored = localStorage.getItem(COLLAPSE_STORAGE_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch { return {}; }
  });
  const [visibleSectionId, setVisibleSectionId] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem(COLLAPSE_STORAGE_KEY, JSON.stringify(collapsed));
  }, [collapsed]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setVisibleSectionId(entry.target.getAttribute('data-section-id'));
          }
        }
      },
      { threshold: 0.3 }
    );
    const sectionEls = document.querySelectorAll('[data-section-id]');
    sectionEls.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [sections]);

  const toggle = useCallback((id: string) => setCollapsed((prev) => ({ ...prev, [id]: !prev[id] })), []);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor)
  );

  const handleSectionDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const fromIdx = sections.findIndex((s) => s.id === active.id);
    const toIdx = sections.findIndex((s) => s.id === over.id);
    if (fromIdx >= 0 && toIdx >= 0) reorderSections(fromIdx, toIdx);
  }, [sections, reorderSections]);

  if (sections.length === 0) {
    return (
      <div className="text-center py-12 text-[var(--text-muted)]">
        <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gray-100 flex items-center justify-center">
          <Columns size={20} className="text-gray-300" />
        </div>
        <p className="text-sm font-medium text-[var(--text)]">Keine Struktur</p>
        <p className="text-xs mt-1">Wechsle zum Layout-Tab um Abschnitte hinzuzufügen.</p>
      </div>
    );
  }

  const sectionIds = sections.map((s) => s.id);

  return (
    <div className="select-none">
      <div className="px-3 py-2 text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">
        Struktur
      </div>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleSectionDragEnd}>
        <SortableContext items={sectionIds} strategy={verticalListSortingStrategy}>
          {sections.map((section, sIdx) => (
            <SortableSectionRow
              key={section.id}
              section={section}
              sIdx={sIdx}
              totalSections={sections.length}
              collapsed={collapsed}
              visibleSectionId={visibleSectionId}
              selectedBlockId={selectedBlockId}
              onToggle={toggle}
              onMoveSection={moveSection}
              onRemoveSection={removeSection}
              onMoveBlock={moveBlock}
              onRemoveBlock={removeBlock}
              onSelectBlock={onSelectBlock}
              onReorderBlocks={reorderBlocksInColumn}
              sensors={sensors}
            />
          ))}
        </SortableContext>
      </DndContext>
    </div>
  );
}

// --- Sortable Section Row ---

function SortableSectionRow({ section, sIdx, totalSections, collapsed, visibleSectionId, selectedBlockId, onToggle, onMoveSection, onRemoveSection, onMoveBlock, onRemoveBlock, onSelectBlock, onReorderBlocks, sensors }: {
  section: Props['editor']['sections'][0];
  sIdx: number;
  totalSections: number;
  collapsed: Record<string, boolean>;
  visibleSectionId: string | null;
  selectedBlockId: string | null;
  onToggle: (id: string) => void;
  onMoveSection: (id: string, dir: 'up' | 'down') => void;
  onRemoveSection: (id: string) => void;
  onMoveBlock: (sId: string, cId: string, bId: string, dir: 'up' | 'down') => void;
  onRemoveBlock: (sId: string, cId: string, bId: string) => void;
  onSelectBlock: (sId: string, cId: string, bId: string) => void;
  onReorderBlocks: (sId: string, cId: string, from: number, to: number) => void;
  sensors: ReturnType<typeof useSensors>;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: section.id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };

  const sectionCollapsed = collapsed[section.id] ?? false;
  const hasMultipleColumns = section.columns.length > 1;
  const totalBlocks = section.columns.reduce((sum, c) => sum + c.blocks.length, 0);

  const handleBlockDragEnd = useCallback((columnId: string) => (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const col = section.columns.find((c) => c.id === columnId);
    if (!col) return;
    const fromIdx = col.blocks.findIndex((b) => b.id === active.id);
    const toIdx = col.blocks.findIndex((b) => b.id === over.id);
    if (fromIdx >= 0 && toIdx >= 0) onReorderBlocks(section.id, columnId, fromIdx, toIdx);
  }, [section, onReorderBlocks]);

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      {/* Section header */}
      <div
        className={`group flex items-center gap-1 px-1 py-1.5 hover:bg-gray-50 transition-colors cursor-pointer ${
          visibleSectionId === section.id ? 'bg-blue-50/50' : ''
        }`}
        onClick={() => onToggle(section.id)}
      >
        <span {...listeners} className="cursor-grab active:cursor-grabbing p-0.5 text-gray-300 hover:text-gray-500">
          <GripVertical size={12} />
        </span>
        <button className="p-0.5 text-[var(--text-muted)]">
          {sectionCollapsed ? <ChevronRight size={12} /> : <ChevronDown size={12} />}
        </button>
        <Columns size={13} className="text-blue-500 shrink-0" />
        <span className="text-xs font-medium flex-1 truncate">
          Abschnitt {sIdx + 1}
        </span>
        {hasMultipleColumns && (
          <span className="text-[10px] text-[var(--text-muted)] mr-1">
            {LAYOUT_LABELS[section.layout] ?? section.layout}
          </span>
        )}
        {sectionCollapsed && totalBlocks > 0 && (
          <span className="text-[10px] text-[var(--text-muted)] bg-gray-100 rounded px-1.5 py-0.5 mr-1">
            {totalBlocks} {totalBlocks === 1 ? 'Block' : 'Blöcke'}
          </span>
        )}
        <div className="hidden group-hover:flex items-center gap-0.5">
          <button
            onClick={(e) => { e.stopPropagation(); onMoveSection(section.id, 'up'); }}
            disabled={sIdx === 0}
            className="p-1 rounded hover:bg-gray-200 disabled:opacity-20 text-gray-500 hover:text-gray-700"
            title="Nach oben"
          >
            <ArrowUp size={13} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onMoveSection(section.id, 'down'); }}
            disabled={sIdx === totalSections - 1}
            className="p-1 rounded hover:bg-gray-200 disabled:opacity-20 text-gray-500 hover:text-gray-700"
            title="Nach unten"
          >
            <ArrowDown size={13} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onRemoveSection(section.id); }}
            className="p-1 rounded hover:bg-red-100 text-gray-500 hover:text-red-500"
            title="Entfernen"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {/* Children */}
      {!sectionCollapsed && (
        <div>
          {section.columns.map((col, cIdx) => {
            const colKey = `${section.id}-${col.id}`;
            const colCollapsed = collapsed[colKey] ?? false;
            const blockIds = col.blocks.map((b) => b.id);

            if (!hasMultipleColumns) {
              return (
                <DndContext key={col.id} sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleBlockDragEnd(col.id)}>
                  <SortableContext items={blockIds} strategy={verticalListSortingStrategy}>
                    {col.blocks.map((block, bIdx) => (
                      <SortableBlockRow
                        key={block.id}
                        block={block}
                        depth={1}
                        isSelected={selectedBlockId === block.id}
                        isFirst={bIdx === 0}
                        isLast={bIdx === col.blocks.length - 1}
                        onClick={() => {
                          onSelectBlock(section.id, col.id, block.id);
                          const el = document.querySelector(`[data-block-id="${block.id}"]`);
                          el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        }}
                        onMoveUp={() => onMoveBlock(section.id, col.id, block.id, 'up')}
                        onMoveDown={() => onMoveBlock(section.id, col.id, block.id, 'down')}
                        onRemove={() => onRemoveBlock(section.id, col.id, block.id)}
                      />
                    ))}
                  </SortableContext>
                </DndContext>
              );
            }

            return (
              <div key={col.id}>
                <div
                  className="group flex items-center gap-1 py-1.5 hover:bg-gray-50 transition-colors cursor-pointer"
                  style={{ paddingLeft: 24 }}
                  onClick={() => onToggle(colKey)}
                >
                  <button className="p-0.5 text-[var(--text-muted)]">
                    {colCollapsed ? <ChevronRight size={11} /> : <ChevronDown size={11} />}
                  </button>
                  <GripVertical size={12} className="text-gray-300 shrink-0" />
                  <span className="text-[11px] font-medium text-[var(--text-muted)] flex-1">
                    Spalte {cIdx + 1}
                  </span>
                  {colCollapsed && (
                    <span className="text-[10px] text-[var(--text-muted)] mr-2">{col.blocks.length}</span>
                  )}
                </div>
                {!colCollapsed && (
                  <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleBlockDragEnd(col.id)}>
                    <SortableContext items={blockIds} strategy={verticalListSortingStrategy}>
                      {col.blocks.map((block, bIdx) => (
                        <SortableBlockRow
                          key={block.id}
                          block={block}
                          depth={2}
                          isSelected={selectedBlockId === block.id}
                          isFirst={bIdx === 0}
                          isLast={bIdx === col.blocks.length - 1}
                          onClick={() => {
                            onSelectBlock(section.id, col.id, block.id);
                            const el = document.querySelector(`[data-block-id="${block.id}"]`);
                            el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                          }}
                          onMoveUp={() => onMoveBlock(section.id, col.id, block.id, 'up')}
                          onMoveDown={() => onMoveBlock(section.id, col.id, block.id, 'down')}
                          onRemove={() => onRemoveBlock(section.id, col.id, block.id)}
                        />
                      ))}
                    </SortableContext>
                  </DndContext>
                )}
                {!colCollapsed && col.blocks.length === 0 && (
                  <div className="text-[10px] text-[var(--text-muted)] italic" style={{ paddingLeft: 52 }}>
                    Leer
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// --- Sortable Block Row ---

function SortableBlockRow({ block, depth, isSelected, isFirst, isLast, onClick, onMoveUp, onMoveDown, onRemove }: {
  block: Block;
  depth: number;
  isSelected: boolean;
  isFirst: boolean;
  isLast: boolean;
  onClick: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: block.id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 };

  const bt = BLOCK_TYPES.find((t) => t.type_key === block.blockType);
  const preview = getBlockPreview(block);
  const paddingLeft = depth === 1 ? 20 : 44;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      className={`group flex items-center gap-1 py-1.5 pr-2 cursor-pointer transition-colors ${
        isSelected
          ? 'bg-blue-50 border-l-2 border-l-[var(--primary)]'
          : 'hover:bg-gray-50 border-l-2 border-l-transparent'
      }`}
      onClick={onClick}
    >
      <span
        {...listeners}
        className="cursor-grab active:cursor-grabbing p-0.5 text-gray-300 hover:text-gray-500"
        style={{ marginLeft: paddingLeft }}
        onClick={(e) => e.stopPropagation()}
      >
        <GripVertical size={11} />
      </span>
      <BlockIcon
        iconName={bt?.icon ?? 'Square'}
        size={13}
        className={isSelected ? 'text-[var(--primary)] shrink-0' : 'text-gray-400 shrink-0'}
      />
      <div className="flex-1 min-w-0">
        <div className={`text-[11px] font-medium truncate ${isSelected ? 'text-[var(--primary)]' : 'text-[var(--text)]'}`}>
          {bt?.label ?? block.blockType}
        </div>
        {preview && (
          <div className="text-[10px] text-[var(--text-muted)] truncate">{preview}</div>
        )}
      </div>
      <div className="hidden group-hover:flex items-center gap-0.5 shrink-0">
        <button
          onClick={(e) => { e.stopPropagation(); onMoveUp(); }}
          disabled={isFirst}
          className="p-1 rounded hover:bg-gray-200 disabled:opacity-20 text-gray-500 hover:text-gray-700"
          title="Nach oben"
        >
          <ArrowUp size={12} />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onMoveDown(); }}
          disabled={isLast}
          className="p-1 rounded hover:bg-gray-200 disabled:opacity-20 text-gray-500 hover:text-gray-700"
          title="Nach unten"
        >
          <ArrowDown size={12} />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onRemove(); }}
          className="p-1 rounded hover:bg-red-100 text-gray-500 hover:text-red-500"
          title="Entfernen"
        >
          <Trash2 size={12} />
        </button>
      </div>
    </div>
  );
}
