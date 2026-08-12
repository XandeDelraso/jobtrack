import type { RateStats } from "@/lib/stats";
import { ChartCard } from "@/components/stats/ChartCard";
import { cn } from "@/lib/utils";

function RateBar({ label, value, colorClass }: { label: string; value: number; colorClass: string }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-semibold text-foreground">{value}%</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={cn("h-full rounded-full transition-all", colorClass)}
          style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        />
      </div>
    </div>
  );
}

export function RatesPanel({ rates }: { rates: RateStats }) {
  return (
    <ChartCard
      title="Taxas de conversão"
      description="Proporção das candidaturas que avançam em cada etapa"
    >
      <div className="space-y-4">
        <RateBar label="Taxa de entrevista" value={rates.interviewRate} colorClass="bg-amber-500" />
        <RateBar label="Taxa de resposta" value={rates.responseRate} colorClass="bg-sky-500" />
        <RateBar label="Taxa de retorno positivo" value={rates.positiveRate} colorClass="bg-emerald-500" />
      </div>
    </ChartCard>
  );
}
