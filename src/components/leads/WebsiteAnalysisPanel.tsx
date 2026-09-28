import { CheckCircle2, XCircle, HelpCircle } from "lucide-react";
import { analyzeWebsite, type FindingCategory } from "@/tools/analyzeWebsite";
import type { WebsiteAnalysis } from "@/types/lead";

const CATEGORY_LABELS: Record<FindingCategory, string> = {
  geral: "Geral",
  seo: "SEO básico",
  mobile: "Mobile",
  conversao: "Conversão e contato",
  conteudo: "Conteúdo",
};

const CATEGORY_ORDER: FindingCategory[] = ["geral", "seo", "mobile", "conversao", "conteudo"];

export function WebsiteAnalysisPanel({ analysis }: { analysis: WebsiteAnalysis }) {
  const findings = analyzeWebsite(analysis);

  if (findings.length === 0) {
    return <p className="text-sm text-muted">Não foi possível verificar.</p>;
  }

  const grouped = CATEGORY_ORDER.map((category) => ({
    category,
    items: findings.filter((f) => f.category === category),
  })).filter((g) => g.items.length > 0);

  return (
    <div className="space-y-4">
      {grouped.map((group) => (
        <div key={group.category}>
          <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted">
            {CATEGORY_LABELS[group.category]}
          </p>
          <ul className="space-y-1.5">
            {group.items.map((finding, idx) => (
              <li key={idx} className="flex items-start gap-2 text-sm">
                {finding.verified ? (
                  <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
                ) : (
                  <HelpCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
                )}
                <span className="text-foreground">{finding.label}</span>
              </li>
            ))}
          </ul>
        </div>
      ))}

      {analysis.status === "ACESSIVEL" && (
        <div className="flex flex-wrap gap-x-4 gap-y-1 border-t border-border pt-3 text-xs text-muted">
          {analysis.statusCode && <span>Status HTTP: {analysis.statusCode}</span>}
          {analysis.responseTimeMs && <span>Tempo de resposta: {analysis.responseTimeMs}ms</span>}
          {analysis.wordCount !== null && <span>~{analysis.wordCount} palavras de conteúdo</span>}
          {analysis.checkedAt && <span>Verificado em {new Date(analysis.checkedAt).toLocaleString("pt-BR")}</span>}
        </div>
      )}

      <p className="flex items-start gap-1.5 text-[11px] text-muted">
        <XCircle className="mt-0.5 h-3 w-3 shrink-0" />
        Estes sinais são extraídos diretamente do HTML do site — o sistema não avalia design ou
        identidade visual, pois isso exigiria renderização/captura de tela.
      </p>
    </div>
  );
}
