import { describe, expect, it } from "vitest";
import { applyFilters, countActiveFilters, EMPTY_FILTERS } from "@/store/filterStore";

const applications = [
  {
    company_name: "Google",
    job_title: "Software Engineer",
    role_area: "Backend",
    location: "São Paulo, SP",
    status: "applied" as const,
    work_model: "remote" as const,
    employment_type: "clt" as const,
    priority: "high" as const,
    is_favorite: true,
    applied_date: "2026-01-10",
  },
  {
    company_name: "Microsoft",
    job_title: "Product Manager",
    role_area: null,
    location: "Remoto",
    status: "interview" as const,
    work_model: "hybrid" as const,
    employment_type: "pj" as const,
    priority: "medium" as const,
    is_favorite: false,
    applied_date: "2026-02-01",
  },
];

describe("applyFilters", () => {
  it("returns everything when filters are empty", () => {
    expect(applyFilters(applications, EMPTY_FILTERS)).toHaveLength(2);
  });

  it("filters by free-text search across company/job/role/location", () => {
    expect(applyFilters(applications, { ...EMPTY_FILTERS, search: "product" })).toHaveLength(1);
    expect(applyFilters(applications, { ...EMPTY_FILTERS, search: "são paulo" })).toHaveLength(1);
    expect(applyFilters(applications, { ...EMPTY_FILTERS, search: "nonexistent" })).toHaveLength(0);
  });

  it("filters by status", () => {
    const result = applyFilters(applications, { ...EMPTY_FILTERS, statuses: ["interview"] });
    expect(result).toHaveLength(1);
    expect(result[0].company_name).toBe("Microsoft");
  });

  it("filters by favorites only", () => {
    const result = applyFilters(applications, { ...EMPTY_FILTERS, favoritesOnly: true });
    expect(result).toHaveLength(1);
    expect(result[0].company_name).toBe("Google");
  });

  it("filters by date range", () => {
    const result = applyFilters(applications, {
      ...EMPTY_FILTERS,
      dateFrom: "2026-02-01",
      dateTo: "2026-02-28",
    });
    expect(result).toHaveLength(1);
    expect(result[0].company_name).toBe("Microsoft");
  });

  it("combines multiple filters with AND semantics", () => {
    const result = applyFilters(applications, {
      ...EMPTY_FILTERS,
      workModels: ["remote"],
      priorities: ["high"],
    });
    expect(result).toHaveLength(1);
    expect(result[0].company_name).toBe("Google");
  });
});

describe("countActiveFilters", () => {
  it("returns 0 for the empty filter state", () => {
    expect(countActiveFilters(EMPTY_FILTERS)).toBe(0);
  });

  it("counts each active filter group once", () => {
    const count = countActiveFilters({
      ...EMPTY_FILTERS,
      statuses: ["applied", "interview"],
      favoritesOnly: true,
    });
    expect(count).toBe(3); // 2 statuses + favorites
  });
});
