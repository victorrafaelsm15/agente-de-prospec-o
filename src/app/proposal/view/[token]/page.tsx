import { notFound } from "next/navigation";
import { AtSign, Mail, Phone, Sparkles } from "lucide-react";
import { getPublicProposalByToken, recordProposalView } from "@/database/proposalsData";
import { formatCurrencyBRL } from "@/lib/proposalCalc";
import { formatDateOnly } from "@/lib/utils";
import { PublicProposalActions, DownloadPdfLink } from "@/components/proposals/PublicProposalActions";

export const dynamic = "force-dynamic";

interface PublicProposalPageProps {
  params: Promise<{ token: string }>;
}

export default async function PublicProposalPage({ params }: PublicProposalPageProps) {
  const { token } = await params;
  const proposal = await getPublicProposalByToken(token);
  if (!proposal) notFound();

  await recordProposalView(token);

  const primary = proposal.brand.primaryColor || "#4338ca";
  const discountAmount = proposal.subtotal - proposal.total;
  const isExpired = proposal.expiresAt ? new Date(proposal.expiresAt) < new Date() : false;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
        {/* Cabeçalho / capa */}
        <div className="mb-8 text-center">
          {proposal.brand.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={proposal.brand.logoUrl} alt={proposal.brand.businessName ?? "Logo"} className="mx-auto mb-4 h-10 object-contain" />
          ) : (
            <div className="mx-auto mb-4 flex h-10 w-10 items-center justify-center rounded-xl text-white" style={{ backgroundColor: primary }}>
              <Sparkles className="h-5 w-5" />
            </div>
          )}
          <p className="text-xs font-semibold uppercase tracking-wider text-muted">Proposta comercial</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">{proposal.title}</h1>
          <p className="mt-1 text-sm text-muted">Para {proposal.leadName}</p>
        </div>

        {isExpired && (
          <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-center text-sm font-medium text-amber-800">
            Esta proposta expirou em {formatDateOnly(proposal.expiresAt!)}. Entre em contato para uma proposta atualizada.
          </div>
        )}

        <div className="space-y-6 rounded-2xl border border-border bg-white p-6 shadow-sm sm:p-8">
          {(proposal.diagnosis.situacaoAtual || proposal.diagnosis.oportunidades || proposal.diagnosis.solucaoProposta) && (
            <section>
              <h2 className="mb-3 text-base font-semibold text-foreground" style={{ color: primary }}>
                Diagnóstico
              </h2>
              <div className="space-y-3 text-sm leading-relaxed text-slate-700">
                {proposal.diagnosis.situacaoAtual && (
                  <div>
                    <p className="font-medium text-foreground">Situação atual</p>
                    <p>{proposal.diagnosis.situacaoAtual}</p>
                  </div>
                )}
                {proposal.diagnosis.oportunidades && (
                  <div>
                    <p className="font-medium text-foreground">Oportunidades</p>
                    <p>{proposal.diagnosis.oportunidades}</p>
                  </div>
                )}
                {proposal.diagnosis.solucaoProposta && (
                  <div>
                    <p className="font-medium text-foreground">Solução proposta</p>
                    <p>{proposal.diagnosis.solucaoProposta}</p>
                  </div>
                )}
              </div>
            </section>
          )}

          <section>
            <h2 className="mb-3 text-base font-semibold" style={{ color: primary }}>
              Escopo e investimento
            </h2>
            {proposal.scopeNotes && <p className="mb-3 text-sm text-slate-700">{proposal.scopeNotes}</p>}
            <div className="divide-y divide-border overflow-hidden rounded-xl border border-border">
              {proposal.items.map((item) => (
                <div key={item.id} className="flex items-start justify-between gap-3 px-4 py-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">{item.name}</p>
                    {item.description && <p className="mt-0.5 text-xs text-muted">{item.description}</p>}
                  </div>
                  <div className="shrink-0 text-right text-sm">
                    <p className="text-foreground">{formatCurrencyBRL(item.total)}</p>
                    {item.quantity !== 1 && (
                      <p className="text-xs text-muted">
                        {item.quantity} × {formatCurrencyBRL(item.unitPrice)}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="ml-auto mt-4 w-full max-w-xs space-y-1.5">
              <div className="flex justify-between text-sm">
                <span className="text-muted">Subtotal</span>
                <span className="text-foreground">{formatCurrencyBRL(proposal.subtotal)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted">Desconto</span>
                  <span className="text-foreground">-{formatCurrencyBRL(discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-border pt-1.5 text-lg font-semibold">
                <span className="text-foreground">Total</span>
                <span style={{ color: primary }}>{formatCurrencyBRL(proposal.total)}</span>
              </div>
            </div>
          </section>

          {(proposal.paymentTerms || proposal.timeline) && (
            <section>
              <h2 className="mb-3 text-base font-semibold" style={{ color: primary }}>
                Condições
              </h2>
              <div className="space-y-3 text-sm text-slate-700">
                {proposal.paymentTerms && (
                  <div>
                    <p className="font-medium text-foreground">Pagamento</p>
                    <p>{proposal.paymentTerms}</p>
                  </div>
                )}
                {proposal.timeline && (
                  <div>
                    <p className="font-medium text-foreground">Prazo estimado</p>
                    <p>{proposal.timeline}</p>
                  </div>
                )}
              </div>
            </section>
          )}

          {proposal.nextSteps.length > 0 && (
            <section>
              <h2 className="mb-3 text-base font-semibold" style={{ color: primary }}>
                Próximos passos
              </h2>
              <ol className="space-y-2">
                {proposal.nextSteps.map((step, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 text-sm text-slate-700">
                    <span
                      className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold text-white"
                      style={{ backgroundColor: primary }}
                    >
                      {idx + 1}
                    </span>
                    {step}
                  </li>
                ))}
              </ol>
            </section>
          )}

          {proposal.terms && (
            <section>
              <h2 className="mb-3 text-base font-semibold" style={{ color: primary }}>
                Termos e condições
              </h2>
              <p className="whitespace-pre-line text-sm text-slate-700">{proposal.terms}</p>
            </section>
          )}

          <div className="border-t border-border pt-5 text-center text-xs text-muted">
            Válida por {proposal.validityDays} dias{proposal.expiresAt && ` (até ${formatDateOnly(proposal.expiresAt)})`}
          </div>
        </div>

        {!isExpired && (
          <div className="mt-6">
            <PublicProposalActions token={token} status={proposal.status} />
          </div>
        )}

        <div className="mt-4 flex justify-center">
          <DownloadPdfLink proposalPdfUrl={`/api/proposal/view/${token}/pdf`} />
        </div>

        {(proposal.brand.businessName || proposal.brand.contactPhone || proposal.brand.contactEmail) && (
          <div className="mt-8 flex flex-col items-center gap-1 text-xs text-muted">
            {proposal.brand.businessName && <p className="font-medium text-foreground">{proposal.brand.businessName}</p>}
            <div className="flex items-center gap-3">
              {proposal.brand.contactPhone && (
                <span className="flex items-center gap-1">
                  <Phone className="h-3 w-3" /> {proposal.brand.contactPhone}
                </span>
              )}
              {proposal.brand.contactEmail && (
                <span className="flex items-center gap-1">
                  <Mail className="h-3 w-3" /> {proposal.brand.contactEmail}
                </span>
              )}
            </div>
            {proposal.brand.socialLinks.length > 0 && (
              <div className="flex items-center gap-3">
                {proposal.brand.socialLinks.map((link, idx) => (
                  <a key={idx} href={link.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-brand">
                    <AtSign className="h-3 w-3" /> {link.label}
                  </a>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
