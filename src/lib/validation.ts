import { z } from "zod";

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .or(z.literal(""))
    .transform((value) => (value ? value : undefined));

const optionalEmail = z
  .string()
  .trim()
  .email("E-mail inválido")
  .optional()
  .or(z.literal(""))
  .transform((value) => (value ? value : undefined));

const optionalUrl = z
  .string()
  .trim()
  .optional()
  .or(z.literal(""))
  .transform((value) => (value ? value : undefined))
  .refine(
    (value) => {
      if (!value) return true;
      try {
        const url = new URL(value);
        return url.protocol === "http:" || url.protocol === "https:";
      } catch {
        return false;
      }
    },
    { message: "Informe uma URL válida (http:// ou https://)" }
  );

export const applicationFormSchema = z
  .object({
    companyName: z.string().trim().min(1, "Informe a empresa").max(160),
    jobTitle: z.string().trim().min(1, "Informe o nome da vaga").max(200),
    roleArea: optionalText(160),
    status: z.enum(["applied", "interview", "no_response", "positive", "negative"]),
    appliedDate: z.string().min(1, "Informe a data da candidatura"),
    expectedSalaryMin: z
      .union([z.coerce.number().nonnegative(), z.nan()])
      .optional()
      .transform((v) => (v === undefined || Number.isNaN(v) ? undefined : v)),
    expectedSalaryMax: z
      .union([z.coerce.number().nonnegative(), z.nan()])
      .optional()
      .transform((v) => (v === undefined || Number.isNaN(v) ? undefined : v)),
    salaryCurrency: z.string().trim().min(1).max(8).default("BRL"),
    employmentType: z
      .enum(["clt", "pj", "internship", "freelance", "other"])
      .optional()
      .or(z.literal("")).transform((v) => (v ? v : undefined)),
    workModel: z
      .enum(["remote", "hybrid", "onsite"])
      .optional()
      .or(z.literal("")).transform((v) => (v ? v : undefined)),
    location: optionalText(160),
    jobUrl: optionalUrl,
    jobDescription: optionalText(5000),
    recruiterName: optionalText(160),
    recruiterEmail: optionalEmail,
    recruiterPhone: optionalText(40),
    interviewDate: optionalText(40),
    interviewNotes: optionalText(5000),
    generalNotes: optionalText(5000),
    isFavorite: z.boolean().default(false),
    priority: z.enum(["low", "medium", "high"]).default("medium"),
    followUpDate: optionalText(40),
  })
  .refine(
    (data) =>
      data.expectedSalaryMin === undefined ||
      data.expectedSalaryMax === undefined ||
      data.expectedSalaryMin <= data.expectedSalaryMax,
    {
      message: "O salário mínimo não pode ser maior que o máximo",
      path: ["expectedSalaryMax"],
    }
  );

export type ApplicationFormValues = z.infer<typeof applicationFormSchema>;

export const loginSchema = z.object({
  email: z.string().trim().min(1, "Informe seu e-mail").email("E-mail inválido"),
  password: z.string().min(1, "Informe sua senha"),
});
export type LoginFormValues = z.infer<typeof loginSchema>;

export const signupSchema = z
  .object({
    fullName: z.string().trim().min(2, "Informe seu nome completo").max(160),
    email: z.string().trim().min(1, "Informe seu e-mail").email("E-mail inválido"),
    password: z
      .string()
      .min(8, "A senha deve ter pelo menos 8 caracteres")
      .max(72),
    confirmPassword: z.string().min(1, "Confirme sua senha"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não coincidem",
    path: ["confirmPassword"],
  });
export type SignupFormValues = z.infer<typeof signupSchema>;

export const forgotPasswordSchema = z.object({
  email: z.string().trim().min(1, "Informe seu e-mail").email("E-mail inválido"),
});
export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z
  .object({
    password: z.string().min(8, "A senha deve ter pelo menos 8 caracteres").max(72),
    confirmPassword: z.string().min(1, "Confirme sua senha"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não coincidem",
    path: ["confirmPassword"],
  });
export type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

export const profileSchema = z.object({
  fullName: z.string().trim().min(2, "Informe seu nome completo").max(160),
});
export type ProfileFormValues = z.infer<typeof profileSchema>;

export const changePasswordSchema = z
  .object({
    password: z.string().min(8, "A senha deve ter pelo menos 8 caracteres").max(72),
    confirmPassword: z.string().min(1, "Confirme sua senha"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não coincidem",
    path: ["confirmPassword"],
  });
export type ChangePasswordFormValues = z.infer<typeof changePasswordSchema>;
