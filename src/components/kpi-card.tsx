interface KpiCardProps {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  sub?: string;
}

export function KpiCard({ label, value, icon, sub }: KpiCardProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-col gap-2 min-w-0">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide truncate">
          {label}
        </span>
        {icon && <span className="text-gray-400 shrink-0">{icon}</span>}
      </div>
      <span className="text-2xl font-bold text-gray-900 tabular-nums">{value}</span>
      {sub && <span className="text-xs text-gray-400">{sub}</span>}
    </div>
  );
}
