interface Props {
  data: Record<string, unknown>;
  onChange(data: Record<string, unknown>): void;
}

export default function TableBlockEditor({ data, onChange }: Props) {
  const headers = (data.headers as string[]) || [];
  const rows = (data.rows as string[][]) || [];
  const colCount = headers.length || 1;

  const addColumn = () => {
    const newHeaders = [...headers, ''];
    const newRows = rows.map((row) => [...row, '']);
    onChange({ headers: newHeaders, rows: newRows });
  };

  const removeColumn = (colIdx: number) => {
    if (headers.length <= 1) return;
    const newHeaders = headers.filter((_, i) => i !== colIdx);
    const newRows = rows.map((row) => row.filter((_, i) => i !== colIdx));
    onChange({ headers: newHeaders, rows: newRows });
  };

  const addRow = () => {
    onChange({ rows: [...rows, Array(colCount).fill('')] });
  };

  const removeRow = (rowIdx: number) => {
    onChange({ rows: rows.filter((_, i) => i !== rowIdx) });
  };

  const updateHeader = (colIdx: number, val: string) => {
    const newHeaders = headers.map((h, i) => (i === colIdx ? val : h));
    onChange({ headers: newHeaders });
  };

  const updateCell = (rowIdx: number, colIdx: number, val: string) => {
    const newRows = rows.map((row, ri) =>
      ri === rowIdx ? row.map((cell, ci) => (ci === colIdx ? val : cell)) : row
    );
    onChange({ rows: newRows });
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium mb-1">Titel (optional)</label>
          <input
            value={(data.title as string) || ''}
            onChange={(e) => onChange({ title: e.target.value })}
            className="w-full px-2.5 py-1.5 border border-[var(--border)] rounded-md text-sm"
            placeholder="Tabellentitel"
          />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1">Beschriftung (optional)</label>
          <input
            value={(data.caption as string) || ''}
            onChange={(e) => onChange({ caption: e.target.value })}
            className="w-full px-2.5 py-1.5 border border-[var(--border)] rounded-md text-sm"
            placeholder="Tabellenunterschrift"
          />
        </div>
      </div>
      <div className="flex gap-4">
        <label className="flex items-center gap-1.5 text-xs">
          <input
            type="checkbox"
            checked={(data.striped as boolean) ?? true}
            onChange={(e) => onChange({ striped: e.target.checked })}
          />
          Gestreifte Zeilen
        </label>
        <label className="flex items-center gap-1.5 text-xs">
          <input
            type="checkbox"
            checked={(data.responsive as boolean) ?? true}
            onChange={(e) => onChange({ responsive: e.target.checked })}
          />
          Responsiv
        </label>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr>
              {headers.map((header, ci) => (
                <th key={ci} className="p-0">
                  <div className="flex">
                    <input
                      value={header}
                      onChange={(e) => updateHeader(ci, e.target.value)}
                      className="w-full px-2 py-1.5 border border-[var(--border)] text-xs font-medium bg-[var(--bg-secondary)]"
                      placeholder={`Spalte ${ci + 1}`}
                    />
                    {headers.length > 1 && (
                      <button
                        onClick={() => removeColumn(ci)}
                        className="px-1.5 border border-l-0 border-[var(--border)] text-[var(--danger)] text-xs hover:bg-red-50"
                        title="Spalte entfernen"
                      >×</button>
                    )}
                  </div>
                </th>
              ))}
              <th className="p-0 w-8" />
            </tr>
          </thead>
          <tbody>
            {rows.map((row, ri) => (
              <tr key={ri}>
                {row.map((cell, ci) => (
                  <td key={ci} className="p-0">
                    <input
                      value={cell}
                      onChange={(e) => updateCell(ri, ci, e.target.value)}
                      className="w-full px-2 py-1.5 border border-[var(--border)] text-xs"
                      placeholder="..."
                    />
                  </td>
                ))}
                <td className="p-0 w-8">
                  <button
                    onClick={() => removeRow(ri)}
                    className="w-full h-full px-1.5 py-1.5 text-[var(--danger)] text-xs hover:bg-red-50"
                    title="Zeile entfernen"
                  >×</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex gap-3">
        <button onClick={addRow} className="text-xs text-[var(--primary)] hover:underline">+ Zeile</button>
        <button onClick={addColumn} className="text-xs text-[var(--primary)] hover:underline">+ Spalte</button>
      </div>
    </div>
  );
}
