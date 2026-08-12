// Tipos gerados manualmente a partir de supabase/migrations/0001_init.sql.
// Mantenha em sincronia com o schema caso novas colunas sejam adicionadas.

export type ApplicationStatus =
  | "applied"
  | "interview"
  | "no_response"
  | "positive"
  | "negative";

export type EmploymentType =
  | "clt"
  | "pj"
  | "internship"
  | "freelance"
  | "other";

export type WorkModel = "remote" | "hybrid" | "onsite";

export type PriorityLevel = "low" | "medium" | "high";

export interface ProfileRow {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  theme_preference: "system" | "light" | "dark";
  created_at: string;
  updated_at: string;
}

export interface ApplicationRow {
  id: string;
  user_id: string;
  company_name: string;
  job_title: string;
  role_area: string | null;
  status: ApplicationStatus;
  applied_date: string;
  expected_salary_min: number | null;
  expected_salary_max: number | null;
  salary_currency: string;
  employment_type: EmploymentType | null;
  work_model: WorkModel | null;
  location: string | null;
  job_url: string | null;
  job_description: string | null;
  recruiter_name: string | null;
  recruiter_email: string | null;
  recruiter_phone: string | null;
  interview_date: string | null;
  interview_notes: string | null;
  general_notes: string | null;
  is_favorite: boolean;
  priority: PriorityLevel;
  follow_up_date: string | null;
  created_at: string;
  updated_at: string;
}

export type ApplicationInsert = Omit<
  ApplicationRow,
  | "id"
  | "created_at"
  | "updated_at"
  | "salary_currency"
  | "status"
  | "is_favorite"
  | "priority"
> &
  Partial<
    Pick<
      ApplicationRow,
      "salary_currency" | "status" | "is_favorite" | "priority"
    >
  >;

export type ApplicationUpdate = Partial<Omit<ApplicationInsert, "user_id">>;

export interface ApplicationHistoryRow {
  id: string;
  application_id: string;
  user_id: string;
  event_type: string;
  description: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface SimilarApplicationRow {
  id: string;
  company_name: string;
  job_title: string;
  status: ApplicationStatus;
  applied_date: string;
  similarity_score: number;
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: ProfileRow;
        Insert: Partial<ProfileRow> & { id: string };
        Update: Partial<ProfileRow>;
        Relationships: [];
      };
      applications: {
        Row: ApplicationRow;
        Insert: ApplicationInsert;
        Update: ApplicationUpdate;
        Relationships: [];
      };
      application_history: {
        Row: ApplicationHistoryRow;
        Insert: Omit<ApplicationHistoryRow, "id" | "created_at">;
        // Histórico é imutável (sem policy de UPDATE); mantido apenas para
        // satisfazer a forma estrutural exigida pelo cliente Supabase.
        Update: Partial<Omit<ApplicationHistoryRow, "id" | "created_at">>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      find_similar_applications: {
        Args: {
          p_company: string;
          p_job_title: string;
          p_exclude_id?: string | null;
        };
        Returns: SimilarApplicationRow[];
      };
    };
  };
}
