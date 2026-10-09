const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function formatDate(value: string | undefined | null): string {
  if (!value) return "";
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (!match) return value;
  const [, y, m, d] = match;
  return `${Number(d)} ${MONTHS[Number(m) - 1] ?? m} ${y}`;
}

export function formatMonth(value: string | undefined | null): string {
  if (!value) return "";
  const match = /^(\d{4})-(\d{2})/.exec(value);
  if (!match) return value;
  const [, y, m] = match;
  return `${MONTHS[Number(m) - 1] ?? m} ${y}`;
}

export function formatDateTime(value: string | undefined | null): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Kuala_Lumpur",
  }).format(date);
}

export function relativeTime(value: string | undefined | null, now: Date = new Date()): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const seconds = Math.round((now.getTime() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days} day${days === 1 ? "" : "s"} ago`;
  return formatDate(date.toISOString().slice(0, 10));
}

export function formatHours(hours: number): string {
  const value = Number.isFinite(hours) ? hours : 0;
  return `${value.toLocaleString("en-US", { maximumFractionDigits: 1 })} hrs`;
}

export function companyPeriod(start: string, end?: string): string {
  return `${formatMonth(start)} - ${end ? formatMonth(end) : "Present"}`;
}
