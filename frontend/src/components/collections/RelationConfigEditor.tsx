import { useState, useEffect } from 'react';
import api from '@/lib/api';

interface Props {
  config: Record<string, unknown>;
  onChange(config: Record<string, unknown>): void;
}

interface CollectionInfo {
  collection_key: string;
  label: string;
  fields: { name: string; label: string }[];
}

export default function RelationConfigEditor({ config, onChange }: Props) {
  const [collections, setCollections] = useState<CollectionInfo[]>([]);
  const targetCollection = (config.collection as string) ?? '';
  const displayField = (config.display_field as string) ?? 'title';
  const multiple = !!config.multiple;

  useEffect(() => {
    api.get('/api/collections').then((res) => {
      setCollections(res.data.map((s: CollectionInfo) => ({
        collection_key: s.collection_key,
        label: s.label,
        fields: s.fields ?? [],
      })));
    });
  }, []);

  const selectedSchema = collections.find((c) => c.collection_key === targetCollection);

  return (
    <div className="ml-8 mt-1 p-2 bg-green-50 border border-green-200 rounded text-xs space-y-2">
      <div className="font-medium">Relation-Einstellungen:</div>
      <div className="flex flex-wrap gap-2">
        <label className="flex items-center gap-1">
          Ziel-Collection:
          <select
            value={targetCollection}
            onChange={(e) => onChange({ ...config, collection: e.target.value })}
            className="px-2 py-0.5 border rounded"
          >
            <option value="">-- Wählen --</option>
            {collections.map((c) => (
              <option key={c.collection_key} value={c.collection_key}>{c.label}</option>
            ))}
          </select>
        </label>

        {selectedSchema && (
          <label className="flex items-center gap-1">
            Anzeige-Feld:
            <select
              value={displayField}
              onChange={(e) => onChange({ ...config, display_field: e.target.value })}
              className="px-2 py-0.5 border rounded"
            >
              {selectedSchema.fields.map((f) => (
                <option key={f.name} value={f.name}>{f.label}</option>
              ))}
            </select>
          </label>
        )}

        <label className="flex items-center gap-1">
          <input
            type="checkbox"
            checked={multiple}
            onChange={(e) => onChange({ ...config, multiple: e.target.checked })}
          />
          Mehrfach-Auswahl
        </label>
      </div>
    </div>
  );
}
