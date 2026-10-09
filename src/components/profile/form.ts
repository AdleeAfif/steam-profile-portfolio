export type FieldErrors = Record<string, string>;

export type SubmitResult<T> =
  | { ok: true; data: T }
  | { ok: false; status: number; message: string; details: FieldErrors };

export const LIMITS = { name: 50, email: 254, message: 2000 } as const;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const charCount = (value: string): number => [...value].length;

export function validateLength(label: string, value: string, max: number): string | undefined {
  const count = charCount(value.trim());
  if (count === 0) return `${label} is required.`;
  if (count > max) return `${label} must be at most ${max} characters.`;
  return undefined;
}

export function validateEmail(value: string): string | undefined {
  const trimmed = value.trim();
  if (!trimmed) return "Email is required.";
  if (trimmed.length > LIMITS.email || !EMAIL_RE.test(trimmed)) return "Enter a valid email address.";
  return undefined;
}

export function compactErrors(errors: Record<string, string | undefined>): FieldErrors {
  const out: FieldErrors = {};
  for (const [key, value] of Object.entries(errors)) if (value) out[key] = value;
  return out;
}

export function labelDetails(details: FieldErrors, labels: Record<string, string>): FieldErrors {
  const out: FieldErrors = {};
  for (const [key, message] of Object.entries(details)) {
    const label = labels[key];
    out[key] = label && /^[a-z]/.test(message) ? `${label} ${message}.` : message;
  }
  return out;
}

interface ErrorBody {
  error?: { message?: string; details?: FieldErrors };
}

export async function postJson<T>(url: string, body: unknown): Promise<SubmitResult<T>> {
  let response: Response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    return { ok: false, status: 0, message: "Could not reach the server. Check your connection and try again.", details: {} };
  }
  const parsed = (await response.json().catch(() => null)) as (T & ErrorBody) | null;
  if (response.ok) return { ok: true, data: parsed as T };
  return {
    ok: false,
    status: response.status,
    message: parsed?.error?.message ?? "Something went wrong. Please try again later.",
    details: parsed?.error?.details ?? {},
  };
}
