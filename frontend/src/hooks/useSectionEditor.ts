import { useState, useCallback, useRef } from 'react';
import { nanoid } from 'nanoid';
import type { Section, Column, Block, LayoutKey, BlockType, GridConfig } from '@/types/cms';
import { getLayoutPreset } from '@/types/cms';

function makeId(prefix: string): string {
  return `${prefix}_${nanoid(8)}`;
}

function makeColumns(count: number): Column[] {
  return Array.from({ length: count }, () => ({
    id: makeId('col'),
    blocks: [],
  }));
}

export interface UseSectionEditorReturn {
  sections: Section[];
  /** Flattened list of all blocks with their parent IDs (for flat-mode rendering) */
  flatBlocks: FlatBlock[];
  addSection(layout: LayoutKey, index?: number): void;
  addSectionPreset(section: Section, index?: number): void;
  removeSection(sectionId: string): void;
  moveSection(sectionId: string, direction: 'up' | 'down'): void;
  updateSectionSettings(sectionId: string, updates: Partial<Pick<Section, 'background' | 'spacing'>>): void;
  changeLayout(sectionId: string, newLayout: LayoutKey, gridConfig?: GridConfig): void;
  addBlock(sectionId: string, columnId: string, blockType: BlockType): void;
  /** Shortcut: creates a full-width section with one block (Contao-style "add content element") */
  addBlockDirect(blockType: BlockType, index?: number): void;
  removeBlock(sectionId: string, columnId: string, blockId: string): void;
  duplicateBlock(sectionId: string, columnId: string, blockId: string): void;
  moveBlock(sectionId: string, columnId: string, blockId: string, direction: 'up' | 'down'): void;
  moveBlockDirect(sectionId: string, columnId: string, blockId: string, direction: 'up' | 'down'): void;
  updateBlockData(sectionId: string, columnId: string, blockId: string, data: Record<string, unknown>): void;
  toggleBlockHidden(sectionId: string, columnId: string, blockId: string): void;
  reorderSections(fromIndex: number, toIndex: number): void;
  reorderBlocksInColumn(sectionId: string, columnId: string, fromIndex: number, toIndex: number): void;
  isDirty: boolean;
  canUndo: boolean;
  canRedo: boolean;
  /** Number of available undo steps (for revision slider) */
  historyLength: number;
  /** Current position in history (0 = latest, historyLength = oldest) */
  historyPosition: number;
  undo(): void;
  redo(): void;
  /** Jump to a specific history position (0 = current, historyLength = oldest) */
  goToRevision(position: number): void;
  reset(sections: Section[]): void;
}

export interface FlatBlock {
  block: Block;
  sectionId: string;
  columnId: string;
  sectionIndex: number;
  isSimple: boolean; // true if parent section is full-width with 1 column
}

function isSimpleSection(s: Section): boolean {
  return s.layout === 'full' && s.columns.length === 1;
}

const MAX_HISTORY = 50;
const DEBOUNCE_MS = 500;

export function useSectionEditor(initialSections: Section[]): UseSectionEditorReturn {
  const [sections, setSections] = useState<Section[]>(initialSections);
  const initialRef = useRef(initialSections);
  const [isDirty, setIsDirty] = useState(false);
  const undoStack = useRef<Section[][]>([]);
  const redoStack = useRef<Section[][]>([]);
  // Track history sizes as state so UI re-renders when undo/redo stacks change
  const [historyState, setHistoryState] = useState({ undoLen: 0, redoLen: 0 });
  // Debounce: track last snapshot time to merge rapid changes (typing) into one undo step
  const lastSnapshotTime = useRef(0);

  const update = useCallback((fn: (prev: Section[]) => Section[], debounce = false) => {
    setSections((prev) => {
      const next = fn(prev);
      const now = Date.now();
      // If debouncing and last snapshot was recent, replace the last entry instead of pushing new
      if (debounce && undoStack.current.length > 0 && now - lastSnapshotTime.current < DEBOUNCE_MS) {
        // Don't push new snapshot — keep the previous "before" state
      } else {
        undoStack.current.push(prev);
        if (undoStack.current.length > MAX_HISTORY) undoStack.current.shift();
      }
      lastSnapshotTime.current = now;
      redoStack.current = [];
      setIsDirty(true);
      setHistoryState({ undoLen: undoStack.current.length, redoLen: 0 });
      return next;
    });
  }, []);

  const undo = useCallback(() => {
    const prev = undoStack.current.pop();
    if (!prev) return;
    setSections((current) => {
      redoStack.current.push(current);
      setHistoryState({ undoLen: undoStack.current.length, redoLen: redoStack.current.length });
      return prev;
    });
  }, []);

  const redo = useCallback(() => {
    const next = redoStack.current.pop();
    if (!next) return;
    setSections((current) => {
      undoStack.current.push(current);
      setHistoryState({ undoLen: undoStack.current.length, redoLen: redoStack.current.length });
      return next;
    });
  }, []);

  const goToRevision = useCallback((position: number) => {
    setSections((current) => {
      // position 0 = current (no-op), position N = N steps back
      const currentPos = redoStack.current.length; // 0 = latest
      const targetPos = position;
      if (targetPos === currentPos) return current;

      // Build full timeline: [...undoStack, current, ...redoStack(reversed)]
      const timeline = [...undoStack.current, current, ...([...redoStack.current].reverse())];
      // targetPos 0 = last in timeline (latest), targetPos = timeline.length-1 = first (oldest)
      const targetIndex = timeline.length - 1 - targetPos;
      if (targetIndex < 0 || targetIndex >= timeline.length) return current;

      const target = timeline[targetIndex];
      // Rebuild stacks
      undoStack.current = timeline.slice(0, targetIndex);
      redoStack.current = timeline.slice(targetIndex + 1).reverse();
      setHistoryState({ undoLen: undoStack.current.length, redoLen: redoStack.current.length });

      return target;
    });
  }, []);

  // Flattened view: all blocks with parent references
  const flatBlocks: FlatBlock[] = sections.flatMap((section, sectionIndex) =>
    section.columns.flatMap((col) =>
      col.blocks.map((block) => ({
        block,
        sectionId: section.id,
        columnId: col.id,
        sectionIndex,
        isSimple: isSimpleSection(section),
      }))
    )
  );

  const addSection = useCallback((layout: LayoutKey, index?: number) => {
    const preset = getLayoutPreset(layout);
    const section: Section = {
      id: makeId('sec'),
      layout,
      columns: makeColumns(preset.columns),
    };
    update((prev) => {
      const next = [...prev];
      const i = index !== undefined ? index : next.length;
      next.splice(i, 0, section);
      return next;
    });
  }, [update]);

  const addSectionPreset = useCallback((section: Section, index?: number) => {
    update((prev) => {
      const next = [...prev];
      const i = index !== undefined ? index : next.length;
      next.splice(i, 0, section);
      return next;
    });
  }, [update]);

  const removeSection = useCallback((sectionId: string) => {
    update((prev) => prev.filter((s) => s.id !== sectionId));
  }, [update]);

  const moveSection = useCallback((sectionId: string, direction: 'up' | 'down') => {
    update((prev) => {
      const idx = prev.findIndex((s) => s.id === sectionId);
      if (idx < 0) return prev;
      const newIdx = direction === 'up' ? idx - 1 : idx + 1;
      if (newIdx < 0 || newIdx >= prev.length) return prev;
      const next = [...prev];
      [next[idx], next[newIdx]] = [next[newIdx], next[idx]];
      return next;
    });
  }, [update]);

  const updateSectionSettings = useCallback((sectionId: string, updates: Partial<Pick<Section, 'background' | 'spacing'>>) => {
    update((prev) =>
      prev.map((s) =>
        s.id === sectionId
          ? { ...s, ...updates }
          : s
      )
    );
  }, [update]);

  const changeLayout = useCallback((sectionId: string, newLayout: LayoutKey, gridConfig?: GridConfig) => {
    update((prev) =>
      prev.map((s) => {
        if (s.id !== sectionId) return s;
        const preset = getLayoutPreset(newLayout, gridConfig);
        const needed = preset.columns;
        let newColumns: Column[];

        if (s.columns.length === needed) {
          newColumns = s.columns;
        } else if (s.columns.length < needed) {
          newColumns = [
            ...s.columns,
            ...makeColumns(needed - s.columns.length),
          ];
        } else {
          const kept = s.columns.slice(0, needed);
          const overflow = s.columns.slice(needed);
          const overflowBlocks = overflow.flatMap((c) => c.blocks);
          newColumns = kept.map((col, i) =>
            i === needed - 1
              ? { ...col, blocks: [...col.blocks, ...overflowBlocks] }
              : col
          );
        }

        return {
          ...s,
          layout: newLayout,
          grid_config: newLayout === 'custom' ? gridConfig : undefined,
          columns: newColumns,
        };
      })
    );
  }, [update]);

  const addBlock = useCallback((sectionId: string, columnId: string, blockType: BlockType) => {
    const block: Block = {
      id: makeId('blk'),
      blockType,
      data: {},
    };
    update((prev) =>
      prev.map((s) =>
        s.id === sectionId
          ? {
              ...s,
              columns: s.columns.map((c) =>
                c.id === columnId
                  ? { ...c, blocks: [...c.blocks, block] }
                  : c
              ),
            }
          : s
      )
    );
  }, [update]);

  const addBlockDirect = useCallback((blockType: BlockType, index?: number) => {
    const block: Block = { id: makeId('blk'), blockType, data: {} };
    const section: Section = {
      id: makeId('sec'),
      layout: 'full',
      columns: [{ id: makeId('col'), blocks: [block] }],
    };
    update((prev) => {
      const next = [...prev];
      const i = index !== undefined ? index : next.length;
      next.splice(i, 0, section);
      return next;
    });
  }, [update]);

  const removeBlock = useCallback((sectionId: string, columnId: string, blockId: string) => {
    update((prev) =>
      prev.map((s) =>
        s.id === sectionId
          ? {
              ...s,
              columns: s.columns.map((c) =>
                c.id === columnId
                  ? { ...c, blocks: c.blocks.filter((b) => b.id !== blockId) }
                  : c
              ),
            }
          : s
      )
    );
  }, [update]);

  const moveBlock = useCallback((sectionId: string, columnId: string, blockId: string, direction: 'up' | 'down') => {
    update((prev) =>
      prev.map((s) =>
        s.id === sectionId
          ? {
              ...s,
              columns: s.columns.map((c) => {
                if (c.id !== columnId) return c;
                const idx = c.blocks.findIndex((b) => b.id === blockId);
                if (idx < 0) return c;
                const newIdx = direction === 'up' ? idx - 1 : idx + 1;
                if (newIdx < 0 || newIdx >= c.blocks.length) return c;
                const blocks = [...c.blocks];
                [blocks[idx], blocks[newIdx]] = [blocks[newIdx], blocks[idx]];
                return { ...c, blocks };
              }),
            }
          : s
      )
    );
  }, [update]);

  // Move block across section boundaries (for flat mode)
  const moveBlockDirect = useCallback((sectionId: string, columnId: string, blockId: string, direction: 'up' | 'down') => {
    update((prev) => {
      const secIdx = prev.findIndex((s) => s.id === sectionId);
      if (secIdx < 0) return prev;
      const sec = prev[secIdx];
      const colIdx = sec.columns.findIndex((c) => c.id === columnId);
      if (colIdx < 0) return prev;
      const col = sec.columns[colIdx];
      const blkIdx = col.blocks.findIndex((b) => b.id === blockId);
      if (blkIdx < 0) return prev;

      // Try within same column first
      const newBlkIdx = direction === 'up' ? blkIdx - 1 : blkIdx + 1;
      if (newBlkIdx >= 0 && newBlkIdx < col.blocks.length) {
        const next = [...prev];
        const newCol = { ...col, blocks: [...col.blocks] };
        [newCol.blocks[blkIdx], newCol.blocks[newBlkIdx]] = [newCol.blocks[newBlkIdx], newCol.blocks[blkIdx]];
        const newSec = { ...sec, columns: sec.columns.map((c, i) => i === colIdx ? newCol : c) };
        next[secIdx] = newSec;
        return next;
      }

      // For simple full-width sections, swap entire sections
      if (isSimpleSection(sec)) {
        const targetSecIdx = direction === 'up' ? secIdx - 1 : secIdx + 1;
        if (targetSecIdx < 0 || targetSecIdx >= prev.length) return prev;
        const next = [...prev];
        [next[secIdx], next[targetSecIdx]] = [next[targetSecIdx], next[secIdx]];
        return next;
      }

      return prev;
    });
  }, [update]);

  const duplicateBlock = useCallback((sectionId: string, columnId: string, blockId: string) => {
    update((prev) =>
      prev.map((s) => {
        if (s.id !== sectionId) return s;
        return {
          ...s,
          columns: s.columns.map((c) => {
            if (c.id !== columnId) return c;
            const idx = c.blocks.findIndex((b) => b.id === blockId);
            if (idx < 0) return c;
            const original = c.blocks[idx];
            const copy: Block = {
              id: makeId('blk'),
              blockType: original.blockType,
              data: JSON.parse(JSON.stringify(original.data)),
            };
            const blocks = [...c.blocks];
            blocks.splice(idx + 1, 0, copy);
            return { ...c, blocks };
          }),
        };
      })
    );
  }, [update]);

  const updateBlockData = useCallback((sectionId: string, columnId: string, blockId: string, data: Record<string, unknown>) => {
    update((prev) =>
      prev.map((s) =>
        s.id === sectionId
          ? {
              ...s,
              columns: s.columns.map((c) =>
                c.id === columnId
                  ? {
                      ...c,
                      blocks: c.blocks.map((b) =>
                        b.id === blockId
                          ? { ...b, data: { ...b.data, ...data } }
                          : b
                      ),
                    }
                  : c
              ),
            }
          : s
      ),
      true // debounce text changes
    );
  }, [update]);

  const toggleBlockHidden = useCallback((sectionId: string, columnId: string, blockId: string) => {
    update((prev) =>
      prev.map((s) =>
        s.id === sectionId
          ? {
              ...s,
              columns: s.columns.map((c) =>
                c.id === columnId
                  ? {
                      ...c,
                      blocks: c.blocks.map((b) =>
                        b.id === blockId ? { ...b, hidden: !b.hidden } : b
                      ),
                    }
                  : c
              ),
            }
          : s
      )
    );
  }, [update]);

  const reorderSections = useCallback((fromIndex: number, toIndex: number) => {
    update((prev) => {
      const next = [...prev];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return next;
    });
  }, [update]);

  const reorderBlocksInColumn = useCallback((sectionId: string, columnId: string, fromIndex: number, toIndex: number) => {
    update((prev) =>
      prev.map((s) =>
        s.id === sectionId
          ? {
              ...s,
              columns: s.columns.map((c) => {
                if (c.id !== columnId) return c;
                const blocks = [...c.blocks];
                const [moved] = blocks.splice(fromIndex, 1);
                blocks.splice(toIndex, 0, moved);
                return { ...c, blocks };
              }),
            }
          : s
      )
    );
  }, [update]);

  const reset = useCallback((newSections: Section[]) => {
    setSections(newSections);
    initialRef.current = newSections;
    undoStack.current = [];
    redoStack.current = [];
    setIsDirty(false);
    setHistoryState({ undoLen: 0, redoLen: 0 });
  }, []);

  return {
    sections,
    flatBlocks,
    addSection,
    addSectionPreset,
    removeSection,
    moveSection,
    updateSectionSettings,
    changeLayout,
    addBlock,
    addBlockDirect,
    removeBlock,
    duplicateBlock,
    moveBlock,
    moveBlockDirect,
    updateBlockData,
    toggleBlockHidden,
    reorderSections,
    reorderBlocksInColumn,
    isDirty,
    canUndo: historyState.undoLen > 0,
    canRedo: historyState.redoLen > 0,
    historyLength: historyState.undoLen + historyState.redoLen,
    historyPosition: historyState.redoLen,
    undo,
    redo,
    goToRevision,
    reset,
  };
}
