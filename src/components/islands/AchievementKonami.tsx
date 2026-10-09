import { useEffect, useMemo, useSyncExternalStore } from "react";
import { STORAGE_KEYS, writeJson } from "../../lib/client/storage";
import { showToast } from "../../lib/client/toast";
import { formatDate } from "../../lib/format";

const SEQUENCE = [
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
const LOCAL_EVENT = "spp:konami-changed";

interface KonamiFlag {
  unlockedAt: string;
}

function subscribe(onChange: () => void): () => void {
  const onStorage = (event: StorageEvent) => {
    if (event.key === null || event.key === STORAGE_KEYS.konami) onChange();
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
    return localStorage.getItem(STORAGE_KEYS.konami);
  } catch {
    return null;
  }
}

function parseFlag(raw: string | null): KonamiFlag | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<KonamiFlag> | null;
    return { unlockedAt: typeof parsed?.unlockedAt === "string" ? parsed.unlockedAt : "" };
  } catch {
    return null;
  }
}

export default function AchievementKonami() {
  const raw = useSyncExternalStore(subscribe, rawSnapshot, () => null);
  const flag = useMemo(() => parseFlag(raw), [raw]);

  useEffect(() => {
    let position = 0;
    const onKey = (event: KeyboardEvent) => {
      const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
      if (key === SEQUENCE[position]) {
        position += 1;
      } else {
        position = key === SEQUENCE[0] ? 1 : 0;
      }
      if (position < SEQUENCE.length) return;
      position = 0;
      if (!parseFlag(rawSnapshot())) {
        writeJson(STORAGE_KEYS.konami, { unlockedAt: new Date().toISOString() } satisfies KonamiFlag);
        showToast({ title: "Achievement Unlocked", body: "Old School - entered the Konami code", tone: "success" });
      }
      window.dispatchEvent(new Event(LOCAL_EVENT));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  if (!flag) {
    return (
      <div className="flex items-center gap-4 rounded-sm bg-black/20 p-3 opacity-60">
        <span aria-hidden="true" className="grid h-16 w-16 shrink-0 place-items-center rounded-sm bg-[#2a2f36] text-3xl text-steam-muted">
          ?
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-steam-muted">Hidden achievement</span>
          <span className="block text-sm text-steam-muted">Details revealed once unlocked</span>
        </span>
        <span className="shrink-0 text-xs text-steam-muted">Locked</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4 rounded-sm bg-black/20 p-3">
      <span aria-hidden="true" className="grid h-16 w-16 shrink-0 place-items-center rounded-sm bg-gradient-to-br from-[#2a6c9e] to-[#0e141b] text-3xl">
        🎮
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-white">Old School</span>
        <span className="block text-sm text-steam-muted">Entered the Konami code. Up, up, down, down...</span>
        <span className="mt-1 block text-xs text-steam-muted">Hidden achievement</span>
      </span>
      <span className="shrink-0 text-right text-xs text-steam-text">
        Unlocked
        {flag.unlockedAt && <span className="block text-steam-muted">{formatDate(flag.unlockedAt)}</span>}
      </span>
    </div>
  );
}
