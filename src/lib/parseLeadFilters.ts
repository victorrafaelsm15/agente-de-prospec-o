import type { LeadFilters, LeadPriority, LeadStatus } from "@/types/lead";
import { LEAD_STATUSES } from "@/types/lead";

const VALID_PRIORITIES: LeadPriority[] = ["BAIXA", "MEDIA", "ALTA"];

function parseBoolParam(value: string | null): boolean | undefined {
  if (value === "true") return true;
  if (value === "false") return false;
  return undefined;
}

export function parseLeadFilters(params: URLSearchParams): LeadFilters {
  const status = params.get("status");
  const priority = params.get("priority");

  return {
    search: params.get("search") ?? undefined,
    status: status && LEAD_STATUSES.includes(status as LeadStatus) ? (status as LeadStatus) : undefined,
    priority:
      priority && VALID_PRIORITIES.includes(priority as LeadPriority)
        ? (priority as LeadPriority)
        : undefined,
    category: params.get("category") ?? undefined,
    hasWebsite: parseBoolParam(params.get("hasWebsite")),
    hasInstagram: parseBoolParam(params.get("hasInstagram")),
    hasPhone: parseBoolParam(params.get("hasPhone")),
    hasWhatsapp: parseBoolParam(params.get("hasWhatsapp")),
    outdatedWebsite: parseBoolParam(params.get("outdatedWebsite")),
    dateFrom: params.get("dateFrom") ?? undefined,
    dateTo: params.get("dateTo") ?? undefined,
    sortBy: (params.get("sortBy") as LeadFilters["sortBy"]) ?? "score",
    sortDir: (params.get("sortDir") as LeadFilters["sortDir"]) ?? "desc",
    page: Number(params.get("page")) || 1,
    pageSize: Number(params.get("pageSize")) || 20,
  };
}
