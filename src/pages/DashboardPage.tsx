import * as React from "react";
import {
  AlertCircle,
  Briefcase,
  CheckCircle2,
  Inbox,
  MessagesSquare,
  Plus,
  Send,
  XCircle,
} from "lucide-react";
import { useApplications } from "@/hooks/useApplications";
import { KanbanBoard } from "@/components/kanban/KanbanBoard";
import { FiltersBar } from "@/components/applications/FiltersBar";
import { StatCard } from "@/components/dashboard/StatCard";
import { FollowUpAlerts } from "@/components/dashboard/FollowUpAlerts";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { computeOverviewCounts } from "@/lib/stats";
import { applyFilters, useFilterStore } from "@/store/filterStore";
import { useUIStore } from "@/store/uiStore";

function KanbanSkeleton() {
  return (
    <div className="flex h-full gap-3 overflow-hidden pb-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="w-[300px] shrink-0 space-y-2 rounded-xl bg-muted/50 p-3">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-24 w-full rounded-lg" />
          <Skeleton className="h-24 w-full rounded-lg" />
        </div>
      ))}
    </div>
  );
}

export function DashboardPage() {
  const { data: applications, isLoading, isError, error, refetch } = useApplications();
  const openCreateForm = useUIStore((s) => s.openCreateForm);
  const filters = useFilterStore();

  const filteredApplications = React.useMemo(
    () => applyFilters(applications ?? [], filters),
    [applications, filters]
  );

  const counts = React.useMemo(() => computeOverviewCounts(applications ?? []), [applications]);

  return (
    <div className="flex h-full flex-col gap-4 p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">Suas candidaturas</h1>
          <p className="text-sm text-muted-foreground">
            Acompanhe cada processo seletivo do envio do currículo até o retorno final.
          </p>
        </div>
      </div>

      {isError ? (
        <EmptyState
          icon={AlertCircle}
          title="Não foi possível carregar suas candidaturas"
          description={error instanceof Error ? error.message : "Tente novamente em instantes."}
          action={<Button onClick={() => refetch()}>Tentar novamente</Button>}
        />
      ) : isLoading ? (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-[68px] rounded-xl" />
            ))}
          </div>
          <KanbanSkeleton />
        </>
      ) : (applications ?? []).length === 0 ? (
        <EmptyState
          icon={Inbox}
          title="Nenhuma candidatura cadastrada ainda"
          description="Adicione a primeira vaga que você aplicou para começar a acompanhar seu processo seletivo."
          action={
            <Button onClick={openCreateForm}>
              <Plus className="h-4 w-4" />
              Adicionar candidatura
            </Button>
          }
        />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            <StatCard label="Total" value={counts.total} icon={Briefcase} />
            <StatCard label="Enviadas" value={counts.applied} icon={Send} accentClass="bg-sky-500/10 text-sky-600" />
            <StatCard
              label="Entrevistas"
              value={counts.interview}
              icon={MessagesSquare}
              accentClass="bg-amber-500/10 text-amber-600"
            />
            <StatCard
              label="Sem retorno"
              value={counts.noResponse}
              icon={Inbox}
              accentClass="bg-slate-500/10 text-slate-600"
            />
            <StatCard
              label="Retorno positivo"
              value={counts.positive}
              icon={CheckCircle2}
              accentClass="bg-emerald-500/10 text-emerald-600"
            />
            <StatCard
              label="Retorno negativo"
              value={counts.negative}
              icon={XCircle}
              accentClass="bg-rose-500/10 text-rose-600"
            />
          </div>

          <FollowUpAlerts applications={applications ?? []} />

          <div className="flex flex-wrap items-center justify-between gap-3">
            <FiltersBar />
            {filteredApplications.length !== (applications ?? []).length && (
              <p className="text-xs text-muted-foreground">
                Mostrando {filteredApplications.length} de {(applications ?? []).length} candidaturas
              </p>
            )}
          </div>

          {filteredApplications.length === 0 ? (
            <EmptyState
              icon={Inbox}
              title="Nenhuma candidatura encontrada"
              description="Ajuste a busca ou os filtros para ver mais resultados."
              action={
                <Button variant="outline" onClick={filters.reset}>
                  Limpar filtros
                </Button>
              }
            />
          ) : (
            <div className="min-h-0 flex-1">
              <KanbanBoard applications={filteredApplications} />
            </div>
          )}
        </>
      )}
    </div>
  );
}
