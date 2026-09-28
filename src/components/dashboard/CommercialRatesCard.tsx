import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import type { CommercialRates } from "@/types/lead";

function RateTile({ label, rate }: { label: string; rate: CommercialRates["contactRate"] }) {
  return (
    <div>
      <p className="text-[13px] text-muted">{label}</p>
      {rate.value === null ? (
        <p className="mt-1 text-sm text-muted">Dados insuficientes para calcular.</p>
      ) : (
        <>
          <p className="mt-1 text-2xl font-semibold tracking-tight text-foreground">{rate.value}%</p>
          <p className="text-[11px] text-muted">
            {rate.numerator} de {rate.denominator}
          </p>
        </>
      )}
    </div>
  );
}

export function CommercialRatesCard({ rates }: { rates: CommercialRates }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Taxas comerciais</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <RateTile label="Taxa de contato" rate={rates.contactRate} />
        <RateTile label="Taxa de resposta" rate={rates.responseRate} />
        <RateTile label="Taxa de reunião" rate={rates.meetingRate} />
        <RateTile label="Conversão" rate={rates.conversionRate} />
      </CardContent>
    </Card>
  );
}
