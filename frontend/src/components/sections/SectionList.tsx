import type { UseSectionEditorReturn } from '@/hooks/useSectionEditor';
import SectionItem from './SectionItem';
import AddSectionButton from './AddSectionButton';
import BlockItem from '@/components/blocks/BlockItem';
import AddBlockButton from '@/components/blocks/AddBlockButton';

interface Props {
  editor: UseSectionEditorReturn;
  mode: 'content' | 'layout';
  selectedBlockId?: string;
  onSelectBlock?(sectionId: string, columnId: string, blockId: string): void;
}

export default function SectionList({ editor, mode, selectedBlockId, onSelectBlock }: Props) {
  const {
    sections, flatBlocks, addSection, addSectionPreset, removeSection,
    moveSection, updateSectionSettings, changeLayout, addBlock, addBlockDirect,
    removeBlock, duplicateBlock, moveBlock, moveBlockDirect, updateBlockData,
    toggleBlockHidden,
  } = editor;

  // --- CONTENT MODE: Contao-artige lineare Darstellung ---
  if (mode === 'content') {
    return (
      <div className="space-y-0">
        {/* Inline Inserter oben (WordPress-Style) */}
        <AddBlockButton
          onAdd={(blockType) => addBlockDirect(blockType, 0)}
          inline
        />

        {flatBlocks.map((fb, idx) => (
          <div key={fb.block.id}>
            <BlockItem
              block={fb.block}
              sectionId={fb.sectionId}
              isFirst={idx === 0}
              isLast={idx === flatBlocks.length - 1}
              selected={selectedBlockId === fb.block.id}
              onSelect={() => onSelectBlock?.(fb.sectionId, fb.columnId, fb.block.id)}
              onRemove={() => {
                const sec = sections.find((s) => s.id === fb.sectionId);
                if (sec && fb.isSimple && sec.columns[0].blocks.length <= 1) {
                  removeSection(fb.sectionId);
                } else {
                  removeBlock(fb.sectionId, fb.columnId, fb.block.id);
                }
              }}
              onMove={(dir) => moveBlockDirect(fb.sectionId, fb.columnId, fb.block.id, dir)}
              onDuplicate={() => duplicateBlock(fb.sectionId, fb.columnId, fb.block.id)}
              onToggleHidden={() => toggleBlockHidden(fb.sectionId, fb.columnId, fb.block.id)}
              onUpdateData={(data) => updateBlockData(fb.sectionId, fb.columnId, fb.block.id, data)}
            />
            {/* Inline Inserter zwischen Blöcken (WordPress-Style) */}
            <AddBlockButton
              onAdd={(blockType) => addBlockDirect(blockType, fb.sectionIndex + 1)}
              inline
            />
          </div>
        ))}

        {flatBlocks.length === 0 && (
          <div className="text-center py-20 text-[var(--text-muted)]">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-300">
                <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="12" y1="18" x2="12" y2="12" />
                <line x1="9" y1="15" x2="15" y2="15" />
              </svg>
            </div>
            <p className="text-sm font-medium text-[var(--text)]">Leere Seite</p>
            <p className="text-xs mt-1.5 max-w-xs mx-auto">Füge dein erstes Inhaltselement hinzu, um die Seite zu gestalten.</p>
          </div>
        )}
      </div>
    );
  }

  // --- LAYOUT MODE: Sections mit Spalten-Layouts (Pro / Page-Builder) ---
  return (
    <div className="space-y-0">
      <AddSectionButton onAdd={(layout) => addSection(layout, 0)} onAddPreset={(section) => addSectionPreset(section, 0)} />

      {sections.map((section, idx) => (
        <div key={section.id}>
          <SectionItem
            section={section}
            isFirst={idx === 0}
            isLast={idx === sections.length - 1}
            onMove={(dir) => moveSection(section.id, dir)}
            onRemove={() => removeSection(section.id)}
            onChangeLayout={(layout) => changeLayout(section.id, layout)}
            onUpdateSettings={(updates) => updateSectionSettings(section.id, updates)}
            onAddBlock={(colId, blockType) => addBlock(section.id, colId, blockType)}
            onRemoveBlock={(colId, blockId) => removeBlock(section.id, colId, blockId)}
            onMoveBlock={(colId, blockId, dir) => moveBlock(section.id, colId, blockId, dir)}
            onUpdateBlockData={(colId, blockId, data) => updateBlockData(section.id, colId, blockId, data)}
            selectedBlockId={selectedBlockId}
            onSelectBlock={onSelectBlock ? (colId: string, blockId: string) => onSelectBlock(section.id, colId, blockId) : undefined}
          />
          <AddSectionButton onAdd={(layout) => addSection(layout, idx + 1)} onAddPreset={(section) => addSectionPreset(section, idx + 1)} />
        </div>
      ))}

      {sections.length === 0 && (
        <div className="text-center py-20 text-[var(--text-muted)]">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-300">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <line x1="3" y1="9" x2="21" y2="9" />
              <line x1="3" y1="15" x2="21" y2="15" />
              <line x1="9" y1="3" x2="9" y2="21" />
            </svg>
          </div>
          <p className="text-sm font-medium text-[var(--text)]">Kein Layout vorhanden</p>
          <p className="text-xs mt-1.5 max-w-xs mx-auto">Füge eine Vorlage oder Layout-Gruppe hinzu, um mit mehreren Spalten zu arbeiten.</p>
        </div>
      )}
    </div>
  );
}
