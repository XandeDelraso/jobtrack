import type { ApplicationRow, EmploymentType, WorkModel } from "@/types/database";
import { isDateTodayOrPast } from "@/lib/utils";

export interface OverviewCounts {
  total: number;
  applied: number;
  interview: number;
  noResponse: number;
  positive: number;
  negative: number;
  favorites: number;
  inProgress: number;
  overdueFollowUps: number;
  upcomingInterviews: number;
}

export function computeOverviewCounts(applications: ApplicationRow[]): OverviewCounts {
  const counts: OverviewCounts = {
    total: applications.length,
    applied: 0,
    interview: 0,
    noResponse: 0,
    positive: 0,
    negative: 0,
    favorites: 0,
    inProgress: 0,
    overdueFollowUps: 0,
    upcomingInterviews: 0,
  };

  const now = Date.now();
  const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;

  for (const app of applications) {
    switch (app.status) {
      case "applied":
        counts.applied++;
        break;
      case "interview":
        counts.interview++;
        break;
      case "no_response":
        counts.noResponse++;
        break;
      case "positive":
        counts.positive++;
        break;
      case "negative":
        counts.negative++;
        break;
    }

    if (app.status === "applied" || app.status === "interview") {
      counts.inProgress++;
    }

    if (app.is_favorite) counts.favorites++;

    if (app.follow_up_date && isDateTodayOrPast(app.follow_up_date)) {
      counts.overdueFollowUps++;
    }

    if (app.interview_date) {
      const diff = new Date(app.interview_date).getTime() - now;
      if (diff >= 0 && diff <= sevenDaysMs) {
        counts.upcomingInterviews++;
      }
    }
  }

  return counts;
}

export interface RateStats {
  interviewRate: number; // % de candidaturas que chegaram a entrevista
  responseRate: number; // % de candidaturas com qualquer retorno (não "sem retorno")
  positiveRate: number; // % de candidaturas finalizadas com retorno positivo
}

export function computeRates(applications: ApplicationRow[]): RateStats {
  const total = applications.length;
  if (total === 0) {
    return { interviewRate: 0, responseRate: 0, positiveRate: 0 };
  }

  const withInterview = applications.filter(
    (a) => a.status === "interview" || a.status === "positive" || a.status === "negative"
  ).length;
  const withResponse = applications.filter((a) => a.status !== "applied" && a.status !== "no_response").length;
  const positive = applications.filter((a) => a.status === "positive").length;

  return {
    interviewRate: Math.round((withInterview / total) * 100),
    responseRate: Math.round((withResponse / total) * 100),
    positiveRate: Math.round((positive / total) * 100),
  };
}

export interface DistributionEntry<T extends string> {
  key: T;
  count: number;
}

export function computeDistribution<T extends string>(
  applications: ApplicationRow[],
  field: keyof ApplicationRow
): DistributionEntry<T>[] {
  const map = new Map<string, number>();
  for (const app of applications) {
    const value = app[field];
    if (!value) continue;
    const key = String(value);
    map.set(key, (map.get(key) ?? 0) + 1);
  }
  return Array.from(map.entries())
    .map(([key, count]) => ({ key: key as T, count }))
    .sort((a, b) => b.count - a.count);
}

export function computeWorkModelDistribution(applications: ApplicationRow[]) {
  return computeDistribution<WorkModel>(applications, "work_model");
}

export function computeEmploymentTypeDistribution(applications: ApplicationRow[]) {
  return computeDistribution<EmploymentType>(applications, "employment_type");
}

export function computeAverageExpectedSalary(applications: ApplicationRow[]): number | null {
  const values: number[] = [];
  for (const app of applications) {
    if (app.expected_salary_min != null && app.expected_salary_max != null) {
      values.push((app.expected_salary_min + app.expected_salary_max) / 2);
    } else if (app.expected_salary_min != null) {
      values.push(app.expected_salary_min);
    } else if (app.expected_salary_max != null) {
      values.push(app.expected_salary_max);
    }
  }
  if (values.length === 0) return null;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

export interface TimeSeriesPoint {
  period: string; // "YYYY-MM"
  count: number;
}

export function computeApplicationsByMonth(applications: ApplicationRow[]): TimeSeriesPoint[] {
  const map = new Map<string, number>();
  for (const app of applications) {
    const period = app.applied_date.slice(0, 7); // YYYY-MM
    map.set(period, (map.get(period) ?? 0) + 1);
  }
  return Array.from(map.entries())
    .map(([period, count]) => ({ period, count }))
    .sort((a, b) => a.period.localeCompare(b.period));
}
