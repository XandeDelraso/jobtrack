import type { ApplicationStatus, EmploymentType, WorkModel } from "@/types/database";

export const STATUS_CHART_COLORS: Record<ApplicationStatus, string> = {
  applied: "#0ea5e9",
  interview: "#f59e0b",
  no_response: "#94a3b8",
  positive: "#10b981",
  negative: "#f43f5e",
};

export const WORK_MODEL_CHART_COLORS: Record<WorkModel, string> = {
  remote: "#6366f1",
  hybrid: "#f59e0b",
  onsite: "#0ea5e9",
};

export const EMPLOYMENT_TYPE_CHART_COLORS: Record<EmploymentType, string> = {
  clt: "#6366f1",
  pj: "#0ea5e9",
  internship: "#f59e0b",
  freelance: "#10b981",
  other: "#94a3b8",
};

export const CHART_PALETTE = ["#6366f1", "#0ea5e9", "#f59e0b", "#10b981", "#f43f5e", "#94a3b8"];
