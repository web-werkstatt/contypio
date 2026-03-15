import { useState, useRef, useEffect } from 'react';
import { Plus, Image, Columns, HelpCircle, Layers, Star, List, MapPin, Shield, Mail, MousePointerClick } from 'lucide-react';
import SectionLayoutPicker from './SectionLayoutPicker';
import { SECTION_PRESETS, CATEGORY_LABELS, type SectionPreset, type PresetCategory } from '@/lib/sectionPresets';
import type { LayoutKey, Section } from '@/types/cms';

const ICON_MAP: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  Image,
  Columns,
  HelpCircle,
  Layers,
  Star,
  List,
  MapPin,
  Shield,
  Mail,
  MousePointerClick,
};

interface Props {
  onAdd(layout: LayoutKey): void;
  onAddPreset(section: Section): void;
  variant?: 'default' | 'compact';
}

type TabKey = 'preset' | 'layout';

const CATEGORY_ORDER: PresetCategory[] = ['content', 'data', 'marketing'];

export default function AddSectionButton({ onAdd, onAddPreset, variant = 'default' }: Props) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<TabKey>('preset');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const handlePresetClick = (preset: SectionPreset) => {
    onAddPreset(preset.build());
    setOpen(false);
  };

  const groupedPresets = CATEGORY_ORDER.map((cat) => ({
    category: cat,
    label: CATEGORY_LABELS[cat],
    presets: SECTION_PRESETS.filter((p) => p.category === cat),
  })).filter((g) => g.presets.length > 0);

  if (variant === 'compact') {
    return (
      <div className="relative" ref={ref}>
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center gap-1.5 text-xs text-[var(--text-muted)] hover:text-[var(--primary)] transition-colors"
        >
          <Columns size={12} /> Layout-Gruppe hinzufuegen (mehrere Spalten)
        </button>

        {open && (
          <div className="absolute bottom-full left-0 z-20 mb-1 bg-white rounded-lg border border-[var(--border)] shadow-lg w-72">
            <div className="px-3 py-2 text-xs font-medium text-[var(--text-muted)] border-b border-[var(--border)]">
              Spalten-Layout waehlen
            </div>
            <SectionLayoutPicker
              onSelect={(layout) => {
                onAdd(layout);
                setOpen(false);
              }}
            />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="relative flex items-center group py-1" ref={ref}>
      <div className="flex-1 h-px bg-transparent group-hover:bg-gray-200 transition-colors" />
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-center w-6 h-6 rounded-full border border-dashed border-gray-300 text-gray-400 hover:border-[var(--primary)] hover:text-[var(--primary)] hover:bg-[var(--primary)]/5 transition-colors"
      >
        <Plus size={14} />
      </button>
      <div className="flex-1 h-px bg-transparent group-hover:bg-gray-200 transition-colors" />

      {open && (
        <div className="absolute top-full left-1/2 -translate-x-1/2 z-20 mt-1 bg-white rounded-lg border border-[var(--border)] shadow-lg w-80">
          {/* Tabs */}
          <div className="flex border-b border-[var(--border)]">
            <button
              onClick={() => setTab('preset')}
              className={`flex-1 px-3 py-2 text-xs font-medium transition-colors ${
                tab === 'preset'
                  ? 'text-[var(--primary)] border-b-2 border-[var(--primary)]'
                  : 'text-[var(--text-muted)] hover:text-[var(--text)]'
              }`}
            >
              Vorlage
            </button>
            <button
              onClick={() => setTab('layout')}
              className={`flex-1 px-3 py-2 text-xs font-medium transition-colors ${
                tab === 'layout'
                  ? 'text-[var(--primary)] border-b-2 border-[var(--primary)]'
                  : 'text-[var(--text-muted)] hover:text-[var(--text)]'
              }`}
            >
              Layout-Gruppe
            </button>
          </div>

          {/* Tab Content */}
          {tab === 'preset' ? (
            <div className="max-h-80 overflow-y-auto">
              {groupedPresets.map((group) => (
                <div key={group.category}>
                  <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)] bg-gray-50">
                    {group.label}
                  </div>
                  {group.presets.map((preset) => {
                    const IconComp = ICON_MAP[preset.icon];
                    return (
                      <button
                        key={preset.key}
                        onClick={() => handlePresetClick(preset)}
                        className="w-full flex items-start gap-2.5 px-3 py-2 hover:bg-gray-50 transition-colors text-left"
                      >
                        <div className="mt-0.5 text-[var(--text-muted)]">
                          {IconComp ? <IconComp size={14} /> : null}
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-medium text-[var(--text)]">{preset.label}</div>
                          <div className="text-[10px] text-[var(--text-muted)] leading-tight">{preset.description}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          ) : (
            <>
              <div className="px-3 py-2 text-xs font-medium text-[var(--text-muted)] border-b border-[var(--border)]">
                Spalten-Layout waehlen
              </div>
              <SectionLayoutPicker
                onSelect={(layout) => {
                  onAdd(layout);
                  setOpen(false);
                }}
              />
            </>
          )}
        </div>
      )}
    </div>
  );
}
