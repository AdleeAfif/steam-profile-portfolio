import { TRADING_CARDS, isComplete } from "../../lib/cards";
import { showToast } from "../../lib/client/toast";
import { saveCardCollection, useCardCollection } from "../badges/cardStore";

export default function CardCollection() {
  const collection = useCardCollection();
  const owned = new Set(collection.cards);
  const count = TRADING_CARDS.filter((card) => owned.has(card.id)).length;
  const complete = isComplete(collection);

  const craft = () => {
    saveCardCollection({ ...collection, craftedAt: new Date().toISOString() });
    showToast({
      title: "Badge Crafted",
      body: "You crafted the Card Collector badge. +100 XP",
      tone: "success",
    });
  };

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-steam-text">
          <span className="font-semibold text-white">{count}</span> of {TRADING_CARDS.length} collected
        </p>
        {complete && !collection.craftedAt && (
          <button type="button" className="btn-steam btn-green" onClick={craft}>
            Craft Badge
          </button>
        )}
        {collection.craftedAt && <p className="text-xs text-steam-ingame">Badge crafted</p>}
      </div>
      <div className="steam-progress mb-4" role="progressbar" aria-label="Trading cards collected" aria-valuemin={0} aria-valuemax={TRADING_CARDS.length} aria-valuenow={count}>
        <span style={{ width: `${(count / TRADING_CARDS.length) * 100}%` }} />
      </div>
      <ul className="grid grid-cols-3 gap-3 sm:grid-cols-6">
        {TRADING_CARDS.map((card) =>
          owned.has(card.id) ? (
            <li
              key={card.id}
              className="flex aspect-[5/7] flex-col overflow-hidden rounded-sm border-2 bg-[#0e141b] shadow-md shadow-black/60"
              style={{ borderColor: card.colour }}
            >
              <div
                aria-hidden="true"
                className="grid flex-1 place-items-center text-3xl"
                style={{ background: `linear-gradient(160deg, ${card.colour}88, #0e141b)` }}
              >
                {card.glyph}
              </div>
              <div className="p-1.5">
                <p className="truncate text-xs font-semibold text-white">{card.name}</p>
                <p className="line-clamp-2 text-[10px] leading-tight text-steam-muted">{card.caption}</p>
              </div>
            </li>
          ) : (
            <li
              key={card.id}
              className="grid aspect-[5/7] place-items-center rounded-sm border-2 border-[#3a4552] bg-[repeating-linear-gradient(45deg,#1e2833_0_6px,#18212b_6px_12px)] opacity-60 grayscale"
            >
              <span className="text-center text-xs text-steam-muted">
                <span aria-hidden="true" className="block text-2xl">
                  ?
                </span>
                Not collected
              </span>
            </li>
          ),
        )}
      </ul>
      <p className="mt-3 text-xs text-steam-muted">Cards drop randomly while you browse this profile.</p>
    </div>
  );
}
