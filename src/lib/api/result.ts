import { AsyncLocalStorage } from "node:async_hooks";
import type { ApiError, ApiResult } from "./types";

const TIMEOUT_MS = 5000;

const requestHealth = new AsyncLocalStorage<{ degraded: boolean }>();

export function trackApiHealth<T>(fn: () => Promise<T>): Promise<{ value: T; degraded: boolean }> {
  const state = { degraded: false };
  return requestHealth.run(state, async () => ({ value: await fn(), degraded: state.degraded }));
}

function markDegraded(status: number): void {
  if (status === 0 || status >= 500) {
    const state = requestHealth.getStore();
    if (state) state.degraded = true;
  }
}

export const timedFetch = (input: Request): Promise<Response> =>
  fetch(input, { signal: AbortSignal.timeout(TIMEOUT_MS) });

interface FetchOutcome<T> {
  data?: T;
  error?: unknown;
  response: Response;
}

function asApiError(body: unknown): ApiError | null {
  if (body && typeof body === "object" && "error" in body) {
    const err = (body as { error: unknown }).error;
    if (err && typeof err === "object" && "code" in err && "message" in err) return err as ApiError;
  }
  return null;
}

export async function settle<T>(request: Promise<FetchOutcome<T>>): Promise<ApiResult<T>> {
  try {
    const { data, error, response } = await request;
    if (response.ok) return { ok: true, data: data as T, status: response.status };
    markDegraded(response.status);
    return { ok: false, status: response.status, error: asApiError(error) };
  } catch (err) {
    markDegraded(0);
    console.error(JSON.stringify({ level: "error", msg: "profile-api request failed", err: String(err) }));
    return { ok: false, status: 0, error: null };
  }
}

export const isNotFound = (r: ApiResult<unknown>): boolean => !r.ok && r.status === 404;
