import { useDroppable } from "@dnd-kit/core";
import { Inbox } from "lucide-react";
import type { ApplicationRow } from "@/types/database";
import type { StatusMeta } from "@/lib/statuses";
import { ApplicationCard } from "@/components/kanban/ApplicationCard";
import { cn } from "@/lib/utils";

export function KanbanColumn({
  meta,
  applications,
}: {
  meta: StatusMeta;
  applications: ApplicationRow[];
}) {
  const { setNodeRef, isOver } = useDroppable({ id: meta.value });

  return (
    <div className="flex h-full w-[300px] shrink-0 flex-col rounded-xl bg-muted/50">
      <div className="flex items-center gap-2 px-3 pb-2 pt-3">
        <span className={cn("h-2 w-2 rounded-full", meta.dotClass)} />
        <h3 className="text-sm font-semibold text-foreground">{meta.label}</h3>
        <span className="ml-auto rounded-full bg-background px-2 py-0.5 text-xs font-medium text-muted-foreground shadow-sm">
          {applications.length}
        </span>
      </div>
      <div
        ref={setNodeRef}
        className={cn(
          "scrollbar-thin flex-1 space-y-2 overflow-y-auto rounded-lg p-2 pt-0 transition-colors min-h-[200px]",
          isOver && "bg-primary/5 ring-2 ring-inset ring-primary/30"
        )}
      >
        {applications.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-10 text-center text-xs text-muted-foreground">
            <Inbox className="h-5 w-5" />
            Nenhuma candidatura
          </div>
        ) : (
          applications.map((application) => (
            <ApplicationCard key={application.id} application={application} />
          ))
        )}
      </div>
    </div>
  );
}
