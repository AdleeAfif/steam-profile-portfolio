const RING_COLOURS = [
  "#9b9b9b",
  "#c02942",
  "#d95b43",
  "#fecc23",
  "#467a3c",
  "#4e8ddb",
  "#7652c9",
  "#c252c9",
  "#542437",
  "#997c52",
] as const;

export function levelRingColour(level: number): string {
  const safe = Number.isFinite(level) && level > 0 ? Math.floor(level) : 0;
  return RING_COLOURS[Math.floor(safe / 10) % 10];
}

export function xpRemaining(xpIntoLevel: number, xpForLevel: number): number {
  return Math.max(0, xpForLevel - xpIntoLevel);
}

export function progressPercent(progress: number): number {
  if (!Number.isFinite(progress)) return 0;
  return Math.round(Math.min(1, Math.max(0, progress)) * 100);
}
