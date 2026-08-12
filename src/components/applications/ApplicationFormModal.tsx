import * as React from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Star } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DuplicateWarningDialog } from "@/components/applications/DuplicateWarningDialog";
import { useUIStore } from "@/store/uiStore";
import {
  useApplications,
  useCreateApplication,
  useUpdateApplication,
} from "@/hooks/useApplications";
import { applicationFormSchema, type ApplicationFormValues } from "@/lib/validation";
import { applicationRowToFormValues, formValuesToApplicationInsert } from "@/lib/mappers";
import { findDuplicateCandidates, type DuplicateMatch } from "@/lib/duplicate";
import {
  EMPLOYMENT_TYPE_LABELS,
  STATUS_META,
  STATUS_ORDER,
  WORK_MODEL_LABELS,
} from "@/lib/statuses";
import { cn } from "@/lib/utils";

const DEFAULT_VALUES: ApplicationFormValues = {
  companyName: "",
  jobTitle: "",
  roleArea: undefined,
  status: "applied",
  appliedDate: new Date().toISOString().slice(0, 10),
  expectedSalaryMin: undefined,
  expectedSalaryMax: undefined,
  salaryCurrency: "BRL",
  employmentType: undefined,
  workModel: undefined,
  location: undefined,
  jobUrl: undefined,
  jobDescription: undefined,
  recruiterName: undefined,
  recruiterEmail: undefined,
  recruiterPhone: undefined,
  interviewDate: undefined,
  interviewNotes: undefined,
  generalNotes: undefined,
  isFavorite: false,
  priority: "medium",
  followUpDate: undefined,
};

export function ApplicationFormModal() {
  const isFormOpen = useUIStore((s) => s.isFormOpen);
  const editingApplication = useUIStore((s) => s.editingApplication);
  const closeForm = useUIStore((s) => s.closeForm);
  const openDetail = useUIStore((s) => s.openDetail);

  const { data: applications = [] } = useApplications();
  const createApplication = useCreateApplication();
  const updateApplication = useUpdateApplication();

  const [duplicateMatches, setDuplicateMatches] = React.useState<DuplicateMatch[] | null>(null);
  const [pendingValues, setPendingValues] = React.useState<ApplicationFormValues | null>(null);

  const isEditing = Boolean(editingApplication);
  const submitting = createApplication.isPending || updateApplication.isPending;

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ApplicationFormValues>({
    resolver: zodResolver(applicationFormSchema),
    defaultValues: DEFAULT_VALUES,
  });

  React.useEffect(() => {
    if (isFormOpen) {
      reset(editingApplication ? applicationRowToFormValues(editingApplication) : DEFAULT_VALUES);
      setDuplicateMatches(null);
      setPendingValues(null);
    }
  }, [isFormOpen, editingApplication, reset]);

  function persist(values: ApplicationFormValues) {
    const payload = formValuesToApplicationInsert(values);
    if (editingApplication) {
      updateApplication.mutate(
        { id: editingApplication.id, values: payload },
        { onSuccess: () => closeForm() }
      );
    } else {
      createApplication.mutate(payload, { onSuccess: () => closeForm() });
    }
  }

  function onSubmit(values: ApplicationFormValues) {
    const matches = findDuplicateCandidates(
      { companyName: values.companyName, jobTitle: values.jobTitle },
      applications.map((a) => ({
        id: a.id,
        companyName: a.company_name,
        jobTitle: a.job_title,
        status: a.status,
        appliedDate: a.applied_date,
      })),
      { excludeId: editingApplication?.id }
    );

    if (matches.length > 0) {
      setDuplicateMatches(matches);
      setPendingValues(values);
      return;
    }

    persist(values);
  }

  function handleContinueAnyway() {
    if (pendingValues) persist(pendingValues);
    setDuplicateMatches(null);
    setPendingValues(null);
  }

  function handleOpenExisting(id: string) {
    setDuplicateMatches(null);
    setPendingValues(null);
    closeForm();
    openDetail(id);
  }

  return (
    <>
      <Dialog open={isFormOpen && !duplicateMatches} onOpenChange={(next) => !next && closeForm()}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{isEditing ? "Editar candidatura" : "Nova candidatura"}</DialogTitle>
            <DialogDescription>
              {isEditing
                ? "Atualize as informações desta candidatura."
                : "Preencha os dados da vaga para começar a acompanhar o processo."}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <Tabs defaultValue="basico">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="basico">Básico</TabsTrigger>
                <TabsTrigger value="oportunidade">Oportunidade</TabsTrigger>
                <TabsTrigger value="processo">Processo seletivo</TabsTrigger>
              </TabsList>

              <TabsContent value="basico" className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="companyName">Empresa *</Label>
                    <Input id="companyName" placeholder="Ex: Google" {...register("companyName")} />
                    {errors.companyName && (
                      <p className="text-xs text-destructive">{errors.companyName.message}</p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="jobTitle">Nome da vaga *</Label>
                    <Input id="jobTitle" placeholder="Ex: Software Engineer Jr" {...register("jobTitle")} />
                    {errors.jobTitle && (
                      <p className="text-xs text-destructive">{errors.jobTitle.message}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="roleArea">Cargo/função</Label>
                    <Input id="roleArea" placeholder="Ex: Backend" {...register("roleArea")} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="appliedDate">Data da candidatura *</Label>
                    <Input id="appliedDate" type="date" {...register("appliedDate")} />
                    {errors.appliedDate && (
                      <p className="text-xs text-destructive">{errors.appliedDate.message}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label>Status</Label>
                    <Controller
                      control={control}
                      name="status"
                      render={({ field }) => (
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {STATUS_ORDER.map((status) => (
                              <SelectItem key={status} value={status}>
                                {STATUS_META[status].label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Prioridade</Label>
                    <Controller
                      control={control}
                      name="priority"
                      render={({ field }) => (
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">Baixa</SelectItem>
                            <SelectItem value="medium">Média</SelectItem>
                            <SelectItem value="high">Alta</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>
                </div>

                <Controller
                  control={control}
                  name="isFavorite"
                  render={({ field }) => (
                    <div className="flex items-center justify-between rounded-lg border border-border p-3">
                      <div className="flex items-center gap-2">
                        <Star
                          className={cn(
                            "h-4 w-4",
                            field.value ? "fill-warning text-warning" : "text-muted-foreground"
                          )}
                        />
                        <div>
                          <p className="text-sm font-medium">Marcar como favorita</p>
                          <p className="text-xs text-muted-foreground">
                            Destaque candidaturas importantes
                          </p>
                        </div>
                      </div>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </div>
                  )}
                />
              </TabsContent>

              <TabsContent value="oportunidade" className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="expectedSalaryMin">Salário mínimo</Label>
                    <Input id="expectedSalaryMin" type="number" min={0} step="0.01" {...register("expectedSalaryMin")} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="expectedSalaryMax">Salário máximo</Label>
                    <Input id="expectedSalaryMax" type="number" min={0} step="0.01" {...register("expectedSalaryMax")} />
                    {errors.expectedSalaryMax && (
                      <p className="text-xs text-destructive">{errors.expectedSalaryMax.message}</p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="salaryCurrency">Moeda</Label>
                    <Input id="salaryCurrency" placeholder="BRL" {...register("salaryCurrency")} />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label>Tipo de contratação</Label>
                    <Controller
                      control={control}
                      name="employmentType"
                      render={({ field }) => (
                        <Select value={field.value ?? ""} onValueChange={field.onChange}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(EMPLOYMENT_TYPE_LABELS).map(([value, label]) => (
                              <SelectItem key={value} value={value}>
                                {label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Modelo de trabalho</Label>
                    <Controller
                      control={control}
                      name="workModel"
                      render={({ field }) => (
                        <Select value={field.value ?? ""} onValueChange={field.onChange}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(WORK_MODEL_LABELS).map(([value, label]) => (
                              <SelectItem key={value} value={value}>
                                {label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="location">Localização</Label>
                    <Input id="location" placeholder="Ex: São Paulo, SP" {...register("location")} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="jobUrl">Link da vaga</Label>
                    <Input id="jobUrl" placeholder="https://..." {...register("jobUrl")} />
                    {errors.jobUrl && <p className="text-xs text-destructive">{errors.jobUrl.message}</p>}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="jobDescription">Descrição da vaga</Label>
                  <Textarea id="jobDescription" rows={4} {...register("jobDescription")} />
                </div>
              </TabsContent>

              <TabsContent value="processo" className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="recruiterName">Nome do recrutador</Label>
                    <Input id="recruiterName" {...register("recruiterName")} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="recruiterEmail">E-mail do recrutador</Label>
                    <Input id="recruiterEmail" type="email" {...register("recruiterEmail")} />
                    {errors.recruiterEmail && (
                      <p className="text-xs text-destructive">{errors.recruiterEmail.message}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="recruiterPhone">Telefone/contato</Label>
                    <Input id="recruiterPhone" {...register("recruiterPhone")} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="interviewDate">Data da entrevista</Label>
                    <Input id="interviewDate" type="datetime-local" {...register("interviewDate")} />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="followUpDate">Follow-up</Label>
                  <Input id="followUpDate" type="date" {...register("followUpDate")} />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="interviewNotes">Observações da entrevista</Label>
                  <Textarea id="interviewNotes" rows={3} {...register("interviewNotes")} />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="generalNotes">Observações gerais</Label>
                  <Textarea id="generalNotes" rows={3} {...register("generalNotes")} />
                </div>
              </TabsContent>
            </Tabs>

            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={closeForm} disabled={submitting}>
                Cancelar
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting && <Spinner />}
                {isEditing ? "Salvar alterações" : "Adicionar candidatura"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <DuplicateWarningDialog
        open={Boolean(duplicateMatches)}
        matches={duplicateMatches ?? []}
        onOpenExisting={handleOpenExisting}
        onContinueAnyway={handleContinueAnyway}
        onCancel={() => {
          setDuplicateMatches(null);
          setPendingValues(null);
        }}
      />
    </>
  );
}
