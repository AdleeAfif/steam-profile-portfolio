import { formatDate } from "../../lib/format";
import { useCardCollection } from "../badges/cardStore";

export default function CardCollectorBadge() {
  const { craftedAt } = useCardCollection();
  if (!craftedAt) return null;

  return (
    <div className="flex h-full items-center gap-4 rounded-sm bg-black/20 p-3">
      <span
        aria-hidden="true"
        className="grid h-20 w-20 shrink-0 place-items-center rounded-full border-2 border-[#fecc23] text-3xl shadow-lg shadow-black/50"
        style={{ background: "radial-gradient(circle at 35% 30%, #fecc2366, #0e141b 75%)" }}
      >
        🃏
      </span>
      <span className="min-w-0">
        <span className="block truncate text-base text-white">Card Collector</span>
        <span className="block truncate text-xs text-steam-muted">Bonus badge - crafted from trading cards</span>
        <span className="block text-xs text-steam-muted">Crafted {formatDate(craftedAt)}</span>
        <span className="mt-1 block text-xs font-semibold text-steam-accent">100 XP</span>
      </span>
    </div>
  );
}
