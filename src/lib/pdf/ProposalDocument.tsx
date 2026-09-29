import { Document, Page, Text, View, StyleSheet, Image, Link } from "@react-pdf/renderer";
import { formatCurrencyBRL } from "@/lib/proposalCalc";
import { formatDateOnly } from "@/lib/utils";
import type { PublicProposal } from "@/types/proposal";

const brandDefault = "#4338ca";

function styles(primary: string) {
  return StyleSheet.create({
    page: {
      fontFamily: "Helvetica",
      fontSize: 10.5,
      color: "#1f2430",
      paddingTop: 48,
      paddingBottom: 56,
      paddingHorizontal: 48,
    },
    coverPage: {
      fontFamily: "Helvetica",
      paddingHorizontal: 56,
      paddingVertical: 64,
      justifyContent: "space-between",
      height: "100%",
    },
    coverTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
    logo: { width: 90, height: 36, objectFit: "contain" },
    brandName: { fontSize: 13, fontWeight: 700, color: primary },
    coverTitleWrap: { marginTop: 140 },
    coverEyebrow: { fontSize: 11, color: "#6b7280", marginBottom: 10, letterSpacing: 1 },
    coverTitle: { fontSize: 30, fontWeight: 700, color: "#111827", lineHeight: 1.25 },
    coverClient: { fontSize: 16, color: primary, marginTop: 8, fontWeight: 700 },
    coverFooter: { flexDirection: "row", justifyContent: "space-between", fontSize: 9, color: "#9ca3af" },

    sectionTitle: {
      fontSize: 15,
      fontWeight: 700,
      color: "#111827",
      marginBottom: 14,
      paddingBottom: 8,
      borderBottomWidth: 1.5,
      borderBottomColor: primary,
    },
    subheading: { fontSize: 10.5, fontWeight: 700, color: primary, marginTop: 14, marginBottom: 4 },
    paragraph: { fontSize: 10.5, lineHeight: 1.6, color: "#374151", marginBottom: 8 },
    small: { fontSize: 9, color: "#6b7280" },

    table: { marginTop: 6, borderTopWidth: 1, borderTopColor: "#e5e7eb" },
    tableRow: {
      flexDirection: "row",
      borderBottomWidth: 1,
      borderBottomColor: "#e5e7eb",
      paddingVertical: 8,
    },
    tableHeaderRow: {
      flexDirection: "row",
      paddingVertical: 6,
      backgroundColor: "#f9fafb",
    },
    th: { fontSize: 9, fontWeight: 700, color: "#6b7280" },
    tdName: { fontSize: 10, fontWeight: 700, color: "#111827" },
    tdDesc: { fontSize: 9, color: "#6b7280", marginTop: 2 },
    tdRight: { fontSize: 10, color: "#111827", textAlign: "right" },

    colName: { flex: 3 },
    colQty: { flex: 1, textAlign: "right" },
    colPrice: { flex: 1.3, textAlign: "right" },
    colTotal: { flex: 1.3, textAlign: "right" },

    totalsBox: { marginTop: 14, alignSelf: "flex-end", width: 220 },
    totalsRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 3 },
    totalsLabel: { fontSize: 10, color: "#6b7280" },
    totalsValue: { fontSize: 10, color: "#111827" },
    grandTotalRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginTop: 6,
      paddingTop: 8,
      borderTopWidth: 1.5,
      borderTopColor: primary,
    },
    grandTotalLabel: { fontSize: 12, fontWeight: 700, color: "#111827" },
    grandTotalValue: { fontSize: 14, fontWeight: 700, color: primary },

    stepRow: { flexDirection: "row", marginBottom: 8, alignItems: "flex-start" },
    stepNumber: {
      width: 18,
      height: 18,
      borderRadius: 9,
      backgroundColor: primary,
      color: "#ffffff",
      fontSize: 9,
      fontWeight: 700,
      textAlign: "center",
      paddingTop: 4,
      marginRight: 8,
    },
    stepText: { fontSize: 10.5, color: "#374151", flex: 1, lineHeight: 1.5 },

    footer: {
      position: "absolute",
      bottom: 24,
      left: 48,
      right: 48,
      flexDirection: "row",
      justifyContent: "space-between",
      fontSize: 8,
      color: "#9ca3af",
      borderTopWidth: 0.5,
      borderTopColor: "#e5e7eb",
      paddingTop: 8,
    },
  });
}

function Footer({ businessName, primary }: { businessName: string; primary: string }) {
  const s = styles(primary);
  return (
    <View style={s.footer} fixed>
      <Text>{businessName}</Text>
      <Text render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
    </View>
  );
}

export function ProposalDocument({ proposal }: { proposal: PublicProposal }) {
  const primary = proposal.brand.primaryColor || brandDefault;
  const s = styles(primary);
  const businessName = proposal.brand.businessName || "Prospect AI";
  const discountAmount = proposal.subtotal - proposal.total;

  return (
    <Document title={`Proposta para ${proposal.leadName}`}>
      {/* Capa */}
      <Page size="A4" style={s.coverPage}>
        <View style={s.coverTop}>
          {proposal.brand.logoUrl ? (
            // eslint-disable-next-line jsx-a11y/alt-text
            <Image src={proposal.brand.logoUrl} style={s.logo} />
          ) : (
            <Text style={s.brandName}>{businessName}</Text>
          )}
        </View>
        <View style={s.coverTitleWrap}>
          <Text style={s.coverEyebrow}>PROPOSTA COMERCIAL</Text>
          <Text style={s.coverTitle}>{proposal.title}</Text>
          <Text style={s.coverClient}>Para {proposal.leadName}</Text>
        </View>
        <View style={s.coverFooter}>
          <Text>{formatDateOnly(proposal.createdAt.slice(0, 10))}</Text>
          {proposal.expiresAt && <Text>Válida até {formatDateOnly(proposal.expiresAt)}</Text>}
        </View>
      </Page>

      {/* Conteúdo */}
      <Page size="A4" style={s.page}>
        <Footer businessName={businessName} primary={primary} />

        {(proposal.diagnosis.situacaoAtual || proposal.diagnosis.oportunidades || proposal.diagnosis.solucaoProposta) && (
          <View>
            <Text style={s.sectionTitle}>Diagnóstico</Text>
            {proposal.diagnosis.situacaoAtual && (
              <>
                <Text style={s.subheading}>Situação atual</Text>
                <Text style={s.paragraph}>{proposal.diagnosis.situacaoAtual}</Text>
              </>
            )}
            {proposal.diagnosis.oportunidades && (
              <>
                <Text style={s.subheading}>Oportunidades</Text>
                <Text style={s.paragraph}>{proposal.diagnosis.oportunidades}</Text>
              </>
            )}
            {proposal.diagnosis.solucaoProposta && (
              <>
                <Text style={s.subheading}>Solução proposta</Text>
                <Text style={s.paragraph}>{proposal.diagnosis.solucaoProposta}</Text>
              </>
            )}
          </View>
        )}

        <Text style={[s.sectionTitle, { marginTop: 20 }]}>Escopo e investimento</Text>
        {proposal.scopeNotes && <Text style={s.paragraph}>{proposal.scopeNotes}</Text>}

        <View style={s.table}>
          <View style={s.tableHeaderRow}>
            <Text style={[s.th, s.colName]}>Item</Text>
            <Text style={[s.th, s.colQty]}>Qtd.</Text>
            <Text style={[s.th, s.colPrice]}>Valor unit.</Text>
            <Text style={[s.th, s.colTotal]}>Total</Text>
          </View>
          {proposal.items.map((item) => (
            <View key={item.id} style={s.tableRow}>
              <View style={s.colName}>
                <Text style={s.tdName}>{item.name}</Text>
                {item.description && <Text style={s.tdDesc}>{item.description}</Text>}
              </View>
              <Text style={[s.tdRight, s.colQty]}>{item.quantity}</Text>
              <Text style={[s.tdRight, s.colPrice]}>{formatCurrencyBRL(item.unitPrice)}</Text>
              <Text style={[s.tdRight, s.colTotal]}>{formatCurrencyBRL(item.total)}</Text>
            </View>
          ))}
        </View>

        <View style={s.totalsBox}>
          <View style={s.totalsRow}>
            <Text style={s.totalsLabel}>Subtotal</Text>
            <Text style={s.totalsValue}>{formatCurrencyBRL(proposal.subtotal)}</Text>
          </View>
          {discountAmount > 0 && (
            <View style={s.totalsRow}>
              <Text style={s.totalsLabel}>Desconto</Text>
              <Text style={s.totalsValue}>-{formatCurrencyBRL(discountAmount)}</Text>
            </View>
          )}
          <View style={s.grandTotalRow}>
            <Text style={s.grandTotalLabel}>Total</Text>
            <Text style={s.grandTotalValue}>{formatCurrencyBRL(proposal.total)}</Text>
          </View>
        </View>

        {(proposal.paymentTerms || proposal.timeline) && (
          <View style={{ marginTop: 20 }}>
            <Text style={s.sectionTitle}>Condições</Text>
            {proposal.paymentTerms && (
              <>
                <Text style={s.subheading}>Pagamento</Text>
                <Text style={s.paragraph}>{proposal.paymentTerms}</Text>
              </>
            )}
            {proposal.timeline && (
              <>
                <Text style={s.subheading}>Prazo estimado</Text>
                <Text style={s.paragraph}>{proposal.timeline}</Text>
              </>
            )}
          </View>
        )}

        {proposal.nextSteps.length > 0 && (
          <View style={{ marginTop: 20 }}>
            <Text style={s.sectionTitle}>Próximos passos</Text>
            {proposal.nextSteps.map((step, idx) => (
              <View key={idx} style={s.stepRow}>
                <Text style={s.stepNumber}>{idx + 1}</Text>
                <Text style={s.stepText}>{step}</Text>
              </View>
            ))}
          </View>
        )}

        {proposal.terms && (
          <View style={{ marginTop: 20 }}>
            <Text style={s.sectionTitle}>Termos e condições</Text>
            <Text style={s.paragraph}>{proposal.terms}</Text>
          </View>
        )}

        <View style={{ marginTop: 20 }}>
          <Text style={s.sectionTitle}>Contato</Text>
          {proposal.brand.businessName && <Text style={s.paragraph}>{proposal.brand.businessName}</Text>}
          {proposal.brand.contactPhone && <Text style={s.small}>Telefone: {proposal.brand.contactPhone}</Text>}
          {proposal.brand.contactEmail && <Text style={s.small}>E-mail: {proposal.brand.contactEmail}</Text>}
          {proposal.brand.socialLinks.map((link, idx) => (
            <Link key={idx} src={link.url} style={s.small}>
              {link.label}
            </Link>
          ))}
          <Text style={[s.small, { marginTop: 10 }]}>
            Esta proposta é válida por {proposal.validityDays} dias
            {proposal.expiresAt ? ` (até ${formatDateOnly(proposal.expiresAt)})` : ""}.
          </Text>
        </View>
      </Page>
    </Document>
  );
}
