import { describe, expect, it } from "vitest";
import { applicationsToCsv } from "@/lib/csv";
import type { ApplicationRow } from "@/types/database";

const BOM = String.fromCharCode(0xfeff);

function buildApplication(overrides: Partial<ApplicationRow> = {}): ApplicationRow {
  return {
    id: "1",
    user_id: "user-1",
    company_name: "Google",
    job_title: "Software Engineer",
    role_area: "Backend",
    status: "applied",
    applied_date: "2026-01-01",
    expected_salary_min: 8000,
    expected_salary_max: 12000,
    salary_currency: "BRL",
    employment_type: "clt",
    work_model: "remote",
    location: "São Paulo, SP",
    job_url: "https://example.com/vaga",
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
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

function stripBom(value: string): string {
  return value.startsWith(BOM) ? value.slice(BOM.length) : value;
}

describe("applicationsToCsv", () => {
  it("includes a header row and one data row per application", () => {
    const csv = applicationsToCsv([buildApplication()]);
    const lines = stripBom(csv).split("\r\n");
    expect(lines).toHaveLength(2);
    expect(lines[0]).toContain("Empresa");
    expect(lines[1]).toContain("Google");
  });

  it("escapes fields containing commas or quotes", () => {
    const csv = applicationsToCsv([
      buildApplication({ job_title: 'Engenheiro, Backend "Sênior"' }),
    ]);
    expect(csv).toContain('"Engenheiro, Backend ""Sênior"""');
  });

  it("translates status to the Portuguese label", () => {
    const csv = applicationsToCsv([buildApplication({ status: "positive" })]);
    expect(csv).toContain("Retorno positivo");
  });

  it("produces an empty-data CSV (header only) for an empty list", () => {
    const csv = applicationsToCsv([]);
    const lines = stripBom(csv).split("\r\n");
    expect(lines).toHaveLength(1);
  });
});
