import { AlertTriangle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { DuplicateMatch } from "@/lib/duplicate";
import { STATUS_META } from "@/lib/statuses";
import { formatDate } from "@/lib/utils";

interface DuplicateWarningDialogProps {
  open: boolean;
  matches: DuplicateMatch[];
  onOpenExisting: (id: string) => void;
  onContinueAnyway: () => void;
  onCancel: () => void;
}

export function DuplicateWarningDialog({
  open,
  matches,
  onOpenExisting,
  onContinueAnyway,
  onCancel,
}: DuplicateWarningDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(next) => !next && onCancel()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="mb-1 flex h-10 w-10 items-center justify-center rounded-full bg-warning/15">
            <AlertTriangle className="h-5 w-5 text-warning" />
          </div>
          <DialogTitle>Você já possui uma candidatura semelhante</DialogTitle>
          <DialogDescription>
            Encontramos {matches.length === 1 ? "uma candidatura parecida" : `${matches.length} candidaturas parecidas`}{" "}
            com esta empresa e vaga. Confira antes de continuar para evitar duplicidade.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          {matches.map((match) => (
            <button
              key={match.id}
              type="button"
              onClick={() => onOpenExisting(match.id)}
              className="flex w-full flex-col gap-1 rounded-lg border border-border p-3 text-left transition-colors hover:bg-accent"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium">{match.companyName}</span>
                <Badge variant="outline" className={STATUS_META[match.status].badgeClass}>
                  {STATUS_META[match.status].shortLabel}
                </Badge>
              </div>
              <span className="text-xs text-muted-foreground">{match.jobTitle}</span>
              <span className="text-xs text-muted-foreground">
                Candidatura em {formatDate(match.appliedDate)}
              </span>
            </button>
          ))}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button variant="secondary" onClick={onContinueAnyway}>
            Continuar mesmo assim
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
