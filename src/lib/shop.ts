export interface ShopBackground {
  id: string;
  name: string;
  css: string;
}

export interface ShopFrame {
  id: string;
  name: string;
  css: string;
}

export interface ShopSelection {
  background: string;
  frame: string;
}

export const BACKGROUNDS: readonly ShopBackground[] = [
  {
    id: "default",
    name: "Steam Blue",
    css: "radial-gradient(ellipse at top, #2a475e 0%, #1b2838 55%, #171a21 100%)",
  },
  { id: "midnight", name: "Midnight Server Room", css: "linear-gradient(160deg, #0f2027 0%, #203a43 50%, #2c5364 100%)" },
  { id: "sunset", name: "Kuala Lumpur Sunset", css: "linear-gradient(180deg, #3a1c71 0%, #d76d77 60%, #ffaf7b 100%)" },
  {
    id: "matrix",
    name: "Terminal Rain",
    css: "repeating-linear-gradient(90deg, rgb(0 255 70 / 0.05) 0 2px, transparent 2px 14px), linear-gradient(#020b05, #04210f)",
  },
  { id: "aurora", name: "Aurora Deploy", css: "linear-gradient(135deg, #1d2b64 0%, #1e7a6e 50%, #f8cdda 100%)" },
  {
    id: "grid",
    name: "Kubernetes Grid",
    css: "linear-gradient(rgb(102 192 244 / 0.08) 1px, transparent 1px) 0 0 / 32px 32px, linear-gradient(90deg, rgb(102 192 244 / 0.08) 1px, transparent 1px) 0 0 / 32px 32px, #121a24",
  },
];

export const FRAMES: readonly ShopFrame[] = [
  { id: "none", name: "No Frame", css: "none" },
  { id: "gold", name: "Gilded", css: "0 0 0 3px #d4af37, 0 0 12px 2px rgb(212 175 55 / 0.6)" },
  { id: "neon", name: "Neon Pulse", css: "0 0 0 3px #57cbde, 0 0 16px 4px rgb(87 203 222 / 0.7)" },
  { id: "covert", name: "Covert", css: "0 0 0 3px #eb4b4b, 0 0 14px 3px rgb(235 75 75 / 0.6)" },
  { id: "ingame", name: "In-Game Green", css: "0 0 0 3px #90ba3c, 0 0 14px 3px rgb(144 186 60 / 0.6)" },
];

export const DEFAULT_SELECTION: ShopSelection = { background: "default", frame: "none" };

export const backgroundCss = (id: string): string =>
  (BACKGROUNDS.find((b) => b.id === id) ?? BACKGROUNDS[0]).css;

export const frameCss = (id: string): string => (FRAMES.find((f) => f.id === id) ?? FRAMES[0]).css;
