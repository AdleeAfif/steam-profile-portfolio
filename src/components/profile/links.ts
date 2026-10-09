const SAFE_SCHEMES = new Set(["http:", "https:", "mailto:"]);

export function safeHref(value: string | undefined | null): string | undefined {
  if (!value) return undefined;
  try {
    const url = new URL(value);
    return SAFE_SCHEMES.has(url.protocol) ? url.toString() : undefined;
  } catch {
    return undefined;
  }
}

export function simpleIconUrl(icon: string, colour?: string): string {
  const slug = encodeURIComponent(icon);
  return colour ? `https://cdn.simpleicons.org/${slug}/${encodeURIComponent(colour.replace(/^#/, ""))}` : `https://cdn.simpleicons.org/${slug}`;
}

export function countryName(code: string): string {
  try {
    return new Intl.DisplayNames(["en"], { type: "region" }).of(code.toUpperCase()) ?? code.toUpperCase();
  } catch {
    return code.toUpperCase();
  }
}
