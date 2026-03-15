import { nanoid } from 'nanoid';
import type { Section, Column, Block, LayoutKey, BlockType } from '@/types/cms';

export type PresetCategory = 'content' | 'data' | 'marketing';

export interface SectionPreset {
  key: string;
  label: string;
  description: string;
  icon: string;
  category: PresetCategory;
  build: () => Section;
}

const CATEGORY_LABELS: Record<PresetCategory, string> = {
  content: 'Inhalt',
  data: 'Dynamische Inhalte',
  marketing: 'Conversion',
};

export { CATEGORY_LABELS };

function makeId(prefix: string): string {
  return `${prefix}_${nanoid(8)}`;
}

function makeBlock(blockType: BlockType, data: Record<string, unknown> = {}): Block {
  return { id: makeId('blk'), blockType, data };
}

function makeColumn(blocks: Block[] = []): Column {
  return { id: makeId('col'), blocks };
}

function makeSection(layout: LayoutKey, columns: Column[]): Section {
  return { id: makeId('sec'), layout, columns };
}

function buildFullSection(blockType: BlockType, data: Record<string, unknown> = {}): Section {
  return makeSection('full', [makeColumn([makeBlock(blockType, data)])]);
}

export const SECTION_PRESETS: SectionPreset[] = [
  // --- Content ---
  {
    key: 'hero-standard',
    label: 'Hero Section',
    description: 'Vollbild-Hero mit Titel und Call-to-Action',
    icon: 'Image',
    category: 'content',
    build: () => buildFullSection('hero'),
  },
  {
    key: 'text-image',
    label: 'Text + Bild',
    description: 'Zweispaltiges Layout mit Text links, Bild rechts',
    icon: 'Columns',
    category: 'content',
    build: () =>
      makeSection('two-col-left-wide', [
        makeColumn([makeBlock('richText')]),
        makeColumn([makeBlock('image')]),
      ]),
  },
  {
    key: 'faq-section',
    label: 'FAQ Bereich',
    description: 'Frage-Antwort Akkordeon',
    icon: 'HelpCircle',
    category: 'content',
    build: () => buildFullSection('faq'),
  },
  {
    key: 'cards-grid',
    label: 'Karten-Grid',
    description: '3 Karten nebeneinander',
    icon: 'Layers',
    category: 'content',
    build: () =>
      makeSection('three-col-equal', [
        makeColumn([makeBlock('cards')]),
        makeColumn([makeBlock('cards')]),
        makeColumn([makeBlock('cards')]),
      ]),
  },

  // --- Daten & Listen ---
  {
    key: 'featured-items',
    label: 'Ausgewaehlte Eintraege',
    description: 'Highlights mit Auto-Fill',
    icon: 'Star',
    category: 'data',
    build: () =>
      buildFullSection('featuredTrips', {
        headline: 'Unsere Empfehlungen',
        maxItems: 6,
      }),
  },
  {
    key: 'item-listing',
    label: 'Listing',
    description: 'Gefilterte Uebersicht',
    icon: 'List',
    category: 'data',
    build: () => buildFullSection('tripListing'),
  },
  {
    key: 'topic-grid',
    label: 'Themen-Kacheln',
    description: 'Themen als Kacheln',
    icon: 'MapPin',
    category: 'data',
    build: () => buildFullSection('destinationTiles'),
  },

  // --- Marketing ---
  {
    key: 'trust-section',
    label: 'Trust-Leiste',
    description: 'Auszeichnungen und Vertrauens-Siegel',
    icon: 'Shield',
    category: 'marketing',
    build: () => buildFullSection('trustStrip'),
  },
  {
    key: 'newsletter',
    label: 'Newsletter',
    description: 'E-Mail Anmeldeformular',
    icon: 'Mail',
    category: 'marketing',
    build: () =>
      buildFullSection('newsletter', {
        headline: 'Newsletter abonnieren',
        description: 'Neuigkeiten direkt in Ihr Postfach',
      }),
  },
  {
    key: 'cta-section',
    label: 'Call-to-Action',
    description: 'Aufforderung zum Handeln mit Button',
    icon: 'MousePointerClick',
    category: 'marketing',
    build: () => buildFullSection('cta'),
  },
];
