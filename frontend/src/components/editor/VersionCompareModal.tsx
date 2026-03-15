import { X, RotateCcw, ArrowRight } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import type { Section, Block } from '@/types/cms';
import { BLOCK_TYPES } from '@/types/cms';

interface VersionDetail {
  id: number;
  page_id: number;
  version_number: number;
  title: string;
  slug: string;
  status: string;
  seo: Record<string, string>;
  sections: Section[];
  change_summary: string | null;
  created_at: string;
}

interface DiffItem {
  field: string;
  type: 'changed' | 'added' | 'removed';
  oldValue?: string;
  newValue?: string;
}

interface Props {
  pageId: number;
  versionId: number;
  currentTitle: string;
  currentSections: Section[];
  currentSeo: { title: string; description: string };
  onRestore: (versionId: number) => void;
  onClose: () => void;
}

function getBlockLabel(blockType: string): string {
  return BLOCK_TYPES.find((bt) => bt.type_key === blockType)?.label ?? blockType;
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').trim();
}

function getBlockTitle(block: Block): string {
  const d = block.data;
  const title = (d.title ?? d.heading ?? d.headline ?? d.label) as string | undefined;
  return title || getBlockLabel(block.blockType);
}

function getBlockContent(block: Block): string {
  const d = block.data;
  if (typeof d.content === 'string') return stripHtml(d.content);
  if (typeof d.html === 'string') return stripHtml(d.html);
  return '';
}

function computeDetailedDiff(
  current: { title: string; seo: { title: string; description: string }; sections: Section[] },
  version: VersionDetail,
): DiffItem[] {
  const diffs: DiffItem[] = [];

  // Page title
  if (current.title !== version.title) {
    diffs.push({ field: 'Seitentitel', type: 'changed', oldValue: version.title, newValue: current.title });
  }

  // SEO
  if ((current.seo.title || '') !== (version.seo?.title || '')) {
    diffs.push({ field: 'SEO Titel', type: 'changed', oldValue: version.seo?.title || '(leer)', newValue: current.seo.title || '(leer)' });
  }
  if ((current.seo.description || '') !== (version.seo?.description || '')) {
    diffs.push({ field: 'SEO Description', type: 'changed', oldValue: version.seo?.description || '(leer)', newValue: current.seo.description || '(leer)' });
  }

  // Blocks comparison
  const currentBlocks = current.sections.flatMap((s) => s.columns.flatMap((c) => c.blocks));
  const versionBlocks = (version.sections || []).flatMap((s: Section) => s.columns.flatMap((c) => c.blocks));

  const currentIds = new Set(currentBlocks.map((b) => b.id));
  const versionIds = new Set(versionBlocks.map((b) => b.id));
  const versionMap = new Map(versionBlocks.map((b) => [b.id, b]));

  // Added blocks
  currentBlocks.filter((b) => !versionIds.has(b.id)).forEach((b) => {
    const content = getBlockContent(b);
    diffs.push({
      field: `Neuer Block: ${getBlockTitle(b)}`,
      type: 'added',
      newValue: content || '(kein Textinhalt)',
    });
  });

  // Removed blocks
  versionBlocks.filter((b: Block) => !currentIds.has(b.id)).forEach((b: Block) => {
    const content = getBlockContent(b);
    diffs.push({
      field: `Entfernter Block: ${getBlockTitle(b)}`,
      type: 'removed',
      oldValue: content || '(kein Textinhalt)',
    });
  });

  // Changed blocks - show each changed field separately
  currentBlocks.filter((b) => versionIds.has(b.id)).forEach((b) => {
    const old = versionMap.get(b.id);
    if (!old || JSON.stringify(old.data) === JSON.stringify(b.data)) return;

    const blockName = getBlockTitle(b);

    // Compare title field
    const oldTitle = (old.data.title as string) || '';
    const newTitle = (b.data.title as string) || '';
    if (oldTitle !== newTitle) {
      diffs.push({
        field: `${blockName} - Titel`,
        type: 'changed',
        oldValue: oldTitle || '(leer)',
        newValue: newTitle || '(leer)',
      });
    }

    // Compare content/html field
    const oldContent = typeof old.data.content === 'string' ? old.data.content : (typeof old.data.html === 'string' ? old.data.html : '');
    const newContent = typeof b.data.content === 'string' ? b.data.content : (typeof b.data.html === 'string' ? b.data.html : '');
    if (oldContent !== newContent) {
      diffs.push({
        field: `${blockName} - Inhalt`,
        type: 'changed',
        oldValue: stripHtml(oldContent) || '(leer)',
        newValue: stripHtml(newContent) || '(leer)',
      });
    }

    // Compare other data fields (non-title, non-content)
    const skipKeys = new Set(['title', 'heading', 'headline', 'label', 'content', 'html']);
    const allKeys = new Set([...Object.keys(old.data), ...Object.keys(b.data)]);
    for (const key of allKeys) {
      if (skipKeys.has(key)) continue;
      const oldVal = JSON.stringify(old.data[key] ?? '');
      const newVal = JSON.stringify(b.data[key] ?? '');
      if (oldVal !== newVal) {
        diffs.push({
          field: `${blockName} - ${key}`,
          type: 'changed',
          oldValue: typeof old.data[key] === 'string' ? (old.data[key] as string) : oldVal,
          newValue: typeof b.data[key] === 'string' ? (b.data[key] as string) : newVal,
        });
      }
    }
  });

  // Section layout changes
  const minLen = Math.min(current.sections.length, (version.sections || []).length);
  for (let i = 0; i < minLen; i++) {
    if (current.sections[i].layout !== version.sections[i].layout) {
      diffs.push({
        field: `Sektion ${i + 1} Layout`,
        type: 'changed',
        oldValue: version.sections[i].layout,
        newValue: current.sections[i].layout,
      });
    }
    const curBg = current.sections[i].background?.color || '';
    const verBg = version.sections[i].background?.color || '';
    if (curBg !== verBg) {
      diffs.push({
        field: `Sektion ${i + 1} Hintergrund`,
        type: 'changed',
        oldValue: verBg || '(kein)',
        newValue: curBg || '(kein)',
      });
    }
  }

  if (current.sections.length !== (version.sections || []).length) {
    const diff = current.sections.length - (version.sections || []).length;
    if (diff > 0) {
      diffs.push({ field: 'Sektionen', type: 'added', newValue: `${diff} hinzugefuegt` });
    } else {
      diffs.push({ field: 'Sektionen', type: 'removed', oldValue: `${Math.abs(diff)} entfernt` });
    }
  }

  return diffs;
}

const DIFF_COLORS = {
  changed: { bg: 'bg-blue-50', border: 'border-blue-200', badge: 'bg-blue-100 text-blue-700', icon: '~' },
  added: { bg: 'bg-green-50', border: 'border-green-200', badge: 'bg-green-100 text-green-700', icon: '+' },
  removed: { bg: 'bg-red-50', border: 'border-red-200', badge: 'bg-red-100 text-red-700', icon: '-' },
};

export default function VersionCompareModal({ pageId, versionId, currentTitle, currentSections, currentSeo, onRestore, onClose }: Props) {
  const { data: version, isLoading } = useQuery<VersionDetail>({
    queryKey: ['pageVersion', pageId, versionId],
    queryFn: async () => (await api.get(`/api/pages/${pageId}/versions/${versionId}`)).data,
  });

  if (isLoading || !version) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
        <div className="bg-white rounded-xl shadow-2xl p-8" onClick={(e) => e.stopPropagation()}>
          <div className="text-sm text-[var(--text-muted)]">Version laden...</div>
        </div>
      </div>
    );
  }

  const diffs = computeDetailedDiff(
    { title: currentTitle, seo: currentSeo, sections: currentSections },
    version,
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="bg-white rounded-xl shadow-2xl w-[780px] max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-[var(--border)]">
          <div>
            <h2 className="text-sm font-semibold">Versionsvergleich</h2>
            <p className="text-[10px] text-[var(--text-muted)] mt-0.5">
              Aktuell vs. Version {version.version_number} vom{' '}
              {new Date(version.created_at).toLocaleDateString('de-DE', {
                day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
              })}
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded hover:bg-gray-100 transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Diff List */}
        <div className="flex-1 overflow-auto p-5 space-y-3">
          {diffs.length === 0 ? (
            <div className="text-center py-12 text-[var(--text-muted)]">
              <p className="text-sm font-medium">Keine Unterschiede</p>
              <p className="text-xs mt-1">Der aktuelle Stand ist identisch mit dieser Version.</p>
            </div>
          ) : (
            <>
              <div className="text-xs text-[var(--text-muted)] mb-3">
                {diffs.length} {diffs.length === 1 ? 'Unterschied' : 'Unterschiede'} gefunden
              </div>
              {diffs.map((d, i) => {
                const colors = DIFF_COLORS[d.type];
                return (
                  <div key={i} className={`${colors.bg} border ${colors.border} rounded-lg px-4 py-3`}>
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${colors.badge}`}>
                        {colors.icon}
                      </span>
                      <span className="text-xs font-semibold">{d.field}</span>
                    </div>
                    {d.type === 'changed' && (
                      <div className="grid grid-cols-[1fr_auto_1fr] gap-2 items-stretch">
                        <div className="text-xs bg-white/80 rounded px-3 py-2 border border-red-100 min-h-[3rem]">
                          <div className="text-[10px] text-red-500 font-medium mb-1">Version {version.version_number}</div>
                          <div className="text-[var(--text)] break-words whitespace-pre-wrap">{d.oldValue}</div>
                        </div>
                        <div className="flex items-center">
                          <ArrowRight size={12} className="text-[var(--text-muted)] shrink-0" />
                        </div>
                        <div className="text-xs bg-white/80 rounded px-3 py-2 border border-green-100 min-h-[3rem]">
                          <div className="text-[10px] text-green-600 font-medium mb-1">Aktuell</div>
                          <div className="text-[var(--text)] break-words whitespace-pre-wrap">{d.newValue}</div>
                        </div>
                      </div>
                    )}
                    {d.type === 'added' && d.newValue && (
                      <div className="text-xs text-green-800 bg-white/60 rounded px-3 py-2 border border-green-100 ml-6 whitespace-pre-wrap">{d.newValue}</div>
                    )}
                    {d.type === 'removed' && d.oldValue && (
                      <div className="text-xs text-red-800 bg-white/60 rounded px-3 py-2 border border-red-100 ml-6 whitespace-pre-wrap">{d.oldValue}</div>
                    )}
                  </div>
                );
              })}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-[var(--border)] bg-gray-50 rounded-b-xl">
          <button onClick={onClose} className="px-4 py-2 text-xs text-[var(--text-muted)] hover:text-[var(--text)] transition-colors">
            Schließen
          </button>
          <button
            onClick={() => {
              if (confirm(`Seite auf Version ${version.version_number} zuruecksetzen? Der aktuelle Stand wird vorher gesichert.`))
                onRestore(version.id);
            }}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium bg-[var(--primary)] text-white rounded-md hover:bg-[var(--primary-dark)] transition-colors"
          >
            <RotateCcw size={12} />
            Version {version.version_number} wiederherstellen
          </button>
        </div>
      </div>
    </div>
  );
}
