export function pickYear(param: string | null, years: readonly number[]): number | null {
  const newest = years.length > 0 ? Math.max(...years) : null;
  if (!param || !/^\d{4}$/.test(param)) return newest;
  const year = Number(param);
  return years.includes(year) ? year : newest;
}
