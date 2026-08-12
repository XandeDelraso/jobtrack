import type { ApplicationFormValues } from "@/lib/validation";
import type { ApplicationInsert, ApplicationRow } from "@/types/database";

export function formValuesToApplicationInsert(
  values: ApplicationFormValues
): Omit<ApplicationInsert, "user_id"> {
  return {
    company_name: values.companyName,
    job_title: values.jobTitle,
    role_area: values.roleArea ?? null,
    status: values.status,
    applied_date: values.appliedDate,
    expected_salary_min: values.expectedSalaryMin ?? null,
    expected_salary_max: values.expectedSalaryMax ?? null,
    salary_currency: values.salaryCurrency || "BRL",
    employment_type: values.employmentType ?? null,
    work_model: values.workModel ?? null,
    location: values.location ?? null,
    job_url: values.jobUrl ?? null,
    job_description: values.jobDescription ?? null,
    recruiter_name: values.recruiterName ?? null,
    recruiter_email: values.recruiterEmail ?? null,
    recruiter_phone: values.recruiterPhone ?? null,
    interview_date: values.interviewDate
      ? new Date(values.interviewDate).toISOString()
      : null,
    interview_notes: values.interviewNotes ?? null,
    general_notes: values.generalNotes ?? null,
    is_favorite: values.isFavorite,
    priority: values.priority,
    follow_up_date: values.followUpDate ?? null,
  };
}

function toDateTimeLocalInput(value: string | null): string | undefined {
  if (!value) return undefined;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours()
  )}:${pad(date.getMinutes())}`;
}

export function applicationRowToFormValues(row: ApplicationRow): ApplicationFormValues {
  return {
    companyName: row.company_name,
    jobTitle: row.job_title,
    roleArea: row.role_area ?? undefined,
    status: row.status,
    appliedDate: row.applied_date,
    expectedSalaryMin: row.expected_salary_min ?? undefined,
    expectedSalaryMax: row.expected_salary_max ?? undefined,
    salaryCurrency: row.salary_currency,
    employmentType: row.employment_type ?? undefined,
    workModel: row.work_model ?? undefined,
    location: row.location ?? undefined,
    jobUrl: row.job_url ?? undefined,
    jobDescription: row.job_description ?? undefined,
    recruiterName: row.recruiter_name ?? undefined,
    recruiterEmail: row.recruiter_email ?? undefined,
    recruiterPhone: row.recruiter_phone ?? undefined,
    interviewDate: toDateTimeLocalInput(row.interview_date),
    interviewNotes: row.interview_notes ?? undefined,
    generalNotes: row.general_notes ?? undefined,
    isFavorite: row.is_favorite,
    priority: row.priority,
    followUpDate: row.follow_up_date ?? undefined,
  };
}
