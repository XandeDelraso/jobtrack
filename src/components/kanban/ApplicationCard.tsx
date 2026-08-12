import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { CalendarClock, Star, MapPin, AlarmClock } from "lucide-react";
import type { ApplicationRow } from "@/types/database";
import { PRIORITY_META, WORK_MODEL_LABELS } from "@/lib/statuses";
import { formatDate, formatSalaryRange, isDateToday, isDateTodayOrPast } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/store/uiStore";

export function ApplicationCard({ application }: { application: ApplicationRow }) {
  const openDetail = useUIStore((s) => s.openDetail);
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: application.id,
    data: { status: application.status },
  });

  const style = transform
    ? { transform: CSS.Translate.toString(transform) }
    : undefined;

  const followUpDue = isDateTodayOrPast(application.follow_up_date);
  const interviewToday = isDateToday(application.interview_date);
  const priorityMeta = PRIORITY_META[application.priority];

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      onClick={() => openDetail(application.id)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter") openDetail(application.id);
      }}
      className={cn(
        "group cursor-grab select-none rounded-lg border border-border bg-card p-3 shadow-sm transition-shadow hover:shadow-md active:cursor-grabbing",
        isDragging && "opacity-40"
      )}
    >
      <div className="mb-1.5 flex items-start justify-between gap-2">
        <p className="text-sm font-semibold leading-tight text-foreground">
          {application.company_name}
        </p>
        <div className="flex shrink-0 items-center gap-1.5">
          {application.priority === "high" && (
            <span
              className={cn("h-1.5 w-1.5 rounded-full", priorityMeta.dotClass)}
              title="Prioridade alta"
            />
          )}
          {application.is_favorite && (
            <Star className="h-3.5 w-3.5 fill-warning text-warning" aria-label="Favorita" />
          )}
        </div>
      </div>

      <p className="mb-2 line-clamp-2 text-sm text-muted-foreground">{application.job_title}</p>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          <CalendarClock className="h-3 w-3" />
          {formatDate(application.applied_date)}
        </span>
        {application.location && (
          <span className="inline-flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            {application.location}
          </span>
        )}
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        {application.work_model && (
          <span className="rounded-full bg-secondary px-2 py-0.5 text-[11px] font-medium text-secondary-foreground">
            {WORK_MODEL_LABELS[application.work_model]}
          </span>
        )}
        {(application.expected_salary_min || application.expected_salary_max) && (
          <span className="rounded-full bg-secondary px-2 py-0.5 text-[11px] font-medium text-secondary-foreground">
            {formatSalaryRange(
              application.expected_salary_min,
              application.expected_salary_max,
              application.salary_currency
            )}
          </span>
        )}
      </div>

      {(followUpDue || interviewToday) && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {interviewToday && (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[11px] font-medium text-amber-700 dark:text-amber-300">
              <CalendarClock className="h-3 w-3" /> Entrevista hoje
            </span>
          )}
          {followUpDue && (
            <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/10 px-2 py-0.5 text-[11px] font-medium text-rose-700 dark:text-rose-300">
              <AlarmClock className="h-3 w-3" /> Follow-up pendente
            </span>
          )}
        </div>
      )}
    </div>
  );
}
