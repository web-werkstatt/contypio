import RichTextField from '@/components/RichTextField';

interface Props {
  data: Record<string, unknown>;
  onChange(data: Record<string, unknown>): void;
}

export default function RichTextBlockEditor({ data, onChange }: Props) {
  return (
    <div className="space-y-3">
      <div>
        <label className="block text-xs font-medium mb-1">Titel (optional)</label>
        <input
          value={(data.title as string) || ''}
          onChange={(e) => onChange({ title: e.target.value })}
          className="w-full px-2.5 py-1.5 border border-[var(--border)] rounded-md text-sm"
          placeholder="Abschnittstitel"
        />
      </div>
      <div>
        <label className="block text-xs font-medium mb-1">Inhalt</label>
        <RichTextField
          value={(data.content as string) || ''}
          onChange={(content) => onChange({ content })}
          placeholder="Text eingeben..."
        />
      </div>
    </div>
  );
}
