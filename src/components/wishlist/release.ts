export type ReleaseState = "released" | "this-month" | "coming-soon" | "overdue";

export const RELEASE_LABEL: Record<ReleaseState, string> = {
  released: "Released",
  "this-month": "Releasing this month",
  "coming-soon": "Coming soon",
  overdue: "Overdue",
};

export function releaseState(target: string, progress: number, now: Date = new Date()): ReleaseState {
  if (progress >= 100) return "released";
  const match = /^(\d{4})-(\d{2})/.exec(target);
  if (!match) return "coming-soon";
  const targetIndex = Number(match[1]) * 12 + Number(match[2]) - 1;
  const nowIndex = now.getFullYear() * 12 + now.getMonth();
  if (targetIndex < nowIndex) return "overdue";
  if (targetIndex === nowIndex) return "this-month";
  return "coming-soon";
}

export const clampPercent = (value: number): number =>
  Math.min(100, Math.max(0, Math.round(Number.isFinite(value) ? value : 0)));
