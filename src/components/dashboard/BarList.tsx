import { cn } from "@/lib/utils";

interface BarListItem {
  label: string;
  count: number;
  colorClass?: string;
}

export function BarList({ items }: { items: BarListItem[] }) {
  const max = Math.max(1, ...items.map((i) => i.count));

  return (
    <div className="space-y-2.5">
      {items.map((item) => (
        <div key={item.label} className="flex items-center gap-3">
          <span className="w-28 shrink-0 truncate text-[13px] text-muted">{item.label}</span>
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
            <div
              className={cn("h-full rounded-full transition-all", item.colorClass ?? "bg-brand")}
              style={{ width: `${(item.count / max) * 100}%` }}
            />
          </div>
          <span className="w-6 shrink-0 text-right text-[13px] font-medium text-foreground">
            {item.count}
          </span>
        </div>
      ))}
    </div>
  );
}
