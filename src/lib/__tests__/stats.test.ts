import { describe, expect, it } from "vitest";
import {
  computeApplicationsByMonth,
  computeAverageExpectedSalary,
  computeOverviewCounts,
  computeRates,
  computeWorkModelDistribution,
} from "@/lib/stats";
import type { ApplicationRow } from "@/types/database";

function buildApplication(overrides: Partial<ApplicationRow> = {}): ApplicationRow {
  return {
    id: Math.random().toString(36),
    user_id: "user-1",
    company_name: "Empresa",
    job_title: "Cargo",
    role_area: null,
    status: "applied",
    applied_date: "2026-01-15",
    expected_salary_min: null,
    expected_salary_max: null,
    salary_currency: "BRL",
    employment_type: null,
    work_model: null,
    location: null,
    job_url: null,
    job_description: null,
    recruiter_name: null,
    recruiter_email: null,
    recruiter_phone: null,
    interview_date: null,
    interview_notes: null,
    general_notes: null,
    is_favorite: false,
    priority: "medium",
    follow_up_date: null,
    created_at: "2026-01-15T00:00:00.000Z",
    updated_at: "2026-01-15T00:00:00.000Z",
    status_changed_at: "2026-01-01T00:00:00.000Z",
    auto_moved_at: null,
    ...overrides,
  };
}

describe("computeOverviewCounts", () => {
  it("tallies applications by status", () => {
    const apps = [
      buildApplication({ status: "applied" }),
      buildApplication({ status: "applied" }),
      buildApplication({ status: "interview" }),
      buildApplication({ status: "positive" }),
      buildApplication({ status: "negative" }),
      buildApplication({ status: "no_response" }),
    ];
    const counts = computeOverviewCounts(apps);
    expect(counts.total).toBe(6);
    expect(counts.applied).toBe(2);
    expect(counts.interview).toBe(1);
    expect(counts.positive).toBe(1);
    expect(counts.negative).toBe(1);
    expect(counts.noResponse).toBe(1);
    expect(counts.inProgress).toBe(3); // applied + interview
  });

  it("counts favorites and overdue follow-ups", () => {
    const apps = [
      buildApplication({ is_favorite: true }),
      buildApplication({ follow_up_date: "2020-01-01" }),
    ];
    const counts = computeOverviewCounts(apps);
    expect(counts.favorites).toBe(1);
    expect(counts.overdueFollowUps).toBe(1);
  });

  it("returns zeroed counts for an empty list", () => {
    const counts = computeOverviewCounts([]);
    expect(counts.total).toBe(0);
    expect(counts.applied).toBe(0);
  });
});

describe("computeRates", () => {
  it("computes interview/response/positive rates as percentages", () => {
    const apps = [
      buildApplication({ status: "applied" }),
      buildApplication({ status: "interview" }),
      buildApplication({ status: "positive" }),
      buildApplication({ status: "negative" }),
    ];
    const rates = computeRates(apps);
    // interview, positive, negative all count as "reached interview" => 3/4 = 75%
    expect(rates.interviewRate).toBe(75);
    expect(rates.responseRate).toBe(75);
    expect(rates.positiveRate).toBe(25);
  });

  it("returns zero rates for an empty list", () => {
    expect(computeRates([])).toEqual({ interviewRate: 0, responseRate: 0, positiveRate: 0 });
  });
});

describe("computeAverageExpectedSalary", () => {
  it("averages the midpoint of min/max salary across applications", () => {
    const apps = [
      buildApplication({ expected_salary_min: 1000, expected_salary_max: 2000 }),
      buildApplication({ expected_salary_min: 4000, expected_salary_max: 4000 }),
    ];
    expect(computeAverageExpectedSalary(apps)).toBe((1500 + 4000) / 2);
  });

  it("returns null when no salary data is available", () => {
    expect(computeAverageExpectedSalary([buildApplication()])).toBeNull();
  });
});

describe("computeWorkModelDistribution", () => {
  it("groups by work model, ignoring nulls", () => {
    const apps = [
      buildApplication({ work_model: "remote" }),
      buildApplication({ work_model: "remote" }),
      buildApplication({ work_model: "hybrid" }),
      buildApplication({ work_model: null }),
    ];
    const distribution = computeWorkModelDistribution(apps);
    expect(distribution).toEqual([
      { key: "remote", count: 2 },
      { key: "hybrid", count: 1 },
    ]);
  });
});

describe("computeApplicationsByMonth", () => {
  it("groups applications by applied_date month", () => {
    const apps = [
      buildApplication({ applied_date: "2026-01-05" }),
      buildApplication({ applied_date: "2026-01-20" }),
      buildApplication({ applied_date: "2026-02-01" }),
    ];
    const series = computeApplicationsByMonth(apps);
    expect(series).toEqual([
      { period: "2026-01", count: 2 },
      { period: "2026-02", count: 1 },
    ]);
  });
});
