import { useState } from 'react';
import { ChevronDown, ChevronUp, ArrowUp, ArrowDown, Settings, Trash2, Columns, Palette, Space } from 'lucide-react';
import type { Section, LayoutKey, BlockType, GridConfig } from '@/types/cms';
import { getLayoutPreset } from '@/types/cms';
import ColumnDropZone from './ColumnDropZone';
import SectionLayoutPicker from './SectionLayoutPicker';

interface Props {
  section: Section;
  isFirst: boolean;
  isLast: boolean;
  onMove(direction: 'up' | 'down'): void;
  onRemove(): void;
  onChangeLayout(layout: LayoutKey, gridConfig?: GridConfig): void;
  onUpdateSettings(updates: Partial<Pick<Section, 'background' | 'spacing'>>): void;
  onAddBlock(columnId: string, blockType: BlockType): void;
  onRemoveBlock(columnId: string, blockId: string): void;
  onMoveBlock(columnId: string, blockId: string, direction: 'up' | 'down'): void;
  onUpdateBlockData(columnId: string, blockId: string, data: Record<string, unknown>): void;
  selectedBlockId?: string;
  onSelectBlock?(columnId: string, blockId: string): void;
}

const SPACING_OPTIONS = [
  { value: '', label: 'Standard' },
  { value: '0', label: 'Kein' },
  { value: '1rem', label: 'Klein' },
  { value: '2rem', label: 'Mittel' },
  { value: '4rem', label: 'Gross' },
];

const BG_COLORS = [
  { value: '', label: 'Kein', swatch: 'bg-white border' },
  { value: '#f9fafb', label: 'Grau', swatch: 'bg-gray-50' },
  { value: '#eff6ff', label: 'Blau', swatch: 'bg-blue-50' },
  { value: '#f0fdf4', label: 'Gruen', swatch: 'bg-green-50' },
  { value: '#fefce8', label: 'Gelb', swatch: 'bg-yellow-50' },
  { value: '#fdf2f8', label: 'Rosa', swatch: 'bg-pink-50' },
];

export default function SectionItem({
  section, isFirst, isLast, onMove, onRemove, onChangeLayout,
  onUpdateSettings, onAddBlock, onRemoveBlock, onMoveBlock, onUpdateBlockData,
  selectedBlockId, onSelectBlock,
}: Props) {
  const [collapsed, setCollapsed] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const preset = getLayoutPreset(section.layout, section.grid_config);
  const blockCount = section.columns.reduce((sum, c) => sum + c.blocks.length, 0);

  return (
    <div className="rounded-lg bg-white shadow-sm" data-section-id={section.id}>
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-gray-50/80 rounded-t-lg">
        <div className="flex items-center gap-2">
          <Columns size={14} className="text-[var(--text-muted)]" />
          <span className="text-sm font-medium text-[var(--text)]">
            Layout-Gruppe: {preset.label}
          </span>
          {blockCount > 0 && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-200 text-gray-600">
              {blockCount} {blockCount === 1 ? 'Element' : 'Elemente'}
            </span>
          )}
        </div>
        <div className="flex items-center gap-0.5">
          <button onClick={() => onMove('up')} disabled={isFirst} className="p-1 rounded hover:bg-gray-200 disabled:opacity-30 transition-colors" title="Nach oben">
            <ArrowUp size={14} />
          </button>
          <button onClick={() => onMove('down')} disabled={isLast} className="p-1 rounded hover:bg-gray-200 disabled:opacity-30 transition-colors" title="Nach unten">
            <ArrowDown size={14} />
          </button>
          <div className="relative">
            <button onClick={() => setShowSettings(!showSettings)} className="p-1 rounded hover:bg-gray-200 transition-colors" title="Layout ändern">
              <Settings size={14} />
            </button>
            {showSettings && (
              <div className="absolute top-full right-0 z-20 mt-1 bg-white rounded-lg shadow-lg w-72">
                <div className="px-3 py-2 text-xs font-medium text-[var(--text-muted)]">Spalten-Layout</div>
                <SectionLayoutPicker
                  current={section.layout}
                  currentGridConfig={section.grid_config}
                  onSelect={(layout, gridConfig) => {
                    onChangeLayout(layout, gridConfig);
                  }}
                />
                {/* Background */}
                <div className="px-3 py-2">
                  <div className="flex items-center gap-1.5 text-xs font-medium text-[var(--text-muted)] mb-2">
                    <Palette size={12} /> Hintergrundfarbe
                  </div>
                  <div className="flex gap-1.5 flex-wrap">
                    {BG_COLORS.map((c) => (
                      <button
                        key={c.value}
                        onClick={() => onUpdateSettings({ background: c.value ? { color: c.value } : undefined })}
                        className={`w-6 h-6 rounded-md ${c.swatch} transition-all ${
                          (section.background?.color || '') === c.value ? 'ring-2 ring-[var(--primary)] ring-offset-1' : 'hover:ring-1 hover:ring-gray-300'
                        }`}
                        title={c.label}
                      />
                    ))}
                  </div>
                </div>
                {/* Spacing */}
                <div className="px-3 py-2">
                  <div className="flex items-center gap-1.5 text-xs font-medium text-[var(--text-muted)] mb-2">
                    <Space size={12} /> Abstand
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-[var(--text-muted)]">Oben</label>
                      <select
                        value={section.spacing?.paddingTop || ''}
                        onChange={(e) => onUpdateSettings({ spacing: { ...section.spacing, paddingTop: e.target.value || undefined } })}
                        className="w-full text-xs px-2 py-1 border border-[var(--border)] rounded"
                      >
                        {SPACING_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] text-[var(--text-muted)]">Unten</label>
                      <select
                        value={section.spacing?.paddingBottom || ''}
                        onChange={(e) => onUpdateSettings({ spacing: { ...section.spacing, paddingBottom: e.target.value || undefined } })}
                        className="w-full text-xs px-2 py-1 border border-[var(--border)] rounded"
                      >
                        {SPACING_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
          <button onClick={() => { if (confirm('Layout-Gruppe wirklich löschen?')) onRemove(); }} className="p-1 rounded hover:bg-red-100 text-[var(--danger)] transition-colors" title="Löschen">
            <Trash2 size={14} />
          </button>
          <button onClick={() => setCollapsed(!collapsed)} className="p-1 rounded hover:bg-gray-200 transition-colors">
            {collapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
          </button>
        </div>
      </div>

      {/* Body */}
      {!collapsed && (
        <div
          className="p-3 grid gap-3"
          style={{ gridTemplateColumns: preset.grid }}
        >
          {section.columns.map((col) => (
            <ColumnDropZone
              key={col.id}
              column={col}
              sectionId={section.id}
              onAddBlock={(blockType) => onAddBlock(col.id, blockType)}
              onRemoveBlock={(blockId) => onRemoveBlock(col.id, blockId)}
              onMoveBlock={(blockId, dir) => onMoveBlock(col.id, blockId, dir)}
              onUpdateBlockData={(blockId, data) => onUpdateBlockData(col.id, blockId, data)}
              selectedBlockId={selectedBlockId}
              onSelectBlock={onSelectBlock ? (blockId) => onSelectBlock(col.id, blockId) : undefined}
            />
          ))}
        </div>
      )}
    </div>
  );
}
