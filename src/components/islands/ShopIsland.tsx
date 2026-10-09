import { useEffect, useState } from "react";
import { STORAGE_KEYS, readJson, writeJson } from "../../lib/client/storage";
import { showToast } from "../../lib/client/toast";
import {
  BACKGROUNDS,
  DEFAULT_SELECTION,
  FRAMES,
  backgroundCss,
  frameCss,
  type ShopSelection,
} from "../../lib/shop";

interface Props {
  avatarUrl?: string;
  personaName: string;
}

type Slot = keyof ShopSelection;

function loadSelection(): ShopSelection {
  const saved = readJson<Partial<ShopSelection> | null>(STORAGE_KEYS.shop, null);
  const background = BACKGROUNDS.find((b) => b.id === saved?.background)?.id ?? DEFAULT_SELECTION.background;
  const frame = FRAMES.find((f) => f.id === saved?.frame)?.id ?? DEFAULT_SELECTION.frame;
  return { background, frame };
}

function apply(selection: ShopSelection): void {
  const root = document.documentElement.style;
  root.setProperty("--profile-bg", backgroundCss(selection.background));
  root.setProperty("--avatar-frame", frameCss(selection.frame));
}

function Avatar({ src, name, frame, size }: { src?: string; name: string; frame: string; size: number }) {
  const style = { boxShadow: frame, width: size, height: size };
  return src ? (
    <img src={src} alt={`${name}'s avatar`} width={size} height={size} className="rounded-sm" style={style} />
  ) : (
    <span
      role="img"
      aria-label={`${name}'s avatar`}
      className="grid place-items-center rounded-sm bg-[#2a475e] text-2xl font-black text-white"
      style={style}
    >
      {name.slice(0, 1).toUpperCase()}
    </span>
  );
}

function EquipButton({ equipped, name, onEquip }: { equipped: boolean; name: string; onEquip: () => void }) {
  return (
    <button
      type="button"
      className={`btn-steam w-full ${equipped ? "btn-blue" : "btn-green"}`}
      aria-pressed={equipped}
      aria-label={equipped ? `${name} (equipped)` : `Equip ${name}`}
      onClick={onEquip}
    >
      {equipped ? "✓ Equipped" : "Equip"}
    </button>
  );
}

export default function ShopIsland({ avatarUrl, personaName }: Props) {
  const [selection, setSelection] = useState<ShopSelection>(DEFAULT_SELECTION);

  useEffect(() => {
    setSelection(loadSelection());
  }, []);

  const equip = (slot: Slot, id: string, name: string) => {
    const next = { ...selection, [slot]: id };
    setSelection(next);
    writeJson(STORAGE_KEYS.shop, next);
    apply(next);
    showToast({
      title: `${name} equipped`,
      body: slot === "background" ? "Your profile background has been updated." : "Your avatar frame has been updated.",
      tone: "success",
      durationMs: 3000,
    });
  };

  const reset = () => {
    setSelection(DEFAULT_SELECTION);
    writeJson(STORAGE_KEYS.shop, DEFAULT_SELECTION);
    apply(DEFAULT_SELECTION);
    showToast({ title: "Profile items reset", body: "Default background and no frame.", durationMs: 3000 });
  };

  const currentBackground = BACKGROUNDS.find((b) => b.id === selection.background) ?? BACKGROUNDS[0];
  const currentFrame = FRAMES.find((f) => f.id === selection.frame) ?? FRAMES[0];

  return (
    <div className="space-y-6">
      <section aria-labelledby="shop-preview" className="flex flex-wrap items-center gap-6 bg-black/30 p-4">
        <div
          className="grid h-32 w-56 shrink-0 place-items-center rounded-sm border border-black/50"
          style={{ background: currentBackground.css }}
        >
          <Avatar src={avatarUrl} name={personaName} frame={currentFrame.css} size={72} />
        </div>
        <div className="min-w-0 flex-1 space-y-1 text-sm">
          <h2 id="shop-preview" className="steam-panel-title mb-1">
            Currently equipped
          </h2>
          <p>
            <span className="text-steam-muted">Profile background: </span>
            <span className="text-white">{currentBackground.name}</span>
          </p>
          <p>
            <span className="text-steam-muted">Avatar frame: </span>
            <span className="text-white">{currentFrame.name}</span>
          </p>
          <button type="button" className="btn-steam btn-blue mt-2" onClick={reset}>
            Reset to default
          </button>
        </div>
      </section>

      <section aria-labelledby="shop-backgrounds">
        <h2 id="shop-backgrounds" className="steam-panel-title">
          Profile Backgrounds
        </h2>
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
          {BACKGROUNDS.map((bg) => {
            const equipped = bg.id === selection.background;
            return (
              <li
                key={bg.id}
                className={`flex flex-col gap-2 bg-black/30 p-2 ${equipped ? "outline outline-2 outline-steam-accent" : ""}`}
              >
                <div
                  role="img"
                  aria-label={`${bg.name} background preview`}
                  className="h-28 rounded-sm border border-black/50"
                  style={{ background: bg.css }}
                />
                <div className="flex items-baseline justify-between gap-2">
                  <p className="truncate text-sm text-white">{bg.name}</p>
                  <p className="shrink-0 text-xs text-steam-green">Free</p>
                </div>
                {equipped && <p className="text-xs text-steam-accent">Currently equipped</p>}
                <EquipButton equipped={equipped} name={bg.name} onEquip={() => equip("background", bg.id, bg.name)} />
              </li>
            );
          })}
        </ul>
      </section>

      <section aria-labelledby="shop-frames">
        <h2 id="shop-frames" className="steam-panel-title">
          Avatar Frames
        </h2>
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
          {FRAMES.map((frame) => {
            const equipped = frame.id === selection.frame;
            return (
              <li
                key={frame.id}
                className={`flex flex-col items-center gap-2 bg-black/30 p-3 ${equipped ? "outline outline-2 outline-steam-accent" : ""}`}
              >
                <div className="grid h-24 place-items-center">
                  <Avatar src={avatarUrl} name={personaName} frame={frame.css} size={64} />
                </div>
                <p className="text-center text-sm text-white">{frame.name}</p>
                <p className="text-xs text-steam-green">Free</p>
                {equipped && <p className="text-xs text-steam-accent">Currently equipped</p>}
                <EquipButton equipped={equipped} name={frame.name} onEquip={() => equip("frame", frame.id, frame.name)} />
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
