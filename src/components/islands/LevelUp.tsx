import { useEffect, useState } from "react";
import { STORAGE_KEYS, readJson, writeJson } from "../../lib/client/storage";

interface Props {
  level: number;
  colour: string;
}

const VISIBLE_MS = 4000;

const KEYFRAMES = `
@keyframes level-up-pop {
  0% { transform: scale(0.4); opacity: 0; }
  20% { transform: scale(1.15); opacity: 1; }
  35% { transform: scale(1); }
  85% { opacity: 1; }
  100% { opacity: 0; }
}
@keyframes level-up-glow {
  0%, 100% { text-shadow: 0 0 8px currentColor; }
  50% { text-shadow: 0 0 24px currentColor, 0 0 48px currentColor; }
}
.level-up-card { animation: level-up-pop ${VISIBLE_MS}ms ease-out forwards; }
.level-up-title { animation: level-up-glow 1.2s ease-in-out infinite; }
@media (prefers-reduced-motion: reduce) {
  .level-up-card, .level-up-title { animation: none !important; }
}
`;

export default function LevelUp({ level, colour }: Props) {
  const [visible, setVisible] = useState(false);
  const key = `${STORAGE_KEYS.levelUpSeen}:${level}`;

  useEffect(() => {
    if (readJson<boolean>(key, false)) return;
    writeJson(key, true);
    setVisible(true);
    const timer = window.setTimeout(() => setVisible(false), VISIBLE_MS);
    return () => window.clearTimeout(timer);
  }, [key]);

  useEffect(() => {
    if (!visible) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setVisible(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [visible]);

  if (!visible) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-50 grid place-items-center bg-black/50" role="status" aria-live="polite">
      <style>{KEYFRAMES}</style>
      <div className="level-up-card pointer-events-auto relative bg-gradient-to-b from-[#2a3f5a] to-[#171a21] px-10 py-8 text-center shadow-2xl shadow-black">
        <p className="level-up-title text-4xl font-black tracking-[0.3em] text-white" style={{ color: colour }}>
          LEVEL UP
        </p>
        <p className="mt-3 text-steam-text">
          Another year of experience. Now Level <span className="font-semibold text-white">{level}</span>.
        </p>
        <button
          type="button"
          onClick={() => setVisible(false)}
          className="absolute top-1 right-2 text-steam-muted hover:text-white"
          aria-label="Dismiss level up"
        >
          ×
        </button>
      </div>
    </div>
  );
}
