import { PROFILE_API_APP } from "astro:env/server";
import type { AdminApi } from "../api/admin";
import type { ApiResult } from "../api/types";

const APP_RE = /^[A-Za-z0-9][A-Za-z0-9._-]{0,99}$/;

export interface AppScope {
  app: string;
  apps: string[];
  clients: ApiResult<unknown>;
}

export async function resolveApp(api: AdminApi, requested: string | null): Promise<AppScope> {
  const clients = await api.list("clients");
  const apps = clients.ok ? clients.data.items.map((c) => String(c.id)) : [];
  if (!apps.includes(PROFILE_API_APP)) apps.unshift(PROFILE_API_APP);
  const app = requested && APP_RE.test(requested) && apps.includes(requested) ? requested : PROFILE_API_APP;
  return { app, apps, clients };
}

export function withParams(url: URL, changes: Record<string, string | null>): string {
  const params = new URLSearchParams(url.search);
  for (const [key, value] of Object.entries(changes)) {
    if (value === null) params.delete(key);
    else params.set(key, value);
  }
  const query = params.toString();
  return query ? `${url.pathname}?${query}` : url.pathname;
}
