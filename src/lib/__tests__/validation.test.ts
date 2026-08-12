import { describe, expect, it } from "vitest";
import {
  applicationFormSchema,
  loginSchema,
  signupSchema,
} from "@/lib/validation";

const baseApplication = {
  companyName: "Google",
  jobTitle: "Software Engineer",
  status: "applied" as const,
  appliedDate: "2026-01-01",
  salaryCurrency: "BRL",
  isFavorite: false,
  priority: "medium" as const,
};

describe("applicationFormSchema", () => {
  it("accepts a minimal valid application", () => {
    const result = applicationFormSchema.safeParse(baseApplication);
    expect(result.success).toBe(true);
  });

  it("requires company name", () => {
    const result = applicationFormSchema.safeParse({ ...baseApplication, companyName: "" });
    expect(result.success).toBe(false);
  });

  it("rejects an invalid job URL", () => {
    const result = applicationFormSchema.safeParse({
      ...baseApplication,
      jobUrl: "not-a-url",
    });
    expect(result.success).toBe(false);
  });

  it("accepts a valid job URL", () => {
    const result = applicationFormSchema.safeParse({
      ...baseApplication,
      jobUrl: "https://example.com/vaga",
    });
    expect(result.success).toBe(true);
  });

  it("rejects when minimum salary is greater than maximum", () => {
    const result = applicationFormSchema.safeParse({
      ...baseApplication,
      expectedSalaryMin: 9000,
      expectedSalaryMax: 5000,
    });
    expect(result.success).toBe(false);
  });

  it("rejects an invalid recruiter email", () => {
    const result = applicationFormSchema.safeParse({
      ...baseApplication,
      recruiterEmail: "not-an-email",
    });
    expect(result.success).toBe(false);
  });
});

describe("loginSchema", () => {
  it("requires a valid email and non-empty password", () => {
    expect(loginSchema.safeParse({ email: "a@b.com", password: "x" }).success).toBe(true);
    expect(loginSchema.safeParse({ email: "invalid", password: "x" }).success).toBe(false);
    expect(loginSchema.safeParse({ email: "a@b.com", password: "" }).success).toBe(false);
  });
});

describe("signupSchema", () => {
  it("requires matching passwords", () => {
    const result = signupSchema.safeParse({
      fullName: "Ada Lovelace",
      email: "ada@example.com",
      password: "supersecret",
      confirmPassword: "different",
    });
    expect(result.success).toBe(false);
  });

  it("accepts matching, sufficiently long passwords", () => {
    const result = signupSchema.safeParse({
      fullName: "Ada Lovelace",
      email: "ada@example.com",
      password: "supersecret",
      confirmPassword: "supersecret",
    });
    expect(result.success).toBe(true);
  });
});
