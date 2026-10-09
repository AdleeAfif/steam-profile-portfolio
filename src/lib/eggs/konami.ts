export const KONAMI_SEQUENCE: readonly string[] = [
  "ArrowUp",
  "ArrowUp",
  "ArrowDown",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "ArrowLeft",
  "ArrowRight",
  "b",
  "a",
];

const normalise = (key: string): string => (key.length === 1 ? key.toLowerCase() : key);

export function pushKey(buffer: readonly string[], key: string): string[] {
  return [...buffer, normalise(key)].slice(-KONAMI_SEQUENCE.length);
}

export const isKonami = (buffer: readonly string[]): boolean =>
  buffer.length === KONAMI_SEQUENCE.length && buffer.every((key, i) => key === KONAMI_SEQUENCE[i]);
