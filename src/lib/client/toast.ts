export interface ToastOptions {
  title: string;
  body?: string;
  icon?: string;
  tone?: "info" | "success" | "error";
  durationMs?: number;
}

const TONE_BORDER: Record<NonNullable<ToastOptions["tone"]>, string> = {
  info: "#66c0f4",
  success: "#90ba3c",
  error: "#c02942",
};

export function showToast({ title, body, icon, tone = "info", durationMs = 5000 }: ToastOptions): void {
  if (typeof document === "undefined") return;
  const root = document.getElementById("toast-root");
  if (!root) return;

  const toast = document.createElement("div");
  toast.className =
    "toast pointer-events-auto flex w-72 items-center gap-3 rounded-sm bg-gradient-to-b from-[#2a3f5a] to-[#1b2838] p-3 shadow-lg shadow-black/60";
  toast.style.borderLeft = `3px solid ${TONE_BORDER[tone]}`;
  toast.setAttribute("role", tone === "error" ? "alert" : "status");

  if (icon) {
    const img = document.createElement("img");
    img.src = icon;
    img.alt = "";
    img.width = 40;
    img.height = 40;
    img.className = "h-10 w-10 shrink-0 rounded-sm";
    toast.append(img);
  }

  const text = document.createElement("div");
  text.className = "min-w-0";
  const heading = document.createElement("p");
  heading.className = "text-sm font-semibold text-white";
  heading.textContent = title;
  text.append(heading);
  if (body) {
    const p = document.createElement("p");
    p.className = "text-xs text-steam-muted";
    p.textContent = body;
    text.append(p);
  }
  toast.append(text);

  root.append(toast);
  window.setTimeout(() => toast.remove(), durationMs);
}
