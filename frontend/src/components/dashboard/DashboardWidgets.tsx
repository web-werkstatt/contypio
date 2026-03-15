import { ArrowRight } from 'lucide-react';

/* --- Shared Types --- */

export interface Badge {
  label: string;
  color: string;
  dot?: string;
}

/* --- Quick Action Button --- */

export function QuickAction({ icon, label, onClick, kbd }: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  kbd?: string;
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium bg-white border border-[var(--border)] rounded-lg hover:border-[var(--primary)] hover:text-[var(--primary)] hover:shadow-sm transition-all"
    >
      {icon}
      <span>{label}</span>
      {kbd && <kbd className="ml-auto text-[10px] bg-gray-100 text-[var(--text-muted)] px-1.5 py-0.5 rounded font-mono">{kbd}</kbd>}
    </button>
  );
}

/* --- Stat Card --- */

export function StatCard({ icon, iconColor, title, value, subtitle, trend, onClick }: {
  icon: React.ReactNode;
  iconColor: string;
  title: string;
  value: number;
  subtitle?: string;
  trend?: string;
  onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-xl border border-[var(--border)] p-5 shadow-sm transition-all ${onClick ? 'cursor-pointer hover:border-[var(--primary)] hover:shadow-md group' : ''}`}
    >
      <div className="flex items-center justify-between mb-3">
        <span className={`p-2 rounded-lg ${iconColor}`}>{icon}</span>
        {onClick && <ArrowRight size={14} className="text-[var(--text-muted)] opacity-0 group-hover:opacity-100 transition-opacity" />}
      </div>
      <p className="text-2xl font-bold">{value}</p>
      <div className="flex items-center gap-2 mt-1">
        <span className="text-sm text-[var(--text-muted)]">{title}</span>
        {trend && (
          <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full">{trend}</span>
        )}
      </div>
      {subtitle && <p className="text-xs text-[var(--text-muted)] mt-0.5">{subtitle}</p>}
    </div>
  );
}

/* --- Empty State Card --- */

export function EmptyCard({ icon, title, text, actionLabel, onAction }: {
  icon: React.ReactNode;
  title: string;
  text: string;
  actionLabel: string;
  onAction: () => void;
}) {
  return (
    <div className="bg-white rounded-xl border border-dashed border-[var(--border)] p-5 text-center">
      <div className="text-[var(--text-muted)] mb-2 flex justify-center">{icon}</div>
      <p className="text-sm font-semibold mb-1">{title}</p>
      <p className="text-sm text-[var(--text-muted)] mb-3">{text}</p>
      <button onClick={onAction} className="text-sm text-[var(--primary)] hover:underline font-medium">
        {actionLabel}
      </button>
    </div>
  );
}

/* --- Usage Bar --- */

export function UsageBar({ label, used, max, percent, unit, icon }: {
  label: string; used: number; max: number; percent: number; unit?: string; icon: React.ReactNode;
}) {
  const barColor = percent >= 90 ? 'bg-red-500' : percent >= 70 ? 'bg-amber-500' : 'bg-[var(--primary)]';
  return (
    <div className="flex items-center gap-4">
      <span className="text-[var(--text-muted)] shrink-0">{icon}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm text-[var(--text)]">{label}</span>
          <span className="text-xs text-[var(--text-muted)]">{used}{unit ? ` ${unit}` : ''} / {max}{unit ? ` ${unit}` : ''}</span>
        </div>
        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: `${Math.min(percent, 100)}%` }} />
        </div>
      </div>
    </div>
  );
}

/* --- Relative Date Formatter --- */

export function formatRelativeDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffH = Math.floor(diffMin / 60);
  const diffD = Math.floor(diffH / 24);

  if (diffMin < 1) return 'gerade eben';
  if (diffMin < 60) return `vor ${diffMin} Min.`;
  if (diffH < 24) return `vor ${diffH} Std.`;
  if (diffD === 1) return 'gestern';
  if (diffD < 7) return `vor ${diffD} Tagen`;
  return date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
}
