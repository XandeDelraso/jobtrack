import type { ApplicationStatus } from "@/types/database";

/**
 * Detecção de candidaturas duplicadas.
 *
 * Estratégia: compara empresa + nome da vaga já normalizados (minúsculo, sem
 * acentos, espaços colapsados) usando similaridade de bigramas (coeficiente
 * de Dice) — a mesma ideia por trás do pg_trgm usado no backend, o que
 * permite reaproveitar o mesmo threshold para tolerar pequenas diferenças de
 * digitação (ex.: "Google" vs "google " vs "Googl").
 */

const DIACRITIC_MARKS = /\p{Diacritic}/gu;

export function normalizeForComparison(text: string): string {
  return text
    .normalize("NFD")
    .replace(DIACRITIC_MARKS, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
}

function bigrams(text: string): string[] {
  if (text.length < 2) return text.length === 1 ? [text] : [];
  const grams: string[] = [];
  for (let i = 0; i < text.length - 1; i++) {
    grams.push(text.slice(i, i + 2));
  }
  return grams;
}

export function diceCoefficient(a: string, b: string): number {
  if (a === b) return 1;
  if (!a || !b) return 0;

  const bigramsA = bigrams(a);
  const bigramsB = bigrams(b);
  if (bigramsA.length === 0 || bigramsB.length === 0) return a === b ? 1 : 0;

  const remaining = new Map<string, number>();
  for (const gram of bigramsB) {
    remaining.set(gram, (remaining.get(gram) ?? 0) + 1);
  }

  let matches = 0;
  for (const gram of bigramsA) {
    const count = remaining.get(gram) ?? 0;
    if (count > 0) {
      matches++;
      remaining.set(gram, count - 1);
    }
  }

  return (2 * matches) / (bigramsA.length + bigramsB.length);
}

export interface DuplicateCandidateInput {
  id: string;
  companyName: string;
  jobTitle: string;
  status: ApplicationStatus;
  appliedDate: string;
}

export interface DuplicateMatch extends DuplicateCandidateInput {
  score: number;
}

export const DUPLICATE_SCORE_THRESHOLD = 0.72;
export const DUPLICATE_COMPANY_EXACT_THRESHOLD = 0.9;

export function findDuplicateCandidates(
  candidate: { companyName: string; jobTitle: string },
  existing: DuplicateCandidateInput[],
  options: { excludeId?: string } = {}
): DuplicateMatch[] {
  const normCompany = normalizeForComparison(candidate.companyName);
  const normTitle = normalizeForComparison(candidate.jobTitle);
  if (!normCompany) return [];

  const matches: DuplicateMatch[] = [];

  for (const item of existing) {
    if (options.excludeId && item.id === options.excludeId) continue;

    const companyScore = diceCoefficient(
      normCompany,
      normalizeForComparison(item.companyName)
    );
    const titleScore = diceCoefficient(
      normTitle,
      normalizeForComparison(item.jobTitle)
    );
    const score = companyScore * 0.65 + titleScore * 0.35;

    if (
      companyScore >= DUPLICATE_COMPANY_EXACT_THRESHOLD ||
      score >= DUPLICATE_SCORE_THRESHOLD
    ) {
      matches.push({ ...item, score });
    }
  }

  return matches.sort((a, b) => b.score - a.score).slice(0, 5);
}
