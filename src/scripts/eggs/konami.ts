import { STORAGE_KEYS, readJson, writeJson } from "../../lib/client/storage";
import { showToast } from "../../lib/client/toast";
import { isKonami, pushKey } from "../../lib/eggs/konami";

export function konamiListener(): void {
  let buffer: string[] = [];
  const onKey = (event: KeyboardEvent) => {
    buffer = pushKey(buffer, event.key);
    if (!isKonami(buffer)) return;
    buffer = [];
    if (readJson<unknown>(STORAGE_KEYS.konami, null)) return;
    writeJson(STORAGE_KEYS.konami, { unlockedAt: new Date().toISOString() });
    showToast({
      title: "Achievement Unlocked: Konami Code",
      body: "↑ ↑ ↓ ↓ ← → ← → B A",
      icon: "/favicon.svg",
      tone: "success",
      durationMs: 7000,
    });
    document.removeEventListener("keydown", onKey);
  };
  document.addEventListener("keydown", onKey);
}
