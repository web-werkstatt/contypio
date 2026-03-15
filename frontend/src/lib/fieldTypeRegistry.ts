export type FieldCategory = 'basic' | 'advanced';
export type FieldRender = 'input' | 'textarea' | 'select' | 'checkbox' | 'color' | 'media-picker' | 'group' | 'repeater';

export interface FieldTypeDef {
  type: string;
  label: string;
  category: FieldCategory;
  input?: string;
  pattern?: string;
  placeholder?: string;
  rows?: number;
  monospace?: boolean;
  listVisible: boolean;
  hasOptions?: boolean;
  hasSubFields?: boolean;
  render: FieldRender;
  defaultValue: unknown;
}

const REGISTRY: FieldTypeDef[] = [
  // Basic
  { type: 'text', label: 'Text', category: 'basic', input: 'text', listVisible: true, render: 'input', defaultValue: '' },
  { type: 'textarea', label: 'Textarea', category: 'basic', rows: 3, listVisible: false, render: 'textarea', defaultValue: '' },
  { type: 'number', label: 'Zahl', category: 'basic', input: 'number', listVisible: true, render: 'input', defaultValue: '' },
  { type: 'email', label: 'E-Mail', category: 'basic', input: 'email', listVisible: true, render: 'input', defaultValue: '' },
  { type: 'phone', label: 'Telefon', category: 'basic', input: 'tel', pattern: '^[0-9+ ()-]+$', placeholder: '+49...', listVisible: true, render: 'input', defaultValue: '' },
  { type: 'url', label: 'URL', category: 'basic', input: 'url', listVisible: true, render: 'input', defaultValue: '' },
  { type: 'date', label: 'Datum', category: 'basic', input: 'date', listVisible: true, render: 'input', defaultValue: '' },
  { type: 'select', label: 'Auswahl', category: 'basic', listVisible: true, hasOptions: true, render: 'select', defaultValue: '' },
  { type: 'toggle', label: 'Toggle', category: 'basic', listVisible: true, render: 'checkbox', defaultValue: false },
  { type: 'boolean', label: 'Boolean', category: 'basic', listVisible: true, render: 'checkbox', defaultValue: false },
  // Advanced
  { type: 'richtext', label: 'Rich Text', category: 'advanced', rows: 5, monospace: true, placeholder: 'HTML/Markdown', listVisible: false, render: 'textarea', defaultValue: '' },
  { type: 'color', label: 'Farbe', category: 'advanced', listVisible: true, render: 'color', defaultValue: '' },
  { type: 'media', label: 'Media (ID)', category: 'advanced', input: 'number', placeholder: 'Media ID', listVisible: false, render: 'input', defaultValue: null },
  { type: 'media-picker', label: 'Media-Picker', category: 'advanced', listVisible: false, render: 'media-picker', defaultValue: null },
  // Composite
  { type: 'group', label: 'Gruppe', category: 'advanced', listVisible: false, hasSubFields: true, render: 'group', defaultValue: {} },
  { type: 'repeater', label: 'Repeater', category: 'advanced', listVisible: false, hasSubFields: true, render: 'repeater', defaultValue: [] },
];

const REGISTRY_MAP = new Map<string, FieldTypeDef>(REGISTRY.map((d) => [d.type, d]));

const FALLBACK: FieldTypeDef = { type: 'text', label: 'Text', category: 'basic', input: 'text', listVisible: true, render: 'input', defaultValue: '' };

export function getFieldType(type: string): FieldTypeDef {
  return REGISTRY_MAP.get(type) ?? FALLBACK;
}

export function getFieldTypes(): FieldTypeDef[] {
  return REGISTRY;
}

export function getFieldTypesByCategory(): Record<FieldCategory, FieldTypeDef[]> {
  const result: Record<FieldCategory, FieldTypeDef[]> = { basic: [], advanced: [] };
  for (const def of REGISTRY) {
    result[def.category].push(def);
  }
  return result;
}
