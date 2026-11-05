import { History } from "lucide-react";
import { useApplicationHistory } from "@/hooks/useApplications";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { cn, formatDateTime } from "@/lib/utils";

export function HistoryTimeline({ applicationId }: { applicationId: string }) {
  const { data: history, isLoading } = useApplicationHistory(applicationId);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex gap-3">
            <Skeleton className="h-2.5 w-2.5 shrink-0 rounded-full mt-1.5" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-3.5 w-2/3" />
              <Skeleton className="h-3 w-1/3" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!history || history.length === 0) {
    return (
      <EmptyState
        icon={History}
        title="Sem histórico ainda"
        description="As mudanças desta candidatura aparecerão aqui."
      />
    );
  }

  return (
    <ol className="relative space-y-5 border-l border-border pl-5">
      {history.map((entry) => (
        <li key={entry.id} className="relative">
          <span
            className={cn(
              "absolute -left-[25px] top-1 h-2.5 w-2.5 rounded-full border-2 border-background",
              entry.event_type === "status_auto_changed" ? "bg-slate-400" : "bg-primary"
            )}
          />
          <p className="text-sm text-foreground">
            {entry.description}
            {entry.event_type === "status_auto_changed" && (
              <span className="ml-1.5 rounded-full bg-slate-500/10 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                automático
              </span>
            )}
          </p>
          <p className="text-xs text-muted-foreground">{formatDateTime(entry.created_at)}</p>
        </li>
      ))}
    </ol>
  );
}
