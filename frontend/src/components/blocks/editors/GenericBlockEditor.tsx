import { useState } from 'react';

interface Props {
  data: Record<string, unknown>;
  onChange: (data: Record<string, unknown>) => void;
  blockType: string;
}

/**
 * Generischer Block-Editor: Rendert alle Felder als JSON-Textfeld.
 * Wird als Fallback fuer neue Block-Typen ohne spezifischen Editor verwendet.
 */
export default function GenericBlockEditor({ data, onChange, blockType }: Props) {
  const [jsonStr, setJsonStr] = useState(JSON.stringify(data, null, 2));
  const [error, setError] = useState('');

  function handleChange(value: string) {
    setJsonStr(value);
    try {
      const parsed = JSON.parse(value);
      setError('');
      onChange(parsed);
    } catch {
      setError('Ungültiges JSON');
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-[var(--text-muted)]">
          {blockType} (JSON-Editor)
        </span>
        {error && <span className="text-xs text-red-500">{error}</span>}
      </div>
      <textarea
        value={jsonStr}
        onChange={(e) => handleChange(e.target.value)}
        className="w-full h-48 p-2 text-xs font-mono border rounded-md border-[var(--border)] bg-[var(--bg-secondary)]"
        spellCheck={false}
      />
    </div>
  );
}
