import type { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: number;
  icon: LucideIcon;
  accent?: "default" | "brand" | "success";
}

export function StatCard({ label, value, icon: Icon, accent = "default" }: StatCardProps) {
  const iconStyles = {
    default: "bg-slate-100 text-slate-600",
    brand: "bg-brand-soft text-brand",
    success: "bg-emerald-50 text-emerald-600",
  }[accent];

  return (
    <Card className="p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[13px] font-medium text-muted">{label}</p>
          <p className="mt-1.5 text-2xl font-semibold tracking-tight text-foreground">
            {value.toLocaleString("pt-BR")}
          </p>
        </div>
        <div className={cn("flex h-9 w-9 items-center justify-center rounded-lg", iconStyles)}>
          <Icon className="h-5 w-5" strokeWidth={2} />
        </div>
      </div>
    </Card>
  );
}
