import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Download, LogOut, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import { useProfile, useUpdateProfile } from "@/hooks/useProfile";
import { useApplications } from "@/hooks/useApplications";
import { useThemeStore } from "@/store/themeStore";
import {
  changePasswordSchema,
  profileSchema,
  type ChangePasswordFormValues,
  type ProfileFormValues,
} from "@/lib/validation";
import { applicationsToCsv, downloadCsv } from "@/lib/csv";
import { initialsFromName } from "@/lib/utils";

function SectionCard({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <div className="mb-4">
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </div>
      {children}
    </section>
  );
}

function ProfileSection() {
  const { data: profile, isLoading } = useProfile();
  const updateProfile = useUpdateProfile();
  const { user } = useAuth();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<ProfileFormValues>({ resolver: zodResolver(profileSchema) });

  React.useEffect(() => {
    if (profile) reset({ fullName: profile.full_name ?? "" });
  }, [profile, reset]);

  if (isLoading) {
    return (
      <SectionCard title="Perfil">
        <Skeleton className="h-9 w-full" />
      </SectionCard>
    );
  }

  return (
    <SectionCard title="Perfil" description="Suas informações básicas de conta">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
          {initialsFromName(profile?.full_name || user?.email)}
        </div>
        <div>
          <p className="text-sm font-medium text-foreground">{profile?.full_name || "Sem nome"}</p>
          <p className="text-xs text-muted-foreground">{user?.email}</p>
        </div>
      </div>
      <form
        onSubmit={handleSubmit((values) => updateProfile.mutate({ full_name: values.fullName }))}
        className="space-y-3"
        noValidate
      >
        <div className="space-y-1.5">
          <Label htmlFor="fullName">Nome completo</Label>
          <Input id="fullName" {...register("fullName")} />
          {errors.fullName && <p className="text-xs text-destructive">{errors.fullName.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="email">E-mail</Label>
          <Input id="email" value={user?.email ?? ""} disabled />
        </div>
        <Button type="submit" disabled={!isDirty || updateProfile.isPending}>
          {updateProfile.isPending && <Spinner />}
          Salvar alterações
        </Button>
      </form>
    </SectionCard>
  );
}

function PasswordSection() {
  const { updatePassword } = useAuth();
  const [submitting, setSubmitting] = React.useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ChangePasswordFormValues>({ resolver: zodResolver(changePasswordSchema) });

  const onSubmit = async (values: ChangePasswordFormValues) => {
    setSubmitting(true);
    const { error } = await updatePassword(values.password);
    setSubmitting(false);
    if (error) {
      toast.error(error);
      return;
    }
    toast.success("Senha alterada com sucesso");
    reset();
  };

  return (
    <SectionCard title="Segurança" description="Altere sua senha de acesso">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3" noValidate>
        <div className="space-y-1.5">
          <Label htmlFor="password">Nova senha</Label>
          <Input id="password" type="password" autoComplete="new-password" {...register("password")} />
          {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="confirmPassword">Confirmar nova senha</Label>
          <Input
            id="confirmPassword"
            type="password"
            autoComplete="new-password"
            {...register("confirmPassword")}
          />
          {errors.confirmPassword && (
            <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>
          )}
        </div>
        <Button type="submit" disabled={submitting}>
          {submitting && <Spinner />}
          Alterar senha
        </Button>
      </form>
    </SectionCard>
  );
}

function PreferencesSection() {
  const theme = useThemeStore((s) => s.theme);
  const toggleTheme = useThemeStore((s) => s.toggleTheme);

  return (
    <SectionCard title="Preferências" description="Personalize a aparência do JobTrack">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-foreground">
          {theme === "dark" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
          Tema {theme === "dark" ? "escuro" : "claro"}
        </div>
        <Button variant="outline" size="sm" onClick={toggleTheme}>
          Alternar para {theme === "dark" ? "claro" : "escuro"}
        </Button>
      </div>
    </SectionCard>
  );
}

function ExportSection() {
  const { data: applications = [] } = useApplications();

  function handleExport() {
    if (applications.length === 0) {
      toast.info("Você ainda não tem candidaturas para exportar");
      return;
    }
    const csv = applicationsToCsv(applications);
    const date = new Date().toISOString().slice(0, 10);
    downloadCsv(`jobtrack-candidaturas-${date}.csv`, csv);
    toast.success("Exportação concluída");
  }

  return (
    <SectionCard title="Exportar dados" description="Baixe todas as suas candidaturas em CSV">
      <Button variant="outline" onClick={handleExport}>
        <Download className="h-4 w-4" />
        Exportar candidaturas ({applications.length})
      </Button>
    </SectionCard>
  );
}

function DangerSection() {
  const { signOut } = useAuth();
  return (
    <SectionCard title="Sessão">
      <Button variant="outline" className="text-destructive" onClick={() => signOut()}>
        <LogOut className="h-4 w-4" />
        Sair da conta
      </Button>
    </SectionCard>
  );
}

export function ProfilePage() {
  return (
    <div className="mx-auto max-w-2xl space-y-4 p-4 sm:p-6">
      <div>
        <h1 className="text-lg font-semibold tracking-tight">Perfil e configurações</h1>
        <p className="text-sm text-muted-foreground">Gerencie sua conta e preferências do JobTrack.</p>
      </div>
      <ProfileSection />
      <PasswordSection />
      <PreferencesSection />
      <ExportSection />
      <DangerSection />
    </div>
  );
}
