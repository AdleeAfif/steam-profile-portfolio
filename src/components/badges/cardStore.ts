import { useMemo, useSyncExternalStore } from "react";
import { CARDS_CHANGED_EVENT as LOCAL_EVENT, EMPTY_COLLECTION, type CardCollection } from "../../lib/cards";
import { STORAGE_KEYS, writeJson } from "../../lib/client/storage";

function subscribe(onChange: () => void): () => void {
  const onStorage = (event: StorageEvent) => {
    if (event.key === null || event.key === STORAGE_KEYS.cards) onChange();
  };
  window.addEventListener("storage", onStorage);
  window.addEventListener(LOCAL_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(LOCAL_EVENT, onChange);
  };
}

function rawSnapshot(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEYS.cards);
  } catch {
    return null;
  }
}

export function useCardCollection(): CardCollection {
  const raw = useSyncExternalStore(subscribe, rawSnapshot, () => null);
  return useMemo(() => {
    if (!raw) return EMPTY_COLLECTION;
    try {
      const parsed = JSON.parse(raw) as CardCollection | null;
      return parsed && Array.isArray(parsed.cards) ? parsed : EMPTY_COLLECTION;
    } catch {
      return EMPTY_COLLECTION;
    }
  }, [raw]);
}

export function saveCardCollection(collection: CardCollection): void {
  writeJson(STORAGE_KEYS.cards, collection);
  window.dispatchEvent(new Event(LOCAL_EVENT));
}
