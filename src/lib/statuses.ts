import type {
  ApplicationStatus,
  EmploymentType,
  PriorityLevel,
  WorkModel,
} from "@/types/database";

export interface StatusMeta {
  value: ApplicationStatus;
  label: string;
  shortLabel: string;
  description: string;
  color: string; // tailwind color token used for dots/badges
  dotClass: string;
  badgeClass: string;
}

export const STATUS_ORDER: ApplicationStatus[] = [
  "applied",
  "interview",
  "no_response",
  "positive",
  "negative",
];

export const STATUS_META: Record<ApplicationStatus, StatusMeta> = {
  applied: {
    value: "applied",
    label: "Currículo enviado",
    shortLabel: "Enviado",
    description: "Candidatura enviada, aguardando retorno inicial.",
    color: "sky",
    dotClass: "bg-sky-500",
    badgeClass:
      "bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/20",
  },
  interview: {
    value: "interview",
    label: "Entrevista marcada",
    shortLabel: "Entrevista",
    description: "Uma ou mais entrevistas foram agendadas.",
    color: "amber",
    dotClass: "bg-amber-500",
    badgeClass:
      "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20",
  },
  no_response: {
    value: "no_response",
    label: "Sem retorno",
    shortLabel: "Sem retorno",
    description: "Nenhuma resposta da empresa até o momento.",
    color: "slate",
    dotClass: "bg-slate-400",
    badgeClass:
      "bg-slate-500/10 text-slate-600 dark:text-slate-300 border-slate-500/20",
  },
  positive: {
    value: "positive",
    label: "Retorno positivo",
    shortLabel: "Positivo",
    description: "Proposta, aprovação ou avanço confirmado.",
    color: "emerald",
    dotClass: "bg-emerald-500",
    badgeClass:
      "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20",
  },
  negative: {
    value: "negative",
    label: "Retorno negativo",
    shortLabel: "Negativo",
    description: "Processo encerrado sem sucesso.",
    color: "rose",
    dotClass: "bg-rose-500",
    badgeClass:
      "bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20",
  },
};

export const EMPLOYMENT_TYPE_LABELS: Record<EmploymentType, string> = {
  clt: "CLT",
  pj: "PJ",
  internship: "Estágio",
  freelance: "Freelancer",
  other: "Outro",
};

export const WORK_MODEL_LABELS: Record<WorkModel, string> = {
  remote: "Remoto",
  hybrid: "Híbrido",
  onsite: "Presencial",
};

export const PRIORITY_META: Record<
  PriorityLevel,
  { label: string; badgeClass: string; dotClass: string }
> = {
  low: {
    label: "Baixa",
    badgeClass: "bg-slate-500/10 text-slate-600 dark:text-slate-300",
    dotClass: "bg-slate-400",
  },
  medium: {
    label: "Média",
    badgeClass: "bg-amber-500/10 text-amber-700 dark:text-amber-300",
    dotClass: "bg-amber-500",
  },
  high: {
    label: "Alta",
    badgeClass: "bg-rose-500/10 text-rose-700 dark:text-rose-300",
    dotClass: "bg-rose-500",
  },
};

/** Dias sem mudança de status até o card ir sozinho para "Sem retorno".
 *  Precisa bater com o valor agendado em supabase/migrations/0002_auto_no_response.sql. */
export const AUTO_NO_RESPONSE_DAYS = 40;
