import { useState } from 'react';
import { ChevronDown, ChevronUp, ArrowUp, ArrowDown, Trash2, Copy, Eye, EyeOff } from 'lucide-react';
import type { Block } from '@/types/cms';
import { BLOCK_TYPES } from '@/types/cms';
import BlockEditor from './BlockEditor';

interface Props {
  block: Block;
  sectionId: string;
  isFirst: boolean;
  isLast: boolean;
  selected?: boolean;
  onSelect?(): void;
  onRemove(): void;
  onDuplicate?(): void;
  onToggleHidden?(): void;
  onMove(direction: 'up' | 'down'): void;
  onUpdateData(data: Record<string, unknown>): void;
}

function getBlockTypeLabel(block: Block): string {
  const info = BLOCK_TYPES.find((bt) => bt.type_key === block.blockType);
  return info?.label ?? block.blockType;
}

function getBlockTitle(block: Block): string | undefined {
  return (block.data.title as string | undefined) || (block.data.heading as string | undefined);
}

export default function BlockItem({ block, isFirst, isLast, selected, onSelect, onRemove, onDuplicate, onToggleHidden, onMove, onUpdateData }: Props) {
  const [collapsed, setCollapsed] = useState(false);
  const isHidden = block.hidden === true;

  return (
    <div
      className={`rounded-md bg-white transition-colors ${selected ? 'ring-2 ring-[var(--primary)]' : ''} ${isHidden ? 'opacity-50' : ''}`}
      data-block-id={block.id}
      data-editor-block-id={block.id}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-2.5 py-1.5 bg-gray-50/50 rounded-t-md cursor-pointer"
        onClick={() => onSelect?.()}
      >
        <button
          onClick={(e) => { e.stopPropagation(); setCollapsed(!collapsed); }}
          className="flex items-center gap-1.5 text-xs font-medium text-[var(--text)] truncate flex-1 text-left"
        >
          {collapsed ? <ChevronDown size={12} /> : <ChevronUp size={12} />}
          <span className="inline-flex items-center gap-1.5 truncate">
            <span className="shrink-0 px-1.5 py-0.5 rounded bg-gray-200 text-[10px] font-semibold uppercase tracking-wide text-gray-600">{getBlockTypeLabel(block)}</span>
            {getBlockTitle(block) && <span className="truncate text-[var(--text-muted)]">{getBlockTitle(block)}</span>}
            {isHidden && <span className="text-[10px] text-amber-600 bg-amber-50 px-1 py-0.5 rounded">ausgeblendet</span>}
          </span>
        </button>
        <div className="flex items-center gap-0.5 ml-2 shrink-0">
          {onToggleHidden && (
            <button
              onClick={(e) => { e.stopPropagation(); onToggleHidden(); }}
              className={`p-0.5 rounded transition-colors ${isHidden ? 'hover:bg-amber-100 text-amber-500' : 'hover:bg-gray-200 text-[var(--text-muted)]'}`}
              title={isHidden ? 'Block einblenden' : 'Block ausblenden'}
            >
              {isHidden ? <EyeOff size={12} /> : <Eye size={12} />}
            </button>
          )}
          <button onClick={() => onMove('up')} disabled={isFirst} className="p-0.5 rounded hover:bg-gray-200 disabled:opacity-30 transition-colors">
            <ArrowUp size={12} />
          </button>
          <button onClick={() => onMove('down')} disabled={isLast} className="p-0.5 rounded hover:bg-gray-200 disabled:opacity-30 transition-colors">
            <ArrowDown size={12} />
          </button>
          {onDuplicate && (
            <button onClick={onDuplicate} className="p-0.5 rounded hover:bg-blue-100 text-[var(--text-muted)] hover:text-[var(--primary)] transition-colors" title="Block duplizieren">
              <Copy size={12} />
            </button>
          )}
          <button onClick={() => { if (confirm('Block löschen? (Strg+Z zum Rückgängig machen)')) onRemove(); }} className="p-0.5 rounded hover:bg-red-100 text-[var(--danger)] transition-colors" title="Löschen (Strg+Z zum Rückgängig machen)">
            <Trash2 size={12} />
          </button>
        </div>
      </div>

      {/* Editor */}
      {!collapsed && !isHidden && (
        <div className="p-3">
          <BlockEditor block={block} onChange={onUpdateData} />
        </div>
      )}
    </div>
  );
}
