import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  page: number;
  pageSize: number;
  total: number;
  buildHref: (page: number) => string;
}

export function Pagination({ page, pageSize, total, buildHref }: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  if (totalPages <= 1) return null;

  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  return (
    <div className="flex items-center justify-between border-t border-border px-1 py-4 text-sm text-muted">
      <span>
        Mostrando {start}–{end} de {total}
      </span>
      <div className="flex items-center gap-2">
        <Link
          href={buildHref(Math.max(1, page - 1))}
          aria-disabled={page <= 1}
          className={`flex h-8 w-8 items-center justify-center rounded-lg border border-border-strong ${
            page <= 1 ? "pointer-events-none opacity-40" : "hover:bg-slate-50"
          }`}
        >
          <ChevronLeft className="h-4 w-4" />
        </Link>
        <span className="text-foreground">
          {page} / {totalPages}
        </span>
        <Link
          href={buildHref(Math.min(totalPages, page + 1))}
          aria-disabled={page >= totalPages}
          className={`flex h-8 w-8 items-center justify-center rounded-lg border border-border-strong ${
            page >= totalPages ? "pointer-events-none opacity-40" : "hover:bg-slate-50"
          }`}
        >
          <ChevronRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
