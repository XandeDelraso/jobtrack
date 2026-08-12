import * as React from "react";
import { AlertCircle, BarChart3, DollarSign, TrendingUp } from "lucide-react";
import { useApplications } from "@/hooks/useApplications";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/dashboard/StatCard";
import { ApplicationsOverTimeChart } from "@/components/stats/ApplicationsOverTimeChart";
import { RatesPanel } from "@/components/stats/RatesPanel";
import { DistributionDonutChart } from "@/components/stats/DistributionDonutChart";
import {
  computeApplicationsByMonth,
  computeAverageExpectedSalary,
  computeEmploymentTypeDistribution,
  computeOverviewCounts,
  computeRates,
  computeWorkModelDistribution,
} from "@/lib/stats";
import { EMPLOYMENT_TYPE_CHART_COLORS, WORK_MODEL_CHART_COLORS } from "@/lib/chart-colors";
import { EMPLOYMENT_TYPE_LABELS, WORK_MODEL_LABELS } from "@/lib/statuses";
import { formatSalaryRange } from "@/lib/utils";
import type { EmploymentType, WorkModel } from "@/types/database";

export function StatsPage() {
  const { data: applications, isLoading, isError, error, refetch } = useApplications();

  const stats = React.useMemo(() => {
    const apps = applications ?? [];
    return {
      overview: computeOverviewCounts(apps),
      rates: computeRates(apps),
      timeSeries: computeApplicationsByMonth(apps),
      workModel: computeWorkModelDistribution(apps),
      employmentType: computeEmploymentTypeDistribution(apps),
      avgSalary: computeAverageExpectedSalary(apps),
    };
  }, [applications]);

  if (isError) {
    return (
      <div className="p-6">
        <EmptyState
          icon={AlertCircle}
          title="Não foi possível carregar as estatísticas"
          description={error instanceof Error ? error.message : "Tente novamente em instantes."}
          action={<Button onClick={() => refetch()}>Tentar novamente</Button>}
        />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-4 p-4 sm:p-6">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-[68px] rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Skeleton className="h-72 rounded-xl" />
          <Skeleton className="h-72 rounded-xl" />
        </div>
      </div>
    );
  }

  if ((applications ?? []).length === 0) {
    return (
      <div className="p-6">
        <EmptyState
          icon={BarChart3}
          title="Ainda não há dados suficientes"
          description="Adicione candidaturas para ver estatísticas sobre sua busca por emprego."
        />
      </div>
    );
  }

  const workModelData = stats.workModel.map((entry) => ({
    name: WORK_MODEL_LABELS[entry.key as WorkModel],
    value: entry.count,
    color: WORK_MODEL_CHART_COLORS[entry.key as WorkModel],
  }));

  const employmentTypeData = stats.employmentType.map((entry) => ({
    name: EMPLOYMENT_TYPE_LABELS[entry.key as EmploymentType],
    value: entry.count,
    color: EMPLOYMENT_TYPE_CHART_COLORS[entry.key as EmploymentType],
  }));

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <div>
        <h1 className="text-lg font-semibold tracking-tight">Estatísticas</h1>
        <p className="text-sm text-muted-foreground">
          Entenda como está a sua busca por emprego e onde focar seus esforços.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Candidaturas em andamento" value={stats.overview.inProgress} icon={TrendingUp} />
        <StatCard
          label="Entrevistas nos próx. 7 dias"
          value={stats.overview.upcomingInterviews}
          icon={BarChart3}
          accentClass="bg-amber-500/10 text-amber-600"
        />
        <StatCard
          label="Follow-ups pendentes"
          value={stats.overview.overdueFollowUps}
          icon={AlertCircle}
          accentClass="bg-rose-500/10 text-rose-600"
        />
        <StatCard
          label="Salário médio esperado"
          value={stats.avgSalary ? formatSalaryRange(stats.avgSalary, stats.avgSalary) : "—"}
          icon={DollarSign}
          accentClass="bg-emerald-500/10 text-emerald-600"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ApplicationsOverTimeChart data={stats.timeSeries} />
        <RatesPanel rates={stats.rates} />
        <DistributionDonutChart
          title="Distribuição por modelo de trabalho"
          data={workModelData}
        />
        <DistributionDonutChart
          title="Distribuição por tipo de contratação"
          data={employmentTypeData}
        />
      </div>
    </div>
  );
}
