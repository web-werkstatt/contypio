/** Shared Types für den Website Importer Wizard */

export type ImportStep = 'source' | 'analysis' | 'mapping' | 'preview' | 'import' | 'result';

export const STEPS: { key: ImportStep; label: string; number: number; optional?: boolean }[] = [
  { key: 'source', label: 'Quelle verbinden', number: 1 },
  { key: 'analysis', label: 'Seiten analysieren', number: 2 },
  { key: 'mapping', label: 'Zuordnung anpassen', number: 3, optional: true },
  { key: 'preview', label: 'Vorschau prüfen', number: 3 },
  { key: 'import', label: 'Import starten', number: 4 },
  { key: 'result', label: 'Ergebnis', number: 5 },
];

export interface ScrapeResult {
  url: string;
  html_length: number;
  sections: SectionData[];
  block_counts: Record<string, number>;
  section_count: number;
  block_count: number;
}

export interface SectionData {
  id: string;
  layout: string;
  columns: ColumnData[];
  cssClass?: string;
}

export interface ColumnData {
  id: string;
  blocks: BlockData[];
}

export interface BlockData {
  id: string;
  blockType: string;
  data: Record<string, unknown>;
}

export interface PageScrapeResult {
  path: string;
  result: ScrapeResult | null;
  status: 'pending' | 'scraping' | 'done' | 'error';
  error?: string;
  /** Mapping-Override: blockType-Änderungen durch den User */
  mappingOverrides?: Record<string, string>;
  /** Wurde importiert? */
  imported?: boolean;
}

export interface CmsPage {
  id: number;
  title: string;
  path: string;
  status?: string;
}

export interface ImportSummary {
  totalPages: number;
  scrapedPages: number;
  totalSections: number;
  totalBlocks: number;
  blockCounts: Record<string, number>;
  warnings: string[];
  importedPages: number;
}
