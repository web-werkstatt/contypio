import { nanoid } from 'nanoid';

interface TeamMember {
  id: string;
  name: string;
  role: string;
  bio: string;
  imageId: string;
  email: string;
}

interface Props {
  data: Record<string, unknown>;
  onChange(data: Record<string, unknown>): void;
}

export default function TeamBlockEditor({ data, onChange }: Props) {
  const members = (data.members as TeamMember[]) || [];
  const showBio = (data.showBio as boolean) || false;

  const addMember = () => onChange({
    members: [...members, { id: nanoid(8), name: '', role: '', bio: '', imageId: '', email: '' }],
  });
  const removeMember = (id: string) => onChange({ members: members.filter((m) => m.id !== id) });
  const updateMember = (id: string, field: keyof TeamMember, val: string) =>
    onChange({ members: members.map((m) => (m.id === id ? { ...m, [field]: val } : m)) });

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-xs font-medium mb-1">Titel (optional)</label>
        <input
          value={(data.title as string) || ''}
          onChange={(e) => onChange({ title: e.target.value })}
          className="w-full px-2.5 py-1.5 border border-[var(--border)] rounded-md text-sm"
          placeholder="Unser Team"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium mb-1">Spalten</label>
          <select
            value={(data.columns as number) || 4}
            onChange={(e) => onChange({ columns: parseInt(e.target.value) })}
            className="w-full px-2.5 py-1.5 border border-[var(--border)] rounded-md text-sm"
          >
            <option value={2}>2 Spalten</option>
            <option value={3}>3 Spalten</option>
            <option value={4}>4 Spalten</option>
          </select>
        </div>
        <div className="flex items-end">
          <label className="flex items-center gap-1.5 text-xs">
            <input
              type="checkbox"
              checked={showBio}
              onChange={(e) => onChange({ showBio: e.target.checked })}
            />
            Biografie anzeigen
          </label>
        </div>
      </div>
      <div className="space-y-3">
        {members.map((member, idx) => (
          <div key={member.id} className="border border-gray-200 rounded-md p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[var(--text-muted)]">Mitglied {idx + 1}</span>
              <button onClick={() => removeMember(member.id)} className="text-xs text-[var(--danger)] hover:underline">Entfernen</button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input
                value={member.name || ''}
                onChange={(e) => updateMember(member.id, 'name', e.target.value)}
                className="px-2.5 py-1.5 border border-[var(--border)] rounded-md text-sm"
                placeholder="Name"
              />
              <input
                value={member.role || ''}
                onChange={(e) => updateMember(member.id, 'role', e.target.value)}
                className="px-2.5 py-1.5 border border-[var(--border)] rounded-md text-sm"
                placeholder="Position"
              />
            </div>
            {showBio && (
              <textarea
                value={member.bio || ''}
                onChange={(e) => updateMember(member.id, 'bio', e.target.value)}
                rows={2}
                className="w-full px-2.5 py-1.5 border border-[var(--border)] rounded-md text-sm"
                placeholder="Biografie"
              />
            )}
            <div className="grid grid-cols-2 gap-2">
              <input
                value={member.imageId || ''}
                onChange={(e) => updateMember(member.id, 'imageId', e.target.value)}
                className="px-2.5 py-1.5 border border-[var(--border)] rounded-md text-sm"
                placeholder="Bild-ID"
              />
              <input
                value={member.email || ''}
                onChange={(e) => updateMember(member.id, 'email', e.target.value)}
                className="px-2.5 py-1.5 border border-[var(--border)] rounded-md text-sm"
                placeholder="E-Mail (optional)"
              />
            </div>
          </div>
        ))}
      </div>
      <button onClick={addMember} className="text-xs text-[var(--primary)] hover:underline">+ Mitglied hinzufügen</button>
    </div>
  );
}
