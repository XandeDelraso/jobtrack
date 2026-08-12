import * as React from "react";
import {
  ExternalLink,
  Mail,
  Phone,
  Pencil,
  Trash2,
  Star,
  MapPin,
  Building2,
  Briefcase,
} from "lucide-react";
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { HistoryTimeline } from "@/components/applications/HistoryTimeline";
import { useUIStore } from "@/store/uiStore";
import {
  useApplications,
  useDeleteApplication,
  useToggleFavorite,
  useUpdateApplicationStatus,
} from "@/hooks/useApplications";
import {
  EMPLOYMENT_TYPE_LABELS,
  PRIORITY_META,
  STATUS_META,
  STATUS_ORDER,
  WORK_MODEL_LABELS,
} from "@/lib/statuses";
import { formatDate, formatDateTime, formatSalaryRange } from "@/lib/utils";
import { cn } from "@/lib/utils";

function DetailRow({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: React.ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
}) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-2.5 text-sm">
      {Icon && <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />}
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-foreground">{value}</p>
      </div>
    </div>
  );
}

export function ApplicationDetailDrawer() {
  const selectedApplicationId = useUIStore((s) => s.selectedApplicationId);
  const closeDetail = useUIStore((s) => s.closeDetail);
  const openEditForm = useUIStore((s) => s.openEditForm);

  const { data: applications = [] } = useApplications();
  const deleteApplication = useDeleteApplication();
  const toggleFavorite = useToggleFavorite();
  const updateStatus = useUpdateApplicationStatus();

  const [confirmDeleteOpen, setConfirmDeleteOpen] = React.useState(false);

  const application = applications.find((a) => a.id === selectedApplicationId) ?? null;
  const open = Boolean(selectedApplicationId);

  if (!application) {
    return (
      <Sheet open={open} onOpenChange={(next) => !next && closeDetail()}>
        <SheetContent />
      </Sheet>
    );
  }

  const statusMeta = STATUS_META[application.status];
  const priorityMeta = PRIORITY_META[application.priority];

  return (
    <>
      <Sheet open={open} onOpenChange={(next) => !next && closeDetail()}>
        <SheetContent>
          <SheetHeader className="pr-10">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className={statusMeta.badgeClass}>
                {statusMeta.label}
              </Badge>
              <Badge variant="outline" className={priorityMeta.badgeClass}>
                Prioridade {priorityMeta.label.toLowerCase()}
              </Badge>
            </div>
            <SheetTitle className="flex items-center gap-2">
              {application.company_name}
              <button
                type="button"
                onClick={() =>
                  toggleFavorite.mutate({
                    id: application.id,
                    isFavorite: !application.is_favorite,
                  })
                }
                aria-label={application.is_favorite ? "Remover dos favoritos" : "Marcar como favorita"}
                className="rounded-md p-1 hover:bg-accent"
              >
                <Star
                  className={cn(
                    "h-4 w-4",
                    application.is_favorite ? "fill-warning text-warning" : "text-muted-foreground"
                  )}
                />
              </button>
            </SheetTitle>
            <p className="text-sm text-muted-foreground">{application.job_title}</p>
          </SheetHeader>

          <SheetBody>
            <div className="mb-4 space-y-1.5">
              <p className="text-xs font-medium text-muted-foreground">Mover para</p>
              <Select
                value={application.status}
                onValueChange={(value) =>
                  updateStatus.mutate({ id: application.id, status: value as typeof application.status })
                }
              >
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
            </div>

            <Tabs defaultValue="detalhes">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="detalhes">Detalhes</TabsTrigger>
                <TabsTrigger value="historico">Histórico</TabsTrigger>
              </TabsList>

              <TabsContent value="detalhes" className="space-y-5">
                <section className="space-y-3">
                  <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Informações básicas
                  </h4>
                  <DetailRow label="Cargo/função" value={application.role_area} icon={Briefcase} />
                  <DetailRow label="Data da candidatura" value={formatDate(application.applied_date)} />
                  <DetailRow
                    label="Salário esperado"
                    value={formatSalaryRange(
                      application.expected_salary_min,
                      application.expected_salary_max,
                      application.salary_currency
                    )}
                  />
                </section>

                <section className="space-y-3">
                  <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Oportunidade
                  </h4>
                  <DetailRow
                    label="Tipo de contratação"
                    value={application.employment_type ? EMPLOYMENT_TYPE_LABELS[application.employment_type] : null}
                    icon={Building2}
                  />
                  <DetailRow
                    label="Modelo de trabalho"
                    value={application.work_model ? WORK_MODEL_LABELS[application.work_model] : null}
                  />
                  <DetailRow label="Localização" value={application.location} icon={MapPin} />
                  {application.job_url && (
                    <a
                      href={application.job_url}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
                    >
                      Abrir vaga original <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  )}
                  {application.job_description && (
                    <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                      {application.job_description}
                    </p>
                  )}
                </section>

                <section className="space-y-3">
                  <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Processo seletivo
                  </h4>
                  <DetailRow label="Recrutador" value={application.recruiter_name} />
                  {application.recruiter_email && (
                    <DetailRow
                      label="E-mail"
                      icon={Mail}
                      value={
                        <a href={`mailto:${application.recruiter_email}`} className="hover:underline">
                          {application.recruiter_email}
                        </a>
                      }
                    />
                  )}
                  {application.recruiter_phone && (
                    <DetailRow label="Telefone" icon={Phone} value={application.recruiter_phone} />
                  )}
                  <DetailRow
                    label="Entrevista"
                    value={application.interview_date ? formatDateTime(application.interview_date) : null}
                  />
                  <DetailRow label="Observações da entrevista" value={application.interview_notes} />
                  <DetailRow label="Follow-up" value={formatDate(application.follow_up_date)} />
                  <DetailRow label="Observações gerais" value={application.general_notes} />
                </section>
              </TabsContent>

              <TabsContent value="historico">
                <HistoryTimeline applicationId={application.id} />
              </TabsContent>
            </Tabs>
          </SheetBody>

          <SheetFooter>
            <Button variant="outline" onClick={() => setConfirmDeleteOpen(true)} className="text-destructive">
              <Trash2 className="h-4 w-4" />
              Excluir
            </Button>
            <Button onClick={() => openEditForm(application)}>
              <Pencil className="h-4 w-4" />
              Editar
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <ConfirmDialog
        open={confirmDeleteOpen}
        onOpenChange={setConfirmDeleteOpen}
        title="Excluir candidatura?"
        description={`Isso removerá permanentemente a candidatura para ${application.job_title} em ${application.company_name}, incluindo todo o histórico.`}
        confirmLabel="Excluir"
        destructive
        loading={deleteApplication.isPending}
        onConfirm={() => {
          deleteApplication.mutate(application.id, {
            onSuccess: () => {
              setConfirmDeleteOpen(false);
              closeDetail();
            },
          });
        }}
      />
    </>
  );
}
