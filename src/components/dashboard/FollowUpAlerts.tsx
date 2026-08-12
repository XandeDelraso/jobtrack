import { AlarmClock, CalendarClock } from "lucide-react";
import type { ApplicationRow } from "@/types/database";
import { isDateToday, isDateTodayOrPast, formatDate, formatDateTime } from "@/lib/utils";
import { useUIStore } from "@/store/uiStore";

export function FollowUpAlerts({ applications }: { applications: ApplicationRow[] }) {
  const openDetail = useUIStore((s) => s.openDetail);

  const overdueFollowUps = applications.filter(
    (a) => a.follow_up_date && isDateTodayOrPast(a.follow_up_date)
  );
  const todaysInterviews = applications.filter((a) => a.interview_date && isDateToday(a.interview_date));

  if (overdueFollowUps.length === 0 && todaysInterviews.length === 0) return null;

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {todaysInterviews.length > 0 && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-3">
          <div className="mb-2 flex items-center gap-1.5 text-sm font-medium text-amber-700 dark:text-amber-300">
            <CalendarClock className="h-4 w-4" />
            Entrevistas hoje
          </div>
          <ul className="space-y-1.5">
            {todaysInterviews.map((app) => (
              <li key={app.id}>
                <button
                  onClick={() => openDetail(app.id)}
                  className="text-left text-sm text-foreground hover:underline"
                >
                  {app.company_name} · {formatDateTime(app.interview_date)}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {overdueFollowUps.length > 0 && (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/5 p-3">
          <div className="mb-2 flex items-center gap-1.5 text-sm font-medium text-rose-700 dark:text-rose-300">
            <AlarmClock className="h-4 w-4" />
            Follow-ups pendentes
          </div>
          <ul className="space-y-1.5">
            {overdueFollowUps.map((app) => (
              <li key={app.id}>
                <button
                  onClick={() => openDetail(app.id)}
                  className="text-left text-sm text-foreground hover:underline"
                >
                  {app.company_name} · marcado para {formatDate(app.follow_up_date)}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
