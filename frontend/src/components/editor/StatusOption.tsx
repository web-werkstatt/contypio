export const STATUS_LABELS: Record<string, string> = {
  draft: 'Entwurf',
  published: 'Publiziert',
  scheduled: 'Geplant',
  archived: 'Archiviert',
};

export const STATUS_STYLES: Record<string, string> = {
  draft: 'bg-amber-100 text-amber-700',
  published: 'bg-green-100 text-green-700',
  scheduled: 'bg-blue-100 text-blue-700',
  archived: 'bg-gray-100 text-gray-600',
};

export function formatLocalDateTime(isoStr: string | null | undefined): string {
  if (!isoStr) {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setHours(9, 0, 0, 0);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} 09:00`;
  }
  const d = new Date(isoStr);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

interface StatusOptionProps {
  label: string;
  description: string;
  active: boolean;
  onClick: () => void;
}

export default function StatusOption({ label, description, active, onClick }: StatusOptionProps) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-3 py-2 text-sm transition-colors ${active ? 'bg-[var(--primary-light)]' : 'hover:bg-gray-50'}`}
    >
      <div className="font-medium">{label}</div>
      <div className="text-xs text-[var(--text-muted)]">{description}</div>
    </button>
  );
}
