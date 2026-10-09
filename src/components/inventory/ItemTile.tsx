import { useEffect, useRef, useState } from "react";
import { rarity } from "../../lib/presentation/rarity";
import { iconUrl, initials, type InventoryItem } from "./filter";

interface IconProps {
  item: InventoryItem;
  size: number;
  className?: string;
}

export function ItemIcon({ item, size, className }: IconProps) {
  const ref = useRef<HTMLImageElement>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const img = ref.current;
    if (img && img.complete && img.naturalWidth === 0) setFailed(true);
  }, []);

  if (!item.icon || failed) {
    return (
      <span
        aria-hidden="true"
        className={`grid place-items-center font-bold text-steam-text ${className ?? ""}`}
        style={{ width: size, height: size, fontSize: size / 2.6 }}
      >
        {initials(item.name)}
      </span>
    );
  }

  return (
    <img
      ref={ref}
      src={iconUrl(item.icon, item.iconColor)}
      alt={item.name}
      width={size}
      height={size}
      loading="lazy"
      decoding="async"
      className={className}
      onError={() => setFailed(true)}
    />
  );
}

interface TileProps {
  item: InventoryItem;
  selected: boolean;
  onSelect: (id: string) => void;
}

export function ItemTile({ item, selected, onSelect }: TileProps) {
  const r = rarity(item.tier);
  const label = `${item.name}, ${r.name}`;
  return (
    <button
      type="button"
      id={`inv-item-${item.id}`}
      aria-label={label}
      title={label}
      aria-haspopup="dialog"
      aria-expanded={selected}
      aria-controls={selected ? "inventory-detail" : undefined}
      onClick={() => onSelect(item.id)}
      className={`group relative flex aspect-square w-full cursor-pointer flex-col items-center justify-center gap-1 overflow-hidden bg-gradient-to-b from-[#3a4554] to-[#1c232d] p-2 transition hover:from-[#4a5869] hover:to-[#26303d] ${
        selected ? "outline-2 outline-steam-accent" : "outline outline-black/60"
      }`}
      style={{ borderBottom: `3px solid ${r.colour}` }}
    >
      <ItemIcon item={item} size={44} className="h-11 w-11 object-contain drop-shadow-[0_2px_3px_rgba(0,0,0,0.6)]" />
      <span aria-hidden="true" className="w-full truncate text-center text-[11px] text-steam-muted group-hover:text-steam-text">
        {item.name}
      </span>
    </button>
  );
}
