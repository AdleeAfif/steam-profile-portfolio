const LOCAL_RE = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/;

function offsetMs(instant: number, timeZone: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(new Date(instant));
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? 0);
  const asUtc = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"), get("second"));
  return asUtc - Math.floor(instant / 1000) * 1000;
}

export function isTimeZone(timeZone: string): boolean {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone });
    return true;
  } catch {
    return false;
  }
}

/** Interprets a `datetime-local` value as wall-clock time in `timeZone` and returns RFC 3339 UTC. */
export function zonedLocalToUtc(local: string, timeZone: string): string | null {
  const m = LOCAL_RE.exec(local.trim());
  if (!m) return null;
  const [, y, mo, d, h, mi, s] = m;
  const wall = Date.UTC(Number(y), Number(mo) - 1, Number(d), Number(h), Number(mi), Number(s ?? 0));
  if (Number.isNaN(wall)) return null;
  const zone = isTimeZone(timeZone) ? timeZone : "UTC";
  let instant = wall - offsetMs(wall, zone);
  instant = wall - offsetMs(instant, zone);
  return new Date(instant).toISOString().replace(/\.\d{3}Z$/, "Z");
}

/** Formats an RFC 3339 instant as a `datetime-local` value in `timeZone`. */
export function utcToZonedLocal(iso: string, timeZone: string): string {
  const instant = new Date(iso).getTime();
  if (Number.isNaN(instant)) return "";
  const zone = isTimeZone(timeZone) ? timeZone : "UTC";
  return new Date(instant + offsetMs(instant, zone)).toISOString().slice(0, 16);
}

export function formatDateTime(iso: string, timeZone: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: isTimeZone(timeZone) ? timeZone : "UTC",
  }).format(date);
}
