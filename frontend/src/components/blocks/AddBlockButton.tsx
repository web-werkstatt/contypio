import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  Plus, Image, Type, LayoutGrid, Layers, MousePointerClick, HelpCircle, Mail,
  Star, List, MapPin, Sparkles, Shield, GalleryHorizontal, Newspaper,
  Play, Code, FileInput, Minus, PanelTop, Table, Quote, Users, Hash, Share2, Lock,
} from 'lucide-react';
import { BLOCK_TYPES, BLOCK_CATEGORIES, type BlockType } from '@/types/cms';

const ICON_MAP: Record<string, React.ComponentType<{ size?: number }>> = {
  Image,
  Type,
  ImageIcon: Image,
  LayoutGrid,
  Layers,
  MousePointerClick,
  HelpCircle,
  Mail,
  Star,
  List,
  MapPin,
  Sparkles,
  Shield,
  GalleryHorizontal,
  Newspaper,
  Play,
  Code,
  FileInput,
  Minus,
  PanelTop,
  Table,
  Quote,
  Users,
  Hash,
  Share2,
};


interface Props {
  onAdd(blockType: BlockType): void;
  /** Inline-Modus: nur Linie + Hover-Icon (WordPress-Style) */
  inline?: boolean;
  /** Label für den permanenten Button (nur wenn inline=false) */
  label?: string;
  /** Gesperrte Block-Typen (Modul nicht aktiv) */
  gatedBlocks?: Set<string>;
}

export default function AddBlockButton({ onAdd, inline, label, gatedBlocks }: Props) {
  const [open, setOpen] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [pickerPos, setPickerPos] = useState<{ top: number; left: number } | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const pickerRef = useRef<HTMLDivElement>(null);

  // Position des Pickers berechnen (relativ zum Button)
  const updatePickerPos = useCallback(() => {
    if (!btnRef.current) return;
    const rect = btnRef.current.getBoundingClientRect();
    const pickerWidth = 288; // w-72 = 18rem = 288px
    let left = rect.left + rect.width / 2 - pickerWidth / 2;
    // Nicht über den rechten Rand hinaus
    if (left + pickerWidth > window.innerWidth - 8) left = window.innerWidth - pickerWidth - 8;
    if (left < 8) left = 8;
    setPickerPos({ top: rect.bottom + 4, left });
  }, []);

  useEffect(() => {
    if (!open) return;
    updatePickerPos();
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        ref.current && !ref.current.contains(target) &&
        pickerRef.current && !pickerRef.current.contains(target)
      ) {
        setOpen(false);
        setHovered(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open, updatePickerPos]);

  const pickerContent = (
    <div className="py-1">
      {BLOCK_CATEGORIES.map((cat) => {
        const blocks = BLOCK_TYPES.filter((bt) => bt.category === cat.key);
        if (blocks.length === 0) return null;
        return (
          <div key={cat.key}>
            <div className="px-3 py-1.5 text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider bg-gray-50 border-b border-[var(--border)]">
              {cat.label}
            </div>
            <div className="grid grid-cols-2 gap-0.5 p-1.5">
              {blocks.map((bt) => {
                const Icon = ICON_MAP[bt.icon] ?? Type;
                const isGated = gatedBlocks?.has(bt.type_key) ?? false;
                return (
                  <button
                    key={bt.type_key}
                    onClick={() => {
                      if (isGated) return;
                      onAdd(bt.type_key);
                      setOpen(false);
                      setHovered(false);
                    }}
                    disabled={isGated}
                    title={isGated ? 'Upgrade auf Starter+ erforderlich' : bt.label}
                    className={`flex items-center gap-2 px-2.5 py-2 text-xs rounded-md transition-colors text-left ${
                      isGated
                        ? 'opacity-40 cursor-not-allowed'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    {isGated ? <Lock size={14} /> : <Icon size={14} />}
                    {bt.label}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );

  // Portal-Picker: wird direkt in body gerendert, nicht im overflow-Container
  const portalPicker = open && pickerPos && createPortal(
    <div
      ref={pickerRef}
      className="fixed z-50 bg-white rounded-lg border border-[var(--border)] shadow-lg w-72 max-h-80 overflow-auto"
      style={{ top: pickerPos.top, left: pickerPos.left }}
    >
      {pickerContent}
    </div>,
    document.body,
  );

  // --- Inline-Modus: WordPress-Style Hover-Inserter ---
  if (inline) {
    return (
      <>
        <div
          ref={ref}
          className="relative flex items-center group/inserter py-0.5"
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => { if (!open) setHovered(false); }}
        >
          {/* Linie links */}
          <div className={`flex-1 h-px transition-colors duration-150 ${hovered || open ? 'bg-[var(--primary)]' : 'bg-transparent'}`} />

          {/* + Button */}
          <button
            ref={btnRef}
            onClick={() => setOpen(!open)}
            className={`flex items-center justify-center w-6 h-6 rounded-full border transition-all duration-150 ${
              open
                ? 'bg-[var(--primary)] border-[var(--primary)] text-white scale-110'
                : hovered
                  ? 'bg-white border-[var(--primary)] text-[var(--primary)] scale-100'
                  : 'bg-transparent border-transparent text-transparent scale-75'
            }`}
            title="Block hinzufügen"
          >
            <Plus size={14} strokeWidth={2.5} />
          </button>

          {/* Linie rechts */}
          <div className={`flex-1 h-px transition-colors duration-150 ${hovered || open ? 'bg-[var(--primary)]' : 'bg-transparent'}`} />
        </div>
        {portalPicker}
      </>
    );
  }

  // --- Standard-Modus: permanenter Button (für leere Zustände, ColumnDropZone etc.) ---
  const displayLabel = label || 'Inhaltselement hinzufügen';

  return (
    <>
      <div className="relative" ref={ref}>
        <button
          ref={btnRef}
          onClick={() => setOpen(!open)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-[var(--text-muted)] border border-dashed border-gray-300 rounded-md hover:border-[var(--primary)] hover:text-[var(--primary)] transition-colors w-full justify-center"
        >
          <Plus size={12} /> {displayLabel}
        </button>
      </div>
      {portalPicker}
    </>
  );
}
