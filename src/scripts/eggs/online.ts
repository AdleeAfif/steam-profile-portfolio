import { STORAGE_KEYS, readJson, writeJson } from "../../lib/client/storage";
import { showToast } from "../../lib/client/toast";

export function onlineToast(): void {
  const store = globalThis.sessionStorage;
  if (readJson(STORAGE_KEYS.onlineToast, false, store)) return;
  writeJson(STORAGE_KEYS.onlineToast, true, store);
  window.setTimeout(() => {
    showToast({ title: "adlee is now Online", body: "Open to chat", icon: "/favicon.svg" });
  }, 1500);
}
