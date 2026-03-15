import { Sparkles, X } from 'lucide-react';

interface AiConfig {
  enabled: boolean;
  prompt: string;
  source_fields: string[];
  max_length: number;
}

interface Props {
  config: Record<string, unknown>;
  fieldType: string;
  availableFields: string[];
  onChange: (config: Record<string, unknown>) => void;
}

const AI_COMPATIBLE_TYPES = ['text', 'textarea', 'richtext', 'input'];

export default function AiFieldConfig({ config, fieldType, availableFields, onChange }: Props) {
  if (!AI_COMPATIBLE_TYPES.includes(fieldType)) return null;

  const ai = (config.ai ?? {}) as Partial<AiConfig>;
  const enabled = ai.enabled ?? false;

  const updateAi = (updates: Partial<AiConfig>) => {
    const current = (config.ai ?? {}) as Partial<AiConfig>;
    onChange({ ...config, ai: { ...current, ...updates } });
  };

  const removeAi = () => {
    const { ai: _, ...rest } = config;
    onChange(rest);
  };

  if (!enabled) {
    return (
      <button
        type="button"
        onClick={() => updateAi({ enabled: true, prompt: '', source_fields: [], max_length: 500 })}
        className="ml-8 mt-1 flex items-center gap-1 text-[10px] text-purple-500 hover:text-purple-700 hover:underline"
      >
        <Sparkles size={10} /> KI-Generierung aktivieren
      </button>
    );
  }

  return (
    <div className="ml-8 mt-1 p-2 bg-purple-50 border border-purple-200 rounded text-xs space-y-2">
      <div className="flex items-center justify-between">
        <span className="font-medium flex items-center gap-1">
          <Sparkles size={10} /> KI-Generierung
        </span>
        <button onClick={removeAi} className="text-purple-400 hover:text-purple-600" title="KI entfernen">
          <X size={12} />
        </button>
      </div>

      <div>
        <label className="block text-[10px] font-medium mb-0.5">Prompt-Template</label>
        <textarea
          value={ai.prompt ?? ''}
          onChange={(e) => updateAi({ prompt: e.target.value })}
          placeholder="Erstelle einen kurzen {field_name} mit max. {max_length} Zeichen basierend auf: {context}"
          rows={3}
          className="w-full px-2 py-1 border rounded text-xs"
        />
        <span className="text-[9px] text-[var(--text-muted)]">
          Platzhalter: {'{field_name}'}, {'{max_length}'}, {'{context}'}
        </span>
      </div>

      <div>
        <label className="block text-[10px] font-medium mb-0.5">Quell-Felder</label>
        <div className="flex flex-wrap gap-1">
          {availableFields.map((f) => {
            const selected = (ai.source_fields ?? []).includes(f);
            return (
              <button
                key={f}
                type="button"
                onClick={() => {
                  const current = ai.source_fields ?? [];
                  const next = selected ? current.filter((s) => s !== f) : [...current, f];
                  updateAi({ source_fields: next });
                }}
                className={`px-2 py-0.5 rounded text-[10px] transition-colors ${
                  selected ? 'bg-purple-200 text-purple-700' : 'bg-white text-gray-500 hover:bg-gray-100'
                }`}
              >
                {f}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <label className="block text-[10px] font-medium mb-0.5">Max. Länge</label>
        <input
          type="number"
          value={ai.max_length ?? 500}
          onChange={(e) => updateAi({ max_length: Number(e.target.value) || 500 })}
          min={50}
          max={4000}
          className="w-24 px-2 py-0.5 border rounded text-xs"
        />
      </div>
    </div>
  );
}
