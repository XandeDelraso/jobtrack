import * as React from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import type { ApplicationRow, ApplicationStatus } from "@/types/database";
import { STATUS_META, STATUS_ORDER } from "@/lib/statuses";
import { KanbanColumn } from "@/components/kanban/KanbanColumn";
import { ApplicationCard } from "@/components/kanban/ApplicationCard";
import { useUpdateApplicationStatus } from "@/hooks/useApplications";

export function KanbanBoard({ applications }: { applications: ApplicationRow[] }) {
  const [activeApplication, setActiveApplication] = React.useState<ApplicationRow | null>(null);
  const updateStatus = useUpdateApplicationStatus();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } })
  );

  const grouped = React.useMemo(() => {
    const map = new Map<ApplicationStatus, ApplicationRow[]>();
    for (const status of STATUS_ORDER) map.set(status, []);
    for (const app of applications) {
      map.get(app.status)?.push(app);
    }
    return map;
  }, [applications]);

  function handleDragStart(event: DragStartEvent) {
    const app = applications.find((a) => a.id === event.active.id);
    setActiveApplication(app ?? null);
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveApplication(null);
    const { active, over } = event;
    if (!over) return;

    const newStatus = over.id as ApplicationStatus;
    const application = applications.find((a) => a.id === active.id);
    if (!application || application.status === newStatus) return;

    updateStatus.mutate({ id: application.id, status: newStatus });
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActiveApplication(null)}
    >
      <div className="scrollbar-thin flex h-full gap-3 overflow-x-auto pb-3">
        {STATUS_ORDER.map((status) => (
          <KanbanColumn
            key={status}
            meta={STATUS_META[status]}
            applications={grouped.get(status) ?? []}
          />
        ))}
      </div>
      <DragOverlay>
        {activeApplication && (
          <div className="w-[280px] rotate-2 opacity-95">
            <ApplicationCard application={activeApplication} />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}
