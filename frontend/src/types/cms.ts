export interface User {
  id: string;
  email: string;
  role: string;
  display_name: string | null;
  active: boolean;
}

export interface PageTreeNode {
  id: number;
  title: string;
  slug: string;
  path: string;
  status: string;
  page_type: string;
  sort_order: number;
  updated_at: string | null;
  children: PageTreeNode[];
}

// --- Section Editor Types ---

export type LayoutKey =
  | 'full'
  | 'two-col-equal'
  | 'two-col-left-wide'
  | 'two-col-right-wide'
  | 'three-col-equal'
  | 'four-col-equal'
  | 'custom';

export type BlockType =
  // Content
  | 'hero'
  | 'richText'
  | 'image'
  | 'gallery'
  | 'cards'
  | 'cta'
  | 'faq'
  | 'newsletter'
  // Dynamische Inhalte (generisch)
  | 'featuredItems'
  | 'collectionListing'
  | 'collectionTiles'
  // Travel (Aliase fuer Abwaertskompatibilitaet)
  | 'featuredTrips'
  | 'tripListing'
  | 'destinationTiles'
  | 'inspirationTiles'
  // Marketing
  | 'trustStrip'
  | 'heroSlider'
  // Magazin
  | 'magazineTeaser'
  // L24: Universelle Block-Typen
  | 'video'
  | 'embed'
  | 'map'
  | 'form'
  | 'spacer'
  | 'tabs'
  | 'table'
  | 'testimonials'
  | 'team'
  | 'logoSlider'
  | 'counter'
  | 'socialLinks';

export interface Block {
  id: string;
  blockType: BlockType;
  data: Record<string, unknown>;
  hidden?: boolean;
}

export interface Column {
  id: string;
  blocks: Block[];
}

export interface GridTrackConfig {
  columns: string[];
  rows?: string[];
  gap?: string;
  areas?: string[][];
}

export interface GridConfig {
  label?: string;
  tracks: Record<string, GridTrackConfig>;
  items?: Record<string, Record<string, { col_start: number; col_end: number; row_start: number; row_end: number }>>;
}

export interface Section {
  id: string;
  layout: LayoutKey;
  grid_config?: GridConfig;
  background?: { color?: string; image?: string };
  spacing?: { paddingTop?: string; paddingBottom?: string };
  columns: Column[];
}

export interface Page {
  id: number;
  title: string;
  slug: string;
  path: string;
  page_type: string;
  status: string;
  seo: Record<string, string>;
  hero: Record<string, unknown>;
  sections: Section[];
  collection_key: string | null;
  parent_id: number | null;
  sort_order: number;
  published_at: string | null;
  created_at: string;
  updated_at: string | null;
}

// --- Layout Presets ---

export interface LayoutPreset {
  key: LayoutKey;
  label: string;
  columns: number;
  grid: string;
}

export const LAYOUT_PRESETS: LayoutPreset[] = [
  { key: 'full', label: 'Volle Breite', columns: 1, grid: '1fr' },
  { key: 'two-col-equal', label: '50 / 50', columns: 2, grid: '1fr 1fr' },
  { key: 'two-col-left-wide', label: '2/3 + 1/3', columns: 2, grid: '2fr 1fr' },
  { key: 'two-col-right-wide', label: '1/3 + 2/3', columns: 2, grid: '1fr 2fr' },
  { key: 'three-col-equal', label: '3 Spalten', columns: 3, grid: '1fr 1fr 1fr' },
  { key: 'four-col-equal', label: '4 Spalten', columns: 4, grid: '1fr 1fr 1fr 1fr' },
  { key: 'custom', label: 'Benutzerdefiniert', columns: 0, grid: '' },
];

export function getLayoutPreset(key: LayoutKey, gridConfig?: GridConfig): LayoutPreset {
  if (key === 'custom' && gridConfig?.tracks?.lg) {
    const cols = gridConfig.tracks.lg.columns;
    return {
      key: 'custom',
      label: gridConfig.label || 'Benutzerdefiniert',
      columns: cols.length,
      grid: cols.join(' '),
    };
  }
  return LAYOUT_PRESETS.find((p) => p.key === key) ?? LAYOUT_PRESETS[0];
}

// --- Block Type Registry (mit Kategorien) ---

export type BlockCategory = 'content' | 'data' | 'dynamic' | 'marketing';

export interface BlockCategoryInfo {
  key: BlockCategory;
  label: string;
}

export const BLOCK_CATEGORIES: BlockCategoryInfo[] = [
  { key: 'content', label: 'Inhalt' },
  { key: 'dynamic', label: 'Dynamische Inhalte' },
  { key: 'data', label: 'Branchen-Daten' },
  { key: 'marketing', label: 'Conversion' },
];

export interface BlockTypeInfo {
  type_key: BlockType;
  label: string;
  icon: string;
  category: BlockCategory;
}

export const BLOCK_TYPES: BlockTypeInfo[] = [
  // Content
  { type_key: 'hero', label: 'Hero', icon: 'Image', category: 'content' },
  { type_key: 'richText', label: 'Text', icon: 'Type', category: 'content' },
  { type_key: 'image', label: 'Bild', icon: 'ImageIcon', category: 'content' },
  { type_key: 'gallery', label: 'Galerie', icon: 'LayoutGrid', category: 'content' },
  { type_key: 'cards', label: 'Karten', icon: 'Layers', category: 'content' },
  { type_key: 'cta', label: 'CTA', icon: 'MousePointerClick', category: 'content' },
  { type_key: 'faq', label: 'FAQ', icon: 'HelpCircle', category: 'content' },
  { type_key: 'newsletter', label: 'Newsletter', icon: 'Mail', category: 'content' },
  // Dynamische Inhalte (generisch, Collection-basiert)
  { type_key: 'featuredItems', label: 'Ausgewaehlte Eintraege', icon: 'Star', category: 'dynamic' },
  { type_key: 'collectionListing', label: 'Collection-Listing', icon: 'List', category: 'dynamic' },
  { type_key: 'collectionTiles', label: 'Collection-Kacheln', icon: 'LayoutGrid', category: 'dynamic' },
  // Branchen-spezifisch (Travel-Aliase)
  { type_key: 'featuredTrips', label: 'Ausgewaehlte Reisen', icon: 'Star', category: 'data' },
  { type_key: 'tripListing', label: 'Reise-Listing', icon: 'List', category: 'data' },
  { type_key: 'destinationTiles', label: 'Reiseziel-Kacheln', icon: 'MapPin', category: 'data' },
  { type_key: 'inspirationTiles', label: 'Inspiration-Kacheln', icon: 'Sparkles', category: 'data' },
  { type_key: 'magazineTeaser', label: 'Magazin-Teaser', icon: 'Newspaper', category: 'data' },
  // Marketing
  { type_key: 'trustStrip', label: 'Trust-Leiste', icon: 'Shield', category: 'marketing' },
  { type_key: 'heroSlider', label: 'Hero Slider', icon: 'GalleryHorizontal', category: 'marketing' },
  // L24: Universelle Block-Typen
  { type_key: 'video', label: 'Video', icon: 'Play', category: 'content' },
  { type_key: 'embed', label: 'Embed', icon: 'Code', category: 'content' },
  { type_key: 'map', label: 'Karte', icon: 'MapPin', category: 'content' },
  { type_key: 'form', label: 'Formular', icon: 'FileInput', category: 'content' },
  { type_key: 'spacer', label: 'Abstand', icon: 'Minus', category: 'content' },
  { type_key: 'tabs', label: 'Tabs', icon: 'PanelTop', category: 'content' },
  { type_key: 'table', label: 'Tabelle', icon: 'Table', category: 'data' },
  { type_key: 'testimonials', label: 'Kundenstimmen', icon: 'Quote', category: 'marketing' },
  { type_key: 'team', label: 'Team', icon: 'Users', category: 'content' },
  { type_key: 'logoSlider', label: 'Logo-Slider', icon: 'GalleryHorizontal', category: 'marketing' },
  { type_key: 'counter', label: 'Zähler', icon: 'Hash', category: 'data' },
  { type_key: 'socialLinks', label: 'Social Links', icon: 'Share2', category: 'content' },
];

// --- Page Types (fuer Assembly Wizard) ---

export interface PageTypeInfo {
  key: string;
  label: string;
  description: string;
  icon: string;
}

export interface PresetStyleInfo {
  key: string;
  label: string;
  description: string;
}

// --- Collections + Globals ---

export interface FieldDef {
  name: string;
  label: string;
  required?: boolean;
  render: string;
  config: Record<string, unknown>;
  type?: string;
  list_visible?: boolean;
  options?: string[];
  fields?: FieldDef[];
  minItems?: number;
  maxItems?: number;
}

export interface FieldTypePreset {
  id: number;
  type_key: string;
  label: string;
  category: string;
  render: string;
  config: Record<string, unknown>;
  has_options: boolean;
  has_sub_fields: boolean;
  list_visible: boolean;
  sort_order: number;
}

export interface CollectionSchema {
  id: number;
  collection_key: string;
  label: string;
  label_singular: string;
  icon: string;
  fields: FieldDef[];
  slug_field: string | null;
  title_field: string;
  sort_field: string;
  item_count: number;
  created_at: string;
}

export interface CollectionItem {
  id: number;
  collection_key: string;
  slug: string | null;
  title: string;
  data: Record<string, unknown>;
  status: string;
  sort_order: number;
  image_id: number | null;
  created_at: string;
  updated_at: string | null;
  deleted_at: string | null;
}

export interface GlobalConfig {
  id: number;
  slug: string;
  label: string;
  data: Record<string, unknown>;
  updated_at: string | null;
}

// --- Tenant (White-Label) ---

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  domain: string | null;
  logo_url: string | null;
  primary_color: string | null;
  accent_color: string | null;
  favicon_url: string | null;
  active: boolean;
  created_at: string;
}

export interface TenantBranding {
  name: string;
  logo_url: string | null;
  primary_color: string;
  accent_color: string | null;
  favicon_url: string | null;
}

// --- Onboarding ---

export type IndustryPreset = 'travel' | 'agency' | 'neutral';

export interface OnboardingData {
  name: string;
  domain: string;
  industry: IndustryPreset;
  admin_email: string;
  admin_password: string;
  admin_name: string;
}
