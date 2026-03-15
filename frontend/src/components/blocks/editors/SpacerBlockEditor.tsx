interface Props {
  data: Record<string, unknown>;
  onChange(data: Record<string, unknown>): void;
}

export default function SpacerBlockEditor({ data, onChange }: Props) {
  const showDivider = (data.showDivider as boolean) || false;

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium mb-1">Höhe</label>
          <input
            value={(data.height as string) || '48px'}
            onChange={(e) => onChange({ height: e.target.value })}
            className="w-full px-2.5 py-1.5 border border-[var(--border)] rounded-md text-sm"
            placeholder="48px"
          />
        </div>
        <div className="flex items-end">
          <label className="flex items-center gap-1.5 text-xs">
            <input
              type="checkbox"
              checked={showDivider}
              onChange={(e) => onChange({ showDivider: e.target.checked })}
            />
            Trennlinie anzeigen
          </label>
        </div>
      </div>
      {showDivider && (
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-medium mb-1">Linienstil</label>
            <select
              value={(data.dividerStyle as string) || 'solid'}
              onChange={(e) => onChange({ dividerStyle: e.target.value })}
              className="w-full px-2.5 py-1.5 border border-[var(--border)] rounded-md text-sm"
            >
              <option value="solid">Durchgezogen</option>
              <option value="dashed">Gestrichelt</option>
              <option value="dotted">Gepunktet</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">Linienfarbe</label>
            <input
              type="color"
              value={(data.dividerColor as string) || '#e5e7eb'}
              onChange={(e) => onChange({ dividerColor: e.target.value })}
              className="w-full h-[34px] px-1 py-0.5 border border-[var(--border)] rounded-md"
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">Linienbreite</label>
            <input
              value={(data.dividerWidth as string) || '100%'}
              onChange={(e) => onChange({ dividerWidth: e.target.value })}
              className="w-full px-2.5 py-1.5 border border-[var(--border)] rounded-md text-sm"
              placeholder="100% oder 50%"
            />
          </div>
        </div>
      )}
    </div>
  );
}
