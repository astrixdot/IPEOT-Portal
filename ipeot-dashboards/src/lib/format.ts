import { TODAY } from "../data/org";

const dateFormat = new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric" });
const shortFormat = new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short" });

export function formatDate(value: string | null | undefined) {
  if (!value) return "—";
  return dateFormat.format(new Date(value));
}

export function formatShort(value: string | null | undefined) {
  if (!value) return "—";
  return shortFormat.format(new Date(value));
}

export function daysFromToday(value: string) {
  return Math.round((new Date(value).getTime() - TODAY.getTime()) / 86400000);
}

export function relativeDays(value: string) {
  const days = daysFromToday(value);
  if (days === 0) return "today";
  if (days > 0) return `in ${days} d`;
  return `${Math.abs(days)} d ago`;
}

export function initials(name: string) {
  return name
    .replace(/^(Dr\.|Col\. \(Retd\.\))\s*/, "")
    .split(/\s+/)
    .filter((part) => /^[A-Z]/.test(part))
    .map((part) => part[0])
    .slice(0, 2)
    .join("");
}

export function cx(...parts: (string | false | null | undefined)[]) {
  return parts.filter(Boolean).join(" ");
}

export function downloadCsv(filename: string, rows: (string | number)[][]) {
  const text = rows.map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(",")).join("\n");
  const blob = new Blob([`\uFEFF${text}`], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
