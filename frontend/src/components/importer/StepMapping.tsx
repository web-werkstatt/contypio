import { ArrowRight, ArrowRightLeft } from 'lucide-react';
import type { PageScrapeResult, BlockData } from './types';

const BLOCK_TYPE_LABELS: Record<string, string> = {
  richText: 'Rich Text',
  hero: 'Hero Banner',
  image: 'Bild',
  gallery: 'Galerie',
  cards: 'Karten',
  cta: 'Call to Action',
  faq: 'FAQ / Accordion',
  newsletter: 'Newsletter',
  heroSlider: 'Hero Slider',
  featuredTrips: 'Ausgewählte Reisen',
  tripListing: 'Reise-Listing',
  trustStrip: 'Trust-Leiste',
  video: 'Video',
  embed: 'Embed',
  map: 'Karte',
  form: 'Formular',
  spacer: 'Abstand',
  tabs: 'Tabs',
  table: 'Tabelle',
  testimonials: 'Kundenstimmen',
  team: 'Team',
  logoSlider: 'Logo-Slider',
  counter: 'Zähler',
  socialLinks: 'Social Links',
};

const ALL_BLOCK_TYPES = Object.keys(BLOCK_TYPE_LABELS);

interface Props {
  pageResults: Record<string, PageScrapeResult>;
  onUpdateMapping(path: string, blockId: string, newType: string): void;
  onNext(): void;
}

export default function StepMapping({ pageResults, onUpdateMapping, onNext }: Props) {
  const donePages = Object.entries(pageResults).filter(([, r]) => r.status === 'done' && r.result);

  // Alle Blöcke sammeln
  const allBlocks: { path: string; block: BlockData; sectionIdx: number }[] = [];
  for (const [path, pr] of donePages) {
    if (!pr.result) continue;
    pr.result.sections.forEach((section, si) => {
      section.columns.forEach((col) => {
        col.blocks.forEach((block) => {
          allBlocks.push({ path, block, sectionIdx: si });
        });
      });
    });
  }

  // Ampel-Logik
  const getStatus = (block: BlockData) => {
    if (block.blockType === 'richText' && !block.data.title) return 'yellow';
    if (['heroSlider', 'featuredTrips', 'tripListing'].includes(block.blockType)) return 'green';
    if (block.blockType === 'richText') return 'green';
    return 'green';
  };

  return (
    <div>
      <h2 className="text-lg font-semibold mb-1">Inhalte zuordnen</h2>
      <p className="text-sm text-[var(--text-muted)] mb-4">
        Prüfen und ändern Sie die automatische Zuordnung der erkannten HTML-Strukturen zu CMS-Block-Typen.
      </p>

      <div className="border border-[var(--border)] rounded-lg overflow-hidden">
        <div className="grid grid-cols-[180px_1fr_40px_200px] gap-0 bg-gray-50 px-3 py-2 text-xs font-medium text-[var(--text-muted)] border-b border-[var(--border)]">
          <span>Seite</span>
          <span>Erkannter Inhalt</span>
          <span />
          <span>CMS Block-Typ</span>
        </div>

        <div className="max-h-[400px] overflow-auto">
          {donePages.map(([path, pr]) => {
            if (!pr.result) return null;
            return pr.result.sections.map((section, si) =>
              section.columns.map((col) =>
                col.blocks.map((block) => {
                  const status = getStatus(block);
                  const override = pr.mappingOverrides?.[block.id];
                  const currentType = override || block.blockType;

                  return (
                    <div
                      key={`${path}-${si}-${block.id}`}
                      className="grid grid-cols-[180px_1fr_40px_200px] gap-0 px-3 py-2 text-sm border-b border-[var(--border)] last:border-b-0 items-center"
                    >
                      <span className="font-mono text-xs text-[var(--text-muted)] truncate">{path}</span>
                      <span className="flex items-center gap-2">
                        <span
                          className={`w-2 h-2 rounded-full shrink-0 ${
                            status === 'green' ? 'bg-green-400' : status === 'yellow' ? 'bg-amber-400' : 'bg-red-400'
                          }`}
                        />
                        <span className="truncate text-xs">
                          {(typeof block.data.title === 'string' && block.data.title) || `${BLOCK_TYPE_LABELS[block.blockType] || block.blockType}`}
                        </span>
                      </span>
                      <span className="flex justify-center">
                        <ArrowRightLeft size={12} className="text-[var(--text-muted)]" />
                      </span>
                      <select
                        value={currentType}
                        onChange={(e) => onUpdateMapping(path, block.id, e.target.value)}
                        className="px-2 py-1 border border-[var(--border)] rounded text-xs"
                      >
                        {ALL_BLOCK_TYPES.map((bt) => (
                          <option key={bt} value={bt}>{BLOCK_TYPE_LABELS[bt]}</option>
                        ))}
                      </select>
                    </div>
                  );
                })
              )
            );
          })}
        </div>
      </div>

      <div className="flex gap-3 mt-4">
        <button
          onClick={onNext}
          className="flex items-center gap-2 px-5 py-2.5 bg-[var(--primary)] text-white rounded-lg text-sm font-medium hover:opacity-90"
        >
          Weiter zur Vorschau <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );
}
