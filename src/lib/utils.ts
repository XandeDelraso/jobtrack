import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, formatDistanceToNow, isPast, isToday, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(value: string | null | undefined, pattern = "dd/MM/yyyy") {
  if (!value) return "—";
  try {
    return format(parseISO(value), pattern, { locale: ptBR });
  } catch {
    return "—";
  }
}

export function formatDateTime(value: string | null | undefined) {
  return formatDate(value, "dd/MM/yyyy 'às' HH:mm");
}

export function formatRelative(value: string | null | undefined) {
  if (!value) return "—";
  try {
    return formatDistanceToNow(parseISO(value), { addSuffix: true, locale: ptBR });
  } catch {
    return "—";
  }
}

export function isDateTodayOrPast(value: string | null | undefined) {
  if (!value) return false;
  try {
    const date = parseISO(value);
    return isToday(date) || isPast(date);
  } catch {
    return false;
  }
}

export function isDateToday(value: string | null | undefined) {
  if (!value) return false;
  try {
    return isToday(parseISO(value));
  } catch {
    return false;
  }
}

const currencyFormatters = new Map<string, Intl.NumberFormat>();

function getCurrencyFormatter(currency: string) {
  let formatter = currencyFormatters.get(currency);
  if (!formatter) {
    formatter = new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    });
    currencyFormatters.set(currency, formatter);
  }
  return formatter;
}

export function formatSalaryRange(
  min: number | null | undefined,
  max: number | null | undefined,
  currency = "BRL"
) {
  const formatter = getCurrencyFormatter(currency);
  if (min == null && max == null) return "Não informado";
  if (min != null && max != null) {
    if (min === max) return formatter.format(min);
    return `${formatter.format(min)} – ${formatter.format(max)}`;
  }
  if (min != null) return `A partir de ${formatter.format(min)}`;
  return `Até ${formatter.format(max as number)}`;
}

export function initialsFromName(name: string | null | undefined, fallback = "?") {
  if (!name || !name.trim()) return fallback;
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1]?.[0] ?? "" : "";
  return (first + last).toUpperCase();
}

export function truncate(text: string | null | undefined, length: number) {
  if (!text) return "";
  if (text.length <= length) return text;
  return `${text.slice(0, length).trimEnd()}…`;
}
