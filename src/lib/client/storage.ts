export const STORAGE_KEYS = {
  shop: "spp:shop",
  levelUpSeen: "spp:level-up",
  konami: "spp:konami",
  cards: "spp:cards",
  onlineToast: "spp:online-toast",
} as const;

export function readJson<T>(key: string, fallback: T, store: Storage | undefined = globalThis.localStorage): T {
  try {
    const raw = store?.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function writeJson(key: string, value: unknown, store: Storage | undefined = globalThis.localStorage): void {
  try {
    store?.setItem(key, JSON.stringify(value));
  } catch {
    /* storage full or disabled */
  }
}
