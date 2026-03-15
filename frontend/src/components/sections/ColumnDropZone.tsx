import type { Column, BlockType } from '@/types/cms';
import BlockItem from '@/components/blocks/BlockItem';
import AddBlockButton from '@/components/blocks/AddBlockButton';

interface Props {
  column: Column;
  sectionId: string;
  onAddBlock(blockType: BlockType): void;
  onRemoveBlock(blockId: string): void;
  onMoveBlock(blockId: string, direction: 'up' | 'down'): void;
  onUpdateBlockData(blockId: string, data: Record<string, unknown>): void;
  selectedBlockId?: string;
  onSelectBlock?(blockId: string): void;
}

export default function ColumnDropZone({ column, sectionId, onAddBlock, onRemoveBlock, onMoveBlock, onUpdateBlockData, selectedBlockId, onSelectBlock }: Props) {
  const isEmpty = column.blocks.length === 0;

  return (
    <div
      className={`min-h-[80px] rounded-md p-2 flex flex-col gap-2 ${
        isEmpty ? 'border-2 border-dashed border-gray-200' : 'border border-gray-100'
      }`}
    >
      {isEmpty && (
        <div className="flex-1 flex items-center justify-center text-xs text-gray-300">
          Inhaltselement hier einfügen
        </div>
      )}
      {column.blocks.map((block, idx) => (
        <BlockItem
          key={block.id}
          block={block}
          sectionId={sectionId}
          isFirst={idx === 0}
          isLast={idx === column.blocks.length - 1}
          selected={selectedBlockId === block.id}
          onSelect={() => onSelectBlock?.(block.id)}
          onRemove={() => onRemoveBlock(block.id)}
          onMove={(dir) => onMoveBlock(block.id, dir)}
          onUpdateData={(data) => onUpdateBlockData(block.id, data)}
        />
      ))}
      <AddBlockButton onAdd={onAddBlock} />
    </div>
  );
}
