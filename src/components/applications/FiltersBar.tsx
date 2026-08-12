import { Filter, Star, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { countActiveFilters, useFilterStore } from "@/store/filterStore";
import {
  EMPLOYMENT_TYPE_LABELS,
  PRIORITY_META,
  STATUS_META,
  STATUS_ORDER,
  WORK_MODEL_LABELS,
} from "@/lib/statuses";
import type { EmploymentType, PriorityLevel, WorkModel } from "@/types/database";

const WORK_MODELS: WorkModel[] = ["remote", "hybrid", "onsite"];
const EMPLOYMENT_TYPES: EmploymentType[] = ["clt", "pj", "internship", "freelance", "other"];
const PRIORITIES: PriorityLevel[] = ["low", "medium", "high"];

export function FiltersBar() {
  const filters = useFilterStore();
  const activeCount = countActiveFilters(filters);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            <Filter className="h-3.5 w-3.5" />
            Filtros
            {activeCount > 0 && (
              <Badge className="ml-1 h-4 min-w-4 justify-center px-1 text-[10px]">{activeCount}</Badge>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-72">
          <DropdownMenuLabel>Status</DropdownMenuLabel>
          {STATUS_ORDER.map((status) => (
            <DropdownMenuCheckboxItem
              key={status}
              checked={filters.statuses.includes(status)}
              onSelect={(e) => e.preventDefault()}
              onCheckedChange={() => filters.toggleStatus(status)}
            >
              {STATUS_META[status].label}
            </DropdownMenuCheckboxItem>
          ))}

          <DropdownMenuSeparator />
          <DropdownMenuLabel>Modelo de trabalho</DropdownMenuLabel>
          {WORK_MODELS.map((model) => (
            <DropdownMenuCheckboxItem
              key={model}
              checked={filters.workModels.includes(model)}
              onSelect={(e) => e.preventDefault()}
              onCheckedChange={() => filters.toggleWorkModel(model)}
            >
              {WORK_MODEL_LABELS[model]}
            </DropdownMenuCheckboxItem>
          ))}

          <DropdownMenuSeparator />
          <DropdownMenuLabel>Tipo de contratação</DropdownMenuLabel>
          {EMPLOYMENT_TYPES.map((type) => (
            <DropdownMenuCheckboxItem
              key={type}
              checked={filters.employmentTypes.includes(type)}
              onSelect={(e) => e.preventDefault()}
              onCheckedChange={() => filters.toggleEmploymentType(type)}
            >
              {EMPLOYMENT_TYPE_LABELS[type]}
            </DropdownMenuCheckboxItem>
          ))}

          <DropdownMenuSeparator />
          <DropdownMenuLabel>Prioridade</DropdownMenuLabel>
          {PRIORITIES.map((priority) => (
            <DropdownMenuCheckboxItem
              key={priority}
              checked={filters.priorities.includes(priority)}
              onSelect={(e) => e.preventDefault()}
              onCheckedChange={() => filters.togglePriority(priority)}
            >
              {PRIORITY_META[priority].label}
            </DropdownMenuCheckboxItem>
          ))}

          <DropdownMenuSeparator />
          <div className="flex items-center justify-between px-2 py-1.5">
            <Label htmlFor="favorites-only" className="text-sm font-normal">
              Somente favoritas
            </Label>
            <Switch
              id="favorites-only"
              checked={filters.favoritesOnly}
              onCheckedChange={filters.setFavoritesOnly}
            />
          </div>

          <DropdownMenuSeparator />
          <div className="space-y-2 px-2 py-1.5">
            <Label className="text-sm font-normal">Período da candidatura</Label>
            <div className="flex items-center gap-2">
              <Input
                type="date"
                value={filters.dateFrom ?? ""}
                onChange={(e) => filters.setDateRange(e.target.value || null, filters.dateTo)}
                className="h-8 text-xs"
              />
              <span className="text-xs text-muted-foreground">até</span>
              <Input
                type="date"
                value={filters.dateTo ?? ""}
                onChange={(e) => filters.setDateRange(filters.dateFrom, e.target.value || null)}
                className="h-8 text-xs"
              />
            </div>
          </div>

          {activeCount > 0 && (
            <>
              <DropdownMenuSeparator />
              <button
                type="button"
                onClick={filters.reset}
                className="flex w-full items-center gap-1.5 rounded-sm px-2 py-1.5 text-sm text-destructive hover:bg-destructive/10"
              >
                <X className="h-3.5 w-3.5" />
                Limpar filtros
              </button>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <Button
        variant={filters.favoritesOnly ? "default" : "outline"}
        size="sm"
        onClick={() => filters.setFavoritesOnly(!filters.favoritesOnly)}
      >
        <Star className={filters.favoritesOnly ? "h-3.5 w-3.5 fill-current" : "h-3.5 w-3.5"} />
        Favoritas
      </Button>

      {activeCount > 0 && (
        <Button variant="ghost" size="sm" onClick={filters.reset} className="text-muted-foreground">
          Limpar tudo
        </Button>
      )}
    </div>
  );
}
