import { create } from "zustand";
import type { ApplicationStatus, EmploymentType, PriorityLevel, WorkModel } from "@/types/database";

export interface ApplicationFilters {
  search: string;
  statuses: ApplicationStatus[];
  workModels: WorkModel[];
  employmentTypes: EmploymentType[];
  favoritesOnly: boolean;
  priorities: PriorityLevel[];
  dateFrom: string | null;
  dateTo: string | null;
}

export const EMPTY_FILTERS: ApplicationFilters = {
  search: "",
  statuses: [],
  workModels: [],
  employmentTypes: [],
  favoritesOnly: false,
  priorities: [],
  dateFrom: null,
  dateTo: null,
};

interface FilterState extends ApplicationFilters {
  setSearch: (search: string) => void;
  toggleStatus: (status: ApplicationStatus) => void;
  toggleWorkModel: (model: WorkModel) => void;
  toggleEmploymentType: (type: EmploymentType) => void;
  togglePriority: (priority: PriorityLevel) => void;
  setFavoritesOnly: (value: boolean) => void;
  setDateRange: (from: string | null, to: string | null) => void;
  reset: () => void;
}

function toggleInArray<T>(array: T[], value: T): T[] {
  return array.includes(value) ? array.filter((item) => item !== value) : [...array, value];
}

export const useFilterStore = create<FilterState>((set) => ({
  ...EMPTY_FILTERS,
  setSearch: (search) => set({ search }),
  toggleStatus: (status) => set((state) => ({ statuses: toggleInArray(state.statuses, status) })),
  toggleWorkModel: (model) => set((state) => ({ workModels: toggleInArray(state.workModels, model) })),
  toggleEmploymentType: (type) =>
    set((state) => ({ employmentTypes: toggleInArray(state.employmentTypes, type) })),
  togglePriority: (priority) => set((state) => ({ priorities: toggleInArray(state.priorities, priority) })),
  setFavoritesOnly: (value) => set({ favoritesOnly: value }),
  setDateRange: (from, to) => set({ dateFrom: from, dateTo: to }),
  reset: () => set(EMPTY_FILTERS),
}));

export function countActiveFilters(filters: ApplicationFilters): number {
  let count = 0;
  count += filters.statuses.length;
  count += filters.workModels.length;
  count += filters.employmentTypes.length;
  count += filters.priorities.length;
  if (filters.favoritesOnly) count++;
  if (filters.dateFrom || filters.dateTo) count++;
  return count;
}

export function applyFilters<
  T extends {
    company_name: string;
    job_title: string;
    role_area: string | null;
    location: string | null;
    status: ApplicationStatus;
    work_model: WorkModel | null;
    employment_type: EmploymentType | null;
    priority: PriorityLevel;
    is_favorite: boolean;
    applied_date: string;
  }
>(applications: T[], filters: ApplicationFilters): T[] {
  const search = filters.search.trim().toLowerCase();

  return applications.filter((app) => {
    if (search) {
      const haystack = [app.company_name, app.job_title, app.role_area, app.location]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(search)) return false;
    }

    if (filters.statuses.length > 0 && !filters.statuses.includes(app.status)) return false;
    if (filters.workModels.length > 0 && (!app.work_model || !filters.workModels.includes(app.work_model)))
      return false;
    if (
      filters.employmentTypes.length > 0 &&
      (!app.employment_type || !filters.employmentTypes.includes(app.employment_type))
    )
      return false;
    if (filters.priorities.length > 0 && !filters.priorities.includes(app.priority)) return false;
    if (filters.favoritesOnly && !app.is_favorite) return false;
    if (filters.dateFrom && app.applied_date < filters.dateFrom) return false;
    if (filters.dateTo && app.applied_date > filters.dateTo) return false;

    return true;
  });
}
