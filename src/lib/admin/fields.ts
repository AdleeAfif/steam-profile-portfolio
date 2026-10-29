import type { Collection } from "../api/types";
import { RARITIES } from "../presentation/rarity";

export type FieldType =
  | "text"
  | "textarea"
  | "number"
  | "integer"
  | "date"
  | "month"
  | "url"
  | "email"
  | "select"
  | "boolean"
  | "lines"
  | "csv"
  | "color"
  | "checkboxes"
  | "hours"
  | "json";

export interface FieldOption {
  value: string;
  label: string;
}

export interface Field {
  name: string;
  label: string;
  type: FieldType;
  required?: boolean;
  options?: readonly FieldOption[];
  numeric?: boolean;
  min?: number;
  max?: number;
  maxLength?: number;
  help?: string;
}

export type FormValue = string | string[];
export type FormState = Record<string, FormValue>;
export type FieldErrors = Record<string, string>;

const opts = (...values: string[]): FieldOption[] => values.map((value) => ({ value, label: value }));

const TIERS: FieldOption[] = RARITIES.map((r) => ({ value: String(r.tier), label: `${r.tier} - ${r.name}` }));
const WEEKDAYS: FieldOption[] = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((label, i) => ({
  value: String(i),
  label,
}));

export const ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._-]{0,99}$/;

export const idField = (label = "ID"): Field => ({
  name: "id",
  label,
  type: "text",
  required: true,
  maxLength: 100,
  help: "Letters, digits, '.', '_' or '-', starting with a letter or digit. Cannot be changed later.",
});

export interface CollectionMeta {
  label: string;
  singular: string;
  ordered: boolean;
  titleField: string;
  metaFields: string[];
  idLabel?: string;
  fields: Field[];
}

export const COLLECTION_META: Record<Collection, CollectionMeta> = {
  companies: {
    label: "Companies",
    singular: "company",
    ordered: true,
    titleField: "name",
    metaFields: ["role", "kind"],
    fields: [
      { name: "name", label: "Name", type: "text", required: true },
      { name: "role", label: "Role", type: "text", required: true },
      { name: "kind", label: "Kind", type: "select", required: true, options: opts("work", "personal", "education") },
      { name: "start", label: "Start", type: "month", required: true },
      { name: "end", label: "End", type: "month", help: "Leave empty while current." },
      { name: "url", label: "URL", type: "url" },
      { name: "color", label: "Colour", type: "color", required: true },
    ],
  },
  skills: {
    label: "Skills",
    singular: "skill",
    ordered: true,
    titleField: "name",
    metaFields: ["category", "tier"],
    fields: [
      { name: "name", label: "Name", type: "text", required: true },
      { name: "icon", label: "Icon", type: "text", help: "simpleicons slug, e.g. go" },
      { name: "iconColor", label: "Icon colour", type: "color", help: "Hex without #, e.g. 00ADD8" },
      { name: "tier", label: "Tier", type: "select", required: true, numeric: true, options: TIERS },
      {
        name: "category",
        label: "Category",
        type: "select",
        required: true,
        options: opts("Language", "Framework", "Database", "Messaging", "DevOps", "Cloud", "Tooling"),
      },
      { name: "since", label: "Since (year)", type: "integer", required: true, min: 1990, max: 2100 },
      { name: "companyIds", label: "Company ids", type: "csv", help: "Comma or line separated." },
      { name: "description", label: "Description", type: "textarea", required: true },
    ],
  },
  certificates: {
    label: "Certificates",
    singular: "certificate",
    ordered: true,
    titleField: "name",
    metaFields: ["issuer", "issued"],
    fields: [
      { name: "name", label: "Name", type: "text", required: true },
      { name: "issuer", label: "Issuer", type: "text", required: true },
      { name: "issued", label: "Issued", type: "date", required: true },
      { name: "expires", label: "Expires", type: "date" },
      { name: "xp", label: "XP", type: "integer", required: true, min: 0 },
      { name: "verifyUrl", label: "Verify URL", type: "url" },
      { name: "description", label: "Description", type: "textarea", required: true },
      { name: "skillIds", label: "Skill ids", type: "csv", help: "Comma or line separated." },
      { name: "color", label: "Colour", type: "color", required: true },
      { name: "glyph", label: "Glyph", type: "text", required: true, help: "Short text or emoji shown on the badge." },
    ],
  },
  projects: {
    label: "Projects",
    singular: "project",
    ordered: true,
    titleField: "name",
    metaFields: ["date", "companyId"],
    idLabel: "Slug",
    fields: [
      { name: "name", label: "Name", type: "text", required: true },
      { name: "date", label: "Date", type: "month", required: true },
      { name: "repo", label: "Repository URL", type: "url" },
      { name: "demoUrl", label: "Demo URL", type: "url" },
      { name: "summary", label: "Summary", type: "textarea", required: true },
      { name: "description", label: "Description", type: "lines", help: "One paragraph per line." },
      { name: "tags", label: "Tags", type: "csv", help: "Skill ids, comma or line separated." },
      { name: "hoursPlayed", label: "Hours played", type: "number", required: true, min: 0 },
      { name: "companyId", label: "Company id", type: "text", required: true },
      { name: "color", label: "Colour", type: "color", required: true },
      { name: "screenshots", label: "Screenshot URLs", type: "lines", help: "One URL per line." },
      {
        name: "achievements",
        label: "Achievements",
        type: "json",
        help: 'JSON array of {"name", "description", "unlocked"}.',
      },
      { name: "hidden", label: "Hide from public", type: "boolean", help: "Stays in the admin but is left out of the public site." },
    ],
  },
  achievements: {
    label: "Achievements",
    singular: "achievement",
    ordered: true,
    titleField: "name",
    metaFields: ["unlockedAt", "globalPercent"],
    fields: [
      { name: "name", label: "Name", type: "text", required: true },
      { name: "description", label: "Description", type: "textarea", required: true },
      { name: "unlockedAt", label: "Unlocked at", type: "date", help: "Leave empty while locked." },
      { name: "globalPercent", label: "Global percent", type: "number", required: true, min: 0, max: 100 },
      { name: "glyph", label: "Glyph", type: "text", required: true },
    ],
  },
  friends: {
    label: "Friends",
    singular: "friend",
    ordered: true,
    titleField: "name",
    metaFields: ["kind", "statusText"],
    fields: [
      { name: "name", label: "Name", type: "text", required: true },
      { name: "url", label: "URL", type: "text", required: true, help: "Link, or mailto: for email." },
      { name: "kind", label: "Kind", type: "select", required: true, options: opts("github", "linkedin", "email", "colleague") },
      { name: "statusText", label: "Status text", type: "text", required: true },
    ],
  },
  groups: {
    label: "Groups",
    singular: "group",
    ordered: true,
    titleField: "name",
    metaFields: ["role", "period"],
    fields: [
      { name: "name", label: "Name", type: "text", required: true },
      { name: "role", label: "Role", type: "text", required: true },
      { name: "period", label: "Period", type: "text", required: true },
      { name: "url", label: "URL", type: "url" },
    ],
  },
  reviews: {
    label: "Reviews",
    singular: "review",
    ordered: true,
    titleField: "author",
    metaFields: ["authorRole", "date"],
    fields: [
      { name: "author", label: "Author", type: "text", required: true },
      { name: "authorRole", label: "Author role", type: "text", required: true },
      { name: "text", label: "Text", type: "textarea", required: true },
      { name: "recommended", label: "Recommended", type: "boolean" },
      { name: "date", label: "Date", type: "date", required: true },
      { name: "hidden", label: "Hide from public", type: "boolean", help: "Stays in the admin but is left out of the public site." },
    ],
  },
  workshop: {
    label: "Workshop",
    singular: "workshop item",
    ordered: false,
    titleField: "title",
    metaFields: ["kind", "date"],
    fields: [
      { name: "title", label: "Title", type: "text", required: true },
      { name: "kind", label: "Kind", type: "select", required: true, options: opts("open-source", "blog", "talk") },
      { name: "url", label: "URL", type: "url", required: true },
      { name: "description", label: "Description", type: "textarea", required: true },
      { name: "date", label: "Date", type: "date", required: true },
    ],
  },
  wishlist: {
    label: "Wishlist",
    singular: "wishlist item",
    ordered: false,
    titleField: "name",
    metaFields: ["kind", "target", "progress"],
    fields: [
      { name: "name", label: "Name", type: "text", required: true },
      { name: "kind", label: "Kind", type: "select", required: true, options: opts("skill", "certificate") },
      { name: "target", label: "Target month", type: "month", required: true },
      { name: "progress", label: "Progress (%)", type: "integer", required: true, min: 0, max: 100 },
      { name: "notes", label: "Notes", type: "textarea" },
    ],
  },
  clients: {
    label: "Clients",
    singular: "client",
    ordered: false,
    titleField: "name",
    metaFields: ["features", "active"],
    idLabel: "App id",
    fields: [
      { name: "name", label: "Name", type: "text", required: true, maxLength: 100 },
      {
        name: "allowedOrigins",
        label: "Allowed origins",
        type: "lines",
        help: "Browser origins allowed to write, one per line, e.g. https://example.com",
      },
      { name: "features", label: "Features", type: "checkboxes", options: opts("comments", "messages") },
      { name: "active", label: "Active", type: "boolean" },
    ],
  },
};

export const PROFILE_FIELDS: Field[] = [
  { name: "personaName", label: "Persona name", type: "text", required: true, maxLength: 100 },
  { name: "realName", label: "Real name", type: "text", required: true, maxLength: 100 },
  { name: "headline", label: "Headline", type: "text", maxLength: 200 },
  { name: "location", label: "Location", type: "text", maxLength: 100 },
  { name: "countryCode", label: "Country code", type: "text", maxLength: 2, help: "ISO 3166-1 alpha-2, e.g. MY" },
  { name: "avatarUrl", label: "Avatar URL", type: "url" },
  { name: "summary", label: "Summary", type: "lines", help: "One paragraph per line." },
  { name: "careerStart", label: "Career start", type: "date", required: true },
  { name: "currentRoleTitle", label: "Current role title", type: "text", maxLength: 100 },
  { name: "currentCompanyId", label: "Current company id", type: "text", maxLength: 100 },
  { name: "featuredBadgeId", label: "Featured badge (certificate id)", type: "text", maxLength: 100 },
  { name: "favoriteProjectSlug", label: "Favourite project slug", type: "text", maxLength: 100 },
  { name: "showcaseSkillIds", label: "Showcase skill ids", type: "csv", help: "Comma or line separated." },
  { name: "githubUser", label: "GitHub user", type: "text", maxLength: 100 },
  { name: "email", label: "Email", type: "email" },
  { name: "resumeUrl", label: "Resume URL", type: "url" },
];

export const STATUS_CONFIG_FIELDS: Field[] = [
  { name: "status.timeZone", label: "Time zone", type: "text", required: true, help: "IANA name, e.g. Asia/Kuala_Lumpur" },
  { name: "status.workDays", label: "Work days", type: "checkboxes", numeric: true, options: WEEKDAYS },
  { name: "status.workHours", label: "Work hours", type: "hours", help: "[start, end) in 24h local time; may wrap midnight." },
  { name: "status.sleepHours", label: "Sleep hours", type: "hours", help: "[start, end) in 24h local time; may wrap midnight." },
];

export const isCollection = (value: string | undefined): value is Collection =>
  value !== undefined && Object.hasOwn(COLLECTION_META, value);

function getPath(source: Record<string, unknown>, path: string): unknown {
  let current: unknown = source;
  for (const key of path.split(".")) {
    if (!current || typeof current !== "object") return undefined;
    current = (current as Record<string, unknown>)[key];
  }
  return current;
}

function setPath(target: Record<string, unknown>, path: string, value: unknown): void {
  const keys = path.split(".");
  let current = target;
  for (const key of keys.slice(0, -1)) {
    if (!current[key] || typeof current[key] !== "object") current[key] = {};
    current = current[key] as Record<string, unknown>;
  }
  current[keys[keys.length - 1]] = value;
}

const asList = (value: unknown): unknown[] => (Array.isArray(value) ? value : []);

export function toFormState(fields: Field[], source: Record<string, unknown>): FormState {
  const state: FormState = {};
  for (const field of fields) {
    const value = getPath(source, field.name);
    switch (field.type) {
      case "boolean":
        state[field.name] = value === true ? "on" : "";
        break;
      case "lines":
        state[field.name] = asList(value).map(String).join("\n");
        break;
      case "csv":
        state[field.name] = asList(value).map(String).join(", ");
        break;
      case "checkboxes":
        state[field.name] = asList(value).map(String);
        break;
      case "hours": {
        const [start, end] = asList(value);
        state[field.name] = [start === undefined ? "" : String(start), end === undefined ? "" : String(end)];
        break;
      }
      case "json":
        state[field.name] = JSON.stringify(value ?? [], null, 2);
        break;
      default:
        state[field.name] = value === undefined || value === null ? "" : String(value);
    }
  }
  return state;
}

export function readFormState(fields: Field[], form: FormData): FormState {
  const state: FormState = {};
  for (const field of fields) {
    if (field.type === "checkboxes" || field.type === "hours") {
      state[field.name] = form.getAll(field.name).map(String);
    } else if (field.type === "boolean") {
      state[field.name] = form.get(field.name) ? "on" : "";
    } else {
      state[field.name] = String(form.get(field.name) ?? "");
    }
  }
  return state;
}

const one = (value: FormValue | undefined): string => (Array.isArray(value) ? (value[0] ?? "") : (value ?? ""));
const many = (value: FormValue | undefined): string[] => (Array.isArray(value) ? value : value ? [value] : []);

function parseNumber(field: Field, raw: string): number | string {
  const n = Number(raw);
  if (!Number.isFinite(n)) return "must be a number";
  if ((field.type === "integer" || field.numeric) && !Number.isInteger(n)) return "must be a whole number";
  if (field.min !== undefined && n < field.min) return `must be at least ${field.min}`;
  if (field.max !== undefined && n > field.max) return `must be at most ${field.max}`;
  return n;
}

export function parseFormState(
  fields: Field[],
  state: FormState,
): { body: Record<string, unknown>; errors: FieldErrors } {
  const body: Record<string, unknown> = {};
  const errors: FieldErrors = {};

  for (const field of fields) {
    const value = state[field.name];
    switch (field.type) {
      case "boolean":
        setPath(body, field.name, one(value) === "on");
        break;
      case "lines":
        setPath(
          body,
          field.name,
          one(value)
            .split(/\r?\n/)
            .map((s) => s.trim())
            .filter(Boolean),
        );
        break;
      case "csv":
        setPath(
          body,
          field.name,
          one(value)
            .split(/[,\r\n]/)
            .map((s) => s.trim())
            .filter(Boolean),
        );
        break;
      case "checkboxes": {
        const allowed = new Set(field.options?.map((o) => o.value));
        const picked = many(value).filter((v) => allowed.has(v));
        setPath(body, field.name, field.numeric ? picked.map(Number) : picked);
        break;
      }
      case "hours": {
        const parts = many(value).slice(0, 2);
        const hours = parts.map((p) => Number(p));
        if (parts.length !== 2 || parts.some((p) => p.trim() === "") || hours.some((h) => !Number.isInteger(h) || h < 0 || h > 24)) {
          errors[field.name] = "both hours must be whole numbers from 0 to 24";
        } else {
          setPath(body, field.name, hours);
        }
        break;
      }
      case "json": {
        const raw = one(value).trim();
        if (!raw) {
          setPath(body, field.name, []);
          break;
        }
        try {
          const parsed: unknown = JSON.parse(raw);
          if (Array.isArray(parsed)) setPath(body, field.name, parsed);
          else errors[field.name] = "must be a JSON array";
        } catch {
          errors[field.name] = "must be valid JSON";
        }
        break;
      }
      case "number":
      case "integer": {
        const raw = one(value).trim();
        if (!raw) {
          if (field.required) errors[field.name] = "required";
          break;
        }
        const parsed = parseNumber(field, raw);
        if (typeof parsed === "string") errors[field.name] = parsed;
        else setPath(body, field.name, parsed);
        break;
      }
      default: {
        const raw = field.type === "textarea" ? one(value).replace(/\r\n/g, "\n").trim() : one(value).trim();
        if (field.type === "select" && raw && field.options && !field.options.some((o) => o.value === raw)) {
          errors[field.name] = "must be one of the listed options";
          break;
        }
        if (!raw) {
          if (field.required) setPath(body, field.name, "");
          break;
        }
        if (field.numeric) {
          const parsed = parseNumber(field, raw);
          if (typeof parsed === "string") errors[field.name] = parsed;
          else setPath(body, field.name, parsed);
          break;
        }
        setPath(body, field.name, raw);
      }
    }
  }
  return { body, errors };
}

const matchesField = (key: string, name: string): boolean =>
  key === name || key.startsWith(`${name}[`) || key.startsWith(`${name}.`);

export function fieldError(errors: FieldErrors, name: string): string | undefined {
  const messages = Object.entries(errors)
    .filter(([key]) => matchesField(key, name))
    .map(([key, message]) => (key === name ? message : `${key.slice(name.length)}: ${message}`));
  return messages.length ? messages.join("; ") : undefined;
}

export function unmatchedErrors(errors: FieldErrors, fields: Field[]): [string, string][] {
  return Object.entries(errors).filter(([key]) => !fields.some((f) => matchesField(key, f.name)));
}

export function displayValue(value: unknown): string {
  if (value === undefined || value === null || value === "") return "";
  if (Array.isArray(value)) return value.join(", ");
  if (typeof value === "boolean") return value ? "yes" : "no";
  return String(value);
}
