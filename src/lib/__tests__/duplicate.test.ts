import { describe, expect, it } from "vitest";
import {
  diceCoefficient,
  findDuplicateCandidates,
  normalizeForComparison,
  type DuplicateCandidateInput,
} from "@/lib/duplicate";

describe("normalizeForComparison", () => {
  it("lowercases, trims and collapses whitespace", () => {
    expect(normalizeForComparison("  Google   Brasil  ")).toBe("google brasil");
  });

  it("strips accents", () => {
    expect(normalizeForComparison("São Paulo")).toBe("sao paulo");
  });
});

describe("diceCoefficient", () => {
  it("returns 1 for identical strings", () => {
    expect(diceCoefficient("google", "google")).toBe(1);
  });

  it("returns 0 for completely different strings", () => {
    expect(diceCoefficient("google", "zzzzzz")).toBe(0);
  });

  it("returns a high score for near-identical strings", () => {
    expect(diceCoefficient("google", "googel")).toBeGreaterThanOrEqual(0.6);
  });
});

describe("findDuplicateCandidates", () => {
  const existing: DuplicateCandidateInput[] = [
    {
      id: "1",
      companyName: "Google",
      jobTitle: "Software Engineer Jr",
      status: "applied",
      appliedDate: "2026-01-01",
    },
    {
      id: "2",
      companyName: "Microsoft",
      jobTitle: "Product Manager",
      status: "interview",
      appliedDate: "2026-01-05",
    },
  ];

  it("detects an exact match regardless of case/whitespace", () => {
    const matches = findDuplicateCandidates(
      { companyName: "  google  ", jobTitle: "Software Engineer Jr" },
      existing
    );
    expect(matches).toHaveLength(1);
    expect(matches[0].id).toBe("1");
  });

  it("detects a near match with minor typos", () => {
    const matches = findDuplicateCandidates(
      { companyName: "Gogle", jobTitle: "Software Engineer Jr" },
      existing
    );
    expect(matches.some((m) => m.id === "1")).toBe(true);
  });

  it("does not flag unrelated companies as duplicates", () => {
    const matches = findDuplicateCandidates(
      { companyName: "Amazon", jobTitle: "Data Scientist" },
      existing
    );
    expect(matches).toHaveLength(0);
  });

  it("excludes the given id (used when editing an existing application)", () => {
    const matches = findDuplicateCandidates(
      { companyName: "Google", jobTitle: "Software Engineer Jr" },
      existing,
      { excludeId: "1" }
    );
    expect(matches).toHaveLength(0);
  });

  it("flags same-company entries even with a very different job title", () => {
    const matches = findDuplicateCandidates(
      { companyName: "Google", jobTitle: "Completely unrelated role xyz" },
      existing
    );
    expect(matches.some((m) => m.id === "1")).toBe(true);
  });
});
