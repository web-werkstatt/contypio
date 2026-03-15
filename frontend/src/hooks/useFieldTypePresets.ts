import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import type { FieldTypePreset } from '@/types/cms';
import { getFieldTypes } from '@/lib/fieldTypeRegistry';

export function useFieldTypePresets() {
  const { data, isLoading } = useQuery<FieldTypePreset[]>({
    queryKey: ['fieldTypePresets'],
    queryFn: async () => (await api.get('/api/field-type-presets')).data,
    staleTime: 5 * 60 * 1000,
  });

  if (data && data.length > 0) return { presets: data, isLoading };

  // Fallback: statische Presets aus fieldTypeRegistry
  const fallback: FieldTypePreset[] = getFieldTypes().map((d, i) => ({
    id: i,
    type_key: d.type,
    label: d.label,
    category: d.category,
    render: d.render,
    config: {
      ...(d.input ? { inputType: d.input } : {}),
      ...(d.pattern ? { pattern: d.pattern } : {}),
      ...(d.placeholder ? { placeholder: d.placeholder } : {}),
      ...(d.rows ? { rows: d.rows } : {}),
      ...(d.monospace ? { monospace: d.monospace } : {}),
    },
    has_options: d.hasOptions ?? false,
    has_sub_fields: d.hasSubFields ?? false,
    list_visible: d.listVisible,
    sort_order: i,
  }));

  return { presets: fallback, isLoading };
}
