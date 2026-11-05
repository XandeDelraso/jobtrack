import type { ApplicationRow } from "@/types/database";
import {
  EMPLOYMENT_TYPE_LABELS,
  STATUS_META,
  WORK_MODEL_LABELS,
} from "@/lib/statuses";

const CSV_HEADERS = [
  "Empresa",
  "Vaga",
  "Cargo/Função",
  "Status",
  "Data da candidatura",
  "Salário mínimo",
  "Salário máximo",
  "Moeda",
  "Tipo de contratação",
  "Modelo de trabalho",
  "Localização",
  "Link da vaga",
  "Recrutador",
  "E-mail do recrutador",
  "Telefone do recrutador",
  "Data da entrevista",
  "Favorita",
  "Prioridade",
  "Follow-up",
  "Movida automaticamente",
];

// Byte Order Mark: garante acentuação correta ao abrir o CSV no Excel.
const CSV_BOM = String.fromCharCode(0xfeff);

function escapeCsvField(value: string | number | boolean | null | undefined): string {
  if (value === null || value === undefined) return "";
  const stringValue = String(value);
  if (/[",\n;]/.test(stringValue)) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
}

export function applicationsToCsv(applications: ApplicationRow[]): string {
  const rows = applications.map((app) => [
    app.company_name,
    app.job_title,
    app.role_area ?? "",
    STATUS_META[app.status]?.label ?? app.status,
    app.applied_date,
    app.expected_salary_min ?? "",
    app.expected_salary_max ?? "",
    app.salary_currency,
    app.employment_type ? EMPLOYMENT_TYPE_LABELS[app.employment_type] : "",
    app.work_model ? WORK_MODEL_LABELS[app.work_model] : "",
    app.location ?? "",
    app.job_url ?? "",
    app.recruiter_name ?? "",
    app.recruiter_email ?? "",
    app.recruiter_phone ?? "",
    app.interview_date ?? "",
    app.is_favorite ? "Sim" : "Não",
    app.priority,
    app.follow_up_date ?? "",
    app.auto_moved_at ? "Sim" : "Não",
  ]);

  const lines = [CSV_HEADERS, ...rows].map((row) =>
    row.map(escapeCsvField).join(",")
  );

  return CSV_BOM + lines.join("\r\n");
}

export function downloadCsv(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
