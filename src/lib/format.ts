import { DIFFICULTIES, GOALS, plans, type Difficulty, type Goal, type PlanCode } from "@/content/catalog";

export function formatPrice(amount: number, currency = "RUB"): string {
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  })
    .format(amount)
    .replace(/\u00A0/g, " ");
}

export function formatMinutes(minutes: number): string {
  return `${minutes} мин`;
}

export function formatDurationText(minutes: number): string {
  if (minutes < 60) return `${minutes} минут`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (rest === 0) return `${hours} ${plural(hours, ["час", "часа", "часов"])}`;
  return `${hours} ${plural(hours, ["час", "часа", "часов"])} ${rest} мин`;
}

export function plural(n: number, forms: [string, string, string]): string {
  const abs = Math.abs(n) % 100;
  const last = abs % 10;
  if (abs > 10 && abs < 20) return forms[2];
  if (last > 1 && last < 5) return forms[1];
  if (last === 1) return forms[0];
  return forms[2];
}

export function formatDate(value: string | Date | null | undefined, opts?: Intl.DateTimeFormatOptions): string {
  if (!value) return "—";
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("ru-RU", opts ?? { day: "numeric", month: "long", year: "numeric" }).format(date);
}

export function formatShortDate(value: string | Date | null | undefined): string {
  return formatDate(value, { day: "numeric", month: "short" });
}

export function formatDateTime(value: string | Date | null | undefined): string {
  return formatDate(value, { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" });
}

export function formatTime(value: string | Date | null | undefined, timeZone = "Europe/Moscow"): string {
  if (!value) return "—";
  const date = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat("ru-RU", { hour: "2-digit", minute: "2-digit", timeZone }).format(date);
}

export function formatWeekday(value: string | Date, timeZone = "Europe/Moscow"): string {
  const date = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat("ru-RU", { weekday: "long", timeZone }).format(date);
}

export function goalLabel(goal: Goal | string): string {
  return GOALS.find((g) => g.value === goal)?.label ?? "Практика";
}

export function goalShort(goal: Goal | string): string {
  return GOALS.find((g) => g.value === goal)?.short ?? "Практика";
}

export function difficultyLabel(value: Difficulty | string): string {
  return DIFFICULTIES.find((d) => d.value === value)?.label ?? "Любой уровень";
}

export function planName(code: PlanCode | string | null | undefined): string {
  if (!code) return "—";
  return plans.find((p) => p.code === code)?.name ?? code;
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function declension(n: number, forms: [string, string, string]): string {
  return `${n} ${plural(n, forms)}`;
}

export function relativeDays(value: string | Date): string {
  const date = typeof value === "string" ? new Date(value) : value;
  const diff = Math.round((Date.now() - date.getTime()) / (24 * 60 * 60 * 1000));
  if (diff <= 0) return "сегодня";
  if (diff === 1) return "вчера";
  if (diff < 7) return `${diff} ${plural(diff, ["день", "дня", "дней"])} назад`;
  return formatShortDate(date);
}

export function isoDateOnly(date: Date): string {
  return date.toISOString().slice(0, 10);
}
