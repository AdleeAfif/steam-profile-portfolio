import type { Status, StatusKind } from "../api/types";

interface StatusStyle {
  label: string;
  colour: string;
}

export const STATUS_STYLES: Record<StatusKind, StatusStyle> = {
  available: { label: "Online", colour: "#57cbde" },
  working: { label: "In-Game", colour: "#90ba3c" },
  sleeping: { label: "Snooze", colour: "#4b8c9b" },
  holiday: { label: "Away", colour: "#898989" },
};

export function statusStyle(kind: StatusKind): StatusStyle {
  return STATUS_STYLES[kind] ?? STATUS_STYLES.available;
}

function formatClock(iso: string, timeZone: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  try {
    return new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", timeZone }).format(date);
  } catch {
    return new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "UTC" }).format(date);
  }
}

function formatDay(iso: string, timeZone: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  try {
    return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", timeZone }).format(date);
  } catch {
    return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", timeZone: "UTC" }).format(date);
  }
}

export function statusExtraLine(status: Status): string {
  switch (status.kind) {
    case "available":
      return "Open to chat";
    case "working": {
      const { title, company } = status.currentRole;
      if (!title) return "Currently playing: Work";
      return company ? `Currently playing: ${title} @ ${company}` : `Currently playing: ${title}`;
    }
    case "sleeping":
      return `Local time ${formatClock(status.localTime, status.timeZone)}`;
    case "holiday":
      return status.overrideUntil ? `On holiday until ${formatDay(status.overrideUntil, status.timeZone)}` : "On holiday";
    default:
      return "";
  }
}
